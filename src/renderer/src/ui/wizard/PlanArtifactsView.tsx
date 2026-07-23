import type { PlanArtifacts } from '@shared/types'

/**
 * Hiển thị KHUNG XƯƠNG cốt chuyện + CHIẾN LƯỢC CHUYỂN THỂ (GATE 1).
 * Đọc từ DB sau mỗi lượt chat — cho người dùng thấy mạch chuyện đã dựng trước khi chốt.
 */
export function PlanArtifactsView({ plan }: { plan: PlanArtifacts | null }): JSX.Element | null {
  if (!plan || (!plan.skeleton && !plan.adaptation)) return null
  const sk = plan.skeleton
  const ad = plan.adaptation

  return (
    <div className="card space-y-4 p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-amber-glow/80">
        Khung xương &amp; chiến lược (kết quả hiện tại)
      </div>

      {sk && (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-white">🦴 Khung xương cốt chuyện</div>
          <p className="text-sm italic text-slate-300">“{sk.logline}”</p>
          {sk.beats?.length > 0 && (
            <ol className="space-y-1">
              {sk.beats
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((b) => (
                  <li key={b.order} className="flex gap-2 text-sm text-slate-300">
                    <span className="shrink-0 rounded bg-ink-800 px-1.5 py-0.5 text-[11px] font-medium text-amber-200">
                      {b.role}
                    </span>
                    <span>
                      {b.summary}
                      {b.scene_hint && (
                        <span className="text-slate-500"> ({b.scene_hint})</span>
                      )}
                    </span>
                  </li>
                ))}
            </ol>
          )}
          {sk.emotional_arc && (
            <p className="text-xs text-slate-400">
              <span className="text-slate-500">Cảm xúc: </span>
              {sk.emotional_arc}
            </p>
          )}
          {sk.payoff && (
            <p className="text-xs text-slate-400">
              <span className="text-slate-500">Trả bài: </span>
              {sk.payoff}
            </p>
          )}
        </div>
      )}

      {ad && (
        <div className="space-y-2 border-t border-ink-800 pt-3">
          <div className="text-sm font-semibold text-white">🎬 Chiến lược chuyển thể</div>
          <p className="text-sm text-slate-300">
            <span className="text-slate-500">Hướng: </span>
            {ad.approach}
            {ad.tone && <span className="text-slate-500"> · tông {ad.tone}</span>}
          </p>
          {ad.show_dont_tell?.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs text-slate-500">Cho xem thay vì kể:</div>
              <ul className="space-y-1">
                {ad.show_dont_tell.map((s, i) => (
                  <li key={i} className="text-sm text-slate-300">
                    • {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {ad.visual_motifs && ad.visual_motifs.length > 0 && (
            <p className="text-xs text-slate-400">
              <span className="text-slate-500">Motif hình: </span>
              {ad.visual_motifs.join(' · ')}
            </p>
          )}
          {ad.pitfalls && ad.pitfalls.length > 0 && (
            <p className="text-xs text-slate-400">
              <span className="text-slate-500">Cạm bẫy né: </span>
              {ad.pitfalls.join(' · ')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
