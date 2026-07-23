import { useEffect, useState, useCallback } from 'react'
import type { AssetFull, AssetDerivative, AssetRole } from '@shared/types'
import { useWizard } from '../../wizardStore'
import { GateChatPanel } from './GateChatPanel'

/** Nhãn + màu chip theo loại asset. */
const ROLE_META: Record<AssetRole, { label: string; chip: string }> = {
  char: { label: 'nhân vật', chip: 'border-blue-500/30 text-blue-300' },
  product: { label: 'sản phẩm', chip: 'border-emerald-500/30 text-emerald-300' },
  prop: { label: 'đạo cụ', chip: 'border-amber-500/30 text-amber-300' },
  scene: { label: 'bối cảnh', chip: 'border-fuchsia-500/30 text-fuchsia-300' }
}

/** Nhãn tiếng Việt cho loại biến thể phái sinh. */
const KIND_LABEL: Record<string, string> = {
  wardrobe: 'trang phục',
  state: 'trạng thái',
  time: 'thời điểm',
  weather: 'thời tiết',
  angle: 'góc máy'
}

/**
 * MÀN NGUYÊN LIỆU (Toonflow Bước 1 · Visual Dev) — thay vai trò upload của CharacterPanel.
 * Cột trái: chat với assetDeriver để TÁCH nguyên liệu từ kịch bản + sinh PROMPT tạo ảnh.
 * Cột phải: lưới asset gốc → phái sinh; mỗi card có prompt (Copy) + ô upload ảnh đã tạo + chip trạng thái.
 * App DỪNG ở prompt: người dùng copy prompt → Coco tạo ảnh → upload ảnh về đây.
 */
export function AssetStudioPanel({
  projectId,
  onDone
}: {
  projectId: number
  onDone: () => void
}): JSX.Element {
  const assetsFull = useWizard((s) => s.assetsFull)
  const coverage = useWizard((s) => s.coverage)
  const visualSystem = useWizard((s) => s.visualSystem)
  const loadAssets = useWizard((s) => s.loadAssets)
  const attachAssetImage = useWizard((s) => s.attachAssetImage)

  const [thumbs, setThumbs] = useState<Record<string, string | null>>({})
  const [busyTag, setBusyTag] = useState<string | null>(null)

  // Nạp nguyên liệu lần đầu (GateChatPanel sẽ tự nạp lại sau mỗi lượt chat gate_assets).
  useEffect(() => {
    void loadAssets(projectId)
  }, [projectId, loadAssets])

  // Lấy thumbnail cho mọi asset (gốc + phái sinh) đã gắn ảnh.
  const loadThumbs = useCallback(async (list: AssetFull[]) => {
    const paths: Array<{ tag: string; path: string }> = []
    for (const a of list) {
      if (a.ref_image_path) paths.push({ tag: a.tag, path: a.ref_image_path })
      for (const d of a.derivatives) {
        if (d.ref_image_path) paths.push({ tag: d.tag, path: d.ref_image_path })
      }
    }
    const entries = await Promise.all(
      paths.map(async (p) => {
        const res = await window.danh.assets.thumb(p.path)
        return [p.tag, res.ok ? res.data : null] as const
      })
    )
    setThumbs(Object.fromEntries(entries))
  }, [])

  useEffect(() => {
    void loadThumbs(assetsFull)
  }, [assetsFull, loadThumbs])

  async function attach(tag: string): Promise<void> {
    setBusyTag(tag)
    await attachAssetImage(projectId, tag)
    setBusyTag(null)
  }

  const totalDeriv = assetsFull.reduce((n, a) => n + a.derivatives.length, 0)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold text-white">Nguyên liệu · Tách hình từ kịch bản</h2>
        <p className="mt-1 max-w-3xl text-sm text-slate-500">
          Thợ <b className="text-slate-300">assetDeriver</b> đọc kịch bản final rồi{' '}
          <span className="text-amber-soft">tự tách nhân vật / bối cảnh / đạo cụ</span> và sinh{' '}
          <span className="text-amber-soft">prompt tạo ảnh</span> (character-sheet 4 góc /
          multi-angle / lưới 2×2) + biến thể + Color Script. Bạn{' '}
          <span className="text-slate-300">copy prompt → Coco tạo ảnh → upload ảnh về</span> từng
          thẻ bên phải.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Cột trái: chat với assetDeriver (tái dùng GateChatPanel) */}
        <div>
          <GateChatPanel
            projectId={projectId}
            stage="gate_assets"
            gateId="assets"
            title="Trợ lý nguyên liệu"
            desc='Nhắn "tách nguyên liệu từ kịch bản" để bắt đầu; hoặc "sinh prompt cho @TÊN", "thêm biến thể mưa cho @bối cảnh". Chỉ chốt khi mọi asset đã có prompt.'
            onDone={onDone}
          />
        </div>

        {/* Cột phải: hệ thị giác + lưới nguyên liệu */}
        <div className="flex flex-col gap-4">
          <VisualSystemView vs={visualSystem} />
          <CoverageBar coverage={coverage} totalDeriv={totalDeriv} />

          {assetsFull.length === 0 ? (
            <div className="card p-5 text-sm text-slate-500">
              Chưa có nguyên liệu nào. Nhắn trợ lý bên trái{' '}
              <b className="text-slate-300">“tách nguyên liệu từ kịch bản”</b> để bắt đầu.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {assetsFull.map((a) => (
                <AssetCard
                  key={a.asset_id}
                  asset={a}
                  thumbs={thumbs}
                  busyTag={busyTag}
                  onAttach={attach}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** Thanh độ phủ: bao nhiêu asset thiếu prompt / thiếu ảnh (lá chắn chốt cổng). */
function CoverageBar({
  coverage,
  totalDeriv
}: {
  coverage: import('@shared/types').AssetCoverage | null
  totalDeriv: number
}): JSX.Element | null {
  if (!coverage || coverage.total === 0) return null
  const okPrompt = coverage.total - coverage.missingPrompt.length
  return (
    <div className="card flex flex-wrap items-center gap-x-4 gap-y-1 p-3 text-xs">
      <span className="text-slate-400">
        <b className="text-slate-200">{coverage.total}</b> asset ({totalDeriv} biến thể)
      </span>
      <span className={coverage.missingPrompt.length ? 'text-amber-300' : 'text-emerald-300'}>
        {okPrompt}/{coverage.total} đã có prompt
      </span>
      {coverage.missingPrompt.length > 0 && (
        <span className="text-amber-300/80">
          ⚠ thiếu prompt: {coverage.missingPrompt.map((t) => '@' + t).join(', ')}
        </span>
      )}
      {coverage.missingImage.length > 0 && (
        <span className="text-slate-500">
          chưa gắn ảnh: {coverage.missingImage.map((t) => '@' + t).join(', ')}
        </span>
      )}
    </div>
  )
}

/** Thẻ 1 asset gốc + các biến thể phái sinh của nó. */
function AssetCard({
  asset,
  thumbs,
  busyTag,
  onAttach
}: {
  asset: AssetFull
  thumbs: Record<string, string | null>
  busyTag: string | null
  onAttach: (tag: string) => void
}): JSX.Element {
  const meta = ROLE_META[asset.role] ?? ROLE_META.char
  return (
    <div className="card flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <span className={'chip ' + meta.chip}>@{asset.tag}</span>
        <span className="text-[11px] text-slate-500">{meta.label}</span>
        <span className="truncate text-xs text-slate-400">{asset.name}</span>
        {asset.source === 'auto' && (
          <span className="ml-auto shrink-0 text-[10px] uppercase tracking-wide text-slate-600">
            tách tự động
          </span>
        )}
      </div>

      <PromptRow
        tag={asset.tag}
        prompt={asset.gen_prompt}
        thumb={thumbs[asset.tag] ?? null}
        busy={busyTag === asset.tag}
        onAttach={() => onAttach(asset.tag)}
      />

      {asset.derivatives.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-ink-800 pt-2">
          <div className="text-[11px] uppercase tracking-wide text-slate-600">
            Biến thể ({asset.derivatives.length})
          </div>
          {asset.derivatives.map((d) => (
            <DerivativeRow
              key={d.asset_id}
              deriv={d}
              thumb={thumbs[d.tag] ?? null}
              busy={busyTag === d.tag}
              onAttach={() => onAttach(d.tag)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/** Hàng prompt + ảnh cho 1 asset gốc. */
function PromptRow({
  tag,
  prompt,
  thumb,
  busy,
  onAttach
}: {
  tag: string
  prompt: string | null
  thumb: string | null
  busy: boolean
  onAttach: () => void
}): JSX.Element {
  return (
    <div className="flex gap-3">
      {/* Ô ảnh */}
      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-ink-800 bg-ink-950/60">
        {thumb ? (
          <img src={thumb} alt={tag} className="h-full w-full object-contain" />
        ) : (
          <span className="px-1 text-center text-[10px] text-slate-600">⚠ chưa gắn ảnh</span>
        )}
      </div>

      {/* Prompt + nút */}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {prompt ? (
          <div className="max-h-24 overflow-y-auto rounded-lg border border-ink-800 bg-ink-950/40 p-2 text-[11px] leading-relaxed text-slate-400">
            {prompt}
          </div>
        ) : (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2 text-[11px] text-amber-300/80">
            ⚠ Chưa có prompt sinh ảnh — nhắn trợ lý “sinh prompt cho @{tag}”.
          </div>
        )}
        <div className="flex gap-2">
          <CopyButton text={prompt} />
          <button
            className="btn-ghost text-xs disabled:opacity-50"
            onClick={onAttach}
            disabled={busy}
          >
            {busy ? '…' : thumb ? 'Đổi ảnh' : 'Upload ảnh'}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Hàng gọn cho 1 biến thể phái sinh. */
function DerivativeRow({
  deriv,
  thumb,
  busy,
  onAttach
}: {
  deriv: AssetDerivative
  thumb: string | null
  busy: boolean
  onAttach: () => void
}): JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-ink-800 bg-ink-950/60">
        {thumb ? (
          <img src={thumb} alt={deriv.tag} className="h-full w-full object-contain" />
        ) : (
          <span className="text-[9px] text-slate-600">—</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="chip border-slate-600/40 text-slate-300">@{deriv.tag}</span>
          {deriv.derive_kind && (
            <span className="text-[10px] text-slate-500">
              {KIND_LABEL[deriv.derive_kind] ?? deriv.derive_kind}
            </span>
          )}
        </div>
        <div className="truncate text-[11px] text-slate-500">{deriv.name}</div>
      </div>
      <CopyButton text={deriv.gen_prompt} small />
      <button
        className="btn-ghost shrink-0 text-[11px] disabled:opacity-50"
        onClick={onAttach}
        disabled={busy}
      >
        {busy ? '…' : thumb ? '↺' : '↑'}
      </button>
    </div>
  )
}

/** Nút Copy prompt (báo “Đã copy” 1.2s). */
function CopyButton({ text, small }: { text: string | null; small?: boolean }): JSX.Element {
  const [copied, setCopied] = useState(false)
  const cls =
    'btn-ghost shrink-0 disabled:opacity-40 ' + (small ? 'text-[11px]' : 'text-xs')
  return (
    <button
      className={cls}
      disabled={!text}
      onClick={() => {
        if (!text) return
        void navigator.clipboard.writeText(text).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 1200)
        })
      }}
    >
      {copied ? '✓ Đã copy' : 'Copy'}
    </button>
  )
}

/** Bảng Color Script + ánh sáng + chất liệu (hệ thị giác toàn phim). */
function VisualSystemView({
  vs
}: {
  vs: import('@shared/types').VisualSystem | null
}): JSX.Element | null {
  if (!vs || (vs.color_script.length === 0 && !vs.lighting && !vs.texture)) return null
  return (
    <div className="card space-y-3 p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-amber-glow/80">
        🎨 Hệ thị giác · Color Script
      </div>
      {vs.palette_note && <p className="text-xs text-slate-400">{vs.palette_note}</p>}
      {vs.color_script.length > 0 && (
        <div className="space-y-1">
          {vs.color_script
            .slice()
            .sort((a, b) => a.scene_order - b.scene_order)
            .map((c) => (
              <div key={c.scene_order} className="flex gap-2 text-xs text-slate-300">
                <span className="shrink-0 rounded bg-ink-800 px-1.5 py-0.5 text-[11px] font-medium text-amber-200">
                  Cảnh {c.scene_order}
                </span>
                <span>
                  {c.palette}
                  <span className="text-slate-500"> · {c.emotion}</span>
                  {c.contrast && <span className="text-slate-600"> · tương phản {c.contrast}</span>}
                  {c.saturation && <span className="text-slate-600"> · {c.saturation}</span>}
                </span>
              </div>
            ))}
        </div>
      )}
      {(vs.lighting || vs.texture) && (
        <div className="space-y-1 border-t border-ink-800 pt-2 text-xs text-slate-400">
          {vs.lighting && (
            <p>
              <span className="text-slate-500">Ánh sáng: </span>
              {vs.lighting}
            </p>
          )}
          {vs.texture && (
            <p>
              <span className="text-slate-500">Chất liệu: </span>
              {vs.texture}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
