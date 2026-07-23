# LỚP · visual-system (Color Script + ánh sáng + chất liệu) ⭐

> **Hệ thống thị giác toàn phim** — đồng bộ TÔNG xuyên mọi cảnh (Toonflow Bước 1.4 Visual Dev). Nạp cho **assetDeriver (gate_assets)** để ghi qua `write_visual_system`.
>
> Đây là "bản nhạc màu" của phim: quyết định mỗi cảnh mang màu gì, ánh sáng ra sao, chất liệu chủ đạo — để ảnh nguyên liệu (nhất là `scene`) sinh ra ăn khớp cảm xúc kịch bản, không lệch tông.

---

## 1. Color Script (bắt buộc) — tone màu THEO CẢNH

Mỗi cảnh/nhịp 1 mốc màu, gắn với cảm xúc của cảnh đó (đọc quy hoạch đạo diễn: cảnh nào cao trào, cảnh nào trầm). Mỗi mốc gồm:
- **scene_order** — cảnh áp dụng.
- **palette** — màu chủ đạo cụ thể (VD "cam hoàng hôn ấm + bóng tím lạnh", "xanh dương trầm + trắng lạnh bệnh viện").
- **emotion** — cảm xúc gắn với màu (ấm áp / cô đơn / căng thẳng / vỡ oà).
- **contrast** — tương phản cao/thấp (cao = kịch tính; thấp = êm, mơ).
- **saturation** — độ bão hòa rực/trầm (rực = tươi vui/quảng cáo; trầm = hoài niệm/nghiêm).

**Đường màu nên có ARC:** màu đi cùng đường cong cảm xúc (VD mở ấm trung tính → giữa lạnh dần khi xung đột → cao trào tương phản mạnh → kết ấm trở lại). Đừng để mọi cảnh cùng 1 palette phẳng.

## 2. Lighting (ánh sáng tổng)
Mô tả nguồn sáng chủ đạo + độ tương phản của phim: key light hướng nào, ánh sáng cứng/mềm, high-key (sáng đều, tươi) hay low-key (tối, nhiều bóng, kịch tính). Đây là kim chỉ nam cho ảnh `scene`.

## 3. Texture & Material (chất liệu)
Bề mặt/chất liệu chủ đạo mang cảm giác phim: da người, vải thô/mịn, kim loại, gỗ, đá, kính... Chọn 2–3 chất liệu định danh để giữ "chất" nhất quán.

## 4. palette_note
1–2 câu tổng: bảng màu tổng + emotional palette (màu ↔ cảm xúc cả phim). Là lời tựa để mọi thợ hình bám.

---

## Luật
- **Color Script bám cảm xúc kịch bản** (đọc director plan) — không tô màu tùy hứng.
- Màu/ánh sáng ở đây là để **ảnh scene mang** — nhắc lại luật asset-prompt-craft: nhân vật/đạo cụ gốc chụp nền trung tính, KHÔNG nhét màu vào; màu chỉ vào cảnh khi ghép.
- Bám STYLE toàn dự án (chất liệu render L1) — Visual System tinh chỉnh TÔNG bên trong style, không phá style.
