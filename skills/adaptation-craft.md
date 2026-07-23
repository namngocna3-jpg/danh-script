# LỚP · adaptation-craft (khung xương cốt chuyện & chiến lược chuyển thể) ⭐⭐

> Nghề **dựng khung xương (故事骨架) + chiến lược chuyển thể (改编策略)** — 2 artifact TIỀN-kịch-bản làm kịch bản "dày", không rời rạc. Nạp cho **scriptwright (GATE 1)**. Chạy TRƯỚC khi viết narration: có khung + chiến lược rồi mới viết lời thoại/quy hoạch shot, mỗi bước neo bước trước (mô hình Toonflow).
>
> ⚠️ File này **era-free & render-free**: KHÔNG chốt thời đại/trang phục/đạo cụ cụ thể (đó là lớp B `scene_context` do GATE 0 lo), KHÔNG chốt chất liệu render (lớp A STYLE). Chỉ nói **cách dựng khung & chuyển ideal → thứ quay được**.

---

## 0. Vì sao cần 2 bước này (đừng bỏ qua)

Lỗi kinh điển: nhảy thẳng từ ideal sang viết narration → ra một chuỗi câu rời rạc, mỗi cảnh một ý, không có mạch dồn cảm xúc, không có cú chốt. Toonflow chống lỗi này bằng 2 artifact:

1. **Khung xương** trả lời "chuyện này ĐI TỪ ĐÂU TỚI ĐÂU" — mạch tổng, các nhịp, đường cong cảm xúc, điểm trả bài.
2. **Chiến lược chuyển thể** trả lời "ideal trừu tượng này QUAY RA CÁI GÌ" — mỗi thông điệp thành hành động/hình ảnh cụ thể camera bắt được.

Có 2 cái này rồi, narration chỉ còn là "điền lời vào khung đã chắc" → dày, có nhịp, không lạc.

---

## 1. BƯỚC ① — KHUNG XƯƠNG (`write_skeleton`)

**Nguyên tắc tối cao:** khung xương là **chuyển ideal → mạch nhịp**, KHÔNG bịa thêm nhân vật/tình tiết ideal không có. Mọi nhịp phải truy được về ideal + brief + bối cảnh cảnh (GATE 0).

**4 thành phần:**

| Trường | Nội dung | Luật |
|---|---|---|
| **logline** | 1 câu: ai · muốn gì · cản trở/điều bất ngờ gì | Nén cả chuyện vào 1 hơi. Nếu không nén nổi = chưa hiểu chuyện. |
| **beats** | các nhịp chính theo trình tự | 3–7 nhịp là đủ cho video ngắn. Mỗi nhịp có `role` (vai trò) + `summary` + `scene_hint` (rơi vào cảnh nào). |
| **emotional_arc** | đường cong cảm xúc xuyên video | Phải có ĐỘ CHÊNH (VD "tò mò → căng → vỡ oà → nhẹ nhõm"). Phẳng lì = hỏng. |
| **payoff** | điểm trả bài / cú chốt khán giả chờ | Cái mà hook đã "mở vòng" phải được "đóng vòng" ở đây. |

**Khung nhịp gợi ý theo loại:**
- **Kể chuyện/phim ngắn:** thiết lập → kích sự → dồn xung đột → cao trào → giải quyết.
- **Bán hàng (affiliate/tvc):** hook (nỗi đau/tò mò) → khuấy vấn đề → giới thiệu giải pháp → bằng chứng/lợi ích → CTA. (khớp Hook→Body→CTA của scriptwright).
- **Fashion/nhận diện:** mở không khí → khoe chủ thể → cao trào thị giác → chốt thương hiệu.

**Kiểm khung xương:** đọc lại logline → các beat có dẫn tới payoff không? emotional_arc có thật sự lên-xuống? Nếu 1 beat rút ra mà chuyện vẫn nguyên → beat thừa, gộp.

---

## 2. BƯỚC ② — CHIẾN LƯỢC CHUYỂN THỂ (`write_adaptation`)

**Nguyên tắc tối cao "cho xem đừng kể" (show don't tell):** ideal thường viết bằng thông điệp trừu tượng ("sản phẩm tiện lợi", "tình cảm gia đình ấm áp"). Camera KHÔNG quay được từ trừu tượng — phải quy ra **hành động/hình ảnh cụ thể**.

| Trường | Nội dung | Luật |
|---|---|---|
| **approach** | hướng chuyển thể tổng | 1 câu chọn khung kể: "1 ngày của nhân vật" / "trước–sau" / "phỏng vấn" / "kể ngược"... Chọn cái phục vụ emotional_arc. |
| **show_dont_tell** ⭐ | mảng: thông điệp → hành động/hình ảnh cụ thể | LÕI của bước này. Mỗi thông điệp trong ideal phải có ≥1 dòng quy đổi. VD "tiện lợi → tay pha xong ly cà phê trong 5 giây, đồng hồ hiện 07:00". |
| **visual_motifs** | motif hình lặp lại giữ mạch | màu/vật/động tác biểu tượng xuất hiện ≥2 lần để buộc mạch (VD "ánh nắng qua rèm", "chiếc cốc đỏ"). Tùy chọn. |
| **tone** | tông tổng thể | ấm áp / kịch tính / hài / trầm... — 1 từ khóa để narration + prompt bám. |
| **pitfalls** | cạm bẫy cần né | những chỗ dễ sa vào kể chay / sến / lố / lệch bối cảnh. Tùy chọn. |

**Luật vàng chuyển thể:**
- Mỗi luận điểm ideal → ít nhất 1 phép "cho xem". Không có dòng show_dont_tell nào cho 1 thông điệp = thông điệp đó sẽ bị kể chay ở narration.
- KHÔNG bẻ bối cảnh/thời đại theo ý thích — chuyển thể là chọn HÀNH ĐỘNG trong bối cảnh GATE 0 đã chốt, không đổi bối cảnh.
- Motif phải quay được và lặp được, đừng chọn thứ trừu tượng ("sự tự do") làm motif.

---

## 3. BƯỚC ③ — nối sang narration + quy hoạch shot

Sau khi có khung xương + chiến lược:
- **write_script**: mỗi cảnh bám đúng beat của nó (theo `scene_hint`), lời thoại phục vụ đúng `role` nhịp đó, giữ đúng `tone`. Dồn cảm xúc theo `emotional_arc`.
- **plan_shots**: mỗi phép "cho xem" trong `show_dont_tell` nên hiện thành 1 shot cụ thể — đây là cách biến chiến lược thành khung hình, chống block trống.
- Motif hình (`visual_motifs`) rải vào shot_desc ở các cảnh tương ứng.

**Neo ngược:** viết xong narration, đọc lại khung x_beat — có cảnh nào lạc khỏi mạch không? có payoff không? thiếu = sửa.

---

## 4. Khi ideal đã rất chi tiết (kịch bản có sẵn)

Nếu người dùng đưa ideal đã gần như kịch bản đầy đủ: vẫn ghi `write_skeleton`/`write_adaptation` nhưng ở dạng **chắt lọc** (rút khung xương RA TỪ kịch bản họ đưa, không sáng tác mới) — để các cổng sau vẫn có mạch tham chiếu. KHÔNG bịa thêm nhịp ideal không có.

## 5. Cấm
- ❌ Không bịa nhân vật/tình tiết ngoài ideal.
- ❌ Không đổi bối cảnh/thời đại (GATE 0 lo).
- ❌ Không nhét chất liệu render/thời đại vào khung xương hay chiến lược.
- ❌ Không bỏ qua show_dont_tell rồi kể chay ở narration.
