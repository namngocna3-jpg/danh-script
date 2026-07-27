# MODEL · Seedream 5.0 — LUẬT VIẾT PROMPT ẢNH ⭐ (bản hiện hành)

> Khối này được app chèn vào system của **imgPrompter (GATE 2)** khi dự án chọn Seedream 5.0.
> Nó **ĐÈ LÊN** phần công thức chung ở `byteplus-spec` mục 2 và `_execution_imgPrompter` mục #2 —
> chỗ nào chỏi nhau thì **theo file này**, vì đây là luật của đúng đời model đang render.
> Mọi luật KHÁC (không tả lại mặt @tag · khối `[IDENTITY LOCK]` do app chèn · STYLE không chứa
> thời đại · tách người khỏi cảnh nền) **vẫn giữ nguyên** — file này chỉ đổi *cách xếp chữ*.

---

## 1 · KHÁC 4.0 Ở ĐÂU (đọc trước)

| | Seedream 4.0 | **Seedream 5.0** |
|---|---|---|
| Cách đọc prompt | công thức 6 phần, bám thứ tự | **xếp LỚP** — mỗi mệnh đề là một chỉ thị riêng |
| Lớp đầu tiên | Subject | ⭐ **FORMAT** (định dạng ảnh) — đứng TRƯỚC cả chủ thể |
| Ngân sách chữ | 60–100 từ | **rộng hơn** — vẫn nên 60–120 từ cho block phim, chỉ dài khi ảnh dày chữ/bố cục |
| Sửa ảnh | tả lại toàn khung | **sửa VÙNG** — nêu đúng thứ đổi + **ghim thứ không được đổi** |
| Tham chiếu | tới 10 ảnh | tới 10 ảnh, **gọi theo NỘI DUNG chứ không theo số thứ tự** |
| Chữ trong ảnh | có | mạnh hơn, đa ngôn ngữ — nhưng vẫn giữ chữ NGẮN |

---

## 2 · ⭐ CÔNG THỨC 5.0 — XẾP LỚP, FORMAT ĐỨNG ĐẦU

```
[FORMAT]      loại ảnh: cinematic film still · editorial portrait · product packshot · poster
[SUBJECT]     chủ thể + @tag + tư thế đóng băng + cảm xúc → ánh mắt
[COMPOSITION] bố cục + cỡ cảnh + góc máy + tiêu cự (ảnh thì ĐƯỢC ghi mm)
[LIGHTING]    ⭐ nguồn + hướng + chất — đòn bẩy cao nhất
[TEXT]        chữ trong ảnh (nếu có) — đặt trong "ngoặc kép", ≤10 từ
[STYLE]       {{STYLE_ANCHOR}} + độ nét                          ← NGẮN NHẤT
```

⭐ **VÌ SAO FORMAT ĐỨNG ĐẦU (điểm khác lớn nhất so với 4.0).** Gọi tên định dạng là ra lệnh cho
model *đóng vai ai*. Ghi `magazine cover` → nó chừa chỗ cho măng-sét và bố cục như art director.
Ghi `cinematic film still` → nó dựng khung như DOP, để chỗ thở, đặt chủ thể theo tỉ lệ vàng.
**Bỏ trống lớp nào là giao quyền quyết định lớp đó cho mặc định của model.**

Với app này (ảnh khung đầu của video), FORMAT gần như luôn là:
```
cinematic film still, 9:16 vertical framing
```
Đổi khác chỉ khi block cố ý là ảnh sản phẩm / poster / ảnh chụp màn hình.

---

## 3 · GỌI THAM CHIẾU THEO **NỘI DUNG**, KHÔNG THEO SỐ

- ❌ `the first reference` · `@Image1` · `reference 2`
- ✅ `@NUCHINH as character reference` · `the tan leather-bound journal` · `@QUANCAFE as background environment`

Vì sao: khi bộ tham chiếu bị đảo thứ tự (người dùng upload lại, Coco sắp khác), số thứ tự trỏ sai
ngay lập tức; **tên nội dung thì không bao giờ trỏ sai**. @tag của app vốn đã là tên nội dung — cứ
dùng @tag, đừng bao giờ viết "ảnh thứ nhất".

**Chất lượng > số lượng:** 2–4 tham chiếu MẠNH thắng 10 tham chiếu yếu. Ảnh ≥1080p. Ảnh không
được mâu thuẫn với chữ (ảnh áo đỏ + prompt ghi `blue jacket` → engine chọn bừa).
Sản phẩm/logo/vật liệu: **để ẢNH khóa, đừng tả bằng chữ** — chữ luôn thua ảnh ở khoản hình dạng.

---

## 4 · ⭐ SỬA ẢNH (region edit) — PHẢI CÓ CÂU **GHIM**

Đây là năng lực mới của 5.0 và cũng là chỗ dễ hỏng nhất: prompt sửa mà không ghim thì **mọi thứ
không được nhắc tới đều bắt đầu trôi** — sửa cái nền mà mặt cũng đổi theo.

Công thức sửa: **hành động + đối tượng + đặc điểm đích + CÂU GHIM**
```
Change only the jacket colour to deep navy.
Keep the exact face, the exact pose, the exact background, and the exact lighting unchanged.
```

⛔ **KHÔNG trộn sinh-mới và sửa trong một prompt.** Prompt phải hoặc *tả toàn bộ khung muốn có*,
hoặc *nêu đúng một thay đổi trên ảnh đã có*. Trộn hai thứ chính là lý do "sửa cái nền mà mặt đổi".

> Với pipeline của app: GATE 2 luôn là **sinh mới**. Chỉ dùng công thức sửa khi người dùng nói rõ
> *"giữ ảnh này, chỉ đổi …"*.

---

## 5 · NGÂN SÁCH CHỮ

- **60–120 từ** cho ảnh khung đầu phim (app này) — vẫn là đích ngắm.
- Trần kỹ thuật rộng hơn 4.0, nhưng luật cũ vẫn đúng: **prompt dài không nói rõ hơn, nó chia mỏng
  sự chú ý**. Quá dài thì model bắt đầu rơi chi tiết.
- Ảnh **dày chữ/bố cục phức tạp** (poster, infographic) mới cần dài.
- Không tính khối `[IDENTITY LOCK]` app chèn.
- **Sửa mệnh đề mơ hồ, đừng chồng thêm chữ.** Thấy prompt không ra đúng ý → tìm mệnh đề nào đang
  nói nước đôi mà viết lại, chứ đừng thêm câu mới lên trên.

---

## 6 · CẤM (riêng 5.0)

- ❌ Bỏ lớp — thiếu FORMAT hoặc thiếu LIGHTING là giao quyền cho mặc định.
- ❌ Trỏ tham chiếu bằng số thứ tự.
- ❌ Prompt sửa mà không có câu ghim.
- ❌ Trộn sinh-mới với sửa.
- ❌ Mệnh đề tự mâu thuẫn (`photorealistic cartoon`, `chậm + nhanh`).
- ❌ Dùng đại từ (`it`, `she`) thay cho @tag — model không suy được đang trỏ ai.
- ❌ Nhồi `8k / masterpiece / best quality` — không định nghĩa được ánh sáng, da, phản xạ nào cả.

---

## 7 · MẪU (block phim, 9:16)

```
Cinematic film still, 9:16 vertical framing.
@NUCHINH as character reference, seated at the window booth, shoulders dropped,
her gaze fixed on the untouched cup — the moment right after she stops arguing.
@QUANCAFE as background environment, the room emptied out behind her.
Warm late-afternoon light rakes in from the left window, long soft shadows across
the table, deep falloff into the back of the room.
Medium shot, 50mm, eye-level, shallow depth of field.
Muted teal-and-amber grade, sharp, high detail.
```
Đếm: 76 từ · đủ 6 lớp · Style ngắn nhất · không tả lại mặt (anchor lo) · @tag gọi theo nội dung.
