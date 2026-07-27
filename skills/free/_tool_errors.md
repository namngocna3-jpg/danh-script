# ⭐ KHI TOOL TRẢ `error` HOẶC `warning` (đọc kỹ — đây là chỗ hay cháy lượt nhất)

> Mảnh này nạp cho **CẢ HAI** đường chạy (hội thoại từng cổng và 1-phát). Trước đây chỉ đường
> hội thoại có, nên chạy 1-phát mà tool lỗi thì thợ không có bất kỳ chỉ dẫn nào — ca thật:
> gọi lại y hệt ~40 lượt liền, cháy sạch trần bước mà không ghi được block nào.

Kết quả mỗi tool là JSON. **Đọc nó trước khi gọi tool tiếp** — đừng gọi tiếp theo quán tính.

**Có `warning`** → tool ĐÃ ghi được, nhưng kết quả **thiếu chất lượng**. **DỪNG ghi tiếp**, đọc nguyên văn `warning`, báo người dùng bằng tiếng Việt kèm cách sửa, rồi **chờ họ trả lời**. Ghi thêm 15 block nữa cũng hỏng y hệt — chỉ tốn công.

**Có `error`** → lượt ghi đó **mất trắng**. Xử lý theo đúng 3 nấc, KHÔNG được nhảy cóc:

1. **Lần 1** — sửa **KIỂU DỮ LIỆU** của tham số rồi gọi lại. Đây là nguyên nhân của hầu hết lỗi:
   - `... is not a function` / `... is not iterable` → bạn gửi **chuỗi** vào chỗ cần **MẢNG**. Viết `["NUCHINH","COCO"]`, KHÔNG viết `"@NUCHINH, @COCO"`.
   - `NaN` / `invalid number` → bạn gửi `"2"` vào chỗ cần `2` (số, không có nháy).
   - `không tồn tại` / `not found` → sai `scene_order`/`block_order` → gọi `read_blocks` xem lại số thật.
2. **Lần 2** — nếu vẫn lỗi: **bỏ tham số tùy chọn** đang nghi ngờ, ghi bản tối giản trước (có còn hơn không).
3. **Lần 3** — **DỪNG gọi tool**. Báo người dùng: nguyên văn lỗi + tên tool + tham số bạn đã gửi. Để họ quyết.

**❌ TUYỆT ĐỐI KHÔNG:**
- **Đoán là "sai tên tool" rồi thử tên khác.** Tên sai thì tool không chạy được — mà nó chạy rồi mới sinh ra lỗi này. Đổi tên chỉ tổ hỏng thêm.
- **Gọi lại y hệt** tham số cũ. Cùng đầu vào thì cùng lỗi, mãi mãi.
- Nếu tool trả kèm trường `lap_lai` → app đã đếm: bạn đang lặp. **Đổi cách ngay**, hoặc dừng và báo người dùng.

## ⭐ CHIA LƯỢT KHI GHI NHIỀU BLOCK

Nhiều skill dặn "tối đa 3 block/lượt" (JSON dài quá 1 lượt sẽ bị cắt, mất trắng). Để không ghi trùng hay nhảy cóc:

- **Mở MỖI lượt tiếp theo bằng `read_coverage`** (hoặc `read_asset_coverage` ở cổng Nguyên liệu) → xem block/asset nào CÒN THIẾU → ghi đúng 3 cái đầu tiên còn thiếu.
- Đừng dựa vào trí nhớ lịch sử hội thoại để biết "đã ghi tới đâu" — đọc trạng thái thật từ tool.
- Còn thiếu thì lượt kế **tự viết tiếp**, không cần chờ người dùng gõ "tiếp".
