---
name: 3d_anime_render
label: 3D anime render (cel-look chữa lành)
description: Chất liệu 3D dựng theo lối anime cel, đường viền rõ, ánh sáng ấm mềm. KHÔNG chứa thời đại/trang phục.
---

# STYLE ANCHOR · 3d_anime_render

**Từ neo phong cách (chèn vào đoạn STYLE của mọi prompt):**
```
3D animation rendering with anime cel-look, clear outline lines, high-detail materials,
soft warm cinematic lighting, stylized shading, clean healing atmosphere, high detail
```

**Negative mặc định:**
```
photorealistic, 2d flat drawing, hand-drawn lineart only, western cartoon, plastic skin,
extra fingers, deformed face, text, watermark, blurry
```

**Bảng màu lõi (L1 cứng — neo thẩm mỹ):** cam ấm #F5A673, hồng anh đào #F4D5D5, xanh trời #87AEC9, nâu tóc #4A3728, xám #8A8A8A, tím mờ #D0C4D6, hổ phách #C9A96E, xanh bạc hà #9DC2A5.

---

## Triết lý chất liệu (worker đọc để chắt lọc — KHÔNG chép nguyên vào prompt)

> 3D anime = khối 3D thật nhưng tô bóng kiểu cel, viền rõ. Có chiều sâu và ánh sáng điện ảnh của 3D, nhưng giữ cái "trong trẻo, chữa lành" của anime.

1. **Cel-shading trên khối 3D** — bóng chia mảng rõ (không gradient mượt như photoreal), viền ngoài sạch.
2. **Ánh sáng ấm mềm điện ảnh** — key ấm + bounce dịu, không khí trong lành, hơi bloom.
3. **Vật liệu stylized** — tóc thành mảng bóng, vải mượt, mắt to có highlight lớn.
4. **Không khí chữa lành** — tông ấm, sạch, bình yên (kiểu Makoto Shinkai/Kyoto Animation dựng 3D).

## Cách tả CHỦ THỂ
- Nhân vật anime khối 3D: mắt to biểu cảm, tóc mảng bóng, cel-shade da mịn; cảm xúc rõ qua mắt.

## Cách tả BỐI CẢNH
- Cảnh trong lành sâu (bầu trời, mây, ánh nắng qua lá); ánh sáng thể tích nhẹ, bokeh mềm.

## Gu ÁNH SÁNG & MÀU (bảng dẫn hướng)

| Tâm trạng | Ánh sáng & màu | Cảm giác |
|---|---|---|
| Chữa lành trong trẻo | nắng ấm, xanh trời + hồng anh đào | bình yên, ấm |
| Hoài niệm học đường | chiều vàng, bloom nhẹ | êm, tiếc nhớ |
| Mộng mơ kỳ ảo | tím-xanh mờ, hạt sáng | huyền ảo |
| Vui tươi ngày thường | màu tươi vừa, tương phản dịu | trẻ trung |

## Gu ĐẠO DIỄN (nhịp kể)
- Chuyển động **mượt điện ảnh 3D**: pan cảnh rộng đẹp, push-in vào cảm xúc.
- Xen **khung cảnh đẹp "đóng khung"** (bầu trời, thành phố) như dấu lặng cảm xúc.

**Cấm (thuộc style này):** không photoreal người thật, không vẽ tay 2D thuần.

> ⚠️ Anchor này CHỈ nói chất liệu (3D cel-look). Thời đại/trang phục/nơi chốn do lớp B (scene_context) quyết định theo từng cảnh.
