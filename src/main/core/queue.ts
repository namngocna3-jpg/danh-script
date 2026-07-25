// ============================================================
// Danh Script — Hàng đợi tuần tự 800ms (mỏ #2 + #7)
// Chống 3 lỗi hay gặp: emptyPrompt, sinh hàng loạt lỗi, màn hình trắng.
// Mọi lời gọi LLM đi qua đây: rải 800ms + timeout + retry (backoff).
// ============================================================

export interface QueueOptions {
  intervalMs?: number // giãn cách giữa 2 task (mặc định 800ms)
  timeoutMs?: number // timeout mỗi task (mặc định 120s — tool-use prompt dài)
  maxRetries?: number // số lần thử lại (mặc định 4 — 9router hay chờn 502/reset)
}

/**
 * Lỗi TẠM THỜI đáng thử lại: 5xx cổng gom (502/503/504), quá tải (429), timeout,
 * hoặc kết nối bị reset/đứt. 9router hay "fetch connect timeout (reset after 2s)".
 * Lỗi KHÔNG tạm thời (400 sai schema, 401 sai key) thì thử lại vô ích → để nổi ngay.
 */
function isTransient(err: unknown): boolean {
  const m = String((err as Error)?.message ?? err).toLowerCase()
  return (
    /\b(429|500|502|503|504)\b/.test(m) ||
    m.includes('timeout') ||
    m.includes('reset') ||
    m.includes('econnreset') ||
    m.includes('fetch failed') ||
    m.includes('connect')
  )
}

/** Báo cho người gọi biết đang chờ thử lại (để UI hiện "nhà cung cấp chậm…"). */
export interface RetryInfo {
  attempt: number // lần thử lại thứ mấy (1,2,3,4)
  maxRetries: number // tổng số lần thử lại
  waitMs: number // sắp chờ bao lâu trước khi thử lại
  message: string // lỗi tạm thời khiến phải thử lại
}

interface QueueItem<T> {
  task: () => Promise<T>
  resolve: (v: T) => void
  reject: (e: unknown) => void
  retriesLeft: number
  onRetry?: (info: RetryInfo) => void
}

export class TaskQueue {
  private queue: QueueItem<unknown>[] = []
  private running = false
  private readonly intervalMs: number
  private readonly timeoutMs: number
  private readonly maxRetries: number

  constructor(opts: QueueOptions = {}) {
    this.intervalMs = opts.intervalMs ?? 800
    this.timeoutMs = opts.timeoutMs ?? 120_000
    this.maxRetries = opts.maxRetries ?? 4
  }

  /**
   * Đẩy 1 task vào hàng đợi. Trả promise kết quả.
   * onRetry (tùy chọn): gọi mỗi khi task lỗi tạm thời và SẮP thử lại — để UI hiện
   * "nhà cung cấp phản hồi chậm, đang thử lại…" thay vì đứng câm.
   */
  enqueue<T>(task: () => Promise<T>, onRetry?: (info: RetryInfo) => void): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        task: task as () => Promise<unknown>,
        resolve: resolve as (v: unknown) => void,
        reject,
        retriesLeft: this.maxRetries,
        onRetry
      })
      void this.drain()
    })
  }

  get size(): number {
    return this.queue.length
  }

  private async drain(): Promise<void> {
    if (this.running) return
    this.running = true

    while (this.queue.length > 0) {
      const item = this.queue.shift()!
      try {
        const result = await this.withTimeout(item.task())
        item.resolve(result)
      } catch (err) {
        // Chỉ retry lỗi TẠM THỜI (502/reset/timeout của 9router…). Lỗi cứng (400/401)
        // thử lại vô ích → trả về ngay cho UI.
        if (item.retriesLeft > 0 && isTransient(err)) {
          const attempt = this.maxRetries - item.retriesLeft // 0,1,2,3…
          item.retriesLeft -= 1
          // Backoff lũy thừa + jitter: 1s, 2s, 4s, 8s (±25%) — chờ 9router hồi.
          const base = 1000 * 2 ** attempt
          const jitter = base * 0.25 * Math.random()
          const waitMs = base + jitter
          // Báo UI: đang chờ thử lại (attempt tính từ 1 cho người đọc: 1/4, 2/4…).
          item.onRetry?.({
            attempt: attempt + 1,
            maxRetries: this.maxRetries,
            waitMs,
            message: String((err as Error)?.message ?? err)
          })
          await sleep(waitMs)
          this.queue.unshift(item)
        } else {
          item.reject(err)
        }
      }
      // rải request: chờ intervalMs trước task kế
      if (this.queue.length > 0) await sleep(this.intervalMs)
    }

    this.running = false
  }

  private withTimeout<T>(p: Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const t = setTimeout(
        () => reject(new Error(`Task timeout sau ${this.timeoutMs}ms`)),
        this.timeoutMs
      )
      p.then(
        (v) => {
          clearTimeout(t)
          resolve(v)
        },
        (e) => {
          clearTimeout(t)
          reject(e)
        }
      )
    })
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/** Hàng đợi LLM dùng chung toàn app. */
export const llmQueue = new TaskQueue({ intervalMs: 800 })
