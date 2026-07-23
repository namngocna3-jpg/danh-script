import { useEffect, useState } from 'react'
import type { ProjectParams } from '@shared/types'
import { useWizard } from '../../wizardStore'

const RATIOS: ProjectParams['aspect_ratio'][] = ['9:16', '16:9', '1:1', '4:5']

/** Nhãn nhóm thể loại hiển thị (theo tiền tố slug). */
const GENRE_GROUP_LABEL: Record<string, string> = {
  sales: 'Bán hàng',
  story: 'Kể chuyện (mini-drama)',
  misc: 'Khác'
}
const GENRE_GROUP_ORDER = ['sales', 'story', 'misc']

/** GATE THAM SỐ — chốt STYLE (chất liệu render, L1 cả dự án) + tham số kỹ thuật. */
export function ParamsPanel({
  projectId,
  initial,
  onDone
}: {
  projectId: number
  initial: ProjectParams | null
  onDone: () => void
}): JSX.Element {
  const styles = useWizard((s) => s.styles)
  const loadStyles = useWizard((s) => s.loadStyles)
  const genres = useWizard((s) => s.genres)
  const loadGenres = useWizard((s) => s.loadGenres)
  const setParams = useWizard((s) => s.setParams)

  const [styleId, setStyleId] = useState(initial?.style_id ?? '')
  const [duration, setDuration] = useState(initial?.duration_sec ?? 30)
  const [ratio, setRatio] = useState<ProjectParams['aspect_ratio']>(
    initial?.aspect_ratio ?? '9:16'
  )
  const [language, setLanguage] = useState(initial?.language ?? 'vi')
  const [genre, setGenre] = useState(initial?.genre ?? '')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (styles.length === 0) void loadStyles()
    if (genres.length === 0) void loadGenres()
  }, [styles.length, loadStyles, genres.length, loadGenres])

  const canSave = styleId.length > 0 && !busy

  async function save(): Promise<void> {
    if (!canSave) return
    setBusy(true)
    const ok = await setParams(projectId, {
      style_id: styleId,
      duration_sec: duration,
      aspect_ratio: ratio,
      language,
      ...(genre ? { genre } : {})
    })
    setBusy(false)
    if (ok) onDone()
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold text-white">GATE · Style + Tham số</h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          <span className="text-amber-soft">STYLE = chất liệu vẽ/quay</span> (2D Nhật,
          2D Trung, photoreal…), khóa cứng cả dự án.{' '}
          <span className="text-slate-400">
            Nó KHÔNG quyết định trang phục/thời đại — cái đó do bối cảnh từng cảnh (GATE 0).
          </span>
        </p>
      </div>

      {/* Style grid */}
      <div>
        <div className="mb-2 text-xs font-medium text-slate-400">
          Chất liệu render <span className="text-amber-soft">★</span>
        </div>
        {styles.length === 0 ? (
          <div className="text-xs text-slate-600">Đang tải style…</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {styles.map((st) => (
              <button
                key={st.id}
                onClick={() => setStyleId(st.id)}
                className={
                  'rounded-xl border px-3 py-3 text-left transition ' +
                  (styleId === st.id
                    ? 'border-amber-glow/60 bg-amber-glow/10'
                    : 'border-ink-700 bg-ink-850 hover:border-ink-600')
                }
              >
                <div
                  className={
                    'text-sm font-semibold ' +
                    (styleId === st.id ? 'text-white' : 'text-slate-300')
                  }
                >
                  {st.label}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-600">{st.id}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tham số kỹ thuật */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <div className="mb-1.5 text-xs font-medium text-slate-400">
            Thời lượng (giây)
          </div>
          <input
            type="number"
            min={5}
            max={300}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value) || 0)}
            className="w-full rounded-xl border border-ink-700 bg-ink-850 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-glow/50"
          />
        </div>
        <div>
          <div className="mb-1.5 text-xs font-medium text-slate-400">Tỉ lệ khung</div>
          <div className="flex gap-1.5">
            {RATIOS.map((r) => (
              <button
                key={r}
                onClick={() => setRatio(r)}
                className={
                  'flex-1 rounded-lg border py-2 text-xs transition ' +
                  (ratio === r
                    ? 'border-amber-glow/60 bg-amber-glow/10 text-white'
                    : 'border-ink-700 bg-ink-850 text-slate-400 hover:border-ink-600')
                }
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1.5 text-xs font-medium text-slate-400">
            Ngôn ngữ narration
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full rounded-xl border border-ink-700 bg-ink-850 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-glow/50"
          >
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
            <option value="zh">中文</option>
            <option value="ja">日本語</option>
          </select>
        </div>
      </div>

      {/* Thể loại — TÙY CHỌN, chỉ gợi ý nhịp kể (không ép khuôn) */}
      <div>
        <div className="mb-1.5 text-xs font-medium text-slate-400">
          Thể loại <span className="text-slate-600">(tùy chọn — chỉ gợi ý nhịp kể)</span>
        </div>
        <p className="mb-2 max-w-2xl text-[11px] text-slate-600">
          Bỏ trống = engine tự suy nhịp từ ý tưởng (bottom-up). Chọn thể loại chỉ nạp
          thêm gợi ý cho GATE 1, KHÔNG ép khuôn bối cảnh/thời đại.
        </p>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setGenre('')}
            className={
              'rounded-lg border px-3 py-1.5 text-xs transition ' +
              (genre === ''
                ? 'border-amber-glow/60 bg-amber-glow/10 text-white'
                : 'border-ink-700 bg-ink-850 text-slate-400 hover:border-ink-600')
            }
          >
            Tự do
          </button>
        </div>
        {GENRE_GROUP_ORDER.map((g) => {
          const items = genres.filter((it) => it.group === g)
          if (items.length === 0) return null
          return (
            <div key={g} className="mt-3">
              <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-600">
                {GENRE_GROUP_LABEL[g] ?? g}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {items.map((it) => (
                  <button
                    key={it.id}
                    onClick={() => setGenre(it.id)}
                    title={it.id}
                    className={
                      'rounded-lg border px-3 py-1.5 text-xs transition ' +
                      (genre === it.id
                        ? 'border-amber-glow/60 bg-amber-glow/10 text-white'
                        : 'border-ink-700 bg-ink-850 text-slate-400 hover:border-ink-600')
                    }
                  >
                    {it.label}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex justify-end">
        <button
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canSave}
          onClick={() => void save()}
        >
          {busy ? 'Đang lưu…' : 'Chốt & sang GATE 1 →'}
        </button>
      </div>
    </div>
  )
}
