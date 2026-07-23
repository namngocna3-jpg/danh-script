# LỚP · làm mềm kiểm duyệt (moderation-softening) ⭐

> Chắt từ **Printfilm `rewritePromptForModeration`**. Mục đích: khi prompt HỢP LỆ nhưng dùng từ dễ khiến bộ lọc BytePlus/Seedance **chặn nhầm** (false-positive), viết lại bằng từ ngữ điện ảnh trung tính để cảnh vẫn ra đúng ý. Nạp kèm **imgPrompter (GATE 2)** + **vidPrompter (GATE 3)**.
>
> ⚠️ Đây KHÔNG phải kỹ thuật lách để tạo nội dung cấm. Ranh giới: chỉ làm mềm **cách diễn đạt** của cảnh hợp lệ (hành động phim, cảm xúc mạnh, y tế, lịch sử…). Nội dung thật sự vi phạm (khiêu dâm, bạo lực đồ họa, hại trẻ em, thù ghét) → **từ chối, báo Sếp**, không viết lại.

---

## 1. Vì sao cần (bối cảnh Coco/BytePlus)
- Bộ lọc quét **từ khóa bề mặt**, không hiểu ngữ cảnh phim → "máu", "đánh nhau", "súng", "khỏa thân nghệ thuật", "chết" bị chặn dù cảnh chính đáng.
- **Mặt người thật nhận dạng được** bị chặn ở một số chế độ (byteplus-spec dòng 148) → dựa ảnh @tag + eKYC của Coco, đừng tả mặt danh tính bằng lời.
- App DỪNG trước render → đây là bước **phòng ngừa** để prompt qua được cửa Coco ngay lần đầu, đỡ抽卡.

---

## 2. Quy trình 3 bước (chạy trước khi ghi prompt)
1. **Quét cờ:** rà prompt tìm từ trong "bảng đỏ" mục 4.
2. **Phân loại:** cảnh có hợp lệ không?
   - Hợp lệ (phim/nghệ thuật/tin tức/y tế/lịch sử) → **viết lại trung tính** (mục 3).
   - Vi phạm thật → **KHÔNG viết lại**, trả cờ đỏ cho Sếp, dừng block.
3. **Giữ nguyên ngữ nghĩa cảnh:** chỉ đổi từ nhạy cảm sang từ điện ảnh, KHÔNG đổi hành động/cảm xúc/bố cục (vẫn tôn nguyên tắc "chuyển format không sáng tác").

---

## 3. Kỹ thuật viết lại (giữ cảnh, mềm chữ)
- **Ngôn ngữ điện ảnh hóa:** thêm khung "a cinematic film scene", "a staged theatrical moment", "practical film effect" để bộ lọc hiểu đây là dàn dựng.
- **Ẩn dụ/gián tiếp hóa yếu tố nhạy cảm:** cho biểu hiện, không cho đồ họa trực diện (xem bảng mục 4).
- **Chuyển sang HỆ QUẢ/PHẢN ỨNG:** thay vì tả hành vi nhạy cảm, tả nét mặt/không khí/kết quả ("căng thẳng dâng trên gương mặt" thay vì tả bạo lực).
- **Trung tính hóa chủ thể:** người thật danh tính → "the character / a person" + dựa ảnh @tag; đừng nêu tên người thật/người nổi tiếng.
- **Giữ cảm xúc bằng ánh mắt & tư thế** (craft-photography) — cảm xúc mạnh truyền qua mắt/thân, không cần từ sốc.

---

## 4. BẢNG LÀM MỀM (từ dễ bị chặn → cách diễn trung tính)

| Ý cảnh hợp lệ | Từ dễ bị chặn | Viết lại trung tính (EN) |
|---|---|---|
| Cảnh đánh nhau phim | `violence, punch, beat, blood` | `a choreographed action sequence, dynamic movement, dramatic impact, stage combat` |
| Vết thương/máu điện ảnh | `blood, gore, wound` | `dark red practical makeup effect, cinematic injury prop` |
| Chết/tử vong kịch | `dead body, corpse, killing` | `a motionless figure lying still, somber dramatic scene` |
| Vũ khí đạo cụ | `gun, knife, weapon` | `a prop firearm / prop blade as a film set piece` |
| Cảm xúc cực đoan | `crying hysterically, screaming in terror` | `tears welling, an intense emotional expression, wide-eyed tension` |
| Thân thể nghệ thuật | `nude, naked` | `an artistic figure study with tasteful covering, silhouette lighting` |
| Chân dung người thật | tên riêng / "real face of X" | `the character (identity from reference @tag)` + để Coco eKYC |
| Y tế/phẫu thuật | `surgery, cutting flesh` | `a medical procedure scene in a clinical setting, professional documentary style` |
| Cháy nổ | `explosion, fire burning person` | `a controlled pyrotechnic film effect, practical fire stunt at a safe distance` |
| Chất kích thích | `drugs, drunk` | `a narrative prop scene, an intoxicated character portrayal (acting)` |

> Nguyên tắc: **cường độ cảm xúc giữ nguyên, độ đồ họa hạ xuống.** Người xem vẫn cảm được kịch tính qua dàn cảnh, không qua từ sốc.

---

## 5. Áp vào 2 cổng
- **GATE 2 (ảnh):** làm mềm ở đoạn mô tả chủ thể/hành động của prompt ảnh.
- **GATE 3 (video):** làm mềm ở trường `scene`; đưa ràng buộc an toàn thành câu khẳng định ở `constraints` (VD `tasteful framing, cinematic staged action`), KHÔNG trông cậy `negative` (Seedance bỏ qua).
- **Người thật (pipeline eKYC/Real Face):** không tả nhận dạng bằng lời, luôn trỏ ảnh @tag + ghi chú "identity handled by Coco eKYC/consent".

## 6. Cấm
- ❌ Không dùng kỹ thuật này để tạo nội dung thật sự vi phạm — cảnh vi phạm thì TỪ CHỐI, báo Sếp.
- ❌ Không đổi hành động/cảm xúc/bố cục cảnh (chỉ đổi cách diễn đạt từ nhạy cảm).
- ❌ Không nêu tên người thật/người nổi tiếng để "gán mặt".
- ❌ Không bịa "film scene" cho nội dung không phải phim nhằm qua lọc gian dối.
