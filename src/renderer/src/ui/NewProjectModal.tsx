import { useState } from 'react'
import type { Pipeline } from '@shared/types'
import { useApp } from '../store'

const PIPELINES: { key: Pipeline; label: string; desc: string }[] = [
  { key: 'free', label: 'Tự do', desc: 'Ideal bất kỳ — engine tự suy mọi thứ (như Higgsfield)' },
  { key: 'affiliate', label: 'Affiliate', desc: 'Gợi ý preset: video review/bán hàng affiliate' },
  { key: 'tvc', label: 'TVC Short', desc: 'Gợi ý preset: quảng cáo ngắn, nhận diện thương hiệu' },
  { key: 'fashion', label: 'Fashion', desc: 'Gợi ý preset: thời trang, lookbook' }
]

export function NewProjectModal({
  onClose
}: {
  onClose: () => void
}): JSX.Element {
  const createProject = useApp((s) => s.createProject)
  const [name, setName] = useState('')
  const [pipeline, setPipeline] = useState<Pipeline>('free')
  const [ideal, setIdeal] = useState('')
  const [busy, setBusy] = useState(false)

  const canSubmit = name.trim().length > 0 && ideal.trim().length > 0 && !busy

  async function submit(): Promise<void> {
    if (!canSubmit) return
    setBusy(true)
    const created = await createProject({
      name: name.trim(),
      pipeline,
      ideal: { raw: ideal.trim() }
    })
    setBusy(false)
    if (created) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-lg font-bold text-white">Tạo dự án mới</h2>
        <p className="mb-5 text-sm text-slate-500">
          <span className="text-amber-soft">Ideal là gốc.</span> Engine đọc ideal
          để tự suy bối cảnh/nhân vật/thời đại từng cảnh — không ép khuôn.
        </p>

        {/* Tên */}
        <label className="mb-1.5 block text-xs font-medium text-slate-400">
          Tên dự án
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="VD: Review máy xay sinh tố XYZ"
          className="mb-4 w-full rounded-xl border border-ink-700 bg-ink-850 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-amber-glow/50"
        />

        {/* Ideal — nhân vật chính */}
        <label className="mb-1.5 block text-xs font-medium text-slate-400">
          Ideal (ý tưởng video, tiếng Việt) <span className="text-amber-soft">★</span>
        </label>
        <textarea
          autoFocus
          value={ideal}
          onChange={(e) => setIdeal(e.target.value)}
          rows={5}
          placeholder="VD: Cô gái hiện đại vô tình xuyên không về thời cổ đại, mang theo chiếc máy xay... (viết thoải mái, engine sẽ phân tích)"
          className="mb-5 w-full resize-none rounded-xl border border-ink-700 bg-ink-850 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-amber-glow/50"
        />

        {/* Pipeline — chỉ là gợi ý, không bắt buộc */}
        <label className="mb-1.5 block text-xs font-medium text-slate-400">
          Preset gợi ý{' '}
          <span className="text-slate-600">
            (không bắt buộc — chỉ nạp sẵn skill/tham số, ideal vẫn quyết định)
          </span>
        </label>
        <div className="mb-6 grid grid-cols-4 gap-2">
          {PIPELINES.map((p) => (
            <button
              key={p.key}
              onClick={() => setPipeline(p.key)}
              title={p.desc}
              className={
                'rounded-xl border px-2.5 py-2 text-center text-xs transition ' +
                (pipeline === p.key
                  ? 'border-amber-glow/60 bg-amber-glow/10 text-white'
                  : 'border-ink-700 bg-ink-850 text-slate-400 hover:border-ink-600')
              }
            >
              <div className="font-semibold">{p.label}</div>
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>
            Hủy
          </button>
          <button
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canSubmit}
            onClick={() => void submit()}
          >
            {busy ? 'Đang tạo…' : 'Tạo dự án'}
          </button>
        </div>
      </div>
    </div>
  )
}
