# TOONFLOW ANALYSIS — Kiến thức cốt lõi để nâng cấp Danh Script
> Tổng hợp từ việc đọc TRỰC TIẾP source Toonflow gốc tại
> `C:\Users\Admin\Downloads\Toonflow-app\data\skills\` + `src\agents\`
> (3 agent khảo sát song song). Đây là "bộ não" để viết skill thợ cho đúng chất.

---

## A. VÌ SAO TOONFLOW SÂU HƠN — 4 NGUYÊN NHÂN GỐC

### 1. Skill thợ đồ sộ gấp ~10 lần
- `script_execution_skeleton.md` = **27KB (~400 dòng)**.
- `script_execution_script.md` = **24KB**.
- Skill Danh Script tương ứng (trước nâng cấp): **21–30 dòng**.
- Mỗi skill Toonflow theo **khung 7 phần cố định**. Hai phần quyết định độ dài mà Danh Script từng thiếu hẳn:
  - **`## Skills`** (thư viện kỹ thuật đánh số nhiều mục con): skeleton có 9 nhóm, script có 8+ nhóm → cho agent "vốn nghề" để viết sâu.
  - **`## 输出格式规范` (Template output BẮT BUỘC)**: ép agent điền theo khung nhiều mục có tiêu đề → khiến output LUÔN dài & đủ mục, KHÔNG phụ thuộc tâm trạng model. ĐÂY là đòn bẩy quan trọng nhất.

### 2. Nối context bằng TOÀN VĂN (không digest)
- Mỗi execution agent, bước ĐẦU TIÊN, gọi `get_planData`/`get_flowData` đọc lại **nguyên văn** sản phẩm bước trước (kiểm chứng `scriptAgent/tools.ts:71-75` trả full text).
- Danh Script cũ nhồi `scenesDigest` (rút gọn) vào prompt → **mạch đứt**.
- FIX đã làm (Mảng 4): xóa `scenesDigest`, ép mỗi thợ tự `read_plan`/`read_script_full`/`read_scenes` ở bước 1.

### 3. Reviewer là file 17–20KB
- `script_agent_supervision.md` (20KB) + `production_agent_supervision.md`: tiêu chí chấm chi tiết theo TỪNG giai đoạn → "phanh chất lượng".
- Danh Script cũ: reviewer 50 dòng, chỉ bắt red-line cấu trúc, không đòi độ sâu → không có phanh.
- FIX đã làm (Mảng 5): reviewer.md nâng lên 3 lớp + phanh độ đầy đủ khung output.

### 4. Khung 7 phần thống nhất mọi thợ (xem mục B).

---

## B. KHUNG 7 PHẦN CHUẨN (áp cho MỌI thợ)

1. **Vai trò** — 1 câu: thợ này là ai, làm 1 việc gì, chạy sau/trước bước nào.
2. **## Công cụ** — bảng `| Tool | Khi dùng |`. Bước 1 luôn là tool đọc toàn văn.
3. **## Quy trình** — các bước TUẦN TỰ; **bước 1 LUÔN = đọc lại toàn văn bước trước** (`read_plan`/`read_script_full`/`read_scenes`/`read_draft`/`read_ideal`).
4. **## Ràng buộc cứng (red-line)** — điều CẤM riêng của thợ (❌) + điều BẮT BUỘC (✅).
5. **## Skills (vốn nghề)** — thư viện kỹ thuật ĐÁNH SỐ nhiều mục con. Phần cho phép viết SÂU. Càng nhiều "khẩu quyết"/bảng/công thức cụ thể càng tốt.
6. **## Lưu ý & Tự kiểm** — checklist `- [ ]` nội bộ, KHÔNG xuất ra người dùng.
7. **## Khung output bắt buộc** — template Markdown nhiều mục có tiêu đề mà thợ PHẢI điền → ép output dài & đủ. Reviewer dựa vào các mục này để "phanh".

**Mẫu chuẩn đã đạt trong Danh Script:** `skills/free/_execution_skeletonWright.md`, `_execution_scriptFinal.md`, `_execution_directorPlanner.md`. Copy cấu trúc từ đây.

---

## C. CÔNG THỨC TẠO HÌNH (cho assetDeriver + imgPrompter + visual-system)

### Nhân vật GỐC = character sheet 4 view ngang
- 4 view: **chân dung cận / chính diện 0° / nghiêng 90° / sau lưng 180°**.
- Nền trung tính **`#F8F4E8`** (giữ chuẩn Danh Script), **mặt mộc** (no makeup).
- **Khai báo chiều cao + tỉ lệ đầu-thân**: nữ 155–165cm / 6–6.5 đầu; nam 170–180cm / 6.5–7.5 đầu.
- KHÔNG cắt đầu/chân. KHÔNG ánh sáng/màu cụ thể (để nền trung tính, ghép sau).

### Nhân vật PHÁI SINH = hệ lớp L0-L5
- L0 mặt (giữ NGUYÊN) → L1 trang điểm → L2 tóc → L3 trung y (đồ trong) → L4 ngoại y (đồ ngoài) → L5 phụ kiện.
- Ranh giới NGHIÊM: derivative nhân vật **KHÔNG chứa bối cảnh/đạo cụ/động tác**.
- Phái sinh = img2img trên ảnh gốc, giữ mặt + dáng, chỉ đổi 1 lớp.

### Bối cảnh GỐC = 1 main view
- 前景/中景/后景 (tiền/trung/hậu cảnh) + không khí phối cảnh.
- **CẤM MỌI BÓNG NGƯỜI** trong ảnh scene.
- Multi-angle nằm ở **biến thể** (4 trục: cỡ cảnh / thời điểm / thời tiết / góc).

### Đạo cụ = lưới 2×2
- 4 ô: chính diện / nghiêng / sau / cận chi tiết.
- CẤM tay/cầm nắm/người.
- Đạo cụ **KHÔNG phái sinh**.

### Luật phái sinh chung
- Mỗi asset gốc **1–5 biến thể, "thà thiếu hơn thừa" (宁缺勿滥)**.
- Cảnh nào không đổi → không phái sinh.

---

## D. VISUAL SYSTEM (cho visual-system.md — theo `director_planning_style.md`)

### Color Script — bảng màu TỪNG cảnh
Mỗi cảnh 1 mốc: `scene_order · palette (màu chủ đạo cụ thể) · emotion · contrast (cao/thấp) · saturation (rực/trầm)`.
- **Đường màu có ARC**: đi cùng đường cong cảm xúc (mở ấm → giữa lạnh khi xung đột → cao trào tương phản mạnh → kết ấm). Đừng phẳng.

### Hệ ánh sáng nhiều phương án map cảm xúc
- key light hướng nào · cứng/mềm · high-key (sáng đều, tươi) vs low-key (tối, nhiều bóng, kịch tính).
- Nên có **nhiều phương án ánh sáng ứng với nhiều cảm xúc** (không chỉ 1 mô tả tổng).

### Texture & Material
- 2–3 chất liệu định danh giữ "chất" nhất quán (da, vải thô/mịn, kim loại, gỗ, kính…).

### Luật
- Color Script bám cảm xúc kịch bản (đọc director plan) — không tô tùy hứng.
- Màu/ánh sáng để **ảnh scene mang**; nhân vật/đạo cụ gốc nền trung tính, KHÔNG nhét màu.

---

## E. PROMPT CRAFT (cho imgPrompter + vidPrompter)

### Luật 3 đoạn + phân bổ độ dài (từ `storyboard_prompt_techniques.md`)
- Prompt = 3 đoạn: **【Hình ảnh】【Ánh sáng】【Phong cách】** (hoặc 6-phần: Subject/Camera/Environment/Lighting/Style).
- **Đoạn Hình ảnh (Subject+Environment) DÀI NHẤT · đoạn Style NGẮN NHẤT.**
- Nếu đoạn Style dài hơn đoạn Hình → **prompt HỎNG**.
- STYLE tuyệt đối KHÔNG chứa từ thời đại/trang phục/nơi chốn (đó là lớp Environment).

### @reference — gán vai (Seedream/Seedance)
- Seedance không đoán vai trò file → gán bằng cú pháp `@`: `@LAN's character as the subject` · `scene references @SHOP` · `product details reference @SERUM`.
- Bối cảnh lặp lại: `scene references @QUANCAFE, keep the location identical to its reference` + truyền @tag trong mảng `tags`.
- Có ảnh tham chiếu → prompt NGẮN LẠI (đừng tả lại mặt/dáng bằng lời, để @tag lo).

### Image-to-video (luật vàng)
- Đã có ảnh khung đầu (GATE 2) → trường `motion`/`scene` CHỈ tả CHUYỂN ĐỘNG & THAY ĐỔI.
- ❌ "a woman in red dress standing by window" (tả lại vật đứng yên).
- ✅ "she slowly turns her head as curtains gently blow".

### Negative → Constraints (Seedance)
- Seedance KHÔNG đọc negative prompt. Mọi ý "cấm" (mờ, thừa ngón, méo mặt) → viết thành **câu khẳng định** ở trường `constraints`: `sharp focus, five fingers, natural anatomy, stable face, consistent outfit within the scene, no random gibberish text, no watermark`.

### Target engine
- Ảnh: **Seedream** (doubao-seedream). Video: **Seedance** (BytePlus). Coco Studio chỉ chạy BytePlus.
- Tránh từ làm mờ: `film grain`, `imperfect focus`, `heavy motion blur`.

---

## F. NGUYÊN TẮC PORT (Toonflow → Danh Script)
- Toonflow = **tiểu thuyết → phim ngắn** (dài, có phân tập, 付费卡点, 股价级反转).
- Danh Script = **ideal → video ngắn**.
- **PORT:** độ sâu + khung 7 phần + template output + cơ chế đọc toàn văn + công thức tạo hình + reviewer khắt khe.
- **BỎ:** phân tập tiểu thuyết, 付费卡点 (điểm trả phí), twist máy móc "mỗi 3 cảnh 1 bùng nổ", 9 lằn ranh phim ngắn TQ.
- **Nén nhịp:** phim dài 3-15-45 → clip ngắn **3-8-20** (3s một cú chạm cảm xúc, 8s một biến đổi mạch, 20s một kỳ vọng mạnh + chốt).
- **Giữ triết lý:** app DỪNG Ở PROMPT, không render.

---

## G. LUẬT KỸ THUẬT ENGINE (nhớ khi sửa code)
- `scriptFinal` (`gate1d_script`): PHẢI `write_scene_context` (tạo cảnh) TRƯỚC `plan_shots`. Vì `upsertBlock` throw nếu chưa có cảnh (đã kiểm chứng DB).
- @tag chỉ tạo ở `gate_assets` từ kịch bản THẬT (không tạo ở GATE 0).
- `snapshotForGate` (`gates.ts`) gom sản phẩm mỗi stage cho reviewer chấm — đã có mọi case stage mới.
- `read_plan` → `getPlanArtifacts` trả toàn văn (draft/skeleton/adaptation/director/visualSystem).
- `read_script_full` trả toàn văn narration mọi cảnh.
- Reviewer chạy qua `chat()` một phát (không tool-loop), `maxTokens: 1200`.
