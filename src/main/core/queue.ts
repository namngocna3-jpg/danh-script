// ============================================================
// Danh Script — Hàng đợi tuần tự 800ms (mỏ #2 + #7)
// Chống 3 lỗi hay gặp: emptyPrompt, sinh hàng loạt lỗi, màn hình trắng.
// Mọi lời gọi LLM đi qua đây: rải 800ms + timeout + retry (backoff).
// ============================================================

export interface QueueOptions {
  intervalMs?: number // giãn cách giữa 2 task (mặc định 800ms)
  timeoutMs?: number // timeout mỗi task (mặc định 60s)
  maxRetries?: number // số lần thử lại (mặc định 2)
}

interface QueueItem<T> {
  task: () => Promise<T>
  resolve: (v: T) => void
  reject: (e: unknown) => void
  retriesLeft: number
}

export class TaskQueue {
  private queue: QueueItem<unknown>[] = []
  private running = false
  private readonly intervalMs: number
  private readonly timeoutMs: number
  private readonly maxRetries: number

  constructor(opts: QueueOptions = {}) {
    this.intervalMs = opts.intervalMs ?? 800
    this.timeoutMs = opts.timeoutMs ?? 60_000
    this.maxRetries = opts.maxRetries ?? 2
  }

  /** Đẩy 1 task vào hàng đợi. Trả promise kết quả. */
  enqueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        task: task as () => Promise<unknown>,
        resolve: resolve as (v: unknown) => void,
        reject,
        retriesLeft: this.maxRetries
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
        if (item.retriesLeft > 0) {
          // Cây recovery: retry với backoff + tăng nhẹ khoảng chờ
          item.retriesLeft -= 1
          const backoff =
            this.intervalMs * (this.maxRetries - item.retriesLeft + 1)
          await sleep(backoff)
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
