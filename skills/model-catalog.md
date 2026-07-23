# LỚP · Ràng buộc THAM SỐ theo model (model-catalog) — target BytePlus/Seedance

> Mỏ #9 — chắt từ **TopView** `list-models` + công bố ByteDance/BytePlus (aspect/resolution/duration/tham chiếu hợp lệ theo model).
> Coco Studio chỉ chạy **BytePlus/Seedance** → app CHỈ validate dòng Seedance. Nạp kèm **vidPrompter** để trường tham số không vô nghĩa khi mang sang Coco.
> Dòng CHỦ LỰC hiện tại = **Seedance 2.0 / 2.5** (1.0/1.5 đã lỗi thời — chỉ để tương thích ngược).

## Dòng model hợp lệ (Coco = BytePlus/Seedance)

| Model | Resolution | Duration/1 lần | Tham chiếu | Tỉ lệ | Native audio |
|---|---|---|---|---|---|
| **Seedance 2.5** ⭐ | tới **4K** | **30 s liền mạch** | **tới 50 input** (ảnh/video/audio) | mọi tỉ lệ phổ biến | có, **đồng bộ** |
| **Seedance 2.0** | 480 / 720 / 1080 (2K) | 4–15 s | 9 ảnh · 3 video · 3 audio (≤12 file) | mọi tỉ lệ phổ biến | có |
| Seedance 1.5 Pro *(cũ)* | 720 / 1080 | 5 / 10 s | ảnh khung đầu | 16:9 · 9:16 · 1:1 · 4:3 | có |
| Seedance 1.0 Pro *(cũ)* | 480 / 720 / 1080 | 5 / 10 s | ảnh khung đầu | 16:9 · 9:16 | có |

> Seedance 2.5: công bố 23/6/2026, GA đầu 7/2026, lên BytePlus ModelArk API 7/2026 (ByteDance bỏ qua 2.1–2.4). Thêm: region-level editing (sửa 1 vùng khung), director-grade camera control, khóa nhân vật/sản phẩm/style xuyên cú quay bằng bộ tham chiếu @.
> Nếu Coco/BytePlus cập nhật model, sửa BẢNG NÀY — không sửa code.

## LUẬT validate (vidPrompter tự kiểm trước khi ghi)
- **Duration mỗi block ≤ giới hạn model** (≤10s cho 1.x, ≤15s cho 2.0, ≤30s cho 2.5). App vẫn cắt block ≤15s ở GATE 1 cho an toàn mọi model — chỉ nới nếu người dùng xác nhận chạy 2.5.
- **Tham chiếu**: mỗi @tag = 1 ảnh tư liệu (khớp cap ảnh của model). 2.5 nhận tới 50 → thoải mái; 2.0 ≤9 ảnh → nếu > 9 @tag/cảnh phải gộp bớt.
- **Prompt ≤ 3000 ký tự** (cap engine); thực dụng ≤250 từ.
- **Tỉ lệ khung** = `params.aspect_ratio` của dự án (9:16 cho TikTok/Reels mặc định). Không tự đổi.
- **Resolution** ưu tiên 1080; 2.5 mở tới 4K nếu người dùng chọn. Hạ 720 nếu model không hỗ trợ.
- **Native audio**: chỉ ghi âm môi trường + âm hiệu khi model hỗ trợ; KHÔNG bao giờ thêm nhạc nền (BGM).
- ❌ KHÔNG nhắm Kling / Veo / GPT-Image / Gemini — Coco không chạy. Nếu ideal đòi hiệu ứng chỉ model khác có → ghi chú cho Sếp, hạ về khả năng Seedance.

## Kênh → tỉ lệ (gợi ý)
TikTok/Reels → 9:16 · YouTube → 16:9 · Instagram feed → 1:1 hoặc 4:5.
