import { useApp } from '../store'

const NAV = [
  { key: 'dashboard', label: 'Dự án', icon: '◧', active: true },
  { key: 'styles', label: 'Thư viện Style', icon: '◈', active: false },
  { key: 'assets', label: 'Nhân vật', icon: '☺', active: false }
]

export function Sidebar(): JSX.Element {
  const llmInfo = useApp((s) => s.llmInfo)
  const openSettings = useApp((s) => s.openSettings)

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-ink-800 bg-ink-900/60 px-4 py-5">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-3 px-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-glow text-lg font-black text-ink-950 shadow-[0_4px_14px_-4px_rgba(245,181,68,0.7)]">
          D
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold text-white">Danh Script</div>
          <div className="text-[11px] text-slate-500">xưởng prompt tiền kỳ</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1">
        {NAV.map((item) => (
          <button
            key={item.key}
            disabled={!item.active}
            className={
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ' +
              (item.active
                ? 'bg-ink-800 font-semibold text-white'
                : 'text-slate-500 hover:text-slate-300 disabled:cursor-not-allowed disabled:opacity-60')
            }
          >
            <span className="w-4 text-center text-base">{item.icon}</span>
            {item.label}
            {!item.active && (
              <span className="ml-auto text-[10px] text-slate-600">sắp có</span>
            )}
          </button>
        ))}

        {/* Cấu hình — mở màn Cài đặt LLM */}
        <button
          onClick={openSettings}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500 transition hover:text-slate-300"
        >
          <span className="w-4 text-center text-base">⚙</span>
          Cấu hình
        </button>
      </nav>

      {/* Trạng thái model dưới cùng — bấm để mở Cài đặt */}
      <div className="mt-auto">
        <button
          onClick={openSettings}
          className="card w-full px-3 py-3 text-left transition hover:border-ink-700"
        >
          <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-500">
            Model sinh prompt
            <span className="text-slate-600">sửa ▸</span>
          </div>
          {llmInfo ? (
            <>
              <div className="truncate text-xs font-medium text-slate-200">
                {llmInfo.modelName}
              </div>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span
                  className={
                    'h-1.5 w-1.5 rounded-full ' +
                    (llmInfo.hasKey ? 'bg-emerald-400' : 'bg-red-400')
                  }
                />
                <span className="text-[11px] text-slate-500">
                  {llmInfo.provider} · {llmInfo.hasKey ? 'sẵn sàng' : 'thiếu key — bấm để nhập'}
                </span>
              </div>
            </>
          ) : (
            <div className="text-xs text-slate-600">đang tải…</div>
          )}
        </button>
      </div>
    </aside>
  )
}
