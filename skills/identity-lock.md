# LỚP C — KHÓA NHẬN DẠNG NHÂN VẬT (mềm phần còn lại)

> Mượn asset variations của Printfilm. Quy ước @tag từ prompt mẫu thật của 5 nguồn.

## Nguyên tắc

1. **Chỉ khóa CỨNG mặt + dáng** (`identity_lock.face`, `identity_lock.body`). Đây là thứ giữ nhân vật "vẫn là người đó" xuyên mọi cảnh.
2. **MỀM đồ/tóc/đạo cụ** — đổi theo cảnh (theo era ở lớp B). Cảnh cổ đại mặc đồ cổ, cảnh hiện đại mặc đồ thường — VẪN là một người.
3. **Mỗi nhân vật/đạo cụ quan trọng = 1 @tag.** Tag VIẾT HOA không dấu: `@ADIL`, `@REMOTE`, `@LAN`. Gọi `save_asset` để tạo tag.

## Quy ước @tag trong prompt (BẮT BUỘC — giống 5 nguồn)

Khi prompt nhắc tới nhân vật/đạo cụ đã có asset, PHẢI:
- Nhúng `@Tag` tại đúng vị trí. VD: *"in @ADIL's eyeline"*, *"@REMOTE stays normal household remote size"*.
- Với asset khóa cứng, thêm câu khẳng định nhất quán:
  *"Wardrobe/face comes from the @ADIL reference and stays identical across the whole take."*
- KHÔNG mô tả lại mặt/dáng bằng lời khi đã có @tag — để @tag + ảnh tư liệu lo. Chỉ mô tả phần MỀM (đồ theo cảnh, hành động).

## Ai tạo tag?

`assetDeriver` (cổng NGUYÊN LIỆU / gate_assets) TÁCH @tag TỪ kịch bản final: đọc toàn văn narration (`read_script_full`) rồi `derive_assets` cho nhân vật/bối cảnh/đạo cụ LẶP LẠI thật sự có trong kịch bản. `ideaAnalyst` (gate0) CHỈ chốt ý đồ — KHÔNG tạo cảnh, KHÔNG tạo @tag. Mặt/dáng để trống nếu kịch bản chưa tả; người dùng bổ sung ảnh tư liệu sau.

## Phái sinh phân lớp L0 → L5 (mượn art_character_derivative)

Nhân vật KHÔNG vẽ lại từ đầu mỗi biến thể. Dựng 1 lần **L0**, rồi phái sinh từng lớp — MỖI lớp chỉ đổi đúng phần của nó, các lớp dưới GIỮ NGUYÊN.

| Lớp | Đổi gì | Khóa gì (bất biến) |
|---|---|---|
| **L0** | Base: mặt + vóc dáng gốc (character sheet 4-view, mặt mộc, nền trơn) | — (đây là gốc) |
| **L1** | Trang điểm / biểu cảm | Mặt (xương/mắt/mũi/miệng), dáng |
| **L2** | Kiểu & màu tóc | Mặt, dáng, lớp L1 |
| **L3** | Trang phục chính (theo era/bối cảnh) | Mặt, dáng, tóc |
| **L4** | Lớp áo ngoài / biến thể trang phục | Mặt, dáng, tóc, L3 nền |
| **L5** | Phụ kiện (kính, mũ, trang sức, đạo cụ cầm tay) | Toàn bộ L0–L4 |

**Luật cốt:**
- **面容不变 (mặt không đổi):** L1–L5 TUYỆT ĐỐI không đổi cấu trúc khuôn mặt. Đổi mặt = nhân vật khác = hỏng nhất quán.
- **姿态不变 (dáng không đổi):** vóc dáng/tỉ lệ cơ thể giữ nguyên xuyên mọi biến thể.
- Phái sinh đi TỪ DƯỚI LÊN: muốn đổi tóc (L2) thì L0+L1 phải cố định trước.
- Mỗi biến thể trong prompt = nhúng `@tag` gốc + CHỈ mô tả phần lớp đang đổi. VD: `@LAN in a red áo dài (L3), hair and face identical to @LAN reference`.

## Bảng Giữ / Cấm (R = giữ / X = cấm) cho nhất quán danh tính

| Hạng mục | R (giữ) | X (cấm) |
|---|---|---|
| Khuôn mặt | Nhúng @tag + "face identical to @tag reference" | Tả lại mắt/mũi/miệng bằng lời khi đã có @tag |
| Vóc dáng | Giữ tỉ lệ đầu-thân đã khai ở L0 | Đổi chiều cao/thân hình giữa các cảnh |
| Tóc | Đổi theo cảnh nhưng khai rõ lớp L2 | Đổi tóc mà không ghi là biến thể (gây "người khác") |
| Trang phục | Đổi theo era/bối cảnh (L3/L4) | Trộn era (đồ cổ + đồng hồ hiện đại) trừ khi chủ đích |
| @tag | 1 nhân vật = 1 tag VIẾT HOA không dấu, dùng lại | Tạo tag mới cho cùng 1 người ở cảnh khác |
| Mô tả prompt | Chỉ tả phần MỀM (đồ/hành động/lớp đang đổi) | Mô tả cứng mặt/dáng chồng lên @tag (xung đột ảnh tư liệu) |
