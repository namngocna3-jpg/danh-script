---
name: Craft TÁCH NGUYÊN LIỆU + prompt asset
description: Cách tách nhân vật/bối cảnh/đạo cụ lặp lại từ kịch bản + sinh prompt tạo ảnh gốc (character sheet, multi-angle, lưới). Dùng ở bước Nguyên liệu.
axis: common
steps: [gate_assets]
---

# CRAFT COMMON · TÁCH NGUYÊN LIỆU + prompt asset gốc

> Rút ở bước **Nguyên liệu** (gate_assets). Tách asset TỪ kịch bản (không bịa) rồi sinh PROMPT tạo ảnh gốc để người dùng copy sang tool tạo ảnh.

## 1. Tách asset = tìm thứ LẶP LẠI xuyên cảnh
- Chỉ tách thứ xuất hiện ≥2 lần hoặc là mỏ neo nhận diện: **nhân vật** chính/phụ, **bối cảnh** tái dùng, **đạo cụ** then chốt (motif).
- KHÔNG bịa thứ kịch bản không có. "Thà thiếu hơn thừa" — mỗi asset gốc chỉ 1–5 biến thể.

## 2. Prompt asset gốc theo LOẠI
- **Nhân vật = character sheet 4-view:** nền #F8F4E8, mặt mộc (không trang điểm cảnh), khai báo TỈ LỆ đầu-thân (VD 1:7), 4 góc (trước/nghiêng/sau/¾). Đây là "chứng minh thư" để mọi cảnh đồng nhất.
- **Bối cảnh = multi-angle KHÔNG người:** 2–3 góc cùng không gian, ánh sáng trung tính, để cảnh sau đặt nhân vật vào.
- **Đạo cụ = lưới 2×2:** vật trên nền sạch, vài góc, rõ chất liệu. Đạo cụ KHÔNG phái sinh biến thể.

## 3. Biến thể (derivative) — chỉ khi cảnh CẦN
- Nhân vật: biến thể trang phục/trạng thái (ướt, thương, tuổi khác).
- Bối cảnh: thời gian/thời tiết/góc (ngày↔đêm, mưa, trên cao).
- Mỗi asset 1–5 biến thể tối đa. Dư biến thể = loạn nhận diện + tốn công.

## 4. @tag = khóa nhận diện
- Mỗi asset 1 @tag. Prompt cảnh sau NHÚNG @tag + "identical … across the take" để giữ đồng nhất.
- Đặt tag gợi nhớ (@Mai, @QuánCafe, @ĐồngHồCũ), không trùng.

## Cạm bẫy
- ❌ Bịa asset kịch bản không nhắc → sai "tách từ kịch bản".
- ❌ Nhân vật thiếu tỉ lệ đầu-thân/nền chuẩn → ảnh gốc lệch, cảnh sau sai dáng.
- ❌ Character sheet để mặt trang điểm/ánh sáng cảnh → mất tính "mộc" tham chiếu.
- ❌ Nhồi biến thể "cho chắc" → trái nguyên tắc "thà thiếu hơn thừa".
