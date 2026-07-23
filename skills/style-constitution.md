# LỚP A · HIẾN PHÁP STYLE (chất liệu render — L1 cứng)

> Mảnh này được nạp cho MỌI thợ sinh prompt (ảnh + video). Nó định nghĩa **chất liệu render** của TOÀN dự án. Học cơ chế L1/L2/L3 từ `prefix.md` của Toonflow, nhưng tách bạch tuyệt đối: STYLE **chỉ là chất liệu**, KHÔNG phải thời đại/bối cảnh.

## Nguyên tắc tối cao (đọc kỹ — đây là linh hồn app)

**STYLE = chất liệu vẽ/quay, KHÔNG bao giờ quyết định trang phục, thời đại, hay nơi chốn.**

- ✅ STYLE nói: 2D anime Nhật · 2D quốc phong Trung (donghua) · 3D anime render · 3D clay · người thật điện ảnh (photoreal)... + bảng màu + chất liệu ánh sáng + độ nét.
- ❌ STYLE TUYỆT ĐỐI KHÔNG chứa: "cổ đại", "hiện đại", "cung đình", "áo giáp", "váy jean", "tương lai"... — đó là BỐI CẢNH (lớp B), do ideaAnalyst suy từ ideal theo TỪNG cảnh.

> Lý do: một dự án style "2D Nhật" vẫn phải làm được ideal xuyên không (cảnh 1 hiện đại, cảnh 2 cổ đại). Nếu nhét thời đại vào style → mọi cảnh bị kéo về một thời đại → **lỗi xuyên không**. Đây là lỗi ta chống.

## Cơ chế 3 tầng ràng buộc màu (mượn L1/L2/L3 Toonflow)

| Tầng | Ràng buộc | Nội dung |
|---|---|---|
| **L1 cứng** | Khóa chặt, lặp mọi block | Chất liệu render + bảng màu lõi của style (da/tóc nhân vật nếu style quy định) + độ nét |
| **L2 mềm** | Ưu tiên tham khảo, cảnh được điều chỉnh | Màu bối cảnh/phụ kiện — do lớp B (scene_context) dẫn dắt theo từng cảnh |
| **L3 ngoại lệ** | Được phá cục bộ | Cao trào/hồi tưởng/hiệu ứng đặc biệt |

## Quy tắc ghép prompt (thợ ảnh & video phải theo)

Prompt cuối = **[A: chất liệu style này] + [C: @tag identity] + [B: bối cảnh cảnh] + nội dung block**.

- Đoạn STYLE trong prompt phải **NGẮN NHẤT** trong 3 đoạn (Hình dài nhất — Phong cách ngắn nhất). Nếu từ phong cách dài hơn mô tả hình → sản phẩm hỏng (luật Toonflow).
- STYLE giữ nguyên xuyên suốt dự án, chỉ đổi khi người dùng đổi `style_id`.
- Ngôn ngữ: từ khóa style viết bằng **tiếng Anh** (target BytePlus/Seedance đọc tốt tiếng Anh + tiếng Trung; app xuất tiếng Anh cho thống nhất).

## Placeholder được điền lúc chạy

Pipeline nạp `style_id` của dự án và thay khối `{{STYLE_ANCHOR}}` bằng từ neo phong cách của style đó (lấy từ `skills/styles/<style_id>/anchor.md`). Nếu chưa có style → dùng mặc định photoreal điện ảnh trung tính.
