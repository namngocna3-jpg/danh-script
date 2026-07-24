import type { Ideal, Pipeline, Project, Stage } from '@shared/types'
import { useApp } from '../store'

const PIPELINE_LABEL: Record<Pipeline, string> = {
  free: 'Tự do',
  affiliate: 'Affiliate',
  tvc: 'TVC Short',
  fashion: 'Fashion'
}

const STAGE_LABEL: Record<Stage, string> = {
  draft: 'Nháp',
  gate0_ideal: 'GATE 0 · Ý đồ',
  gate1a_draft: 'Nháp kịch bản',
  gate1b_skeleton: 'Khung xương',
  gate1c_adaptation: 'Chuyển thể',
  gate1d_script: 'Kịch bản final',
  gate1_script: 'GATE 1 · Kịch bản',
  gate_params: 'GATE · Tham số',
  gate_director: 'Quy hoạch đạo diễn',
  gate_assets: 'Nguyên liệu',
  gate_storyboard: 'Phân cảnh',
  gate2_image: 'GATE 2 · Prompt ảnh',
  gate3_video: 'GATE 3 · Prompt video',
  gate4_export: 'GATE 4 · Xuất',
  done: 'Hoàn tất'
}

export function ProjectCard({ project }: { project: Project }): JSX.Element {
  const deleteProject = useApp((s) => s.deleteProject)
  const openProject = useApp((s) => s.openProject)
  let ideal: Ideal = { raw: '' }
  try {
    ideal = JSON.parse(project.ideal_json)
  } catch {
    /* giữ mặc định */
  }

  return (
    <div className="card group relative flex flex-col p-5 transition hover:border-ink-600">
      <div className="mb-3 flex items-center gap-2">
        <span className="chip">{PIPELINE_LABEL[project.pipeline]}</span>
        <span className="chip border-amber-glow/30 text-amber-soft">
          {STAGE_LABEL[project.stage]}
        </span>
      </div>

      <h3 className="mb-1.5 line-clamp-1 text-base font-semibold text-white">
        {project.name}
      </h3>
      <p className="mb-4 line-clamp-2 text-sm text-slate-500">
        {ideal.raw || 'Chưa có mô tả ideal.'}
      </p>

      <div className="mt-auto flex items-center justify-between">
        <span className="text-[11px] text-slate-600">
          {formatDate(project.created_at)}
        </span>
        <div className="flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
          <button
            className="btn-ghost px-2.5 py-1 text-xs"
            onClick={() => {
              if (confirm(`Xóa dự án "${project.name}"?`))
                void deleteProject(project.id)
            }}
          >
            Xóa
          </button>
          <button
            className="btn-primary px-3 py-1 text-xs"
            onClick={() => void openProject(project.id)}
          >
            Mở
          </button>
        </div>
      </div>
    </div>
  )
}

function formatDate(s: string): string {
  try {
    return new Date(s.replace(' ', 'T') + 'Z').toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return s
  }
}
