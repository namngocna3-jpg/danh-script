import { useEffect, useRef, useState } from 'react'
import { useWizard } from '../../wizardStore'
import { StepStream } from './StepStream'
import { PlanArtifactsView } from './PlanArtifactsView'
import { Markdown } from './Markdown'

/**
 * Tab TỰ ĐỘNG — "Sếp" điều phối: tự giao thợ + tự chấm A/B/C/D, dừng chờ người dùng mỗi cổng.
 * Không có nút Chốt/Kiểm duyệt — Sếp tự làm. Người dùng chỉ ra lệnh ("làm cổng ý đồ", "tiếp", "sửa cảnh 2").
 * Lịch sử lưu ở DB (gate_chats, gate_stage='orchestrator').
 */
export function OrchestratorPanel({ projectId }: { projectId: number }): JSX.Element {
  const autoChat = useWizard((s) => s.autoChat)
  const autoBusy = useWizard((s) => s.autoBusy)
  const steps = useWizard((s) => s.steps)
  const plan = useWizard((s) => s.plan)
  const loadAuto = useWizard((s) => s.loadAuto)
  const sendAuto = useWizard((s) => s.sendAuto)
  const loadPlan = useWizard((s) => s.loadPlan)
  const wizardError = useWizard((s) => s.wizardError)
  const clearError = useWizard((s) => s.clearError)

  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // Mở tab: nạp lịch sử; nếu rỗng → tự gửi kickoff để Sếp chào + đề xuất.
  useEffect(() => {
    void (async () => {
      await loadAuto(projectId)
      void loadPlan(projectId)
      const cur = useWizard.getState().autoChat
      if (cur.length === 0 && !useWizard.getState().autoBusy) {
        void sendAuto(projectId, null)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [autoChat, autoBusy])

  function submit(): void {
    const msg = input.trim()
    if (!msg || autoBusy) return
    setInput('')
    void sendAuto(projectId, msg)
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold text-white">🤖 Chế độ Tự động · Sếp điều phối</h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Sếp tự giao thợ dựng từng cổng (ý đồ → kịch bản → prompt ảnh → prompt video), tự chấm
          A/B/C/D sau mỗi cổng rồi dừng báo cáo. Bạn ra lệnh bằng chat (VD “làm cổng ý đồ”, “tiếp”,
          “sửa cảnh 2 sang buổi tối”). Vẫn có thể sang các tab cổng để chỉnh tay bất cứ lúc nào.
        </p>
      </div>

      {/* Khung hội thoại */}
      <div className="card flex max-h-[26rem] min-h-[16rem] flex-col gap-3 overflow-y-auto p-4">
        {autoChat.length === 0 && !autoBusy && (
          <div className="py-8 text-center text-xs text-slate-600">Sếp đang chuẩn bị…</div>
        )}
        {autoChat.map((t, i) => (
          <div key={i} className={t.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div
              className={
                'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ' +
                (t.role === 'user'
                  ? 'whitespace-pre-wrap bg-amber-glow/15 text-amber-50'
                  : 'bg-ink-850 text-slate-200')
              }
            >
              {t.role === 'user' ? t.text : <Markdown>{t.text}</Markdown>}
            </div>
          </div>
        ))}
        {autoBusy && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-ink-850 px-3.5 py-2.5 text-sm text-slate-500">
              <span className="animate-pulse">Sếp đang điều phối…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Khung xương + chiến lược (nếu Sếp đã cho chạy GATE 1) */}
      <PlanArtifactsView plan={plan} />

      {/* Ô nhập */}
      <div className="flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
          rows={2}
          disabled={autoBusy}
          placeholder='Ra lệnh cho Sếp… (VD: "bắt đầu", "làm cổng ý đồ", "tiếp", "chấm lại cổng kịch bản"). Enter để gửi.'
          className="min-h-[3rem] w-full resize-none rounded-xl border border-ink-700 bg-ink-850 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-amber-glow/50 disabled:opacity-50"
        />
        <button
          className="btn-primary shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={autoBusy || !input.trim()}
          onClick={submit}
        >
          Gửi
        </button>
      </div>

      {/* Tiến độ thợ (khi đang chạy) */}
      {(autoBusy || steps.length > 0) && <StepStream steps={steps} running={autoBusy} />}

      {/* Cảnh báo */}
      {wizardError && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          <span className="whitespace-pre-wrap">{wizardError}</span>
          <button
            className="ml-auto shrink-0 text-red-400/70 hover:text-red-300"
            onClick={clearError}
            title="Đóng"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
