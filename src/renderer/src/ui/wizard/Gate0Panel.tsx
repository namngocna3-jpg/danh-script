import { useWizard } from '../../wizardStore'
import { StepStream } from './StepStream'
import { ReviewBadge } from './ReviewBadge'
import { Markdown } from './Markdown'

/** GATE 0 — ideaAnalyst: LÀM RÕ Ý ĐỒ (thông điệp lõi · đối tượng · tông · thể loại · độ dài). Chưa phân cảnh. */
export function Gate0Panel({
  projectId,
  onDone
}: {
  projectId: number
  onDone: () => void
}): JSX.Element {
  const running = useWizard((s) => s.running)
  const steps = useWizard((s) => s.steps)
  const result = useWizard((s) => s.gate0Result)
  const review = useWizard((s) => s.reviews.gate0)
  const reviewing = useWizard((s) => s.reviewing)
  const runGate0 = useWizard((s) => s.runGate0)
  const doReview = useWizard((s) => s.review)

  const isRunning = running === 'gate0'
  const busy = running !== null || reviewing !== null
  const brief = result?.brief ?? null

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">GATE 0 · Làm rõ ý đồ</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Đọc ideal và <span className="text-amber-soft">chốt Ý ĐỒ</span> (thông điệp lõi · đối
            tượng · góc cảm xúc · tông tổng · thể loại · độ dài). Việc{' '}
            <span className="text-amber-soft">phân cảnh</span> sẽ làm ở bước Kịch bản — có kịch bản
            rồi mới tách cảnh.
          </p>
        </div>
        <button
          className="btn-primary shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={busy}
          onClick={() => void runGate0(projectId)}
        >
          {isRunning ? 'Đang phân tích…' : result ? 'Phân tích lại' : 'Làm rõ ý đồ'}
        </button>
      </div>

      {(isRunning || steps.length > 0) && <StepStream steps={steps} running={isRunning} />}

      {result && (
        <>
          {/* Tóm tắt của thợ (Markdown) */}
          {result.summary && (
            <div className="card p-4">
              <div className="mb-2 text-[11px] uppercase tracking-wide text-slate-500">
                Phân tích của thợ
              </div>
              <Markdown>{result.summary}</Markdown>
            </div>
          )}

          {/* Ý đồ chốt */}
          {brief ? (
            <div className="card flex flex-col gap-2 p-4">
              <div className="text-[11px] uppercase tracking-wide text-slate-500">Ý đồ chốt</div>
              <BriefField k="🎯 Thông điệp lõi" v={brief.core_message} />
              <BriefField k="👤 Đối tượng" v={brief.target} />
              <BriefField k="💓 Góc cảm xúc" v={brief.angle} />
              <BriefField k="🎨 Tông / mood" v={brief.mood} />
              <BriefField k="🎬 Thể loại" v={brief.genre} />
              <BriefField k="⏱️ Độ dài dự kiến" v={brief.duration_hint} />
              {brief.triggers && brief.triggers.length > 0 && (
                <BriefField k="⚡ Trigger" v={brief.triggers.join(' · ')} />
              )}
            </div>
          ) : (
            <div className="card p-4 text-xs text-slate-600">(chưa chốt được ý đồ)</div>
          )}

          {/* Kiểm duyệt + tiếp */}
          <div className="flex items-center gap-2">
            <button
              className="btn-ghost text-xs disabled:opacity-50"
              disabled={busy}
              onClick={() => void doReview('gate0', projectId)}
            >
              {reviewing === 'gate0' ? 'Đang chấm…' : 'Kiểm duyệt A/B/C/D'}
            </button>
            <button className="btn-primary ml-auto text-xs" onClick={onDone}>
              Chốt style + tham số →
            </button>
          </div>
          {review && <ReviewBadge review={review} />}
        </>
      )}
    </div>
  )
}

function BriefField({ k, v }: { k: string; v?: string }): JSX.Element | null {
  if (!v) return null
  return (
    <div className="text-sm">
      <span className="text-slate-500">{k}: </span>
      <span className="text-slate-200">{v}</span>
    </div>
  )
}
