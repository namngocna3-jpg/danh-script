import { useState } from 'react'
import type { ReviewResult } from '@shared/types'
import { Markdown } from './Markdown'

const GRADE_STYLE: Record<ReviewResult['grade'], { cls: string; note: string }> = {
  A: { cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40', note: 'Dùng được' },
  B: { cls: 'bg-lime-500/15 text-lime-300 border-lime-500/40', note: 'Sửa nhẹ' },
  C: { cls: 'bg-amber-500/15 text-amber-300 border-amber-500/40', note: 'Sửa lớn' },
  D: { cls: 'bg-red-500/15 text-red-300 border-red-500/40', note: 'Làm lại' },
  '?': { cls: 'bg-ink-800 text-slate-400 border-ink-700', note: 'Chưa rõ' }
}

/** Huy hiệu điểm A/B/C/D + mở/đóng báo cáo Markdown. */
export function ReviewBadge({ review }: { review: ReviewResult }): JSX.Element {
  const [open, setOpen] = useState(false)
  const g = GRADE_STYLE[review.grade]
  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 text-left"
      >
        <span
          className={
            'flex h-7 w-7 items-center justify-center rounded-lg border text-sm font-bold ' +
            g.cls
          }
        >
          {review.grade}
        </span>
        <span className="text-xs text-slate-400">
          Kiểm duyệt: <span className="font-medium text-slate-200">{g.note}</span>
        </span>
        <span className="ml-auto text-[11px] text-slate-600">
          {open ? 'Ẩn báo cáo ▲' : 'Xem báo cáo ▼'}
        </span>
      </button>
      {open && (
        <div className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-ink-700 bg-ink-950/60 p-3">
          <Markdown>{review.report}</Markdown>
        </div>
      )}
    </div>
  )
}
