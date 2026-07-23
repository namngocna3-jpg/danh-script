import { useEffect, useMemo, useState } from 'react'
import type { Project, ProjectParams } from '@shared/types'
import { useApp } from '../../store'
import { useWizard } from '../../wizardStore'
import { PrepPanel } from './PrepPanel'
import { GateChatPanel } from './GateChatPanel'
import { OrchestratorPanel } from './OrchestratorPanel'
import { ParamsPanel } from './ParamsPanel'
import { DirectorPanel } from './DirectorPanel'
import { AssetStudioPanel } from './AssetStudioPanel'
import { ExportPanel } from './ExportPanel'

/**
 * 12 bước wizard (mô hình Toonflow đầy đủ): auto = Sếp điều phối, prep = tùy chọn tiền-ideal.
 * Kịch bản tách 4 bước chat độc lập; thêm Quy hoạch đạo diễn + Nguyên liệu SAU kịch bản.
 */
const STEPS = [
  { key: 'auto', label: '🤖 Tự động' },
  { key: 'prep', label: 'Chuẩn bị' },
  { key: 'gate0', label: 'Ý đồ' },
  { key: 'draft', label: 'Nháp' },
  { key: 'skeleton', label: 'Khung xương' },
  { key: 'adaptation', label: 'Chuyển thể' },
  { key: 'script', label: 'Kịch bản' },
  { key: 'params', label: 'Style' },
  { key: 'director', label: 'Đạo diễn' },
  { key: 'assets', label: 'Nguyên liệu' },
  { key: 'gate2', label: 'Prompt ảnh' },
  { key: 'gate3', label: 'Prompt video' },
  { key: 'export', label: 'Xuất' }
] as const

type StepKey = (typeof STEPS)[number]['key']

/** Từ stage đã lưu trong DB → bước wizard nên mở khi vừa mở dự án (mở ở bước KẾ TIẾP đã chốt). */
function stepFromStage(stage: Project['stage']): StepKey {
  switch (stage) {
    case 'draft':
      return 'prep'
    case 'gate0_ideal':
      return 'draft'
    case 'gate1a_draft':
      return 'skeleton'
    case 'gate1b_skeleton':
      return 'adaptation'
    case 'gate1c_adaptation':
      return 'script'
    case 'gate1d_script':
    case 'gate1_script': // legacy (kịch bản 1 cục) → sang chọn style
      return 'params'
    case 'gate_params':
      return 'director'
    case 'gate_director':
      return 'assets'
    case 'gate_assets':
      return 'gate2'
    case 'gate2_image':
      return 'gate3'
    case 'gate3_video':
    case 'gate4_export':
    case 'done':
      return 'export'
    default:
      return 'prep'
  }
}

export function WizardView({ project }: { project: Project }): JSX.Element {
  const closeProject = useApp((s) => s.closeProject)
  const resetForProject = useWizard((s) => s.resetForProject)
  const wizardError = useWizard((s) => s.wizardError)

  const [step, setStep] = useState<StepKey>(() => stepFromStage(project.stage))

  // Đổi dự án → xóa state tạm, nhảy về bước phù hợp stage
  useEffect(() => {
    resetForProject()
    setStep(stepFromStage(project.stage))
  }, [project.id, project.stage, resetForProject])

  const params = useMemo<ProjectParams | null>(() => {
    if (!project.params_json) return null
    try {
      return JSON.parse(project.params_json) as ProjectParams
    } catch {
      return null
    }
  }, [project.params_json])

  const idx = STEPS.findIndex((s) => s.key === step)

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

      {/* Stepper */}
      <div className="mb-8 flex flex-wrap items-center gap-1.5">
        {STEPS.map((s, i) => {
          const active = s.key === step
          const done = i < idx
          return (
            <button
              key={s.key}
              onClick={() => setStep(s.key)}
              className={
                'flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs transition ' +
                (active
                  ? 'border-amber-glow/60 bg-amber-glow/10 text-white'
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
                {done ? '✓' : i + 1}
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

      {/* Nội dung cổng */}
      {step === 'auto' && <OrchestratorPanel projectId={project.id} />}
      {step === 'prep' && (
        <PrepPanel projectId={project.id} onDone={() => setStep('gate0')} />
      )}
      {step === 'gate0' && (
        <GateChatPanel
          projectId={project.id}
          stage="gate0_ideal"
          gateId="gate0"
          title="GATE 0 · Ý đồ / bối cảnh"
          desc="Trợ lý đọc ideal, hỏi phần còn thiếu rồi dựng cảnh + bối cảnh từng cảnh (thời đại/nơi chốn). Chat để tinh chỉnh; chỉ qua bước sau khi bạn chốt."
          onDone={() => setStep('draft')}
        />
      )}
      {step === 'draft' && (
        <GateChatPanel
          projectId={project.id}
          stage="gate1a_draft"
          gateId="gate1a"
          title="Nháp kịch bản · Chốt hướng"
          desc="Thợ scriptDraft viết bản nháp gọn (mạch kể + tinh thần từng cảnh) để CHỐT HƯỚNG. Chưa cần lời thoại chỉn chu — chat để lái hướng/tông."
          onDone={() => setStep('skeleton')}
        />
      )}
      {step === 'skeleton' && (
        <GateChatPanel
          projectId={project.id}
          stage="gate1b_skeleton"
          gateId="gate1b"
          title="Khung xương cốt chuyện"
          desc="Thợ skeletonWright chốt logline + nhịp hook→cao trào→kết + đường cong cảm xúc + điểm trả bài. Bám nháp đã chốt."
          onDone={() => setStep('adaptation')}
        />
      )}
      {step === 'adaptation' && (
        <GateChatPanel
          projectId={project.id}
          stage="gate1c_adaptation"
          gateId="gate1c"
          title="Chiến lược chuyển thể"
          desc='Thợ adaptWright quy mỗi thông điệp → hành động/hình ảnh CỤ THỂ ("cho xem đừng kể") + motif hình + cạm bẫy cần né.'
          onDone={() => setStep('script')}
        />
      )}
      {step === 'script' && (
        <GateChatPanel
          projectId={project.id}
          stage="gate1d_script"
          gateId="gate1d"
          title="Kịch bản final · Narration + shot"
          desc="Thợ scriptFinal viết narration tiếng Việt CHỐT từng cảnh + quy hoạch shot mỗi cảnh (chia block). Chat để chỉnh giọng/độ dài."
          onDone={() => setStep('params')}
        />
      )}
      {step === 'params' && (
        <ParamsPanel
          projectId={project.id}
          initial={params}
          onDone={() => setStep('director')}
        />
      )}
      {step === 'director' && (
        <DirectorPanel projectId={project.id} onDone={() => setStep('assets')} />
      )}
      {step === 'assets' && (
        <AssetStudioPanel projectId={project.id} onDone={() => setStep('gate2')} />
      )}
      {step === 'gate2' && (
        <GateChatPanel
          projectId={project.id}
          stage="gate2_image"
          gateId="gate2"
          title="GATE 2 · Prompt ảnh khung đầu"
          desc="Thợ imgPrompter dựng prompt ảnh tiếng Anh (nhúng @tag nguyên liệu) cho mỗi block. Chat để chỉnh bố cục/ánh sáng; chỉ qua bước sau khi bạn chốt."
          onDone={() => setStep('gate3')}
        />
      )}
      {step === 'gate3' && (
        <GateChatPanel
          projectId={project.id}
          stage="gate3_video"
          gateId="gate3"
          title="GATE 3 · Prompt video"
          desc="Thợ vidPrompter dựng prompt video (STYLE/SCENE/MOTION/AUDIO/CONSTRAINTS + chữ CTA) cho mỗi block. Chat để chỉnh chuyển động/thoại; chỉ qua bước sau khi bạn chốt."
          onDone={() => setStep('export')}
        />
      )}
      {step === 'export' && <ExportPanel projectId={project.id} />}
    </div>
  )
}
