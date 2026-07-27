import { useEffect, useState } from 'react'
import { useWizard } from '../../wizardStore'
import { StepStream } from './StepStream'
import { Markdown } from './Markdown'

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
  const runDirectorBrief = useWizard((s) => s.runDirectorBrief)
  const running = useWizard((s) => s.running)
  const steps = useWizard((s) => s.steps)
  const plan = useWizard((s) => s.plan)
  const loadPlan = useWizard((s) => s.loadPlan)

  const [picked, setPicked] = useState(current ?? '')
  // Đã sinh xong Bible ở lượt này? → hiện KẾT QUẢ + nút sang bước sau (KHÔNG tự nhảy).
  const [briefDone, setBriefDone] = useState(false)

  const isRunning = running === 'director'
  const busy = running !== null
  const bible = plan?.directorBible ?? null

  useEffect(() => {
    if (directors.length === 0) void loadDirectors()
    // Nạp plan để hiện Bible nếu dự án đã chốt gu từ trước (mở lại bước).
    void loadPlan(projectId)
  }, [directors.length, loadDirectors, loadPlan, projectId])

  const canSave = picked.length > 0 && !busy

  // Chốt gu = ghi director_id RỒI chạy thợ directorBrief sinh Director Bible (stream
  // tiến độ như prep). Sinh xong DỪNG LẠI cho người dùng XEM Bible — KHÔNG tự nhảy sang
  // Kịch bản (trước đây onDone() ngay khiến không kịp thấy output). Nếu thợ lỗi vẫn cho
  // đi tiếp — ledger tự fallback về persona thô (dự án cũ chưa có bible cũng chạy được).
  async function save(): Promise<void> {
    if (!canSave) return
    const ok = await setDirector(projectId, picked)
    if (!ok) return
    await runDirectorBrief(projectId)
    await loadPlan(projectId) // nạp Bible vừa ghi để hiển thị
    setBriefDone(true)
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

      {(isRunning || steps.length > 0) && (
        <StepStream steps={steps} running={isRunning} />
      )}

      {/* KẾT QUẢ — Director Bible vừa sinh (hoặc đã có sẵn). Hiện TẠI CHỖ để người dùng
          đọc trước khi sang bước sau, thay vì tự nhảy mất output. */}
      {bible && (briefDone || !isRunning) && (
        <div className="card space-y-3 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-amber-glow/80">
            📖 Director Bible (hiến pháp thẩm mỹ phim này)
          </div>
          <BibleRow label="Nhìn tổng thể" value={bible.logline_visual} />
          <BibleRow label="Bảng màu" value={bible.color_script} />
          <BibleRow label="Ánh sáng" value={bible.lighting} />
          <BibleRow label="Chất liệu" value={bible.texture} />
          <BibleRow label="Ngôn ngữ máy quay" value={bible.camera_language} />
          <BibleRow label="Cảm xúc · gương mặt" value={bible.emotion_face} />
          <BibleRow label="Âm thanh" value={bible.sound_design} />
          <BibleRow label="Vật lý (Seedance)" value={bible.physics_notes} />
          {/* Chắn mảng: LLM đôi khi trả CHUỖI ở chỗ đáng lẽ string[]; chuỗi vẫn có .length
              nên lọt guard rồi .map nổ TypeError → sập cả panel. Không phải mảng → bỏ qua. */}
          {Array.isArray(bible.do_dont) && bible.do_dont.length > 0 && (
            <div className="text-sm text-slate-300">
              <div className="text-slate-500">Nên / tránh:</div>
              <ul className="mt-1 space-y-1">
                {bible.do_dont.map((d, i) => (
                  <li key={i}>• {String(d)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          className="btn-ghost px-3 py-2 text-xs disabled:opacity-50"
          disabled={busy}
          onClick={onDone}
        >
          Bỏ qua (chọn sau) →
        </button>
        {briefDone ? (
          // Đã sinh xong + đã xem Bible → giờ mới cho sang Kịch bản (do người bấm).
          <button className="btn-primary" onClick={onDone}>
            Sang bước Kịch bản →
          </button>
        ) : (
          <button
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canSave}
            onClick={() => void save()}
          >
            {isRunning ? 'Đang sinh chỉ đạo…' : 'Chốt gu & sinh chỉ đạo →'}
          </button>
        )}
      </div>
    </div>
  )
}

/** 1 dòng Bible: nhãn + nội dung (Markdown gọn). Bỏ qua khi rỗng. */
function BibleRow({ label, value }: { label: string; value?: string }): JSX.Element | null {
  if (!value?.trim()) return null
  return (
    <div className="text-sm text-slate-300">
      <span className="text-slate-500">{label}: </span>
      <span className="inline [&_p]:inline">
        <Markdown>{value}</Markdown>
      </span>
    </div>
  )
}
