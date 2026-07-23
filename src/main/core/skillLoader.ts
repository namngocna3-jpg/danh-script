// ============================================================
// Danh Script — Nạp file .md làm "linh hồn" agent (mỏ #3)
// Thứ tự tìm skills/:
//   1) userData/skills  ← SỬA ĐƯỢC sau khi cài (seed từ resources lần đầu)
//   2) resources/skills ← bản gói (đọc-only, trong extraResources)
//   3) <appPath>/skills, cwd/skills ← khi chạy dev
// seedSkills() copy resources → userData lần chạy đầu để người dùng sửa .md tại chỗ.
// ============================================================
import { app } from 'electron'
import {
  readFileSync,
  existsSync,
  readdirSync,
  mkdirSync,
  copyFileSync,
  statSync
} from 'fs'
import { join, dirname } from 'path'
import { getProject } from '../db'

/** Thư mục skills SỬA ĐƯỢC (trong userData). Ưu tiên số 1 khi đọc. */
function userSkillsDir(): string {
  return join(app.getPath('userData'), 'skills')
}

/** Thư mục skills gốc trong bản gói / dev (đọc-only). */
function bundledSkillsDir(): string {
  const candidates = [
    join(process.resourcesPath || '', 'skills'), // đóng gói (extraResources)
    join(app.getAppPath(), 'skills'),
    join(process.cwd(), 'skills')
  ]
  for (const p of candidates) {
    if (existsSync(p)) return p
  }
  return candidates[candidates.length - 1]
}

/** Tìm thư mục skills/ để ĐỌC: userData trước (sửa được), rồi mới đến bản gói. */
function skillsRoot(): string {
  const u = userSkillsDir()
  if (existsSync(u)) return u
  return bundledSkillsDir()
}

/** Copy đệ quy 1 thư mục (chỉ copy file còn thiếu ở đích — không đè bản người dùng sửa). */
function copyDirIfMissing(src: string, dst: string): void {
  if (!existsSync(src)) return
  mkdirSync(dst, { recursive: true })
  for (const name of readdirSync(src)) {
    const s = join(src, name)
    const d = join(dst, name)
    if (statSync(s).isDirectory()) {
      copyDirIfMissing(s, d)
    } else if (!existsSync(d)) {
      mkdirSync(dirname(d), { recursive: true })
      copyFileSync(s, d)
    }
  }
}

/**
 * Seed skills từ bản gói sang userData/skills lần chạy đầu.
 * - Lần đầu: copy toàn bộ → người dùng sửa .md tại userData được.
 * - Lần sau (nâng cấp app): chỉ copy file MỚI còn thiếu, KHÔNG đè file người dùng đã sửa.
 * Gọi 1 lần lúc app.whenReady (trước khi chạy gate).
 */
export function seedSkills(): void {
  try {
    const bundled = bundledSkillsDir()
    const user = userSkillsDir()
    // relative rỗng nghĩa là cùng thư mục (dev chạy thẳng skills/) → khỏi seed
    if (bundled === user) return
    copyDirIfMissing(bundled, user)
  } catch {
    /* seed lỗi thì vẫn đọc trực tiếp từ bản gói (skillsRoot fallback) */
  }
}

/**
 * Đọc 1 skill .md theo đường dẫn tương đối trong skills/.
 * VD: readSkill('free/_execution_ideaAnalyst.md')
 */
export function readSkill(relPath: string): string {
  const full = join(skillsRoot(), relPath)
  try {
    return readFileSync(full, 'utf-8')
  } catch {
    throw new Error(`Không đọc được skill: ${relPath} (tại ${full})`)
  }
}

/** Đọc nếu có, không có thì trả '' (dùng cho file preset tùy chọn). */
export function readSkillOptional(relPath: string): string {
  try {
    return readSkill(relPath)
  } catch {
    return ''
  }
}

/**
 * Nạp system prompt cho 1 agent-thợ theo pipeline, có fallback về 'free'.
 * VD: loadExecutionSkill('affiliate', 'ideaAnalyst')
 *   → thử affiliate/_execution_ideaAnalyst.md, không có thì free/_execution_ideaAnalyst.md
 */
export function loadExecutionSkill(pipeline: string, worker: string): string {
  const specific = readSkillOptional(`${pipeline}/_execution_${worker}.md`)
  if (specific) return specific
  return readSkill(`free/_execution_${worker}.md`)
}

export function loadDecisionSkill(pipeline: string): string {
  const specific = readSkillOptional(`${pipeline}/_decision.md`)
  if (specific) return specific
  return readSkill(`free/_decision.md`)
}

/** Ghép nhiều mảnh skill dùng chung (lớp B/C, review...) vào 1 system prompt. */
export function composeSystem(...parts: string[]): string {
  return parts.filter((p) => p && p.trim()).join('\n\n---\n\n')
}

/**
 * Đọc từ neo phong cách của 1 style: skills/styles/<styleId>/anchor.md.
 * Không có style_id → trả anchor photoreal trung tính mặc định.
 */
export function loadStyleAnchor(styleId?: string | null): string {
  if (styleId) {
    const s = readSkillOptional(`styles/${styleId}/anchor.md`)
    if (s) return s
  }
  return readSkillOptional('styles/realpeople_cinematic/anchor.md')
}

/**
 * Thay {{STYLE_ANCHOR}} trong system prompt bằng nội dung anchor của style dự án.
 * Gọi sau composeSystem, trước khi đưa vào agentRunner.
 */
export function injectStyleAnchor(system: string, styleId?: string | null): string {
  if (!system.includes('{{STYLE_ANCHOR}}')) return system
  return system.replaceAll('{{STYLE_ANCHOR}}', loadStyleAnchor(styleId).trim())
}

/**
 * Thay {{OUTPUT_INTENT}} bằng luật nền (output-intent.md) + mô tả ý đồ đầu ra của dự án.
 * - Không có placeholder → trả nguyên (giống injectStyleAnchor).
 * - Không đọc được output_intent → giữ mặc định (kể chuyện, không CTA) → an toàn mọi ideal.
 * Gọi cạnh injectStyleAnchor trong runGate/runGateChat/runGate0.
 */
export function injectOutputIntent(system: string, projectId: number): string {
  if (!system.includes('{{OUTPUT_INTENT}}')) return system
  const base = readSkillOptional('output-intent.md').trim()
  let intent = '(chưa xác định — dùng mặc định kể chuyện, không CTA)'
  try {
    const project = getProject(projectId)
    if (project?.ideal_json) {
      const ideal = JSON.parse(project.ideal_json) as { brief?: { output_intent?: string } }
      const v = ideal.brief?.output_intent?.trim()
      if (v) intent = v
    }
  } catch {
    /* ideal_json hỏng → giữ mặc định */
  }
  const block = base ? `${base}\n${intent}` : intent
  return system.replaceAll('{{OUTPUT_INTENT}}', block)
}

/** Liệt kê các style có sẵn (đọc frontmatter name/label) cho wizard chọn. */
export function listStyles(): Array<{ id: string; label: string }> {
  const root = skillsRoot()
  const dir = join(root, 'styles')
  if (!existsSync(dir)) return []
  const out: Array<{ id: string; label: string }> = []
  for (const id of readdirSync(dir)) {
    const anchor = join(dir, id, 'anchor.md')
    if (!existsSync(anchor)) continue
    let label = id
    try {
      const m = readFileSync(anchor, 'utf-8').match(/^label:\s*(.+)$/m)
      if (m) label = m[1].trim()
    } catch {
      /* giữ id */
    }
    out.push({ id, label })
  }
  return out
}

/**
 * Liệt kê thể loại à-la-carte trong skills/genres/ (bỏ _index.md).
 * id = tên file không .md; label = tiêu đề H1 (bỏ tiền tố "GENRE · ");
 * group = chữ đầu slug (sales/story/misc) để UI gom nhóm.
 */
export function listGenres(): Array<{ id: string; label: string; group: string }> {
  const root = skillsRoot()
  const dir = join(root, 'genres')
  if (!existsSync(dir)) return []
  const out: Array<{ id: string; label: string; group: string }> = []
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.md') || file.startsWith('_')) continue
    const id = file.slice(0, -3)
    let label = id
    try {
      const m = readFileSync(join(dir, file), 'utf-8').match(/^#\s*(.+)$/m)
      if (m) label = m[1].replace(/^GENRE\s*·\s*/i, '').trim()
    } catch {
      /* giữ id */
    }
    const group = id.split('-')[0] // sales | story | misc
    out.push({ id, label, group })
  }
  return out
}
