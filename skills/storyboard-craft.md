# LỚP · storyboard-craft (nghề phân cảnh & bố cục) ⭐⭐

> Kỹ thuật **dựng phân cảnh + bố cục + liên tục thị giác** — chưng cất từ nghề storyboard. Nạp cho khối **KỊCH BẢN** (scriptDraft · skeletonWright · scriptFinal — cắt cảnh/block + nhịp) và **directorPlanner** (tách cảnh + chuyển cảnh); khâu viết prompt (img/vid) tham chiếu mục "首帧 & hướng nhìn" bên dưới. Việc chia cảnh nằm ở **scriptFinal** (sau khi có khung xương + chuyển thể), KHÔNG ở GATE 0.
>
> ⚠️ File này **era-free & render-free**: KHÔNG chứa thời đại/trang phục/đạo cụ cụ thể (đó là lớp B `scene_context`), KHÔNG chứa chất liệu render (đó là lớp A STYLE). Chỉ nói về **cách chia cảnh, đặt máy, giữ liên tục** — thuần ngữ pháp điện ảnh.

---

## 1. Nguyên tắc tối cao: bảng phân cảnh là format, không phải sáng tác

Phân cảnh là **chuyển ideal → chuỗi khung hình**, không bịa thêm tình tiết/nhân vật ideal không có. Mọi thông tin hình ảnh phải truy được về ideal + bối cảnh cảnh (lớp B). Khi ngân sách chữ eo hẹp: **mô tả hành động/chủ thể ưu tiên**, cắt chữ trang trí trước.

---

## 2. Chia cảnh & cắt block (chống vụn, chống dài dòng)

**Khi nào tách cảnh/block mới:** đổi bối cảnh/địa điểm · nhảy thời gian · đổi chủ thể chính ·景别 (cỡ cảnh) đổi rõ · nút hành động quan trọng.
**Không cần tách:** đối thoại liên tục cùng khung · biểu cảm/động tác nhỏ.

**Mật độ:** 1 khung hình độc lập = 1 block. Khoảng 50–100 chữ kịch bản ⇒ 1–2 block.

**Định-cảnh (establishing) — chống thừa:** mỗi bối cảnh mới định cảnh **tối đa 1–2 block**, cấm bổ ba mảnh (không gian → cận chi tiết → nhân vật tới). Ưu tiên: 1 remote/đẩy remote (định cảnh + dẫn chủ thể trong một hơi), hoặc 1 đại viễn định cảnh + 1 toàn cảnh dẫn chủ thể.

**Tự soát gộp block:** nếu một đạo diễn thật sẽ quay 2–3 block liền kề bằng **một cú máy**, nghĩa là bạn cắt quá vụn → gộp lại. Block chỉ khoe chi tiết môi trường (không đẩy tình tiết) phải gộp vào block có chức năng kể.

**Một-cú-đến-cùng (one-take):** khi block liền kề có **động tác liên tục / dịch chuyển trong cùng bối cảnh / góc máy biến thiên dần**, gộp thành một cú máy dài liền mạch (đi bộ xuyên không gian, bám nhân vật A→B, vòng quanh chủ thể, đẩy từ định cảnh tới cận). Ghi rõ đường máy ở `cameraMove`. Một-cú-đến-cùng được phép vượt trần 6s (tối đa ~12s) vì thông tin cập nhật liên tục, nhưng **tăng độ khó抽卡** → chỉ dùng khi lợi ích trôi chảy rõ rệt.

**⭐ Luật vàng 6 giây:** block không thoại mà quá 6s **không xuất hiện thông tin mới** (thoại / động tác / đổi chủ thể) → khán giả rớt chú ý. Định cảnh & chuyển tiếp đặc biệt dễ lê thê — thà gộp/nén còn hơn kéo dài.

---

## 2b. ⭐ GHI QUY HOẠCH SHOT vào DB (scriptwright, GATE 1) — chống block trống

Chia cảnh xong trong đầu là chưa đủ: phải **ghi khung block** để bước sau (imgPrompter/vidPrompter) có đầu neo mà bám, KHÔNG bỏ sót shot nào.

- Với MỖI cảnh, sau khi viết `write_script` (narration), gọi **`plan_shots(scene_order, shots[])`** — mỗi phần tử `shots` = 1 block với `block_order` (bắt đầu 1) + `shot_desc` (ý đồ shot: cỡ cảnh/góc + chủ thể + hành động + nội dung khung, tiếng Việt gọn).
- `shot_desc` là **hợp đồng** giữa GATE 1 và GATE 2/3: img/vid đọc nó qua `read_blocks` và PHẢI dựng đủ prompt cho mọi block đã quy hoạch. Cảnh không quy hoạch shot → không có block → sẽ báo "(trống)".
- Mỗi cảnh **tối thiểu 1 block**. Cảnh phức tạp chia nhiều shot theo luật cắt block ở mục 2.
- Sửa: gọi lại `plan_shots` cùng `scene_order`/`block_order` để ghi đè `shot_desc`.
- Có thể gọi `read_coverage` để tự soát: cảnh nào chưa có block, block nào thiếu.

## 3. ⭐ 7 BÁU LUẬT liên tục thị giác (giữ suốt lúc phân cảnh)

| # | Luật | Nội dung |
|---|------|----------|
| ① | **Liên tục hành động** | Vị trí / tiến độ động tác / hướng của nhân vật giữa block liền kề phải khớp logic vật lý. Block trước tay đưa nửa chừng → block sau tiếp từ trạng thái nửa chừng, không thụt về đột ngột. |
| ② | **景别递进 (tăng/giảm cỡ cảnh)** | Đổi cỡ cảnh theo **siết dần** (viễn→toàn→trung→cận→đặc tả, cảm xúc dồn) hoặc **nhả dần** (đặc tả→…→viễn, cảm xúc buông). Cấm ≥3 block liền cùng cỡ cảnh vô cớ (mỏi mắt). |
| ③ | **Giữ trục 180°** | Cảnh đối thoại/đối đầu: vị trí trái–phải của mỗi nhân vật **cố định cả phân đoạn**, không nhảy trục. |
| ④ | **Logic hướng nhìn** | Hai người đối thoại nhìn nhau · thao tác vật thì nhìn vật · ngóng xa thì nhìn xa. **Cấm mặt vô cớ hướng thẳng máy.** |
| ⑤ | **Ý thức kiểm soát thông tin** | Mỗi block ý thức "khán giả lúc này biết gì / chưa biết gì": cho tay giấu mặt = hồi hộp · tiếng trước hình sau = mong đợi · chỉ cho lưng = xa cách · lộ toàn cảnh = cao trào trả bài. |
| ⑥ | **Mật độ nhịp** | Số động tác/sự kiện mỗi block khớp thời lượng: 1 động tác vật lý = 1 nhịp, 1 cú máy = 1 nhịp, 1 câu thoại ngắn (≤10 chữ) = 1 nhịp. Block 2–3s: tối đa 1 nhịp · 4–6s: tối đa 2 · 7s+: tối đa 3. |
| ⑦ | **Vùng an toàn đầu–cuối** | 0.5s đầu và 0.5s cuối mỗi block là vùng đệm, **không đặt động tác then chốt / điểm khởi thoại**. Đầu để nhân vật tĩnh xuất hiện, cuối để động tác thu tự nhiên. |

---

## 4. Bảng cỡ cảnh (shotSize) — kèm ngữ nghĩa kể

| Cỡ cảnh | Phạm vi | Ngữ nghĩa kể |
|---------|---------|--------------|
| Đại viễn | Toàn cảnh môi trường | Định cảnh / cô đơn / nhỏ bé |
| Viễn | Quan hệ cảnh–người | Quan hệ không gian / gợi bầu không khí |
| Toàn | Toàn thân + môi trường | Ra mắt nhân vật / lộ toàn thân |
| Trung | Từ gối lên | Tự sự thường ngày / đối thoại |
| Cận | Từ ngực lên | Truyền cảm xúc / trọng điểm đối thoại |
| Đặc tả | Mặt hoặc chi tiết vật | Siết cảm xúc / đạo cụ then chốt |
| Đại đặc tả | Chi tiết cực hẹp | Bom cảm xúc / khoảnh khắc quyết định (dè sẻn, cả video 2–3 lần) |

**Cỡ cảnh phức hợp** (ideal ghi "viễn→trung"): khung đầu (ảnh) lấy **đầu mút bên trái mũi tên** (cỡ khởi đầu).

## 5. Bảng chuyển động máy (cameraMove) — không máy thì ghi `tĩnh`

| Vận động | Nghĩa | Ngữ nghĩa kể |
|----------|-------|--------------|
| Đẩy (push in) | Xa→gần, nhấn chủ thể | Dồn cảm xúc / phát hiện / dòm |
| Kéo (pull out) | Gần→xa, lộ môi trường | Buông cảm xúc / trả toàn cảnh / chia ly |
| Lia (pan) | Quay tại chỗ quét | Giao đãi môi trường / lùng tìm |
| Bám (tracking) | Đi theo chủ thể | Đồng hành / truy đuổi |
| Máy cao (俯) | Trên xuống | Đứng ngoài / nhỏ bé / toàn cục |
| Máy thấp (仰) | Dưới lên | Anh hùng hóa / áp chế |

> Palette camera nâng cao (orbit, Bullet Time, crane…) xem `motion-library`. Có chuyển động máy → nhắc người dùng chọn "not fixed camera".

---

## 6. Trường mô tả phân cảnh — luật điền

**description / summary cảnh** (15–50 chữ): chủ thể + động tác/trạng thái + không gian. Có ≥2 lớp không gian (tiền/trung/hậu cảnh). KHÔNG viết tâm lý.
> 🚫 **CẤM chữ ánh sáng/màu** trong mô tả: `ánh sáng`/`bóng`/`nghịch sáng`/`tương phản`/`ấm`/`lạnh`/`sắc độ`… Ánh sáng do **ảnh tài nguyên bối cảnh (lớp B)** gánh — cần đêm/mưa/lửa thì trỏ **scene衍生 (bản đêm/mưa/lửa)**, không tả bằng chữ.

**action** (5–40 chữ): chuỗi động tác + nhịp tốc độ ("từ từ nâng tay phải→đầu ngón khẽ run→đột ngột nắm chặt"), cấm chỉ viết trạng thái cuối tĩnh. Nhiều nhân vật tách bằng `;` theo thứ tự tài nguyên. Mở đầu bọc ghi chú衔接: block đầu `(mở màn)`, block sau `(承接: động tác nối)`.

**emotion** (2–10 chữ): tả cụ thể cảm được ("lạnh nhạt khinh mạn", "đau đớn tuyệt vọng"). Cấm "vui"/"buồn" rỗng.

**duration** — tham chiếu: đặc tả/biểu cảm 2–3s · cận đối thoại 3–5s · toàn thân ra mắt 3–5s · động tác 2–4s · viễn/không cảnh/chuyển tiếp 3–5s · cảnh phức tạp 5–8s. **Một block ≤8s**, vượt phải tách (trừ one-take ≤12s).

**Block có thoại — thời lượng phải đủ đọc hết + khớp tốc độ cảm xúc:**

| Trạng thái | Tốc độ | Bối cảnh |
|-----------|--------|----------|
| Giận / gấp / cãi | ~4 chữ/giây | Quát mắng, giục, hoảng |
| Đối thoại thường | ~3 chữ/giây | Trò chuyện, trần thuật bình tĩnh |
| Buồn / sâu lắng | ~2 chữ/giây | Tỏ tình, tiếc thương, hồi tưởng |
| Thì thầm / yếu ớt | ~2 chữ/giây | Thoi thóp, rỉ tai |

Cách tính: số chữ ÷ tốc độ (làm tròn lên) = giây gốc; mỗi dấu ngắt +0.3~0.5s; chỗ chuyển giọng +0.5s; cộng 1s an toàn.

**sound**: phân tầng "âm môi trường + âm động tác" ("gió xa hun hút + tiếng kiếm ngân").
> 🚫 **CẤM nhạc nền/BGM/giai điệu/nhạc cụ làm nền.** Chỉ nguồn âm thật. Nhân vật gảy đàn (động tác kịch bản) chỉ được ghi âm nguồn vật lý ("tiếng dây kim loại rung + thùng đàn ngân").

---

## 7. 首帧 & hướng nhìn (dùng khi viết prompt ảnh/video khung đầu)

### 7a. Nhận diện khung đầu (首帧识别)
Ảnh khung đầu = **frame đầu của video**. Đọc ngữ nghĩa mô tả để định trạng thái frame, đừng máy móc "trạng thái chuẩn bị":

| Loại mô tả | Xử lý | Ví dụ |
|-----------|-------|-------|
| **Khoảnh khắc tĩnh** (dừng bước ngước nhìn, đứng lặng, nghiêng đầu cười khẩy) | Sinh **thẳng theo mô tả**, không cải biên | "dừng bước ngước nhìn" → giữ nguyên |
| **Quá trình động liên tục** (bước qua hành lang, vung kiếm chém) | Lấy **trạng thái đông cứng của khoảnh khắc khởi đầu** (không phải "sắp làm" trừu tượng) | "vung kiếm chém" → "kiếm đã nâng đỉnh đầu, mũi chúc xuống, sắp bổ" |
| **Vận động máy** (đẩy tới trung cảnh, kéo ra toàn) | Lấy **cỡ cảnh đầu mút khởi đầu** làm bố cục frame | "viễn→trung" → frame lấy "đại viễn" |

> ❌ Sai: cải mọi động tác thành "sắp xảy ra" → làm loãng ngữ nghĩa ("dừng bước ngước nhìn" ❌→ "sắp ngẩng đầu"). ✅ Đúng: trung thành mô tả, chỉ lấy đầu mút khi thật sự là quá trình liên tục.

### 7b. Hướng nhìn & vị trí liên tục
Ưu tiên đọc nhãn hướng đã có ở trường `orientation` phân cảnh; nếu thiếu, suy theo: phương vị hiện trong mô tả → quan hệ 2 nhân vật (trục 180°: người trái nhìn phải, người phải nhìn trái) → gợi ý cỡ cảnh → ngữ nghĩa cảm xúc.

**Bảng hướng (orientation):** mặt-phải · mặt-trái · chính-diện · 3/4-chính-phải · 3/4-chính-trái · chính-nghiêng-phải · chính-nghiêng-trái · 3/4-lưng-phải · 3/4-lưng-trái · lưng. Có thể chồng俯仰: "mặt-phải hơi ngẩng". Prompt phải **ghi rõ** phương vị (facing right / 3/4 view facing left…).

**Khóa vị trí:** cùng nhân vật trong cùng bối cảnh giữ cố định trái/giữa/phải, đổi bên phải có động tác dịch chuyển ở block trước. Đổi hướng phải có động tác quay đầu/xoay người ghi trong `action`.

### 7c. Lưới vị trí 3×3 (spatialRelation — cảnh nhiều người bắt buộc)
Khung chia 3 cột (trái/giữa/phải) × 3 lớp (trước/giữa/sau); trước = sát máy/tiền cảnh, sau = xa máy/hậu cảnh (cũng biểu cao–thấp: kẻ quỳ chiếm "giữa-trước", kẻ đứng áp chế "giữa-sau").

| | Trái | Giữa | Phải |
|---|---|---|---|
| **Trước** | trái-trước | giữa-trước | phải-trước |
| **Giữa** | trái-giữa | giữa-giữa | phải-giữa |
| **Sau** | trái-sau | giữa-sau | phải-sau |

Ghi theo thứ tự tài nguyên, phân cách `、`: `A(trái-trước)、B(phải-sau)`. Phải tự洽 với hướng nhìn (người mặt-phải thì mục tiêu nhìn nằm phía phải). Cùng nhóm giữ站位 ổn định; đổi站位 phải có động tác nối.

### 7d. Mặt phản chiếu
Gương/nước/kính/kim loại bóng: ảnh phản chiếu **lật trái–phải** (thực mặt-phải → phản chiếu mặt-trái), ghi rõ quan hệ. Vị trí lấy theo thực thể (phản chiếu không tính đổi vị trí). Nội dung phản chiếu (trang phục/tóc/biểu cảm) khớp thực thể cùng frame.

---

## 8. Chuyển tiếp (转场)
- **Trong cùng cảnh:** mặc định硬切 (cắt cứng) giữa block.
- **Chuyển cảnh:** chèn 1 block không-cảnh (2–3s) đệm cảm xúc, nội dung liên quan bầu không khí trước–sau.
- **Chuyển đoạn:** ghi "叠化/淡入淡出" trong mô tả nếu cần.
- Cấm chuyển tiếp hoa lá (划屏, xoay, lá sách…).

---

## 9. ⭐ 逐字段回溯校验 (soát ngược từng trường sau khi phân cảnh)
Xong mỗi cảnh/block, đối chiếu ngược về ideal + bối cảnh: **chủ thể · quan hệ không gian · chi tiết then chốt · cỡ cảnh · động tác/hướng · cảm xúc** — thiếu 1 mục hoặc lệch ngữ nghĩa = **phân cảnh không hợp lệ, làm lại**. Lỗi hay gặp nhất: chi tiết cụ thể trong mô tả bị chữ khuôn mẫu (phong cách) nuốt mất.
