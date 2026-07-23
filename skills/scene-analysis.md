# LỚP B — LUẬT SUY BỐI CẢNH TỪNG CẢNH (bottom-up)

> Mượn intent-first của TopView + linh hoạt của Higgsfield. Đây là chống lỗi "xuyên không".
> Dùng chung mọi pipeline. Nạp kèm system prompt của `ideaAnalyst`.

## Nguyên tắc gốc

1. **IDEAL QUYẾT ĐỊNH. Không áp khuôn từ đầu.** Đọc kỹ ideal, tìm mọi tín hiệu thời đại/nơi chốn/nhân vật rồi mới suy — KHÔNG chọn sẵn "cổ trang" hay "hiện đại" cho cả video.
2. **Mỗi cảnh có bối cảnh RIÊNG.** Một ideal có thể nhảy thời đại (hiện đại → xuyên không về cổ đại → quay lại). Mỗi cảnh phải tự có `{era, setting, wardrobe, props, mood}` đúng với NỘI DUNG cảnh đó.
3. **STYLE ≠ BỐI CẢNH.** Style (chất liệu render: 2D Nhật, 3D, người thật...) là L1 cứng, KHÔNG đụng ở đây. Ở lớp B chỉ suy bối cảnh/thời đại/trang phục (L2 mềm). Tuyệt đối không ghi chất liệu vẽ vào scene_context.
4. **Không bịa.** Ideal không nhắc thì không tự thêm đạo cụ/nhân vật. Thiếu thì để tối giản, không phịa "cánh hoa bay", "đèn lồng đỏ" nếu ideal không có.

## Quy trình suy (mỗi cảnh)

- **era** — Cảnh này diễn ra ở thời đại nào? Bằng chứng trong ideal là gì? (VD "xuyên không về cổ đại" → cảnh sau khi xuyên = 'cổ đại'; trước đó = 'hiện đại'.)
- **setting** — Nơi chốn cụ thể (phòng khách hiện đại / sân điện cổ / phố đêm...).
- **wardrobe** — Trang phục hợp era + nhân vật. Đây là chỗ dễ lỗi nhất: cảnh hiện đại KHÔNG mặc cổ trang và ngược lại.
- **props** — Đạo cụ ideal có nhắc (mảng, có thể rỗng).
- **mood** — Tông cảm xúc + ánh sáng.

## Kiểm tra chống lỗi (red-line RA)

- ❌ Nếu 2 cảnh khác thời đại mà `wardrobe`/`setting` giống nhau → SAI, suy lại.
- ❌ Nếu scene_context chứa từ chất liệu vẽ ("anime", "photoreal", "2D") → SAI, đó là việc của STYLE.
- ✅ Cảnh xuyên không: cảnh trước hiện đại, cảnh sau cổ đại, không được lẫn.

## ⭐ Bối cảnh LẶP LẠI → @tag scene (nhất quán ảnh)

`scene_context` là lớp MỀM riêng từng cảnh. Nhưng khi **cùng một địa điểm** trở lại ở nhiều cảnh (cùng quán, cùng phòng, cùng góc phố), phải khóa nó thành **asset bối cảnh** để ảnh mọi cảnh đó trông y hệt một không gian:
- Địa điểm xuất hiện ở ≥2 cảnh → `save_asset(type="scene")`, đặt @tag VIẾT HOA không dấu (VD @QUANCAFE, @PHONGNGU), `identity_lock.face` = mô tả tổng thể nơi chốn (kiến trúc/bố cục/chất liệu/ánh sáng chủ đạo, KHÔNG có người), `body` trống.
- Các cảnh cùng nơi vẫn giữ `scene_context` riêng (đổi trang phục/đạo cụ/tông theo diễn biến) NHƯNG dùng chung @tag scene → imgPrompter/vidPrompter sẽ nhúng @tag đó để nhất quán.
- Địa điểm chỉ 1 cảnh → KHÔNG cần @tag, để scene_context lo.

## Định dạng ra

Với MỖI cảnh, gọi tool `write_scene_context` đúng 1 lần, `order_idx` tăng dần từ 1.
Sau khi đủ cảnh, tạo @tag scene cho các địa điểm lặp lại (mục trên).
Sau khi đủ cảnh, tóm tắt ngắn (tiếng Việt) danh sách cảnh + era + @tag bối cảnh để người dùng chốt.
