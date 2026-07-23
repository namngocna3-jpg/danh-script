# LỚP · NHẤT QUÁN XUYÊN BLOCK (consistency) ⭐⭐⭐

> Chắt từ Coco `4-consistency.md` (3 tầng anchor) + Toonflow (khóa vị trí/hướng nhìn) + Higgsfield (Soul-ID, style-key lặp). **ĐÃ LỘT SẠCH thời đại/trang phục** — chỉ nói CƠ CHẾ giữ nhất quán, không quy định mặc gì.
> Nạp kèm **imgPrompter** (GATE 2) + **vidPrompter** (GATE 3). Đây là thứ tách "video AI trông giả" khỏi "video AI dùng được": nhân vật không nhảy mặt, style không trôi, vị trí không nhảy chỗ.
>
> ⚠️ BẤT BIẾN: lớp này KHÔNG chọn era/trang phục/tóc (đó là lớp B scene_context) và KHÔNG chọn chất liệu render (đó là STYLE anchor). Nó chỉ đảm bảo **cái đã chọn được giữ nguyên đúng chỗ**.

---

## 3 TẦNG ANCHOR — chọn theo bài toán

| Bài toán | Tầng dùng |
|---|---|
| Video sản phẩm/cảnh vật, không người | Tầng 2 (STYLE lặp) |
| Có nhân vật, chỉ trong 1 video này | Tầng 2 + Tầng 3 |
| Nhân vật thương hiệu lặp qua NHIỀU video | Tầng 1 (Soul-ID) + 2 + 3 |
| Style phi-thực (anime/vector) | Tầng 2 BẮT BUỘC |

---

## TẦNG 1 · SOUL-ID — khóa 1 khuôn mặt tái dùng (Higgsfield)
Dùng khi cần **cùng một mặt** qua nhiều video (nhân vật thương hiệu, founder, người mẫu lặp).
- App DỪNG trước render → chỉ **đánh dấu** `SOUL-ID: @TAG cần train reference_id khi render thật trên Coco` + mô tả đủ chi tiết để khóa (rơi về Tầng 3).
- Triết lý: "train identity once, reuse forever." reference_id thật sinh ở Coco/Higgsfield, app không gọi.

## TẦNG 2 · STYLE LẶP Y HỆT — chống style-drift (Higgsfield + Toonflow)
**Chống trôi phong cách = dán STYLE token GIỐNG HỆT vào MỌI block, không lệch 1 từ.**
- Lấy STYLE token từ `{{STYLE_ANCHOR}}` (style_id dự án) → copy nguyên văn vào trường STYLE/STYLE REFERENCE của từng block.
- Câu khóa mạnh (bê Coco): `Match the style of the reference exactly; every element rendered in that identical style.`
- Nếu có **style-key image** (1 ảnh mẫu phong cách): ghi `STYLE-KEY: <@tag/đường dẫn>` để Coco đính vào mọi clip.
- ⚠️ KHÔNG đổi 1 từ nào trong STYLE giữa các block. STYLE token là bất biến dự án.

## TẦNG 3 · @REF BINDING + KHÓA VỊ TRÍ/HƯỚNG NHÌN (Toonflow)
### 3a. Bảng CAST (viết 1 lần, dùng mọi block)
```
CAST:
- @LAN: nữ, [đặc điểm khóa CỨNG: mặt/dáng] — giữ nguyên mọi block; trang phục/tóc theo scene_context
- @SERUM: [hình dạng/nhãn sản phẩm] — giữ nguyên hình + nhãn mọi block
```
Khóa cứng: giới tính + dấu nhận diện mặt/dáng (KHÔNG khóa trang phục — đó là lớp B). Sản phẩm: khóa hình dạng + nhãn.

### 3b. @ref nhất quán
- Nhân vật/đạo cụ tái xuất ở block sau → dùng **LẠI đúng @tag** đó, không đổi.
- Mọi chỗ đáng lẽ ghi tên → thay bằng @tag (xem byteplus-spec mục 8).

### 3c. Khóa VỊ TRÍ & HƯỚNG NHÌN (chống nhảy chỗ/xoay mặt vô lý)
- **Hướng nhìn** theo ưu tiên: mô tả block ghi rõ → quan hệ không gian 2 nhân vật (giữ **đường trục 180°**) → gợi ý cỡ cảnh → logic cảm xúc.
- **Khóa trái/giữa/phải:** cùng nhân vật trong cùng cảnh giữ nguyên bên; đổi bên PHẢI kèm động tác quay người/di chuyển rõ ràng.
- **Gương/mặt nước:** ảnh phản chiếu lật trái-phải so với thực thể — ghi rõ quan hệ khi có.

---

## ⭐ 2 CHẾ ĐỘ THAM CHIẾU — khóa-mặt-lẫn-đồ vs khóa-mặt-đổi-đồ (Printfilm)

> Khi có ảnh nhân vật tham chiếu, phải nói RÕ cho engine: giữ **NGUYÊN cả người** hay chỉ giữ **KHUÔN MẶT** rồi thay trang phục? Hai ý định này sinh 2 câu prompt khác hẳn. Chọn 1 theo bài toán, ghi vào bảng CAST.

### Chế độ A · SAO Y NGUYÊN BẢN (strict-replication)
Giữ **cả mặt + tóc + trang phục + phụ kiện** y hệt ảnh tham chiếu. Dùng khi: nhân vật đã chốt tạo hình, cùng một cảnh/trang phục, chỉ đổi khung/động tác.
- Câu khóa (EN): `Keep @LAN identical to the reference — same face, hair, outfit and accessories, only the framing and action change.`
- Trong cùng 1 cảnh (scene_context không đổi) → **mặc định dùng chế độ A**.

### Chế độ B · KHÓA MẶT, ĐỔI ĐỒ (wardrobe-variation) ⭐ cho fashion/thử-đồ/đổi cảnh-era
Giữ **KHUÔN MẶT + dáng người 100% giống**, nhưng **thay trang phục HOÀN TOÀN** theo lớp B (scene_context). Dùng khi: video thời trang thử nhiều bộ, nhân vật xuyên nhiều era/bối cảnh, cùng người khác lookbook.
- Câu khóa (EN — tách bạch rõ 2 vế): `Preserve the FACE and body of @LAN 100% identical to the reference (same facial features, same identity). The OUTFIT is completely different: {wardrobe from scene context}. Do not copy the clothing from the reference image.`
- ⚠️ Điểm chết người: nếu KHÔNG viết "do not copy the clothing / outfit is completely different", engine sẽ bê luôn đồ trong ảnh ref → hỏng ý đồ đổi đồ.
- Vẫn khóa cứng mặt/dáng (Tầng 3 CAST) — chỉ **mở khóa** trang phục cho lớp B chi phối.

### Ghi vào CAST
```
CAST:
- @LAN: nữ, [mặt/dáng khóa cứng] — MODE: B (khóa mặt, đổi đồ theo scene_context)
- @KHOA: nam, [mặt/dáng khóa cứng] — MODE: A (sao y nguyên bản trong cảnh này)
```
Mặc định: cùng cảnh/tạo hình → A; fashion/đổi era/thử đồ → B. MODE có thể khác nhau giữa các nhân vật trong cùng block.

---

## CHECKLIST TỰ KIỂM (chạy cuối mỗi cổng ảnh/video, trước khi trả)
- [ ] STYLE token giống HỆT mọi block? (không lệch 1 từ)
- [ ] Mỗi nhân vật giữ đúng đặc điểm khóa cứng (mặt/dáng/giới) mọi block?
- [ ] Trang phục "consistent within the scene" — đổi giữa cảnh khác era là ĐÚNG, không phải lỗi?
- [ ] Mỗi nhân vật đã gán MODE (A sao-y / B khóa-mặt-đổi-đồ)? Nếu MODE B → có câu "do not copy the clothing" chưa?
- [ ] @tag gán nhất quán, không đổi tên giữa các block?
- [ ] Vị trí trái/giữa/phải nhân vật không nhảy vô cớ? Hướng nhìn hợp đường trục 180°?
- [ ] Nhân vật ở khung không tự biến mất/xuất hiện giữa các block?
- [ ] SOUL-ID đã đánh dấu cho nhân vật cần tái dùng nhiều video?

---

## KHỐI NHẤT QUÁN (app xuất ở đầu bộ prompt, trước Block 1)
```
#### NHẤT QUÁN (áp cho mọi block)
STYLE: <STYLE token — copy nguyên văn vào mọi block>
STYLE-KEY: <@tag ảnh mẫu phong cách, nếu có>
CAST:
- @TAG: <đặc điểm khóa cứng mặt/dáng> — MODE: <A sao-y / B khóa-mặt-đổi-đồ>
SOUL-ID: <@tag cần train reference_id khi render thật — hoặc "không">
```
