---
name: fashion_editorial
label: Thời trang · bìa tạp chí (editorial, cao cấp)
description: Chất liệu ảnh thời trang biên tập cao cấp — người mẫu thật, tạo dáng, ánh sáng tạo khối, chất vải rõ, tông high-fashion. KHÔNG chứa thời đại/trang phục.
---

# STYLE ANCHOR · fashion_editorial

**Từ neo phong cách (chèn vào đoạn STYLE của mọi prompt):**
```
photorealistic high-fashion editorial photography, real professional model, striking pose,
sculpted directional lighting, visible fabric weave and drape, refined skin retouch that keeps real texture,
magazine-cover composition, shallow depth of field, high detail, sharp focus, 8K, elegant color grading
```

**Negative mặc định:**
```
cartoon, anime, 3d render, cgi, illustration, plastic over-smoothed skin, snapshot casual look,
extra fingers, deformed face, cluttered background, text, watermark, blurry, low quality
```

**Bảng màu lõi (L1 cứng):** tông high-fashion tiết chế — nền đơn sắc/gradient sạch, phối màu tối giản 2–3 màu, tương phản khối rõ, ánh sáng tạo hình (Rembrandt/split/rim). Da giữ chất thật sau khi tút nhẹ.

**Bảng màu cảm xúc (học từ Toonflow — mềm, chỉ dẫn hướng AI):**

| Concept editorial | Màu chính | Màu phụ | Gợi ý sáng & tương phản |
|---|---|---|---|
| Tối giản thanh lịch (minimal chic) | trắng ngà | be · xám khói | sáng mềm đều, bóng nhạt, tương phản thấp-vừa |
| Quyền lực · mạnh mẽ (power) | đen | đỏ rượu · vàng đồng | split/rim gắt, nền tối, tương phản cao |
| Mộng mơ · lãng mạn (dreamy) | hồng phấn | tím lavender · kem | ánh sáng khuếch tán, sương nhẹ, độ bão hòa thấp |
| Táo bạo · sắc màu (bold) | màu khối bão hòa cao | màu bù tương phản | đèn màu gel, nền đơn sắc, tương phản mạnh |
| Cổ điển · sang (timeless) | nâu camel | trắng kem · xanh navy | ánh sáng cửa sổ tạo khối, tông ấm cổ điển |

---

## Triết lý chất liệu (worker đọc để chắt lọc — KHÔNG chép nguyên vào prompt)

> Editorial là "biến quần áo thành thái độ". Người mẫu, ánh sáng, pose đều phục vụ concept — mỗi khung là một bìa tạp chí, kiêu và có chủ kiến.

1. **Pose là ngôn ngữ** — dáng có chủ đích, đường nét cơ thể tạo hình học; không đứng chụp thường.
2. **Ánh sáng tạc khối** — directional light (Rembrandt/split/rim) làm nổi phom dáng & chất vải, đổ bóng có chủ ý.
3. **Chất vải kể chuyện** — nhìn thấy sợi dệt, độ rủ, nếp gấp, độ bóng/nhám của chất liệu.
4. **Tiết chế & sang** — bố cục sạch, ít màu, khoảng trống có chủ đích; da tút nhẹ nhưng giữ thật.

## Cách tả CHỦ THỂ (người mẫu)
- Nêu **pose & thần thái** cụ thể (kiêu hãnh, lạnh, quyền lực…) + đường nét cơ thể/tay/cằm.
- Da mịn nhưng **giữ texture thật**; ánh mắt có chủ kiến, hướng máy hoặc lệch nghệ thuật.

## Cách tả TRANG PHỤC & CHẤT VẢI
- Tả **chất liệu** (lụa/da/tweed/voan) + cách nó bắt sáng và rủ trên cơ thể; đường may, phom dáng rõ.

## Cách tả BỐI CẢNH
- Nền **đơn sắc/gradient sạch** hoặc set tối giản có concept; bối cảnh không lấn người mẫu.

## Gu ĐẠO DIỄN (nhịp kể — cho video/storyboard)
- Chuyển động **chậm, kiêu**: máy trượt quanh dáng, hero pose giữ lâu, để vải bay/rủ theo chuyển động.
- Cắt theo **nhịp mạnh** (như bắt theo beat), mỗi cú một pose/góc dứt khoát.

**Cấm (thuộc style này):** không hoạt hình hóa, không CGI, không ảnh chụp đời thường ngẫu hứng, không da bệt nhựa mất chất vải.

> ⚠️ Anchor này CHỈ nói chất liệu (ảnh thời trang biên tập người thật). Thời đại/trang phục/nơi chốn do lớp B (scene_context) quyết định — kể cả cổ trang hay tương lai vẫn quay bằng chất liệu editorial này. Bảng màu cảm xúc là gợi ý mềm.
