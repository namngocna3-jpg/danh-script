import { useState } from 'react'
import type { ChatGateStage } from '@shared/types'
import { stageRank } from '@shared/wizardSteps'
import { useApp } from '../../store'
import { type GateId } from '../../wizardStore'
import { GateWorkbench } from './GateWorkbench'
import { StageOutputView } from './StageOutputView'
import { InheritedDataView } from './InheritedDataView'

/**
 * Bàn làm việc KỊCH BẢN — gộp 5 cổng chữ (Nháp → Ý đồ → Khung xương → Chuyển thể → Final)
 * thành 5 tab trong 1 màn. Tab N chỉ MỞ khi stage của tab (N-1) đã CHỐT (khóa tương lai,
 * mở quá khứ). Chốt Final → onDone (sang Style).
 *
 * Thứ tự tab theo pipeline bottom-up: draft → gate0 → skeleton → adaptation → script
 * (khớp WizardView cũ).
 */
const TABS: Array<{ gateId: GateId; stage: ChatGateStage; label: string; title: string; desc: string }> = [
  { gateId: 'gate1a', stage: 'gate1a_draft', label: 'Nháp', title: 'Nháp kịch bản', desc: 'Bung hướng kể từ ý tưởng thô.' },
  { gateId: 'gate0', stage: 'gate0_ideal', label: 'Ý đồ', title: 'Ý đồ chốt', desc: 'Chưng cất ý đồ cốt lõi từ nháp.' },
  { gateId: 'gate1b', stage: 'gate1b_skeleton', label: 'Khung xương', title: 'Khung xương', desc: 'Logline + nhịp + đường cong cảm xúc.' },
  { gateId: 'gate1c', stage: 'gate1c_adaptation', label: 'Chuyển thể', title: 'Chiến lược chuyển thể', desc: 'Cho xem đừng kể + motif.' },
  { gateId: 'gate1d', stage: 'gate1d_script', label: 'Final', title: 'Kịch bản final', desc: 'Narration chốt + quy hoạch shot.' }
]

export function ScriptWorkbench({ projectId, onDone }: { projectId: number; onDone: () => void }): JSX.Element {
  const [active, setActive] = useState(0)
  // Stage dự án hiện tại nằm ở store app (activeProject.stage) — dùng để khóa tab.
  const stage = useApp((s) => s.activeProject?.stage ?? 'draft')

  // Tab i mở khi stage tab (i-1) đã chốt — tái dùng convention stageRank của wizardSteps.
  const tabUnlocked = (i: number): boolean =>
    i === 0 || stageRank(stage) >= stageRank(TABS[i - 1].stage)

  const t = TABS[active]
  const isFinal = active === TABS.length - 1

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1.5 border-b border-ink-800">
        {TABS.map((tab, i) => {
          const unlocked = tabUnlocked(i)
          const isActive = i === active
          return (
            <button
              key={tab.gateId}
              disabled={!unlocked}
              title={unlocked ? undefined : 'Chốt tab trước để mở khóa tab này'}
              onClick={() => unlocked && setActive(i)}
              className={
                '-mb-px rounded-t-lg border-b-2 px-3 py-2 text-xs transition ' +
                (isActive
                  ? 'border-amber-glow font-medium text-white'
                  : !unlocked
                    ? 'cursor-not-allowed border-transparent text-slate-700 opacity-40'
                    : 'border-transparent text-slate-400 hover:text-slate-200')
              }
            >
              {!unlocked ? '🔒 ' : ''}
              {tab.label}
            </button>
          )
        })}
      </div>
      <GateWorkbench
        projectId={projectId}
        stage={t.stage}
        gateId={t.gateId}
        title={t.title}
        desc={t.desc}
        onDone={() => (isFinal ? onDone() : setActive(active + 1))}
        rightPanel={
          <>
            <StageOutputView stage={t.stage} />
            <InheritedDataView stage={t.stage} />
          </>
        }
      />
    </div>
  )
}
