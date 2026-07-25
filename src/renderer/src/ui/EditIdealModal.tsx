import { useState } from 'react'
import type { Project, Ideal } from '@shared/types'
import { useApp } from '../store'

/**
 * Sửa ý tưởng (ideal) sau khi tạo dự án. Ghi đè projects.ideal_json (giữ brief đã
 * làm giàu). KHÔNG tự xóa data đã sinh — muốn sinh lại theo ý mới thì bấm 🔄 ở
 * từng bước. Tái dùng layout NewProjectModal cho nhất quán.
 */
export function EditIdealModal({
  project,
  onClose
}: {
  project: Project
  onClose: () => void
}): JSX.Element {
  const updateIdeal = useApp((s) => s.updateIdeal)

  const initial = ((): Ideal => {
    try {
      return JSON.parse(project.ideal_json) as Ideal
    } catch {
      return { raw: '' }
    }
  })()

  const [raw, setRaw] = useState(initial.raw ?? '')
  const [goal, setGoal] = useState(initial.goal ?? '')
  const [product, setProduct] = useState(initial.product ?? '')
  const [audience, setAudience] = useState(initial.audience ?? '')
  const [duration, setDuration] = useState(
    initial.duration_sec != null ? String(initial.duration_sec) : ''
  )
  const [notes, setNotes] = useState(initial.notes ?? '')
  const [busy, setBusy] = useState(false)

  const canSubmit = raw.trim().length > 0 && !busy

  async function submit(): Promise<void> {
    if (!canSubmit) return
    setBusy(true)
    const durNum = Number(duration.trim())
    const next: Ideal = {
      ...initial, // giữ brief + field khác chưa hiện trên form
      raw: raw.trim(),
      goal: goal.trim() || undefined,
      product: product.trim() || undefined,
      audience: audience.trim() || undefined,
      duration_sec: duration.trim() && !Number.isNaN(durNum) ? durNum : undefined,
      notes: notes.trim() || undefined
    }
    const okDone = await updateIdeal(project.id, next)
    setBusy(false)
    if (okDone) onClose()
  }

  const inputCls =
    'w-full rounded-xl border border-ink-700 bg-ink-850 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-amber-glow/50'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card max-h-[88vh] w-full max-w-lg overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-lg font-bold text-white">Sửa ý tưởng</h2>
        <p className="mb-5 text-sm text-slate-500">
          Sửa <span className="text-amber-soft">Ideal</span> — gốc của mọi bước. Đã sửa xong?
          Bấm <span className="text-amber-soft">🔄 Làm lại bước này</span> ở từng bước để sinh lại
          nội dung theo ý mới.
        </p>

        {/* Ideal gốc */}
        <label className="mb-1.5 block text-xs font-medium text-slate-400">
          Ideal (ý tưởng video, tiếng Việt) <span className="text-amber-soft">★</span>
        </label>
        <textarea
          autoFocus
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={5}
          placeholder="VD: Cô gái hiện đại vô tình xuyên không về thời cổ đại…"
          className={'mb-5 resize-none ' + inputCls}
        />

        {/* Chi tiết tùy chọn */}
        <div className="mb-2 text-xs font-medium text-slate-500">Chi tiết (tùy chọn)</div>

        <label className="mb-1.5 block text-xs font-medium text-slate-400">Mục tiêu</label>
        <input
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="VD: bán hàng / nhận diện thương hiệu"
          className={'mb-3 ' + inputCls}
        />

        <label className="mb-1.5 block text-xs font-medium text-slate-400">Sản phẩm/dịch vụ</label>
        <input
          value={product}
          onChange={(e) => setProduct(e.target.value)}
          placeholder="VD: máy xay sinh tố XYZ"
          className={'mb-3 ' + inputCls}
        />

        <label className="mb-1.5 block text-xs font-medium text-slate-400">Đối tượng xem</label>
        <input
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          placeholder="VD: mẹ bỉm 25–35 tuổi"
          className={'mb-3 ' + inputCls}
        />

        <label className="mb-1.5 block text-xs font-medium text-slate-400">
          Thời lượng (giây)
        </label>
        <input
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          inputMode="numeric"
          placeholder="VD: 30"
          className={'mb-3 ' + inputCls}
        />

        <label className="mb-1.5 block text-xs font-medium text-slate-400">Ghi chú</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Lưu ý thêm cho engine…"
          className={'mb-6 resize-none ' + inputCls}
        />

        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>
            Hủy
          </button>
          <button
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canSubmit}
            onClick={() => void submit()}
          >
            {busy ? 'Đang lưu…' : 'Lưu ý tưởng'}
          </button>
        </div>
      </div>
    </div>
  )
}
