// ============================================================
// Danh Script — Khởi tạo & truy vấn SQLite (better-sqlite3)
// ============================================================
import Database from 'better-sqlite3'
import { app } from 'electron'
import { readFileSync, copyFileSync } from 'fs'
import { join } from 'path'
import { hasLock, checkPromptDrift, type DriftIssue } from '../../shared/anchor'
import type {
  CreateProjectInput,
  Project,
  Scene,
  Block,
  Asset,
  SceneContext,
  IdentityLock,
  AssetTag,
  AssetRole,
  Ideal,
  IdealBrief,
  StorySkeleton,
  AdaptationStrategy,
  PlanArtifacts,
  DirectorPlan,
  DirectorBible,
  VisualSystem,
  AssetFull,
  AssetDerivative,
  AssetCoverage,
  DeriveKind,
  BlockView,
  VideoPrompt,
  ShotPanel
} from '../../shared/types'
import { stageRank } from '../../shared/wizardSteps'

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

let db: Database.Database | null = null
let dbFilePath = '' // nhớ đường dẫn file DB để backup dùng lại

/** Mở DB trong thư mục userData + nạp schema (idempotent). */
export function initDb(): Database.Database {
  if (db) return db

  const dbPath = join(app.getPath('userData'), 'danh-script.db')
  dbFilePath = dbPath
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  // schema.sql được copy vào out/main khi build; dev đọc từ src
  const schemaPath = resolveSchemaPath()
  const schema = readFileSync(schemaPath, 'utf-8')
  db.exec(schema)
  migrate(db)

  return db
}

/** Migration cột-lẻ cho DB cũ (CREATE TABLE IF NOT EXISTS không thêm cột mới). Idempotent. */
function migrate(d: Database.Database): void {
  const blockCols = d.prepare('PRAGMA table_info(blocks)').all() as Array<{ name: string }>
  if (!blockCols.some((c) => c.name === 'shot_desc')) {
    d.exec('ALTER TABLE blocks ADD COLUMN shot_desc TEXT')
  }

  const blockCols2 = d.prepare('PRAGMA table_info(blocks)').all() as Array<{ name: string }>
  if (!blockCols2.some((c) => c.name === 'shot_panel_json')) {
    d.exec('ALTER TABLE blocks ADD COLUMN shot_panel_json TEXT')
  }

  // reviews vốn chỉ có block_id; thêm project_id + gate_stage để lưu review THEO CỔNG (Pha 4).
  const reviewCols = d.prepare('PRAGMA table_info(reviews)').all() as Array<{ name: string }>
  if (!reviewCols.some((c) => c.name === 'project_id')) {
    d.exec('ALTER TABLE reviews ADD COLUMN project_id INTEGER')
  }
  if (!reviewCols.some((c) => c.name === 'gate_stage')) {
    d.exec('ALTER TABLE reviews ADD COLUMN gate_stage TEXT')
  }

  // Tầng nguyên liệu (Visual System): asset gốc mang prompt sinh ảnh, asset phái sinh trỏ về gốc.
  const assetCols = d.prepare('PRAGMA table_info(assets)').all() as Array<{ name: string }>
  if (!assetCols.some((c) => c.name === 'gen_prompt')) {
    d.exec('ALTER TABLE assets ADD COLUMN gen_prompt TEXT')
  }
  if (!assetCols.some((c) => c.name === 'parent_id')) {
    d.exec('ALTER TABLE assets ADD COLUMN parent_id INTEGER')
  }
  if (!assetCols.some((c) => c.name === 'derive_kind')) {
    d.exec('ALTER TABLE assets ADD COLUMN derive_kind TEXT')
  }
  if (!assetCols.some((c) => c.name === 'source')) {
    d.exec("ALTER TABLE assets ADD COLUMN source TEXT NOT NULL DEFAULT 'manual'")
  }

  // Gu đạo diễn chọn ở đầu dự án (skills/directors/<id>.md). DB cũ mở được: cột NULL.
  const projCols = d.prepare('PRAGMA table_info(projects)').all() as Array<{ name: string }>
  if (!projCols.some((c) => c.name === 'director_id')) {
    d.exec('ALTER TABLE projects ADD COLUMN director_id TEXT')
  }
}

function resolveSchemaPath(): string {
  // electron-vite: __dirname = out/main khi chạy. Thử vài vị trí.
  const candidates = [
    join(process.resourcesPath || '', 'schema.sql'), // bản đóng gói (extraResources)
    join(__dirname, 'schema.sql'),
    join(__dirname, '../../src/main/db/schema.sql'),
    join(process.cwd(), 'src/main/db/schema.sql')
  ]
  for (const p of candidates) {
    try {
      readFileSync(p)
      return p
    } catch {
      /* thử tiếp */
    }
  }
  return candidates[candidates.length - 1]
}

function getDb(): Database.Database {
  if (!db) return initDb()
  return db
}

// ---------------- Projects ----------------

export function createProject(input: CreateProjectInput): Project {
  const stmt = getDb().prepare(
    `INSERT INTO projects (name, pipeline, ideal_json, stage)
     VALUES (@name, @pipeline, @ideal_json, 'draft')`
  )
  const info = stmt.run({
    name: input.name,
    pipeline: input.pipeline,
    ideal_json: JSON.stringify(input.ideal)
  })
  return getProject(Number(info.lastInsertRowid))!
}

export function getProject(id: number): Project | undefined {
  return getDb().prepare('SELECT * FROM projects WHERE id = ?').get(id) as
    | Project
    | undefined
}

export function listProjects(): Project[] {
  return getDb()
    .prepare('SELECT * FROM projects ORDER BY created_at DESC, id DESC')
    .all() as Project[]
}

export function deleteProject(id: number): void {
  getDb().prepare('DELETE FROM projects WHERE id = ?').run(id)
}

/**
 * Ghi stage đã chốt — MONOTONIC: chỉ tiến, không lùi.
 * Vì luật khóa cho phép "quay lại sửa bước đã xong rồi chốt lại"; nếu ghi đè
 * thẳng thì stage sẽ TỤT về bước cũ → khóa lại các bước đã mở. So bậc bằng
 * stageRank (nguồn thứ tự duy nhất ở @shared/wizardSteps) rồi chỉ ghi khi tiến.
 */
export function updateProjectStage(id: number, stage: string): void {
  const row = getDb().prepare('SELECT stage FROM projects WHERE id = ?').get(id) as
    | { stage: string }
    | undefined
  if (row && stageRank(stage) <= stageRank(row.stage)) return // chốt lại bước cũ → giữ nguyên tiến độ
  getDb().prepare('UPDATE projects SET stage = ? WHERE id = ?').run(stage, id)
}

// ---------------- Scenes / Blocks / Assets (khung, dùng ở ĐỢT 1) ----------------

export function listScenes(projectId: number): Scene[] {
  return getDb()
    .prepare('SELECT * FROM scenes WHERE project_id = ? ORDER BY order_idx')
    .all(projectId) as Scene[]
}

export function listBlocks(sceneId: number): Block[] {
  return getDb()
    .prepare('SELECT * FROM blocks WHERE scene_id = ? ORDER BY order_idx')
    .all(sceneId) as Block[]
}

export function listAssets(projectId: number): Asset[] {
  return getDb()
    .prepare(
      'SELECT * FROM assets WHERE project_id = ? OR project_id IS NULL ORDER BY id'
    )
    .all(projectId) as Asset[]
}

// ---------------- Ghi từ agent-thợ (ĐỢT 1) ----------------

/**
 * Tạo/cập nhật 1 cảnh theo (project_id, order_idx). Chỉ ghi field được truyền.
 * Trả về scene.id.
 */
export function upsertScene(
  projectId: number,
  orderIdx: number,
  summary?: string,
  narrationVi?: string,
  sceneContext?: SceneContext
): number {
  const d = getDb()
  const existing = d
    .prepare('SELECT * FROM scenes WHERE project_id = ? AND order_idx = ?')
    .get(projectId, orderIdx) as Scene | undefined

  if (!existing) {
    const info = d
      .prepare(
        `INSERT INTO scenes (project_id, order_idx, summary, narration_vi, scene_context_json)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(
        projectId,
        orderIdx,
        summary ?? '',
        narrationVi ?? '',
        sceneContext ? JSON.stringify(sceneContext) : null
      )
    return Number(info.lastInsertRowid)
  }

  d.prepare(
    `UPDATE scenes SET
       summary = COALESCE(?, summary),
       narration_vi = COALESCE(?, narration_vi),
       scene_context_json = COALESCE(?, scene_context_json)
     WHERE id = ?`
  ).run(
    summary ?? null,
    narrationVi ?? null,
    sceneContext ? JSON.stringify(sceneContext) : null,
    existing.id
  )
  return existing.id
}

/**
 * Tạo/cập nhật 1 block theo (scene order, block order) trong 1 dự án.
 * Tự tìm scene theo order. Trả về block.id.
 */
export function upsertBlock(
  projectId: number,
  sceneOrder: number,
  blockOrder: number,
  fields: {
    shot_desc?: string
    image_prompt_en?: string
    video_prompt_json?: string
    shot_panel_json?: string
  }
): number {
  const d = getDb()
  const scene = d
    .prepare('SELECT id FROM scenes WHERE project_id = ? AND order_idx = ?')
    .get(projectId, sceneOrder) as { id: number } | undefined
  if (!scene) throw new Error(`Chưa có cảnh order=${sceneOrder}, hãy ghi scene_context trước`)

  const existing = d
    .prepare('SELECT id FROM blocks WHERE scene_id = ? AND order_idx = ?')
    .get(scene.id, blockOrder) as { id: number } | undefined

  if (!existing) {
    const info = d
      .prepare(
        `INSERT INTO blocks (scene_id, order_idx, shot_desc, image_prompt_en, video_prompt_json, shot_panel_json)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        scene.id,
        blockOrder,
        fields.shot_desc ?? null,
        fields.image_prompt_en ?? null,
        fields.video_prompt_json ?? null,
        fields.shot_panel_json ?? null
      )
    return Number(info.lastInsertRowid)
  }

  d.prepare(
    `UPDATE blocks SET
       shot_desc = COALESCE(?, shot_desc),
       image_prompt_en = COALESCE(?, image_prompt_en),
       video_prompt_json = COALESCE(?, video_prompt_json),
       shot_panel_json = COALESCE(?, shot_panel_json)
     WHERE id = ?`
  ).run(
    fields.shot_desc ?? null,
    fields.image_prompt_en ?? null,
    fields.video_prompt_json ?? null,
    fields.shot_panel_json ?? null,
    existing.id
  )
  return existing.id
}

/** Báo cáo độ phủ block của 1 dự án: đếm block thiếu shot/ảnh/video theo từng cảnh. */
export interface CoverageGap {
  scene_order: number
  block_order: number
  missing: Array<'shot' | 'image' | 'video'>
}

export function coverageReport(projectId: number): {
  totalBlocks: number
  scenesNoBlock: number[]
  gaps: CoverageGap[]
} {
  const d = getDb()
  const scenes = listScenes(projectId)
  const gaps: CoverageGap[] = []
  const scenesNoBlock: number[] = []
  let totalBlocks = 0

  for (const s of scenes) {
    const blocks = d
      .prepare('SELECT * FROM blocks WHERE scene_id = ? ORDER BY order_idx')
      .all(s.id) as Block[]
    if (blocks.length === 0) {
      scenesNoBlock.push(s.order_idx)
      continue
    }
    for (const b of blocks) {
      totalBlocks++
      const missing: CoverageGap['missing'] = []
      if (!b.shot_desc?.trim()) missing.push('shot')
      if (!b.image_prompt_en?.trim()) missing.push('image')
      if (!b.video_prompt_json?.trim()) missing.push('video')
      if (missing.length) gaps.push({ scene_order: s.order_idx, block_order: b.order_idx, missing })
    }
  }
  return { totalBlocks, scenesNoBlock, gaps }
}

// ---------------- Liên kết block ↔ asset (như o_assets2Storyboard Toonflow) ----------------

/**
 * Tra danh sách @tag → asset_id THẬT (kể cả biến thể phái sinh) trong 1 dự án.
 * Bỏ tag không khớp asset nào. Không trùng id. Dùng để nối block↔asset.
 */
export function resolveTagsToAssetIds(projectId: number, tagNames: string[]): number[] {
  const d = getDb()
  const ids = new Set<number>()
  for (const raw of tagNames) {
    const tag = raw.replace(/^@/, '').trim()
    if (!tag) continue
    const row = d
      .prepare(
        `SELECT id FROM assets WHERE project_id = ? AND json_extract(variations_json,'$.tag') = ?`
      )
      .get(projectId, tag) as { id: number } | undefined
    if (row) ids.add(row.id)
  }
  return [...ids]
}

/**
 * Ghi liên kết 1 block → các asset nó dùng (thay toàn bộ link cũ của block).
 * Bỏ qua an toàn nếu assetIds rỗng (không xóa link đang có — tránh mất khi agent không khai).
 */
export function linkBlockAssets(blockId: number, assetIds: number[]): void {
  if (!assetIds.length) return
  const d = getDb()
  const ins = d.prepare(
    'INSERT OR IGNORE INTO block_assets (block_id, asset_id) VALUES (?, ?)'
  )
  const tx = d.transaction(() => {
    for (const aid of assetIds) ins.run(blockId, aid)
  })
  tx()
}

/** Danh sách asset_id 1 block đang dùng. */
export function listBlockAssets(blockId: number): number[] {
  const d = getDb()
  const rows = d
    .prepare('SELECT asset_id FROM block_assets WHERE block_id = ? ORDER BY asset_id')
    .all(blockId) as Array<{ asset_id: number }>
  return rows.map((r) => r.asset_id)
}

/**
 * ⭐ Đọc TOÀN BỘ block của dự án cho MÀN WIZARD (cột kết quả GATE 2/3/phân cảnh).
 * Khác buildExport: trả @tag dạng CHỮ (join sang assets) + shot_panel đã parse, để UI
 * hiện thẳng không cần Xuất bản. JSON hỏng thì trả null cho trường đó, KHÔNG ném lỗi —
 * một block lỗi không được làm sập cả danh sách.
 */
export function listBlockViews(projectId: number): BlockView[] {
  const d = getDb()
  const out: BlockView[] = []

  const tagStmt = d.prepare(
    `SELECT a.variations_json AS variations_json
       FROM block_assets ba JOIN assets a ON a.id = ba.asset_id
      WHERE ba.block_id = ? ORDER BY a.id`
  )

  for (const s of listScenes(projectId)) {
    for (const b of listBlocks(s.id)) {
      const rows = tagStmt.all(b.id) as Array<{ variations_json: string | null }>
      out.push({
        block_id: b.id,
        scene_order: s.order_idx,
        scene_summary: s.summary ?? '',
        block_order: b.order_idx,
        shot_desc: b.shot_desc,
        image_prompt_en: b.image_prompt_en,
        video_prompt: safeParse<VideoPrompt>(b.video_prompt_json),
        shot_panel: safeParse<ShotPanel>(b.shot_panel_json),
        asset_tags: rows.map((r) => tagOf(r)).filter((t) => t !== '')
      })
    }
  }
  return out
}

/** Parse JSON an toàn: hỏng/null → null (không ném). */
function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

/** Lưu/cập nhật asset theo tag (unique trong dự án). Trả về asset.id. */
export function saveAsset(
  projectId: number,
  a: {
    tag: string
    type: AssetRole
    name: string
    identity_lock?: IdentityLock
    ref_image_path?: string
  }
): number {
  const d = getDb()
  // dùng cột name để chứa cả tag (tag lưu trong variations_json.tag để đơn giản schema)
  const existing = d
    .prepare(
      `SELECT id FROM assets WHERE project_id = ? AND json_extract(variations_json,'$.tag') = ?`
    )
    .get(projectId, a.tag) as { id: number } | undefined

  const variations = JSON.stringify({ tag: a.tag })
  if (!existing) {
    const info = d
      .prepare(
        `INSERT INTO assets (project_id, type, name, identity_lock_json, variations_json, ref_image_path)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        projectId,
        a.type,
        a.name,
        a.identity_lock ? JSON.stringify(a.identity_lock) : null,
        variations,
        a.ref_image_path ?? null
      )
    return Number(info.lastInsertRowid)
  }
  d.prepare(
    `UPDATE assets SET
       type = ?, name = ?,
       identity_lock_json = COALESCE(?, identity_lock_json),
       ref_image_path = COALESCE(?, ref_image_path)
     WHERE id = ?`
  ).run(
    a.type,
    a.name,
    a.identity_lock ? JSON.stringify(a.identity_lock) : null,
    a.ref_image_path ?? null,
    existing.id
  )
  return existing.id
}

/** Đổi danh sách tên tag → AssetTag đầy đủ (kèm ref_image + lock_note). */
export function resolveTags(projectId: number, tagNames: string[]): AssetTag[] {
  const d = getDb()
  return tagNames.map((tag) => {
    const row = d
      .prepare(
        `SELECT * FROM assets WHERE project_id = ? AND json_extract(variations_json,'$.tag') = ?`
      )
      .get(projectId, tag) as Asset | undefined
    const role = toRole(row?.type)
    return {
      tag,
      asset_id: row?.id ?? null,
      role,
      ref_image_path: row?.ref_image_path ?? null,
      lock_note: lockNoteFor(tag, role)
    }
  })
}

/** Bảng map @tag → ảnh tư liệu của cả dự án (xuất kèm bundle). */
export function projectTagMap(projectId: number): AssetTag[] {
  const out: AssetTag[] = []
  for (const row of listAssets(projectId)) {
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

/** Tạo 1 @tag rỗng (chưa gắn ảnh) cho dự án. Idempotent theo tag. Trả asset.id. */
export function createAssetTag(
  projectId: number,
  tag: string,
  type: AssetRole,
  name: string
): number {
  return saveAsset(projectId, { tag, type, name: name || tag })
}

/** Gắn/đổi ảnh tư liệu cho 1 @tag. */
export function setAssetRefImage(projectId: number, tag: string, path: string): void {
  const d = getDb()
  const row = d
    .prepare(
      `SELECT id FROM assets WHERE project_id = ? AND json_extract(variations_json,'$.tag') = ?`
    )
    .get(projectId, tag) as { id: number } | undefined
  if (!row) throw new Error(`Không có @tag "${tag}" trong dự án`)
  d.prepare('UPDATE assets SET ref_image_path = ? WHERE id = ?').run(path, row.id)
}

/** Gỡ ảnh khỏi 1 @tag (đưa về "chưa gắn"). */
export function clearAssetRefImage(projectId: number, tag: string): void {
  const d = getDb()
  d.prepare(
    `UPDATE assets SET ref_image_path = NULL
     WHERE project_id = ? AND json_extract(variations_json,'$.tag') = ?`
  ).run(projectId, tag)
}

/** Xóa 1 @tag khỏi dự án. */
export function deleteAssetTag(projectId: number, tag: string): void {
  const d = getDb()
  d.prepare(
    `DELETE FROM assets
     WHERE project_id = ? AND json_extract(variations_json,'$.tag') = ?`
  ).run(projectId, tag)
}

export function updateProjectParams(id: number, paramsJson: string, styleId: string): void {
  getDb()
    .prepare('UPDATE projects SET params_json = ?, style_id = ? WHERE id = ?')
    .run(paramsJson, styleId, id)
}

/** Ghi đè ideal_json (payload đã merge sẵn ở tầng IPC — giữ brief cũ nếu cần). */
export function updateProjectIdeal(id: number, idealJson: string): void {
  getDb().prepare('UPDATE projects SET ideal_json = ? WHERE id = ?').run(idealJson, id)
}

/**
 * Ghi THẲNG stage (KHÔNG chặn monotonic như updateProjectStage) — chỉ dùng khi
 * người dùng CỐ Ý làm lại 1 bước: hạ stage về "trước bước đó" để mở khóa lại.
 */
export function forceProjectStage(id: number, stage: string): void {
  getDb().prepare('UPDATE projects SET stage = ? WHERE id = ?').run(stage, id)
}

/**
 * Sao lưu file DB ra bản .bak trước một thao tác XÓA phá hủy (làm lại bước nặng).
 * WAL: checkpoint dồn hết thay đổi vào file chính rồi copy đồng bộ → bản sao đủ mới.
 * Trả đường dẫn bản sao (để log). Lỗi copy KHÔNG chặn thao tác chính (chỉ cảnh báo).
 */
export function backupDb(label: string): string | null {
  try {
    const d = getDb()
    d.pragma('wal_checkpoint(TRUNCATE)') // dồn WAL vào file chính trước khi copy
    const safe = label.replace(/[^a-z0-9_-]/gi, '')
    const dest = `${dbFilePath}.${safe}.bak`
    copyFileSync(dbFilePath, dest)
    return dest
  } catch (e) {
    console.error('[backupDb] Không sao lưu được DB:', e instanceof Error ? e.message : e)
    return null
  }
}

/**
 * Dọn OUTPUT của 1 bước wizard (clean slate trước khi sinh lại) — chống data sót.
 * Tận dụng CASCADE khóa ngoại: xóa scenes → tự xóa blocks + block_assets.
 * Chỉ các bước SINH DATA mới có nhánh; bước khác ném lỗi để lộ nhầm lẫn sớm.
 */
export function clearStageOutputs(projectId: number, step: string): void {
  const d = getDb()
  switch (step) {
    case 'script': // xóa toàn bộ cảnh/khối (nền của mọi bước sau)
      d.prepare('DELETE FROM scenes WHERE project_id = ?').run(projectId)
      break
    case 'director':
      d.prepare("DELETE FROM plan_artifacts WHERE project_id = ? AND kind = 'director'").run(
        projectId
      )
      break
    case 'assets': // nguyên liệu (cascade block_assets) + hệ thị giác
      d.prepare('DELETE FROM assets WHERE project_id = ?').run(projectId)
      d.prepare(
        "DELETE FROM plan_artifacts WHERE project_id = ? AND kind = 'visual_system'"
      ).run(projectId)
      break
    case 'storyboard':
      d.prepare(
        `UPDATE blocks SET shot_panel_json = NULL
         WHERE scene_id IN (SELECT id FROM scenes WHERE project_id = ?)`
      ).run(projectId)
      break
    case 'gate2':
      d.prepare(
        `UPDATE blocks SET image_prompt_en = NULL
         WHERE scene_id IN (SELECT id FROM scenes WHERE project_id = ?)`
      ).run(projectId)
      break
    case 'gate3':
      d.prepare(
        `UPDATE blocks SET video_prompt_json = NULL
         WHERE scene_id IN (SELECT id FROM scenes WHERE project_id = ?)`
      ).run(projectId)
      break
    default:
      throw new Error(`Bước không hỗ trợ làm lại: ${step}`)
  }
}

/** Ghi gu đạo diễn chọn ở đầu dự án (chảy vào ledger mọi bước). */
export function setProjectDirector(id: number, directorId: string): void {
  getDb().prepare('UPDATE projects SET director_id = ? WHERE id = ?').run(directorId, id)
}

// ---------------- Tầng nguyên liệu (Visual System — gate_assets) ----------------

/** Đọc tag của 1 asset row từ variations_json (rỗng nếu hỏng). */
function tagOf(row: { variations_json: string | null }): string {
  try {
    return JSON.parse(row.variations_json ?? '{}').tag ?? ''
  } catch {
    return ''
  }
}

/** Ghi prompt sinh ảnh cho 1 asset (điểm dừng: user copy prompt → Coco → upload ảnh về). */
export function saveAssetPrompt(assetId: number, prompt: string): void {
  getDb().prepare('UPDATE assets SET gen_prompt = ? WHERE id = ?').run(prompt, assetId)
}

/**
 * ⭐ Ghi KHÓA NHẬN DẠNG (anchor) cho 1 asset theo @tag — dùng ở cổng Nguyên liệu.
 *
 * Vì sao cần hàm riêng: `saveAsset` TẠO MỚI nếu chưa có tag, dễ đẻ asset trùng khi thợ
 * gõ sai tag. Hàm này CHỈ cập nhật asset đã tồn tại, sai tag thì BÁO LỖI để thợ sửa.
 * MERGE theo trường: chỉ ghi đè trường có nội dung mới → gọi nhiều lượt bổ sung dần
 * không xóa mất phần đã khóa trước đó.
 */
export function saveIdentityLockByTag(
  projectId: number,
  tag: string,
  lock: Partial<IdentityLock>
): void {
  const d = getDb()
  const row = d
    .prepare(
      `SELECT id, identity_lock_json FROM assets
        WHERE project_id = ? AND json_extract(variations_json,'$.tag') = ?`
    )
    .get(projectId, tag) as { id: number; identity_lock_json: string | null } | undefined
  if (!row) throw new Error(`Không có @tag "${tag}" để ghi khóa nhận dạng`)

  const cur = parseIdentityLock(row.identity_lock_json) ?? { face: '', body: '' }
  const pick = (k: keyof IdentityLock): string | undefined => {
    const v = lock[k]
    return typeof v === 'string' && v.trim() ? v.trim() : undefined
  }
  const merged: IdentityLock = {
    face: pick('face') ?? cur.face,
    body: pick('body') ?? cur.body,
    features: pick('features') ?? cur.features,
    signature: pick('signature') ?? cur.signature,
    hair: pick('hair') ?? cur.hair,
    wardrobe: pick('wardrobe') ?? cur.wardrobe,
    age: pick('age') ?? cur.age,
    aura: pick('aura') ?? cur.aura,
    demeanor: pick('demeanor') ?? cur.demeanor,
    voice: pick('voice') ?? cur.voice
  }
  d.prepare('UPDATE assets SET identity_lock_json = ? WHERE id = ?').run(
    JSON.stringify(merged),
    row.id
  )
}

/** Ghi prompt sinh ảnh theo @tag (tiện cho tool của agent). */
export function saveAssetPromptByTag(projectId: number, tag: string, prompt: string): void {
  const d = getDb()
  const row = d
    .prepare(
      `SELECT id FROM assets WHERE project_id = ? AND json_extract(variations_json,'$.tag') = ?`
    )
    .get(projectId, tag) as { id: number } | undefined
  if (!row) throw new Error(`Không có @tag "${tag}" để ghi prompt`)
  d.prepare('UPDATE assets SET gen_prompt = ? WHERE id = ?').run(prompt, row.id)
}

/**
 * Tách hàng loạt nguyên liệu GỐC từ kịch bản (assetDeriver, source='auto').
 * Idempotent theo tag: đã có thì cập nhật type/name, chưa có thì tạo.
 * Trả về số asset đã ghi.
 */
export function deriveAssetsBatch(
  projectId: number,
  items: Array<{ tag: string; type: AssetRole; name: string; gen_prompt?: string }>
): number {
  const d = getDb()
  let n = 0
  const tx = d.transaction(() => {
    for (const it of items) {
      const existing = d
        .prepare(
          `SELECT id FROM assets WHERE project_id = ? AND json_extract(variations_json,'$.tag') = ?`
        )
        .get(projectId, it.tag) as { id: number } | undefined
      const variations = JSON.stringify({ tag: it.tag })
      if (!existing) {
        d.prepare(
          `INSERT INTO assets (project_id, type, name, variations_json, gen_prompt, source)
           VALUES (?, ?, ?, ?, ?, 'auto')`
        ).run(projectId, it.type, it.name || it.tag, variations, it.gen_prompt ?? null)
      } else {
        d.prepare(
          `UPDATE assets SET type = ?, name = ?, gen_prompt = COALESCE(?, gen_prompt) WHERE id = ?`
        ).run(it.type, it.name || it.tag, it.gen_prompt ?? null, existing.id)
      }
      n++
    }
  })
  tx()
  return n
}

/**
 * Tạo 1 asset PHÁI SINH trỏ về asset gốc (parent_tag).
 * Tag phái sinh tự đặt = <PARENT>_<KIND><n> nếu không truyền. Trả về asset.id.
 */
export function saveDerivedAsset(
  projectId: number,
  d0: { parentTag: string; deriveKind: DeriveKind; name: string; gen_prompt?: string; tag?: string }
): number {
  const d = getDb()
  const parent = d
    .prepare(
      `SELECT id FROM assets WHERE project_id = ? AND json_extract(variations_json,'$.tag') = ?`
    )
    .get(projectId, d0.parentTag) as { id: number } | undefined
  if (!parent) throw new Error(`Không có asset gốc @${d0.parentTag} để phái sinh`)

  // đếm phái sinh hiện có của gốc để đặt tag mặc định
  const cnt = d
    .prepare('SELECT COUNT(*) AS c FROM assets WHERE parent_id = ?')
    .get(parent.id) as { c: number }
  const tag = d0.tag || `${d0.parentTag}_${d0.deriveKind.toUpperCase()}${cnt.c + 1}`
  const variations = JSON.stringify({ tag })

  const existing = d
    .prepare(
      `SELECT id FROM assets WHERE project_id = ? AND json_extract(variations_json,'$.tag') = ?`
    )
    .get(projectId, tag) as { id: number } | undefined
  if (existing) {
    d.prepare(
      `UPDATE assets SET name = ?, derive_kind = ?, parent_id = ?, gen_prompt = COALESCE(?, gen_prompt) WHERE id = ?`
    ).run(d0.name, d0.deriveKind, parent.id, d0.gen_prompt ?? null, existing.id)
    return existing.id
  }
  // kế thừa type của gốc
  const parentType = d.prepare('SELECT type FROM assets WHERE id = ?').get(parent.id) as {
    type: string
  }
  const info = d
    .prepare(
      `INSERT INTO assets (project_id, type, name, variations_json, gen_prompt, parent_id, derive_kind, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'auto')`
    )
    .run(
      projectId,
      parentType.type,
      d0.name,
      variations,
      d0.gen_prompt ?? null,
      parent.id,
      d0.deriveKind
    )
  return Number(info.lastInsertRowid)
}

/** Lấy 1 trường chuỗi của IdentityLock, bỏ qua giá trị không phải chuỗi (LLM trả sai kiểu). */
function lockField(o: Partial<IdentityLock>, k: keyof IdentityLock): string | undefined {
  const v = o[k]
  return typeof v === 'string' && v.trim() ? v.trim() : undefined
}

/**
 * Parse an toàn identity_lock_json → IdentityLock (null nếu trống/hỏng).
 * ⭐ Giữ ĐỦ 6 trường (face/body + features/hair/age/aura). Trước đây chỉ giữ face+body
 * nên 4 trường mới bị VỨT khi đọc lại từ DB → khối anchor mất chi tiết → mặt vẫn trôi.
 * Dữ liệu cũ (chỉ có face/body) vẫn đọc bình thường: 4 trường mới = undefined.
 */
function parseIdentityLock(json: string | null): IdentityLock | null {
  if (!json?.trim()) return null
  try {
    const o = JSON.parse(json) as Partial<IdentityLock>
    if (!o || typeof o !== 'object') return null
    const face = lockField(o, 'face')
    const body = lockField(o, 'body')
    const features = lockField(o, 'features')
    const hair = lockField(o, 'hair')
    const age = lockField(o, 'age')
    const aura = lockField(o, 'aura')
    // Không có trường nào có nội dung → coi như chưa khóa.
    if (!face && !body && !features && !hair && !age && !aura) return null
    return { face: face ?? '', body: body ?? '', features, hair, age, aura }
  } catch {
    return null
  }
}

/** Danh sách nguyên liệu ĐẦY ĐỦ: asset gốc (parent_id null) kèm mảng phái sinh. */
export function listAssetsFull(projectId: number): AssetFull[] {
  const d = getDb()
  const rows = d
    .prepare('SELECT * FROM assets WHERE project_id = ? ORDER BY id')
    .all(projectId) as Asset[]

  const roots = rows.filter((r) => r.parent_id == null)
  return roots.map((r) => {
    const derivatives: AssetDerivative[] = rows
      .filter((c) => c.parent_id === r.id)
      .map((c) => ({
        asset_id: c.id,
        tag: tagOf(c),
        name: c.name,
        derive_kind: c.derive_kind,
        gen_prompt: c.gen_prompt,
        ref_image_path: c.ref_image_path
      }))
    return {
      asset_id: r.id,
      tag: tagOf(r),
      role: toRole(r.type),
      name: r.name,
      identity_lock: parseIdentityLock(r.identity_lock_json),
      gen_prompt: r.gen_prompt,
      ref_image_path: r.ref_image_path,
      source: r.source === 'auto' ? 'auto' : 'manual',
      derivatives
    }
  })
}

/** Độ phủ nguyên liệu: đếm tag thiếu prompt / thiếu ảnh (lá chắn chốt cổng gate_assets). */
export function assetCoverage(projectId: number): AssetCoverage {
  const d = getDb()
  const rows = d
    .prepare('SELECT * FROM assets WHERE project_id = ?')
    .all(projectId) as Asset[]
  const missingPrompt: string[] = []
  const missingImage: string[] = []
  const missingIdentity: string[] = []
  for (const r of rows) {
    const tag = tagOf(r)
    if (!tag) continue
    if (!r.gen_prompt?.trim()) missingPrompt.push(tag)
    else if (!r.ref_image_path?.trim()) missingImage.push(tag)
    // ⭐ Chỉ soát asset GỐC (parent_id null): phái sinh kế thừa mặt của gốc, không cần
    // khóa riêng. char + product cần khóa (mặt/hình dạng); prop/scene không bắt buộc.
    if (r.parent_id === null && (r.type === 'char' || r.type === 'product')) {
      if (!hasLock(parseIdentityLock(r.identity_lock_json))) missingIdentity.push(tag)
    }
  }
  return { total: rows.length, missingPrompt, missingImage, missingIdentity }
}

/**
 * ⭐ SOÁT TRÔI MẶT toàn dự án (Level 3) — ép tự kiểm tra tính nhất quán.
 *
 * Hai lá chắn trước (khóa nhận dạng + app chèn anchor) đảm bảo prompt CÓ hồ sơ gốc.
 * Lá chắn này bắt lỗi còn lại: thợ tả CHỒNG ngoại hình ở thân prompt. Hai mô tả cùng
 * tồn tại → model chọn bừa → mặt vẫn trôi dù đã có anchor.
 *
 * Chỉ soát block có nhắc @tag nhân vật/sản phẩm đã khóa; block cảnh nền thuần bỏ qua.
 */
export function identityDriftReport(projectId: number): {
  checked: number
  clean: number
  locked_tags: string[]
  unlocked_tags: string[]
  warning?: string
  blocks: Array<{
    scene_order: number
    block_order: number
    issues: DriftIssue[]
  }>
} {
  const assets = listAssetsFull(projectId)
  const charTags = assets.filter((a) => hasLock(a.identity_lock)).map((a) => a.tag)
  // ⚠️ BẪY "SẠCH GIẢ": nếu KHÔNG asset nào khóa thì charTags rỗng → checkPromptDrift
  // bỏ qua mọi block → báo cáo về "clean = checked" trông như đạt 100%, trong khi thực
  // tế KHÔNG có lá chắn nào đang chạy. Phải nêu rõ để thợ/người dùng không hiểu nhầm.
  const unlockedTags = assetCoverage(projectId).missingIdentity

  const out: Array<{ scene_order: number; block_order: number; issues: DriftIssue[] }> = []
  let checked = 0
  let clean = 0

  for (const b of listBlockViews(projectId)) {
    const p = b.image_prompt_en?.trim()
    if (!p) continue
    checked++
    const issues = checkPromptDrift(p, charTags)
    if (!issues.length) clean++
    else out.push({ scene_order: b.scene_order, block_order: b.block_order, issues })
  }

  const warning = charTags.length
    ? undefined
    : `⚠️ CHƯA asset nào được khóa nhận dạng${unlockedTags.length ? ` (thiếu: ${unlockedTags.join(', ')})` : ''} — ` +
      `kết quả soát này KHÔNG có giá trị: không có hồ sơ gốc thì không có gì để đối chiếu, ` +
      `và anchor_applied sẽ luôn false. Hãy gọi lock_identity cho các @tag đó TRƯỚC, rồi ghi lại prompt ảnh.`

  return { checked, clean, locked_tags: charTags, unlocked_tags: unlockedTags, warning, blocks: out }
}

/**
 * ⭐ SOÁT TRÔI MẶT cho prompt VIDEO — cùng lá chắn, khác luật.
 *
 * Khác prompt ảnh ở 2 điểm:
 * 1. KHÔNG đòi khối [IDENTITY LOCK]: video nhận danh tính từ ẢNH đầu vào (first frame),
 *    không từ chữ → app không chèn anchor vào prompt video, đòi là báo lỗi oan 100%.
 * 2. Soát trên 2 field `scene` + `motion` gộp lại (VideoPrompt là JSON, không phải 1 chuỗi).
 *
 * Thứ VẪN phải bắt: tả chồng ngoại hình. Prompt video mà viết "a young Asian woman climbs"
 * là bảo model VẼ LẠI mặt thay vì bám ảnh gốc → mất công khóa mặt ở bước ảnh.
 */
export function videoDriftReport(projectId: number): {
  checked: number
  clean: number
  locked_tags: string[]
  blocks: Array<{ scene_order: number; block_order: number; issues: DriftIssue[] }>
} {
  const assets = listAssetsFull(projectId)
  const charTags = assets.filter((a) => hasLock(a.identity_lock)).map((a) => a.tag)
  const out: Array<{ scene_order: number; block_order: number; issues: DriftIssue[] }> = []
  let checked = 0
  let clean = 0

  for (const b of listBlockViews(projectId)) {
    const vp = b.video_prompt
    if (!vp) continue
    const text = [vp.scene, vp.motion, vp.constraints].filter(Boolean).join(' ')
    if (!text.trim()) continue
    checked++
    const issues = checkPromptDrift(text, charTags, { requireAnchor: false })
    if (!issues.length) clean++
    else out.push({ scene_order: b.scene_order, block_order: b.block_order, issues })
  }
  return { checked, clean, locked_tags: charTags, blocks: out }
}

// ---------------- Hội thoại tinh chỉnh từng GATE ----------------

/** Đọc lịch sử hội thoại (mảng raw content-block Anthropic) của 1 gate. Rỗng nếu chưa có. */
export function loadGateChat(projectId: number, gateStage: string): unknown[] {
  const row = getDb()
    .prepare('SELECT messages_json FROM gate_chats WHERE project_id = ? AND gate_stage = ?')
    .get(projectId, gateStage) as { messages_json: string } | undefined
  if (!row) return []
  try {
    const arr = JSON.parse(row.messages_json)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

/** Ghi đè lịch sử hội thoại của 1 gate (UPSERT theo project_id+gate_stage). */
export function saveGateChat(projectId: number, gateStage: string, messages: unknown[]): void {
  getDb()
    .prepare(
      `INSERT INTO gate_chats (project_id, gate_stage, messages_json)
       VALUES (?, ?, ?)
       ON CONFLICT(project_id, gate_stage)
       DO UPDATE SET messages_json = excluded.messages_json`
    )
    .run(projectId, gateStage, JSON.stringify(messages))
}

// ---------------- Artifact tiền-kịch-bản (GATE 1: khung xương + chuyển thể) ----------------

/** Loại artifact kế hoạch lưu trong plan_artifacts (kind là free TEXT, union chỉ để chặt kiểu). */
export type PlanArtifactKind =
  | 'draft'
  | 'skeleton'
  | 'adaptation'
  | 'director'
  | 'director_bible'
  | 'visual_system'

/** Ghi đè 1 artifact kế hoạch (draft|skeleton|adaptation|visual_system) theo (project, kind). */
export function savePlanArtifact(
  projectId: number,
  kind: PlanArtifactKind,
  content: unknown
): void {
  getDb()
    .prepare(
      `INSERT INTO plan_artifacts (project_id, kind, content_json)
       VALUES (?, ?, ?)
       ON CONFLICT(project_id, kind)
       DO UPDATE SET content_json = excluded.content_json`
    )
    .run(projectId, kind, JSON.stringify(content))
}

/** Đọc 1 artifact kế hoạch, null nếu chưa có / hỏng. */
function loadPlanArtifact<T>(projectId: number, kind: PlanArtifactKind): T | null {
  const row = getDb()
    .prepare('SELECT content_json FROM plan_artifacts WHERE project_id = ? AND kind = ?')
    .get(projectId, kind) as { content_json: string } | undefined
  if (!row) return null
  try {
    return JSON.parse(row.content_json) as T
  } catch {
    return null
  }
}

/** Đọc toàn bộ artifact kế hoạch của dự án (cho tool read_plan / UI / export). */
export function getPlanArtifacts(projectId: number): PlanArtifacts {
  // Ý đồ chốt (GATE 0) sống trong projects.ideal_json.brief (không phải plan_artifacts).
  let brief: IdealBrief | null = null
  const p = getProject(projectId)
  if (p?.ideal_json) {
    try {
      brief = (JSON.parse(p.ideal_json) as Ideal).brief ?? null
    } catch {
      brief = null
    }
  }
  return {
    brief,
    draft: loadPlanArtifact<{ text: string }>(projectId, 'draft')?.text ?? null,
    skeleton: loadPlanArtifact<StorySkeleton>(projectId, 'skeleton'),
    adaptation: loadPlanArtifact<AdaptationStrategy>(projectId, 'adaptation'),
    director: loadPlanArtifact<DirectorPlan>(projectId, 'director'),
    visualSystem: loadPlanArtifact<VisualSystem>(projectId, 'visual_system'),
    directorBible: loadPlanArtifact<DirectorBible>(projectId, 'director_bible')
  }
}

/** Ghi kịch bản nháp (lưu dạng {text} trong plan_artifacts kind=draft). */
export function saveDraft(projectId: number, text: string): void {
  savePlanArtifact(projectId, 'draft', { text })
}

/** Đọc kịch bản nháp (chuỗi rỗng nếu chưa có). */
export function loadDraft(projectId: number): string {
  return loadPlanArtifact<{ text: string }>(projectId, 'draft')?.text ?? ''
}

/** Ghi quy hoạch đạo diễn (gate_director). */
export function saveDirectorPlan(projectId: number, plan: DirectorPlan): void {
  savePlanArtifact(projectId, 'director', plan)
}

/** Ghi hệ thống thị giác / Color Script (gate_assets). */
export function saveVisualSystem(projectId: number, vs: VisualSystem): void {
  savePlanArtifact(projectId, 'visual_system', vs)
}

/** Ghi hiến pháp thẩm mỹ / Director Bible (chốt gu ở đầu dự án). */
export function saveDirectorBible(projectId: number, b: DirectorBible): void {
  savePlanArtifact(projectId, 'director_bible', b)
}

// ---------------- Kiểm duyệt A/B/C/D lưu DB (Pha 4) ----------------

/** Lưu 1 review theo cổng (giữ bản mới nhất: xóa cũ cùng project+gate rồi chèn). */
export function saveReview(
  projectId: number,
  gateStage: string,
  grade: string,
  report: string
): void {
  const d = getDb()
  d.prepare('DELETE FROM reviews WHERE project_id = ? AND gate_stage = ?').run(projectId, gateStage)
  d.prepare(
    'INSERT INTO reviews (project_id, gate_stage, grade, notes) VALUES (?, ?, ?, ?)'
  ).run(projectId, gateStage, grade, report)
}

/** Đọc review mới nhất của từng cổng trong dự án (cho UI hiển thị lại nếu cần). */
export function latestReviews(
  projectId: number
): Array<{ gate_stage: string; grade: string; report: string }> {
  return getDb()
    .prepare(
      `SELECT gate_stage, grade, notes AS report FROM reviews
       WHERE project_id = ? AND gate_stage IS NOT NULL ORDER BY id`
    )
    .all(projectId) as Array<{ gate_stage: string; grade: string; report: string }>
}

/**
 * Đắp brief tiền-ideal (persona/research) vào ideal_json.brief (merge, không ghi đè raw).
 * Chỉ set field được truyền (undefined = giữ nguyên).
 */
export function mergeIdealBrief(projectId: number, patch: Partial<IdealBrief>): void {
  const d = getDb()
  const p = getProject(projectId)
  if (!p) throw new Error('Không tìm thấy dự án')
  let ideal: Ideal
  try {
    ideal = JSON.parse(p.ideal_json) as Ideal
  } catch {
    ideal = { raw: '' }
  }
  const brief: IdealBrief = { ...(ideal.brief ?? {}) }
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined) (brief as Record<string, unknown>)[k] = v
  }
  ideal.brief = brief
  d.prepare('UPDATE projects SET ideal_json = ? WHERE id = ?').run(
    JSON.stringify(ideal),
    projectId
  )
}
