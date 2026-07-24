// ============================================================
// Danh Script — Kho CRAFT tự-rút (progressive-disclosure, học Toonflow)
// Thay vì nhồi sẵn toàn văn mọi craft vào system, ta chỉ đưa DANH SÁCH
// <available_skills> khớp bước hiện tại + cấp tool list_skills/read_skill_file
// để thợ TỰ RÚT craft khi cần → system gọn, thợ chủ động, đúng mô hình Toonflow.
//
// 2 TRỤC (như Toonflow ART × STORY) + 1 trục chung:
//   • art    — skills/styles/<style>/craft.md   (dựng cảnh/shot theo phong cách thị giác)
//   • story  — skills/genres/<genre>.md         (nhịp kể + phân cảnh theo thể loại)
//   • common — skills/craft/*.md                (craft chung theo bước)
//
// Lọc theo bước (step = gate_stage) + style + genre của DỰ ÁN:
//   - common: khớp khi frontmatter.steps chứa step (hoặc để trống = mọi bước).
//   - art:    CHỈ style của dự án.
//   - story:  CHỈ genre của dự án (nếu người dùng chọn).
// ============================================================
import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join, resolve, sep } from 'path'
import { skillsRoot } from './skillLoader'

export type CraftAxis = 'art' | 'story' | 'common'

export interface CraftMeta {
  name: string // tên hiển thị (activate)
  description: string // 1 câu — để thợ quyết định có rút không
  axis: CraftAxis
  steps: string[] // bước áp dụng (rỗng = mọi bước, chỉ dùng cho common)
  relPath: string // đường dẫn tương đối trong skills/ (cho read_skill_file)
}

/** Đọc file, tách frontmatter YAML tối giản (name/description/axis/steps). */
export function parseFrontmatter(md: string): { meta: Partial<CraftMeta>; body: string } {
  if (!md.startsWith('---')) return { meta: {}, body: md }
  const end = md.indexOf('\n---', 3)
  if (end === -1) return { meta: {}, body: md }
  const raw = md.slice(3, end).trim()
  const body = md.slice(end + 4).replace(/^\s*\n/, '')
  const meta: Partial<CraftMeta> = {}
  for (const line of raw.split('\n')) {
    const m = line.match(/^([A-Za-z_]+):\s*(.*)$/)
    if (!m) continue
    const key = m[1].trim()
    const val = m[2].trim()
    if (key === 'name') meta.name = val
    else if (key === 'description') meta.description = val
    else if (key === 'axis' && (val === 'art' || val === 'story' || val === 'common')) {
      meta.axis = val
    } else if (key === 'steps') {
      // steps: [a, b] hoặc steps: a, b
      meta.steps = val
        .replace(/^\[|\]$/g, '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    }
  }
  return { meta, body }
}

/** Suy name/description khi file KHÔNG có frontmatter (tolerant với craft cũ). */
function deriveMetaFromBody(body: string, fallbackName: string): { name: string; description: string } {
  const lines = body.split('\n')
  let name = fallbackName
  let description = ''
  for (const line of lines) {
    const t = line.trim()
    if (!t) continue
    if (t.startsWith('#') && name === fallbackName) {
      name = t.replace(/^#+\s*/, '').replace(/^GENRE\s*·\s*/i, '').trim()
      continue
    }
    if (t.startsWith('>')) {
      description = t.replace(/^>\s*/, '').slice(0, 160)
      break
    }
    if (!t.startsWith('#') && !description) {
      description = t.slice(0, 160)
      break
    }
  }
  return { name, description: description || name }
}

/** Đọc 1 file craft → CraftMeta (frontmatter ưu tiên, fallback suy từ body). */
function readCraftMeta(relPath: string, axis: CraftAxis, fallbackName: string): CraftMeta | null {
  const full = join(skillsRoot(), relPath)
  let md: string
  try {
    md = readFileSync(full, 'utf-8')
  } catch {
    return null
  }
  const { meta, body } = parseFrontmatter(md)
  const derived = deriveMetaFromBody(body, fallbackName)
  return {
    name: meta.name || derived.name,
    description: meta.description || derived.description,
    axis: meta.axis || axis,
    steps: meta.steps || [],
    relPath
  }
}

/** Quét toàn kho craft 3 nguồn → danh sách CraftMeta. */
export function scanCraft(): CraftMeta[] {
  const root = skillsRoot()
  const out: CraftMeta[] = []

  // 1) common — skills/craft/*.md
  const craftDir = join(root, 'craft')
  if (existsSync(craftDir)) {
    for (const f of readdirSync(craftDir)) {
      if (!f.endsWith('.md') || f.startsWith('_')) continue
      const meta = readCraftMeta(join('craft', f), 'common', f.slice(0, -3))
      if (meta) out.push(meta)
    }
  }

  // 2) art — skills/styles/<style>/craft.md
  const stylesDir = join(root, 'styles')
  if (existsSync(stylesDir)) {
    for (const style of readdirSync(stylesDir)) {
      const p = join(stylesDir, style, 'craft.md')
      if (!existsSync(p)) continue
      const meta = readCraftMeta(join('styles', style, 'craft.md'), 'art', style)
      if (meta) out.push(meta)
    }
  }

  // 3) story — skills/genres/*.md
  const genresDir = join(root, 'genres')
  if (existsSync(genresDir)) {
    for (const f of readdirSync(genresDir)) {
      if (!f.endsWith('.md') || f.startsWith('_')) continue
      const meta = readCraftMeta(join('genres', f), 'story', f.slice(0, -3))
      if (meta) out.push(meta)
    }
  }

  return out
}

/**
 * Danh sách craft KHẢ DỤNG cho 1 bước, có style + genre của dự án.
 * - common: steps rỗng (mọi bước) HOẶC chứa step.
 * - art: chỉ craft của đúng style dự án (relPath = styles/<styleId>/craft.md).
 * - story: chỉ craft của đúng genre dự án (relPath = genres/<genreId>.md).
 */
export function availableCraftFor(
  step: string,
  styleId?: string | null,
  genreId?: string | null
): CraftMeta[] {
  const all = scanCraft()
  return all.filter((c) => {
    if (c.axis === 'common') return c.steps.length === 0 || c.steps.includes(step)
    if (c.axis === 'art') return Boolean(styleId) && c.relPath === `styles/${styleId}/craft.md`
    if (c.axis === 'story') return Boolean(genreId) && c.relPath === `genres/${genreId}.md`
    return false
  })
}

/** Khối <available_skills> chèn vào system để thợ biết có gì mà rút. */
export function availableSkillsPrompt(craft: CraftMeta[]): string {
  if (!craft.length) return ''
  const items = craft
    .map((c) => `  <skill name="${c.name}" path="${c.relPath}">${c.description}</skill>`)
    .join('\n')
  return (
    'KHO CRAFT TỰ-RÚT (progressive-disclosure): bên dưới là các "vốn nghề" khả dụng cho bước này. ' +
    'Khi cần chiều sâu kỹ thuật (công thức dựng cảnh/shot theo phong cách, nhịp kể theo thể loại), ' +
    'gọi `read_skill_file` với path tương ứng để đọc TOÀN VĂN rồi áp dụng. Chỉ rút khi thực sự cần.\n' +
    `<available_skills>\n${items}\n</available_skills>`
  )
}

/**
 * Đọc TOÀN VĂN 1 craft theo relPath (đã strip frontmatter), có guard path-traversal.
 * Chỉ cho đọc file .md NẰM TRONG skills/. Ném lỗi rõ nếu vượt ranh giới.
 */
export function readCraftFile(relPath: string): string {
  const root = skillsRoot()
  const full = resolve(root, relPath)
  const rootResolved = resolve(root)
  // Guard: full PHẢI nằm trong root (chống ../../ escape).
  if (full !== rootResolved && !full.startsWith(rootResolved + sep)) {
    throw new Error(`Đường dẫn skill vượt ngoài kho: ${relPath}`)
  }
  if (!relPath.endsWith('.md')) throw new Error(`Chỉ đọc được file .md: ${relPath}`)
  if (!existsSync(full) || !statSync(full).isFile()) {
    throw new Error(`Không tìm thấy craft: ${relPath}`)
  }
  const md = readFileSync(full, 'utf-8')
  return parseFrontmatter(md).body
}
