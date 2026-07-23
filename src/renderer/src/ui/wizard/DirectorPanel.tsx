import { useEffect } from 'react'
import type { DirectorScene } from '@shared/types'
import { useWizard } from '../../wizardStore'
import { GateChatPanel } from './GateChatPanel'

/**
 * MÀN QUY HOẠCH ĐẠO DIỄN (gate_director, Toonflow director_plan).
 * Trợ lý directorPlanner đọc narration final → đếm thoại/chữ, chấm cảm xúc 0–10, thiết kế chuyển cảnh.
 * Trái: chat với thợ; phải/ dưới: bảng quy hoạch để người dùng soát trước khi chốt.
 */
export function DirectorPanel({
  projectId,
  onDone
}: {
  projectId: number
  onDone: () => void
}): JSX.Element {
  const plan = useWizard((s) => s.plan)
  const loadPlan = useWizard((s) => s.loadPlan)

  useEffect(() => {
    void loadPlan(projectId)
  }, [projectId, loadPlan])

  const director = plan?.director ?? null

  return (
    <div className="flex flex-col gap-5">
      <GateChatPanel
        projectId={projectId}
        stage="gate_director"
        gateId="director"
        title="Quy hoạch đạo diễn"
        desc='Trợ lý đếm thoại/chữ, chấm cảm xúc 0–10 và thiết kế chuyển cảnh cho từng cảnh (chỉ tách & phân tích, không viết lại lời thoại). Nhắn "quy hoạch lại" nếu cần soát.'
        onDone={onDone}
      />

      {director && director.scenes.length > 0 && (
        <div className="card space-y-3 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-amber-glow/80">
            🎬 Bảng quy hoạch đạo diễn
          </div>
          {director.overall_note && (
            <p className="text-xs text-slate-400">{director.overall_note}</p>
          )}
          <div className="space-y-1.5">
            {director.scenes
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((sc) => (
                <SceneRow key={sc.order} sc={sc} />
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SceneRow({ sc }: { sc: DirectorScene }): JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-ink-800 bg-ink-950/40 px-3 py-2 text-xs">
      <span className="shrink-0 rounded bg-ink-800 px-1.5 py-0.5 text-[11px] font-medium text-amber-200">
        Cảnh {sc.order}
      </span>
      <span className="text-slate-400">
        {sc.line_count} thoại · {sc.char_count} chữ (~{Math.round(sc.char_count / 4)}s)
      </span>
      <span className="text-slate-300">{sc.emotion}</span>
      <EmotionMeter value={sc.emotion_intensity} />
      {sc.transition && (
        <span className="text-slate-500">→ chuyển: {sc.transition}</span>
      )}
      {sc.note && <span className="w-full text-slate-500">· {sc.note}</span>}
    </div>
  )
}

/** Thanh cảm xúc 0–10 gọn. */
function EmotionMeter({ value }: { value: number }): JSX.Element {
  const pct = Math.max(0, Math.min(10, value)) * 10
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-ink-800">
        <span
          className="block h-full rounded-full bg-amber-glow/70"
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className="text-[11px] text-slate-500">{value}/10</span>
    </span>
  )
}
