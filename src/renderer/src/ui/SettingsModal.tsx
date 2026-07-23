import { useEffect, useState } from 'react'
import type { LlmProvider } from '@shared/types'
import { useApp } from '../store'

/** Preset gợi ý theo provider (điền sẵn model + baseUrl, người dùng sửa được). */
const PROVIDERS: {
  key: LlmProvider
  label: string
  desc: string
  model: string
  baseUrl: string
}[] = [
  {
    key: 'anthropic',
    label: 'Anthropic',
    desc: 'Gọi thẳng Claude (Opus 4.8) — hỗ trợ tool-use đầy đủ',
    model: 'claude-opus-4-8',
    baseUrl: 'https://api.anthropic.com'
  },
  {
    key: '9router',
    label: '9router',
    desc: 'Cổng gom — nhập baseUrl + model theo tài khoản của bạn',
    model: 'claude-opus-4-8',
    baseUrl: 'https://9router.example/v1'
  },
  {
    key: 'beeknoee',
    label: 'beeknoee',
    desc: 'Cổng gom API của bạn (OpenAI-compatible)',
    model: 'claude-opus-4-8',
    baseUrl: 'https://platform.beeknoee.com/api/v1'
  }
]

/** Màn Cài đặt LLM: chọn provider, dán API key (mã hóa theo máy), test. */
export function SettingsModal({ onClose }: { onClose: () => void }): JSX.Element {
  const loadLlmInfo = useApp((s) => s.loadLlmInfo)

  const [provider, setProvider] = useState<LlmProvider>('anthropic')
  const [modelName, setModelName] = useState('claude-opus-4-8')
  const [baseUrl, setBaseUrl] = useState('https://api.anthropic.com')
  const [apiKey, setApiKey] = useState('') // để trống = giữ key cũ
  const [hasKey, setHasKey] = useState(false)
  const [encrypted, setEncrypted] = useState(false)

  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // Danh sách model lấy từ cổng gom (9router/beeknoee) qua /v1/models
  const [models, setModels] = useState<string[]>([])
  const [loadingModels, setLoadingModels] = useState(false)

  // Nạp cài đặt hiện tại
  useEffect(() => {
    void (async () => {
      const res = await window.danh.settings.get()
      if (res.ok) {
        setProvider(res.data.provider)
        setModelName(res.data.modelName)
        setBaseUrl(res.data.baseUrl)
        setHasKey(res.data.hasKey)
        setEncrypted(res.data.encrypted)
      }
    })()
  }, [])

  /** Đổi provider → điền sẵn model/baseUrl preset (chỉ khi ô đang khớp preset cũ). */
  function pickProvider(p: LlmProvider): void {
    const preset = PROVIDERS.find((x) => x.key === p)!
    const prevPreset = PROVIDERS.find((x) => x.key === provider)!
    setProvider(p)
    // nếu người dùng chưa sửa tay thì cập nhật theo preset mới
    if (baseUrl === prevPreset.baseUrl || !baseUrl.trim()) setBaseUrl(preset.baseUrl)
    if (modelName === prevPreset.model || !modelName.trim()) setModelName(preset.model)
  }

  async function save(): Promise<void> {
    setBusy(true)
    setTestMsg(null)
    const res = await window.danh.settings.save({
      provider,
      modelName: modelName.trim(),
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim() || undefined // trống = giữ key cũ
    })
    setBusy(false)
    if (res.ok) {
      setHasKey(res.data.hasKey)
      setEncrypted(res.data.encrypted)
      setApiKey('')
      setSaved(true)
      setTimeout(() => setSaved(false), 1800)
      await loadLlmInfo()
    } else {
      setTestMsg({ ok: false, text: res.error })
    }
  }

  /** Lưu rồi ping model 1 phát để chắc key chạy. */
  async function saveAndTest(): Promise<void> {
    await save()
    setBusy(true)
    setTestMsg({ ok: true, text: 'Đang gọi thử model…' })
    const res = await window.danh.llm.ping()
    setBusy(false)
    if (res.ok) setTestMsg({ ok: true, text: `✔ Model trả lời: "${res.data}"` })
    else setTestMsg({ ok: false, text: `✘ ${res.error}` })
  }

  /** Gọi cổng gom lấy danh sách model (dùng baseUrl đang gõ, key đã lưu). */
  async function fetchModels(): Promise<void> {
    setLoadingModels(true)
    setTestMsg(null)
    const res = await window.danh.llm.listModels({ baseUrl: baseUrl.trim() })
    setLoadingModels(false)
    if (res.ok) {
      setModels(res.data)
      if (res.data.length === 0) {
        setTestMsg({ ok: false, text: 'Cổng không trả model nào (kiểm tra baseUrl/key).' })
      } else {
        setTestMsg({ ok: true, text: `✔ Lấy được ${res.data.length} model — chọn ở ô dưới.` })
      }
    } else {
      setTestMsg({ ok: false, text: `✘ ${res.error}` })
    }
  }

  async function clearKey(): Promise<void> {
    setBusy(true)
    const res = await window.danh.settings.save({ provider, apiKey: '__CLEAR__' })
    setBusy(false)
    if (res.ok) {
      setHasKey(false)
      setApiKey('')
      setTestMsg(null)
      await loadLlmInfo()
    }
  }

  const inputCls =
    'w-full rounded-xl border border-ink-700 bg-ink-850 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-amber-glow/50'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-1 text-lg font-bold text-white">Cấu hình model sinh prompt</h2>
        <p className="mb-5 text-sm text-slate-500">
          Đây là model <span className="text-amber-soft">viết prompt</span> (Claude/9router) —
          KHÁC model render BytePlus/Seedance (chạy ở Coco). Key được mã hóa theo máy.
        </p>

        {/* Provider */}
        <label className="mb-1.5 block text-xs font-medium text-slate-400">Nhà cung cấp</label>
        <div className="mb-4 grid grid-cols-3 gap-2">
          {PROVIDERS.map((p) => (
            <button
              key={p.key}
              onClick={() => pickProvider(p.key)}
              title={p.desc}
              className={
                'rounded-xl border px-2.5 py-2 text-center text-xs transition ' +
                (provider === p.key
                  ? 'border-amber-glow/60 bg-amber-glow/10 text-white'
                  : 'border-ink-700 bg-ink-850 text-slate-400 hover:border-ink-600')
              }
            >
              <div className="font-semibold">{p.label}</div>
            </button>
          ))}
        </div>
        <p className="mb-4 -mt-2 text-[11px] text-slate-600">
          {PROVIDERS.find((p) => p.key === provider)?.desc}
        </p>

        {/* Model */}
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-xs font-medium text-slate-400">Tên model</label>
          {provider !== 'anthropic' && (
            <button
              className="text-[11px] text-amber-soft hover:underline disabled:opacity-50"
              disabled={loadingModels || busy}
              onClick={() => void fetchModels()}
            >
              {loadingModels ? 'Đang lấy…' : '↻ Lấy danh sách model'}
            </button>
          )}
        </div>
        {models.length > 0 && (
          <select
            value={models.includes(modelName) ? modelName : ''}
            onChange={(e) => setModelName(e.target.value)}
            className={inputCls + ' mb-2'}
          >
            <option value="" disabled>
              — Chọn model ({models.length}) —
            </option>
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        )}
        <input
          value={modelName}
          onChange={(e) => setModelName(e.target.value)}
          placeholder="claude-opus-4-8"
          className={inputCls + ' mb-4'}
        />

        {/* Base URL */}
        <label className="mb-1.5 block text-xs font-medium text-slate-400">
          Base URL {provider === 'anthropic' && <span className="text-slate-600">(mặc định OK)</span>}
        </label>
        <input
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="https://api.anthropic.com"
          className={inputCls + ' mb-4'}
        />

        {/* API key */}
        <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-slate-400">
          API key
          {hasKey && (
            <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] text-emerald-300">
              đã lưu{encrypted ? ' · mã hóa theo máy' : ' · CHƯA mã hóa'}
            </span>
          )}
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={hasKey ? '•••••• (để trống = giữ key cũ)' : 'dán API key vào đây'}
          className={inputCls}
        />
        <div className="mb-5 mt-1.5 flex items-center justify-between">
          <span className="text-[11px] text-slate-600">
            {encrypted
              ? 'Key mã hóa bằng safeStorage — copy file sang máy khác không đọc được.'
              : '⚠ Máy này không hỗ trợ mã hóa — key lưu dạng thường.'}
          </span>
          {hasKey && (
            <button
              className="text-[11px] text-red-400 hover:underline"
              onClick={() => void clearKey()}
            >
              Xóa key
            </button>
          )}
        </div>

        {testMsg && (
          <div
            className={
              'mb-4 rounded-xl border px-3 py-2.5 text-xs ' +
              (testMsg.ok
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : 'border-red-500/30 bg-red-500/10 text-red-300')
            }
          >
            {testMsg.text}
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>
            Đóng
          </button>
          <button
            className="btn-ghost text-xs disabled:opacity-50"
            disabled={busy}
            onClick={() => void saveAndTest()}
          >
            Lưu + Test
          </button>
          <button
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            disabled={busy}
            onClick={() => void save()}
          >
            {busy ? 'Đang lưu…' : saved ? '✔ Đã lưu' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  )
}
