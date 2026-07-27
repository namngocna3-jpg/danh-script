import { useState, type ReactNode } from 'react'
import type { ChatGateStage, PlanArtifacts, AssetFull, VisualSystem } from '@shared/types'
import { inheritKeysFor, type InheritKey } from '@shared/wizardSteps'
import { useWizard } from '../../wizardStore'

/**
 * KHỐI "📥 Kế thừa từ bước trước" — hiện NỘI DUNG THẬT các artifact bước trước
 * (đọc từ store useWizard: plan.brief/draft/skeleton/adaptation/director + assetsFull + visualSystem),
 * KHÔNG chỉ in nhãn tĩnh. Nhờ vậy khi sửa 1 bước rồi quay lại, khối này đổi theo →
 * người dùng TẬN MẮT thấy dữ liệu chảy giữa các bước.
 *
 * Chỉ render các artifact store renderer đang có (plan + assets2). Narration/blocks final
 * lưu theo cảnh trong DB, chưa expose ra renderer → không liệt kê ở đây (xem cột output).
 */
const KEY_TITLE: Record<InheritKey, string> = {
  brief: '🎯 Ý đồ chốt',
  draft: '📝 Bản nháp',
  skeleton: '🦴 Khung xương',
  adaptation: '🎬 Chuyển thể',
  director: '🎬 Quy hoạch đạo diễn',
  visual: '🎨 Hệ thị giác',
  assets: '🧩 Nguyên liệu (@tag)',
  script: '📜 Kịch bản final'
}

export function InheritedDataView({ stage }: { stage: ChatGateStage }): JSX.Element | null {
  const plan = useWizard((s) => s.plan)
  const assetsFull = useWizard((s) => s.assetsFull)
  const visualSystem = useWizard((s) => s.visualSystem)
  const [open, setOpen] = useState(false)

  // Cùng nguồn với backend (buildInheritedLedger) → panel này LUÔN khớp thứ thợ thật sự nhận.
  const keys = inheritKeysFor(stage)
  if (keys.length === 0) return null

  return (
    <div className="mt-4 rounded-xl border border-ink-800 bg-ink-950/40 text-sm">
      <button
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left font-medium text-slate-300 hover:text-white"
        onClick={() => setOpen((o) => !o)}
      >
        <span>📥 Kế thừa từ bước trước</span>
        <span className="text-slate-500">{open ? '▾' : '▸'}</span>
        {!open && (
          <span className="ml-auto truncate text-[11px] text-slate-600">
            {keys.map((k) => KEY_TITLE[k].replace(/^\S+\s/, '')).join(' · ')}
          </span>
        )}
      </button>
      {open && (
        <div className="space-y-3 border-t border-ink-800 px-3 py-3">
          {keys.map((k) => (
            <InheritBlock
              key={k}
              title={KEY_TITLE[k]}
              body={renderKey(k, plan, assetsFull, visualSystem)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function InheritBlock({ title, body }: { title: string; body: ReactNode }): JSX.Element {
  return (
    <div className="space-y-1">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-glow/70">
        {title}
      </div>
      <div className="text-xs leading-relaxed text-slate-400">{body}</div>
    </div>
  )
}

function Empty({ children }: { children: ReactNode }): JSX.Element {
  return <span className="italic text-slate-600">{children}</span>
}

/**
 * Chắn mảng: LLM đôi khi trả 1 CHUỖI/OBJECT ở chỗ đáng lẽ là mảng. Chuỗi vẫn có .length
 * nên lọt guard `x.length > 0`, rồi .map/.sort nổ TypeError → sập cả panel "Kế thừa".
 * Không phải mảng → trả [] (coi như chưa có dữ liệu) thay vì crash. Cùng tinh thần với
 * toArr() ở StageOutputView.
 */
function arr<T>(v: T[] | null | undefined): T[] {
  return Array.isArray(v) ? v : []
}

/** Render 1 artifact kế thừa thành nội dung gọn (đủ để đối chiếu, không phải bản đầy đủ). */
function renderKey(
  k: InheritKey,
  plan: PlanArtifacts | null,
  assets: AssetFull[],
  visual: VisualSystem | null
): ReactNode {
  switch (k) {
    case 'brief': {
      const b = plan?.brief
      if (!b) return <Empty>Chưa có ý đồ chốt.</Empty>
      return (
        <div className="space-y-0.5">
          {b.core_message && <p>{b.core_message}</p>}
          {b.output_intent && <p className="text-slate-500">Ý đồ đầu ra: {b.output_intent}</p>}
          {b.mood && <p className="text-slate-500">Mood: {b.mood}</p>}
        </div>
      )
    }
    case 'draft': {
      const d = plan?.draft
      if (!d) return <Empty>Chưa có bản nháp.</Empty>
      return <p className="line-clamp-4 whitespace-pre-wrap">{d}</p>
    }
    case 'skeleton': {
      const sk = plan?.skeleton
      const beats = arr(sk?.beats)
      if (!sk || (!sk.logline && beats.length === 0)) return <Empty>Chưa có khung xương.</Empty>
      return (
        <div className="space-y-0.5">
          {sk.logline && <p className="italic text-slate-300">“{sk.logline}”</p>}
          {beats.length > 0 && (
            <p className="text-slate-500">
              {beats
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((b) => `${b.order}.${b.role}`)
                .join(' → ')}
            </p>
          )}
        </div>
      )
    }
    case 'adaptation': {
      const ad = plan?.adaptation
      if (!ad || !ad.approach) return <Empty>Chưa có chiến lược chuyển thể.</Empty>
      return (
        <div className="space-y-0.5">
          <p>
            Hướng: {ad.approach}
            {ad.tone && <span className="text-slate-500"> · tông {ad.tone}</span>}
          </p>
          {arr(ad.show_dont_tell).length > 0 && (
            <ul className="space-y-0.5">
              {arr(ad.show_dont_tell)
                .slice(0, 3)
                .map((s, i) => (
                  <li key={i}>• {String(s)}</li>
                ))}
              {arr(ad.show_dont_tell).length > 3 && (
                <li className="text-slate-600">… +{arr(ad.show_dont_tell).length - 3} nữa</li>
              )}
            </ul>
          )}
        </div>
      )
    }
    case 'director': {
      const scenes = arr(plan?.director?.scenes)
      if (scenes.length === 0) return <Empty>Chưa có quy hoạch đạo diễn.</Empty>
      return (
        <p>
          {scenes.length} cảnh ·{' '}
          {scenes
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((s) => `C${s.order} ${s.emotion} ${s.emotion_intensity}/10`)
            .join(' · ')}
        </p>
      )
    }
    case 'visual': {
      const vs = plan?.visualSystem ?? visual
      const cs = arr(vs?.color_script)
      if (!vs || (cs.length === 0 && !vs.lighting && !vs.texture))
        return <Empty>Chưa có hệ thị giác.</Empty>
      return (
        <div className="space-y-0.5">
          {cs.length > 0 && (
            <p>
              {cs
                .slice()
                .sort((a, b) => a.scene_order - b.scene_order)
                .map((c) => `C${c.scene_order}:${c.palette}`)
                .join(' · ')}
            </p>
          )}
          {vs.lighting && <p className="text-slate-500">Ánh sáng: {vs.lighting}</p>}
        </div>
      )
    }
    case 'assets': {
      const list = arr(assets)
      if (list.length === 0) return <Empty>Chưa có nguyên liệu.</Empty>
      return (
        <p>
          {list.map((a) => `@${a.tag}`).join(' ')}
          <span className="text-slate-600"> ({list.length} nguyên liệu)</span>
        </p>
      )
    }
    case 'script': {
      // Narration final lưu trong bảng scenes (chưa expose ra renderer). Ở ĐÂY chỉ báo TRUNG THỰC
      // rằng nó ĐƯỢC ĐẨY THẲNG vào thợ ở backend (buildInheritedLedger key='script') — không bịa
      // nội dung giả. Toàn văn xem ở cột output/bản xuất; điều quan trọng: thợ LUÔN nhận được nó.
      return (
        <span className="text-slate-500">
          Lời thoại chốt từng cảnh được <b className="text-slate-300">nạp thẳng cho thợ</b> ở bước
          này (không phụ thuộc thợ tự gọi tool). Xem toàn văn ở cột kết quả bên phải.
        </span>
      )
    }
    default:
      return null
  }
}
