// ============================================================
// Danh Script — Engine hội thoại tinh chỉnh từng GATE (dùng chung 4 cổng)
// Mỗi cổng = linh hồn thợ + lớp skill + lớp _chat_protocol + history hội thoại.
// Agent HỎI khi thiếu, SỬA đúng chỗ khi được yêu cầu; không tự "qua cổng".
// ============================================================
import { runAgent, type AgentStep } from '../core/agentRunner'
import {
  loadExecutionSkill,
  readSkillOptional,
  composeSystem,
  injectStyleAnchor,
  injectOutputIntent
} from '../core/skillLoader'
import { toolsFor } from '../tools'
import { workerSpec } from './workerSpecs'
import { extractTags, checkTagsExist } from './tagGuard'
import {
  getProject,
  loadGateChat,
  saveGateChat,
  updateProjectStage,
  coverageReport,
  assetCoverage,
  listScenes,
  listBlocks
} from '../db'

/** Đặc tả 1 cổng hội thoại. */
interface ChatGateSpec {
  worker: string // tên _execution_<worker>.md
  tools: string[] // tool được cấp (đã kèm read_scenes/read_blocks)
  layers: string[] // mảnh skill chung nạp kèm
  kickoff: string // lời tự-gửi khi mở cổng lần đầu (agent chào + hỏi)
}

// Tool đọc trạng thái cấp cho MỌI cổng để agent xem trước khi sửa.
// read_plan để mọi cổng hiểu mạch chuyện (khung xương + chiến lược) đã chốt ở GATE 1.
const READ_TOOLS = ['read_ideal', 'read_scenes', 'read_blocks', 'read_assets', 'read_plan']

const CHAT_GATES: Record<string, ChatGateSpec> = {
  gate0_ideal: {
    worker: 'ideaAnalyst',
    tools: ['read_ideal', 'write_ideal_brief'],
    layers: [],
    kickoff:
      'Người dùng vừa mở cổng Ý ĐỒ. Hãy chào ngắn, đọc ideal (read_ideal), rồi LÀM RÕ & CHỐT Ý ĐỒ — ' +
      'CHƯA phân cảnh, CHƯA tạo @tag. Ghi "Ý đồ chốt" qua write_ideal_brief: thông điệp lõi (1 câu) · ' +
      'đối tượng + chân dung · góc cảm xúc + đường cong · tông/mood tổng · thể loại gợi ý · độ dài dự kiến. ' +
      'Nếu ideal mơ hồ thì HỎI 1–2 câu quan trọng nhất trước khi chốt. Việc phân cảnh sẽ làm ở bước Kịch bản.'
  },
  // ── KỊCH BẢN tách 4 bước chat độc lập (mô hình Toonflow) ──
  gate1a_draft: {
    worker: 'scriptDraft',
    tools: [...READ_TOOLS, 'write_draft', 'read_draft'],
    layers: ['storyboard-craft.md'],
    kickoff:
      'Người dùng vừa mở cổng NHÁP KỊCH BẢN. BƯỚC 1 BẮT BUỘC: gọi read_ideal để đọc TOÀN VĂN ideal + Ý ĐỒ CHỐT (thông điệp lõi · đối tượng · góc cảm xúc · mood · thể loại · độ dài) đã chốt ở GATE 0. ' +
      'Rồi viết 1 bản KỊCH BẢN NHÁP gọn (mạch kể + tinh thần từng đoạn, CHƯA cần lời thoại chỉn chu, CHƯA phân cảnh cứng) để CHỐT HƯỚNG với người dùng — bám sát Ý đồ chốt. ' +
      'Ghi qua write_draft. Hỏi 1–2 câu nếu hướng/tông chưa rõ. Đây là bước thăm dò — đừng viết quá dài.'
  },
  gate1b_skeleton: {
    worker: 'skeletonWright',
    tools: [...READ_TOOLS, 'read_draft', 'write_skeleton'],
    layers: ['storyboard-craft.md'],
    kickoff:
      'Người dùng vừa mở cổng KHUNG XƯƠNG. BƯỚC 1 BẮT BUỘC: gọi read_draft + read_ideal để đọc TOÀN VĂN nháp kịch bản + Ý đồ chốt. ' +
      'Rồi chốt KHUNG XƯƠNG qua write_skeleton: logline + các nhịp hook→thân→cao trào→kết + đường cong cảm xúc + điểm trả bài. ' +
      'Bám sát nháp đã chốt, không đổi hướng. Hỏi nếu điểm trả bài chưa rõ.'
  },
  gate1c_adaptation: {
    worker: 'adaptWright',
    tools: [...READ_TOOLS, 'read_draft', 'write_adaptation'],
    layers: ['adaptation-craft.md'],
    kickoff:
      'Người dùng vừa mở cổng CHUYỂN THỂ. Hãy chào ngắn, đọc khung xương + nháp (read_plan/read_draft), ' +
      'rồi viết CHIẾN LƯỢC CHUYỂN THỂ qua write_adaptation: mỗi thông điệp ideal → hành động/hình ảnh CỤ THỂ ("cho xem đừng kể") + motif hình + tông + cạm bẫy cần né. ' +
      'Hỏi nếu còn chỗ trừu tượng chưa quy ra được hình.'
  },
  gate1d_script: {
    worker: 'scriptFinal',
    tools: [
      ...READ_TOOLS,
      'read_coverage',
      'read_draft',
      'write_scene_context',
      'write_script',
      'plan_shots'
    ],
    layers: ['scene-analysis.md', 'storyboard-craft.md', 'adaptation-craft.md'],
    kickoff:
      'Người dùng vừa mở cổng KỊCH BẢN FINAL. BƯỚC 1 BẮT BUỘC: đọc TOÀN VĂN khung xương + chiến lược chuyển thể (read_plan) + nháp (read_draft). ' +
      'Rồi làm TUẦN TỰ: ① write_scene_context TỪNG cảnh (order_idx tăng dần từ 1) — dựng bối cảnh riêng mỗi cảnh (era/setting/wardrobe/props/mood), bottom-up không ép khuôn. ' +
      '② write_script (narration tiếng Việt CHỐT từng cảnh, bám khung + chiến lược). ③ plan_shots (quy hoạch shot mỗi cảnh — chia block rõ ý đồ để bước sau dựng ảnh/video không bỏ sót). ' +
      'PHẢI tạo cảnh (①) TRƯỚC khi plan_shots. Đây là narration CHỐT — viết chỉn chu. Hỏi nếu còn phân vân về hướng 1 cảnh.'
  },
  // ── QUY HOẠCH ĐẠO DIỄN (director_plan) — tách cảnh + đếm thoại + chấm cảm xúc ──
  gate_director: {
    worker: 'directorPlanner',
    tools: [...READ_TOOLS, 'read_script_full', 'write_director_plan'],
    layers: workerSpec('directorPlanner').layers,
    kickoff:
      'Người dùng vừa mở cổng QUY HOẠCH ĐẠO DIỄN. Hãy chào ngắn, đọc toàn bộ narration final (read_script_full), ' +
      'rồi PHÂN TÍCH (không sáng tạo nội dung mới): với MỖI cảnh — đếm số câu thoại (line_count), đếm số chữ (char_count, ~4 chữ/giây để ước thời lượng), ' +
      'chấm cảm xúc chủ đạo + độ đậm 0–10, và thiết kế CHUYỂN CẢNH sang cảnh sau (cắt/mờ/match-cut). Ghi qua write_director_plan. ' +
      'Chỉ tách & phân tích — KHÔNG viết lại lời thoại.'
  },
  // ── NGUYÊN LIỆU (Visual System) — tách từ kịch bản → sinh PROMPT tạo ảnh ──
  gate_assets: {
    worker: 'assetDeriver',
    tools: [
      ...READ_TOOLS,
      'read_script_full',
      'read_asset_coverage',
      'derive_assets',
      'write_asset_prompt',
      'save_derived_asset',
      'write_visual_system'
    ],
    layers: workerSpec('assetDeriver').layers,
    kickoff:
      'Người dùng vừa mở cổng NGUYÊN LIỆU. Hãy chào ngắn, đọc toàn bộ kịch bản (read_script_full) + cảnh + @tag đã có (read_assets). ' +
      'Làm TUẦN TỰ:\n' +
      '① derive_assets — TÁCH nguyên liệu TỪ kịch bản (nhân vật/bối cảnh/đạo cụ lặp lại), KHÔNG bịa thứ kịch bản không có.\n' +
      '② write_asset_prompt cho MỖI asset gốc — sinh PROMPT tạo ảnh: nhân vật = character sheet 4-view (nền #F8F4E8, mặt mộc, khai báo tỉ lệ đầu-thân); bối cảnh = multi-angle KHÔNG người; đạo cụ = lưới 2×2.\n' +
      '③ save_derived_asset cho biến thể cần thiết (nhân vật: biến thể trang phục/trạng thái; bối cảnh: thời gian/thời tiết/góc; đạo cụ KHÔNG phái sinh) — mỗi asset 1–5 biến thể, "thà thiếu còn hơn thừa".\n' +
      '④ write_visual_system — Color Script (tone màu từng cảnh) + ánh sáng + chất liệu toàn phim.\n' +
      'Người dùng sẽ copy prompt sang Coco tạo ảnh rồi upload về — nên prompt phải đủ để tạo ảnh ngay. Cuối cùng gọi read_asset_coverage để soát asset nào còn thiếu prompt.'
  },
  gate2_image: {
    worker: 'imgPrompter',
    tools: [...READ_TOOLS, 'read_coverage', 'save_asset', 'write_image_prompt'],
    layers: workerSpec('imgPrompter').layers,
    kickoff:
      'Người dùng vừa mở cổng PROMPT ẢNH. Hãy chào ngắn, đọc ideal + cảnh + shot đã quy hoạch (read_blocks) + @tag (read_assets), ' +
      'rồi dựng prompt ảnh khung đầu (tiếng Anh, 3 đoạn, nhúng @tag) cho MỖI block đã có shot_desc. ' +
      'Cuối cùng gọi read_coverage để chắc KHÔNG block nào thiếu ảnh. Hỏi nếu còn điểm chưa rõ.'
  },
  gate3_video: {
    worker: 'vidPrompter',
    tools: [...READ_TOOLS, 'read_coverage', 'write_video_prompt'],
    layers: workerSpec('vidPrompter').layers,
    kickoff:
      'Người dùng vừa mở cổng PROMPT VIDEO. Hãy chào ngắn, đọc ideal + block đã có prompt ảnh (read_blocks) + @tag (read_assets), rồi ' +
      'dựng prompt video (STYLE/SCENE/MOTION/AUDIO/CONSTRAINTS + TEXT_OVERLAY nếu cần) cho MỖI block. ' +
      'Cuối cùng gọi read_coverage để chắc KHÔNG block nào thiếu video. Hỏi nếu chưa rõ.'
  }
}

export interface GateChatReply {
  reply: string
}

/** Danh sách gate_stage hợp lệ cho hội thoại. */
export function isChatGate(gateStage: string): boolean {
  return gateStage in CHAT_GATES
}

/**
 * Chạy 1 lượt hội thoại của 1 cổng.
 * - userMessage = null  → mở cổng lần đầu, tự gửi kickoff (agent chào + hỏi/dựng).
 * - userMessage = chuỗi → lời người dùng lượt này (yêu cầu sửa / trả lời câu hỏi).
 * Nạp lịch sử từ DB, chạy agent, lưu lại lịch sử mới, trả text agent nói.
 */
export async function runGateChat(
  projectId: number,
  gateStage: string,
  userMessage: string | null,
  onStep?: (s: AgentStep) => void
): Promise<GateChatReply> {
  const spec = CHAT_GATES[gateStage]
  if (!spec) throw new Error(`Cổng không hỗ trợ hội thoại: ${gateStage}`)

  const project = getProject(projectId)
  if (!project) throw new Error('Không tìm thấy dự án')

  const layerParts = spec.layers.map((f) => readSkillOptional(f)).filter(Boolean)

  // Genre à-la-carte (TÙY CHỌN) cho cổng kịch bản final.
  if (gateStage === 'gate1d_script' && project.params_json) {
    try {
      const genre = (JSON.parse(project.params_json) as { genre?: string }).genre
      if (genre) {
        const genreSkill = readSkillOptional(`genres/${genre}.md`)
        if (genreSkill) layerParts.push(genreSkill)
      }
    } catch (e) {
      console.warn('[danh-script] runGateChat: params_json hỏng, bỏ qua genre', e)
    }
  }

  // Lớp giao thức hội thoại luôn nằm cuối để "đè" cách hành xử.
  const chatProtocol = readSkillOptional('free/_chat_protocol.md')
  const system = injectOutputIntent(
    injectStyleAnchor(
      composeSystem(
        loadExecutionSkill(project.pipeline, spec.worker),
        ...layerParts,
        chatProtocol
      ),
      project.style_id
    ),
    projectId
  )

  const history = loadGateChat(projectId, gateStage) as Array<{ role: string; content: unknown }>
  const userTurn = userMessage ?? spec.kickoff

  const result = await runAgent({
    system,
    userPrompt: userTurn,
    tools: toolsFor(spec.tools),
    ctx: { projectId },
    history,
    maxSteps: 14,
    temperature: 0.6,
    onStep
  })

  saveGateChat(projectId, gateStage, result.messages)
  return { reply: result.finalText }
}

/** 1 lượt hội thoại hiển thị (đã bỏ khối tool). */
export interface ChatTurn {
  role: 'user' | 'assistant'
  text: string
}

/** Rút text hiển thị từ 1 message thô (bỏ tool_use/tool_result, gộp các khối text). */
function turnText(content: unknown): string {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  return content
    .filter((c) => c && typeof c === 'object' && (c as { type?: string }).type === 'text')
    .map((c) => (c as { text?: string }).text ?? '')
    .join('')
    .trim()
}

/**
 * Đọc lịch sử hội thoại của 1 cổng thành bong bóng user/assistant cho UI.
 * - Bỏ lượt user ĐẦU TIÊN (kickoff tự-gửi, không phải người dùng gõ).
 * - Bỏ lượt user chỉ chứa tool_result (không có text).
 */
export function gateChatHistory(projectId: number, gateStage: string): ChatTurn[] {
  const raw = loadGateChat(projectId, gateStage) as Array<{ role: string; content: unknown }>
  const turns: ChatTurn[] = []
  let skippedKickoff = false
  for (const m of raw) {
    const text = turnText(m.content)
    if (m.role === 'user') {
      if (!skippedKickoff) {
        skippedKickoff = true // lượt user đầu = kickoff → ẩn
        continue
      }
      if (!text) continue // user chỉ chứa tool_result → bỏ
      turns.push({ role: 'user', text })
    } else if (m.role === 'assistant') {
      if (!text) continue // assistant chỉ gọi tool, chưa nói → bỏ
      turns.push({ role: 'assistant', text })
    }
  }
  return turns
}

/**
 * Chốt cổng: cập nhật stage dự án (người dùng bấm "Chốt & sang cổng sau").
 * ⭐ Với gate ảnh/video: chặn nếu còn block trống (cảnh chưa có block, hoặc block thiếu ảnh/video)
 * — đây là lá chắn chống lỗi "(trống — chưa dựng)".
 */
export function confirmGate(projectId: number, gateStage: string): void {
  if (!isChatGate(gateStage)) throw new Error(`Cổng không hợp lệ: ${gateStage}`)

  // ⭐ Cổng NGUYÊN LIỆU: chặn chốt nếu còn asset thiếu prompt sinh ảnh.
  if (gateStage === 'gate_assets') {
    const cov = assetCoverage(projectId)
    if (cov.total === 0) {
      throw new Error(
        'Chưa thể chốt cổng — chưa có nguyên liệu nào. Hãy nhắn agent "tách nguyên liệu từ kịch bản" trước.'
      )
    }
    if (cov.missingPrompt.length) {
      throw new Error(
        `Chưa thể chốt cổng — còn asset THIẾU prompt sinh ảnh: ${cov.missingPrompt.join(', ')}\n` +
          `Hãy nhắn agent "sinh prompt cho các asset còn thiếu" rồi chốt lại. ` +
          `(Ảnh có thể upload sau — chỉ prompt là bắt buộc để qua cổng.)`
      )
    }
    updateProjectStage(projectId, gateStage)
    return
  }

  if (gateStage === 'gate2_image' || gateStage === 'gate3_video') {
    const need: 'image' | 'video' = gateStage === 'gate2_image' ? 'image' : 'video'
    const cov = coverageReport(projectId)
    const problems: string[] = []
    if (cov.scenesNoBlock.length) {
      problems.push(`Cảnh chưa có shot nào: ${cov.scenesNoBlock.join(', ')}`)
    }
    const missing = cov.gaps.filter((g) => g.missing.includes(need))
    if (missing.length) {
      const label = need === 'image' ? 'ảnh' : 'video'
      const list = missing.map((g) => `${g.scene_order}.${g.block_order}`).join(', ')
      problems.push(`Block chưa có prompt ${label}: ${list}`)
    }
    // ⭐ Cờ mềm @tag: liệt kê @tag nhúng trong prompt mà KHÔNG có asset (gõ sai / mồ côi).
    // Chỉ CẢNH BÁO qua console — không cứng chặn (tránh false-positive cảnh không người).
    const orphanTags = new Set<string>()
    for (const s of listScenes(projectId)) {
      for (const b of listBlocks(s.id)) {
        const text =
          need === 'image' ? (b.image_prompt_en ?? '') : (b.video_prompt_json ?? '')
        const tags = extractTags(text)
        if (tags.length) {
          for (const m of checkTagsExist(projectId, tags).missing) orphanTags.add(m)
        }
      }
    }
    if (orphanTags.size) {
      console.warn(
        `[danh-script] confirmGate ${gateStage}: @tag mồ côi (không có asset): ${[...orphanTags].join(', ')}`
      )
    }
    if (problems.length) {
      throw new Error(
        `Chưa thể chốt cổng — còn thiếu:\n• ${problems.join('\n• ')}\n` +
          `Hãy nhắn agent dựng nốt (hoặc "dựng hết các block còn trống") rồi chốt lại.`
      )
    }
  }

  updateProjectStage(projectId, gateStage)
}
