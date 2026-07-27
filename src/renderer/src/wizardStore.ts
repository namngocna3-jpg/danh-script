// ============================================================
// Danh Script — Wizard state: chạy 5 cổng + stream tiến độ
// Giữ trạng thái tạm (không đụng DB): step stream, kết quả, review, styles, bundle.
// ============================================================
import { create } from 'zustand'
import { useApp } from './store'
import type {
  ProjectParams,
  AgentStep,
  PrepResult,
  Gate0Result,
  GateResult,
  ReviewResult,
  StyleOption,
  GenreOption,
  DirectorOption,
  ExportBundle,
  GateKey,
  ChatTurn,
  ChatGateStage,
  PlanArtifacts,
  AssetFull,
  AssetCoverage,
  VisualSystem,
  BlockView
} from '@shared/types'

/**
 * Khóa cổng dùng cho map kết quả review (mô hình Toonflow 12 bước).
 * Mỗi bước chat có 1 khóa review độc lập → chấm A/B/C/D riêng từng bước.
 * 'gate1' giữ lại cho tương thích đường chạy 1-phát cũ (kịch bản 1 cục).
 */
export type GateId =
  | 'gate0'
  | 'gate1a'
  | 'gate1b'
  | 'gate1c'
  | 'gate1d'
  | 'director'
  | 'assets'
  | 'storyboard'
  | 'gate2'
  | 'gate3'
  | 'gate1' // legacy (kịch bản 1 cục)

/** Cổng chạy 1-phát (GateRunner, đường cũ) — thợ có tool, không hội thoại. */
export type OneShotGate = 'gate1' | 'gate2' | 'gate3'

const GATE_KEY: Record<OneShotGate, GateKey> = {
  gate1: 'scriptwright',
  gate2: 'imgPrompter',
  gate3: 'vidPrompter'
}

/** stage lưu trong DB cho từng khóa cổng (để reviewGate biết chấm cái gì). */
const GATE_STAGE: Record<GateId, string> = {
  gate0: 'gate0_ideal',
  gate1a: 'gate1a_draft',
  gate1b: 'gate1b_skeleton',
  gate1c: 'gate1c_adaptation',
  gate1d: 'gate1d_script',
  director: 'gate_director',
  assets: 'gate_assets',
  storyboard: 'gate_storyboard',
  gate2: 'gate2_image',
  gate3: 'gate3_video',
  gate1: 'gate1_script' // legacy
}

/** Các stage kịch bản có artifact để hiển thị ở cột phải (nạp lại plan sau mỗi lượt chat).
 *  gate0_ideal (brief) + gate1a_draft (draft) cũng đọc qua getPlanArtifacts nên phải nạp. */
const PLAN_STAGES: ReadonlySet<string> = new Set([
  'gate0_ideal',
  'gate1a_draft',
  'gate1b_skeleton',
  'gate1c_adaptation',
  'gate1d_script',
  'gate1_script'
])

interface WizardState {
  running: GateId | 'prep' | 'director' | null
  steps: AgentStep[]
  prepResult: PrepResult | null
  gate0Result: Gate0Result | null
  gateResults: Partial<Record<OneShotGate, GateResult>>
  reviews: Partial<Record<GateId, ReviewResult>>
  reviewing: GateId | null
  styles: StyleOption[]
  genres: GenreOption[]
  directors: DirectorOption[]
  exportBundle: ExportBundle | null
  exporting: boolean
  wizardError: string | null

  // Hội thoại tinh chỉnh từng cổng (chat có trạng thái)
  chats: Partial<Record<ChatGateStage, ChatTurn[]>>
  chatBusy: ChatGateStage | null

  // Hội thoại Sếp điều phối (tab Tự động)
  autoChat: ChatTurn[]
  autoBusy: boolean

  // Artifact GATE 1 (khung xương + chiến lược) để hiển thị
  plan: PlanArtifacts | null

  // ⭐ Tầng NGUYÊN LIỆU (gate_assets): asset gốc + phái sinh + prompt + độ phủ + hệ thị giác
  assetsFull: AssetFull[]
  coverage: AssetCoverage | null
  visualSystem: VisualSystem | null

  // ⭐ Tầng BLOCK (shot): phân cảnh + prompt ảnh + prompt video — để cột kết quả GATE 2/3
  // hiện THẲNG trong app, không phải Xuất bản mới xem được.
  blocks: BlockView[]

  loadStyles: () => Promise<void>
  loadGenres: () => Promise<void>
  loadDirectors: () => Promise<void>
  setDirector: (projectId: number, directorId: string) => Promise<boolean>
  runDirectorBrief: (projectId: number) => Promise<boolean>
  runPrep: (projectId: number) => Promise<boolean>
  runGate0: (projectId: number) => Promise<boolean>
  runGate: (gate: OneShotGate, projectId: number) => Promise<boolean>
  review: (gate: GateId, projectId: number) => Promise<void>
  setParams: (projectId: number, params: ProjectParams) => Promise<boolean>
  buildExport: (projectId: number) => Promise<void>
  loadChat: (projectId: number, stage: ChatGateStage) => Promise<void>
  sendChat: (projectId: number, stage: ChatGateStage, message: string | null) => Promise<void>
  confirmGate: (projectId: number, stage: ChatGateStage, force?: boolean) => Promise<boolean>
  loadAuto: (projectId: number) => Promise<void>
  sendAuto: (projectId: number, message: string | null) => Promise<void>
  loadPlan: (projectId: number) => Promise<void>
  loadAssets: (projectId: number) => Promise<void>
  loadBlocks: (projectId: number) => Promise<void>
  attachAssetImage: (projectId: number, tag: string) => Promise<void>
  /** ⭐ Khóa mặt bằng TAY cho 1 @tag (không cần nhắn agent). */
  lockIdentity: (
    projectId: number,
    tag: string,
    lock: Partial<import('@shared/types').IdentityLock>
  ) => Promise<boolean>
  clearError: () => void
  clearSteps: () => void
  resetForProject: () => void
}

export const useWizard = create<WizardState>((set, get) => ({
  running: null,
  steps: [],
  prepResult: null,
  gate0Result: null,
  gateResults: {},
  reviews: {},
  reviewing: null,
  styles: [],
  genres: [],
  directors: [],
  exportBundle: null,
  exporting: false,
  wizardError: null,
  chats: {},
  chatBusy: null,
  autoChat: [],
  autoBusy: false,
  plan: null,
  assetsFull: [],
  coverage: null,
  visualSystem: null,
  blocks: [],

  resetForProject() {
    set({
      running: null,
      steps: [],
      prepResult: null,
      gate0Result: null,
      gateResults: {},
      reviews: {},
      reviewing: null,
      exportBundle: null,
      exporting: false,
      wizardError: null,
      chats: {},
      chatBusy: null,
      autoChat: [],
      autoBusy: false,
      plan: null,
      assetsFull: [],
      coverage: null,
      visualSystem: null,
      blocks: []
    })
  },

  async loadStyles() {
    const res = await window.danh.styles.list()
    if (res.ok) set({ styles: res.data })
  },

  async loadGenres() {
    const res = await window.danh.genres.list()
    if (res.ok) set({ genres: res.data })
  },

  async loadDirectors() {
    const res = await window.danh.directors.list()
    if (res.ok) set({ directors: res.data })
  },

  async setDirector(projectId, directorId) {
    const res = await window.danh.project2.setDirector(projectId, directorId)
    if (res.ok) {
      // director_id nằm trên project → làm tươi activeProject để UI đọc lựa chọn mới.
      await useApp.getState().refreshActiveProject()
      return true
    }
    set({ wizardError: res.error })
    return false
  },

  // Chốt gu → thợ directorBrief sinh Director Bible (stream tiến độ như prep).
  async runDirectorBrief(projectId) {
    set({ running: 'director', steps: [], wizardError: null })
    const off = window.danh.director.onStep((step) =>
      set((s) => ({ steps: [...s.steps, step] }))
    )
    try {
      const res = await window.danh.director.brief(projectId)
      if (res.ok) {
        set({ running: null })
        return true
      }
      set({ wizardError: res.error, running: null })
      return false
    } finally {
      off()
    }
  },

  async runPrep(projectId) {
    set({ running: 'prep', steps: [], wizardError: null })
    const off = window.danh.prep.onStep((step) =>
      set((s) => ({ steps: [...s.steps, step] }))
    )
    try {
      const res = await window.danh.prep.run(projectId)
      if (res.ok) {
        set({ prepResult: res.data, running: null })
        return true
      }
      set({ wizardError: res.error, running: null })
      return false
    } finally {
      off()
    }
  },

  async runGate0(projectId) {
    set({ running: 'gate0', steps: [], wizardError: null })
    const off = window.danh.gate0.onStep((step) =>
      set((s) => ({ steps: [...s.steps, step] }))
    )
    try {
      const res = await window.danh.gate0.run(projectId)
      if (res.ok) {
        set({ gate0Result: res.data, running: null })
        return true
      }
      set({ wizardError: res.error, running: null })
      return false
    } finally {
      off()
    }
  },

  async runGate(gate, projectId) {
    set({ running: gate, steps: [], wizardError: null })
    const off = window.danh.gate.onStep((step) =>
      set((s) => ({ steps: [...s.steps, step] }))
    )
    try {
      const res = await window.danh.gate.run(GATE_KEY[gate], projectId)
      if (res.ok) {
        set((s) => ({
          gateResults: { ...s.gateResults, [gate]: res.data },
          running: null
        }))
        return true
      }
      set({ wizardError: res.error, running: null })
      return false
    } finally {
      off()
    }
  },

  async review(gate, projectId) {
    set({ reviewing: gate, wizardError: null })
    const res = await window.danh.gate.review(projectId, GATE_STAGE[gate])
    if (res.ok) set((s) => ({ reviews: { ...s.reviews, [gate]: res.data }, reviewing: null }))
    else set({ wizardError: res.error, reviewing: null })
  },

  async setParams(projectId, params) {
    const res = await window.danh.project2.setParams(projectId, params)
    if (res.ok) return true
    set({ wizardError: res.error })
    return false
  },

  async buildExport(projectId) {
    set({ exporting: true, wizardError: null })
    const res = await window.danh.exporter.build(projectId)
    if (res.ok) set({ exportBundle: res.data, exporting: false })
    else set({ wizardError: res.error, exporting: false })
  },

  // ---- Hội thoại tinh chỉnh từng cổng ----

  async loadChat(projectId, stage) {
    const res = await window.danh.gate.chatHistory(projectId, stage)
    if (res.ok) set((s) => ({ chats: { ...s.chats, [stage]: res.data } }))
  },

  async sendChat(projectId, stage, message) {
    // Bong bóng người dùng hiện ngay (message=null = mở cổng, không thêm bong bóng).
    if (message !== null) {
      set((s) => ({
        chats: { ...s.chats, [stage]: [...(s.chats[stage] ?? []), { role: 'user', text: message }] }
      }))
    }
    set({ chatBusy: stage, steps: [], wizardError: null })
    const off = window.danh.gate.onStep((step) => set((s) => ({ steps: [...s.steps, step] })))
    try {
      const res = await window.danh.gate.chat(projectId, stage, message)
      if (res.ok) {
        set((s) => ({
          chats: {
            ...s.chats,
            [stage]: [...(s.chats[stage] ?? []), { role: 'assistant', text: res.data.reply }]
          },
          chatBusy: null
        }))
        // LUÔN nạp lại plan sau mỗi lượt chat: bước kịch bản có thể vừa đổi khung xương/
        // chiến lược; các cổng sau (đạo diễn/nguyên liệu) vừa ghi director/visual_system vào
        // plan_artifacts. Nạp lại để cột output + panel "Kế thừa" phản chiếu ngay. loadPlan
        // chỉ đọc DB (rẻ) nên gọi mọi cổng là an toàn.
        void get().loadPlan(projectId)
        // Cổng nguyên liệu vừa chạy → asset/prompt/Color Script có thể đã đổi, nạp lại.
        if (stage === 'gate_assets') void get().loadAssets(projectId)
        // Cổng phân cảnh vừa chạy → block/shot_panel + độ phủ block đã đổi, nạp lại.
        if (stage === 'gate_storyboard') void get().loadAssets(projectId)
        // ⭐ 3 cổng sinh/sửa block → nạp lại block để cột kết quả hiện prompt NGAY sau lượt chat.
        if (stage === 'gate_storyboard' || stage === 'gate2_image' || stage === 'gate3_video')
          void get().loadBlocks(projectId)
      } else {
        set({ wizardError: res.error, chatBusy: null })
      }
    } finally {
      off()
    }
  },

  async loadPlan(projectId) {
    const res = await window.danh.gate.plan(projectId)
    if (res.ok) set({ plan: res.data })
  },

  // ---- Tầng NGUYÊN LIỆU (gate_assets) ----

  async loadAssets(projectId) {
    const [full, cov, vs] = await Promise.all([
      window.danh.assets2.full(projectId),
      window.danh.assets2.coverage(projectId),
      window.danh.assets2.visualSystem(projectId)
    ])
    set({
      assetsFull: full.ok ? full.data : [],
      coverage: cov.ok ? cov.data : null,
      visualSystem: vs.ok ? vs.data : null
    })
  },

  // ---- Tầng BLOCK (phân cảnh / prompt ảnh / prompt video) ----

  async loadBlocks(projectId) {
    const res = await window.danh.blocks.list(projectId)
    // Lỗi thì giữ nguyên danh sách cũ thay vì xóa trắng — tránh cảm giác "mất dữ liệu".
    if (res.ok) set({ blocks: res.data })
  },

  // Gắn ảnh (user đã tạo từ prompt) vào 1 @tag nguyên liệu — dùng chung dialog asset:attach.
  async attachAssetImage(projectId, tag) {
    const res = await window.danh.assets.attach(projectId, tag)
    if (res.ok) await get().loadAssets(projectId)
    else set({ wizardError: res.error })
  },

  // ⭐ Khóa mặt bằng TAY: nạp lại CẢ coverage (không chỉ danh sách asset) để thanh
  // "còn thiếu khóa" và chốt cổng cập nhật ngay, không phải bấm đi bấm lại.
  async lockIdentity(projectId, tag, lock) {
    const res = await window.danh.assets2.lock(projectId, tag, lock)
    if (!res.ok) {
      set({ wizardError: res.error })
      return false
    }
    await get().loadAssets(projectId)
    return true
  },

  // ---- Sếp điều phối (tab Tự động) ----

  async loadAuto(projectId) {
    const res = await window.danh.orchestrator.history(projectId)
    if (res.ok) set({ autoChat: res.data })
  },

  async sendAuto(projectId, message) {
    // Bong bóng người dùng hiện ngay (message=null = mở chế độ, không thêm bong bóng).
    if (message !== null) {
      set((s) => ({ autoChat: [...s.autoChat, { role: 'user', text: message }] }))
    }
    set({ autoBusy: true, steps: [], wizardError: null })
    const off = window.danh.orchestrator.onStep((step) => set((s) => ({ steps: [...s.steps, step] })))
    try {
      const res = await window.danh.orchestrator.chat(projectId, message)
      if (res.ok) {
        set((s) => ({
          autoChat: [...s.autoChat, { role: 'assistant', text: res.data.reply }],
          autoBusy: false
        }))
        // Sếp có thể vừa cho chạy GATE 1 → khung xương/chiến lược đổi, nạp lại để hiển thị.
        void get().loadPlan(projectId)
      } else {
        set({ wizardError: res.error, autoBusy: false })
      }
    } finally {
      off()
    }
  },

  async confirmGate(projectId, stage, force) {
    const res = await window.danh.gate.confirm(projectId, stage, force)
    if (res.ok) {
      set({ wizardError: null })
      // Backend vừa ghi stage mới vào DB (updateProjectStage). Làm tươi activeProject
      // để luật khóa bước (stageRank) đọc stage MỚI — nếu không, tab/step quá khứ vẫn
      // tính theo stage cũ lúc mở DB → hiện 🔒 dù đã chốt, không bấm quay lại được.
      await useApp.getState().refreshActiveProject()
      return true
    }
    set({ wizardError: res.error })
    return false
  },

  clearError() {
    set({ wizardError: null })
  },

  // Dọn nhật ký tiến độ thợ (steps là biến TOÀN CỤC dùng chung mọi cổng). Gọi khi ĐỔI cổng
  // để khung "TIẾN ĐỘ THỢ" của cổng CŨ không rò sang cổng mới (VD log write_image_prompt của
  // GATE 2 hiện nhầm ở màn Phân cảnh). Không đụng chat/plan — chỉ xóa log tạm.
  clearSteps() {
    set({ steps: [] })
  }
}))

/** Stage này có khung xương/chiến lược để hiển thị dưới khung chat không? */
export function stageHasPlan(stage: string): boolean {
  return PLAN_STAGES.has(stage)
}

export { GATE_STAGE }
