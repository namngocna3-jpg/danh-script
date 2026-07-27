// ============================================================
// Danh Script — DANH MỤC MODEL RENDER (BytePlus)
//
// VÌ SAO CÓ FILE NÀY: app xuất prompt cho engine NGOÀI (Coco/BytePlus). Mỗi đời model
// đọc prompt theo luật khác nhau — Seedream 5.0 xếp lớp và chịu prompt dài, 4.0 bám
// công thức 6 phần ngắn; Seedance 2.5 nhận 50 tham chiếu / 30s, 2.0 chỉ 12 file / 15s.
// Viết prompt cho đời này rồi dán vào đời kia = engine bỏ qua nửa chỉ thị.
//
// File này CHỈ giữ metadata để UI hiện và validator chặn. LUẬT VIẾT PROMPT nằm ở
// `skills/models/<id>.md` — thêm model mới = thêm 1 dòng ở đây + 1 file .md, KHÔNG sửa
// logic. Đây là chỗ duy nhất khai model, cả main lẫn renderer đều import từ đây.
// ============================================================
import type { ImageModelId, VideoModelId } from './types'

export interface ModelInfo {
  id: string
  label: string // tên hiện trên nút chọn
  note: string // 1 dòng giải thích cho người dùng (tiếng Việt)
  skill: string // file luật prompt trong skills/ (tương đối skillsRoot)
  status: 'current' | 'upcoming' | 'legacy'
}

export interface ImageModelInfo extends ModelInfo {
  id: ImageModelId
  max_refs: number // số ảnh tham chiếu tối đa
}

export interface VideoModelInfo extends ModelInfo {
  id: VideoModelId
  max_duration_sec: number // độ dài 1 lần sinh (trần engine)
  max_refs: number // tổng file tham chiếu tối đa
}

/** ⭐ Model ẢNH mặc định — Seedream 5.0 là bản hiện hành. */
export const DEFAULT_IMAGE_MODEL: ImageModelId = 'seedream-5'
/** ⭐ Model VIDEO mặc định — Seedance 2.0 là bản đang chạy được; 2.5 sắp tới. */
export const DEFAULT_VIDEO_MODEL: VideoModelId = 'seedance-2.0'

export const IMAGE_MODELS: ImageModelInfo[] = [
  {
    id: 'seedream-5',
    label: 'Seedream 5.0',
    note: 'Bản hiện hành. Prompt xếp LỚP (format → chủ thể → bố cục → ánh sáng → chữ → style), chịu prompt dài hơn, sửa vùng chính xác, tới 10 ảnh tham chiếu.',
    skill: 'models/seedream-5.md',
    status: 'current',
    max_refs: 10
  },
  {
    id: 'seedream-4',
    label: 'Seedream 4.0',
    note: 'Đời cũ. Bám công thức 6 phần, prompt ngắn 60–100 từ. Chọn nếu Coco của bạn còn chạy 4.0.',
    skill: 'models/seedream-4.md',
    status: 'legacy',
    max_refs: 10
  }
]

export const VIDEO_MODELS: VideoModelInfo[] = [
  {
    id: 'seedance-2.0',
    label: 'Seedance 2.0',
    note: 'Bản đang chạy được. Tối đa 12 file tham chiếu (9 ảnh · 3 video · 3 audio), 4–15s/lần. Prompt bám công thức Subject → Action → Environment → Camera → Style → Constraints.',
    skill: 'models/seedance-2.0.md',
    status: 'current',
    max_duration_sec: 15,
    max_refs: 12
  },
  {
    id: 'seedance-2.5',
    label: 'Seedance 2.5 (sắp có)',
    note: 'Tới 50 file tham chiếu, 30s liền mạch, sửa theo VÙNG, khóa nhân vật/sản phẩm/style xuyên cú quay. Chọn TRƯỚC nếu Coco của bạn đã mở 2.5 — prompt sẽ viết khác (nhiều tham chiếu, ít chữ hơn).',
    skill: 'models/seedance-2.5.md',
    status: 'upcoming',
    max_duration_sec: 30,
    max_refs: 50
  },
  {
    id: 'seedance-1.5',
    label: 'Seedance 1.5 Pro',
    note: 'Đời cũ, chỉ ảnh khung đầu, 5/10s. Chọn nếu tài khoản còn kẹt bản này.',
    skill: 'models/seedance-1.5.md',
    status: 'legacy',
    max_duration_sec: 10,
    max_refs: 1
  }
]

/** Tra hồ sơ model ảnh; id lạ/thiếu → rơi về mặc định (KHÔNG ném lỗi, dự án cũ vẫn chạy). */
export function imageModel(id?: string | null): ImageModelInfo {
  return (
    IMAGE_MODELS.find((m) => m.id === id) ??
    (IMAGE_MODELS.find((m) => m.id === DEFAULT_IMAGE_MODEL) as ImageModelInfo)
  )
}

/** Tra hồ sơ model video; id lạ/thiếu → rơi về mặc định. */
export function videoModel(id?: string | null): VideoModelInfo {
  return (
    VIDEO_MODELS.find((m) => m.id === id) ??
    (VIDEO_MODELS.find((m) => m.id === DEFAULT_VIDEO_MODEL) as VideoModelInfo)
  )
}
