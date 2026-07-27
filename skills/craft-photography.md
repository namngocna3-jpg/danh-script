# LỚP KỸ THUẬT · CẨM NANG NHÂN VẬT + ÁNH SÁNG (craft-photography) ⭐⭐

> Chắt CHIỀU SÂU kỹ thuật từ Toonflow `art_character.md` + `director_storyboard.md` + `director_planning_style.md`, **đã LỘT SẠCH thời đại/trang phục cổ trang**.
> Nạp kèm **imgPrompter** (GATE 2) + **vidPrompter** (GATE 3). Mục đích: nhân vật NHẤT QUÁN + ánh sáng CÓ CHỦ ĐÍCH, thay vì mô tả chung chung.
>
> ⚠️ **BẤT BIẾN:** Mảnh này CHỈ nói kỹ thuật vật lý (tỉ lệ, chất da, ánh mắt, hướng sáng). Nó **KHÔNG** quy định thời đại, trang phục, kiểu tóc theo thời đại — những thứ đó do **lớp B (scene_context)** quyết định theo từng cảnh. Chất liệu render (2D/3D/người thật) do **STYLE anchor** quyết. Chỗ nào cần trang phục → luôn ghi `{wardrobe from scene context}`, KHÔNG tự điền "áo cổ trang/váy hiện đại".

---

## 1 · TỈ LỆ & GIẢI PHẪU (nhất quán hình thể)

Khóa tỉ lệ để nhân vật không "biến hình" giữa các cảnh. Đây cũng là positive-constraint mà Seedance đọc tốt.

| Hạng mục | Ràng buộc | Từ khóa prompt (EN) |
|---|---|---|
| Tỉ lệ đầu-thân | 7–8 heads (nữ 7–7.5, nam 7.5–8.5) | `7.5 heads tall proportion`, `well-proportioned` |
| Chiều cao | Do nhân vật quy định; đổi ra tỉ lệ đầu-thân | `{height}cm tall`, `tall slender` / `imposing` |
| Bàn tay | Đúng 5 ngón, khớp rõ | `five fingers, natural hand anatomy` |
| Khuôn mặt | Ổn định xuyên cảnh (khóa qua @tag) | `stable consistent face` |
| Cơ thể | Giải phẫu tự nhiên, không thừa chi | `natural anatomy, no extra limbs` |

> Bảng quy đổi nhanh: 160–165cm → ~7.5 heads · 170–175cm → ~7.5–8 · 175–180cm → 8. Đầu ≈ 22cm cố định, chiều cao đổi qua số đầu.

---

## 2 · CHARACTER SHEET 4-VIEW (khóa nhân vật khi @tag CHƯA có ảnh)

Khi 1 `@tag` chưa gắn ảnh tư liệu, imgPrompter được phép sinh **1 prompt "phiếu tạo hình 4 hướng"** để người dùng render ra ảnh chuẩn rồi nạp lại làm ảnh khóa @tag. Đây là cách giữ mặt nhân vật cực chuẩn.

**Khung phiếu (điền chất liệu từ STYLE, KHÔNG điền thời đại):**
```
character design sheet, character turnaround, {gender} character,
{facial traits inferred from character description}, {overall temperament keyword},
{skin/anatomy from section 1}, {hair described neutrally — length + color only, no era styling},
wardrobe per scene context (neutral base outfit, low-saturation, no complex patterns),
four views side by side left-to-right: portrait closeup + front view + side view + back view,
portrait closeup shows head-to-collarbone complete, full-body views show head-to-toe complete, no crop,
neutral grey background #E8E8E8, even soft light, front key + dual fill, no hard shadow,
identical face / body / hair across all four views, no text in image
```

**Luật phiếu:** nền xám trung tính, ánh sáng đều, biểu cảm trung tính, KHÔNG cắt đỉnh đầu/bàn chân, 4 hướng đồng nhất. Trang phục để "nền tối giản" — vì trang phục thật sẽ theo từng cảnh ở lớp B.

---

## 3 · CẢM XÚC → ÁNH MẮT / VI BIỂU CẢM

Đừng chỉ ghi "buồn/vui". Tra bảng để prompt có ánh mắt + vi biểu cảm cụ thể (bê từ Toonflow, dịch trung tính).

| Cảm xúc | Nét mặt (EN) | Ánh mắt (EN) | Vi biểu cảm (EN) |
|---|---|---|---|
| Rung động | flushed cheeks, faint daze | tender lingering gaze | restrained faint smile |
| Buồn / kìm nén | calm sorrowful face | reddened lowered eyes | slightly knit brows, inward look |
| Giận / áp bức | sharp cold features | knife-like forceful stare | tightened lip line, pressing aura |
| Dịu dàng / sâu lắng | gentle warm face | soft focused affectionate eyes | subtle warm smile |
| Kiên định | solemn composed face | firm clear eyes | steady calm brows |
| Ngạc nhiên | startled shifting face | widened suddenly-focused eyes | raised brow tip, parted lips |
| Lạnh lùng / xa cách | cold indifferent face | distant icy gaze | near-frozen expression |
| Vui / hân hoan | vivid lively face, beaming | bright crescent-tail eyes | raised corners, natural liveliness |
| Căng thẳng / hoảng | slightly blank flustered face | wandering darting eyes | faint frown, real tension |
| Nhẫn nhịn | inward composed face | deep eyes with suppressed emotion | tight lips, faint throat movement |

---

## 4 · HỆ ÁNH SÁNG 2 LỚP (môi trường CHÍNH + thiết bị PHỤ)

> Nguyên tắc gốc Toonflow: **ánh sáng môi trường là chủ đạo tuyệt đối**, ánh sáng thiết bị chỉ tạo hình nhân vật và PHẢI phục tùng môi trường. Định môi trường TRƯỚC, rồi mới quyết có cần thiết bị không.

### A · Ánh sáng môi trường theo THỜI ĐIỂM (chính)
| Thời điểm | Nguồn tự nhiên | Xu hướng màu | Không khí |
|---|---|---|---|
| Sáng sớm | tán xạ, sương | lạnh trắng, xanh nhạt | `misty diffused dawn light, cool tone` |
| Ban trưa | nắng chếch tán | trung tính hơi ấm | `soft midday diffused light, dappled shadows` |
| Chiều tà | xiên vàng | lạnh chủ + biên ấm | `low warm rim glow, long stretched shadows` |
| Ban đêm | trăng lạnh + điểm sáng ấm | xanh lạnh chủ đạo | `cool blue moonlight, warm point accents, deep contrast` |
| Mưa/âm u | tán xạ, không nguồn chính | xám lạnh | `overcast diffused cool light, low saturation` |

### B · Ánh sáng môi trường theo KHÔNG GIAN (chính)
Ngoài trời rộng → thiên quang, khí quyển tạo lớp xa. Trong nhà (cửa sổ) → sáng bên một hướng, tối dần vào. Không gian kín → điểm sáng đơn, bóng sâu. → `window side light`, `single warm source deep shadow`, `atmospheric perspective far layers`.

### C · Ánh sáng thiết bị (PHỤ — phục tùng B)
`rim light` (tách nền, cường độ < môi trường), `eye light` (chấm sáng mắt, cực nhẹ), `fill/bounce` (gỡ vùng chết, mô phỏng phản xạ), `top-down pressure` (tạo áp bức, phải có nguồn hợp lý).

### 5 LUẬT tránh xung đột ánh sáng (giữ chặt)
1. **Định môi trường trước, phụ sau.**
2. **Đồng nhất color temp** — đêm lạnh không chèn đèn ấm trừ khi có nguồn ấm hợp lý (nến/đèn) trong cảnh.
3. **Hướng hợp lý** — sáng phụ phải có nguồn trong cảnh (cửa/nến/trăng), không "từ trên trời".
4. **Cường độ phụ ≤ môi trường** — tránh cảm giác "phim trường một mình nhân vật được đánh đèn".
5. **Thà thiếu còn hơn thừa** — môi trường đủ kể chuyện thì KHÔNG thêm đèn phụ.

---

## 5 · ỐNG KÍNH & CỠ CẢNH — ⚠️ CHỈ CHO PROMPT **ẢNH** (Seedream) ⭐

> ⛔ **RANH GIỚI CỨNG — đọc trước khi dùng bảng dưới.**
> Mục này áp cho **prompt ẢNH (GATE 2 · Seedream)**. **KHÔNG áp cho prompt VIDEO (GATE 3 ·
> Seedance).**
>
> Lý do không phải là gu, mà là **hai engine đọc khác nhau**, theo tài liệu chính thức:
> * **Seedream (ảnh)** — hướng dẫn chính thức ghi thẳng thông số máy vào prompt là ĐÚNG:
>   `shot on 85mm lens, f/1.4 aperture, shallow depth of field`. Engine hiểu và dựng đúng.
> * **Seedance (video)** — hướng dẫn chính thức dặn **"đừng ghi thông số kỹ thuật máy quay"**
>   và nêu đích danh `focal length 85mm`, `f/2.8`, `ISO 800`, `24fps` là ví dụ KHÔNG nên viết.
>   Với video, cái engine đọc là **động tác máy + từ nhịp** (`slow`, `smooth`, `stable`,
>   `gradual`, `gentle`) — xem `_execution_vidPrompter.md` mục 4.
>
> Nhồi tiêu cự vào prompt video không giúp gì, mà còn **chiếm ngân sách chữ** của thứ thật sự
> có tác dụng (Seedance nhắm 60–100 từ). Đây là chữ vô ích đẩy chữ hữu ích ra ngoài.
>
> Vì sao mục này vẫn cần cho ẢNH: ô `[CAMERA]` của prompt ảnh mà không có bảng thì thợ gõ bừa
> "cinematic shot" — vô nghĩa với engine. Tiêu cự quyết định **méo mặt hay không** và **nền
> tan hay còn đọc được**, tức ảnh hưởng thẳng tới nhất quán nhân vật, không chỉ thẩm mỹ.

| Tiêu cự | Cỡ cảnh hợp | Hiệu ứng vật lý | Dùng khi | Từ khóa prompt (EN) |
|---|---|---|---|---|
| **24–28mm** | wide / establishing | phối cảnh cường điệu, rìa khung kéo giãn | mở không gian, tốc độ, năng lượng, POV cầm tay | `24mm wide angle, deep focus` |
| **35mm** | wide-medium | gần mắt người, còn đọc được bối cảnh | thiết lập, nhân vật NHỎ trong khung (cô đơn), b-roll đời sống | `35mm, natural perspective` |
| **50mm** | medium | phối cảnh trung tính, DoF vừa | hội thoại, nhịp chính, "như người đối diện" | `50mm, medium shot, soft background separation` |
| **85mm** | medium-close / close-up | **nén nhẹ → mặt đẹp nhất**, nền tan mượt | cảm xúc, chân dung, cận mắt | `85mm portrait lens, shallow depth of field` |
| **100mm macro** | extreme close-up | cô lập chi tiết, bokeh tròn sạch | mắt · tay · giọt nước · texture sản phẩm | `100mm macro, extreme close-up, creamy bokeh` |

### Luật ống kính (giữ chặt)

1. **CẤM <28mm cho cận mặt.** Góc rộng ở khoảng cách gần làm **phình mũi, hẹp tai** — mặt
   biến dạng so với ảnh tư liệu = **trôi mặt do quang học**, dù `@tag` và anchor đều đúng.
   Rộng thì để cho toàn cảnh/bối cảnh, không để cho khuôn mặt.
2. **Càng cận → tiêu cự càng dài.** wide 24–35 · medium 50 · close 85 · macro 100. Ghi
   "close-up, 24mm" là mâu thuẫn tự thân, engine chọn bừa một vế.
3. **Một cảnh một tiêu cự.** Đổi tiêu cự = đổi cut. Nhồi 2 tiêu cự vào 1 prompt liền mạch
   thì model nội suy ra một cái ở giữa, không giống cái nào.
4. **Ưu tiên dolly vật lý hơn zoom.** `dolly-in` giữ nguyên phối cảnh (mặt không đổi hình);
   `zoom in` đổi tiêu cự giữa chừng → tỉ lệ ngũ quan trượt trong cùng một cú máy.
   ↳ Đây là luật DUY NHẤT ở mục 5 **cũng đúng cho video** — nhưng bên video diễn đạt bằng
   TÊN ĐỘNG TÁC (`dolly in` thay vì `zoom in`), không kèm số mm.
5. **Tiêu cự phục tùng gu đạo diễn.** Gu đã chốt "ống kính dài, nén nền" thì đừng chen
   24mm cho hoành tráng — nhất quán thắng ấn tượng lẻ.

> Nhân vật đã có **ảnh tư liệu**: prompt ẢNH vẫn ghi tiêu cự (nó là thông tin QUANG HỌC,
> không phải mô tả ngoại hình) — không xung đột với ảnh, còn giúp ảnh được tái dựng đúng
> góc nhìn.
>
> **Chuyển sang video thế nào:** cỡ cảnh giữ nguyên (`close-up`, `medium shot`,
> `wide establishing shot` — đây là ngôn ngữ điện ảnh, engine video đọc tốt), chỉ **bỏ con
> số mm**. `85mm portrait lens, shallow depth of field` → `close-up, shallow depth of field`.

---

## 6 · CHẤT LIỆU VẬT LÝ (độ chân thực — KHÔNG phải chất liệu render)

Da: lỗ chân lông thấy được, không quá mài mịn, không phóng đại tì vết (`pore-level skin, not over-smoothed`). Tóc: sợi rõ (`hair strands rendered fine`). Vật liệu: vải/kim loại/gỗ/ngọc có ánh và vân đúng vật lý (`realistic fabric drape, metal reflection, wood grain`). Cấm cảm giác "nhựa/CG giả" trừ khi STYLE chủ đích như vậy (VD clay/3D).

> ⚠️ "Độ chân thực vật lý" ≠ "chất liệu render". Một style 2D anime vẫn cần sợi tóc rõ + vải rủ đúng, nhưng render theo cel-shade. Chất liệu render là việc của STYLE anchor — mảnh này chỉ đảm bảo KHÔNG bị bệt/giả.

---

## 7 · CẤM (thuộc mảnh kỹ thuật này)
- ❌ Không điền thời đại/trang phục cụ thể — luôn `{wardrobe from scene context}`.
- ❌ Không ghi chất liệu render (anime/photoreal/3D) — đó là STYLE.
- ❌ Không tự thêm đạo cụ/nhân vật ngoài ideal.
- ❌ Không dùng từ làm mờ ảnh (`film grain`, `imperfect focus`, `heavy motion blur`).
