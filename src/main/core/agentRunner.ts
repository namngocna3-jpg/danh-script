// ============================================================
// Danh Script — Chạy 1 agent-thợ (mỏ #1, vỏ 3 tầng mượn Toonflow)
// Vòng lặp tool-use: LLM ↔ tool, mọi lời gọi qua queue 800ms.
// Tầng Decision/Supervision là agent KHÔNG có tool ghi (chỉ đọc/chấm).
// ============================================================
import { chatToolTurn, defaultConfig, type ModelConfig } from './llmGateway'
import { llmQueue } from './queue'
import {
  schemasOf,
  findTool,
  type ToolDef,
  type ToolContext
} from '../tools'

export interface RunAgentOptions {
  system: string // linh hồn .md đã nạp
  userPrompt: string // lệnh từ tầng Decision (≤100 chữ) hoặc yêu cầu cụ thể
  tools: ToolDef[] // nhóm tool được cấp cho thợ này
  ctx: ToolContext // buộc trong 1 dự án
  maxSteps?: number // trần vòng lặp chống loop vô hạn
  temperature?: number
  cfg?: ModelConfig
  onStep?: (info: AgentStep) => void // callback tiến độ (stream ra UI sau)
  history?: Array<{ role: string; content: unknown }> // lịch sử hội thoại lượt trước (chat-gate)
}

export interface AgentStep {
  step: number
  kind: 'text' | 'tool_call' | 'tool_result' | 'done'
  detail: string
}

export interface RunAgentResult {
  finalText: string
  steps: number
  toolCalls: Array<{ name: string; input: unknown; output: unknown }>
  messages: Array<{ role: string; content: unknown }> // toàn bộ lịch sử sau lượt chạy (để lưu chat-gate)
}

/**
 * Chạy agent tới khi LLM ngừng gọi tool (stop_reason != tool_use) hoặc chạm maxSteps.
 * Trả text cuối + nhật ký tool.
 */
export async function runAgent(opts: RunAgentOptions): Promise<RunAgentResult> {
  const maxSteps = opts.maxSteps ?? 12
  const cfg = opts.cfg ?? defaultConfig()
  const toolSchemas = schemasOf(opts.tools)

  // Chat-gate: tiếp nối lịch sử lượt trước (nếu có) rồi thêm lời người dùng lượt này.
  const messages: Array<{ role: string; content: unknown }> = [
    ...(opts.history ?? []),
    { role: 'user', content: opts.userPrompt }
  ]
  const toolCalls: RunAgentResult['toolCalls'] = []
  let finalText = ''
  let step = 0

  while (step < maxSteps) {
    step++
    // Mỗi lượt LLM đi qua hàng đợi 800ms + timeout/retry
    const turn = await llmQueue.enqueue(() =>
      chatToolTurn(
        messages,
        toolSchemas,
        { system: opts.system, temperature: opts.temperature, maxTokens: 4096 },
        cfg
      )
    )

    if (turn.text) {
      finalText = turn.text
      opts.onStep?.({ step, kind: 'text', detail: turn.text.slice(0, 200) })
    }

    // Không còn yêu cầu tool → xong. Đẩy lượt assistant cuối vào lịch sử để lưu chat-gate.
    if (turn.stopReason !== 'tool_use' || turn.toolUses.length === 0) {
      if (turn.rawContent.length) messages.push({ role: 'assistant', content: turn.rawContent })
      opts.onStep?.({ step, kind: 'done', detail: finalText.slice(0, 200) })
      break
    }

    // Đẩy khối assistant (chứa tool_use) vào lịch sử
    messages.push({ role: 'assistant', content: turn.rawContent })

    // Chạy từng tool, gom tool_result
    const toolResults: unknown[] = []
    for (const use of turn.toolUses) {
      opts.onStep?.({
        step,
        kind: 'tool_call',
        detail: `${use.name}(${JSON.stringify(use.input).slice(0, 120)})`
      })
      const def = findTool(opts.tools, use.name)
      let output: unknown
      let isError = false
      try {
        if (!def) throw new Error(`Tool không tồn tại: ${use.name}`)
        // await: handler đồng bộ trả chính nó; handler điều phối (thợ con) trả Promise.
        output = await def.handler(use.input, opts.ctx)
      } catch (e) {
        isError = true
        output = { error: e instanceof Error ? e.message : String(e) }
      }
      toolCalls.push({ name: use.name, input: use.input, output })
      opts.onStep?.({
        step,
        kind: 'tool_result',
        detail: `${use.name} → ${JSON.stringify(output).slice(0, 120)}`
      })
      toolResults.push({
        type: 'tool_result',
        tool_use_id: use.id,
        content: JSON.stringify(output),
        ...(isError ? { is_error: true } : {})
      })
    }

    // Đẩy tool_result vào lịch sử, lặp tiếp
    messages.push({ role: 'user', content: toolResults })
  }

  return { finalText, steps: step, toolCalls, messages }
}
