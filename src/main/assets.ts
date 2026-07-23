// ============================================================
// Danh Script — Xử lý ảnh tư liệu cho @tag (Màn Nhân vật)
// Chọn ảnh qua dialog → COPY vào userData/refs/<projectId>/ → lưu path vào asset.
// Trả thumbnail dạng data URL để renderer hiển thị (không đọc file trực tiếp từ web).
// ============================================================
import { app, dialog, BrowserWindow } from 'electron'
import { copyFileSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs'
import { join, extname, basename } from 'path'
import {
  listAssets,
  createAssetTag,
  setAssetRefImage,
  clearAssetRefImage,
  deleteAssetTag
} from './db'
import type { AssetTag, AssetRole } from '../shared/types'

/** Chuẩn hóa type asset (DB cũ có thể chứa giá trị lạ) về 1 role hợp lệ. */
function toRole(type: string | null | undefined): AssetRole {
  return type === 'product' || type === 'prop' || type === 'scene' ? type : 'char'
}

/** Câu khóa nhất quán theo loại asset (bối cảnh khóa nơi chốn, còn lại khóa nhận dạng). */
function lockNoteFor(tag: string, role: AssetRole): string {
  return role === 'scene'
    ? `@${tag} is the same location; keep environment, architecture and layout identical to its reference across every shot here`
    : `@${tag} comes from the reference and stays identical across the whole take`
}

/** Thư mục chứa ảnh tư liệu đã copy của 1 dự án. */
function refsDir(projectId: number): string {
  const dir = join(app.getPath('userData'), 'refs', String(projectId))
  mkdirSync(dir, { recursive: true })
  return dir
}

const IMG_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp'])
const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.bmp': 'image/bmp'
}

/** Danh sách @tag của dự án (kèm ảnh đã gắn), lấy từ assets. */
export function listAssetTags(projectId: number): AssetTag[] {
  const out: AssetTag[] = []
  for (const row of listAssets(projectId)) {
    if (row.project_id !== projectId) continue // bỏ asset global
    let tag = ''
    try {
      tag = JSON.parse(row.variations_json ?? '{}').tag ?? ''
    } catch {
      /* bỏ qua */
    }
    if (!tag) continue
    const role = toRole(row.type)
    out.push({
      tag,
      asset_id: row.id,
      role,
      ref_image_path: row.ref_image_path,
      lock_note: lockNoteFor(tag, role)
    })
  }
  return out
}

/** Tạo 1 @tag mới (chưa ảnh). Chuẩn hóa tag: HOA, bỏ khoảng trắng/@. */
export function createTag(
  projectId: number,
  rawTag: string,
  type: AssetRole,
  name: string
): AssetTag[] {
  const tag = normalizeTag(rawTag)
  if (!tag) throw new Error('Tên @tag trống')
  createAssetTag(projectId, tag, type, name)
  return listAssetTags(projectId)
}

function normalizeTag(raw: string): string {
  return raw
    .replace(/^@+/, '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
    .replace(/[^A-Z0-9_]/g, '')
}

/**
 * Mở dialog chọn ảnh, copy vào refs/<projectId>/<TAG><ext>, lưu path vào asset.
 * Trả danh sách tag mới. Nếu người dùng hủy dialog → trả list hiện tại (không đổi).
 */
export async function attachImage(projectId: number, tag: string): Promise<AssetTag[]> {
  const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
  const picked = await dialog.showOpenDialog(win!, {
    title: `Chọn ảnh tư liệu cho @${tag}`,
    properties: ['openFile'],
    filters: [{ name: 'Ảnh', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'] }]
  })
  if (picked.canceled || picked.filePaths.length === 0) return listAssetTags(projectId)

  const src = picked.filePaths[0]
  const ext = extname(src).toLowerCase()
  if (!IMG_EXT.has(ext)) throw new Error(`Định dạng ảnh không hỗ trợ: ${ext}`)

  const dest = join(refsDir(projectId), `${tag}${ext}`)
  copyFileSync(src, dest)
  setAssetRefImage(projectId, tag, dest)
  return listAssetTags(projectId)
}

/** Gỡ ảnh khỏi @tag. */
export function clearImage(projectId: number, tag: string): AssetTag[] {
  clearAssetRefImage(projectId, tag)
  return listAssetTags(projectId)
}

/** Xóa @tag. */
export function deleteTag(projectId: number, tag: string): AssetTag[] {
  deleteAssetTag(projectId, tag)
  return listAssetTags(projectId)
}

/** Đọc file ảnh → data URL để renderer hiển thị thumbnail an toàn. */
export function readThumb(path: string | null): string | null {
  if (!path || !existsSync(path)) return null
  try {
    const ext = extname(path).toLowerCase()
    const mime = MIME[ext] ?? 'image/png'
    const b64 = readFileSync(path).toString('base64')
    return `data:${mime};base64,${b64}`
  } catch {
    return null
  }
}

/** Tên file gốc (hiển thị phụ). */
export function refBasename(path: string | null): string | null {
  return path ? basename(path) : null
}

/** Lưu 1 file text (bundle .md) qua dialog Save. Trả path đã lưu, null nếu hủy. */
export async function saveTextFile(
  defaultName: string,
  content: string
): Promise<string | null> {
  const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
  const res = await dialog.showSaveDialog(win!, {
    title: 'Xuất bundle prompt',
    defaultPath: defaultName,
    filters: [
      { name: 'Markdown', extensions: ['md'] },
      { name: 'Text', extensions: ['txt'] }
    ]
  })
  if (res.canceled || !res.filePath) return null
  writeFileSync(res.filePath, content, 'utf-8')
  return res.filePath
}
