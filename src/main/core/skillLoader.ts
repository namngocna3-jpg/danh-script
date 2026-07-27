// ============================================================
// Danh Script — Nạp file .md làm "linh hồn" agent (mỏ #3)
// Thứ tự tìm skills/:
//   1) userData/skills  ← SỬA ĐƯỢC sau khi cài (seed từ resources lần đầu)
//   2) resources/skills ← bản gói (đọc-only, trong extraResources)
//   3) <appPath>/skills, cwd/skills ← khi chạy dev
// seedSkills() copy resources → userData lần chạy đầu để người dùng sửa .md tại chỗ.
// ⚠️ userData ĐÈ bản gói khi đọc → nếu chỉ copy "file còn thiếu" thì bản skill mới
// của app KHÔNG BAO GIỜ tới được máy đã chạy 1 lần. Xem seedSkills() bên dưới.
// ============================================================
import { app } from 'electron'
import {
  readFileSync,
  writeFileSync,
  existsSync,
  readdirSync,
  mkdirSync,
  copyFileSync,
  statSync
} from 'fs'
import { createHash } from 'crypto'
import { join, dirname, relative } from 'path'
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
export function skillsRoot(): string {
  const u = userSkillsDir()
  if (existsSync(u)) return u
  return bundledSkillsDir()
}

/** Tên file ghi dấu vân tay bản gói đã seed (nằm trong userData/skills). */
const SEED_MANIFEST = '.seed-manifest.json'

function sha1(buf: Buffer | string): string {
  return createHash('sha1').update(buf).digest('hex')
}

function fileHash(p: string): string {
  try {
    return sha1(readFileSync(p))
  } catch {
    return ''
  }
}

/** Liệt kê đệ quy mọi file trong 1 thư mục, trả đường dẫn TƯƠNG ĐỐI so với root. */
function listFilesRel(root: string, dir = root, out: string[] = []): string[] {
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir)) {
    const s = join(dir, name)
    if (statSync(s).isDirectory()) listFilesRel(root, s, out)
    else out.push(relative(root, s).replace(/\\/g, '/'))
  }
  return out
}

/**
 * Seed skills từ bản gói sang userData/skills.
 *
 * ⚠️ VÌ SAO PHẢI PHỨC TẠP: skillsRoot() ưu tiên userData → nếu chỉ copy "file còn thiếu"
 * thì mọi bản skill CẢI TIẾN của app sau này KHÔNG BAO GIỜ tới được máy đã chạy 1 lần
 * (file cũ ở userData che mất file mới). Bug này từng khiến 3 file _execution_* sửa rồi
 * mà app vẫn chạy bản cũ.
 *
 * Quy tắc mới — 3 chiều, KHÔNG BAO GIỜ mất dữ liệu:
 *  1. Đích chưa có          → copy.
 *  2. Bản gói KHÔNG đổi     → giữ nguyên đích (kể cả người dùng đã sửa).
 *  3. Bản gói ĐỔI:
 *     · đích vẫn y hệt bản seed trước (người dùng chưa sửa) → ĐÈ bằng bản mới.
 *     · đích đã bị sửa tay                                  → GIỮ bản người dùng,
 *       ghi bản mới ra cạnh nó dưới tên `<tên>.moi.md` để đối chiếu thủ công.
 * Vân tay bản gói lưu ở userData/skills/.seed-manifest.json.
 */
export function seedSkills(): void {
  try {
    const bundled = bundledSkillsDir()
    const user = userSkillsDir()
    // trùng thư mục nghĩa là dev chạy thẳng skills/ → khỏi seed
    if (bundled === user) return
    if (!existsSync(bundled)) return
    mkdirSync(user, { recursive: true })

    const manifestPath = join(user, SEED_MANIFEST)
    let manifest: Record<string, string> = {}
    try {
      manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as Record<string, string>
    } catch {
      manifest = {}
    }

    for (const rel of listFilesRel(bundled)) {
      if (rel === SEED_MANIFEST) continue
      const src = join(bundled, rel)
      const dst = join(user, rel)
      const srcHash = fileHash(src)

      if (!existsSync(dst)) {
        mkdirSync(dirname(dst), { recursive: true })
        copyFileSync(src, dst)
        manifest[rel] = srcHash
        continue
      }

      const dstHash = fileHash(dst)
      if (dstHash === srcHash) {
        manifest[rel] = srcHash // đã trùng, chỉ cập nhật dấu vân tay
        continue
      }

      const seeded = manifest[rel]
      if (seeded === undefined || dstHash === seeded) {
        // Người dùng CHƯA sửa (hoặc chưa từng có manifest) → nhận bản mới của app.
        // Vẫn giữ 1 bản sao phòng hờ trước khi đè.
        try {
          copyFileSync(dst, `${dst}.bak`)
        } catch {
          /* không sao lưu được thì vẫn tiếp tục */
        }
        copyFileSync(src, dst)
        manifest[rel] = srcHash
      } else {
        // Người dùng ĐÃ sửa tay → tuyệt đối không đè, chỉ đặt bản mới cạnh bên.
        try {
          writeFileSync(`${dst}.moi.md`, readFileSync(src))
        } catch {
          /* bỏ qua */
        }
      }
    }

    try {
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8')
    } catch {
      /* không ghi được manifest thì lần sau seed lại theo nhánh "chưa sửa" */
    }
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
 * ⭐ CHỈ lấy STYLE TOKEN (khối ``` ĐẦU TIÊN của anchor) để DÁN vào prompt cuối.
 * Anchor .md chứa frontmatter/tiêu đề/negative/cảnh báo — KHÔNG được đổ hết vào prompt
 * (engine chỉ cần token chất liệu). Khối đầu = "từ neo phong cách"; khối sau = negative → bỏ.
 * Không tách được (anchor lạ) → fallback rỗng để renderer tự dùng STYLE của từng block.
 */
export function loadStyleToken(styleId?: string | null): string {
  const raw = loadStyleAnchor(styleId)
  const m = raw.match(/```[a-z]*\s*\n([\s\S]*?)```/i)
  if (!m) return ''
  return m[1]
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join(' ')
    .trim()
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

/**
 * Liệt kê gu đạo diễn trong skills/directors/ (bỏ _index.md).
 * id = tên file không .md; label + description đọc từ frontmatter.
 */
export function listDirectors(): Array<{ id: string; label: string; description: string }> {
  const root = skillsRoot()
  const dir = join(root, 'directors')
  if (!existsSync(dir)) return []
  const out: Array<{ id: string; label: string; description: string }> = []
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.md') || file.startsWith('_')) continue
    const id = file.slice(0, -3)
    let label = id
    let description = ''
    try {
      const md = readFileSync(join(dir, file), 'utf-8')
      const l = md.match(/^label:\s*(.+)$/m)
      if (l) label = l[1].trim()
      const d = md.match(/^description:\s*(.+)$/m)
      if (d) description = d[1].trim()
    } catch {
      /* giữ id */
    }
    out.push({ id, label, description })
  }
  return out
}

/**
 * Đọc TOÀN VĂN gu đạo diễn (skills/directors/<id>.md) để chèn vào ledger kế thừa.
 * Không có id / không đọc được → trả '' (ledger tự bỏ qua khối đạo diễn).
 */
export function loadDirectorPersona(directorId?: string | null): string {
  if (!directorId) return ''
  return readSkillOptional(`directors/${directorId}.md`)
}
