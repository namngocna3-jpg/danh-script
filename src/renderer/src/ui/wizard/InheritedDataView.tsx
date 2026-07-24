import { useState } from 'react'
import type { ChatGateStage } from '../../../../shared/types'

const INHERIT_LABEL: Partial<Record<ChatGateStage, string>> = {
  gate1d_script: 'Ý đồ chốt + khung xương',
  gate_director: 'Narration final',
  gate_assets: 'Kịch bản + bối cảnh cảnh',
  gate_storyboard: 'Kịch bản + đạo diễn + @tag nguyên liệu',
  gate2_image: 'Khối phân cảnh + @tag + Color Script',
  gate3_video: 'Ảnh khung đầu + khối phân cảnh + @tag'
}

export function InheritedDataView({ stage }: { stage: ChatGateStage }): JSX.Element | null {
  const [open, setOpen] = useState(false)
  const label = INHERIT_LABEL[stage]
  if (!label) return null
  return (
    <div className="mt-4 rounded border border-neutral-200 text-sm">
      <button
        className="w-full text-left px-3 py-2 font-medium"
        onClick={() => setOpen((o) => !o)}
      >
        📥 Kế thừa từ bước trước {open ? '▾' : '▸'}
      </button>
      {open && <div className="px-3 py-2 text-neutral-600">{label}</div>}
    </div>
  )
}
