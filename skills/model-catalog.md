# LỚP · Ràng buộc THAM SỐ theo model (model-catalog) — target BytePlus/Seedance

> Mỏ #9 — chắt từ **TopView** `list-models` + công bố ByteDance/BytePlus (aspect/resolution/duration/tham chiếu hợp lệ theo model).
> Coco Studio chỉ chạy **BytePlus/Seedance** → app CHỈ validate dòng Seedance. Nạp kèm **vidPrompter** để trường tham số không vô nghĩa khi mang sang Coco.
> Dòng CHỦ LỰC hiện tại = **Seedance 2.0** (đang chạy được); **2.5** sắp tới; 1.0/1.5 chỉ để tương thích ngược.

---

## ⭐ FILE NÀY CHỈ LÀ BẢNG THAM SỐ — LUẬT VIẾT PROMPT NẰM Ở HỒ SƠ TỪNG MODEL

Người dùng chọn model ở **GATE Tham số**; app tự nạp đúng hồ sơ vào system của thợ:

| Chọn ở GATE Tham số | Hồ sơ luật prompt app nạp | Nạp cho cổng |
|---|---|---|
| Seedream 5.0 *(mặc định ảnh)* | `models/seedream-5.md` | GATE Nguyên liệu · GATE 2 |
| Seedream 4.0 *(đời cũ)* | `models/seedream-4.md` | GATE Nguyên liệu · GATE 2 |
| Seedance 2.0 *(mặc định video)* | `models/seedance-2.0.md` | GATE 3 |
| Seedance 2.5 *(sắp có)* | `models/seedance-2.5.md` | GATE 3 |
| Seedance 1.5 Pro *(đời cũ)* | `models/seedance-1.5.md` | GATE 3 |

Hồ sơ model được nối **CUỐI** system prompt → nó **ĐÈ** luật chung khi hai bên chỏi nhau.
Thêm model mới = thêm 1 dòng ở `src/shared/models.ts` + 1 file `.md` trong `skills/models/`.
**KHÔNG sửa code logic.**

---

## Dòng model hợp lệ (Coco = BytePlus/Seedance)

| Model | Resolution | Duration/1 lần | Tham chiếu | Tỉ lệ | Native audio |
|---|---|---|---|---|---|
| **Seedance 2.5** | *(hãng chưa công bố trần riêng)* | **30 s liền mạch** | **tới 50 input** (ảnh/video/audio) | mọi tỉ lệ phổ biến | có, **đồng bộ** |
| **Seedance 2.0** ⭐ | 480 / 720 / 1080 (2K) | 4–15 s | 9 ảnh · 3 video · 3 audio (≤12 file) | mọi tỉ lệ phổ biến | có |
| Seedance 1.5 Pro *(cũ)* | 720 / 1080 | 5 / 10 s | **chỉ** ảnh khung đầu | 16:9 · 9:16 · 1:1 · 4:3 | có |
| Seedance 1.0 Pro *(cũ)* | 480 / 720 / 1080 | 5 / 10 s | **chỉ** ảnh khung đầu | 16:9 · 9:16 | có |

> ⚠️ Bản cũ của bảng này ghi 2.5 là "tới 4K" — **không có nguồn**. Mốc 4K/10-bit gắn với **2.0**;
> với 2.5 ByteDance chưa công bố trần độ phân giải riêng. Đừng hứa 4K native với người dùng.
>
> Seedance 2.5: công bố 23/6/2026, GA đầu 7/2026, lên BytePlus ModelArk API 7/2026 (ByteDance bỏ qua 2.1–2.4). Thêm: region-level editing (sửa 1 vùng khung), director-grade camera control, khóa nhân vật/sản phẩm/style xuyên cú quay bằng bộ tham chiếu @.
> Nếu Coco/BytePlus cập nhật model, sửa BẢNG NÀY — không sửa code.

## LUẬT validate (vidPrompter tự kiểm trước khi ghi)
- ⭐ **Duration mỗi block ≤8s — CHÍNH SÁCH APP, KHÔNG PHẢI TRẦN ENGINE.** Trần engine rộng hơn
  (15s ở 2.0, 30s ở 2.5) nhưng app vẫn cắt ≤8s ở mọi model: block ngắn thì hỏng một nhịp chỉ
  phải render lại 8s, và Seedance hay vỡ chuyển động ở khoảng 5–8s. Validator chặn cứng ở 8.
- **Tham chiếu**: mỗi @tag = 1 ảnh tư liệu (khớp cap ảnh của model). 2.5 nhận tới 50 → thoải mái;
  2.0 ≤9 ảnh → **>9 @tag trong một cảnh là VƯỢT TRẦN, phải gộp bớt hoặc tách block**; 1.5 chỉ có
  ảnh khung đầu → @tag KHÔNG kéo được ảnh riêng, phải **nối khung** (byteplus-spec 8bis-A).
- **Prompt ≤ 3000 ký tự** (cap engine) — nhưng cap ≠ đích: hướng dẫn chính thức nhắm **60–100 từ**, quá **150 từ** là loãng (byteplus-spec mục 1).
- **Tỉ lệ khung** = `params.aspect_ratio` của dự án (9:16 cho TikTok/Reels mặc định). Không tự đổi.
- **Resolution** ưu tiên 1080. Hạ 720 nếu model không hỗ trợ. Không hứa 4K ở 2.5.
- **Native audio**: chỉ ghi âm môi trường + âm hiệu khi model hỗ trợ; KHÔNG bao giờ thêm nhạc nền (BGM).
- ❌ KHÔNG nhắm Kling / Veo / GPT-Image / Gemini — Coco không chạy. Nếu ideal đòi hiệu ứng chỉ model khác có → ghi chú cho Sếp, hạ về khả năng Seedance.

## Kênh → tỉ lệ (gợi ý)
TikTok/Reels → 9:16 · YouTube → 16:9 · Instagram feed → 1:1 hoặc 4:5.
