import { useEffect, useState } from 'react'
import type { VideoPrompt, ExportBundle } from '@shared/types'
import { useWizard } from '../../wizardStore'
import { PlanArtifactsView } from './PlanArtifactsView'

/** GATE 4 — màn Xuất: khối copy prompt ảnh/video + bảng @tag→ảnh cho Coco. */
export function ExportPanel({ projectId }: { projectId: number }): JSX.Element {
  const bundle = useWizard((s) => s.exportBundle)
  const exporting = useWizard((s) => s.exporting)
  const buildExport = useWizard((s) => s.buildExport)

  const [thumbs, setThumbs] = useState<Record<string, string | null>>({})
  const [copiedAll, setCopiedAll] = useState(false)
  const [savedPath, setSavedPath] = useState<string | null>(null)

  useEffect(() => {
    if (!bundle && !exporting) void buildExport(projectId)
  }, [bundle, exporting, projectId, buildExport])

  // Nạp thumbnail cho các @tag có ảnh
  useEffect(() => {
    if (!bundle) return
    let alive = true
    ;(async () => {
      const entries = await Promise.all(
        bundle.tagMap.map(async (t) => {
          if (!t.ref_image_path) return [t.tag, null] as const
          const res = await window.danh.assets.thumb(t.ref_image_path)
          return [t.tag, res.ok ? res.data : null] as const
        })
      )
      if (alive) setThumbs(Object.fromEntries(entries))
    })()
    return () => {
      alive = false
    }
  }, [bundle])

  async function copyAll(): Promise<void> {
    if (!bundle) return
    await navigator.clipboard.writeText(bundleToMarkdown(bundle))
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 1600)
  }

  async function saveFile(): Promise<void> {
    if (!bundle) return
    const name = `${bundle.projectName.replace(/[^\w\-]+/g, '_')}_prompts.md`
    const res = await window.danh.exporter.saveFile(name, bundleToMarkdown(bundle))
    if (res.ok && res.data) {
      setSavedPath(res.data)
      setTimeout(() => setSavedPath(null), 4000)
    }
  }

  if (exporting || !bundle) {
    return (
      <div className="py-20 text-center text-sm text-slate-600">
        Đang gom bundle xuất…
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold text-white">GATE 4 · Xuất sang Coco</h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Copy từng khối prompt (tiếng Anh) + dùng bảng @tag để dán ảnh tư liệu tương
          ứng. App dừng ở đây — bạn mang sang Coco Studio để render (BytePlus/Seedance).
        </p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
          <span className="chip">Dự án: {bundle.projectName}</span>
          <span className="chip">Style: {bundle.styleId ?? '—'}</span>
          <span className="chip">{bundle.blocks.length} block</span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button className="btn-primary px-3 py-2 text-xs" onClick={() => void copyAll()}>
            {copiedAll ? '✔ đã copy toàn bộ' : '📋 Copy toàn bộ (.md)'}
          </button>
          <button className="btn-ghost px-3 py-2 text-xs" onClick={() => void saveFile()}>
            💾 Xuất ra file .md
          </button>
          {savedPath && (
            <span className="text-xs text-emerald-400">✔ Đã lưu: {savedPath}</span>
          )}
        </div>
      </div>

      {/* Khung xương + chiến lược chuyển thể (nếu GATE 1 đã dựng) */}
      <PlanArtifactsView
        plan={{
          brief: null,
          draft: null,
          skeleton: bundle.skeleton,
          adaptation: bundle.adaptation,
          director: bundle.director,
          directorBible: null,
          visualSystem: bundle.visualSystem
        }}
      />

      {/* Bảng @tag → ảnh */}
      {bundle.tagMap.length > 0 && (
        <div className="card p-4">
          <div className="mb-3 text-[11px] uppercase tracking-wide text-slate-500">
            Bảng @tag → ảnh tư liệu (dán vào Coco)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-ink-800 text-slate-500">
                  <th className="py-2 pr-4 font-medium">@tag</th>
                  <th className="py-2 pr-4 font-medium">Vai trò</th>
                  <th className="py-2 pr-4 font-medium">Ảnh tư liệu</th>
                  <th className="py-2 font-medium">Ghi chú khóa nhất quán</th>
                </tr>
              </thead>
              <tbody>
                {bundle.tagMap.map((t) => (
                  <tr key={t.tag} className="border-b border-ink-900/60">
                    <td className="py-2 pr-4 font-semibold text-blue-300">@{t.tag}</td>
                    <td className="py-2 pr-4 text-slate-400">{t.role}</td>
                    <td className="py-2 pr-4 text-slate-400">
                      {thumbs[t.tag] ? (
                        <img
                          src={thumbs[t.tag] as string}
                          alt={t.tag}
                          className="h-12 w-20 rounded-md border border-ink-800 object-cover"
                        />
                      ) : t.ref_image_path ? (
                        <span className="text-slate-500">đang tải…</span>
                      ) : (
                        <span className="text-amber-soft">⚠ chưa gắn ảnh</span>
                      )}
                    </td>
                    <td className="py-2 text-slate-500">{t.lock_note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Khối prompt từng block */}
      <div className="flex flex-col gap-3">
        {bundle.blocks.map((b, i) => (
          <BlockCard
            key={i}
            sceneOrder={b.scene_order}
            blockOrder={b.block_order}
            narration={b.narration_vi}
            imagePrompt={b.image_prompt_en}
            videoPrompt={b.video_prompt}
            stylePrefix={bundle.stylePrefix}
          />
        ))}
      </div>
    </div>
  )
}

function BlockCard({
  sceneOrder,
  blockOrder,
  narration,
  imagePrompt,
  videoPrompt,
  stylePrefix
}: {
  sceneOrder: number
  blockOrder: number
  narration: string
  imagePrompt: string
  videoPrompt: VideoPrompt | null
  stylePrefix: string | null
}): JSX.Element {
  const videoText = videoPrompt
    ? videoPromptToText(videoPrompt, stylePrefix, { scene: sceneOrder, block: blockOrder })
    : ''
  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="chip border-amber-glow/30 text-amber-soft">
          Cảnh {sceneOrder}.{blockOrder}
        </span>
        {narration && (
          <span className="line-clamp-1 text-xs text-slate-500">🎙 {narration}</span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <PromptBox label="Prompt ẢNH" text={imagePrompt} copyLabel="Copy ảnh" />
        <PromptBox label="Prompt VIDEO" text={videoText} copyLabel="Copy video" />
      </div>
    </div>
  )
}

function PromptBox({
  label,
  text,
  copyLabel
}: {
  label: string
  text: string
  copyLabel: string
}): JSX.Element {
  const [copied, setCopied] = useState(false)
  const empty = !text.trim()

  async function copy(): Promise<void> {
    if (empty) return
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  return (
    <div className="flex flex-col rounded-xl border border-ink-800 bg-ink-950/50">
      <div className="flex items-center justify-between border-b border-ink-800 px-3 py-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
          {label}
        </span>
        <button
          className="btn-ghost px-2 py-1 text-[11px] disabled:opacity-40"
          disabled={empty}
          onClick={() => void copy()}
        >
          {copied ? '✔ đã copy' : copyLabel}
        </button>
      </div>
      <pre className="max-h-56 overflow-y-auto whitespace-pre-wrap break-words px-3 py-2.5 text-[11px] leading-relaxed text-slate-300">
        {empty ? '(trống — chưa dựng)' : text}
      </pre>
    </div>
  )
}

/** Bỏ dấu chấm cuối 1 đoạn (để nối câu không bị "..") + trim. */
function trimDot(s: string): string {
  return s.trim().replace(/[.\s]+$/, '')
}

/** Hoa chữ cái đầu (bỏ qua khi bắt đầu bằng @tag hoặc số — VD "@Image1", "0–3s"). */
function capFirst(s: string): string {
  if (!s || !/^[a-z]/.test(s)) return s
  return s[0].toUpperCase() + s.slice(1)
}

/** Khử cụm trùng lặp trong 1 chuỗi ngăn bằng dấu phẩy (giữ thứ tự, bỏ qua hoa/thường). */
function dedupPhrases(s: string): string {
  const seen = new Set<string>()
  return s
    .split(',')
    .map((p) => p.trim())
    .filter((p) => {
      if (!p) return false
      const key = p.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .join(', ')
}

/**
 * ⭐ Gộp video prompt thành 1 ĐOẠN ENGLISH LIỀN MẠCH để dán thẳng vào Seedance/Coco.
 * Chuẩn BytePlus/Toonflow: prompt cuối là văn xuôi Subject→Motion→Camera→Env→Lighting→Style,
 * KHÔNG nhãn config (STYLE:/SCENE:/MOTION:), KHÔNG tiếng Việt lẫn trong prompt.
 * Hướng dẫn thao tác (upload ảnh khung đầu, dán chữ ở CapCut) tách RIÊNG bằng dòng «...» phía trên,
 * KHÔNG nằm trong đoạn prompt → copy vào engine không dính rác.
 */
function videoPromptToText(
  v: VideoPrompt,
  stylePrefix?: string | null,
  frameRef?: { scene: number; block: number }
): string {
  // (1) Đoạn prompt English liền mạch — các phần nối bằng '. ' thành văn xuôi.
  const body = [v.scene, v.motion, v.constraints]
    .map((p) => trimDot(p ?? ''))
    .filter(Boolean)
    .map(capFirst)
    .join('. ')
  const style = trimDot(v.style ?? '')
  const styleTail = trimDot(stylePrefix ?? '') // token chất liệu chung, nối cuối
  const audio = trimDot(v.audio ?? '')

  const promptParts = [body]
  if (audio) promptParts.push(`Audio: ${audio}`)
  // STYLE gộp cuối (ngắn nhất): style riêng block + token chung, KHỬ cụm lặp (theo dấu phẩy).
  const styleMerged = dedupPhrases([style, styleTail].filter(Boolean).join(', '))
  if (styleMerged) promptParts.push(`Style: ${styleMerged}`)
  const prompt = promptParts.join('. ') + '.'

  // (2) Hướng dẫn thao tác — dòng «...» TÁCH khỏi prompt (không phải nội dung engine đọc).
  const notes: string[] = []
  if (frameRef) {
    notes.push(
      `« Khung đầu: upload ẢNH đã render của Cảnh ${frameRef.scene}.${frameRef.block} làm @Image1 »`
    )
  }
  if (v.text_overlay?.trim()) {
    notes.push(`« Chữ dán ở CapCut (KHÔNG render trong clip): "${v.text_overlay.trim()}" »`)
  }

  return notes.length ? `${notes.join('\n')}\n\n${prompt}` : prompt
}

/** Gộp cả bundle thành 1 file Markdown copy/xuất được. */
function bundleToMarkdown(bundle: ExportBundle): string {
  const L: string[] = []
  L.push(`# ${bundle.projectName} — Bundle prompt (Danh Script)`)
  L.push('')
  L.push(`- **Style:** ${bundle.styleId ?? '—'}`)
  L.push(`- **Số block:** ${bundle.blocks.length}`)
  L.push('')

  if (bundle.stylePrefix?.trim()) {
    L.push('## Style Prefix — dán vào đầu MỌI prompt')
    L.push('')
    L.push('```')
    L.push(bundle.stylePrefix.trim())
    L.push('```')
    L.push('')
  }

  if (bundle.skeleton) {
    const sk = bundle.skeleton
    L.push('## Khung xương cốt chuyện')
    L.push('')
    L.push(`- **Logline:** ${sk.logline}`)
    if (sk.emotional_arc) L.push(`- **Đường cong cảm xúc:** ${sk.emotional_arc}`)
    if (sk.payoff) L.push(`- **Điểm trả bài:** ${sk.payoff}`)
    if (sk.beats?.length) {
      L.push('')
      for (const b of sk.beats.slice().sort((a, c) => a.order - c.order)) {
        L.push(`${b.order}. **${b.role}** — ${b.summary}${b.scene_hint ? ` _(${b.scene_hint})_` : ''}`)
      }
    }
    L.push('')
  }

  if (bundle.adaptation) {
    const ad = bundle.adaptation
    L.push('## Chiến lược chuyển thể')
    L.push('')
    L.push(`- **Hướng:** ${ad.approach}${ad.tone ? ` · tông ${ad.tone}` : ''}`)
    if (ad.show_dont_tell?.length) {
      L.push('- **Cho xem thay vì kể:**')
      for (const s of ad.show_dont_tell) L.push(`  - ${s}`)
    }
    if (ad.visual_motifs?.length) L.push(`- **Motif hình:** ${ad.visual_motifs.join(' · ')}`)
    if (ad.pitfalls?.length) L.push(`- **Cạm bẫy né:** ${ad.pitfalls.join(' · ')}`)
    L.push('')
  }

  if (bundle.visualSystem) {
    const vs = bundle.visualSystem
    const hasVs = vs.color_script.length > 0 || vs.lighting || vs.texture || vs.palette_note
    if (hasVs) {
      L.push('## Hệ thị giác · Color Script')
      L.push('')
      if (vs.palette_note) L.push(`- **Bảng màu chung:** ${vs.palette_note}`)
      if (vs.lighting) L.push(`- **Ánh sáng:** ${vs.lighting}`)
      if (vs.texture) L.push(`- **Chất liệu:** ${vs.texture}`)
      if (vs.color_script.length > 0) {
        L.push('')
        for (const c of vs.color_script.slice().sort((a, b) => a.scene_order - b.scene_order)) {
          const extra = [c.contrast && `tương phản ${c.contrast}`, c.saturation]
            .filter(Boolean)
            .join(' · ')
          L.push(`${c.scene_order}. **${c.palette}** — ${c.emotion}${extra ? ` (${extra})` : ''}`)
        }
      }
      L.push('')
    }
  }

  if (bundle.director && bundle.director.scenes.length > 0) {
    const d = bundle.director
    L.push('## Quy hoạch đạo diễn')
    L.push('')
    if (d.overall_note) L.push(`- **Ghi chú chung:** ${d.overall_note}`)
    L.push('')
    for (const sc of d.scenes.slice().sort((a, b) => a.order - b.order)) {
      const secs = Math.round(sc.char_count / 4)
      const parts = [
        `${sc.line_count} thoại · ${sc.char_count} chữ (~${secs}s)`,
        `${sc.emotion} ${sc.emotion_intensity}/10`,
        sc.transition && `chuyển: ${sc.transition}`,
        sc.note
      ].filter(Boolean)
      L.push(`${sc.order}. ${parts.join(' · ')}`)
    }
    L.push('')
  }

  if (bundle.assets.length > 0) {
    L.push('## Nguyên liệu · Prompt sinh ảnh')
    L.push('')
    for (const a of bundle.assets) {
      const img = a.ref_image_path ? '✓ đã có ảnh' : '⚠ chưa gắn ảnh'
      L.push(`### @${a.tag} — ${a.name} (${a.role}) · ${img}`)
      L.push('')
      L.push('```')
      L.push(a.gen_prompt || '(chưa có prompt sinh ảnh)')
      L.push('```')
      L.push('')
      for (const d of a.derivatives) {
        const dimg = d.ref_image_path ? '✓' : '⚠'
        L.push(`- **@${d.tag}** — ${d.name}${d.derive_kind ? ` _(${d.derive_kind})_` : ''} ${dimg}`)
        L.push('')
        L.push('```')
        L.push(d.gen_prompt || '(chưa có prompt sinh ảnh)')
        L.push('```')
        L.push('')
      }
    }
  }

  if (bundle.tagMap.length > 0) {
    L.push('## Bảng @tag → ảnh tư liệu')
    L.push('')
    L.push('| @tag | Vai trò | Ảnh tư liệu | Ghi chú khóa nhất quán |')
    L.push('| --- | --- | --- | --- |')
    for (const t of bundle.tagMap) {
      const img = t.ref_image_path ?? '⚠ chưa gắn ảnh'
      L.push(`| @${t.tag} | ${t.role} | ${img} | ${t.lock_note} |`)
    }
    L.push('')
  }

  L.push('## Prompt từng block')
  L.push('')
  for (const b of bundle.blocks) {
    L.push(`### Cảnh ${b.scene_order}.${b.block_order}`)
    if (b.narration_vi) L.push(`> 🎙 ${b.narration_vi}`)
    L.push('')
    L.push('**Prompt ẢNH:**')
    L.push('```')
    L.push(b.image_prompt_en || '(trống)')
    L.push('```')
    L.push('')
    L.push('**Prompt VIDEO:**')
    L.push('```')
    L.push(
      b.video_prompt
        ? videoPromptToText(b.video_prompt, bundle.stylePrefix, {
            scene: b.scene_order,
            block: b.block_order
          })
        : '(trống)'
    )
    L.push('```')
    L.push('')
  }

  return L.join('\n')
}
