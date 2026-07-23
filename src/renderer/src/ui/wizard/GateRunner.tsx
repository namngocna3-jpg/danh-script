import { useWizard, type OneShotGate } from '../../wizardStore'
import { StepStream } from './StepStream'
import { ReviewBadge } from './ReviewBadge'
import { Markdown } from './Markdown'

interface Props {
  projectId: number
  gate: OneShotGate
  title: string
  desc: string
  onDone?: () => void
}

/** Panel chạy 1 cổng thợ (1/2/3): nút chạy → stream → kết quả → kiểm duyệt → tiếp. */
export function GateRunner({ projectId, gate, title, desc, onDone }: Props): JSX.Element {
  const running = useWizard((s) => s.running)
  const steps = useWizard((s) => s.steps)
  const result = useWizard((s) => s.gateResults[gate])
  const review = useWizard((s) => s.reviews[gate])
  const reviewing = useWizard((s) => s.reviewing)
  const runGate = useWizard((s) => s.runGate)
  const doReview = useWizard((s) => s.review)

  const isRunning = running === gate
  const busy = running !== null || reviewing !== null

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">{desc}</p>
        </div>
        <button
          className="btn-primary shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={busy}
          onClick={() => void runGate(gate, projectId)}
        >
          {isRunning ? 'Đang chạy…' : result ? 'Chạy lại' : 'Chạy thợ'}
        </button>
      </div>

      {(isRunning || steps.length > 0) && (
        <StepStream steps={steps} running={isRunning} />
      )}

      {result && (
        <div className="card p-5">
          <div className="mb-2 text-[11px] uppercase tracking-wide text-slate-500">
            Tóm tắt của thợ · {result.steps} bước
          </div>
          {result.summary ? (
            <Markdown>{result.summary}</Markdown>
          ) : (
            <p className="text-sm leading-relaxed text-slate-500">(thợ không để lại tóm tắt)</p>
          )}

          <div className="mt-4 flex items-center gap-2 border-t border-ink-800 pt-4">
            <button
              className="btn-ghost text-xs disabled:opacity-50"
              disabled={busy}
              onClick={() => void doReview(gate, projectId)}
            >
              {reviewing === gate ? 'Đang chấm…' : 'Kiểm duyệt A/B/C/D'}
            </button>
            {onDone && (
              <button className="btn-primary ml-auto text-xs" onClick={onDone}>
                Sang cổng sau →
              </button>
            )}
          </div>

          {review && <ReviewBadge review={review} />}
        </div>
      )}
    </div>
  )
}
