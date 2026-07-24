import { useEffect, useRef, useState } from 'react'
import type { ChatGateStage } from '@shared/types'
import { useWizard, stageHasPlan, type GateId } from '../../wizardStore'
import { StepStream } from './StepStream'
import { ReviewBadge } from './ReviewBadge'
import { Markdown } from './Markdown'

export interface GateChatPanelProps {
  projectId: number
  stage: ChatGateStage
  gateId: GateId // để map kiểm duyệt A/B/C/D
  title: string
  desc: string
  onDone: () => void
}

/**
 * Panel HỘI THOẠI 1 cổng: trợ lý chào + hỏi → người dùng chat sửa → agent sửa đúng chỗ.
 * Chỉ qua cổng sau khi bấm "Chốt & sang cổng sau". Lịch sử lưu ở DB (gate_chats).
 */
export function GateChatPanel({
  projectId,
  stage,
  gateId,
  title,
  desc,
  onDone
}: GateChatPanelProps): JSX.Element {
  const chats = useWizard((s) => s.chats[stage])
  const chatBusy = useWizard((s) => s.chatBusy)
  const steps = useWizard((s) => s.steps)
  const review = useWizard((s) => s.reviews[gateId])
  const reviewing = useWizard((s) => s.reviewing)
  const loadChat = useWizard((s) => s.loadChat)
  const sendChat = useWizard((s) => s.sendChat)
  const confirmGate = useWizard((s) => s.confirmGate)
  const doReview = useWizard((s) => s.review)
  const loadPlan = useWizard((s) => s.loadPlan)
  const wizardError = useWizard((s) => s.wizardError)
  const clearError = useWizard((s) => s.clearError)

  const [input, setInput] = useState('')
  const busy = chatBusy === stage
  const anyBusy = chatBusy !== null || reviewing !== null
  const bottomRef = useRef<HTMLDivElement>(null)

  // Mở cổng: nạp lịch sử; nếu rỗng → tự gửi kickoff để trợ lý chào + hỏi/dựng.
  useEffect(() => {
    void (async () => {
      await loadChat(projectId, stage)
      if (stageHasPlan(stage)) void loadPlan(projectId)
      const cur = useWizard.getState().chats[stage]
      if ((!cur || cur.length === 0) && useWizard.getState().chatBusy === null) {
        void sendChat(projectId, stage, null)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, stage])

  // Cuộn xuống cuối mỗi khi có bong bóng mới / đang chạy.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chats, busy])

  function submit(): void {
    const msg = input.trim()
    if (!msg || busy) return
    setInput('')
    void sendChat(projectId, stage, msg)
  }

  const turns = chats ?? []

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">{desc}</p>
      </div>

      {/* Khung hội thoại */}
      <div className="card flex max-h-[26rem] min-h-[16rem] flex-col gap-3 overflow-y-auto p-4">
        {turns.length === 0 && !busy && (
          <div className="py-8 text-center text-xs text-slate-600">
            Trợ lý đang chuẩn bị…
          </div>
        )}
        {turns.map((t, i) => (
          <div
            key={i}
            className={t.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
          >
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
        {busy && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-ink-850 px-3.5 py-2.5 text-sm text-slate-500">
              <span className="inline-flex gap-1">
                <span className="animate-pulse">Trợ lý đang xử lý…</span>
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

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
          disabled={busy}
          placeholder='Nhập yêu cầu chỉnh sửa… (VD: "đổi cảnh 2 sang buổi tối", "narration cảnh 1 ngắn hơn"). Enter để gửi.'
          className="min-h-[3rem] w-full resize-none rounded-xl border border-ink-700 bg-ink-850 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-amber-glow/50 disabled:opacity-50"
        />
        <button
          className="btn-primary shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={busy || !input.trim()}
          onClick={submit}
        >
          Gửi
        </button>
      </div>

      {/* Tiến độ thợ (khi đang chạy) */}
      {(busy || steps.length > 0) && <StepStream steps={steps} running={busy} />}

      {/* Cảnh báo (VD chốt bị chặn vì còn block trống) */}
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

      {/* Kiểm duyệt + chốt cổng */}
      <div className="flex items-center gap-2 border-t border-ink-800 pt-4">
        <button
          className="btn-ghost text-xs disabled:opacity-50"
          disabled={anyBusy || turns.length === 0}
          onClick={() => void doReview(gateId, projectId)}
        >
          {reviewing === gateId ? 'Đang chấm…' : 'Kiểm duyệt A/B/C/D'}
        </button>
        {wizardError?.includes('điểm C') && (
          <button
            className="btn-ghost text-xs text-amber-400 disabled:opacity-50"
            disabled={anyBusy}
            onClick={() => void confirmGate(projectId, stage, true).then((okr) => okr && onDone())}
          >
            Chốt dù điểm C
          </button>
        )}
        <button
          className="btn-primary ml-auto text-xs disabled:cursor-not-allowed disabled:opacity-50"
          disabled={anyBusy}
          onClick={() => void confirmGate(projectId, stage).then((okr) => okr && onDone())}
        >
          Chốt &amp; sang cổng sau →
        </button>
      </div>
      {review && <ReviewBadge review={review} />}
    </div>
  )
}
