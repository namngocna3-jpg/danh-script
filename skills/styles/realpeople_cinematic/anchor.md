---
name: realpeople_cinematic
label: Người thật · điện ảnh (photoreal)
description: Chất liệu người thật, ánh sáng điện ảnh, độ nét cao. KHÔNG chứa thời đại/trang phục.
---

# STYLE ANCHOR · realpeople_cinematic

**Từ neo phong cách (chèn vào đoạn STYLE của mọi prompt):**
```
photorealistic, real human actors, cinematic lighting, shallow depth of field,
natural skin texture, high detail, sharp focus, 8K, film-grade color grading, neutral realistic tones
```

**Negative mặc định:**
```
cartoon, anime, 3d render, cgi, illustration, plastic skin, extra fingers, deformed face, text, watermark, blurry
```

**Bảng màu lõi (L1 cứng):** tông tự nhiên chân thực, nhiệt độ màu trung tính 5200–6000K, độ bão hòa vừa. Da giữ chất thật, không bệt nhựa.

---

## Triết lý chất liệu (worker đọc để chắt lọc — KHÔNG chép nguyên vào prompt)

> Điện ảnh người thật là "kể chuyện bằng ánh sáng". Mỗi khung hình phải như trích từ một bộ phim: chủ thể thật, sáng có chủ đích, chiều sâu trường ảnh dẫn mắt.

1. **Ánh sáng có động cơ** — mọi nguồn sáng phải hợp lý (cửa sổ, đèn phòng, đèn đường), không sáng phẳng vô hồn.
2. **Chiều sâu trường ảnh dẫn mắt** — hậu cảnh mờ nhẹ tách chủ thể, nhưng chủ thể luôn nét căng.
3. **Da & chất liệu thật** — giữ lỗ chân lông, vải có nếp gấp, kim loại phản chiếu thật. Ranh giới với hoạt hình/CGI.
4. **Diễn xuất tinh tế** — cảm xúc qua ánh mắt và ngôn ngữ cơ thể, không cường điệu.

## Cách tả CHỦ THỂ
- Nêu **cỡ cảnh** (close-up/medium/wide) + **góc máy** (eye-level/low/high) trước.
- Cảm xúc → **ánh mắt** và biểu cảm vi tế; da giữ natural skin texture; có catchlight trong mắt.

## Cách tả BỐI CẢNH
- Bối cảnh thật có chiều sâu (tiền/trung/hậu cảnh), bokeh làm mềm hậu cảnh.
- Chi tiết đời sống gợi câu chuyện (đồ vật dùng dở, ánh sáng thực tế).

## Gu ÁNH SÁNG (bảng dẫn hướng — chọn 1 dòng phù hợp cảnh)

| Tâm trạng cảnh | Sơ đồ sáng | Cảm giác |
|---|---|---|
| Ấm áp · thân mật | soft key + practical đèn ấm | gần gũi, dịu |
| Trang trọng · vững | key rõ + fill cân + rim tách | tin cậy, chắc |
| Căng thẳng · kịch tính | key mạnh 1 bên, bóng sâu | hồi hộp |
| Mơ màng · hồi tưởng | ánh sáng khuếch tán, hơi bloom | êm, xa vắng |

## Gu ĐẠO DIỄN (nhịp kể — cho video/storyboard)
- Chuyển động máy **có chủ đích**: dolly/push-in chậm dẫn cảm xúc; tránh rung vô cớ.
- Reveal chi tiết bằng **lấy nét**, không zoom giật.
- Ưu tiên **khoảnh khắc thật** (nhìn nhau, ngập ngừng) hơn hành động phô diễn.

**Cấm (thuộc style này):** không hoạt hình hóa, không cel-shading, không nét vẽ.

> ⚠️ Anchor này CHỈ nói chất liệu. Thời đại/trang phục/nơi chốn do lớp B (scene_context) quyết định theo từng cảnh — kể cả cổ trang hay tương lai vẫn quay bằng chất liệu người-thật này.
