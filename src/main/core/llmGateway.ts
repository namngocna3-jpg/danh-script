// ============================================================
// Danh Script — Cổng model LLM 1 mối (mỏ #10)
// MỌI lời gọi LLM (sinh prompt) đi qua đây. Đổi model = đổi config.
// ⚠️ KHÁC model RENDER (BytePlus ở Coco) — app KHÔNG gọi render.
// ============================================================

import type { LlmProvider } from '../../shared/types'
import { effectiveConfig } from './settings'
export type Provider = LlmProvider

export interface ModelConfig {
  provider: Provider
  modelName: string
  baseUrl: string
  apiKey: string
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatOptions {
  maxTokens?: number
  temperature?: number
  system?: string
}

// ---- Tool-use (Anthropic) ----
export interface ToolSchema {
  name: string
  description: string
  input_schema: Record<string, unknown>
}

export interface ToolUseRequest {
  id: string
  name: string
  input: Record<string, unknown>
}

/** Kết quả 1 lượt: hoặc text cuối, hoặc yêu cầu gọi tool. */
export interface TurnResult {
  text: string
  toolUses: ToolUseRequest[]
  stopReason: string
  /** Khối nội dung thô assistant vừa trả (để đẩy lại vào lịch sử hội thoại). */
  rawContent: unknown[]
}

/**
 * Cấu hình mặc định — đọc từ màn Cài đặt (userData) trước, rồi mới đến ENV.
 * Người dùng dán key + chọn provider/model trong app (settings.ts).
 * Vẫn cho phép override bằng ENV (dev) qua effectiveConfig().
 */
export function defaultConfig(): ModelConfig {
  const c = effectiveConfig()
  return {
    provider: c.provider,
    modelName: process.env.DS_MODEL || c.modelName,
    baseUrl: process.env.DS_BASE_URL || c.baseUrl,
    apiKey: c.apiKey
  }
}

/**
 * Gọi LLM. Trả về text. Ném lỗi khi thiếu key / HTTP lỗi
 * (queue.ts sẽ lo retry/timeout ở tầng trên).
 */
export async function chat(
  messages: ChatMessage[],
  opts: ChatOptions = {},
  cfg: ModelConfig = defaultConfig()
): Promise<string> {
  if (!cfg.apiKey) {
    throw new Error(
      'Chưa cấu hình API key. Đặt DS_API_KEY (hoặc ANTHROPIC_API_KEY).'
    )
  }
  if (cfg.provider === 'anthropic') {
    return chatAnthropic(messages, opts, cfg)
  }
  // 9router / beeknoee: giả định tương thích OpenAI Chat Completions
  return chatOpenAICompatible(messages, opts, cfg)
}

/**
 * Liệt kê model khả dụng qua endpoint OpenAI-compatible `{baseUrl}/models`.
 * Dùng cho cổng gom (9router/beeknoee) để người dùng chọn thay vì gõ tay.
 * Trả mảng id model đã sắp xếp. Ném lỗi rõ ràng nếu HTTP/parse hỏng.
 */
export async function listModels(cfg: ModelConfig = defaultConfig()): Promise<string[]> {
  const base = cfg.baseUrl.replace(/\/+$/, '')
  const res = await fetch(`${base}/models`, {
    method: 'GET',
    headers: {
      'content-type': 'application/json',
      // gửi cả 2 kiểu auth để chạy được cho mọi cổng gom
      ...(cfg.apiKey
        ? { authorization: `Bearer ${cfg.apiKey}`, 'x-api-key': cfg.apiKey }
        : {})
    }
  })
  if (!res.ok) {
    throw new Error(`${cfg.provider} /models ${res.status}: ${await res.text()}`)
  }
  const { raw } = await readModelResponse(res)
  // OpenAI: { data: [{ id }] } · vài cổng trả thẳng mảng string
  const j = raw as { data?: Array<{ id?: string } | string> } | Array<{ id?: string } | string>
  const arr = Array.isArray(j) ? j : (j.data ?? [])
  const ids = arr
    .map((m) => (typeof m === 'string' ? m : m?.id))
    .filter((s): s is string => typeof s === 'string' && s.length > 0)
  return Array.from(new Set(ids)).sort((a, b) => a.localeCompare(b))
}

/**
 * Một lượt gọi Anthropic có tool-use. `messages` là mảng khối thô Anthropic
 * (role + content[]), để agentRunner tự quản lịch sử tool_use/tool_result.
 * Chỉ hỗ trợ provider anthropic ở ĐỢT 1 (tool-use).
 */
export async function chatToolTurn(
  messages: Array<{ role: string; content: unknown }>,
  tools: ToolSchema[],
  opts: ChatOptions = {},
  cfg: ModelConfig = defaultConfig()
): Promise<TurnResult> {
  if (!cfg.apiKey) {
    throw new Error('Chưa cấu hình API key. Đặt DS_API_KEY (hoặc ANTHROPIC_API_KEY).')
  }
  // Tool-use đi qua Anthropic Messages API. Cổng gom (9router/beeknoee) cũng phơi
  // endpoint /v1/messages tương thích Anthropic → dùng chung, chỉ khác auth/URL.
  // ⭐ STREAM=true: với stream:false, 9router GOM xong TOÀN BỘ output (Director Bible
  //    dài) RỒI mới gửi header → app đợi mù, dễ vượt 180s và bị coi là "treo". Bật
  //    stream → token chảy về liên tục, không bao giờ im lặng lâu ⇒ hết treo oan.
  const payload = {
    model: cfg.modelName,
    max_tokens: opts.maxTokens ?? 4096,
    temperature: opts.temperature ?? 0.7,
    stream: true,
    ...(opts.system ? { system: opts.system } : {}),
    ...(tools.length ? { tools } : {}),
    messages
  }
  return streamToolTurn(messagesUrl(cfg.baseUrl), payload, anthropicHeaders(cfg), cfg.provider)
}

/**
 * Gọi tool-use ở chế độ STREAM và dựng lại TurnResult từ dòng sự kiện SSE của Anthropic.
 *
 * Vì sao cần riêng (không dùng fetchWithTimeout): fetchWithTimeout chỉ canh tới lúc có
 * HEADER rồi tắt đồng hồ. Ở chế độ stream ta còn phải đọc THÂN (body) dần dần, nên đặt
 * "đồng hồ IM LẶNG": mỗi chunk về thì reset; chỉ khi 9router im >inactivityMs GIỮA hai
 * chunk (treo thật) mới abort. Đang chảy token thì không bao giờ bị cắt oan.
 *
 * Sự kiện Anthropic tái dựng: content_block_start (mở khối text/tool_use) →
 * content_block_delta (text_delta cộng chữ · input_json_delta cộng JSON input tool) →
 * content_block_stop (chốt khối) · message_delta (mang stop_reason). Gom lại thành
 * rawContent hợp lệ để đẩy vào lịch sử hội thoại y như bản non-stream.
 */
async function streamToolTurn(
  url: string,
  payload: Record<string, unknown>,
  headers: Record<string, string>,
  provider: string,
  inactivityMs = 120_000
): Promise<TurnResult> {
  const ac = new AbortController()
  let timer = setTimeout(() => ac.abort(), inactivityMs)
  const bump = (): void => {
    clearTimeout(timer)
    timer = setTimeout(() => ac.abort(), inactivityMs)
  }

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: ac.signal
    })
  } catch (err) {
    clearTimeout(timer)
    if ((err as Error)?.name === 'AbortError') {
      throw new Error(
        `fetch timeout: 9router không gửi header sau ${inactivityMs}ms (provider treo — sẽ thử lại)`
      )
    }
    throw err
  }
  if (!res.ok) {
    clearTimeout(timer)
    throw httpError(`${provider} tool-use`, res.status, await res.text())
  }

  // Khối đang dựng theo index (Anthropic đánh index cho từng content block).
  type Builder = { type?: string; id?: string; name?: string; text?: string; _json?: string }
  const blocks: Builder[] = []
  let stopReason = ''
  let sawData = false
  let fullRaw = '' // phòng khi cổng gom PHỚT stream, trả nguyên cục JSON

  const decoder = new TextDecoder()
  let buf = ''
  const handle = (ev: any): void => {
    const t = ev?.type as string | undefined
    if (t === 'content_block_start' && typeof ev.index === 'number') {
      const cb = ev.content_block ?? {}
      blocks[ev.index] = { type: cb.type, id: cb.id, name: cb.name, text: cb.text ?? '', _json: '' }
    } else if (t === 'content_block_delta' && typeof ev.index === 'number') {
      const b = blocks[ev.index] ?? (blocks[ev.index] = { _json: '' })
      const d = ev.delta ?? {}
      if (typeof d.text === 'string') b.text = (b.text ?? '') + d.text
      if (typeof d.partial_json === 'string') b._json = (b._json ?? '') + d.partial_json
    } else if (t === 'message_delta') {
      const sr = ev.delta?.stop_reason
      if (typeof sr === 'string') stopReason = sr
    }
  }

  try {
    const reader = (res.body as ReadableStream<Uint8Array> | null)?.getReader()
    if (!reader) throw new Error('Không đọc được body stream từ provider')
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      bump()
      const chunk = decoder.decode(value, { stream: true })
      fullRaw += chunk
      buf += chunk
      let nl: number
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).trim()
        buf = buf.slice(nl + 1)
        if (!line.startsWith('data:')) continue
        const p = line.slice(5).trim()
        if (!p || p === '[DONE]') continue
        sawData = true
        try {
          handle(JSON.parse(p))
        } catch {
          /* dòng SSE lẻ/chưa trọn → bỏ */
        }
      }
    }
  } finally {
    clearTimeout(timer)
  }

  // Cổng gom PHỚT stream (trả nguyên cục JSON, không có "data:") → parse như non-stream.
  if (!sawData) {
    const json = JSON.parse(fullRaw) as {
      content?: Array<Record<string, unknown>>
      stop_reason?: string
    }
    const content = json.content ?? []
    return {
      text: content
        .filter((c) => c.type === 'text')
        .map((c) => (c.text as string) ?? '')
        .join(''),
      toolUses: content
        .filter((c) => c.type === 'tool_use')
        .map((c) => ({
          id: c.id as string,
          name: c.name as string,
          input: (c.input as Record<string, unknown>) ?? {}
        })),
      stopReason: json.stop_reason ?? '',
      rawContent: content
    }
  }

  // Dựng rawContent hợp lệ + text + toolUses từ các khối đã gom.
  const rawContent: unknown[] = []
  const toolUses: ToolUseRequest[] = []
  let text = ''
  for (const b of blocks) {
    if (!b) continue
    if (b.type === 'text') {
      text += b.text ?? ''
      rawContent.push({ type: 'text', text: b.text ?? '' })
    } else if (b.type === 'tool_use') {
      let input: Record<string, unknown> = {}
      try {
        input = b._json ? (JSON.parse(b._json) as Record<string, unknown>) : {}
      } catch {
        input = {} // JSON input hỏng → coi như rỗng, agentRunner sẽ báo tool lỗi thay vì treo
      }
      toolUses.push({ id: b.id as string, name: b.name as string, input })
      rawContent.push({ type: 'tool_use', id: b.id, name: b.name, input })
    }
  }
  return { text, toolUses, stopReason, rawContent }
}

/**
 * fetch có hạn giờ CỨNG: nếu 9router treo socket (nhận request nhưng không trả),
 * AbortController cắt sau `ms` và ném lỗi "timeout" → queue.ts retry ngay thay vì
 * đợi đủ timeout hàng đợi. Mặc định 180s (< 240s của queue để queue còn kịp thử lại).
 * ⚠️ Sinh Director Bible / kịch bản dài với opus-4-8 dễ vượt 90s — để 90s sẽ bị cắt
 *    oan rồi retry lại từ đầu (lặp mãi). Nới lên 180s cho hợp việc sinh văn bản dài.
 */
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  ms = 180_000
): Promise<Response> {
  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), ms)
  try {
    return await fetch(url, { ...init, signal: ac.signal })
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') {
      throw new Error(`fetch timeout sau ${ms}ms (provider treo — sẽ thử lại)`)
    }
    throw err
  } finally {
    clearTimeout(t)
  }
}

/**
 * Dựng URL endpoint Anthropic `/v1/messages` chịu được cả 2 quy ước baseUrl:
 * - Anthropic thật: 'https://api.anthropic.com'        → …/v1/messages
 * - Cổng gom đã kèm /v1: 'http://localhost:20128/v1'   → …/messages (không lặp /v1)
 */
function messagesUrl(baseUrl: string): string {
  const b = baseUrl.replace(/\/+$/, '')
  return b.endsWith('/v1') ? `${b}/messages` : `${b}/v1/messages`
}

/**
 * Dựng lỗi HTTP dễ đọc từ response model. Riêng 401/403 (xác thực) → thông báo
 * tiếng Việt chỉ rõ cách xử lý, vì đây là lỗi phía cổng gom (token/key upstream
 * hết hạn) chứ không phải app. GIỮ mã "401"/"403" trong message để queue.isTransient
 * nhận diện đúng là lỗi cứng (KHÔNG thử lại). 9router hay trả:
 *   401 "OAuth access token has been reset after 1m 38s" — token upstream hết hạn.
 */
function httpError(provider: string, status: number, body: string): Error {
  if (status === 401 || status === 403) {
    return new Error(
      `${status} Xác thực thất bại với ${provider}. ` +
        `Token/khóa mà cổng gom dùng để gọi model đã hết hạn hoặc bị thu hồi ` +
        `(thường là token OAuth upstream của 9router tự reset sau ít phút). ` +
        `Cần ĐĂNG NHẬP LẠI / KHỞI ĐỘNG LẠI 9router rồi thử lại — ` +
        `retry trong app không cứu được lỗi này. Chi tiết: ${body.slice(0, 300)}`
    )
  }
  return new Error(`${provider} ${status}: ${body}`)
}

/** Header Anthropic-format cho cả Anthropic thật (x-api-key) lẫn cổng gom (Bearer). */
function anthropicHeaders(cfg: ModelConfig): Record<string, string> {
  return {
    'content-type': 'application/json',
    'anthropic-version': '2023-06-01',
    'x-api-key': cfg.apiKey,
    authorization: `Bearer ${cfg.apiKey}`
  }
}

/**
 * Đọc body response có thể là JSON thường HOẶC SSE (dòng `data: {...}`).
 * Cổng gom (9router/beeknoee) đôi khi ép stream dù ta xin stream:false.
 * - Không phải SSE → JSON.parse cả body.
 * - Là SSE → gộp các mảnh, ưu tiên OpenAI delta (choices[].delta.content)
 *   và Anthropic content_block_delta (delta.text); trả về object gộp sẵn.
 */
async function readModelResponse(res: Response): Promise<{
  raw: unknown
  streamedText: string | null
}> {
  const body = await res.text()
  const trimmed = body.trimStart()
  // JSON thường: không bắt đầu bằng "data:"
  if (!trimmed.startsWith('data:')) {
    return { raw: JSON.parse(body), streamedText: null }
  }
  // SSE: duyệt từng dòng data:
  let text = ''
  let lastObj: unknown = null
  for (const line of body.split(/\r?\n/)) {
    const s = line.trim()
    if (!s.startsWith('data:')) continue
    const payload = s.slice(5).trim()
    if (!payload || payload === '[DONE]') continue
    let obj: any
    try {
      obj = JSON.parse(payload)
    } catch {
      continue // dòng lẻ/không hoàn chỉnh → bỏ
    }
    lastObj = obj
    // OpenAI stream: choices[].delta.content
    const delta = obj?.choices?.[0]?.delta?.content
    if (typeof delta === 'string') text += delta
    // OpenAI đôi khi trả nguyên message trong stream cuối
    const msg = obj?.choices?.[0]?.message?.content
    if (typeof msg === 'string') text += msg
    // Anthropic stream: content_block_delta { delta:{ text } }
    const aDelta = obj?.delta?.text
    if (typeof aDelta === 'string') text += aDelta
  }
  return { raw: lastObj, streamedText: text }
}

// ---- Anthropic Messages API ----
async function chatAnthropic(
  messages: ChatMessage[],
  opts: ChatOptions,
  cfg: ModelConfig
): Promise<string> {
  const system =
    opts.system ?? messages.find((m) => m.role === 'system')?.content
  const turns = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role, content: m.content }))

  const res = await fetchWithTimeout(messagesUrl(cfg.baseUrl), {
    method: 'POST',
    headers: anthropicHeaders(cfg),
    body: JSON.stringify({
      model: cfg.modelName,
      max_tokens: opts.maxTokens ?? 2048,
      temperature: opts.temperature ?? 0.7,
      stream: false,
      ...(system ? { system } : {}),
      messages: turns
    })
  })
  if (!res.ok) {
    throw httpError('Anthropic', res.status, await res.text())
  }
  const { raw, streamedText } = await readModelResponse(res)
  if (streamedText !== null) return streamedText
  const json = raw as { content?: Array<{ type: string; text?: string }> }
  return (json.content ?? [])
    .filter((c) => c.type === 'text')
    .map((c) => c.text ?? '')
    .join('')
}

// ---- OpenAI-compatible (9router / beeknoee) ----
async function chatOpenAICompatible(
  messages: ChatMessage[],
  opts: ChatOptions,
  cfg: ModelConfig
): Promise<string> {
  const msgs = opts.system
    ? [{ role: 'system', content: opts.system }, ...messages]
    : messages
  const res = await fetchWithTimeout(`${cfg.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${cfg.apiKey}`
    },
    body: JSON.stringify({
      model: cfg.modelName,
      max_tokens: opts.maxTokens ?? 2048,
      temperature: opts.temperature ?? 0.7,
      stream: false,
      messages: msgs
    })
  })
  if (!res.ok) {
    throw httpError(cfg.provider, res.status, await res.text())
  }
  const { raw, streamedText } = await readModelResponse(res)
  if (streamedText !== null) return streamedText
  const json = raw as { choices?: Array<{ message?: { content?: string } }> }
  return json.choices?.[0]?.message?.content ?? ''
}
