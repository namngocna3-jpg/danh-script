# LỚP · visual-system (Color Script + ánh sáng + chất liệu) ⭐⭐

> **Hệ thống thị giác toàn phim** — đồng bộ TÔNG xuyên mọi cảnh (Toonflow Bước 1.4 Visual Dev / `director_planning_style.md`). Nạp cho **assetDeriver (gate_assets)** để ghi qua `write_visual_system`.
>
> Đây là "bản nhạc màu" của phim: quyết định mỗi cảnh mang màu gì, ánh sáng ra sao, chất liệu chủ đạo — để ảnh nguyên liệu (nhất là `scene`) sinh ra ăn khớp cảm xúc kịch bản, không lệch tông. Nhân vật/đạo cụ gốc chụp nền trung tính; **Color Script là thứ cho ảnh `scene` mang màu, và là cách toàn phim "cùng một hơi thở".**

---

## 1. Color Script (BẮT BUỘC) — bảng màu THEO CẢNH, có ARC

Mỗi cảnh/nhịp = **1 mốc màu**, gắn với cảm xúc cảnh đó. Đọc quy hoạch đạo diễn (`read_plan`) để biết cảnh nào cao trào, cảnh nào trầm, rồi lập bảng — KHÔNG tô tùy hứng.

**Mỗi mốc gồm 6 cột:**
- **scene_order** — cảnh áp dụng.
- **name** — tên gọi mốc màu (để reviewer/người dùng gọi tên, VD "Bình minh hy vọng", "Xanh lạnh chia ly").
- **palette** — màu chủ đạo CỤ THỂ, 2–3 màu + vai trò (VD "cam hoàng hôn ấm *chủ* + tím lạnh *bóng* + trắng ngà *nền*"). Đừng ghi "màu ấm" chung chung.
- **emotion** — cảm xúc gắn với màu (ấm áp / cô đơn / căng thẳng / vỡ oà / hoài niệm).
- **contrast** — tương phản **cao/thấp** (cao = kịch tính, ranh giới sáng-tối gắt; thấp = êm, mơ, chuyển mượt).
- **saturation** — độ bão hòa **rực/trầm** (rực = tươi vui / quảng cáo / cao trào; trầm = hoài niệm / nghiêm / u sầu).

**⭐ ĐƯỜNG MÀU PHẢI CÓ ARC** — đi cùng đường cong cảm xúc, đừng phẳng. Công thức arc phổ biến cho clip ngắn:
`mở ấm trung tính → giữa lạnh dần khi xung đột → cao trào tương phản mạnh (rực + contrast cao) → kết ấm trở lại`.
Mỗi lần cảm xúc đổi hướng, MÀU phải đổi theo (palette / contrast / saturation). Nếu 2 cảnh liền kề cảm xúc khác nhau mà palette y hệt → arc phẳng, sửa.

**Bảng mẫu (điền theo phim thật):**

| scene | name | palette | emotion | contrast | saturation |
|---|---|---|---|---|---|
| 1 | Sáng ấm mở màn | vàng nắng *chủ* + nâu gỗ *nền* + trắng ngà | ấm áp, đời thường | thấp | trầm |
| 2 | Rạn nứt | xám xanh *chủ* + xanh dương lạnh *bóng* | bất an, xa cách | trung | trầm |
| 3 | Đỉnh xung đột | đỏ rực *chủ* + đen sâu *bóng* + trắng gắt | vỡ oà, căng | **cao** | **rực** |
| 4 | Hàn gắn | cam hoàng hôn *chủ* + hồng ấm + vàng đèn | dịu lại, hy vọng | thấp | vừa |

---

## 2. Lighting — HỆ ÁNH SÁNG nhiều phương án map cảm xúc

Không chỉ 1 mô tả tổng. Định **nhiều phương án ánh sáng ứng với nhiều cảm xúc**, để mỗi cảnh gọi đúng phương án. Mỗi phương án khai báo 3 trục:
- **Hướng key light** — front (phẳng, hiền) / side (khắc chiều sâu, kịch tính) / back-rim (tách nền, huyền ảo) / top (uy nghi hoặc đè nén) / bottom (dữ, bất an).
- **Cứng / mềm** — hard light (bóng gắt, cạnh sắc, căng thẳng) vs soft light (bóng mượt, dịu, lãng mạn).
- **High-key / low-key** — high-key (sáng đều, ít bóng, tươi vui / quảng cáo) vs low-key (tối, nhiều bóng, kịch tính / bí ẩn).

**Bảng phương án mẫu (map cảm xúc → ánh sáng):**

| Cảm xúc | Phương án ánh sáng |
|---|---|
| Ấm áp, đời thường | soft front/side, high-key, đèn vàng ấm 3200K |
| Cô đơn, trầm | soft side, low-key, 1 nguồn lệch, bóng dài |
| Căng thẳng, xung đột | hard side/top, low-key, tương phản gắt |
| Vỡ oà / cao trào | hard back-rim + key mạnh, contrast cực đại |
| Hoài niệm | soft, high-key nhẹ, ngả vàng/hồng, hơi mờ sương (KHÔNG dùng ở ảnh nhân vật gốc) |

Đây là kim chỉ nam cho ảnh `scene` (scene là nơi mang ánh sáng). Ảnh nhân vật/đạo cụ GỐC vẫn chụp ánh sáng phẳng đều trung tính.

---

## 3. Texture & Material — chất liệu định danh

Chọn **2–3 chất liệu chủ đạo** mang cảm giác phim, giữ "chất" nhất quán xuyên cảnh:
- **Thư viện gợi ý**: da người (ấm, đời), vải thô/linen (mộc, hoài cổ), vải mịn/lụa (sang, dịu), kim loại (lạnh, hiện đại, sắc), gỗ (ấm, mộc mạc), đá/bê tông (thô, nặng, nghiêm), kính (trong, hiện đại, phản chiếu), giấy (cũ kỹ, thời gian).
- Mỗi chất liệu gắn 1 cảm giác — chọn cho khớp thể loại/cảm xúc phim. VD phim tình cảm ấm: da + gỗ + lụa. Phim đô thị lạnh: kim loại + kính + bê tông.
- Ghi rõ chất liệu nào xuất hiện nổi bật để ảnh `scene` + `prop` giữ đúng bề mặt.

---

## 4. palette_note — lời tựa tổng

1–2 câu tổng: bảng màu tổng cả phim + emotional palette (màu ↔ cảm xúc xuyên suốt) + phương án ánh sáng chủ đạo + chất liệu định danh. Là lời tựa ngắn để MỌI thợ hình (imgPrompter, vidPrompter) bám khi dựng prompt scene.

> VD: *"Toàn phim đi từ vàng ấm đời thường → xanh lạnh rạn nứt → đỏ rực cao trào → cam hoàng hôn hàn gắn; ánh sáng chủ đạo soft high-key, chuyển low-key ở cảnh xung đột; chất liệu định danh: gỗ, vải linen, ánh đèn vàng."*

---

## Luật

- **Color Script bám cảm xúc kịch bản** (đọc director plan) — không tô màu tùy hứng; arc phải theo đường cong cảm xúc.
- Màu/ánh sáng ở đây là để **ảnh `scene` mang** — nhắc lại luật asset-prompt-craft: nhân vật/đạo cụ gốc chụp nền trung tính `#F8F4E8`, ánh sáng phẳng đều, KHÔNG nhét màu; màu chỉ vào cảnh khi ghép.
- Bám STYLE toàn dự án (chất liệu render L1) — Visual System tinh chỉnh TÔNG bên trong style, KHÔNG phá style.
- Reviewer phanh: Color Script thiếu mốc cảnh nào, hoặc arc phẳng (mọi cảnh cùng palette), hoặc thiếu hệ ánh sáng theo cảm xúc → hạ hạng.
