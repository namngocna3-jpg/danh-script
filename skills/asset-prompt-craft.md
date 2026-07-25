# LỚP · asset-prompt-craft (công thức prompt tạo ảnh nguyên liệu) ⭐⭐

> Công thức **sinh PROMPT tạo ảnh nguyên liệu** (character sheet / bối cảnh 1 ảnh 1 góc sạch / lưới 2×2 / biến thể). Chưng cất từ Toonflow `art_skills` (12 phong cách × 7 file art_prompt) + tài liệu Visual Dev. Nạp cho **assetDeriver (gate_assets)**.
>
> ⚠️ App **dừng ở prompt**: bạn viết prompt, người dùng copy → Coco/ComfyUI tạo ảnh → upload ảnh về app. Prompt phải đủ để tạo ảnh dùng được NGAY.

---

## 0. Luật xuyên suốt

- Prompt **tiếng Anh**, mô tả tạo-hình thuần.
- **Bám STYLE (L1):** mọi asset cùng 1 chất liệu render (xem style-constitution). Nêu style ở đầu prompt gốc.
- **CẤM ánh sáng/màu cụ thể trong prompt nhân vật & đạo cụ.** Nhân vật + đạo cụ chụp nền trung tính, ánh sáng phẳng đều — để ảnh `scene` + Color Script mang tông màu/ánh sáng khi ghép. (Đây là lý do nhân vật nhất quán xuyên cảnh.)
- **"Thà thiếu còn hơn thừa":** mỗi asset gốc 1–5 phái sinh, đúng cái kịch bản cần.

---

## 1. Nhân vật (char) — CHARACTER SHEET 4 VIEW

Ảnh gốc nhân vật = **1 sheet chứa 4 góc** trên cùng khung:
1. **Cận chân dung** (đầu–vai, thấy rõ mặt) — **Ô DUY NHẤT hiện mặt rõ.**
2. **Chính diện toàn thân 0°** (đứng thẳng, tay xuôi) — **KHÔNG lấy nét mặt** (mặt cúi nhẹ / hất tóc che / hoặc rất trung tính, tối giản chi tiết).
3. **Nghiêng 90°** (side profile) — nhìn nghiêng tự nhiên, không hướng thẳng ống kính.
4. **Sau lưng 180°** (thấy dáng lưng + tóc sau) — **quay lưng, KHÔNG thấy mặt.**

> ⭐⭐ **LUẬT MỘT-MẶT (mượn kỹ thuật Higgsfield "erase duplicate faces"):** sheet chỉ được có **DUY NHẤT 1 khuôn mặt rõ** ở ô close-up (1). Ba ô toàn thân (2/3/4) **KHÔNG dựng mặt chi tiết** — vì bắt model vẽ cùng 1 khuôn mặt 4 lần trong 1 ảnh **luôn ra 4 mặt lệch nhau** (drift + méo, y như lỗi "mặt dán/cắt ghép"). Tách vai trò: **ô 1 lo MẶT, ô 2/3/4 lo DÁNG + trang phục + tóc.** Prompt phải ghi rõ: *"only the close-up panel shows a detailed face; the full-body front view has the face turned down / hair falling over it / left minimal; side view is a natural profile; back view faces away — do NOT render a sharp frontal face in the body panels."*

Bắt buộc trong prompt:
- Nền **xám trơn** (plain solid grey — Higgsfield: "nothing competes with the character") HOẶC trắng ngà `#F8F4E8`, đều, không đổ bóng mạnh. Xám trơn cho win-rate khóa nhân vật cao hơn.
- **CHỈ 1 mặt rõ** ở ô close-up; ô toàn thân KHÔNG lộ mặt chính diện sắc nét (luật một-mặt ở trên).
- **Mặt mộc** (no/minimal makeup) — makeup là lớp phái sinh.
- **Đồ cơ bản** (neutral base outfit) — trang phục cảnh là lớp phái sinh.
- **Khai báo chiều cao + tỉ lệ đầu-thân:** nữ ~155–165cm, 6–6.5 đầu; nam ~170–180cm, 6.5–7.5 đầu. Ghi rõ trong prompt để giữ tỉ lệ nhất quán.
- Ánh sáng phẳng, đều (flat even studio light), không màu.

> Mẫu ý: *"character reference sheet, 4 panels on one canvas, plain solid grey background: (1) close-up portrait — the ONLY panel with a detailed face; (2) full-body front 0° with the face turned down / not in focus; (3) side profile 90°; (4) back view 180° facing away. Flat even lighting, bare face, neutral base outfit; [female, ~160cm, 6-head proportion]; only one clear face in the whole image, no duplicate frontal faces in the body panels; [STYLE]."*

> ⭐ **Ref khóa mặt cho VIDEO (nhân vật chính):** ngoài sheet 4-view (dùng TẠO ảnh gốc), tạo THÊM 1 biến thể `state` close-up mặt sạch — *"clean single-face close-up, front, neutral expression, plain grey background"* — làm @tag reference khi khóa mặt ở GATE 3. Kể cả khi sheet đã theo LUẬT MỘT-MẶT (chỉ 1 mặt ở ô close-up), 1 ảnh close-up TÁCH RIÊNG vẫn khóa mặt chắc hơn khi làm ref video (Seedance chỉ cần bám đúng 1 mặt duy nhất, không phải cắt từ sheet). Chỉ char CHÍNH, không tính vào giới hạn "thà thiếu hơn thừa".

## 1b. Nhân vật — PHÁI SINH (hệ lớp, giữ mặt+dáng)

Phái sinh = **img2img trên ảnh gốc**, GIỮ mặt + dáng, chỉ đổi 1 lớp. Toonflow chia 7 lớp L0–L6:
- **L0** base · **L1** makeup · **L2** tóc · **L3** áo trong · **L4** áo ngoài · **L5** giày · **L6** phụ kiện.
Trong app này gom về `derive_kind`:
- `wardrobe` — đổi trang phục/tóc/phụ kiện (L1–L6).
- `state` — đổi trạng thái: ướt mưa, mệt, khóc, vui, bụi bẩn...
Mỗi biến thể 1 prompt, mở đầu bằng *"same face and body as reference, keep identity; change only: …"*. Chỉ tạo biến thể cảnh THẬT SỰ dùng.

---

## 2. Bối cảnh (scene) — 1 ẢNH SẠCH, 1 GÓC, KHÔNG NGƯỜI

Ảnh gốc bối cảnh = **MỘT ảnh establishing sạch, MỘT góc đại diện** của không gian, tỉ lệ 16:9:
- **1 ảnh 1 góc** (establishing wide đại diện) — KHÔNG ghép nhiều góc/lưới/collage trong 1 ảnh.
- **TUYỆT ĐỐI không có người** trong ảnh scene.
- ⚠️ Ảnh gốc sạch 1 góc là để dùng làm **ảnh tham chiếu tải lên Coco** — ghép grid nhiều góc sẽ làm upload/khóa bối cảnh HỎNG.

Cần **nhiều góc hoặc nhiều địa điểm**? → **tách thành asset scene RIÊNG** (mỗi địa điểm/góc chính 1 @tag), hoặc tạo **derivative `angle`** từ ảnh gốc — KHÔNG nhồi nhiều góc vào 1 ảnh.

Prompt nêu: kiến trúc/layout, lớp hậu cảnh (background layers), cây cối/vật thể cố định. Có thể mang ánh sáng/màu (scene LÀ nơi giữ tông).

## 2b. Bối cảnh — PHÁI SINH
- `time` — cùng nơi, đổi thời điểm (bình minh/trưa/hoàng hôn/đêm).
- `weather` — đổi thời tiết (nắng/mưa/sương/tuyết).
- `angle` — **1 góc máy khác** của cùng cảnh (mỗi biến thể vẫn là 1 ảnh 1 góc sạch, KHÔNG ghép).
Vẫn KHÔNG người. Mỗi cảnh 1–5 biến thể theo nhu cầu kịch bản.

---

## 3. Đạo cụ / sản phẩm (prop/product) — LƯỚI 2×2

Ảnh gốc = **grid 2×2** 4 ô cùng vật:
- Chính diện · nghiêng · sau · cận chi tiết (chất liệu/nhãn/nút).
- Nền trung tính sạch, không tay/không người.
- Sản phẩm cần bán: ô cận phải khoe rõ nhãn/logo/điểm bán.

**Đạo cụ KHÔNG phái sinh** (Toonflow) — 1 ảnh 2×2 là đủ.

> Mẫu ý: *"2×2 product grid of the same object: front / 3-4 side / back / macro detail; clean neutral background, no hands, no people; [STYLE]."*

---

## 4. Checklist trước khi ghi prompt
- [ ] Đúng loại công thức theo type (char→4-view, scene→1 ảnh 1 góc sạch KHÔNG người, prop→2×2)?
- [ ] Nhân vật: nền xám trơn (hoặc #F8F4E8), mặt mộc, có khai báo tỉ lệ đầu-thân?
- [ ] **Nhân vật: CHỈ 1 mặt rõ ở ô close-up? Ô toàn thân (front/side/back) KHÔNG lộ mặt chính diện sắc nét (luật một-mặt chống drift)?**
- [ ] Nhân vật/đạo cụ: KHÔNG có màu/ánh sáng cụ thể?
- [ ] Scene: KHÔNG có người?
- [ ] Phái sinh: mở bằng "giữ mặt/dáng gốc", chỉ đổi 1 lớp?
- [ ] Bám đúng STYLE toàn dự án?
- [ ] Số phái sinh 1–5, đúng cái kịch bản cần (không thừa)?
