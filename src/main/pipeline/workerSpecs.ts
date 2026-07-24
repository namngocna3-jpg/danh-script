// ============================================================
// Danh Script — NGUỒN SỰ THẬT tool + layer của thợ (dùng chung 2 đường chạy)
// gates.ts (1-phát) và gateChat.ts (hội thoại) cùng đọc bảng này để KHÔNG
// khai báo trùng ở 2 nơi → sửa layer/tool 1 chỗ, cả 2 đường đồng bộ.
//
// LƯU Ý: chỉ gộp phần CHUNG:
//  • layers  — danh sách mảnh skill nạp kèm (giống hệt 2 nơi).
//  • tools   — write-tool + read đặc thù CỐT LÕI của thợ.
// Đường chat tự spread READ_TOOLS (read_plan...) như cũ; đường gates tự thêm
// các read cơ bản riêng. Không nhồi READ_TOOLS vào đây (tránh cấp thừa cho 1-phát).
// ============================================================

export interface WorkerSpec {
  tools: string[] // tool riêng cốt lõi của thợ (write + read đặc thù)
  layers: string[] // mảnh skill chung nạp kèm (tên file trong skills/)
}

export const WORKER_SPECS: Record<string, WorkerSpec> = {
  directorPlanner: {
    tools: ['read_ideal', 'read_scenes', 'read_script_full', 'write_director_plan'],
    layers: ['storyboard-craft.md']
  },
  assetDeriver: {
    tools: [
      'read_ideal',
      'read_plan',
      'read_scenes',
      'read_assets',
      'read_script_full',
      'read_asset_coverage',
      'derive_assets',
      'write_asset_prompt',
      'save_derived_asset',
      'write_visual_system'
    ],
    layers: [
      'asset-prompt-craft.md',
      'visual-system.md',
      'identity-lock.md',
      'style-constitution.md'
    ]
  },
  imgPrompter: {
    tools: [
      'read_ideal',
      'read_plan',
      'read_scenes',
      'read_blocks',
      'read_assets',
      'read_coverage',
      'save_asset',
      'write_image_prompt'
    ],
    layers: [
      'style-constitution.md',
      'identity-lock.md',
      'craft-photography.md',
      'byteplus-spec.md',
      'consistency.md',
      'moderation-softening.md'
    ]
  },
  vidPrompter: {
    tools: [
      'read_ideal',
      'read_scenes',
      'read_blocks',
      'read_assets',
      'read_coverage',
      'write_video_prompt'
    ],
    layers: [
      'style-constitution.md',
      'craft-photography.md',
      'motion-library.md',
      'byteplus-spec.md',
      'model-catalog.md',
      'consistency.md',
      'moderation-softening.md'
    ]
  }
}

/** Lấy spec 1 thợ; ném lỗi rõ nếu tên sai (chống lệch âm thầm). */
export function workerSpec(name: string): WorkerSpec {
  const s = WORKER_SPECS[name]
  if (!s) throw new Error(`[danh-script] Không có WORKER_SPEC cho thợ: ${name}`)
  return s
}
