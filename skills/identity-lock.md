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
