import type { AgentStep } from '@shared/types'

const KIND_LABEL: Record<AgentStep['kind'], { txt: string; cls: string }> = {
  text: { txt: 'nghĩ', cls: 'text-slate-400 border-ink-700' },
  tool_call: { txt: 'gọi tool', cls: 'text-blue-300 border-blue-500/30' },
  tool_result: { txt: 'kết quả', cls: 'text-emerald-300 border-emerald-500/30' },
  done: { txt: 'xong', cls: 'text-amber-soft border-amber-glow/30' }
}

/** Dòng stream tiến độ agent trong lúc chạy 1 cổng. */
export function StepStream({
  steps,
  running
}: {
  steps: AgentStep[]
  running: boolean
}): JSX.Element {
  return (
    <div className="card max-h-72 overflow-y-auto p-4">
      <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-wide text-slate-500">
        <span
          className={
            'h-1.5 w-1.5 rounded-full ' +
            (running ? 'animate-pulse bg-amber-glow' : 'bg-ink-600')
          }
        />
        Tiến độ thợ ({steps.length} bước)
      </div>
      {steps.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-600">
          {running ? 'Đang khởi động…' : 'Chưa chạy.'}
        </div>
      ) : (
        <ol className="flex flex-col gap-1.5">
          {steps.map((s, i) => {
            const meta = KIND_LABEL[s.kind]
            return (
              <li key={i} className="flex items-start gap-2 text-xs">
                <span className="mt-0.5 w-6 shrink-0 text-right text-slate-600">
                  {s.step}
                </span>
                <span
                  className={
                    'shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ' +
                    meta.cls
                  }
                >
                  {meta.txt}
                </span>
                <span className="min-w-0 flex-1 whitespace-pre-wrap break-words text-slate-300">
                  {s.detail}
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
