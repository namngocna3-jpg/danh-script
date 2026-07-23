// ============================================================
// Danh Script — Khởi tạo & truy vấn SQLite (better-sqlite3)
// ============================================================
import Database from 'better-sqlite3'
import { app } from 'electron'
import { readFileSync } from 'fs'
import { join } from 'path'
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
  VisualSystem,
  AssetFull,
  AssetDerivative,
  AssetCoverage,
  DeriveKind
} from '../../shared/types'

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

/** Mở DB trong thư mục userData + nạp schema (idempotent). */
export function initDb(): Database.Database {
  if (db) return db

  const dbPath = join(app.getPath('userData'), 'danh-script.db')
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

export function updateProjectStage(id: number, stage: string): void {
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
  fields: { shot_desc?: string; image_prompt_en?: string; video_prompt_json?: string }
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
        `INSERT INTO blocks (scene_id, order_idx, shot_desc, image_prompt_en, video_prompt_json)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(
        scene.id,
        blockOrder,
        fields.shot_desc ?? null,
        fields.image_prompt_en ?? null,
        fields.video_prompt_json ?? null
      )
    return Number(info.lastInsertRowid)
  }

  d.prepare(
    `UPDATE blocks SET
       shot_desc = COALESCE(?, shot_desc),
       image_prompt_en = COALESCE(?, image_prompt_en),
       video_prompt_json = COALESCE(?, video_prompt_json)
     WHERE id = ?`
  ).run(
    fields.shot_desc ?? null,
    fields.image_prompt_en ?? null,
    fields.video_prompt_json ?? null,
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
  for (const r of rows) {
    const tag = tagOf(r)
    if (!tag) continue
    if (!r.gen_prompt?.trim()) missingPrompt.push(tag)
    else if (!r.ref_image_path?.trim()) missingImage.push(tag)
  }
  return { total: rows.length, missingPrompt, missingImage }
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
  return {
    draft: loadPlanArtifact<{ text: string }>(projectId, 'draft')?.text ?? null,
    skeleton: loadPlanArtifact<StorySkeleton>(projectId, 'skeleton'),
    adaptation: loadPlanArtifact<AdaptationStrategy>(projectId, 'adaptation'),
    director: loadPlanArtifact<DirectorPlan>(projectId, 'director'),
    visualSystem: loadPlanArtifact<VisualSystem>(projectId, 'visual_system')
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
