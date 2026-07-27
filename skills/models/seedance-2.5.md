# MODEL · Seedance 2.5 — LUẬT VIẾT PROMPT VIDEO (đời sắp tới)

> Khối này được app chèn vào system của **vidPrompter (GATE 3)** khi dự án chọn Seedance 2.5.
> ⚠️ **Chỉ chọn 2.5 nếu tài khoản Coco/BytePlus của bạn ĐÃ mở 2.5.** Viết prompt 2.5 rồi dán vào
> 2.0 thì engine bỏ qua phần lớn chỉ thị mở rộng (nhiều tham chiếu, chuỗi dài, sửa vùng).
> Luật chung ở `byteplus-spec` vẫn giữ; file này nêu **chỗ 2.5 làm được mà 2.0 không**.

---

## 1 · NĂNG LỰC MỞ RỘNG

| | Seedance 2.0 | **Seedance 2.5** |
|---|---|---|
| Độ dài 1 lần sinh | 4–15 s | **tới 30 s liền mạch** |
| Tham chiếu | ≤12 file | **tới 50 input** (ảnh · video · audio) |
| Sửa theo vùng | ❌ | ✅ **region-level editing** — sửa 1 vùng của khung |
| Khóa danh tính | tự bù bằng ảnh khung đầu | ✅ **khóa nhân vật/sản phẩm/style xuyên cú quay** bằng bộ tham chiếu @ |
| Điều khiển máy | động tác cơ bản | **director-grade camera control** |
| Bám chỉ thị | chuẩn | **~+20%** so với 2.0 |
| Ngôn ngữ prompt | — | 11 ngôn ngữ |

> ⚠️ Hãng **chưa công bố** trần độ phân giải riêng cho 2.5 — đừng hứa "4K native" với người dùng.

---

## 2 · ⭐ ĐIỀU KHÁC LỚN NHẤT: NHIỀU THAM CHIẾU HƠN → **ÍT CHỮ HƠN**

Đây là chỗ dễ làm sai nhất. Thấy "50 tham chiếu, 30 giây" rồi tưởng phải viết prompt dài gấp ba —
**ngược lại**. 2.5 khóa danh tính bằng **bộ tham chiếu**, không bằng chữ. Mỗi câu bạn tả thêm về
ngoại hình là một **nguồn cạnh tranh** với ảnh đang khóa → engine hòa giải → ra mặt thứ ba.

- **Ngân sách chữ vẫn 60–100 từ.** Không nới.
- Chữ để dành cho: **hành động · nhịp · ánh sáng đổi · động tác máy** — thứ ảnh không nói được.
- Tham chiếu để lo: **mặt · dáng · trang phục · sản phẩm · bối cảnh · style**.
- Vẫn **2–4 tham chiếu MẠNH cho mỗi vai**, đừng nhồi cho đủ 50. Trần 50 là để một dự án dài dùng
  nhiều vai khác nhau, không phải để một block nhét 50 ảnh.

---

## 3 · KHÓA DANH TÍNH XUYÊN CÚ QUAY (thay cho nối khung thủ công)

2.5 giữ được nhân vật/sản phẩm/style qua cả cú quay bằng bộ tham chiếu @. Cách viết:
```
@NUCHINH as character reference, @SERUM as product reference,
@QUANCAFE as background environment, @ANHMAU as style reference
```
- Vẫn giữ `avoid identity drift` ở đuôi `constraints` — không thừa.
- **Nối khung vẫn dùng được và vẫn nên dùng** cho chuỗi dài, nhưng trên 2.5 nó bớt sống-còn hơn
  so với 2.0, vì engine đã tự giữ danh tính một phần.

---

## 4 · BLOCK DÀI HƠN — NHƯNG APP VẪN CẮT ≤8s

Trần 30s là **năng lực engine**, KHÔNG phải đích viết. Lý do app vẫn cắt ≤8s:
- Block ngắn = mỗi block một ý đồ rõ → dễ sửa lại đúng block hỏng thay vì render lại 30s.
- Chi phí render tính theo giây; hỏng một nhịp ở giây 22 là mất cả 30s.
- Nhịp video ngắn (TikTok/Reels) vốn cắt 2–4s/shot.

> Muốn dùng block dài hơn 8s trên 2.5 thì phải **người dùng xác nhận** — validator vẫn chặn ở 8s.

---

## 5 · SỬA THEO VÙNG (region edit) — CÓ CÂU GHIM

Năng lực mới. Viết: **hành động + đối tượng + đặc điểm đích + CÂU GHIM**
```
Change only the sign text on the wall to "MỞ CỬA".
Keep the exact face, pose, camera move, lighting and everything else unchanged.
```
⛔ Không trộn sinh-mới với sửa trong một prompt.

---

## 6 · CẤM

- ❌ Nới ngân sách chữ vì "model chịu được prompt dài" — nhiều tham chiếu thì **ít chữ hơn**.
- ❌ Nhồi tham chiếu cho đủ trần 50.
- ❌ Tả lại ngoại hình khi đã có tham chiếu nhân vật.
- ❌ Hứa "4K native" (hãng chưa công bố).
- ❌ Thông số máy quay trong prompt (`85mm`, `f/2.8`) — vẫn cấm như 2.0.
- ❌ Nhạc nền (BGM).
