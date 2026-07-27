# MODEL · Seedance 1.5 Pro — LUẬT VIẾT PROMPT VIDEO (đời cũ)

> Khối này được app chèn vào system của **vidPrompter (GATE 3)** khi dự án chọn Seedance 1.5 Pro.
> Chỉ chọn nếu tài khoản còn kẹt bản này. Luật chung ở `byteplus-spec` vẫn giữ.

---

## 1 · GIỚI HẠN CỨNG — CHẶT HƠN 2.0 NHIỀU

| | Seedance 1.5 Pro |
|---|---|
| Độ dài | **5 s hoặc 10 s** (không tự do) — app vẫn cắt ≤8s |
| Tham chiếu | ⚠️ **chỉ ẢNH KHUNG ĐẦU** — không nhận nhiều @tag, không video/audio ref |
| Độ phân giải | 720 / 1080 |
| Tỉ lệ | 16:9 · 9:16 · 1:1 · 4:3 |
| Sửa theo vùng | ❌ |

---

## 2 · ⭐ HỆ QUẢ LỚN NHẤT: **CHỈ CÓ MỘT ẢNH THAM CHIẾU**

1.5 không nhận bộ @tag nhiều ảnh như 2.0/2.5. Nó chỉ có **một ảnh khung đầu**. Nghĩa là:

- **Toàn bộ danh tính phải nằm trong ảnh khung đầu đó.** Ảnh Seedream (GATE 2) phải cho thấy
  đủ nhân vật · trang phục · bối cảnh · đạo cụ ngay trong khung.
- **@tag trong prompt chỉ còn giá trị gọi tên**, không kéo được ảnh tư liệu riêng vào. Vẫn viết
  @tag (để app khóa danh tính và người đọc hiểu), nhưng **đừng trông cậy** engine tra ảnh của @tag.
- ⭐ **NỐI KHUNG trở thành BẮT BUỘC**, không phải tùy chọn. Không nối khung thì mỗi block chỉ có
  một tấm ảnh riêng lẻ để bám → mặt trôi ngay từ block thứ hai. Xem `byteplus-spec` mục 8bis-A.

---

## 3 · CÔNG THỨC

Giữ nguyên bản chuẩn ở `byteplus-spec` mục 2, nhưng **rút gọn hơn nữa**: 1.5 bám chỉ thị yếu hơn
2.0, prompt dài càng dễ rơi chi tiết. Nhắm **60–80 từ**.

Ưu tiên giữ, theo thứ tự: ① `@Image1 as the first frame;` ② hành động START→END ③ động tác máy +
từ nhịp ④ ánh sáng đổi ⑤ `avoid identity drift`.
Cắt trước: tính từ style, mô tả bối cảnh (đã có trong ảnh), âm thanh phụ.

---

## 4 · CẤM

- ❌ Duration khác 5s/10s (engine chỉ nhận 2 mốc) — chọn 5s cho block ≤8s.
- ❌ Trông cậy nhiều @tag ảnh — engine không nhận.
- ❌ Tham chiếu video/audio.
- ❌ Động tác máy phức tạp (orbit, crane, Bullet Time) — 1.5 dễ vỡ; giữ tĩnh/lia/đẩy nhẹ.
- ❌ Thông số máy quay trong prompt.
- ❌ Nhạc nền (BGM).
