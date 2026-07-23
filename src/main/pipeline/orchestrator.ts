// ============================================================
// Danh Script — Tầng ĐIỀU PHỐI ("Sếp" _decision.md) — Pha 4
// Sếp = 1 agent chạy runAgent, được cấp THỢ CON làm tool (run_worker/review_gate).
// Sếp KHÔNG có tool ghi cảnh/prompt — chỉ điều phối + đọc trạng thái + gọi duyệt.
// _decision.md bắt Sếp DỪNG chờ người dùng mỗi cổng ⇒ 1 lượt chat ≈ 1 cổng.
// ============================================================
import { runAgent, type AgentStep } from '../core/agentRunner'
import { readSkill, composeSystem, injectStyleAnchor } from '../core/skillLoader'
import { findTool, ALL_TOOLS, type ToolDef } from '../tools'
import { getProject, loadGateChat, saveGateChat } from '../db'
import { runGateChat } from './gateChat'
import { reviewGate } from './gates'

/** gate ngắn (Sếp gọi) → gate_stage đầy đủ (DB/engine). */
const GATE_MAP: Record<string, string> = {
  gate0: 'gate0_ideal',
  gate1a: 'gate1a_draft',
  gate1b: 'gate1b_skeleton',
  gate1c: 'gate1c_adaptation',
  gate1d: 'gate1d_script',
  director: 'gate_director',
  assets: 'gate_assets',
  gate2: 'gate2_image',
  gate3: 'gate3_video'
}

/** Danh sách gate ngắn hợp lệ (dùng cho enum tool + kiểm tra). */
const GATE_KEYS = Object.keys(GATE_MAP)

export interface OrchestratorReply {
  reply: string
}

/**
 * Bộ tool điều phối, dựng bằng closure để capture projectId + onStep.
 * - run_worker: giao 1 cổng cho thợ con (chạy full tool-loop, ghi DB).
 * - review_gate: gọi giám sát A/B/C/D (tự lưu bảng reviews).
 * - đọc trạng thái: mượn read_scenes/read_blocks/read_plan/read_coverage từ ALL_TOOLS.
 */
function orchestratorTools(projectId: number, onStep?: (s: AgentStep) => void): ToolDef[] {
  const runWorker: ToolDef = {
    schema: {
      name: 'run_worker',
      description:
        'Giao 1 CỔNG cho thợ con làm (thợ tự dựng cảnh/kịch bản/prompt và ghi DB). ' +
        'gate: gate0 (chỉ ý đồ — KHÔNG tạo cảnh/@tag) | gate1a (nháp) | gate1b (khung xương) | gate1c (chuyển thể) | ' +
        'gate1d (kịch bản final) | director (quy hoạch đạo diễn) | assets (nguyên liệu) | ' +
        'gate2 (prompt ảnh) | gate3 (prompt video). ' +
        'instruction = lệnh NGẮN (≤100 chữ) nói LÀM GÌ, không nói làm thế nào. ' +
        'Trả về lời xác nhận ngắn của thợ — KHÔNG in lại toàn bộ nội dung.',
      input_schema: {
        type: 'object',
        properties: {
          gate: { type: 'string', enum: GATE_KEYS },
          instruction: { type: 'string', description: 'Lệnh ngắn ≤100 chữ giao cho thợ.' }
        },
        required: ['gate']
      }
    },
    handler: async (input) => {
      const stage = GATE_MAP[input.gate as string]
      if (!stage) return { error: `gate không hợp lệ: ${input.gate}` }
      const instruction = (input.instruction as string) || null
      const res = await runGateChat(projectId, stage, instruction, onStep)
      return { gate: input.gate, worker_reply: res.reply }
    }
  }

  const reviewGateTool: ToolDef = {
    schema: {
      name: 'review_gate',
      description:
        'Gọi GIÁM SÁT chấm sản phẩm 1 cổng theo thang A/B/C/D + red-line. ' +
        'CHỈ gọi sau khi thợ (run_worker) đã xong cổng đó. Trả grade + báo cáo Markdown.',
      input_schema: {
        type: 'object',
        properties: { gate: { type: 'string', enum: GATE_KEYS } },
        required: ['gate']
      }
    },
    handler: async (input) => {
      const stage = GATE_MAP[input.gate as string]
      if (!stage) return { error: `gate không hợp lệ: ${input.gate}` }
      const res = await reviewGate(projectId, stage)
      return { gate: input.gate, grade: res.grade, report: res.report }
    }
  }

  // Tool chỉ-đọc mượn nguyên từ ALL_TOOLS (Sếp kiểm tra thợ xong chưa trước khi duyệt).
  const readOnly = ['read_scenes', 'read_blocks', 'read_plan', 'read_coverage']
    .map((n) => findTool(ALL_TOOLS, n))
    .filter((t): t is ToolDef => Boolean(t))

  return [runWorker, reviewGateTool, ...readOnly]
}

const KICKOFF =
  'Người dùng vừa mở chế độ TỰ ĐỘNG. Hãy chào ngắn, đọc trạng thái hiện tại (read_scenes/read_blocks) ' +
  'để biết dự án đang ở đâu, rồi đề xuất bắt đầu/tiếp tục từ cổng nào và CHỜ người dùng xác nhận. ' +
  'Chưa có lệnh rõ thì đừng giao việc.'

/**
 * Chạy 1 lượt hội thoại của Sếp điều phối.
 * - userMessage = null  → mở chế độ, tự gửi kickoff (Sếp chào + đề xuất).
 * - userMessage = chuỗi → lệnh người dùng (VD "làm cổng ý đồ", "tiếp", "sửa cảnh 2").
 * Lịch sử lưu ở gate_chats với gate_stage = 'orchestrator'.
 */
export async function runOrchestrator(
  projectId: number,
  userMessage: string | null,
  onStep?: (s: AgentStep) => void
): Promise<OrchestratorReply> {
  const project = getProject(projectId)
  if (!project) throw new Error('Không tìm thấy dự án')

  const system = injectStyleAnchor(
    composeSystem(readSkill('free/_decision.md')),
    project.style_id
  )

  const history = loadGateChat(projectId, 'orchestrator') as Array<{
    role: string
    content: unknown
  }>
  const userTurn = userMessage ?? KICKOFF

  const result = await runAgent({
    system,
    userPrompt: userTurn,
    tools: orchestratorTools(projectId, onStep),
    ctx: { projectId },
    history,
    maxSteps: 16,
    temperature: 0.5,
    onStep
  })

  saveGateChat(projectId, 'orchestrator', result.messages)
  return { reply: result.finalText }
}
