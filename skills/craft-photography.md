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

## 5 · CHẤT LIỆU VẬT LÝ (độ chân thực — KHÔNG phải chất liệu render)

Da: lỗ chân lông thấy được, không quá mài mịn, không phóng đại tì vết (`pore-level skin, not over-smoothed`). Tóc: sợi rõ (`hair strands rendered fine`). Vật liệu: vải/kim loại/gỗ/ngọc có ánh và vân đúng vật lý (`realistic fabric drape, metal reflection, wood grain`). Cấm cảm giác "nhựa/CG giả" trừ khi STYLE chủ đích như vậy (VD clay/3D).

> ⚠️ "Độ chân thực vật lý" ≠ "chất liệu render". Một style 2D anime vẫn cần sợi tóc rõ + vải rủ đúng, nhưng render theo cel-shade. Chất liệu render là việc của STYLE anchor — mảnh này chỉ đảm bảo KHÔNG bị bệt/giả.

---

## 6 · CẤM (thuộc mảnh kỹ thuật này)
- ❌ Không điền thời đại/trang phục cụ thể — luôn `{wardrobe from scene context}`.
- ❌ Không ghi chất liệu render (anime/photoreal/3D) — đó là STYLE.
- ❌ Không tự thêm đạo cụ/nhân vật ngoài ideal.
- ❌ Không dùng từ làm mờ ảnh (`film grain`, `imperfect focus`, `heavy motion blur`).
