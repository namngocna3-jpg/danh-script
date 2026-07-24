import type { ReactNode } from 'react'
import type {
  ChatGateStage,
  StorySkeleton,
  AdaptationStrategy,
  DirectorPlan,
  DirectorScene,
  AssetFull,
  VisualSystem,
  IdealBrief,
  ShotPanel
} from '@shared/types'
import { useWizard } from '../../wizardStore'

/**
 * PANEL OUTPUT theo bước — render trọn vẹn kết quả hiện tại của từng stage ở CỘT PHẢI.
 * Đọc data từ store (useWizard): plan (brief/draft/skeleton/adaptation/director/visualSystem),
 * assetsFull, visualSystem. Mỗi nhánh thiếu data → hiển thị gọn ("Chưa có"),
 * KHÔNG crash. Tái dùng logic hiển thị từ PlanArtifactsView / AssetStudioPanel / DirectorPanel.
 *
 * ⚠️ Store hiện KHÔNG expose blocks/shot_panel_json ra renderer (chỉ có gate.plan + assets2.*),
 * nên StoryboardOutput / prompt ảnh / prompt video render placeholder (xem TODO trong report).
 */
export function StageOutputView({ stage }: { stage: ChatGateStage }): JSX.Element | null {
  const plan = useWizard((s) => s.plan)
  const assetsFull = useWizard((s) => s.assetsFull)
  const visualSystem = useWizard((s) => s.visualSystem)

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

    // Phân cảnh (storyboard)
    case 'gate_storyboard':
      return (
        <Section title="🎞️ Phân cảnh (storyboard)">
          <StoryboardOutput />
        </Section>
      )

    // Prompt ảnh — nằm trong blocks (chưa expose ra renderer)
    case 'gate2_image':
      return (
        <Section title="🖼️ Prompt sinh ảnh">
          <Empty>
            Prompt ảnh được sinh theo từng block và lưu trong dự án. Chưa có kênh đọc trực tiếp ở màn
            này — dùng bước Xuất bản để lấy trọn bộ prompt.
          </Empty>
        </Section>
      )

    // Prompt video — nằm trong blocks (chưa expose ra renderer)
    case 'gate3_video':
      return (
        <Section title="🎥 Prompt video">
          <Empty>
            Prompt video được sinh theo từng block và lưu trong dự án. Chưa có kênh đọc trực tiếp ở
            màn này — dùng bước Xuất bản để lấy trọn bộ prompt.
          </Empty>
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
      {ad.show_dont_tell?.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs text-slate-500">Cho xem thay vì kể:</div>
          <ul className="space-y-1">
            {ad.show_dont_tell.map((s, i) => (
              <li key={i} className="text-sm text-slate-300">
                • {s}
              </li>
            ))}
          </ul>
        </div>
      )}
      {ad.visual_motifs && ad.visual_motifs.length > 0 && (
        <p className="text-xs text-slate-400">
          <span className="text-slate-500">Motif hình: </span>
          {ad.visual_motifs.join(' · ')}
        </p>
      )}
      {ad.pitfalls && ad.pitfalls.length > 0 && (
        <p className="text-xs text-slate-400">
          <span className="text-slate-500">Cạm bẫy né: </span>
          {ad.pitfalls.join(' · ')}
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
    visual && (visual.color_script.length > 0 || visual.lighting || visual.texture)
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
  if (!vs || (vs.color_script.length === 0 && !vs.lighting && !vs.texture)) return null
  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold text-white">🎨 Hệ thị giác · Color Script</div>
      {vs.palette_note && <p className="text-xs text-slate-400">{vs.palette_note}</p>}
      {vs.color_script.length > 0 && (
        <div className="space-y-1">
          {vs.color_script
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
      {brief.triggers && brief.triggers.length > 0 && (
        <p className="text-xs text-slate-400">
          <span className="text-slate-500">Trigger tâm lý: </span>
          {brief.triggers.join(' · ')}
        </p>
      )}
    </div>
  )
}

/**
 * PHÂN CẢNH — mỗi cảnh → mỗi shot, parse blocks.shot_panel_json thành ShotPanel.
 *
 * ⚠️ HIỆN TẠI: store (useWizard) và preload (window.danh) CHƯA expose blocks/shot_panel_json
 * ra renderer — chỉ có gate.plan (PlanArtifacts) + assets2.* (AssetFull/coverage/visualSystem).
 * Không có kênh đọc block, nên đây là PLACEHOLDER. Khi có IPC trả về Block[] (kèm
 * shot_panel_json), thay placeholder bằng renderShotPanels() bên dưới (đã viết sẵn shape đúng).
 */
function StoryboardOutput(): JSX.Element {
  // Giữ helper để không phải viết lại khi store bổ sung blocks:
  // const blocks = useWizard((s) => s.blocks)  ← chưa tồn tại
  return (
    <Empty>
      Phân cảnh chi tiết (shot panel) được lưu theo từng block trong dự án. Màn này chưa có kênh đọc
      trực tiếp block — hoàn tất bước phân cảnh ở cột trái, kết quả sẽ nằm trong bản xuất.
    </Empty>
  )
}

/**
 * Render 1 shot panel đã parse (dùng khi store expose blocks trong tương lai).
 * Giữ sẵn để khớp 11 field của ShotPanel — hiện KHÔNG được gọi (tránh dead-code lint,
 * export nội bộ qua StoryboardOutput khi có data).
 */
export function ShotPanelCard({
  panel,
  sceneOrder,
  shotOrder
}: {
  panel: ShotPanel
  sceneOrder: number
  shotOrder: number
}): JSX.Element {
  return (
    <div className="space-y-1 rounded-lg border border-ink-800 bg-ink-950/40 px-3 py-2 text-xs">
      <div className="flex items-center gap-2">
        <span className="shrink-0 rounded bg-ink-800 px-1.5 py-0.5 text-[11px] font-medium text-amber-200">
          Cảnh {sceneOrder} · Shot {shotOrder}
        </span>
        <span className="text-slate-400">
          {panel.shot_size} · {panel.camera_angle} · {panel.camera_move} · {panel.duration_sec}s
        </span>
      </div>
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
      {panel.asset_tags.length > 0 && (
        <p className="text-slate-500">{panel.asset_tags.map((t) => '@' + t).join(' ')}</p>
      )}
      {panel.notes && <p className="text-slate-600">· {panel.notes}</p>}
    </div>
  )
}
