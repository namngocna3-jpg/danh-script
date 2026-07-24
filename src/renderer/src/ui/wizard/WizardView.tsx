import { useEffect, useMemo, useState } from 'react'
import type { Project, ProjectParams } from '@shared/types'
import {
  WIZARD_STEPS,
  stepFromStage,
  stepUnlocked,
  stepConfirmed,
  type StepKey
} from '@shared/wizardSteps'
import { useApp } from '../../store'
import { useWizard } from '../../wizardStore'
import { PrepPanel } from './PrepPanel'
import { GateChatPanel } from './GateChatPanel'
import { OrchestratorPanel } from './OrchestratorPanel'
import { ParamsPanel } from './ParamsPanel'
import { DirectorPanel } from './DirectorPanel'
import { AssetStudioPanel } from './AssetStudioPanel'
import { ExportPanel } from './ExportPanel'
import { ScriptWorkbench } from './ScriptWorkbench'
import { StoryboardPanel } from './StoryboardPanel'

/**
 * Wizard 13 bước (mô hình Toonflow đầy đủ). Thứ tự + nhãn + luật khóa nằm
 * TRỌN VẸN ở @shared/wizardSteps — file này chỉ render + nối onDone.
 *
 * THỨ TỰ MỚI: Nháp → Ý đồ → Khung xương → Chuyển thể → Final → Style → …
 * (đảo Ý đồ xuống SAU Nháp: đọc kỹ nháp rồi mới chốt ý đồ — bottom-up).
 */
export function WizardView({ project }: { project: Project }): JSX.Element {
  const closeProject = useApp((s) => s.closeProject)
  const refreshActiveProject = useApp((s) => s.refreshActiveProject)
  const resetForProject = useWizard((s) => s.resetForProject)
  const wizardError = useWizard((s) => s.wizardError)

  const [step, setStep] = useState<StepKey>(() => stepFromStage(project.stage))

  // Đổi dự án → xóa state tạm, nhảy về bước phù hợp stage.
  // CHỈ phụ thuộc project.id: khi CHÍNH stage đổi (do vừa chốt) ta KHÔNG muốn
  // reset/nhảy bước — advance() đã tự setStep. Nếu để [project.stage] ở đây,
  // mỗi lần chốt sẽ resetForProject giữa chừng gây nháy state.
  useEffect(() => {
    resetForProject()
    setStep(stepFromStage(project.stage))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id, resetForProject])

  // Chốt xong 1 bước: refresh project.stage (mở khóa bước kế) rồi sang bước đó.
  function advance(next: StepKey): void {
    void refreshActiveProject()
    setStep(next)
  }

  const params = useMemo<ProjectParams | null>(() => {
    if (!project.params_json) return null
    try {
      return JSON.parse(project.params_json) as ProjectParams
    } catch {
      return null
    }
  }, [project.params_json])

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      {/* Header + breadcrumb */}
      <div className="mb-6 flex items-center gap-3">
        <button className="btn-ghost px-2.5 py-1.5 text-xs" onClick={closeProject}>
          ← Dự án
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-white">{project.name}</h1>
        </div>
      </div>

      {/* Stepper — khóa TƯƠNG LAI, mở QUÁ KHỨ (dựa trên project.stage) */}
      <div className="mb-8 flex flex-wrap items-center gap-1.5">
        {WIZARD_STEPS.map((s, i) => {
          const active = s.key === step
          const done = stepConfirmed(s.key, project.stage)
          const unlocked = stepUnlocked(s.key, project.stage)
          return (
            <button
              key={s.key}
              disabled={!unlocked}
              title={unlocked ? undefined : 'Chốt các bước trước để mở khóa bước này'}
              onClick={() => unlocked && setStep(s.key)}
              className={
                'flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs transition ' +
                (active
                  ? 'border-amber-glow/60 bg-amber-glow/10 text-white'
                  : !unlocked
                    ? 'cursor-not-allowed border-ink-800 bg-ink-900/20 text-slate-700 opacity-50'
                    : done
                      ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300'
                      : 'border-ink-800 bg-ink-900/40 text-slate-500 hover:border-ink-700')
              }
            >
              <span
                className={
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ' +
                  (active
                    ? 'bg-amber-glow text-ink-950'
                    : done
                      ? 'bg-emerald-500/30 text-emerald-200'
                      : 'bg-ink-800 text-slate-500')
                }
              >
                {!unlocked ? '🔒' : done ? '✓' : i + 1}
              </span>
              <span className="truncate">{s.label}</span>
            </button>
          )
        })}
      </div>

      {wizardError && (
        <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {wizardError}
        </div>
      )}

      {/* Nội dung cổng — THỨ TỰ MỚI: Nháp trước Ý đồ */}
      {step === 'auto' && <OrchestratorPanel projectId={project.id} />}
      {step === 'prep' && (
        <PrepPanel projectId={project.id} onDone={() => advance('script')} />
      )}
      {step === 'script' && (
        <ScriptWorkbench projectId={project.id} onDone={() => advance('params')} />
      )}
      {step === 'params' && (
        <ParamsPanel
          projectId={project.id}
          initial={params}
          onDone={() => advance('director')}
        />
      )}
      {step === 'director' && (
        <DirectorPanel projectId={project.id} onDone={() => advance('assets')} />
      )}
      {step === 'assets' && (
        <AssetStudioPanel projectId={project.id} onDone={() => advance('storyboard')} />
      )}
      {step === 'storyboard' && (
        <StoryboardPanel projectId={project.id} onDone={() => advance('gate2')} />
      )}
      {step === 'gate2' && (
        <GateChatPanel
          projectId={project.id}
          stage="gate2_image"
          gateId="gate2"
          title="GATE 2 · Prompt ảnh khung đầu"
          desc="Thợ imgPrompter dựng prompt ảnh tiếng Anh (nhúng @tag nguyên liệu) cho mỗi block. Chat để chỉnh bố cục/ánh sáng; chỉ qua bước sau khi bạn chốt."
          onDone={() => advance('gate3')}
        />
      )}
      {step === 'gate3' && (
        <GateChatPanel
          projectId={project.id}
          stage="gate3_video"
          gateId="gate3"
          title="GATE 3 · Prompt video"
          desc="Thợ vidPrompter dựng prompt video (STYLE/SCENE/MOTION/AUDIO/CONSTRAINTS + chữ CTA) cho mỗi block. Chat để chỉnh chuyển động/thoại; chỉ qua bước sau khi bạn chốt."
          onDone={() => advance('export')}
        />
      )}
      {step === 'export' && <ExportPanel projectId={project.id} />}
    </div>
  )
}
