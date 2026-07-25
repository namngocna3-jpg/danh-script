# LỚP CHUẨN · VIẾT PROMPT ĐÚNG BYTEPLUS / SEEDANCE 2.x (byteplus-spec) ⭐⭐

> Nguồn: cẩm nang prompt CHÍNH THỨC ByteDance/BytePlus ModelArk — **Seedance 2.0** (bản dịch manual Feishu/Lark) + **Seedance 2.5** (công bố 23/6/2026, GA đầu 7/2026, lên BytePlus API 7/2026). Bản cũ 1.0/1.5 đã lỗi thời — dùng chuẩn 2.x.
> Nạp kèm **imgPrompter** (GATE 2) + **vidPrompter** (GATE 3). Mục tiêu: output đúng ý, ÍT SAI, ăn khớp engine Coco render.
>
> ⚠️ Đây là chỗ cả Toonflow lẫn nhiều tool làm SAI (nhồi tag-soup + trông cậy negative). Đọc kỹ.

---

## 0 · SEEDANCE 2.x LÀ HỆ THỐNG ĐẠO DIỄN, KHÔNG PHẢI Ô "TẢ CẢNH ĐẸP"

Câu tóm cả cẩm nang: **Seedance thưởng prompt CỤ THỂ, phạt prompt mơ hồ.** Nó hành xử như một hệ chỉ đạo (directing system), không như hộp prompt Midjourney.

Phân công điều khiển theo modality:
- **Text** quyết: chủ thể, hành động, bối cảnh, máy quay, style, âm thanh.
- **Ảnh tham chiếu** khi cần khóa danh tính/ngoại hình ổn định (spatial — quyết định KHÔNG GIAN).
- **Video tham chiếu** khi cần khóa timing/chuyển động (temporal — quyết định THỜI GIAN).
- Kim chỉ nam: *"text tốt nhất cho quyết định không gian; video tham chiếu tốt nhất cho quyết định thời gian."*

**Năng lực engine (định cỡ prompt cho hợp):**

| | Seedance 2.0 | Seedance 2.5 |
|---|---|---|
| Độ dài 1 lần sinh | ~4–15 s | **30 s liền mạch 1-pass** |
| Tham chiếu | 9 ảnh · 3 video · 3 audio (≤12 file) | **tới 50 input đa mô thức** |
| Độ phân giải | tới 2K | **native 4K** |
| Audio | native (lip-sync 8+ ngôn ngữ) | **native đồng bộ (sinh cùng latent)** |
| Sửa cục bộ | — | **region-level editing** (sửa 1 vùng khung, không sinh lại cả clip) |
| Máy quay | tốt | **director-grade camera control** |

> Cap kỹ thuật: prompt **≤ 3000 ký tự**. Coco/BytePlus mặc định 720p, 9:16, ~15 s (2.0). App vẫn cắt block ≤15 s ở GATE 1 để an toàn mọi model.

---

## 1 · VĂN PHONG — CÂU TỰ NHIÊN, KHÔNG "TAG SOUP"

Seedance hiểu tốt **câu văn đủ ngữ pháp** (như tả cảnh cho đạo diễn nghe), KHÔNG thích chuỗi từ khóa nhồi dấu phẩy kiểu Midjourney.

- ✅ ĐÚNG: *"A chef in a white uniform chops vegetables with rhythmic knife movements, filmed in a static medium shot from a slightly elevated angle."*
- ❌ SAI (tag soup): *"chef, white uniform, chopping, knife, medium shot, elevated angle, kitchen, photorealistic, 8k, masterpiece"*

Giới hạn thực dụng: **≤ 250 từ/prompt** (dưới xa cap 3000 ký tự), tập trung, không lan man.

**⭐ Trọng số phần đầu:** Seedance đọc nặng nhất phần MỞ ĐẦU prompt → **đặt Subject trước tiên**.

---

## 2 · CÔNG THỨC 6 PHẦN (thứ tự chuẩn)

```
[Subject] → [Motion] → [Camera] → [Environment] → [Lighting] → [Style]
```

1. **Subject** — chủ thể + đặc điểm nổi bật (nhúng `@tag`). Nét nổi bật giúp định vị: "an elderly man", "a girl with glasses".
2. **Motion** — hành động chính, động từ cụ thể + degree adverb (mục 3).
3. **Camera** — cỡ cảnh + góc + kiểu chuyển động máy (mục 4).
4. **Environment** — bối cảnh/nơi chốn (từ lớp B: era/setting/props).
5. **Lighting** — nguồn sáng + chất sáng + không khí (từ craft-photography lớp ánh sáng).
6. **Style** — `{{STYLE_ANCHOR}}` + độ nét. **NGẮN NHẤT** trong 6 phần.

> Ảnh khung đầu (imgPrompter) dùng phần 1,3,4,5,6 (bỏ Motion). Video (vidPrompter) dùng đủ 6.

### 2a · ⭐ ĐÍCH CUỐI = 1 ĐOẠN ENGLISH LIỀN MẠCH (không phải bảng nhãn)

Các trường `scene`/`motion`/`constraints`/`style` là Ô NHẬP NỘI BỘ — app tự ghép chúng thành **1 đoạn văn xuôi tiếng Anh** khi xuất. Vì vậy nội dung mỗi ô phải là **câu tiếng Anh hoàn chỉnh, nối liền được**, KHÔNG phải mảnh rời kiểu tag.

- ✅ Mỗi ô = câu/cụm English tự nhiên, tự đứng được, KHÔNG mở đầu bằng nhãn ("Motion:", "The subject...").
- ❌ ĐỪNG lặp ý giữa các ô: `scene` đã khóa @tag thì `constraints` đừng khóa lại lần nữa; `style` có "sharp focus" thì `constraints` bỏ "sharp focus".
- ❌ ĐỪNG viết tiếng Việt / nhãn / hướng dẫn thao tác (upload ảnh, dán CapCut) vào bất kỳ ô prompt nào — app tự in hướng dẫn RIÊNG.

**Hình mẫu đoạn cuối app ghép ra (video có ảnh khung đầu):**
```
@Image1 as the first frame; the single bead of sweat at @CO's hairline detaches and slides
steadily down over the temple to the cheekbone, catching the light. 0–3s the bead travels;
3–6s it stops at the jawline as the camera does an extremely slow dolly-in on the eye, subject
barely moving. Preserve @CO's face exactly, keep the mole and freckles, natural anatomy, one
bead of sweat only. Audio: thin lonely mountain wind, close nasal breathing, a faint single drip.
Style: photorealistic, cinematic lighting, shallow depth of field, natural skin texture.
```
→ Một mạch, không nhãn `STYLE:/SCENE:/MOTION:`, khóa mặt CHỈ 1 lần, `sharp focus` không lặp.

---

## 3 · ĐỘ ADVERB CƯỜNG ĐỘ CHUYỂN ĐỘNG (bắt buộc khi có motion)

`slowly` · `gently` · `smoothly` · `rhythmically` · `steadily` · `quickly` · `explosively` · `softly`.
→ Không ghi "di chuyển" chung chung. Ghi "slowly turns", "gently sways", "explosively leaps then lands softly".

---

## 4 · NGÔN NGỮ MÁY QUAY (thế mạnh Seedance — 2.5 director-grade)

Từ chuyển động máy (tả bằng câu tự nhiên): `push in / slow push` · `pull back / pull away` · `pan left / right` · `tilt up / down` · `track / follow shot` · `orbit / revolve / surround` · `aerial / drone` · `crane up / down` · `dolly in / out` · `Hitchcock zoom (dolly zoom)` · `whip pan` · `one-take / oner`.

**Cỡ cảnh:** `extreme close-up` · `close-up` · `medium close-up` · `medium shot` · `full shot` · `wide / establishing shot`.

→ Chi tiết palette + luật xem **motion-library** (nạp kèm).

> ⚠️ **Đừng ghi "cinematic" chung chung** — engine không hiểu gì cả. Hãy GỌI TÊN cỡ cảnh + 1 chuyển động cụ thể ("slow push-in", "low tracking shot").
> ⚠️ **Khi prompt CÓ chuyển động máy → tham số cơ bản phải chọn "not fixed camera"**. Muốn cực ổn định → ghi `static shot, steady camera on tripod` + fixed camera.
> ⚠️ **Đừng để `static camera` và `orbit shot` trong cùng 1 đoạn** (mâu thuẫn → méo).

---

## 5 · CHUỖI HÀNH ĐỘNG — TEMPORAL MARKERS + PHÂN ĐOẠN THỜI GIAN

**(a) Mốc trình tự** cho hành động nối tiếp: `first ... then ... followed by ... finally`.
- Ví dụ: *"The cat first yawns, then stretches, followed by jumping off the couch."*

**(b) ⭐ Phân đoạn thời gian** (khuyến nghị cho clip ≥10 s — đặc sản Seedance): chia timeline theo giây.
```
0–3s: [mở cảnh] · 3–6s: [diễn biến] · 6–10s: [cao trào] · 10–15s: [kết]
```
- Với Seedance 2.5 (30 s), cứ chia 3 nhịp thô: setup → hành động/reveal chính → khung kết.
- Tránh trộn "chậm + nhanh" mâu thuẫn trong 1 câu.

---

## 6 · MULTI-SHOT vs ONE-TAKE

**One-take (1 cú liền):** ghi `No cuts throughout. One continuous take from start to finish.`
**Multi-shot** (cắt cảnh trong 1 lần sinh): `Cut to` / `Lens switch to` / `Camera cut to`, hoặc đánh nhãn `Shot 1 / Shot 2 / Shot 3`. **Tối đa 2–3 lần** (nhiều hơn dễ vỡ).
- Phải tả **mối liên kết** giữa các shot (cùng nhân vật/không gian).
- Ví dụ: *"[Shot 1] @LAN looks up at the sky. Lens switch to [Shot 2] a close-up of her eyes reflecting the clouds."*

> Lưu ý 2.5: một cú 30 s **một hành động chính rõ ràng** thường ăn hơn nhồi nhiều nhịp. Muốn nhiều nhịp → phân đoạn thời gian (mục 5b) thay vì cắt loạn.

---

## 7 · IMAGE-TO-VIDEO — LUẬT VÀNG (khi có ảnh khung đầu / ảnh tham chiếu)

**Có ảnh tham chiếu thì prompt phải NGẮN LẠI, không dài ra.** CHỈ tả CHUYỂN ĐỘNG / THAY ĐỔI. KHÔNG tả lại thứ đã có trong ảnh.
- ❌ Thừa: *"a woman in a red dress standing by a window"* (ảnh đã có sẵn).
- ✅ Đúng: *"she slowly turns her head to look outside as the curtains gently blow in the breeze."*
- Prompt KHÔNG được mâu thuẫn nội dung ảnh / tham số cơ bản.
- Ảnh đơn + text đủ tái tạo chuyển động thật + vật lý vải (cloth physics).

### 7a · ⭐⭐ NGUỒN KHUNG ĐẦU = ẢNH GATE 2 CỦA CHÍNH BLOCK NÀY (không phải ảnh nguyên liệu)

App theo pipeline **image-to-video CHUẨN**: mỗi block ở GATE 2 đã sinh prompt ẢNH KHUNG ĐẦU → người dùng render ra 1 ảnh THẬT của cảnh đó (VD ảnh Cảnh 1.1) → ảnh này chính là **KHUNG ĐẦU (@Image1)** của prompt video block 1.1. KHÔNG phải lấy thẳng ảnh nguyên liệu @LAN/@SERUM làm khung đầu — ảnh nguyên liệu chỉ là tư liệu để DỰNG ảnh khung đầu ở GATE 2.

```
Cảnh 1.1 → prompt ẢNH (GATE 2) → render → ẢNH 1.1 ──┐
                                                     ├→ @Image1 (first frame) của video 1.1
Cảnh 1.1 → prompt VIDEO (GATE 3) = LÀM ĐỘNG ẢNH 1.1 ─┘
```

**Prompt video BẮT BUỘC mở `scene` bằng:** `@Image1 as the first frame` (ảnh đã render của chính block này). App tự in dòng `FIRST FRAME: upload ảnh Cảnh X.Y` khi xuất — người dùng đính đúng ảnh đó vào Coco.

### 7b · CÁCH B — GIỮ KHUNG ĐẦU + KHÓA @tag DANH TÍNH (chuẩn app này)

App chọn **Cách B**: vừa dùng ảnh khung đầu (1.1), VỪA giữ @tag nhân vật/sản phẩm + câu khóa danh tính. Lý do: nhân vật cử động mạnh / xoay lộ góc mới / block dài nhiều cut → chỉ ảnh khung đầu dễ trôi mặt; @tag kéo lại.

**Công thức `scene` (video, khi đã có ảnh khung đầu):**
```
@Image1 as the first frame; <CHỈ tả thay đổi/diễn biến — KHÔNG tả lại ngoại hình/bối cảnh/trang phục>
```
**Công thức `constraints` (CHỈ MỘT câu khóa danh tính — KHÔNG lặp):**
```
preserve @LAN's face and outfit exactly, natural anatomy
```
- ⚠️ **CHỐNG LẶP:** viết DUY NHẤT 1 câu khóa danh tính. ĐỪNG cộng dồn nhiều biến thể cùng nghĩa ("stable consistent face" + "preserve @X face exactly" + "100% matches the reference" là **cùng 1 ý** → chọn 1). `preserve @X's face and outfit exactly` đã bao hàm "khớp reference + mặt ổn định".
- Nhúng @tag ở `scene` cho nhân vật/sản phẩm ĐANG diễn (khóa danh tính), KHÔNG nhồi mọi @tag của dự án.
- ❌ VẪN CẤM tả lại mặt/dáng/váy/phòng bằng lời — ảnh 1.1 + @tag lo. Chỉ tả ĐỘNG.
- Block **tĩnh/động nhẹ** (chỉ quay đầu, gió thổi): @tag + câu khóa GỌN 1 câu. Block **động mạnh/nhiều cut**: nhắc lại @tag ở mỗi shot (đó là nhắc VỊ TRÍ theo shot, KHÔNG phải lặp câu khóa mặt).

---

## 8 · ⭐ HỆ THỐNG @ REFERENCE (khóa nhân vật/sản phẩm/style — TRÁI TIM Seedance 2.x)

Seedance KHÔNG "đoán" vai trò của file tham chiếu — **phải GÁN VAI trong prompt bằng cú pháp `@`**. Đây là cơ chế @tag của app (một @TAG = một ảnh tư liệu) áp đúng chuẩn engine.

**Cú pháp gán vai (nguyên văn manual, dùng lại được):**
- `@Image1 as the first frame` · `@Image2 as the last frame`
- `@Image1's character as the subject`
- `scene references @Image2` (dùng bố cục + tông màu của ảnh nền)
- `product details reference @Image3` (giữ hình dạng/chất liệu/nhãn sản phẩm ổn định)
- `wearing the outfit from @Image2`
- `reference @Video1's camera movement` · `reference @Video1's action choreography`
- `video rhythm references @Video1`
- `BGM references @Audio1` · `sound effects reference @Video3's audio`

**Kết hợp nhiều tham chiếu trong 1 prompt (mẫu):**
```
@Image1's character as the subject, scene references @Image2,
reference @Video1's camera movement and pacing, BGM references @Audio1
```

**Câu khóa nhất quán** (kèm sau khi gán vai):
```
same character as @LAN, preserve face and outfit exactly, stable face, natural anatomy
```
- Seedance 2.5 dùng bộ tham chiếu này để **khóa nhân vật/sản phẩm/style xuyên suốt cú quay** (tới 50 input).
- App map @TAG → ảnh tư liệu ở bảng GATE 4; vidPrompter truyền mảng `tags`.

> ⚠️ BytePlus/Dreamina **chặn khuôn mặt người thật nhận dạng được** ở một số chế độ — với chân dung thật, dựa vào ảnh tham chiếu @tag + để Coco xử eKYC/consent, đừng tả mặt danh tính bằng lời.

**⭐ THE MAP TECHNIQUE — bố trí không gian bằng chữ (cảnh dễ "teleport").** Khi ≥2 vật/nhân vật cần vị trí cố định (Seedance hay dời vật lung tung), viết 1 dòng "bản đồ top-down bằng chữ" trong `scene`:
```
layout: @A center-left, @B background-right, @PROP foreground; keep these positions fixed throughout
```
Bản đồ ngôn ngữ ghim vị trí tốt hơn mười câu tả — "a map holds a location down". Camera move sau đó KHÔNG được phá vị trí đã khóa. Block đơn giản 1 chủ thể KHÔNG cần.

---

## 9 · NHẤT QUÁN TRANG PHỤC (lưu ý lớp B)

Câu khóa dùng `consistent outfit **within the scene**` — trang phục giữ nguyên TRONG CÙNG một cảnh. Đổi trang phục giữa các cảnh khác thời đại là ĐÚNG (do lớp B `scene_context`), KHÔNG phải lỗi. Đừng khóa cứng trang phục toàn dự án.

---

## 10 · NEGATIVE → POSITIVE (Seedance KHÔNG đọc negative!)

Manual 2.x **không có trường negative** — `--no blur` vô tác dụng. Chuyển mọi ý "cấm" thành **câu khẳng định** ghi vào trường `constraints`:

| Ý muốn tránh | Viết POSITIVE thay thế (constraints) |
|---|---|
| mờ nhòe | `sharp focus, crisp detail` |
| thừa ngón/chi | `five fingers, natural anatomy` |
| mặt biến dạng | `stable consistent face` |
| đồ đổi loạn trong cảnh | `consistent outfit within the scene` |
| nền méo | `stable coherent background, no distortion, no flickering` |
| vật thể thừa | `no extra objects, clean composition` |
| watermark rác | `no watermark` (watermark AI bịa gần như luôn là rác → cấm được) |

> ⚠️ **KHÔNG cấm cứng `text` / `subtitles` / `lip-sync` / `logos`** — anh có thể MUỐN chúng. Xử lý theo mục 11b (chữ) và 11c (thoại/nói) dưới đây.

> App vẫn GIỮ trường `negative` riêng làm dự phòng (phòng khi Coco đổi sang model có đọc negative như Gemini/Kling). Nhưng với Seedance, **thứ có tác dụng là `constraints`**.

---

## 11 · ÂM THANH — GHI RÕ, ĐỪNG NGỤ Ý (native audio 2.x)

Seedance 2.x sinh âm thanh native. Viết âm thanh **tường minh**, đừng để engine đoán:
- Ví dụ: *"Subtle room tone and one sharp glass tap"* · *"Soft pouring sound and quiet background chatter"* · *"Quiet ambient wind and distant birdsong"*.
- Tham chiếu âm từ video nếu không có file audio: `sound effects reference @Video1's audio`.
- ❌ App **cấm BGM/nhạc nền** (bản quyền) — chỉ âm môi trường + âm hiệu.

---

## 11b · CHỮ TRONG VIDEO (text overlay) — 2 CHẾ ĐỘ, chọn theo dự án

AI dựng chữ hay SAI CHÍNH TẢ, nên KHÔNG cấm chữ, mà tách rõ:

**Chế độ A — chữ dán ở khâu dựng (KHUYẾN NGHỊ cho chữ dài/CTA/giá):**
- Clip render KHÔNG chứa chữ → gắn text chính xác ở CapCut/Premiere.
- App xuất riêng dòng `TEXT OVERLAY: "<chữ chính xác tiếng Việt>"` cho mỗi block để anh dán vào editor.
- Trong `constraints` chỉ chặn CHỮ RÁC ngẫu nhiên, KHÔNG chặn text anh chủ đích: `no random gibberish text` (đừng ghi `no text` chung chung).

**Chế độ B — chữ in thẳng vào clip (baked-in, cho chữ NGẮN như "SALE 50%"):**
- Seedance 2.5 / Nano Banana 2 render chữ khá tốt NẾU ghi **chính xác từng ký tự** trong prompt.
- Cú pháp: `the text "SALE 50%" appears clearly on screen, correct spelling, clean legible font`.
- Chữ càng ngắn càng chuẩn. Chữ Việt có dấu dài → ưu tiên Chế độ A.

> App mặc định **Chế độ A** (an toàn chính tả). Người dùng chọn baked-in thì chuyển B cho block đó.

---

## 11c · NHÂN VẬT NÓI — VOICEOVER vs LIP-SYNC (chọn theo dự án)

Nhân vật xuất hiện & đang nói KHÔNG bắt buộc phải khớp miệng. 3 kiểu:

| Kiểu | Khi nào | Constraint / hướng dẫn |
|---|---|---|
| **Voiceover** (mặc định) | nhân vật nói nhưng lồng tiếng ngoài, không cần khớp âm | `natural speaking facial expression, mouth moves naturally, no forced lip-sync`. Thoại xuất riêng ở GATE 1 để lồng tiếng ở khâu dựng. |
| **Lip-sync thật** | cần khớp miệng từng lời (talking-head, KOL) | Seedance 2.5 có **native lip-sync 8+ ngôn ngữ** → CUNG CẤP thoại cho engine (`@Audio1` hoặc script), KHÔNG cấm lip-sync. Đây là thế mạnh 2.5. |
| **Không nói** | cảnh sản phẩm, B-roll | `mouth closed, no talking` — chỉ khi thật sự không có ai nói. |

> ⚠️ ĐỪNG cấm `no lip-sync` mặc định. Chỉ dùng `no forced lip-sync` cho kiểu voiceover (nghĩa: miệng cử động tự nhiên nhưng không ép khớp âm giả trân). Muốn khớp miệng thật → để 2.5 làm, cấp thoại cho nó.

---

## 11d · LOGO/THƯƠNG HIỆU (không cấm cứng)

- Video sản phẩm có thể CẦN logo thật → dùng ảnh @tag logo (`product details reference @LOGO`), đừng để AI bịa logo.
- Chỉ chặn logo/watermark NGẪU NHIÊN AI tự thêm: `no random logos, no watermark` — KHÔNG ghi `no logos` chung chung nếu dự án cần logo.

---

## 12 · ⭐ SEEDREAM — CHUẨN PROMPT ẢNH (GATE 2, khác Seedance)

> Coco render **ẢNH khung đầu** bằng **Seedream** (doubao-seedream, ByteDance) — KHÁC engine video Seedance. imgPrompter (GATE 2) nhắm Seedream; vidPrompter (GATE 3) nhắm Seedance. Cùng nhà BytePlus nên chung triết lý (câu tự nhiên, cụ thể, @reference, negative→constraints), nhưng ảnh có mấy khác biệt phải nắm:

**Seedream KHÁC Seedance ở đâu:**

| | Seedream (ảnh, GATE 2) | Seedance (video, GATE 3) |
|---|---|---|
| Sinh ra | 1 khung hình tĩnh | clip có thời gian |
| Bỏ phần nào của công thức 6 | **BỎ Motion** (ảnh tĩnh) | dùng đủ 6 |
| Motion/Camera-move | ❌ không có chuyển động máy/chủ thể | ✅ có |
| Audio / lip-sync / temporal | ❌ không | ✅ có |
| Cỡ cảnh / góc máy | ✅ vẫn ghi (bố cục frame) | ✅ |
| @reference | ✅ multi-image, giữ nhân vật/sản phẩm | ✅ |
| Negative | ❌ vẫn KHÔNG đọc → constraints positive | ❌ |
| Độ phân giải | tới **4K** (Seedream 4.0), giữ chi tiết nét | 2K–4K |

**Năng lực Seedream 4.0 (định cỡ prompt):**
- **Multi-reference:** nhận nhiều ảnh tham chiếu cùng lúc để **khóa nhân vật/sản phẩm nhất quán** giữa các khung — nền tảng cho @tag của app.
- **Image editing / region:** sửa cục bộ 1 vùng ảnh giữ nguyên phần còn lại (Coco xử; app chỉ ra prompt).
- Prompt ảnh vẫn **câu tự nhiên ≤250 từ**, đặt Subject trước, KHÔNG tag-soup.

**@reference cho ẢNH (song song mục 8, dùng "as the first frame" đúng ngữ cảnh):**
- `@Image1's character as the subject` — khóa nhân vật.
- `scene references @Image2` — mượn bố cục/tông nền.
- `product details reference @Image3` — giữ hình/nhãn sản phẩm.
- `@LAN as the first frame` — khi ảnh này chính là khung đầu của block video kế tiếp (nối GATE 2→GATE 3).
- Câu khóa: `preserve face and identity from @LAN exactly, sharp 4K detail`.

**Constraints cho ẢNH (positive, thay negative):** `sharp focus, crisp 4K detail, five fingers, natural anatomy, stable consistent face, clean composition, no watermark, no random gibberish text`. Chữ chủ đích xử theo mục 11b.

> ⚠️ Vẫn giữ mọi bất biến: STYLE ngắn nhất & không chứa era (lớp B lo bối cảnh); có ảnh @tag thì prompt NGẮN lại, đừng tả lại mặt/dáng bằng lời; mặt người thật nhận dạng được có thể bị chặn → dựa ảnh @tag + eKYC Coco.

---

## 13 · CẤM
- ❌ Không tag-soup, không nhồi "8k/masterpiece/best quality".
- ❌ Không "cinematic" chung chung — gọi tên cỡ cảnh + chuyển động cụ thể.
- ❌ Không trông cậy negative với Seedance — dùng constraints.
- ❌ Không > 5 nhân vật/cảnh, không đổi cỡ cảnh đột ngột (close-up ↔ wide) trong 1 prompt.
- ❌ Không lệnh chuyển động mâu thuẫn (chậm + nhanh, static + orbit cùng lúc).
- ❌ Không nhét thời đại/trang phục vào STYLE (đó là lớp B) — bất biến toàn app.
