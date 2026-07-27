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
  maxTokens?: number // trần token MỖI lượt (mặc định 16384 — đủ cho lượt gọi NHIỀU tool song song, VD Final ghi 6 cảnh 1 lượt)
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
 * Làm sạch + đánh SỐ MỚI cho mọi cặp tool_use/tool_result trước khi gửi lên model.
 *
 * VÌ SAO: lịch sử hội thoại (chat-gate) được lưu nguyên xi vào DB rồi nạp lại mỗi
 * lượt. Nó chứa các `tool_use id` CŨ. Cổng gom 9router có cơ chế chống trùng
 * ("tool_use ids reset after 24s") → gửi lại id cũ trong 24s bị từ chối 400
 * (`messages.N: tool_use ids`). Đồng thời nếu lượt trước chạm maxSteps/bị ngắt,
 * history có thể còn khối tool_use MỒ CÔI (không có tool_result khớp) → cũng 400.
 *
 * Cách xử lý: (1) chỉ giữ cặp HỢP LỆ (tool_use có tool_result tương ứng, và ngược
 * lại); (2) cấp id MỚI DUY NHẤT cho mỗi cặp → không bao giờ đụng bộ nhớ chống trùng.
 * Trả về BẢN SAO — không đụng mảng gốc (vẫn lưu raw để nối lượt sau).
 */
function sanitizeToolHistory(
  messages: Array<{ role: string; content: unknown }>
): Array<{ role: string; content: unknown }> {
  type Block = { type?: string; id?: string; tool_use_id?: string; [k: string]: unknown }
  const useIds = new Set<string>()
  const resultIds = new Set<string>()
  for (const m of messages) {
    if (!Array.isArray(m.content)) continue
    for (const b of m.content as Block[]) {
      if (b?.type === 'tool_use' && typeof b.id === 'string') useIds.add(b.id)
      if (b?.type === 'tool_result' && typeof b.tool_use_id === 'string')
        resultIds.add(b.tool_use_id)
    }
  }
  // Hợp lệ = id xuất hiện ở CẢ tool_use lẫn tool_result.
  const valid = new Set([...useIds].filter((id) => resultIds.has(id)))
  const remap = new Map<string, string>()
  let n = 0
  for (const id of valid) remap.set(id, `tu_${n++}`)

  const out: Array<{ role: string; content: unknown }> = []
  for (const m of messages) {
    if (!Array.isArray(m.content)) {
      out.push(m)
      continue
    }
    const blocks: Block[] = []
    for (const b of m.content as Block[]) {
      if (b?.type === 'tool_use') {
        if (b.id && valid.has(b.id)) blocks.push({ ...b, id: remap.get(b.id) })
        // bỏ tool_use mồ côi
      } else if (b?.type === 'tool_result') {
        if (b.tool_use_id && valid.has(b.tool_use_id))
          blocks.push({ ...b, tool_use_id: remap.get(b.tool_use_id) })
        // bỏ tool_result mồ côi
      } else {
        blocks.push(b)
      }
    }
    if (blocks.length) out.push({ role: m.role, content: blocks })
    // message rỗng sau khi lọc → loại bỏ
  }
  return out
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

  // ⭐ ĐẾM LỖI LẶP — chống thợ "dậm chân tại chỗ".
  // Ca thật: tool trả `only.map is not a function`, thợ đoán nhầm là sai TÊN tool nên
  // gọi lại y hệt ~40 lượt liền, cháy sạch maxSteps mà không ghi được block nào. LLM
  // không tự nhận ra mình lặp vì mỗi lượt nó chỉ thấy 1 tool_result. Nên app phải nói
  // thẳng vào mặt nó: "lỗi này lặp lần thứ N rồi, ĐỔI CÁCH ĐI".
  const errStreak = new Map<string, number>()
  let loopBreak = ''

  while (step < maxSteps) {
    step++
    // Mỗi lượt LLM đi qua hàng đợi 800ms + timeout/retry.
    // ⭐ Làm sạch + đánh id MỚI cho tool_use/tool_result trước khi gửi (chống 400
    //    "tool_use ids" của 9router + loại khối mồ côi từ history cũ).
    const sanitized = sanitizeToolHistory(messages)
    const turn = await llmQueue.enqueue(
      () =>
        chatToolTurn(
          sanitized,
          toolSchemas,
          { system: opts.system, temperature: opts.temperature, maxTokens: opts.maxTokens ?? 16384 },
          cfg
        ),
      // Nhà cung cấp treo/chậm → hàng đợi tự thử lại: báo UI để không đứng câm ở "0 bước".
      (info) => {
        // Log lỗi GỐC ra terminal để biết chậm vì gì (503/429/timeout/reset…).
        console.warn(
          `[LLM-RETRY] lần ${info.attempt}/${info.maxRetries} (chờ ${Math.round(
            info.waitMs / 1000
          )}s) — nguyên nhân: ${info.message}`
        )
        opts.onStep?.({
          step,
          kind: 'text',
          detail: `⏳ Nhà cung cấp phản hồi chậm — đang thử lại (lần ${info.attempt}/${info.maxRetries}, chờ ${Math.round(
            info.waitMs / 1000
          )}s)…`
        })
      }
    )

    if (turn.text) {
      finalText = turn.text
      opts.onStep?.({ step, kind: 'text', detail: turn.text.slice(0, 200) })
    }

    // 🔎 CHẨN ĐOÁN: in mỗi lượt để biết vì sao thợ dừng sớm (stopReason + có tool nào không).
    console.log(
      `[AGENT] step=${step} stop=${turn.stopReason} tools=${turn.toolUses
        .map((t) => t.name)
        .join(',') || '(none)'} textLen=${turn.text?.length ?? 0}`
    )

    // ⚠️ Bị cắt vì HẾT TOKEN (max_tokens) — không phải "xong". Nếu đang giữa lúc gọi tool,
    //    JSON input bị cụt → tool KHÔNG chạy được, im lặng thoát sẽ khiến người dùng tưởng
    //    đã dựng mà thực ra chưa ghi gì. Báo lỗi rõ để UI hiện + người dùng biết đường xử lý.
    if (turn.stopReason === 'max_tokens') {
      const half = turn.toolUses.length > 0
      throw new Error(
        half
          ? `Thợ bị CẮT vì chạm trần token khi đang gọi "${turn.toolUses
              .map((t) => t.name)
              .join(', ')}" (JSON dài quá 1 lượt). Đã nới trần lên ${opts.maxTokens ?? 16384}. ` +
              `Hãy bấm "▶ Bắt đầu"/gửi lại; nếu vẫn cắt, nhắn thợ "chia nhỏ, ghi từng phần".`
          : `Thợ bị CẮT vì chạm trần token khi đang soạn văn bản dài. Đã nới trần lên ${opts.maxTokens ?? 16384}. Hãy gửi lại.`
      )
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
        const msg = e instanceof Error ? e.message : String(e)
        // Bắt đúng thủ phạm FOREIGN KEY: in tool + input + dự án để lần sau lộ ngay
        // statement gây lỗi (không tốn lượt LLM). Các lỗi khác vẫn trả bình thường.
        if (/foreign key/i.test(msg)) {
          console.error(
            `[FK] Ràng buộc khóa ngoại khi chạy tool "${use.name}" (project=${opts.ctx.projectId}) — input: ${JSON.stringify(
              use.input
            ).slice(0, 400)}`
          )
        }
        // Đếm CHUỖI lỗi giống hệt (cùng tool + cùng thông báo). Kèm thẳng lời nhắc vào
        // tool_result vì đó là thứ DUY NHẤT LLM đọc được ở lượt sau.
        const key = `${use.name}::${msg}`
        const n = (errStreak.get(key) ?? 0) + 1
        errStreak.set(key, n)
        output = {
          error: msg,
          ...(n >= 2
            ? {
                lap_lai: `Lỗi Y HỆT này đã xảy ra ${n} lần với tool "${use.name}". ĐỪNG gọi lại y như cũ và ĐỪNG đoán là sai tên tool — tên tool đúng thì handler mới chạy được để sinh ra lỗi này. Hãy ĐỔI CÁCH: đọc lại mô tả tool, sửa KIỂU DỮ LIỆU của tham số (số phải là số, danh sách phải là MẢNG chứ không phải chuỗi), hoặc bỏ qua tham số tùy chọn đang gây lỗi. Nếu sau 1 lần đổi cách vẫn lỗi thì DỪNG gọi tool và báo lại cho người dùng nguyên văn lỗi này.`
              }
            : {})
        }
        if (n >= 4) {
          loopBreak =
            `⛔ DỪNG SỚM: tool "${use.name}" báo lỗi y hệt ${n} lần liên tiếp — "${msg}".\n` +
            `Thợ đang gọi lặp cùng một cách nên app cắt vòng lặp để khỏi cháy lượt vô ích.\n` +
            `Việc đã ghi được trước đó vẫn giữ nguyên. Hãy gửi nguyên văn lỗi này cho người phát triển, hoặc nhắn lại yêu cầu để thợ thử cách khác.`
        }
      }
      if (!isError) errStreak.clear()
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

    // Cắt vòng lặp lỗi: thoát HẲN để trả lời người dùng, không im lặng chạy tiếp tới maxSteps.
    if (loopBreak) {
      finalText = loopBreak
      opts.onStep?.({ step, kind: 'done', detail: 'Cắt vòng lặp: tool lỗi lặp lại' })
      break
    }
  }

  return { finalText, steps: step, toolCalls, messages }
}
