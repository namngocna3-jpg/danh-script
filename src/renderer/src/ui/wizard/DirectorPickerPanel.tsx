import { useEffect, useState } from 'react'
import { useWizard } from '../../wizardStore'

/**
 * BƯỚC "🎬 Chọn đạo diễn" — non-gating (chỉ ghi director_id, không khóa tuần tự).
 * Chọn 1 gu đạo diễn ở đầu dự án; gu này chảy vào SỔ CÁI kế thừa của MỌI bước sau
 * (nháp → khung xương → chuyển thể → nguyên liệu → phân cảnh → prompt) như kim chỉ
 * nam thẩm mỹ (sáng/màu/nhịp/cảm xúc). Khác STYLE (chất liệu render) — đây là CÁCH KỂ.
 */
export function DirectorPickerPanel({
  projectId,
  current,
  onDone
}: {
  projectId: number
  current: string | null
  onDone: () => void
}): JSX.Element {
  const directors = useWizard((s) => s.directors)
  const loadDirectors = useWizard((s) => s.loadDirectors)
  const setDirector = useWizard((s) => s.setDirector)

  const [picked, setPicked] = useState(current ?? '')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (directors.length === 0) void loadDirectors()
  }, [directors.length, loadDirectors])

  const canSave = picked.length > 0 && !busy

  async function save(): Promise<void> {
    if (!canSave) return
    setBusy(true)
    const ok = await setDirector(projectId, picked)
    setBusy(false)
    if (ok) onDone()
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold text-white">🎬 Chọn đạo diễn</h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          <span className="text-amber-soft">GU ĐẠO DIỄN = cách kể</span> (chọn sáng,
          chọn màu, chọn nhịp, chọn cảm xúc), chảy vào MỌI bước sau như kim chỉ nam
          thẩm mỹ.{' '}
          <span className="text-slate-400">
            Khác STYLE (chất liệu render người-thật/anime…). Chọn 1 gu để cả phim
            quảng cáo nhất quán một con mắt.
          </span>
        </p>
      </div>

      {directors.length === 0 ? (
        <div className="text-xs text-slate-600">Đang tải gu đạo diễn…</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {directors.map((d) => (
            <button
              key={d.id}
              onClick={() => setPicked(d.id)}
              className={
                'rounded-xl border px-4 py-3.5 text-left transition ' +
                (picked === d.id
                  ? 'border-amber-glow/60 bg-amber-glow/10'
                  : 'border-ink-700 bg-ink-850 hover:border-ink-600')
              }
            >
              <div
                className={
                  'text-sm font-semibold ' +
                  (picked === d.id ? 'text-white' : 'text-slate-300')
                }
              >
                {d.label}
              </div>
              <div className="mt-1 text-[11px] leading-relaxed text-slate-500">
                {d.description}
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button className="btn-ghost px-3 py-2 text-xs" onClick={onDone}>
          Bỏ qua (chọn sau) →
        </button>
        <button
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canSave}
          onClick={() => void save()}
        >
          {busy ? 'Đang lưu…' : 'Chốt gu & tiếp tục →'}
        </button>
      </div>
    </div>
  )
}
