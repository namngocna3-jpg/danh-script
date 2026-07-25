// ============================================================
// Danh Script — Kiểu dữ liệu dùng chung (main ⇆ renderer)
// ============================================================

/**
 * Pipeline = PRESET KHỞI ĐẦU, KHÔNG phải khuôn ép.
 * 'free' = ideal bất kỳ (engine tự suy mọi thứ, như Higgsfield).
 * 3 cái còn lại chỉ pre-load skill/tham số gợi ý — engine vẫn đọc ideal quyết định.
 */
export type Pipeline = 'free' | 'affiliate' | 'tvc' | 'fashion'

/** Nhà cung cấp LLM sinh prompt (KHÁC model render BytePlus). */
export type LlmProvider = 'anthropic' | '9router' | 'beeknoee'

/** Cài đặt LLM hiển thị ra renderer — KHÔNG bao giờ chứa apiKey thô. */
export interface LlmSettingsPublic {
  provider: LlmProvider
  modelName: string
  baseUrl: string
  hasKey: boolean // đã có key chưa
  encrypted: boolean // key có được mã hóa theo máy (safeStorage) không
}

/**
 * Giai đoạn wizard (11 bước, mô hình Toonflow đầy đủ).
 * Kịch bản tách 4 bước chat độc lập (draft→skeleton→adaptation→script);
 * gate_assets = tầng nguyên liệu (Visual System) tách TỪ kịch bản final.
 * Giữ 'gate1_script' cho tương thích DB cũ (dự án đã lưu bằng stage này).
 */
export type Stage =
  | 'draft'
  | 'gate0_ideal'
  | 'gate1a_draft'
  | 'gate1b_skeleton'
  | 'gate1c_adaptation'
  | 'gate1d_script'
  | 'gate1_script' // legacy (dự án cũ lưu 1 cục)
  | 'gate_params'
  | 'gate_director' // ⭐ Quy hoạch đạo diễn (tách cảnh + đếm thoại + chấm cảm xúc 0–10 + chuyển cảnh)
  | 'gate_assets'
  | 'gate_storyboard'
  | 'gate2_image'
  | 'gate3_video'
  | 'gate4_export'
  | 'done'

/** Ideal thô người dùng nhập (tiếng Việt) + phần làm giàu. */
export interface Ideal {
  raw: string // ý tưởng gốc tiếng Việt
  goal?: string // mục tiêu (bán hàng/nhận diện...)
  product?: string // sản phẩm/dịch vụ
  audience?: string // đối tượng
  duration_sec?: number // thời lượng mong muốn
  notes?: string
  brief?: IdealBrief // ⭐ làm giàu tiền-ideal (persona + research), Nhóm A
}

/**
 * ⭐ Brief tiền-ideal — do personaBuilder + researcher (Nhóm A) đắp vào.
 * Chạy TRƯỚC GATE 0; các thợ sau (script/voice/prompt) đọc để bám target + chống bịa.
 */
export interface IdealBrief {
  target?: string // chân dung đối tượng xem
  angle?: string // góc cảm xúc chính
  triggers?: string[] // trigger tâm lý (khan hiếm, bằng chứng xã hội...)
  core_message?: string // thông điệp lõi 1 câu
  research_notes?: string[] // ngữ cảnh ngành/trend (có kiểm chứng)
  claims_flagged?: string[] // khẳng định bị gắn cờ ⚠ / gỡ bỏ
  // ⭐ GATE 0 (ideaAnalyst) — "Ý đồ chốt": làm rõ Ý ĐỒ trước, CHƯA phân cảnh.
  mood?: string // tông/mood tổng thể của video (VD: ấm áp hoài niệm, gấp gáp kịch tính)
  genre?: string // thể loại gợi ý (VD: kể chuyện đời thường, quảng cáo cảm xúc, hài tình huống)
  duration_hint?: string // độ dài dự kiến (VD: "30–45 giây, ~5 cảnh")
  // ⭐ Ý ĐỒ ĐẦU RA — mô tả TỰ DO (KHÔNG enum): video này để kể chuyện thuần,
  // để bán/chuyển đổi, hay lai. Dẫn tông toàn pipeline + quyết định có/không CTA.
  // Mặc định nghiêng kể chuyện; chỉ ghi mục tiêu thương mại khi ideal nêu rõ.
  output_intent?: string
}

/**
 * ⭐ KHUNG XƯƠNG cốt chuyện (GATE 1, dựng TRƯỚC narration) — làm kịch bản "dày".
 * Biên kịch phải chốt khung này rồi mới viết lời thoại, để mạch không rời rạc.
 */
export interface StorySkeleton {
  logline: string // 1 câu tóm cả chuyện (ai · muốn gì · cản trở gì)
  beats: SkeletonBeat[] // các nhịp chính theo trình tự (hook → thân → cao trào → kết)
  emotional_arc?: string // đường cong cảm xúc xuyên video (VD: tò mò → căng → vỡ oà → nhẹ nhõm)
  payoff?: string // điểm trả bài / cú chốt khán giả chờ
}

/** 1 nhịp trong khung xương — ánh xạ (thô) tới 1 hoặc nhiều cảnh. */
export interface SkeletonBeat {
  order: number // thứ tự nhịp (1,2,3...)
  role: string // vai trò nhịp: hook | thiết lập | xung đột | cao trào | giải quyết | CTA...
  summary: string // nội dung nhịp (tiếng Việt, gọn)
  scene_hint?: string // gợi ý nhịp này rơi vào cảnh nào (VD "cảnh 1-2")
}

/**
 * ⭐ CHIẾN LƯỢC CHUYỂN THỂ (GATE 1) — ideal trừu tượng → hành động/hình ảnh CỤ THỂ.
 * Chống "kể chay": mỗi thông điệp phải quy ra thứ camera quay được.
 */
export interface AdaptationStrategy {
  approach: string // hướng chuyển thể tổng (VD "kể qua 1 ngày của nhân vật", "trước/sau")
  show_dont_tell: string[] // các phép "cho xem thay vì kể": thông điệp → hành động/hình ảnh cụ thể
  visual_motifs?: string[] // motif hình lặp lại giữ mạch (màu/vật/động tác biểu tượng)
  tone?: string // tông tổng thể (ấm áp/kịch tính/hài...)
  pitfalls?: string[] // cạm bẫy cần né khi viết lời thoại/dựng cảnh
}

/** Tham số kỹ thuật chốt ở GATE THAM SỐ. */
export interface ProjectParams {
  duration_sec: number
  aspect_ratio: '9:16' | '16:9' | '1:1' | '4:5'
  language: string // ngôn ngữ narration/voice (mặc định 'vi')
  style_id: string // ⭐ STYLE = chất liệu render, khóa L1 toàn dự án
  genre?: string // TÙY CHỌN: slug thể loại (skills/genres/<genre>.md) gợi ý nhịp kể — KHÔNG ép khuôn, bỏ trống = free
}

/** ⭐ BỐI CẢNH riêng TỪNG cảnh (lớp B, mềm) — do ideal đẻ ra bottom-up. */
export interface SceneContext {
  era: string // thời đại: 'cổ đại' | 'hiện đại' | 'tương lai' ...
  setting: string // nơi chốn
  wardrobe: string // trang phục
  props: string[] // đạo cụ
  mood: string // tông cảm xúc / ánh sáng
}

/** ⭐ Khóa nhận dạng nhân vật — CỨNG mặt/dáng, MỀM đồ/tóc. */
export interface IdentityLock {
  face: string // mô tả khuôn mặt (khóa cứng)
  body: string // vóc dáng (khóa cứng)
  // đồ/tóc/đạo cụ nằm ở variations (mềm, đổi theo cảnh)
}

/**
 * ⭐ ASSET TAG — quy ước prompt của 5 nguồn (xác nhận từ prompt mẫu thật):
 * prompt nhúng @TênAsset trỏ tới 1 ảnh tư liệu.
 * VD: "in @ADIL's eyeline... @REMOTE stays normal size...
 *      Wardrobe comes from the @ADIL reference and stays identical across the whole take."
 */
export interface AssetTag {
  tag: string // 'ADIL', 'REMOTE', 'QUANCAFE' (không kèm @)
  asset_id: number | null // trỏ tới assets.id (null = tag tạm chưa gắn)
  role: AssetRole
  ref_image_path: string | null // ảnh tư liệu để dán sang Coco
  lock_note: string // câu khẳng định nhất quán: "...identical across the whole take"
}

/**
 * ⭐ Loại tài nguyên (học Toonflow): nhân vật/sản phẩm/đạo cụ + BỐI CẢNH.
 * 'scene' = bối cảnh/địa điểm — asset HẠNG NHẤT có ảnh concept riêng (không người),
 * khóa để mọi cảnh cùng nơi chốn nhất quán thị giác (feed làm reference image).
 */
export type AssetRole = 'char' | 'prop' | 'product' | 'scene'

/** Bảng map @tag → ảnh tư liệu, xuất kèm bundle để dán vào Coco. */
export type TagMap = AssetTag[]

/** ⭐ Prompt VIDEO (BytePlus) — nhúng @tag trong các trường; text_overlay = chữ dán CapCut. */
export interface VideoPrompt {
  style: string // chất liệu render (từ style_id, L1) — KHÔNG chứa thời đại
  scene: string // bối cảnh cảnh này (L2) + nhúng @tag nhân vật/đạo cụ
  motion: string // chuyển động camera/nhân vật (Higgsfield preset)
  audio: string // âm thanh/thoại (narration ngôn ngữ người dùng)
  constraints: string // ⭐ ràng buộc POSITIVE cho Seedance (thay negative — engine đọc cái này)
  negative: string // negative prompt (dự phòng — Seedance BỎ QUA, chỉ dùng nếu Coco đổi model)
  text_overlay: string // chữ CTA/giá tiếng Việt CHÍNH XÁC dán ở khâu dựng (CapCut); trống nếu block không cần chữ
  tags: TagMap // các @tag dùng trong prompt này
}

export interface Project {
  id: number
  name: string
  pipeline: Pipeline
  ideal_json: string // JSON<Ideal>
  params_json: string | null // JSON<ProjectParams>
  style_id: string | null
  director_id: string | null // gu đạo diễn chọn ở đầu dự án (skills/directors/<id>.md); null = chưa chọn
  stage: Stage
  created_at: string
}

export interface Scene {
  id: number
  project_id: number
  order_idx: number
  summary: string
  narration_vi: string
  scene_context_json: string | null // JSON<SceneContext>
}

export interface Block {
  id: number
  scene_id: number
  order_idx: number
  shot_desc: string | null // ý đồ shot quy hoạch trước ở GATE 1 (góc/hành động/nội dung khung)
  image_prompt_en: string | null
  video_prompt_json: string | null
  shot_panel_json: string | null
  rendered_bool: 0 | 1
}

/** 1 block = 1 shot: khối phân cảnh chi tiết (cột blocks.shot_panel_json, JSON). */
export interface ShotPanel {
  shot_size: string
  camera_angle: string
  camera_move: string
  subject: string
  action_start: string
  action_end: string
  layout: string | null
  cuts: string | null
  duration_sec: number
  asset_tags: string[]
  notes: string | null
}

export interface Asset {
  id: number
  project_id: number | null // null = global
  type: AssetRole // char | product | prop | scene (bối cảnh = asset hạng nhất)
  name: string
  identity_lock_json: string | null // JSON<IdentityLock>
  variations_json: string | null
  ref_image_path: string | null
  gen_prompt: string | null // ⭐ prompt SINH ảnh nguyên liệu (điểm dừng: copy → Coco → upload ảnh về)
  parent_id: number | null // asset phái sinh trỏ về gốc (null = gốc)
  derive_kind: string | null // wardrobe | state | time | weather | angle (null = gốc)
  source: 'auto' | 'manual' // 'auto' = assetDeriver tách từ kịch bản
}

/** Loại biến thể phái sinh (theo luật Toonflow). */
export type DeriveKind = 'wardrobe' | 'state' | 'time' | 'weather' | 'angle'

/**
 * ⭐ Nguyên liệu ĐẦY ĐỦ 1 dòng (gốc kèm danh sách phái sinh) cho màn Nguyên liệu.
 * gen_prompt = prompt sinh ảnh (điểm dừng); ref_image_path = ảnh user đã upload về.
 */
export interface AssetFull {
  asset_id: number
  tag: string
  role: AssetRole
  name: string
  identity_lock: IdentityLock | null // ⭐ mặt/dáng khóa CỨNG (char) — nguồn chống drift cho gate ảnh/video
  gen_prompt: string | null
  ref_image_path: string | null
  source: 'auto' | 'manual'
  derivatives: AssetDerivative[]
}

/** 1 asset phái sinh (biến thể) trỏ về asset gốc. */
export interface AssetDerivative {
  asset_id: number
  tag: string
  name: string
  derive_kind: string | null
  gen_prompt: string | null
  ref_image_path: string | null
}

/** Báo cáo độ phủ nguyên liệu (lá chắn chặn chốt cổng khi còn thiếu prompt/ảnh). */
export interface AssetCoverage {
  total: number
  missingPrompt: string[] // @tag chưa có prompt sinh ảnh
  missingImage: string[] // @tag đã có prompt nhưng chưa gắn ảnh
}

/**
 * ⭐ QUY HOẠCH ĐẠO DIỄN (gate_director, mô hình Toonflow director_plan) — mắt xích làm
 * storyboard bám sát: tách cảnh, ĐẾM thoại, CHẤM cảm xúc 0–10, thiết kế chuyển cảnh.
 * Chỉ TÁCH & phân tích, KHÔNG sáng tạo nội dung mới (trừ mô tả chuyển cảnh).
 */
export interface DirectorPlan {
  scenes: DirectorScene[]
  overall_note?: string // lưu ý xuyên phim (nhịp tổng, motif chuyển cảnh)
}

/** Phân tích đạo diễn 1 cảnh. */
export interface DirectorScene {
  order: number // = scenes.order_idx
  line_count: number // số câu thoại/VO trong cảnh
  char_count: number // tổng số chữ thoại (ước thời lượng: ~4 chữ/giây)
  emotion: string // cảm xúc chủ đạo (VD "tò mò → vỡ oà", ghi X→Y nếu có chuyển)
  emotion_intensity: number // độ đậm 0–10
  transition?: string // thiết kế chuyển sang cảnh sau (cắt/mờ/match-cut...)
  note?: string // lưu ý dựng cảnh riêng
}

/**
 * ⭐ HIẾN PHÁP THẨM MỸ (Director Bible) — sinh khi "chốt gu" ở đầu dự án (SAU prep, TRƯỚC cảnh).
 * Thợ directorBrief đọc brief + persona thô (gu đã chọn) rồi CÁ NHÂN HÓA cho phim này:
 * chưng persona chung → 1 khối định hướng gọn, sát brief. Chảy vào ledger MỌI bước sau
 * (thay khối persona thô). KHÁC DirectorPlan (đếm thoại/cảm xúc per-cảnh, sinh muộn) —
 * Bible là ĐẦU VÀO định hướng cho DirectorPlan + VisualSystem, không đè lên chúng.
 */
export interface DirectorBible {
  director_id: string // gu nguồn (skills/directors/<id>.md)
  logline_visual: string // 1 câu: phim này TRÔNG như thế nào
  color_script: string // bảng màu theo cung cảm xúc, áp brief này
  lighting: string // scheme ánh sáng chọn cho phim này
  texture: string // chất liệu/bề mặt nhấn
  camera_language: string // ngôn ngữ máy + nhịp cắt (CUT-by-CUT)
  emotion_face: string // map cảm xúc → mặt/mắt/hình thể
  sound_design: string // nhạc/ambient định hướng
  physics_notes: string // vật lý Seedance áp cho phim (quán tính, điểm hỏng giây 5–8)
  do_dont: string[] // 3–6 điều NÊN/TRÁNH cụ thể phim này
}

/**
 * ⭐ HỆ THỐNG THỊ GIÁC toàn phim (Visual System, Toonflow Bước 1.4) — đồng bộ tông.
 * Color Script + ánh sáng + chất liệu; giữ tông nhất quán khi sinh ảnh nguyên liệu.
 */
export interface VisualSystem {
  color_script: ColorScriptEntry[] // tone màu theo từng cảnh/nhịp
  lighting?: string // thiết kế ánh sáng tổng (nguồn sáng, độ tương phản)
  texture?: string // chất liệu/bề mặt chủ đạo (da/vải/kim loại/gỗ/đá)
  palette_note?: string // bảng màu tổng + emotional palette
}

/** 1 mốc Color Script (tone màu 1 cảnh/nhịp). */
export interface ColorScriptEntry {
  scene_order: number // cảnh áp dụng
  palette: string // màu chủ đạo (VD "cam hoàng hôn ấm, bóng tím")
  emotion: string // cảm xúc gắn với màu
  contrast?: string // tương phản (cao/thấp)
  saturation?: string // độ bão hòa (rực/trầm)
}

// ---- Payload tạo dự án từ renderer ----
export interface CreateProjectInput {
  name: string
  pipeline: Pipeline
  ideal: Ideal
}

// ---- Kết quả IPC bọc lỗi (không ném qua bridge) ----
export type IpcResult<T> = { ok: true; data: T } | { ok: false; error: string }

// ============================================================
// Kết quả các cổng (dùng chung main ⇆ preload ⇆ renderer)
// ============================================================

/** 1 bước trong vòng chạy agent (stream ra UI). */
export interface AgentStep {
  step: number
  kind: 'text' | 'tool_call' | 'tool_result' | 'done'
  detail: string
}

export interface PrepResult {
  persona: string
  research: string
  steps: number
}

export interface DirectorBriefResult {
  steps: number // số bước thợ directorBrief đã chạy để sinh Director Bible
}

export interface Gate0Result {
  summary: string // tóm tắt tiếng Việt của thợ (Markdown)
  brief: IdealBrief | null // ⭐ "Ý đồ chốt" — GATE 0 chỉ làm rõ ý đồ, CHƯA phân cảnh
  steps: number
}

export interface GateResult {
  worker: string
  summary: string
  steps: number
  stage: string
}

export interface ReviewResult {
  grade: 'A' | 'B' | 'C' | 'D' | '?'
  report: string
}

export interface ExportBlock {
  scene_order: number
  block_order: number
  narration_vi: string
  image_prompt_en: string
  video_prompt: VideoPrompt | null
  asset_ids: number[] // ⭐ id nguyên liệu/biến thể block này dùng (bảng nối block_assets)
}

export interface ExportBundle {
  projectName: string
  styleId: string | null
  stylePrefix: string | null // ⭐ Style Prefix nguyên văn (anchor.md) — dán verbatim vào mọi prompt video
  tagMap: AssetTag[]
  blocks: ExportBlock[]
  skeleton: StorySkeleton | null // ⭐ khung xương cốt chuyện
  adaptation: AdaptationStrategy | null // ⭐ chiến lược chuyển thể
  director: DirectorPlan | null // ⭐ quy hoạch đạo diễn (đếm thoại + cảm xúc)
  visualSystem: VisualSystem | null // ⭐ hệ thống thị giác / Color Script
  assets: AssetFull[] // ⭐ nguyên liệu đầy đủ (gốc + phái sinh + prompt sinh ảnh)
}

/** Gói artifact tiền-kịch-bản + đạo diễn + hệ thị giác (đọc cho UI/export). */
export interface PlanArtifacts {
  brief: IdealBrief | null // ⭐ ý đồ chốt (GATE 0) — đọc từ ideal_json.brief
  draft: string | null // ⭐ kịch bản nháp (chốt hướng, gate1a)
  skeleton: StorySkeleton | null
  adaptation: AdaptationStrategy | null
  director: DirectorPlan | null // ⭐ quy hoạch đạo diễn (gate_director)
  visualSystem: VisualSystem | null // ⭐ hệ thống thị giác / Color Script (gate_assets)
  directorBible: DirectorBible | null // ⭐ hiến pháp thẩm mỹ (chốt gu — sinh SỚM, trước cảnh)
}

export interface StyleOption {
  id: string
  label: string
}

/** 1 thể loại à-la-carte (skills/genres/<id>.md) cho GATE tham số. */
export interface GenreOption {
  id: string // slug = tên file không .md
  label: string // tiêu đề H1 đã bỏ tiền tố "GENRE · "
  group: string // sales | story | misc (chữ đầu slug) để UI gom nhóm
}

/** 1 gu đạo diễn (skills/directors/<id>.md) chọn ở đầu dự án — chảy vào ledger mọi bước. */
export interface DirectorOption {
  id: string // slug = tên file không .md
  label: string // frontmatter label
  description: string // frontmatter description (1 câu — giúp chọn)
}

/**
 * Khóa cổng thợ có tool. Giữ 'scriptwright' (legacy 1-cục) cho đường chạy 1-phát cũ;
 * bổ sung các worker tách nhỏ + đạo diễn + nguyên liệu (mô hình Toonflow).
 */
export type GateKey =
  | 'scriptwright' // legacy (1 cục)
  | 'scriptDraft'
  | 'skeletonWright'
  | 'adaptWright'
  | 'scriptFinal'
  | 'directorPlanner'
  | 'assetDeriver'
  | 'imgPrompter'
  | 'vidPrompter'

/**
 * stage cổng hỗ trợ hội thoại tinh chỉnh (mỗi bước 1 chat độc lập — mô hình Toonflow).
 * Kịch bản tách 4 bước: draft → skeleton → adaptation → script.
 * gate_director = quy hoạch đạo diễn; gate_assets = tầng nguyên liệu.
 */
export type ChatGateStage =
  | 'gate0_ideal'
  | 'gate1a_draft'
  | 'gate1b_skeleton'
  | 'gate1c_adaptation'
  | 'gate1d_script'
  | 'gate1_script' // legacy
  | 'gate_director'
  | 'gate_assets'
  | 'gate_storyboard'
  | 'gate2_image'
  | 'gate3_video'

/** 1 bong bóng hội thoại hiển thị trên UI (đã bỏ khối tool). */
export interface ChatTurn {
  role: 'user' | 'assistant'
  text: string
}

/** Kết quả 1 lượt chat gate: text agent nói với người dùng. */
export interface GateChatReply {
  reply: string
}
