import { useEffect, useState, useCallback } from 'react'
import type { AssetTag, AssetRole } from '@shared/types'

/** Nhãn + màu chip theo loại asset (dùng cho card + chú thích). */
const ROLE_META: Record<AssetRole, { label: string; chip: string }> = {
  char: { label: 'nhân vật', chip: 'border-blue-500/30 text-blue-300' },
  product: { label: 'sản phẩm', chip: 'border-emerald-500/30 text-emerald-300' },
  prop: { label: 'đạo cụ', chip: 'border-amber-500/30 text-amber-300' },
  scene: { label: 'bối cảnh', chip: 'border-fuchsia-500/30 text-fuchsia-300' }
}

/**
 * MÀN NHÂN VẬT — gắn ảnh tư liệu vào @tag.
 * ideaAnalyst (GATE 0) đã đẻ ra @tag; ở đây người dùng upload ảnh chai nước hoa /
 * ảnh người mẫu vào đúng tag để: (a) prompt luôn viết @TAG → nhất quán;
 * (b) bảng xuất trỏ tag → file ảnh để dán sang Coco.
 */
export function CharacterPanel({
  projectId,
  onDone
}: {
  projectId: number
  onDone: () => void
}): JSX.Element {
  const [tags, setTags] = useState<AssetTag[]>([])
  const [thumbs, setThumbs] = useState<Record<string, string | null>>({})
  const [loading, setLoading] = useState(true)
  const [busyTag, setBusyTag] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  // form tạo tag thủ công
  const [newTag, setNewTag] = useState('')
  const [newType, setNewType] = useState<AssetRole>('product')

  const loadThumbs = useCallback(async (list: AssetTag[]) => {
    const entries = await Promise.all(
      list.map(async (t) => {
        if (!t.ref_image_path) return [t.tag, null] as const
        const res = await window.danh.assets.thumb(t.ref_image_path)
        return [t.tag, res.ok ? res.data : null] as const
      })
    )
    setThumbs(Object.fromEntries(entries))
  }, [])

  const refresh = useCallback(
    async (list?: AssetTag[]) => {
      let data = list
      if (!data) {
        const res = await window.danh.assets.list(projectId)
        data = res.ok ? res.data : []
      }
      setTags(data)
      await loadThumbs(data)
    },
    [projectId, loadThumbs]
  )

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      const res = await window.danh.assets.list(projectId)
      if (!alive) return
      if (res.ok) await refresh(res.data)
      else setErr(res.error)
      setLoading(false)
    })()
    return () => {
      alive = false
    }
  }, [projectId, refresh])

  async function attach(tag: string): Promise<void> {
    setBusyTag(tag)
    setErr(null)
    const res = await window.danh.assets.attach(projectId, tag)
    if (res.ok) await refresh(res.data)
    else setErr(res.error)
    setBusyTag(null)
  }

  async function clear(tag: string): Promise<void> {
    setBusyTag(tag)
    const res = await window.danh.assets.clear(projectId, tag)
    if (res.ok) await refresh(res.data)
    else setErr(res.error)
    setBusyTag(null)
  }

  async function remove(tag: string): Promise<void> {
    setBusyTag(tag)
    const res = await window.danh.assets.delete(projectId, tag)
    if (res.ok) await refresh(res.data)
    else setErr(res.error)
    setBusyTag(null)
  }

  async function createTag(): Promise<void> {
    if (!newTag.trim()) return
    setErr(null)
    const res = await window.danh.assets.create(projectId, newTag, newType, newTag)
    if (res.ok) {
      await refresh(res.data)
      setNewTag('')
    } else setErr(res.error)
  }

  const attached = tags.filter((t) => t.ref_image_path).length

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Nhân vật · Gắn ảnh @tag</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Gắn <span className="text-amber-soft">ảnh tư liệu</span> (chai sản phẩm, người
            mẫu…) vào từng <span className="text-amber-soft">@tag</span> mà bước Ý đồ đã tạo.
            Ảnh được prompt trỏ tới để{' '}
            <span className="text-slate-300">giữ nguyên qua mọi cảnh</span> và dán sang Coco
            khi render.
          </p>
        </div>
        <button className="btn-primary shrink-0 text-xs" onClick={onDone}>
          Sang kịch bản →
        </button>
      </div>

      {err && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          {err}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-slate-500">Đang tải @tag…</div>
      ) : tags.length === 0 ? (
        <div className="card p-5 text-sm text-slate-500">
          Chưa có @tag nào. Chạy <b className="text-slate-300">GATE 0 · Ý đồ</b> để app tự
          tách nhân vật/đạo cụ, hoặc tự thêm @tag bên dưới.
        </div>
      ) : (
        <>
          <div className="text-[11px] uppercase tracking-wide text-slate-500">
            {attached}/{tags.length} @tag đã có ảnh
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tags.map((t) => (
              <TagCard
                key={t.tag}
                tag={t}
                thumb={thumbs[t.tag] ?? null}
                busy={busyTag === t.tag}
                onAttach={() => void attach(t.tag)}
                onClear={() => void clear(t.tag)}
                onDelete={() => void remove(t.tag)}
              />
            ))}
          </div>
        </>
      )}

      {/* Thêm @tag thủ công */}
      <div className="card flex flex-wrap items-end gap-3 p-4">
        <div className="flex-1 min-w-[140px]">
          <label className="mb-1 block text-[11px] uppercase tracking-wide text-slate-500">
            Thêm @tag thủ công
          </label>
          <input
            className="input w-full"
            placeholder="VD: LUMIERE"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void createTag()}
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] uppercase tracking-wide text-slate-500">
            Loại
          </label>
          <select
            className="input"
            value={newType}
            onChange={(e) => setNewType(e.target.value as AssetRole)}
          >
            <option value="product">Sản phẩm</option>
            <option value="prop">Đạo cụ</option>
            <option value="char">Nhân vật</option>
            <option value="scene">Bối cảnh</option>
          </select>
        </div>
        <button className="btn-ghost text-xs" onClick={() => void createTag()}>
          + Thêm
        </button>
      </div>
    </div>
  )
}

function TagCard({
  tag,
  thumb,
  busy,
  onAttach,
  onClear,
  onDelete
}: {
  tag: AssetTag
  thumb: string | null
  busy: boolean
  onAttach: () => void
  onClear: () => void
  onDelete: () => void
}): JSX.Element {
  return (
    <div className="card flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <span className={'chip ' + (ROLE_META[tag.role] ?? ROLE_META.char).chip}>
          @{tag.tag}
        </span>
        <span className="text-[11px] text-slate-500">
          {(ROLE_META[tag.role] ?? ROLE_META.char).label}
        </span>
        <button
          className="ml-auto text-[11px] text-slate-600 hover:text-red-400"
          onClick={onDelete}
          disabled={busy}
          title="Xóa @tag"
        >
          ✕
        </button>
      </div>

      <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-ink-800 bg-ink-950/60">
        {thumb ? (
          <img src={thumb} alt={tag.tag} className="h-full w-full object-contain" />
        ) : (
          <span className="text-xs text-slate-600">⚠ chưa gắn ảnh</span>
        )}
      </div>

      <div className="flex gap-2">
        <button
          className="btn-ghost flex-1 text-xs disabled:opacity-50"
          onClick={onAttach}
          disabled={busy}
        >
          {busy ? '…' : thumb ? 'Đổi ảnh' : 'Chọn ảnh'}
        </button>
        {thumb && (
          <button
            className="btn-ghost text-xs disabled:opacity-50"
            onClick={onClear}
            disabled={busy}
          >
            Gỡ
          </button>
        )}
      </div>
    </div>
  )
}
