// ============================================================
// Danh Script — GATE 1..4 (generic) + review A/B/C/D
// GATE 0 (ideaAnalyst) nằm riêng ở gate0.ts. File này chạy các thợ còn lại:
//   1 scriptwright · 2 imgPrompter · 3 vidPrompter · 4 export(gom, không cần LLM)
// Mỗi thợ: nạp linh hồn .md + lớp chung + inject STYLE_ANCHOR → runAgent tool-loop.
// ============================================================
import { runAgent, type AgentStep } from '../core/agentRunner'
import {
  loadExecutionSkill,
  readSkill,
  readSkillOptional,
  composeSystem,
  injectStyleAnchor,
  injectOutputIntent,
  loadStyleAnchor
} from '../core/skillLoader'
import { toolsFor } from '../tools'
import { workerSpec } from './workerSpecs'
import { availableCraftFor, availableSkillsPrompt } from '../core/craftRegistry'
import { chat } from '../core/llmGateway'
import { llmQueue } from '../core/queue'
import {
  getProject,
  listScenes,
  listBlocks,
  projectTagMap,
  getPlanArtifacts,
  saveReview,
  updateProjectStage,
  listAssetsFull,
  listBlockAssets
} from '../db'
import type {
  Block,
  AssetTag,
  VideoPrompt,
  StorySkeleton,
  AdaptationStrategy,
  DirectorPlan,
  VisualSystem,
  AssetFull,
  IdealBrief,
  ShotPanel
} from '../../shared/types'

/** Định nghĩa 1 cổng chạy được bằng agent-thợ. */
interface GateSpec {
  worker: string // tên _execution_<worker>.md
  tools: string[] // tool được cấp
  stage: string // stage ghi lại sau khi xong
  layers: string[] // các mảnh skill chung nạp kèm (theo tên file trong skills/)
  buildPrompt: (ctx: GateBuildCtx) => string
}

interface GateBuildCtx {
  idealRaw: string
}

const GATES: Record<string, GateSpec> = {
  // Legacy 1-phát (giữ tương thích đường chạy cũ): làm cả 3 bước kịch bản 1 cục.
  scriptwright: {
    worker: 'scriptwright',
    tools: [
      'read_ideal',
      'read_scenes',
      'read_plan',
      'read_coverage',
      'write_skeleton',
      'write_adaptation',
      'write_scene_context',
      'write_script',
      'plan_shots'
    ],
    stage: 'gate1_script',
    layers: ['scene-analysis.md', 'storyboard-craft.md', 'adaptation-craft.md'],
    buildPrompt: ({ idealRaw }) =>
      `Làm TUẦN TỰ: ① write_skeleton (khung xương: logline + nhịp + đường cong cảm xúc + payoff) ` +
      `② write_adaptation (chiến lược chuyển thể: mỗi thông điệp ideal → hành động/hình ảnh cụ thể) ` +
      `③ write_scene_context TỪNG cảnh (order_idx từ 1: era/setting/wardrobe/props/mood, bottom-up) ` +
      `④ bám khung + chiến lược để write_script (narration tiếng Việt từng cảnh) VÀ plan_shots (quy hoạch shot mỗi cảnh — PHẢI có cảnh ở ③ trước). ` +
      `Bắt đầu bằng read_ideal.\n\nIDEAL:\n${idealRaw}`
  },
  // ── QUY HOẠCH ĐẠO DIỄN (director_plan) ──
  directorPlanner: {
    worker: 'directorPlanner',
    tools: [...workerSpec('directorPlanner').tools, 'read_plan'],
    stage: 'gate_director',
    layers: workerSpec('directorPlanner').layers,
    buildPrompt: () =>
      `BƯỚC 1 BẮT BUỘC: gọi read_script_full + read_scenes để đọc TOÀN VĂN narration + bối cảnh từng cảnh. ` +
      `Rồi PHÂN TÍCH đạo diễn (không sáng tạo nội dung mới): với MỖI cảnh — đếm số câu thoại (line_count), ` +
      `đếm số chữ (char_count, ~4 chữ/giây), chấm cảm xúc chủ đạo + độ đậm 0–10, thiết kế chuyển cảnh sang cảnh sau. ` +
      `Ghi qua write_director_plan.`
  },
  // ── NGUYÊN LIỆU (Visual System) ──
  assetDeriver: {
    worker: 'assetDeriver',
    tools: workerSpec('assetDeriver').tools,
    stage: 'gate_assets',
    layers: workerSpec('assetDeriver').layers,
    buildPrompt: () =>
      `BƯỚC 0 BẮT BUỘC (đọc-trước-khi-làm): gọi read_plan + read_script_full + read_scenes + read_assets để nắm sổ cái các bước trước (khung xương/chuyển thể/đạo diễn) + TOÀN VĂN kịch bản + bối cảnh + @tag đã có. ` +
      `CẤM bịa nhân vật/bối cảnh/đạo cụ không có trong kịch bản; thiếu tiền đề thì báo, không tự chế. ` +
      `Rồi TÁCH nguyên liệu TỪ kịch bản (không bịa): ① derive_assets (nhân vật/bối cảnh/đạo cụ lặp lại) ` +
      `② write_asset_prompt cho mỗi asset gốc (nhân vật = character sheet 4-view nền #F8F4E8 mặt mộc + tỉ lệ đầu-thân; bối cảnh = 1 ảnh establishing SẠCH, MỘT góc đại diện, KHÔNG người, 16:9 — nhiều góc/địa điểm thì tách asset scene riêng, KHÔNG ghép nhiều góc 1 ảnh; đạo cụ = lưới 2×2) ` +
      `③ save_derived_asset biến thể cần thiết (mỗi asset 1–5, "thà thiếu hơn thừa") ` +
      `④ write_visual_system (Color Script + ánh sáng + chất liệu).`
  },
  imgPrompter: {
    worker: 'imgPrompter',
    tools: workerSpec('imgPrompter').tools,
    stage: 'gate2_image',
    layers: workerSpec('imgPrompter').layers,
    buildPrompt: () =>
      `BƯỚC 0 BẮT BUỘC (đọc-trước-khi-làm): gọi read_ideal + read_plan + read_scenes + read_blocks + read_assets để nắm TOÀN VĂN ideal + hệ thị giác + bối cảnh + shot đã quy hoạch + @tag. ` +
      `CẤM bịa asset/@tag không có trong sổ — chỉ nhúng @tag đã tồn tại; thiếu tiền đề thì báo. ` +
      `Rồi dựng prompt ẢNH khung đầu (tiếng Anh, 3 đoạn, nhúng @tag) cho mỗi block của mỗi cảnh. ` +
      `Mỗi cảnh tối thiểu 1 block (block_order bắt đầu 1). Cuối cùng read_coverage để chắc không block nào thiếu ảnh.`
  },
  vidPrompter: {
    worker: 'vidPrompter',
    tools: workerSpec('vidPrompter').tools,
    stage: 'gate3_video',
    layers: workerSpec('vidPrompter').layers,
    buildPrompt: () =>
      `BƯỚC 0 BẮT BUỘC (đọc-trước-khi-làm): gọi read_ideal + read_scenes + read_blocks + read_assets để nắm TOÀN VĂN ideal + block đã có prompt ẢNH KHUNG ĐẦU (GATE 2) + @tag đã có. ` +
      `CẤM bịa asset/cảnh/block không có trong sổ; thiếu tiền đề thì báo, không tự chế. ` +
      `LUẬT VÀNG image-to-video: mỗi block ĐÃ CÓ ảnh khung đầu ở GATE 2 (nhân vật/bối cảnh/trang phục/đạo cụ đã đứng yên trong ảnh). Prompt video chỉ LÀM ĐỘNG ảnh đó — CẤM tả lại ngoại hình/bối cảnh/trang phục. ` +
      `SCENE ngắn (chỉ thay đổi/diễn biến), MOTION mang tải chính (camera + chuyển động chủ thể). ` +
      `MULTI-SHOT (mọi thể loại): block được 1–3 shot (CUT-by-CUT) — >1 shot cắt bằng "Cut to"/"Lens switch to", mỗi shot khóa lại @tag để không drift danh tính. MOTION tả tư thế START→END + 1 chi tiết vật lý (cấm động từ mơ hồ). CONSTRAINTS thêm 1 positive lock riêng block (danh tính @tag + vị trí + số lượng). ` +
      `Dựng prompt VIDEO (STYLE/SCENE/MOTION/AUDIO/CONSTRAINTS + NEGATIVE dự phòng + TEXT_OVERLAY nếu cần chữ, target BytePlus/Seedance) cho mỗi block đã có prompt ảnh. ` +
      `Nhúng @tag ở trường scene + truyền mảng tags. Cuối cùng read_coverage để chắc không block nào thiếu video.`
  }
}

export interface GateResult {
  worker: string
  summary: string
  steps: number
  stage: string
}

/** Chạy 1 cổng thợ (1..3). GATE 0 dùng runGate0 riêng; GATE 4 dùng buildExport. */
export async function runGate(
  gateKey: keyof typeof GATES,
  projectId: number,
  onStep?: (s: AgentStep) => void
): Promise<GateResult> {
  const spec = GATES[gateKey]
  if (!spec) throw new Error(`Không có cổng: ${gateKey}`)

  const project = getProject(projectId)
  if (!project) throw new Error('Không tìm thấy dự án')

  const layerParts = spec.layers.map((f) => readSkillOptional(f)).filter(Boolean)

  // Genre à-la-carte (TÙY CHỌN): đọc 1 lần, dùng cho cả craft tự-rút.
  let genreId: string | null = null
  if (project.params_json) {
    try {
      genreId = (JSON.parse(project.params_json) as { genre?: string }).genre ?? null
    } catch (e) {
      console.warn('[danh-script] runGate: params_json hỏng, bỏ qua genre', e)
    }
  }
  // Genre nạp TĨNH cho scriptwright (nhịp kể là cốt lõi ở đây).
  if (gateKey === 'scriptwright' && genreId) {
    const genreSkill = readSkillOptional(`genres/${genreId}.md`)
    if (genreSkill) layerParts.push(genreSkill)
  }

  // ⭐ Kho CRAFT tự-rút khớp bước + style + genre (loại story ở scriptwright vì đã nạp tĩnh).
  let craft = availableCraftFor(spec.stage, project.style_id, genreId)
  if (gateKey === 'scriptwright') craft = craft.filter((c) => c.axis !== 'story')
  const craftBlock = availableSkillsPrompt(craft)

  const system = injectOutputIntent(
    injectStyleAnchor(
      composeSystem(loadExecutionSkill(project.pipeline, spec.worker), ...layerParts, craftBlock),
      project.style_id
    ),
    projectId
  )

  const ideal = JSON.parse(project.ideal_json) as { raw: string }
  const userPrompt = spec.buildPrompt({ idealRaw: ideal.raw })

  const toolNames = craft.length ? [...spec.tools, 'list_skills', 'read_skill_file'] : spec.tools

  const result = await runAgent({
    system,
    userPrompt,
    tools: toolsFor(toolNames),
    ctx: { projectId },
    maxSteps: 24,
    temperature: 0.6,
    onStep
  })

  updateProjectStage(projectId, spec.stage)
  return { worker: spec.worker, summary: result.finalText, steps: result.steps, stage: spec.stage }
}

// ---------------- Tiền-ideal: persona + research (Nhóm A) ----------------

export interface PrepResult {
  persona: string // tóm tắt personaBuilder
  research: string // tóm tắt researcher
  steps: number
}

/**
 * Chạy 2 thợ Nhóm A TRƯỚC GATE 0: personaBuilder rồi researcher.
 * Cả hai chỉ đắp ideal.brief (target/angle/research_notes) — không dựng cảnh.
 * Bỏ qua an toàn nếu chưa có .md thợ (trả tóm tắt rỗng).
 */
export async function runPrep(
  projectId: number,
  onStep?: (s: AgentStep) => void
): Promise<PrepResult> {
  const project = getProject(projectId)
  if (!project) throw new Error('Không tìm thấy dự án')

  const ideal = JSON.parse(project.ideal_json) as { raw: string }
  let totalSteps = 0

  async function runWorker(worker: string, task: string): Promise<string> {
    const soul = loadExecutionSkill(project!.pipeline, worker)
    const res = await runAgent({
      system: soul,
      userPrompt: `${task}\n\nIDEAL:\n${ideal.raw}`,
      tools: toolsFor(['read_ideal', 'write_ideal_brief']),
      ctx: { projectId },
      maxSteps: 10,
      temperature: 0.5,
      onStep
    })
    totalSteps += res.steps
    return res.finalText
  }

  const persona = await runWorker(
    'persona',
    'Xác định đối tượng + góc cảm xúc + trigger + thông điệp lõi. Bắt đầu bằng read_ideal, ghi qua write_ideal_brief.'
  )
  const research = await runWorker(
    'research',
    'Soát độ thật các khẳng định trong ideal (giữ/gắn cờ/bỏ) + bổ sung trend nếu chắc. Bắt đầu bằng read_ideal, ghi qua write_ideal_brief.'
  )

  return { persona, research, steps: totalSteps }
}

// ---------------- Kiểm duyệt A/B/C/D ----------------

export interface ReviewResult {
  grade: 'A' | 'B' | 'C' | 'D' | '?'
  report: string
}

/**
 * Dòng "Ý đồ đầu ra" prepend vào snapshot MỌI gate sau gate0 — cho reviewer áp
 * được luật phạt CTA 2 chiều (reviewGate không có read tool, chỉ thấy snapshot).
 * Không có output_intent → trả '' (reviewer rơi về mặc định kể chuyện).
 */
function outputIntentHeader(projectId: number): string {
  try {
    const project = getProject(projectId)
    if (project?.ideal_json) {
      const ideal = JSON.parse(project.ideal_json) as { brief?: { output_intent?: string } }
      const v = ideal.brief?.output_intent?.trim()
      if (v) return `Ý đồ đầu ra: ${v}\n\n`
    }
  } catch (e) {
    console.warn('[danh-script] outputIntentHeader: ideal_json hỏng, bỏ header', e)
  }
  return ''
}

/** Gom sản phẩm của 1 cổng thành text để reviewer chấm. */
function snapshotForGate(projectId: number, gateStage: string): string {
  // gate0 tự chứa output_intent trong Ý đồ chốt; các gate sau prepend header dùng chung.
  const body = snapshotBody(projectId, gateStage)
  return gateStage === 'gate0_ideal' ? body : outputIntentHeader(projectId) + body
}

function snapshotBody(projectId: number, gateStage: string): string {
  const scenes = listScenes(projectId)
  if (gateStage === 'gate0_ideal') {
    // GATE 0 (mới) = "Ý đồ chốt" trong ideal.brief, KHÔNG phải danh sách cảnh.
    const project = getProject(projectId)
    const ideal = project ? (JSON.parse(project.ideal_json) as { raw: string; brief?: IdealBrief }) : null
    const b = ideal?.brief
    if (!b) return '(chưa có Ý đồ chốt)'
    const lines: string[] = []
    if (b.core_message) lines.push(`Thông điệp lõi: ${b.core_message}`)
    if (b.target) lines.push(`Đối tượng: ${b.target}`)
    if (b.angle) lines.push(`Góc cảm xúc: ${b.angle}`)
    if (b.mood) lines.push(`Tông/mood: ${b.mood}`)
    if (b.genre) lines.push(`Thể loại: ${b.genre}`)
    if (b.duration_hint) lines.push(`Độ dài dự kiến: ${b.duration_hint}`)
    if (b.output_intent) lines.push(`Ý đồ đầu ra: ${b.output_intent}`)
    if (b.triggers?.length) lines.push(`Trigger: ${b.triggers.join(', ')}`)
    if (b.research_notes?.length) lines.push(`Research: ${b.research_notes.join(' | ')}`)
    if (b.claims_flagged?.length) lines.push(`Cờ khẳng định: ${b.claims_flagged.join(' | ')}`)
    return `Ý ĐỒ:\n${ideal?.raw ?? ''}\n\nÝ ĐỒ CHỐT:\n${lines.join('\n')}`
  }
  const plan = getPlanArtifacts(projectId)

  if (gateStage === 'gate1a_draft') {
    return `KỊCH BẢN NHÁP:\n${plan.draft ?? '(chưa có nháp)'}`
  }
  if (gateStage === 'gate1b_skeleton') {
    if (!plan.skeleton) return '(chưa có khung xương)'
    return (
      `KHUNG XƯƠNG: ${plan.skeleton.logline}\n` +
      `Nhịp: ${plan.skeleton.beats.map((b) => `${b.order}.${b.role}:${b.summary}`).join(' | ')}\n` +
      (plan.skeleton.emotional_arc ? `Cảm xúc: ${plan.skeleton.emotional_arc}\n` : '') +
      (plan.skeleton.payoff ? `Trả bài: ${plan.skeleton.payoff}` : '')
    )
  }
  if (gateStage === 'gate1c_adaptation') {
    if (!plan.adaptation) return '(chưa có chiến lược chuyển thể)'
    return (
      `CHUYỂN THỂ: ${plan.adaptation.approach}\n` +
      `Cho xem đừng kể:\n${(plan.adaptation.show_dont_tell || []).map((x) => `• ${x}`).join('\n')}\n` +
      (plan.adaptation.tone ? `Tông: ${plan.adaptation.tone}` : '')
    )
  }
  if (gateStage === 'gate_director') {
    if (!plan.director) return '(chưa có quy hoạch đạo diễn)'
    return plan.director.scenes
      .map(
        (d) =>
          `Cảnh ${d.order}: ${d.line_count} thoại / ${d.char_count} chữ · cảm xúc ${d.emotion} (${d.emotion_intensity}/10)` +
          (d.transition ? ` · chuyển: ${d.transition}` : '')
      )
      .join('\n')
  }
  if (gateStage === 'gate_assets') {
    const assets = listAssetsFull(projectId)
    if (!assets.length) return '(chưa có nguyên liệu)'
    const vs = plan.visualSystem
    const head = vs
      ? `COLOR SCRIPT: ${(vs.color_script || []).map((c) => `C${c.scene_order}:${c.palette}`).join(' | ')}\n\n`
      : ''
    return (
      head +
      assets
        .map((a) => {
          const promptTag = a.gen_prompt ? '✓prompt' : '✗prompt'
          const derivs = a.derivatives.length ? ` +${a.derivatives.length} biến thể` : ''
          return `@${a.tag} (${a.role}) ${promptTag}${derivs}`
        })
        .join('\n')
    )
  }
  // gate1_script (legacy) + gate1d_script: khung xương + narration final
  if (gateStage === 'gate1_script' || gateStage === 'gate1d_script') {
    const head = plan.skeleton
      ? `KHUNG XƯƠNG: ${plan.skeleton.logline}\n` +
        `Nhịp: ${plan.skeleton.beats.map((b) => `${b.order}.${b.role}:${b.summary}`).join(' | ')}\n` +
        (plan.skeleton.emotional_arc ? `Cảm xúc: ${plan.skeleton.emotional_arc}\n` : '') +
        (plan.adaptation ? `CHUYỂN THỂ: ${plan.adaptation.approach}\n` : '') +
        '\n'
      : ''
    return head + scenes.map((s) => `Cảnh ${s.order_idx}: ${s.narration_vi}`).join('\n')
  }
  if (gateStage === 'gate_storyboard') {
    const parts: string[] = []
    for (const s of scenes) {
      const blocks = listBlocks(s.id)
      const shots = blocks
        .filter((b) => b.shot_panel_json)
        .map((b) => {
          const p = JSON.parse(b.shot_panel_json as string) as ShotPanel
          return `  • Shot ${s.order_idx}.${b.order_idx}: [${p.shot_size} / ${p.camera_angle} / ${p.camera_move}] ${p.subject} | ${p.action_start} → ${p.action_end} | ${p.duration_sec}s | @tag: ${(p.asset_tags || []).join(', ')}`
        })
      parts.push(`Cảnh ${s.order_idx}${shots.length ? ':\n' + shots.join('\n') : ' (CHƯA có shot phân cảnh)'}`)
    }
    return parts.join('\n')
  }
  // gate2/gate3: gom block
  const lines: string[] = []
  for (const s of scenes) {
    for (const b of listBlocks(s.id)) {
      if (gateStage === 'gate2_image') {
        lines.push(`Cảnh ${s.order_idx}.${b.order_idx}: ${b.image_prompt_en ?? '(trống)'}`)
      } else {
        lines.push(`Cảnh ${s.order_idx}.${b.order_idx}: ${b.video_prompt_json ?? '(trống)'}`)
      }
    }
  }
  return lines.join('\n')
}

/** reviewer.md chấm sản phẩm 1 cổng, trả grade + báo cáo Markdown. */
export async function reviewGate(projectId: number, gateStage: string): Promise<ReviewResult> {
  const project = getProject(projectId)
  if (!project) throw new Error('Không tìm thấy dự án')

  const system = readSkill('reviewer.md')
  const snapshot = snapshotForGate(projectId, gateStage)
  const userPrompt =
    `Chấm sản phẩm của cổng "${gateStage}" dưới đây theo thang A/B/C/D + red-line. ` +
    `Bắt đầu báo cáo bằng đúng định dạng "**Tổng: [X]**".\n\nSẢN PHẨM:\n${snapshot}`

  const report = await llmQueue.enqueue(() =>
    chat([{ role: 'user', content: userPrompt }], { system, maxTokens: 1200, temperature: 0.3 })
  )

  const m = report.match(/Tổng:\s*\[?([ABCD])\]?/i)
  const grade = (m ? (m[1].toUpperCase() as ReviewResult['grade']) : '?') as ReviewResult['grade']
  saveReview(projectId, gateStage, grade, report) // lưu DB — dùng chung cho nút duyệt tay + Sếp điều phối
  return { grade, report }
}

// ---------------- GATE 4: Xuất (không cần LLM) ----------------

export interface ExportBlock {
  scene_order: number
  block_order: number
  narration_vi: string
  image_prompt_en: string
  video_prompt: VideoPrompt | null
  asset_ids: number[] // ⭐ id nguyên liệu/biến thể block này dùng (bảng nối block_assets)
}

export interface ExportBundle {
  projectName: string
  styleId: string | null
  stylePrefix: string | null // ⭐ Style Prefix nguyên văn (anchor.md) — dán verbatim vào mọi prompt video
  tagMap: AssetTag[]
  blocks: ExportBlock[]
  skeleton: StorySkeleton | null
  adaptation: AdaptationStrategy | null
  director: DirectorPlan | null
  visualSystem: VisualSystem | null
  assets: AssetFull[]
}

/** Gom toàn bộ prompt + bảng @tag→ảnh thành bundle để UI hiển thị/copy. */
export function buildExport(projectId: number): ExportBundle {
  const project = getProject(projectId)
  if (!project) throw new Error('Không tìm thấy dự án')

  const blocks: ExportBlock[] = []
  for (const s of listScenes(projectId)) {
    for (const b of listBlocks(s.id) as Block[]) {
      blocks.push({
        scene_order: s.order_idx,
        block_order: b.order_idx,
        narration_vi: s.narration_vi ?? '',
        image_prompt_en: b.image_prompt_en ?? '',
        video_prompt: b.video_prompt_json ? (JSON.parse(b.video_prompt_json) as VideoPrompt) : null,
        asset_ids: listBlockAssets(b.id)
      })
    }
  }
  updateProjectStage(projectId, 'gate4_export')
  const plan = getPlanArtifacts(projectId)
  const stylePrefix = loadStyleAnchor(project.style_id).trim() || null
  return {
    projectName: project.name,
    styleId: project.style_id,
    stylePrefix,
    tagMap: projectTagMap(projectId),
    blocks,
    skeleton: plan.skeleton,
    adaptation: plan.adaptation,
    director: plan.director,
    visualSystem: plan.visualSystem,
    assets: listAssetsFull(projectId)
  }
}
