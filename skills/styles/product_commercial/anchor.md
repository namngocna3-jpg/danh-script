---
name: product_commercial
label: Quảng cáo sản phẩm · người thật (macro, beauty light)
description: Chất liệu TVC/quảng cáo người thật + sản phẩm — ánh sáng studio kiểm soát, macro chi tiết bề mặt, tông sạch cao cấp. KHÔNG chứa thời đại/trang phục.
---

# STYLE ANCHOR · product_commercial

**Từ neo phong cách (chèn vào đoạn STYLE của mọi prompt):**
```
photorealistic commercial photography, real human actors with flawless natural skin,
controlled studio lighting with soft key and subtle rim, macro product detail, crisp reflections and gloss,
clean premium look, shallow depth of field, high detail, sharp focus, 8K, polished color grading
```

**Negative mặc định:**
```
cartoon, anime, 3d render, cgi, illustration, plastic skin, harsh shadows, cluttered background,
extra fingers, deformed face, text overlay, watermark, blurry, low quality
```

**Bảng màu lõi (L1 cứng):** tông sạch cao cấp — nền trung tính/pastel, điểm nhấn màu thương hiệu bão hòa vừa-cao, tương phản mềm, ánh sáng ấm trung tính 5200–5600K. Da giữ chất thật, sản phẩm phản chiếu sắc nét.

---

## Triết lý chất liệu (worker đọc để chắt lọc — KHÔNG chép nguyên vào prompt)

> Quảng cáo sản phẩm không phải "chụp một món đồ", mà là "làm cho người xem MUỐN chạm vào nó". Mỗi khung hình bán một cảm giác: sạch, đáng tin, đáng thèm.

1. **Sản phẩm là ngôi sao** — dù có người, ánh mắt/tay/ánh sáng đều dẫn về sản phẩm. Sản phẩm luôn nét căng, nhãn đọc được, bề mặt kể chất liệu (nhám/bóng/trong/kim loại).
2. **Ánh sáng có chủ đích, không phẳng** — key mềm tạo khối + rim/kick tách sản phẩm khỏi nền + phản chiếu kiểm soát. Không đổ bóng gắt cắt mất form.
3. **Sạch nhưng có sức sống** — nền tối giản để mắt không lạc, nhưng thêm 1–2 chi tiết gợi công dụng (giọt nước, hơi lạnh, khói cà phê, texture nguyên liệu) để "thèm".
4. **Người thật, tương tác thật** — nếu có người: da thật giữ lỗ chân lông, tay đẹp cầm/dùng sản phẩm tự nhiên (không gượng), cảm xúc → ánh mắt hướng về sản phẩm hoặc về người xem.

## Cách tả SẢN PHẨM (hero/prop)

- Nêu **chất liệu bề mặt** cụ thể: glossy glass / brushed metal / matte plastic / condensation on cold surface / soft satin packaging.
- **Cỡ cảnh anh hùng**: macro hoặc close-up làm sản phẩm chiếm khung, nhãn/logo rõ và không méo chữ.
- **Phản chiếu & highlight** kiểm soát: soft reflection on surface, controlled specular highlight — tránh loá cháy hoặc phản chiếu lộn xộn.
- Giữ **tỉ lệ & hình dáng thật** của sản phẩm (không bóp méo), đặt trên bề mặt sạch (acrylic/đá/gỗ mịn) với bóng đổ mềm.

## Cách tả CHỦ THỂ dùng sản phẩm (nếu có người)

- **Bàn tay là diễn viên phụ**: manicured natural hands, gentle grip, tương tác đúng công dụng (rót/thoa/mở nắp/nâng ly).
- **Ánh mắt & cảm xúc** dẫn cảm giác: hài lòng, tò mò, thèm khát — ánh mắt về sản phẩm hoặc thẳng ống kính (kết nối người xem).
- Da giữ **chất thật** (natural skin texture), tút nhẹ vừa đủ; tránh da bệt nhựa.

## Cách tả BỐI CẢNH

- Nền **tối giản, sạch**: seamless backdrop / soft gradient / bàn chất liệu cao cấp. Bối cảnh phục vụ sản phẩm, không lấn.
- Nếu cần bối cảnh đời thường (bếp, bàn làm việc, quầy) → giữ **gọn gàng có chủ đích**, bokeh làm mềm hậu cảnh để sản phẩm nổi.

## Gu ÁNH SÁNG theo loại sản phẩm (học từ Toonflow — bảng dẫn hướng, chọn 1 dòng phù hợp)

| Loại sản phẩm | Sơ đồ sáng | Bề mặt & mẹo | Cảm giác |
|---|---|---|---|
| Đồ uống · giải khát | key mềm bên + backlight xuyên chai | đọng sương, giọt nước, bọt khí, hơi lạnh | tươi mát, đã khát |
| Mỹ phẩm · skincare | beauty dish khuếch tán + rim mảnh | satin mờ, phản chiếu dịu, không loá | mềm mại, cao cấp |
| Đồ ăn · F&B | ánh sáng ngược nhẹ + fill ấm | hơi nóng bốc, độ ẩm bóng, texture nguyên liệu | ngon, thèm |
| Công nghệ · điện tử | rim kim loại + nền tối gradient | phản chiếu sạch, highlight kim loại-kính | tinh tế, đáng tin |
| Thời trang · phụ kiện | directional key tạo khối + kick nhẹ | chất vải/da rõ, đường may sắc | sang, tinh xảo |

## Bảng màu cảm xúc (mềm, chỉ dẫn hướng AI — không khóa cứng)

| Cảnh quảng cáo | Màu chính | Màu phụ | Gợi ý sáng & tương phản |
|---|---|---|---|
| Khơi khát khao (desire) | be kem ấm | vàng nắng nhẹ | key mềm + rim ấm ôm sản phẩm, bokeh dịu |
| Tin cậy · sạch sẽ (trust) | trắng/xám nhạt | xanh dương nhạt | sáng đều high-key, bóng nhẹ, ít tương phản |
| Sang trọng · cao cấp (premium) | đen/than chì | vàng đồng · bạc | tối nền + spotlight, phản chiếu bóng, tương phản mạnh |
| Tươi khỏe · tự nhiên (fresh) | xanh lá non | trắng · cam mật | ánh nắng ban ngày, giọt nước lấp lánh, độ bão hòa vừa |
| Ấm cúng · gần gũi (cozy) | nâu ấm | vàng mật · đỏ đất | đèn tungsten ấm, ánh sáng cửa sổ chiều, mềm |

## Gu ĐẠO DIỄN commercial (nhịp kể — cho video/storyboard)

- **Mở bằng hero shot**: sản phẩm nét căng, ánh sáng đẹp nhất trước, tạo ấn tượng "muốn có".
- **Chuyển động máy mượt, có chủ đích**: slow push-in / orbit quanh sản phẩm / macro reveal chi tiết — không rung cầm tay, không zoom giật.
- **Khoảnh khắc công dụng**: 1 nhịp cho thấy sản phẩm giải quyết nhu cầu (rót ra ly, thoa lên da, bật sáng) — bằng chứng "nó hoạt động".
- **Chốt bằng beauty shot**: khung cuối gọn, sản phẩm + chỗ trống cho logo/CTA (do lớp export chèn, prompt không tự viết chữ).

**Cấm (thuộc style này):** không hoạt hình hóa, không CGI, không nền bừa bộn, không đổ bóng gắt phá form sản phẩm.

> ⚠️ Anchor này CHỈ nói chất liệu (quảng cáo người thật + sản phẩm). Thời đại/trang phục/nơi chốn do lớp B (scene_context) quyết định theo từng cảnh. Các bảng ánh sáng/màu/gu đạo diễn là gợi ý MỀM — worker chọn dòng phù hợp brief, KHÔNG chép nguyên bảng vào prompt; prompt cuối chỉ dùng token chất liệu ở block ``` đầu.
