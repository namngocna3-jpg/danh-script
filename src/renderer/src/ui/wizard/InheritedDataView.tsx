import { useState, type ReactNode } from 'react'
import type { ChatGateStage, PlanArtifacts, AssetFull, VisualSystem } from '@shared/types'
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
type InheritKey = 'brief' | 'draft' | 'skeleton' | 'adaptation' | 'director' | 'visual' | 'assets'

/** Mỗi stage kế thừa artifact nào của các bước TRƯỚC nó (theo thứ tự hiển thị). */
const INHERIT_KEYS: Partial<Record<ChatGateStage, InheritKey[]>> = {
  gate0_ideal: ['draft'],
  gate1b_skeleton: ['brief', 'draft'],
  gate1c_adaptation: ['brief', 'draft', 'skeleton'],
  gate1d_script: ['brief', 'draft', 'skeleton', 'adaptation'],
  gate_director: ['skeleton', 'adaptation'],
  gate_assets: ['skeleton', 'adaptation', 'director', 'visual'],
  gate_storyboard: ['skeleton', 'adaptation', 'director', 'assets'],
  gate2_image: ['visual', 'assets'],
  gate3_video: ['assets']
}

const KEY_TITLE: Record<InheritKey, string> = {
  brief: '🎯 Ý đồ chốt',
  draft: '📝 Bản nháp',
  skeleton: '🦴 Khung xương',
  adaptation: '🎬 Chuyển thể',
  director: '🎬 Quy hoạch đạo diễn',
  visual: '🎨 Hệ thị giác',
  assets: '🧩 Nguyên liệu (@tag)'
}

export function InheritedDataView({ stage }: { stage: ChatGateStage }): JSX.Element | null {
  const plan = useWizard((s) => s.plan)
  const assetsFull = useWizard((s) => s.assetsFull)
  const visualSystem = useWizard((s) => s.visualSystem)
  const [open, setOpen] = useState(false)

  const keys = INHERIT_KEYS[stage]
  if (!keys || keys.length === 0) return null

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
      if (!sk || (!sk.logline && (!sk.beats || sk.beats.length === 0)))
        return <Empty>Chưa có khung xương.</Empty>
      return (
        <div className="space-y-0.5">
          {sk.logline && <p className="italic text-slate-300">“{sk.logline}”</p>}
          {sk.beats?.length > 0 && (
            <p className="text-slate-500">
              {sk.beats
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
          {ad.show_dont_tell?.length > 0 && (
            <ul className="space-y-0.5">
              {ad.show_dont_tell.slice(0, 3).map((s, i) => (
                <li key={i}>• {s}</li>
              ))}
              {ad.show_dont_tell.length > 3 && (
                <li className="text-slate-600">… +{ad.show_dont_tell.length - 3} nữa</li>
              )}
            </ul>
          )}
        </div>
      )
    }
    case 'director': {
      const d = plan?.director
      if (!d || d.scenes.length === 0) return <Empty>Chưa có quy hoạch đạo diễn.</Empty>
      return (
        <p>
          {d.scenes.length} cảnh ·{' '}
          {d.scenes
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((s) => `C${s.order} ${s.emotion} ${s.emotion_intensity}/10`)
            .join(' · ')}
        </p>
      )
    }
    case 'visual': {
      const vs = plan?.visualSystem ?? visual
      if (!vs || (vs.color_script.length === 0 && !vs.lighting && !vs.texture))
        return <Empty>Chưa có hệ thị giác.</Empty>
      return (
        <div className="space-y-0.5">
          {vs.color_script.length > 0 && (
            <p>
              {vs.color_script
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
      if (assets.length === 0) return <Empty>Chưa có nguyên liệu.</Empty>
      return (
        <p>
          {assets.map((a) => `@${a.tag}`).join(' ')}
          <span className="text-slate-600"> ({assets.length} nguyên liệu)</span>
        </p>
      )
    }
    default:
      return null
  }
}
