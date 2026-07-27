# LỚP C — KHÓA NHẬN DẠNG NHÂN VẬT (mềm phần còn lại)

> Mượn asset variations của Printfilm. Quy ước @tag từ prompt mẫu thật của 5 nguồn.

## Nguyên tắc

1. **HỒ SƠ GỐC = trụ chống trôi mặt.** Gọi `lock_identity` cho MỌI asset `char` và `product`. Hồ sơ chia **2 tầng**.

   **TẦNG ẢNH** — app ghép thành khối `[IDENTITY LOCK]`, chèn vào 100% prompt ảnh (thứ tự dưới đây = đúng thứ tự ghép):

   | Trường | Nội dung | Ví dụ |
   |---|---|---|
   | `age` | Tuổi cụ thể | `26` |
   | `face` | Hình mặt · tông da | `Oval face, warm tan skin` |
   | `features` | **Ngũ quan chi tiết** — quyết định giống/khác nhiều nhất | `Single-fold almond eyes slightly downturned, straight nose bridge, full lower lip, high cheekbones` |
   | `signature` ⭐ | **Dấu nhận diện cố định** — nốt ruồi (RÕ vị trí) · sẹo · tàn nhang · xăm · răng khểnh | `Small mole below the outer corner of the left eye, faint scar through right eyebrow` |
   | `hair` | Màu · độ dài · kiểu · ngôi rẽ (mặc định) | `Black hair, shoulder-length, center part, slight natural wave` |
   | `body` | Tỉ lệ đầu-thân · thể trạng · tư thế | `Athletic build, 7.5-head proportion, broad shoulders, upright posture` |
   | `wardrobe` | Trang phục ký hiệu + phụ kiện — **có điều kiện**, xem #1bis | `Round tortoiseshell glasses, teal brand hoodie` |
   | `aura` | Khí chất — **ngôn ngữ so sánh trừu tượng**, KHÔNG tên người thật | `quiet stubborn intensity, the calm of someone used to being underestimated` |

   **TẦNG ĐỘNG** — KHÔNG vào prompt ảnh, chỉ hiện ở cổng Video:

   | Trường | Nội dung | Ví dụ |
   |---|---|---|
   | `demeanor` | Dáng đi · cử chỉ quen · độ nghiêng đầu khi nói | `Long unhurried strides, tilts head slightly left when listening` |
   | `voice` | Cao độ · âm sắc · nhịp nói · giọng vùng miền | `Low warm alto, unhurried pacing, soft Southern Vietnamese accent` |

   Viết **TIẾNG ANH**, tả **cụ thể đo đếm được**. CẤM chung chung ("đẹp", "cuốn hút") — model không bám được thứ mơ hồ.

   ⭐ **`signature` là ô đáng giá nhất trên mỗi đơn vị chữ.** Model dễ vẽ trùng "khuôn mặt trái xoan da nâu" giữa hai người khác nhau, nhưng "nốt ruồi dưới đuôi mắt trái" thì gần như không trùng ngẫu nhiên. Kịch bản không nêu → tự nghĩ 1–2 dấu nhỏ hợp lý rồi khóa. Đừng nhồi 5 dấu: nhiều quá thì model bỏ bớt, mất luôn cái quan trọng.

1bis. ⚠️ **`wardrobe` — con dao hai lưỡi.** Ô này chèn vào **MỌI** prompt ảnh.
   - ✅ **Điền** khi nhân vật mặc cùng một bộ xuyên suốt: mascot, KOL có đồng phục, kính/đồng hồ không bao giờ tháo, nhân vật hoạt hình.
   - ❌ **Bỏ trống** khi phim có nhiều bối cảnh và nhân vật đổi đồ. Anchor ghi "hoodie xanh" mà cảnh 3 nhân vật mặc áo mưa = hai mô tả chống nhau trong cùng prompt = model chọn bừa. Khi đó trang phục thuộc **lớp mềm theo cảnh**, không thuộc hồ sơ gốc.

1ter. **Vì sao tách tầng động ra khỏi prompt ảnh.** Ảnh tĩnh không có dáng đi và không có giọng nói — nhét vào chỉ làm prompt dài thêm mà không thêm tín hiệu nào, trong khi BytePlus khuyến nghị: có ảnh tham chiếu thì prompt phải **ngắn lại**, không dài ra. Nhưng bỏ hẳn thì thợ video mỗi block cho nhân vật một dáng đi khác nhau. Nên app giữ 2 ô đó và chỉ bơm ở **cổng Video**, dưới dạng ghi chú định hướng — thợ đọc để viết `motion`/`audio`, **không chép vào prompt**.

2. **Kịch bản không tả mặt → TỰ QUYẾT rồi khóa.** Thà chốt một phương án còn hơn để trống: để trống nghĩa là mỗi block tự bịa một kiểu → mỗi block một khuôn mặt.

3. **MỀM đồ/tóc/đạo cụ** — đổi theo cảnh (lớp L1–L5). Cảnh cổ đại mặc đồ cổ, cảnh hiện đại mặc đồ thường — VẪN là một người.

4. **Mỗi nhân vật/đạo cụ quan trọng = 1 @tag.** Tag VIẾT HOA không dấu: `@ADIL`, `@REMOTE`, `@LAN`.

## Khối ANCHOR — copy nguyên văn, cấm viết lại

App **tự ghép** các trường tầng ảnh thành 1 khối bất biến và **chèn vào đầu 100% prompt ảnh**:

```
[IDENTITY LOCK — DO NOT ALTER]
@NUCHINH: 26. Oval face, warm tan skin.
Single-fold almond eyes slightly downturned, straight nose bridge, full lower lip.
Small mole below the outer corner of the left eye.
Black hair, shoulder-length, center part. Athletic build, 7.5-head proportion.
Quiet stubborn intensity.
[END IDENTITY LOCK]

Setting: ... / Action: ... / Style: ...
```

**Vì sao phải app ghép chứ không để thợ tự viết:** thợ diễn giải lại theo lời của nó ở từng block → 16 block = 16 mô tả khác nhau = 16 khuôn mặt. App ghép thì 16/16 giống nhau **đến từng ký tự**.

**Luật cho người viết prompt:**
- Khối anchor đứng ĐẦU, tách bạch, **không trộn** với bối cảnh/hành động.
- Sau khối đó **CẤM tả lại** mặt/ngũ quan/dáng bằng lời của bạn — mô tả chồng lấn sẽ xung đột và làm loạn mặt.
- Chỉ viết phần **MỀM**: bối cảnh → hành động → phong cách hình ảnh, theo đúng thứ tự, mỗi phần một khối.

## Quy ước @tag trong prompt (BẮT BUỘC — giống 5 nguồn)

Khi prompt nhắc tới nhân vật/đạo cụ đã có asset, PHẢI:
- Nhúng `@Tag` tại đúng vị trí. VD: *"in @ADIL's eyeline"*, *"@REMOTE stays normal household remote size"*.
- Với asset khóa cứng, thêm câu khẳng định nhất quán:
  *"Wardrobe/face comes from the @ADIL reference and stays identical across the whole take."*
- KHÔNG mô tả lại mặt/dáng bằng lời khi đã có @tag — để @tag + khối anchor + ảnh tư liệu lo.

## Ai tạo tag?

`assetDeriver` (cổng NGUYÊN LIỆU / gate_assets) TÁCH @tag TỪ kịch bản final: đọc toàn văn narration (`read_script_full`) rồi `derive_assets` cho nhân vật/bối cảnh/đạo cụ LẶP LẠI thật sự có trong kịch bản. `ideaAnalyst` (gate0) CHỈ chốt ý đồ — KHÔNG tạo cảnh, KHÔNG tạo @tag.

Ngay sau `derive_assets`, cùng thợ đó gọi `lock_identity` cho từng `char`/`product`. **Không được để trống chờ người dùng**: cổng Nguyên liệu sẽ CHẶN chốt khi còn tag chưa khóa (`read_asset_coverage.missingIdentity`). Ảnh tư liệu người dùng bổ sung sau là lớp *cộng thêm*, không thay được hồ sơ chữ.

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
