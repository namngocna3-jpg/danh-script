import { useState, type ReactNode } from 'react'
import type {
  ChatGateStage,
  StorySkeleton,
  AdaptationStrategy,
  DirectorPlan,
  DirectorScene,
  AssetFull,
  VisualSystem,
  IdealBrief,
  ShotPanel,
  BlockView,
  VideoPrompt
} from '@shared/types'
import { useWizard } from '../../wizardStore'

/**
 * Chuẩn hóa MỌI giá trị "đáng lẽ là mảng" từ LLM về đúng mảng.
 * Vì sao cần: model đôi khi trả 1 CHUỖI thay cho string[] (VD triggers: "khan hiếm, FOMO").
 * Chuỗi vẫn có .length nên lọt guard `x.length > 0`, rồi .join/.map nổ TypeError →
 * cả Wizard "màn hình đen". Helper này: mảng giữ nguyên · chuỗi tách theo dấu ·,;\n ·
 * giá trị khác → bọc thành 1 phần tử · rỗng → []. Không bao giờ ném lỗi.
 */
function toArr(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x)).filter((s) => s.trim())
  if (typeof v === 'string') {
    return v
      .split(/[·,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean)
  }
  if (v == null) return []
  return [String(v)]
}

/**
 * PANEL OUTPUT theo bước — render trọn vẹn kết quả hiện tại của từng stage ở CỘT PHẢI.
 * Đọc data từ store (useWizard): plan (brief/draft/skeleton/adaptation/director/visualSystem),
 * assetsFull, visualSystem, blocks. Mỗi nhánh thiếu data → hiển thị gọn ("Chưa có"),
 * KHÔNG crash. Tái dùng logic hiển thị từ PlanArtifactsView / AssetStudioPanel / DirectorPanel.
 *
 * ⭐ blocks (BlockView[]) đến từ kênh IPC blocks:list — nhờ đó phân cảnh / prompt ảnh /
 * prompt video hiện THẲNG ở đây, không phải Xuất bản mới xem được như trước.
 */
export function StageOutputView({ stage }: { stage: ChatGateStage }): JSX.Element | null {
  const plan = useWizard((s) => s.plan)
  const assetsFull = useWizard((s) => s.assetsFull)
  const visualSystem = useWizard((s) => s.visualSystem)
  const blocks = useWizard((s) => s.blocks)

  switch (stage) {
    // Ý đồ chốt (GATE 0) — đọc từ plan.brief (ideal_json.brief), khớp luồng chat gộp.
    case 'gate0_ideal':
      return (
        <Section title="🎯 Ý đồ chốt">
          {plan?.brief ? (
            <IdealBriefView brief={plan.brief} />
          ) : (
            <Empty>Chưa có ý đồ. Nhắn trợ lý bên trái để làm rõ ý đồ đầu ra.</Empty>
          )}
        </Section>
      )

    // Bản nháp (chốt hướng)
    case 'gate1a_draft':
      return (
        <Section title="📝 Bản nháp kịch bản">
          {plan?.draft ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
              {plan.draft}
            </p>
          ) : (
            <Empty>Chưa có bản nháp.</Empty>
          )}
        </Section>
      )

    // Khung xương cốt chuyện
    case 'gate1b_skeleton':
      return (
        <Section title="🦴 Khung xương cốt chuyện">
          <SkeletonView skeleton={plan?.skeleton ?? null} />
        </Section>
      )

    // Chiến lược chuyển thể
    case 'gate1c_adaptation':
      return (
        <Section title="🎬 Chiến lược chuyển thể">
          <AdaptationView adaptation={plan?.adaptation ?? null} />
        </Section>
      )

    // Kịch bản final (gate1d + legacy gate1_script): text final nằm trong phân cảnh (DB) —
    // store chưa expose narration final, nên hiển thị khung xương + chiến lược làm ngữ cảnh.
    case 'gate1d_script':
    case 'gate1_script':
      return (
        <Section title="📜 Kịch bản chi tiết">
          <p className="text-xs text-slate-500">
            Lời thoại/narration final được lưu theo từng cảnh (xem bước phân cảnh). Dưới đây là mạch
            chuyện đã chốt:
          </p>
          <div className="mt-3 space-y-4">
            <SkeletonView skeleton={plan?.skeleton ?? null} />
            <AdaptationView adaptation={plan?.adaptation ?? null} />
          </div>
        </Section>
      )

    // Quy hoạch đạo diễn
    case 'gate_director':
      return (
        <Section title="🎬 Quy hoạch đạo diễn">
          <DirectorView director={plan?.director ?? null} />
        </Section>
      )

    // Tầng nguyên liệu (Visual System + asset)
    case 'gate_assets':
      return (
        <Section title="🎨 Nguyên liệu &amp; hệ thị giác">
          <AssetsView assets={assetsFull} visual={visualSystem} />
        </Section>
      )

    // Phân cảnh (storyboard) — đọc thẳng blocks.shot_panel
    case 'gate_storyboard':
      return (
        <Section title={`🎞️ Phân cảnh (storyboard)${countLabel(blocks.length)}`}>
          <StoryboardOutput blocks={blocks} />
        </Section>
      )

    // Prompt ảnh khung đầu — blocks.image_prompt_en
    case 'gate2_image':
      return (
        <Section title={`🖼️ Prompt sinh ảnh${countLabel(blocks.filter((b) => b.image_prompt_en).length)}`}>
          <ImagePromptOutput blocks={blocks} />
        </Section>
      )

    // Prompt video 7 trường — blocks.video_prompt
    case 'gate3_video':
      return (
        <Section title={`🎥 Prompt video${countLabel(blocks.filter((b) => b.video_prompt).length)}`}>
          <VideoPromptOutput blocks={blocks} />
        </Section>
      )

    default:
      return null
  }
}

// ============================================================
// Sub-views
// ============================================================

/** Khung card chuẩn của repo (token màu/spacing khớp PlanArtifactsView / AssetStudioPanel). */
function Section({
  title,
  children
}: {
  title: string
  children: ReactNode
}): JSX.Element {
  return (
    <div className="card space-y-3 p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-amber-glow/80">{title}</div>
      {children}
    </div>
  )
}

/** Dòng "chưa có dữ liệu" gọn gàng. */
function Empty({ children }: { children?: ReactNode }): JSX.Element {
  return <p className="text-sm text-slate-500">{children ?? '—'}</p>
}

/** Khung xương cốt chuyện (tái dùng logic từ PlanArtifactsView). */
function SkeletonView({ skeleton }: { skeleton: StorySkeleton | null }): JSX.Element {
  const sk = skeleton
  if (!sk || (!sk.logline && (!sk.beats || sk.beats.length === 0))) {
    return <Empty>Chưa có khung xương.</Empty>
  }
  return (
    <div className="space-y-2">
      {sk.logline && <p className="text-sm italic text-slate-300">“{sk.logline}”</p>}
      {sk.beats?.length > 0 && (
        <ol className="space-y-1">
          {sk.beats
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((b) => (
              <li key={b.order} className="flex gap-2 text-sm text-slate-300">
                <span className="shrink-0 rounded bg-ink-800 px-1.5 py-0.5 text-[11px] font-medium text-amber-200">
                  {b.role}
                </span>
                <span>
                  {b.summary}
                  {b.scene_hint && <span className="text-slate-500"> ({b.scene_hint})</span>}
                </span>
              </li>
            ))}
        </ol>
      )}
      {sk.emotional_arc && (
        <p className="text-xs text-slate-400">
          <span className="text-slate-500">Cảm xúc: </span>
          {sk.emotional_arc}
        </p>
      )}
      {sk.payoff && (
        <p className="text-xs text-slate-400">
          <span className="text-slate-500">Trả bài: </span>
          {sk.payoff}
        </p>
      )}
    </div>
  )
}

/** Chiến lược chuyển thể (tái dùng logic từ PlanArtifactsView). */
function AdaptationView({ adaptation }: { adaptation: AdaptationStrategy | null }): JSX.Element {
  const ad = adaptation
  if (!ad || !ad.approach) return <Empty>Chưa có chiến lược chuyển thể.</Empty>
  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-300">
        <span className="text-slate-500">Hướng: </span>
        {ad.approach}
        {ad.tone && <span className="text-slate-500"> · tông {ad.tone}</span>}
      </p>
      {toArr(ad.show_dont_tell).length > 0 && (
        <div className="space-y-1">
          <div className="text-xs text-slate-500">Cho xem thay vì kể:</div>
          <ul className="space-y-1">
            {toArr(ad.show_dont_tell).map((s, i) => (
              <li key={i} className="text-sm text-slate-300">
                • {s}
              </li>
            ))}
          </ul>
        </div>
      )}
      {toArr(ad.visual_motifs).length > 0 && (
        <p className="text-xs text-slate-400">
          <span className="text-slate-500">Motif hình: </span>
          {toArr(ad.visual_motifs).join(' · ')}
        </p>
      )}
      {toArr(ad.pitfalls).length > 0 && (
        <p className="text-xs text-slate-400">
          <span className="text-slate-500">Cạm bẫy né: </span>
          {toArr(ad.pitfalls).join(' · ')}
        </p>
      )}
    </div>
  )
}

/** Bảng quy hoạch đạo diễn (tái dùng SceneRow/EmotionMeter từ DirectorPanel). */
function DirectorView({ director }: { director: DirectorPlan | null }): JSX.Element {
  if (!director || director.scenes.length === 0) return <Empty>Chưa có quy hoạch đạo diễn.</Empty>
  return (
    <div className="space-y-2">
      {director.overall_note && <p className="text-xs text-slate-400">{director.overall_note}</p>}
      <div className="space-y-1.5">
        {director.scenes
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((sc) => (
            <DirectorSceneRow key={sc.order} sc={sc} />
          ))}
      </div>
    </div>
  )
}

function DirectorSceneRow({ sc }: { sc: DirectorScene }): JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-ink-800 bg-ink-950/40 px-3 py-2 text-xs">
      <span className="shrink-0 rounded bg-ink-800 px-1.5 py-0.5 text-[11px] font-medium text-amber-200">
        Cảnh {sc.order}
      </span>
      <span className="text-slate-400">
        {sc.line_count} thoại · {sc.char_count} chữ (~{Math.round(sc.char_count / 4)}s)
      </span>
      <span className="text-slate-300">{sc.emotion}</span>
      <EmotionMeter value={sc.emotion_intensity} />
      {sc.transition && <span className="text-slate-500">→ chuyển: {sc.transition}</span>}
      {sc.note && <span className="w-full text-slate-500">· {sc.note}</span>}
    </div>
  )
}

/** Thanh cảm xúc 0–10 gọn (giống DirectorPanel). */
function EmotionMeter({ value }: { value: number }): JSX.Element {
  const pct = Math.max(0, Math.min(10, value)) * 10
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-ink-800">
        <span className="block h-full rounded-full bg-amber-glow/70" style={{ width: `${pct}%` }} />
      </span>
      <span className="text-[11px] text-slate-500">{value}/10</span>
    </span>
  )
}

/** Tầng nguyên liệu: hệ thị giác (Color Script) + danh sách asset gốc/phái sinh (gọn). */
function AssetsView({
  assets,
  visual
}: {
  assets: AssetFull[]
  visual: VisualSystem | null
}): JSX.Element {
  const hasVisual =
    visual && (toArr(visual.color_script).length > 0 || visual.lighting || visual.texture)
  if (!hasVisual && assets.length === 0) {
    return <Empty>Chưa có nguyên liệu. Nhắn trợ lý “tách nguyên liệu từ kịch bản”.</Empty>
  }
  return (
    <div className="space-y-4">
      {hasVisual && <VisualSystemView vs={visual} />}
      {assets.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-slate-500">Nguyên liệu ({assets.length}):</div>
          <ul className="space-y-1">
            {assets.map((a) => (
              <li key={a.asset_id} className="flex items-center gap-2 text-sm text-slate-300">
                <span className="shrink-0 rounded bg-ink-800 px-1.5 py-0.5 text-[11px] font-medium text-amber-200">
                  @{a.tag}
                </span>
                <span className="truncate">{a.name}</span>
                {a.derivatives.length > 0 && (
                  <span className="text-[11px] text-slate-500">
                    +{a.derivatives.length} biến thể
                  </span>
                )}
                {!a.gen_prompt && <span className="text-[11px] text-amber-300/80">⚠ thiếu prompt</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/** Bảng Color Script + ánh sáng + chất liệu (tái dùng logic từ AssetStudioPanel). */
function VisualSystemView({ vs }: { vs: VisualSystem | null }): JSX.Element | null {
  // Model có thể trả color_script sai kiểu (không phải mảng) → .slice().sort() nổ.
  const colorScript = Array.isArray(vs?.color_script) ? vs.color_script : []
  if (!vs || (colorScript.length === 0 && !vs.lighting && !vs.texture)) return null
  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold text-white">🎨 Hệ thị giác · Color Script</div>
      {vs.palette_note && <p className="text-xs text-slate-400">{vs.palette_note}</p>}
      {colorScript.length > 0 && (
        <div className="space-y-1">
          {colorScript
            .slice()
            .sort((a, b) => a.scene_order - b.scene_order)
            .map((c) => (
              <div key={c.scene_order} className="flex gap-2 text-xs text-slate-300">
                <span className="shrink-0 rounded bg-ink-800 px-1.5 py-0.5 text-[11px] font-medium text-amber-200">
                  Cảnh {c.scene_order}
                </span>
                <span>
                  {c.palette}
                  <span className="text-slate-500"> · {c.emotion}</span>
                  {c.contrast && <span className="text-slate-600"> · tương phản {c.contrast}</span>}
                  {c.saturation && <span className="text-slate-600"> · {c.saturation}</span>}
                </span>
              </div>
            ))}
        </div>
      )}
      {(vs.lighting || vs.texture) && (
        <div className="space-y-1 border-t border-ink-800 pt-2 text-xs text-slate-400">
          {vs.lighting && (
            <p>
              <span className="text-slate-500">Ánh sáng: </span>
              {vs.lighting}
            </p>
          )}
          {vs.texture && (
            <p>
              <span className="text-slate-500">Chất liệu: </span>
              {vs.texture}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/** Ý đồ chốt (GATE 0) — làm rõ ý đồ đầu ra trước khi phân cảnh. */
function IdealBriefView({ brief }: { brief: IdealBrief }): JSX.Element {
  const rows: Array<[string, string | undefined]> = [
    ['Thông điệp lõi', brief.core_message],
    ['Ý đồ đầu ra', brief.output_intent],
    ['Đối tượng', brief.target],
    ['Góc cảm xúc', brief.angle],
    ['Mood', brief.mood],
    ['Thể loại', brief.genre],
    ['Thời lượng', brief.duration_hint]
  ]
  const shown = rows.filter(([, v]) => v)
  return (
    <div className="space-y-2">
      {shown.length > 0 ? (
        <dl className="space-y-1">
          {shown.map(([k, v]) => (
            <div key={k} className="flex gap-2 text-sm text-slate-300">
              <dt className="shrink-0 text-slate-500">{k}:</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <Empty>Chưa có dữ liệu ý đồ.</Empty>
      )}
      {toArr(brief.triggers).length > 0 && (
        <p className="text-xs text-slate-400">
          <span className="text-slate-500">Trigger tâm lý: </span>
          {toArr(brief.triggers).join(' · ')}
        </p>
      )}
    </div>
  )
}

/** Hậu tố " · N mục" cho tiêu đề Section (rỗng khi chưa có gì). */
function countLabel(n: number): string {
  return n > 0 ? ` · ${n} block` : ''
}

/** Nhãn "Cảnh x · Block y" dùng chung cho 3 panel block. */
function BlockBadge({ b }: { b: BlockView }): JSX.Element {
  return (
    <span className="shrink-0 rounded bg-ink-800 px-1.5 py-0.5 text-[11px] font-medium text-amber-200">
      Cảnh {b.scene_order} · Block {b.block_order}
    </span>
  )
}

/**
 * Số giây của 1 block — lấy từ shot_panel.duration_sec (nguồn duy nhất có độ dài shot).
 * Trả null khi block chưa dựng shot panel → chỗ gọi tự ẩn.
 */
function durationOf(b: BlockView): number | null {
  const d = b.shot_panel?.duration_sec
  return typeof d === 'number' && d > 0 ? d : null
}

/** Chip "⏱ 4s" — để bạn biết cắt/render shot này dài bao nhiêu. */
function SecBadge({ b }: { b: BlockView }): JSX.Element | null {
  const d = durationOf(b)
  if (d === null) return null
  return (
    <span className="shrink-0 rounded bg-ink-800 px-1.5 py-0.5 text-[11px] font-medium text-sky-300">
      ⏱ {d}s
    </span>
  )
}

/**
 * Dòng "Mô tả" ĐẦY ĐỦ của block (KHÔNG cắt bằng truncate như trước).
 * Trước đây shot_desc bị nhét cùng hàng badge với class `truncate` → mất chữ, không
 * đủ để đối chiếu khi đi render. Giờ tách riêng thành 1 dòng xuống hàng thoải mái.
 */
function ShotDesc({ text }: { text: string | null }): JSX.Element | null {
  if (!text?.trim()) return null
  return (
    <p className="leading-relaxed text-slate-400">
      <span className="text-slate-600">Mô tả: </span>
      {text}
    </p>
  )
}

/** Tổng thời lượng các block (giây) — hiện ở đầu panel để biết phim dài bao nhiêu. */
function totalSec(blocks: BlockView[]): number {
  return blocks.reduce((sum, b) => sum + (durationOf(b) ?? 0), 0)
}

/** Nút copy 1 đoạn text ra clipboard (prompt dán sang Coco/Seedance). */
function Copy({ text, label = 'Copy' }: { text: string; label?: string }): JSX.Element {
  const [done, setDone] = useState(false)
  return (
    <button
      className="shrink-0 rounded border border-ink-700 px-1.5 py-0.5 text-[11px] text-slate-400 hover:border-amber-glow/50 hover:text-amber-200"
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => {
          setDone(true)
          setTimeout(() => setDone(false), 1200)
        })
      }}
    >
      {done ? '✓ Đã copy' : label}
    </button>
  )
}

/** Gom block theo cảnh để render có tiêu đề cảnh. */
function bySceneGroups(blocks: BlockView[]): Array<{ order: number; summary: string; items: BlockView[] }> {
  const map = new Map<number, { order: number; summary: string; items: BlockView[] }>()
  for (const b of blocks) {
    const g = map.get(b.scene_order) ?? { order: b.scene_order, summary: b.scene_summary, items: [] }
    g.items.push(b)
    map.set(b.scene_order, g)
  }
  return [...map.values()].sort((a, b) => a.order - b.order)
}

/** Khung 1 cảnh: tiêu đề cảnh + danh sách block bên trong. */
function SceneGroup({
  group,
  children
}: {
  group: { order: number; summary: string }
  children: ReactNode
}): JSX.Element {
  return (
    <div className="space-y-2">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        Cảnh {group.order}
        {group.summary && <span className="normal-case text-slate-600"> — {group.summary}</span>}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

/** PHÂN CẢNH — mỗi cảnh → mỗi shot, đọc blocks.shot_panel (đã parse ở main). */
function StoryboardOutput({ blocks }: { blocks: BlockView[] }): JSX.Element {
  if (blocks.length === 0) {
    return <Empty>Chưa có phân cảnh. Nhắn trợ lý bên trái để dựng shot panel từng cảnh.</Empty>
  }
  const tot = totalSec(blocks)
  return (
    <div className="space-y-4">
      {tot > 0 && (
        <p className="text-[11px] text-slate-500">
          Tổng thời lượng: <span className="text-sky-300">{tot}s</span> · {blocks.length} shot
        </p>
      )}
      {bySceneGroups(blocks).map((g) => (
        <SceneGroup key={g.order} group={g}>
          {g.items.map((b) =>
            b.shot_panel ? (
              <ShotPanelCard key={b.block_id} panel={b.shot_panel} b={b} />
            ) : (
              <div
                key={b.block_id}
                className="space-y-1 rounded-lg border border-ink-800 bg-ink-950/40 px-3 py-2 text-xs"
              >
                <BlockBadge b={b} />
                {b.shot_desc ? (
                  <ShotDesc text={b.shot_desc} />
                ) : (
                  <p className="text-slate-600">Chưa có shot panel cho block này.</p>
                )}
              </div>
            )
          )}
        </SceneGroup>
      ))}
    </div>
  )
}

/** PROMPT ẢNH khung đầu — blocks.image_prompt_en, kèm nút copy từng prompt + copy tất cả. */
function ImagePromptOutput({ blocks }: { blocks: BlockView[] }): JSX.Element {
  const withPrompt = blocks.filter((b) => b.image_prompt_en)
  if (withPrompt.length === 0) {
    return <Empty>Chưa có prompt ảnh. Nhắn trợ lý bên trái để dựng prompt khung đầu từng block.</Empty>
  }
  // Header copy kèm số giây → dán ra ngoài vẫn biết shot dài bao nhiêu.
  const all = withPrompt
    .map((b) => {
      const d = durationOf(b)
      return `# Cảnh ${b.scene_order} · Block ${b.block_order}${d ? ` · ${d}s` : ''}\n${b.image_prompt_en}`
    })
    .join('\n\n')
  const tot = totalSec(withPrompt)
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Copy text={all} label={`Copy tất cả (${withPrompt.length})`} />
        {tot > 0 && <span className="text-[11px] text-sky-300">tổng {tot}s</span>}
        <span className="text-[11px] text-slate-600">Dán sang Coco Studio để sinh ảnh khung đầu.</span>
      </div>
      {bySceneGroups(blocks).map((g) => (
        <SceneGroup key={g.order} group={g}>
          {g.items.map((b) => (
            <div
              key={b.block_id}
              className="space-y-1.5 rounded-lg border border-ink-800 bg-ink-950/40 px-3 py-2 text-xs"
            >
              <div className="flex items-center gap-2">
                <BlockBadge b={b} />
                <SecBadge b={b} />
                <span className="ml-auto" />
                {b.image_prompt_en && <Copy text={b.image_prompt_en} />}
              </div>
              <ShotDesc text={b.shot_desc} />
              {b.image_prompt_en ? (
                <p className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-slate-300">
                  {b.image_prompt_en}
                </p>
              ) : (
                <p className="text-slate-600">Chưa có prompt ảnh.</p>
              )}
              {toArr(b.asset_tags).length > 0 && (
                <p className="text-slate-500">{toArr(b.asset_tags).map((t) => '@' + t).join(' ')}</p>
              )}
            </div>
          ))}
        </SceneGroup>
      ))}
    </div>
  )
}

/** Thứ tự 7 trường video hiển thị — khớp skill vidPrompter (motion mang tải chính). */
const VIDEO_FIELDS: Array<{ key: keyof VideoPrompt; label: string }> = [
  { key: 'style', label: 'style' },
  { key: 'scene', label: 'scene' },
  { key: 'motion', label: 'motion' },
  { key: 'audio', label: 'audio' },
  { key: 'text_overlay', label: 'text_overlay' },
  { key: 'constraints', label: 'constraints' },
  { key: 'negative', label: 'negative' }
]

/** Gộp 7 trường thành 1 khối text để dán sang Seedance. */
function videoPromptText(vp: VideoPrompt): string {
  return VIDEO_FIELDS.map(({ key, label }) => {
    const v = vp[key]
    return typeof v === 'string' && v.trim() ? `${label}: ${v}` : ''
  })
    .filter(Boolean)
    .join('\n')
}

/** PROMPT VIDEO — 7 trường/block, kèm copy từng block + copy tất cả. */
function VideoPromptOutput({ blocks }: { blocks: BlockView[] }): JSX.Element {
  const withPrompt = blocks.filter((b) => b.video_prompt)
  if (withPrompt.length === 0) {
    return <Empty>Chưa có prompt video. Nhắn trợ lý bên trái để dựng 7 trường video từng block.</Empty>
  }
  const all = withPrompt
    .map((b) => {
      const d = durationOf(b)
      return `# Cảnh ${b.scene_order} · Block ${b.block_order}${d ? ` · ${d}s` : ''}\n${videoPromptText(b.video_prompt as VideoPrompt)}`
    })
    .join('\n\n')
  const tot = totalSec(withPrompt)
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Copy text={all} label={`Copy tất cả (${withPrompt.length})`} />
        {tot > 0 && <span className="text-[11px] text-sky-300">tổng {tot}s</span>}
        <span className="text-[11px] text-slate-600">Dán sang BytePlus/Seedance để render.</span>
      </div>
      {bySceneGroups(blocks).map((g) => (
        <SceneGroup key={g.order} group={g}>
          {g.items.map((b) => (
            <div
              key={b.block_id}
              className="space-y-1.5 rounded-lg border border-ink-800 bg-ink-950/40 px-3 py-2 text-xs"
            >
              <div className="flex items-center gap-2">
                <BlockBadge b={b} />
                <SecBadge b={b} />
                <span className="ml-auto" />
                {b.video_prompt && <Copy text={videoPromptText(b.video_prompt)} />}
              </div>
              <ShotDesc text={b.shot_desc} />
              {b.video_prompt ? (
                <div className="space-y-1">
                  {VIDEO_FIELDS.map(({ key, label }) => {
                    const v = (b.video_prompt as VideoPrompt)[key]
                    if (typeof v !== 'string' || !v.trim()) return null
                    return (
                      <p key={label} className="leading-relaxed text-slate-300">
                        <span className="text-amber-200/70">{label}: </span>
                        <span className="font-mono text-[11px]">{v}</span>
                      </p>
                    )
                  })}
                </div>
              ) : (
                <p className="text-slate-600">Chưa có prompt video.</p>
              )}
              {toArr(b.asset_tags).length > 0 && (
                <p className="text-slate-500">{toArr(b.asset_tags).map((t) => '@' + t).join(' ')}</p>
              )}
            </div>
          ))}
        </SceneGroup>
      ))}
    </div>
  )
}

/** Render 1 shot panel đã parse (11 field của ShotPanel) + mô tả block + số giây. */
function ShotPanelCard({ panel, b }: { panel: ShotPanel; b: BlockView }): JSX.Element {
  return (
    <div className="space-y-1 rounded-lg border border-ink-800 bg-ink-950/40 px-3 py-2 text-xs">
      <div className="flex items-center gap-2">
        <BlockBadge b={b} />
        <SecBadge b={b} />
        <span className="text-slate-400">
          {panel.shot_size} · {panel.camera_angle} · {panel.camera_move}
        </span>
      </div>
      <ShotDesc text={b.shot_desc} />
      <p className="text-slate-300">{panel.subject}</p>
      <p className="text-slate-400">
        <span className="text-slate-500">Đầu: </span>
        {panel.action_start}
      </p>
      <p className="text-slate-400">
        <span className="text-slate-500">Cuối: </span>
        {panel.action_end}
      </p>
      {panel.layout && (
        <p className="text-slate-500">
          <span className="text-slate-600">Bố cục: </span>
          {panel.layout}
        </p>
      )}
      {panel.cuts && (
        <p className="text-slate-500">
          <span className="text-slate-600">Cắt: </span>
          {panel.cuts}
        </p>
      )}
      {toArr(panel.asset_tags).length > 0 && (
        <p className="text-slate-500">{toArr(panel.asset_tags).map((t) => '@' + t).join(' ')}</p>
      )}
      {panel.notes && <p className="text-slate-600">· {panel.notes}</p>}
    </div>
  )
}
