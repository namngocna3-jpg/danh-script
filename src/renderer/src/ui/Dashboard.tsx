import { useState } from 'react'
import { useApp } from '../store'
import { ProjectCard } from './ProjectCard'
import { NewProjectModal } from './NewProjectModal'

export function Dashboard(): JSX.Element {
  const projects = useApp((s) => s.projects)
  const loading = useApp((s) => s.loading)
  const error = useApp((s) => s.error)
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      {/* Header */}
      <header className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dự án của bạn</h1>
          <p className="mt-1 text-sm text-slate-500">
            Nhận <span className="text-amber-soft">ideal</span> → sinh trọn bộ
            prompt tiền kỳ → xuất bảng copy sang Coco. App dừng trước render.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          <span className="text-base leading-none">+</span> Tạo dự án
        </button>
      </header>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Danh sách */}
      {loading ? (
        <div className="py-20 text-center text-slate-600">Đang tải…</div>
      ) : projects.length === 0 ? (
        <EmptyState onCreate={() => setModalOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}

      {modalOpen && <NewProjectModal onClose={() => setModalOpen(false)} />}
    </div>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }): JSX.Element {
  return (
    <div className="card flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-ink-700 bg-ink-850 text-3xl">
        ◧
      </div>
      <div>
        <div className="text-lg font-semibold text-white">Chưa có dự án nào</div>
        <div className="mt-1 max-w-md text-sm text-slate-500">
          Tạo dự án đầu tiên: nhập ideal (ý tưởng video), chọn pipeline, rồi để
          engine phân tích và dựng kịch bản + prompt.
        </div>
      </div>
      <button className="btn-primary" onClick={onCreate}>
        <span className="text-base leading-none">+</span> Tạo dự án đầu tiên
      </button>
    </div>
  )
}
