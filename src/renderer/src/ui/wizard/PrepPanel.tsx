import { useWizard } from '../../wizardStore'
import { StepStream } from './StepStream'
import { Markdown } from './Markdown'

/** BƯỚC 0 (tùy chọn) · Chuẩn bị tiền-ideal: personaBuilder + researcher (Nhóm A). */
export function PrepPanel({
  projectId,
  onDone
}: {
  projectId: number
  onDone: () => void
}): JSX.Element {
  const running = useWizard((s) => s.running)
  const steps = useWizard((s) => s.steps)
  const result = useWizard((s) => s.prepResult)
  const runPrep = useWizard((s) => s.runPrep)

  const isRunning = running === 'prep'
  const busy = running !== null

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Chuẩn bị · Target + Chống bịa</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            <span className="text-amber-soft">Tùy chọn.</span> Hai thợ Nhóm A chạy trước
            GATE 0: <b className="text-slate-300">personaBuilder</b> (đối tượng + góc cảm
            xúc) và <b className="text-slate-300">researcher</b> (soát độ thật, gắn cờ
            khẳng định chưa kiểm chứng). Kết quả đắp vào ideal để script/prompt bám theo.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            className="btn-ghost text-xs disabled:opacity-50"
            disabled={busy}
            onClick={onDone}
          >
            Bỏ qua →
          </button>
          <button
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            disabled={busy}
            onClick={() => void runPrep(projectId)}
          >
            {isRunning ? 'Đang chạy…' : result ? 'Chạy lại' : 'Chạy chuẩn bị'}
          </button>
        </div>
      </div>

      {(isRunning || steps.length > 0) && (
        <StepStream steps={steps} running={isRunning} />
      )}

      {result && (
        <>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <SummaryCard title="👤 Persona / góc cảm xúc" text={result.persona} />
            <SummaryCard title="🔎 Research / độ thật" text={result.research} />
          </div>
          <div className="flex justify-end">
            <button className="btn-primary text-xs" onClick={onDone}>
              Sang GATE 0 →
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function SummaryCard({ title, text }: { title: string; text: string }): JSX.Element {
  return (
    <div className="card p-4">
      <div className="mb-2 text-[11px] uppercase tracking-wide text-slate-500">
        {title}
      </div>
      {text ? (
        <Markdown>{text}</Markdown>
      ) : (
        <p className="text-sm leading-relaxed text-slate-500">(thợ không để lại tóm tắt)</p>
      )}
    </div>
  )
}
