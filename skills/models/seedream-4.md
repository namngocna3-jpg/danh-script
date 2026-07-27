# MODEL · Seedream 4.0 — LUẬT VIẾT PROMPT ẢNH (đời cũ)

> Khối này được app chèn vào system của **imgPrompter (GATE 2)** khi dự án chọn Seedream 4.0.
> 4.0 bám **công thức 6 phần** cổ điển — tức đúng phần đã ghi ở `_execution_imgPrompter` mục #2.
> File này chỉ **chốt lại và nhắc chỗ khác 5.0**, không đổi luật gì.

---

## 1 · CÔNG THỨC (giữ nguyên bản chuẩn)

```
[IDENTITY LOCK]  ⭐ APP TỰ CHÈN — bạn KHÔNG viết
[SUBJECT]     chủ thể + @tag + tư thế đóng băng + cảm xúc → ánh mắt
[ENVIRONMENT] era/setting/wardrobe/props LẤY TỪ scene + @tag bối cảnh
[LIGHTING]    ⭐ nguồn + hướng + chất — đòn bẩy cao nhất
[CAMERA]      cỡ cảnh + TIÊU CỰ (mm — ảnh thì engine ĐỌC) + góc máy
[STYLE]       {{STYLE_ANCHOR}} + độ nét                        ← NGẮN NHẤT
```

**KHÔNG có lớp FORMAT đứng đầu như 5.0.** Ghi `cinematic film still` ở đầu prompt 4.0 không sai
nhưng cũng không có tác dụng đóng vai như ở 5.0 — nó chỉ được đọc như một từ style thường.

---

## 2 · KHÁC 5.0 — NHỚ 4 ĐIỀU

| | 4.0 (bản này) | 5.0 |
|---|---|---|
| Ngân sách chữ | **60–100 từ, trần 150** — chặt hơn | rộng hơn |
| Sửa vùng | ❌ yếu — muốn đổi thì tả lại cả khung | ✅ sửa vùng + câu ghim |
| Suy luận nhiều bước | ❌ không | ✅ có |
| Chữ trong ảnh | ✅ **tốt hơn 5.0-preview** (bố cục chữ ổn định) | tốt nhưng chữ dễ lệch cấu trúc |

⭐ Điểm 4.0 **hơn** 5.0: **render chữ trong ảnh ổn định hơn**. Block cần chữ nằm đúng bố cục
(poster, bảng hiệu, tiêu đề) thì 4.0 đáng tin hơn. Vẫn giữ chữ **≤10 từ**, đặt trong `"ngoặc kép"`.

---

## 3 · NGÂN SÁCH CHỮ — CHẶT

**60–100 từ là ĐÍCH, 150 là TRẦN.** Quá 150 loãng, quá 200 model bắt đầu bỏ chỉ thị.
Không tính khối `[IDENTITY LOCK]`.

Cắt theo thứ tự: ① tính từ trang trí (`beautiful`, `stunning`) → ② mô tả trùng giữa Subject và
Environment → ③ Style thừa chữ. **KHÔNG cắt:** câu gán vai @tag, ràng buộc bố trí, thông số ống kính.

---

## 4 · THAM CHIẾU

Tới 10 ảnh. Gán vai bằng @tag: `@NUCHINH as character reference` ·
`@QUANCAFE as background environment` · `product details reference @SERUM`.
2–4 tham chiếu MẠNH thắng nhiều tham chiếu yếu; ảnh ≥1080p; ảnh không được chỏi với chữ.

---

## 5 · CẤM

- ❌ Tag-soup nhồi dấu phẩy · `8k/masterpiece/best quality`.
- ❌ Mệnh đề tự mâu thuẫn (`photorealistic cartoon`).
- ❌ Đại từ thay @tag.
- ❌ Sửa ảnh kiểu mơ hồ (`make it look better`) — 4.0 không có đường sửa vùng.
- ❌ Tả lại mặt/ngũ quan/tóc/dáng/tuổi của @tag (khối `[IDENTITY LOCK]` app chèn đã lo).
