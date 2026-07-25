// ============================================================
// Danh Script — NGUỒN DUY NHẤT về thứ tự bước wizard + luật khóa step
// Trước đây thứ tự bị rải ở 5 nơi (STEPS, stepFromStage, chuỗi onDone,
// GATE_MAP, _decision.md) → dễ lệch. Gom hết về đây.
//
// THỨ TỰ MỚI (đảo Ý đồ xuống SAU Nháp — bottom-up):
//   Nháp → Ý đồ → Khung xương → Chuyển thể → Final → Style →
//   Đạo diễn → Nguyên liệu → Prompt ảnh → Prompt video → Xuất
// ============================================================
import type { Stage } from './types'

export interface WizardStepDef {
  key: string
  label: string
  /**
   * Stage được GHI vào DB khi người dùng chốt xong bước này (dùng cho dấu ✓ +
   * khóa bước SAU). null = bước phụ trợ (auto/prep) — không tính vào khóa tuần tự.
   */
  confirmStage: Stage | null
  /**
   * Stage tối thiểu để MỞ (bấm được) bước này. Mặc định = confirmStage.
   * Chỉ cần cho MÀN GỘP (vd 'script' gom gate1a→gate1d): mở sớm ở sub-stage đầu
   * (gate1a_draft) nhưng chỉ ✓ done khi chốt sub-stage cuối (gate1d_script).
   */
  unlockStage?: Stage
}

/** Danh sách bước theo ĐÚNG thứ tự hiển thị + thứ tự chạy. */
export const WIZARD_STEPS = [
  { key: 'auto', label: '🤖 Tự động', confirmStage: null },
  { key: 'prep', label: 'Chuẩn bị', confirmStage: null },
  // Chọn GU ĐẠO DIỄN — non-gating (confirmStage null): chỉ ghi director_id, chảy vào
  // ledger MỌI bước sau như kim chỉ nam thẩm mỹ. Không vào STAGE_ORDER nên không khóa.
  { key: 'director_pick', label: '🎬 Chọn đạo diễn', confirmStage: null },
  // Màn GỘP: 5 bước kịch bản cũ (Nháp→Ý đồ→Khung xương→Chuyển thể→Final) nay là
  // 5 TAB trong ScriptWorkbench. Stepper ngoài chỉ còn 1 nút. Mở sớm từ gate1a_draft
  // (để vào ngay sau prep), ✓ done khi chốt gate1d_script (tab Final).
  { key: 'script', label: 'Kịch bản', confirmStage: 'gate1d_script', unlockStage: 'gate1a_draft' },
  { key: 'params', label: 'Style', confirmStage: 'gate_params' },
  { key: 'director', label: 'Nhịp & thời lượng', confirmStage: 'gate_director' },
  { key: 'assets', label: 'Nguyên liệu', confirmStage: 'gate_assets' },
  { key: 'storyboard', label: '🎞️ Phân cảnh', confirmStage: 'gate_storyboard' },
  { key: 'gate2', label: 'Prompt ảnh', confirmStage: 'gate2_image' },
  { key: 'gate3', label: 'Prompt video', confirmStage: 'gate3_video' },
  { key: 'export', label: 'Xuất', confirmStage: 'gate4_export' }
] as const satisfies readonly WizardStepDef[]

export type StepKey = (typeof WIZARD_STEPS)[number]['key']

/**
 * THỨ TỰ STAGE trong pipeline (theo thứ tự MỚI, KHÔNG theo tên).
 * Tên stage giữ nguyên để không vỡ DB cũ; "bậc" của stage do vị trí trong mảng này quyết định.
 */
const STAGE_ORDER: Stage[] = [
  'gate1a_draft', // 0 — Nháp chốt
  'gate0_ideal', // 1 — Ý đồ chốt (đảo xuống sau nháp)
  'gate1b_skeleton', // 2
  'gate1c_adaptation', // 3
  'gate1d_script', // 4
  'gate_params', // 5
  'gate_director', // 6
  'gate_assets', // 7
  'gate_storyboard', // 8 — Phân cảnh chốt
  'gate2_image', // 9
  'gate3_video', // 10
  'gate4_export', // 11
  'done' // 12
]

/**
 * "Bậc" của stage đã chốt = vị trí trong STAGE_ORDER.
 * - 'draft' (mặc định lúc tạo, CHƯA chốt gì) hoặc stage lạ → -1.
 * - 'gate1_script' (legacy 1 cục) → coi như đã xong tới gate1d_script.
 */
export function stageRank(stage: string): number {
  if (stage === 'gate1_script') return STAGE_ORDER.indexOf('gate1d_script')
  return STAGE_ORDER.indexOf(stage as Stage) // -1 nếu không thấy (gồm 'draft')
}

/** Vị trí "chốt" của bước gating trong STAGE_ORDER (bước phụ trợ → -1). */
function stepPosition(def: WizardStepDef): number {
  if (def.confirmStage === null) return -1
  return STAGE_ORDER.indexOf(def.confirmStage)
}

/** Vị trí "mở khóa" — mặc định = vị trí chốt; màn gộp mở sớm hơn qua unlockStage. */
function unlockPosition(def: WizardStepDef): number {
  if (def.unlockStage) return STAGE_ORDER.indexOf(def.unlockStage)
  return stepPosition(def)
}

/**
 * Bước này có MỞ (bấm được) với stage hiện tại không?
 * Luật (đã chốt với người dùng): khóa TƯƠNG LAI, mở QUÁ KHỨ.
 *   - auto/prep: luôn mở.
 *   - bước gating: mở nếu vị trí ≤ (bậc stage đã chốt + 1).
 *     → chỉ vào được đúng bước KẾ TIẾP bước đã chốt; bước đã xong quay lại sửa thoải mái.
 */
export function stepUnlocked(stepKey: string, stage: string): boolean {
  const def = WIZARD_STEPS.find((s) => s.key === stepKey)
  if (!def) return false
  const pos = unlockPosition(def)
  if (pos < 0) return true // auto/prep
  return pos <= stageRank(stage) + 1
}

/** Bước này ĐÃ chốt xong chưa (để hiện dấu ✓). */
export function stepConfirmed(stepKey: string, stage: string): boolean {
  const def = WIZARD_STEPS.find((s) => s.key === stepKey)
  if (!def) return false
  const pos = stepPosition(def)
  if (pos < 0) return false
  return pos <= stageRank(stage)
}

/**
 * Stage cần HẠ VỀ để "làm lại" một bước sinh-data: = confirmStage của bước gating
 * NGAY TRƯỚC nó trong STAGE_ORDER (để bước đang làm lại về "chưa chốt", các bước
 * sau tự khóa lại). Nếu không có bước gating nào trước → '' (về 'draft' = chưa chốt gì).
 */
export function backStageFor(stepKey: string): string {
  const def = WIZARD_STEPS.find((s) => s.key === stepKey)
  if (!def || def.confirmStage === null) return 'draft'
  const pos = unlockPosition(def)
  // stage ngay trước vị trí MỞ của bước này ('draft' = chưa chốt gì)
  return STAGE_ORDER[pos - 1] ?? 'draft'
}

/**
 * Từ stage đã lưu → bước NÊN mở khi vừa mở dự án (bước kế tiếp bước đã chốt).
 * Quá gate3_video (đã tới xuất) → 'export'.
 */
export function stepFromStage(stage: string): StepKey {
  if (stageRank(stage) < 0) return 'prep' // G5: dự án mới (chưa chốt gì / stage lạ) dừng ở prep
  const next = stageRank(stage) + 1 // vị trí bước chưa chốt kế tiếp
  if (next >= STAGE_ORDER.length - 2) return 'export' // gate3_video xong / gate4_export / done
  // Bước phủ vị trí `next`: khoảng [unlock..confirm] chứa `next`. Màn GỘP 'script'
  // phủ gate1a→gate1d, nên mọi sub-stage kịch bản đều route về 'script' (không còn
  // key mồ côi draft/gate0/skeleton/adaptation gây màn trắng khi mở lại DB).
  const def = WIZARD_STEPS.find(
    (s) => s.confirmStage !== null && unlockPosition(s) <= next && next <= stepPosition(s)
  )
  return (def?.key ?? 'script') as StepKey
}
