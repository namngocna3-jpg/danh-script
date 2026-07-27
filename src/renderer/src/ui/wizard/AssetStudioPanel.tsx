import { useEffect, useState, useCallback } from 'react'
import type { AssetFull, AssetDerivative, AssetRole, IdentityLock } from '@shared/types'
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
  const lockIdentity = useWizard((s) => s.lockIdentity)

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
                  projectId={projectId}
                  asset={a}
                  thumbs={thumbs}
                  busyTag={busyTag}
                  onAttach={attach}
                  onLock={(lock) => lockIdentity(projectId, a.tag, lock)}
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
      {/* ⭐ Khóa nhận dạng: hiện RIÊNG một dòng vì đây là thứ chặn chốt cổng và là nguyên
          nhân số 1 gây trôi mặt — gộp chung dòng trên thì người dùng lướt qua không thấy.
          Nói cả "mặt" lẫn "nhãn": danh sách này gồm cả nhân vật lẫn sản phẩm, mà chai sai
          nhãn giữa các cảnh còn nặng hơn diễn viên trôi mặt. */}
      <div className="w-full border-t border-ink-800 pt-1.5">
        {coverage.missingIdentity.length > 0 ? (
          <span className="text-rose-300">
            🔓 CHƯA khóa nhận dạng: {coverage.missingIdentity.map((t) => '@' + t).join(', ')} — mặt
            (nhân vật) và nhãn/dáng (sản phẩm) sẽ khác nhau giữa các cảnh. Bấm{' '}
            <b className="text-rose-200">🔓 Khóa mặt / Khóa sản phẩm</b> ở thẻ tương ứng bên dưới.
          </span>
        ) : (
          <span className="text-emerald-300">🔒 Đã khóa nhận dạng đủ nhân vật/sản phẩm</span>
        )}
      </div>
    </div>
  )
}

/** Thẻ 1 asset gốc + các biến thể phái sinh của nó. */
function AssetCard({
  projectId,
  asset,
  thumbs,
  busyTag,
  onAttach,
  onLock
}: {
  projectId: number
  asset: AssetFull
  thumbs: Record<string, string | null>
  busyTag: string | null
  onAttach: (tag: string) => void
  onLock: (lock: Partial<IdentityLock>) => Promise<boolean>
}): JSX.Element {
  const meta = ROLE_META[asset.role] ?? ROLE_META.char
  const [openLock, setOpenLock] = useState(false)
  // Chỉ nhân vật/sản phẩm mới cần khóa nhận dạng — bối cảnh/đạo cụ khóa bằng prompt là đủ.
  const needsLock = asset.role === 'char' || asset.role === 'product'
  const isProduct = asset.role === 'product'
  // Sản phẩm khóa BAO BÌ chứ không khóa mặt — gọi đúng tên để người dùng không tưởng
  // nút này chỉ dành cho nhân vật rồi bỏ qua (chai sai nhãn còn nặng hơn trôi mặt).
  const lockWord = isProduct ? 'khóa sản phẩm' : 'khóa mặt'
  const locked = hasAnyLock(asset.identity_lock)

  return (
    <div className="card flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <span className={'chip ' + meta.chip}>@{asset.tag}</span>
        <span className="text-[11px] text-slate-500">{meta.label}</span>
        <span className="truncate text-xs text-slate-400">{asset.name}</span>
        {needsLock && (
          <button
            type="button"
            onClick={() => setOpenLock((v) => !v)}
            title={
              locked
                ? 'Đã khóa nhận dạng — bấm để xem/sửa hồ sơ gốc'
                : isProduct
                  ? 'CHƯA khóa — nhãn/dáng sản phẩm sẽ khác nhau giữa các cảnh. Bấm để khóa.'
                  : 'CHƯA khóa — ảnh sẽ ra mặt khác nhau giữa các cảnh. Bấm để khóa.'
            }
            className={
              'ml-auto shrink-0 rounded border px-2 py-0.5 text-[11px] transition ' +
              (locked
                ? 'border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10'
                : 'border-rose-500/40 text-rose-300 hover:bg-rose-500/10')
            }
          >
            {locked ? `🔒 Đã ${lockWord}` : `🔓 ${lockWord[0].toUpperCase() + lockWord.slice(1)}`}
          </button>
        )}
        {asset.source === 'auto' && !needsLock && (
          <span className="ml-auto shrink-0 text-[10px] uppercase tracking-wide text-slate-600">
            tách tự động
          </span>
        )}
      </div>

      {openLock && needsLock && (
        <IdentityLockForm
          projectId={projectId}
          tag={asset.tag}
          role={asset.role}
          initial={asset.identity_lock}
          // Ảnh gốc HOẶC ảnh biến thể đều đọc được → nút "Đọc ảnh" sáng khi có bất kỳ tấm nào.
          hasImage={Boolean(
            asset.ref_image_path || asset.derivatives.some((d) => d.ref_image_path)
          )}
          onSave={onLock}
          onClose={() => setOpenLock(false)}
        />
      )}

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

/** Đã khóa gì chưa (mirror hasLock ở shared/anchor — renderer không import main). */
function hasAnyLock(lock: IdentityLock | null | undefined): boolean {
  if (!lock) return false
  // ⚠️ CHỈ tính tầng ẢNH (bỏ f.dyn) — phải khớp hasLock ở shared/anchor.ts. Nếu tính cả
  // ô "giọng"/"dáng điệu" thì điền mỗi giọng cũng báo ✅ đã khóa mặt, trong khi khối
  // [IDENTITY LOCK] vẫn rỗng và ảnh vẫn trôi mặt — đúng kiểu "sạch giả" đã vá ở cổng.
  return LOCK_FIELDS.some((f) => !f.dyn && lock[f.key]?.trim())
}

/**
 * Các ô của hồ sơ gốc, chia 2 tầng.
 *
 * **Tầng ẢNH** — thứ tự KHỚP anchorLine (ANCHOR_ORDER trong shared/anchor.ts) để người
 * dùng thấy đúng thứ tự chữ sẽ được ghép vào prompt. Đổi thứ tự ở đây mà quên đổi bên kia
 * thì form hiển thị một đằng, prompt ghép một nẻo.
 *
 * **Tầng ĐỘNG** (`dyn: true`) — KHÔNG vào prompt ảnh, chỉ dùng ở cổng video/voiceover.
 * Ảnh tĩnh không có dáng đi và giọng nói; nhét vào chỉ làm prompt phình và loãng tín hiệu.
 *
 * Placeholder viết TIẾNG ANH vì khối anchor đi thẳng vào prompt ảnh tiếng Anh.
 */
const LOCK_FIELDS: Array<{
  key: keyof IdentityLock
  label: string
  ph: string
  dyn?: boolean
  hint?: string
}> = [
  { key: 'age', label: 'Tuổi', ph: '26' },
  { key: 'face', label: 'Khuôn mặt · da', ph: 'Oval face, warm tan skin' },
  {
    key: 'features',
    label: 'Ngũ quan',
    ph: 'Single-fold almond eyes, straight nose bridge, thin lips'
  },
  {
    key: 'signature',
    label: '⭐ Dấu nhận diện',
    ph: 'Small mole below outer corner of left eye, scar through right eyebrow',
    hint: 'Nốt ruồi · sẹo · tàn nhang · xăm · răng khểnh. Ghim mặt MẠNH NHẤT — ưu tiên điền. Không có thì bỏ trống, đừng bịa.'
  },
  { key: 'hair', label: 'Tóc (mặc định)', ph: 'Black hair, shoulder-length, center part' },
  { key: 'body', label: 'Vóc dáng', ph: 'Athletic build, 7.5-head proportion, 1m65' },
  {
    key: 'wardrobe',
    label: 'Trang phục ký hiệu',
    ph: 'Round tortoiseshell glasses, teal brand hoodie',
    hint: '⚠️ CHỈ điền khi nhân vật mặc CÙNG bộ xuyên suốt phim (mascot/KOL/đồng phục). Phim đổi đồ theo cảnh → BỎ TRỐNG, không thì chống nhau với bối cảnh từng cảnh.'
  },
  { key: 'aura', label: 'Khí chất', ph: 'Quiet stubborn intensity' },
  {
    key: 'demeanor',
    label: '🎬 Dáng điệu · cử chỉ',
    ph: 'Long unhurried strides, tilts head left when listening',
    dyn: true,
    hint: 'Chỉ dùng ở cổng Video (không vào prompt ảnh) — giữ mọi block cùng một dáng đi.'
  },
  {
    key: 'voice',
    label: '🎙️ Giọng',
    ph: 'Low warm alto, unhurried pacing, soft Southern accent',
    dyn: true,
    hint: 'Chỉ dùng cho voiceover/lip-sync (không vào prompt ảnh).'
  }
]

/**
 * ⭐ NHÃN RIÊNG CHO SẢN PHẨM — cùng `key`, khác cách gọi.
 *
 * Vì sao ĐÈ NHÃN chứ không đẻ bộ ô mới: khối [IDENTITY LOCK] ghép theo ANCHOR_ORDER cố
 * định trong shared/anchor.ts; thêm khóa lạ sẽ bị lọc bỏ, đổi thứ tự thì 2 lần ghép ra 2
 * chuỗi khác nhau — đúng thứ cả cơ chế này sinh ra để chống. Nên vẫn 8 ô đó, chỉ đổi NGHĨA.
 *
 * Vì sao cần: "Ngũ quan · Tóc · Vóc dáng" đọc lên chẳng ăn nhập gì với một chai nước;
 * để nguyên là dụ người dùng điền bừa hoặc bỏ trống ô quan trọng nhất (chi tiết nhãn).
 *
 * `hide: true` = ô vô nghĩa với vật thể (tuổi/tóc/trang phục) → ẩn hẳn khỏi form.
 */
const PRODUCT_FIELD_OVERRIDE: Partial<
  Record<keyof IdentityLock, { label?: string; ph?: string; hint?: string; hide?: true }>
> = {
  age: { hide: true },
  hair: { hide: true },
  wardrobe: { hide: true },
  face: {
    label: 'Thân · vỏ · chất liệu',
    ph: 'Slim cylindrical aluminium can, matte teal body, satin finish',
    hint: 'Hình dáng bao bì + chất liệu + độ bóng. Kèm nắp/nút nếu có.'
  },
  features: {
    label: '⭐ Chi tiết nhãn',
    ph: 'Coconut-leaf logo centered upper third, white bold sans wordmark below, gold band at base',
    hint: 'Ô QUAN TRỌNG NHẤT với sản phẩm. Bố cục logo · kiểu chữ · dải màu theo thứ tự trên-xuống · màu nắp. Nói rõ màu gì, nằm ĐÂU.'
  },
  signature: {
    label: '⭐ Dấu thương hiệu',
    ph: 'Embossed coconut-leaf emblem, matte black cap',
    hint: 'Thứ nhìn phát nhận ra ngay: logo, khía dáng riêng, họa tiết dập nổi, màu nắp đặc trưng. Không đọc rõ thì bỏ trống, đừng đoán tên thương hiệu.'
  },
  body: {
    label: 'Tỉ lệ · dung tích',
    ph: '330ml, roughly 2.4:1 height-to-width, straight sides, slight shoulder taper',
    hint: 'Cao/mập bao nhiêu, dung tích. Sai tỉ lệ là chai ra méo giữa các cảnh.'
  },
  aura: {
    label: 'Cảm giác thương hiệu',
    ph: 'Clean tropical freshness, premium but approachable',
    hint: 'Tinh thần bao bì toát ra. CẤM nêu tên thương hiệu có thật khác.'
  }
}

/**
 * Bộ ô hiển thị cho 1 vai. Sản phẩm dùng nhãn đè + ẩn ô vô nghĩa; các vai khác giữ nguyên.
 * Thứ tự LUÔN theo LOCK_FIELDS để form khớp thứ tự chữ sẽ ghép vào prompt.
 */
function fieldsFor(role: AssetRole): typeof LOCK_FIELDS {
  if (role !== 'product') return LOCK_FIELDS
  const out: typeof LOCK_FIELDS = []
  for (const f of LOCK_FIELDS) {
    const ov = PRODUCT_FIELD_OVERRIDE[f.key]
    if (ov?.hide) continue
    out.push(ov ? { ...f, ...ov } : f)
  }
  return out
}

/** 1 ô của form khóa mặt. Tách riêng vì `hint` khiến markup dài, lặp 2 lần thì rối. */
function LockField({
  field,
  value,
  highlight,
  onChange
}: {
  field: (typeof LOCK_FIELDS)[number]
  value: string
  /** Ô này vừa được ĐỌC TỪ ẢNH điền → tô viền để người dùng biết chỗ cần soát. */
  highlight?: boolean
  onChange: (v: string) => void
}): JSX.Element {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wide text-slate-500">
        {field.label}
        {highlight && <span className="ml-1 normal-case text-sky-300">· từ ảnh</span>}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.ph}
        className={'input w-full text-xs' + (highlight ? ' border-sky-500/50' : '')}
      />
      {field.hint ? (
        <span className="text-[10px] leading-snug text-slate-600">{field.hint}</span>
      ) : null}
    </label>
  )
}

/**
 * ⭐ FORM KHÓA MẶT — đường tự phục vụ, không phải nhắn agent.
 * Vì sao cần: trước đây chỉ tool lock_identity (agent gọi) mới ghi được hồ sơ gốc. Thợ
 * quên là người dùng kẹt — đúng ca 11/11 asset lock=NULL. Giờ tự điền được ngay tại thẻ.
 */
function IdentityLockForm({
  projectId,
  tag,
  role,
  initial,
  hasImage,
  onSave,
  onClose
}: {
  projectId: number
  tag: string
  role: AssetRole
  initial: IdentityLock | null | undefined
  hasImage: boolean
  onSave: (lock: Partial<IdentityLock>) => Promise<boolean>
  onClose: () => void
}): JSX.Element {
  const isProduct = role === 'product'
  // Bộ ô HIỂN THỊ đổi theo vai; `form` vẫn giữ đủ 8 khóa để không nuốt mất dữ liệu cũ
  // (asset từng là nhân vật rồi đổi vai vẫn còn nguyên chữ đã lưu).
  const fields = fieldsFor(role)
  const imgFieldCount = fields.filter((f) => !f.dyn).length
  const [form, setForm] = useState<Record<string, string>>(() =>
    Object.fromEntries(LOCK_FIELDS.map((f) => [f.key, initial?.[f.key] ?? '']))
  )
  const [saving, setSaving] = useState(false)
  const [reading, setReading] = useState(false)
  /** Kết quả đọc ảnh: ghi chú của model + lỗi. null = chưa đọc lần nào. */
  const [readInfo, setReadInfo] = useState<{ notes: string; count: number } | null>(null)
  const [readErr, setReadErr] = useState<string | null>(null)
  /** Các ô vừa được ảnh điền — tô viền để người dùng biết chỗ nào cần soát lại. */
  const [fromImage, setFromImage] = useState<Set<string>>(new Set())
  // Đếm RIÊNG tầng ảnh ĐANG HIỆN: đó mới là thứ quyết định khóa được hay không.
  // Đếm theo `fields` chứ không LOCK_FIELDS — nếu không, sản phẩm còn sót chữ ở ô đã ẩn
  // (tuổi/tóc) sẽ được tính là "đã điền" trong khi người dùng không hề thấy ô đó.
  const filled = fields.filter((f) => !f.dyn && form[f.key]?.trim()).length

  /**
   * ⭐ Đọc ảnh → điền form. KHÔNG lưu — người dùng soát rồi mới bấm Lưu.
   *
   * Ghi đè cả ô đang có chữ (có chủ đích): người dùng chủ động bấm nút này nghĩa là họ
   * muốn lấy theo ảnh. Không mất gì vĩnh viễn vì chưa chạm DB — đóng form không lưu là xong.
   */
  async function readFromImage(): Promise<void> {
    setReading(true)
    setReadErr(null)
    const res = await window.danh.assets2.readImage(projectId, tag)
    setReading(false)
    if (!res.ok) {
      setReadErr(res.error)
      return
    }
    const { lock, notes, imageCount } = res.data
    const touched = new Set<string>()
    setForm((s) => {
      const next = { ...s }
      for (const [k, v] of Object.entries(lock)) {
        if (typeof v === 'string' && v.trim()) {
          next[k] = v.trim()
          touched.add(k)
        }
      }
      return next
    })
    setFromImage(touched)
    setReadInfo({ notes, count: imageCount })
  }

  async function save(): Promise<void> {
    setSaving(true)
    const okSaved = await onSave(form as Partial<IdentityLock>)
    setSaving(false)
    if (okSaved) onClose()
  }

  return (
    <div className="flex flex-col gap-2 rounded border border-amber-500/25 bg-amber-500/[0.04] p-3">
      <div className="text-[11px] leading-relaxed text-slate-400">
        <b className="text-amber-soft">Hồ sơ gốc @{tag}</b> — app ghép các ô{' '}
        <b className="text-slate-300">tầng ảnh</b> thành khối{' '}
        <code className="text-slate-300">[IDENTITY LOCK]</code> và chèn NGUYÊN VĂN vào đầu{' '}
        <b className="text-slate-300">mọi</b> prompt ảnh. Vì app ghép nên 16 block giống nhau đến
        từng ký tự. Viết <b className="text-slate-300">tiếng Anh</b>, cụ thể, chỉ tả đặc điểm{' '}
        <b className="text-slate-300">CỐ ĐỊNH</b>{' '}
        {isProduct ? (
          <>
            (không tả ánh sáng, giọt nước, tay cầm — đó là lớp mềm đổi theo cảnh).
            <div className="mt-1 text-emerald-200/70">
              Đây là <b>sản phẩm</b>: tả <b>bao bì</b>, không tả người. Nhãn sai màu hay logo lệch
              chỗ giữa các cảnh là hàng của khách bị vẽ sai — nặng hơn cả trôi mặt diễn viên.
            </div>
          </>
        ) : (
          <>(không tả biểu cảm — đó là lớp mềm đổi theo cảnh).</>
        )}
      </div>

      {/* ⭐ CHẾ ĐỘ TRỎ — phải nói rõ, nếu không người dùng điền đủ 8 ô rồi thấy prompt chỉ
          lấy 2 sẽ tưởng app nuốt mất chữ. Xem shared/anchor.ts · ANCHOR_ORDER_REF. */}
      {hasImage && (
        <div className="rounded border border-emerald-500/25 bg-emerald-500/5 p-2 text-[11px] leading-relaxed text-emerald-100/80">
          @{tag} <b className="text-emerald-200">đã có ảnh tư liệu</b> → khối{' '}
          <code className="text-slate-300">[IDENTITY LOCK]</code> chỉ lấy{' '}
          <b className="text-emerald-200">Dấu nhận diện + Khí chất</b>, kèm một câu trỏ về ảnh.{' '}
          {isProduct ? 'Bao bì' : 'Ngũ quan, tóc, vóc dáng'} thì{' '}
          <b className="text-emerald-200">ảnh đã nói hết</b> — tả lại bằng chữ là tạo nguồn thứ
          hai đánh nhau với ảnh, model vẽ ra {isProduct ? 'nhãn' : 'mặt'} thứ ba.
          <div className="mt-1 text-slate-400">
            Các ô còn lại <b className="text-slate-300">vẫn nên điền</b>: chúng được lưu, và sẽ
            dùng lại ngay nếu bạn gỡ ảnh — chỉ là tạm không vào prompt.
          </div>
        </div>
      )}

      {/* ⭐ Đọc ảnh: đường NHANH NHẤT để có hồ sơ đúng — model nhìn chính ảnh sẽ dùng làm
          tham chiếu, nên chữ và ảnh không còn nói hai đằng. */}
      <div className="flex flex-wrap items-center gap-2 rounded border border-ink-800 bg-ink-950/40 p-2">
        <button
          type="button"
          onClick={() => void readFromImage()}
          disabled={reading || !hasImage}
          title={
            hasImage
              ? 'Gửi ảnh tư liệu của @tag này cho model đọc rồi điền sẵn các ô bên dưới'
              : 'Chưa có ảnh — bấm “Upload ảnh” ở dưới trước đã'
          }
          className="btn-ghost px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40"
        >
          {reading
            ? '👁 Đang đọc ảnh…'
            : isProduct
              ? '👁 Đọc ảnh → tả bao bì'
              : '👁 Đọc ảnh → điền hồ sơ'}
        </button>
        <span className="text-[10px] leading-snug text-slate-500">
          {hasImage
            ? isProduct
              ? 'Model nhìn ảnh bao bì rồi tả nhãn/dáng/tỉ lệ. Bạn soát/sửa rồi mới bấm Lưu — app không tự lưu.'
              : 'Model nhìn ảnh bạn upload rồi điền sẵn. Bạn soát/sửa rồi mới bấm Lưu — app không tự lưu.'
            : 'Chưa có ảnh cho @tag này. Upload ảnh ở phần dưới thẻ rồi quay lại.'}
        </span>
      </div>

      {readErr && (
        <div className="rounded border border-rose-500/30 bg-rose-500/5 p-2 text-[11px] text-rose-200">
          Đọc ảnh hỏng: {readErr}
        </div>
      )}
      {readInfo && (
        <div className="rounded border border-sky-500/25 bg-sky-500/5 p-2 text-[11px] leading-relaxed text-sky-100/80">
          Đã đọc <b>{readInfo.count}</b> ảnh — các ô{' '}
          <b className="text-sky-200">viền xanh</b> là do ảnh điền,{' '}
          <b className="text-sky-200">hãy soát lại trước khi lưu</b>. Ô để trống nghĩa là ảnh
          không cho thấy rõ (model được dặn thà bỏ trống còn hơn bịa).
          {readInfo.notes && <div className="mt-1 text-slate-400">Ghi chú: {readInfo.notes}</div>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {fields
          .filter((f) => !f.dyn)
          .map((f) => (
            <LockField
              key={f.key}
              field={f}
              value={form[f.key] ?? ''}
              highlight={fromImage.has(f.key)}
              onChange={(v) => setForm((s) => ({ ...s, [f.key]: v }))}
            />
          ))}
      </div>

      {/* Tầng ĐỘNG tách hẳn ra: 2 ô này KHÔNG vào prompt ảnh. Để chung lưới trên thì
          người dùng tưởng điền vào là mặt được khóa chặt hơn — không phải.
          Ẩn với SẢN PHẨM: một cái chai không có dáng đi và giọng nói. */}
      {!isProduct && (
        <div className="flex flex-col gap-2 border-t border-ink-800 pt-2">
          <div className="text-[11px] text-slate-500">
            <b className="text-slate-400">Tầng động</b> — <b className="text-slate-400">không</b>{' '}
            vào prompt ảnh. Chỉ hiện ở cổng <b className="text-slate-400">Video</b> để mọi block
            cùng một dáng đi, một chất giọng. Bỏ trống cũng được.
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {fields
              .filter((f) => f.dyn)
              .map((f) => (
                <LockField
                  key={f.key}
                  field={f}
                  value={form[f.key] ?? ''}
                  onChange={(v) => setForm((s) => ({ ...s, [f.key]: v }))}
                />
              ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || filled === 0}
          className="btn-primary px-3 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Đang lưu…' : isProduct ? '🔒 Lưu khóa sản phẩm' : '🔒 Lưu khóa mặt'}
        </button>
        <button type="button" onClick={onClose} className="btn-ghost px-3 py-1 text-xs">
          Đóng
        </button>
        <span className="text-[11px] text-slate-500">
          {filled}/{imgFieldCount} ô tầng ảnh — điền ít nhất{' '}
          <b className="text-slate-400">
            {isProduct ? 'chi tiết nhãn + dấu thương hiệu + tỉ lệ' : 'khuôn mặt + ngũ quan + vóc dáng'}
          </b>
        </span>
      </div>
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
  // Model đôi khi trả color_script sai kiểu (không phải mảng) → .slice().sort() nổ,
  // sập cả Wizard. Ép về mảng an toàn trước khi dùng.
  const colorScript = Array.isArray(vs?.color_script) ? vs.color_script : []
  if (!vs || (colorScript.length === 0 && !vs.lighting && !vs.texture)) return null
  return (
    <div className="card space-y-3 p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-amber-glow/80">
        🎨 Hệ thị giác · Color Script
      </div>
      {vs.palette_note && <p className="text-xs text-slate-400">{vs.palette_note}</p>}
      {colorScript.length > 0 && (
        <div className="space-y-1">
          {colorScript
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
