---
name: 3d_product_render
label: Render sản phẩm 3D (CGI sạch, C4D/Octane)
description: Chất liệu CGI render sản phẩm sạch — bề mặt vật liệu PBR chính xác, ánh sáng studio HDRI, phản chiếu mượt, nền tối giản. KHÔNG có người thật, KHÔNG chứa thời đại/trang phục.
---

# STYLE ANCHOR · 3d_product_render

**Từ neo phong cách (chèn vào đoạn STYLE của mọi prompt):**
```
clean 3d product render, physically based materials, accurate glass metal plastic and liquid surfaces,
soft HDRI studio lighting, glossy reflections and soft shadows, subtle depth of field,
minimalist backdrop, octane cinema4d quality, hyper detailed, sharp focus, 8K
```

**Negative mặc định:**
```
photorealistic human, real actors, cartoon, anime, hand-drawn illustration, low-poly, plastic toy look,
noisy render, harsh shadows, cluttered background, deformed geometry, text, watermark, blurry
```

**Bảng màu lõi (L1 cứng):** tông studio sạch — nền gradient trung tính hoặc pastel đơn sắc, vật liệu phản chiếu chuẩn PBR, điểm nhấn màu thương hiệu, ánh sáng HDRI mềm trung tính. Ưu tiên "sạch – cao cấp – công nghệ".

**Bảng màu cảm xúc (học từ Toonflow — mềm, chỉ dẫn hướng AI):**

| Concept render | Màu chính | Màu phụ | Gợi ý sáng & bề mặt |
|---|---|---|---|
| Công nghệ · tối giản (tech) | trắng/xám nhạt | xanh dương · bạc | HDRI mềm đều, phản chiếu kim loại-kính sạch |
| Cao cấp · sang (luxury) | đen/than chì | vàng đồng · vàng gold | nền tối, spotlight, phản chiếu bóng, tương phản mạnh |
| Tươi mát · giải khát (fresh) | xanh lá · xanh nước | trắng · vàng chanh | giọt nước/hơi lạnh, đọng sương, ánh sáng ban ngày |
| Ấm · mỹ phẩm (beauty) | hồng nude | be kem · vàng champagne | ánh sáng khuếch tán mềm, bề mặt satin mờ |
| Năng lượng · thể thao (energy) | cam/đỏ bão hòa | đen · bạc | ánh sáng gắt tương phản cao, bề mặt nhám thể thao |

**Cấm (thuộc style này):** không người thật, không hoạt hình vẽ tay, không low-poly game, không nhiễu render, không nền bừa bộn.

> ⚠️ Anchor này CHỈ nói chất liệu (CGI render sản phẩm sạch). Bối cảnh/nơi đặt sản phẩm do lớp B (scene_context) quyết định theo từng cảnh. Bảng màu cảm xúc là gợi ý mềm — chọn 1 concept phù hợp brief.
