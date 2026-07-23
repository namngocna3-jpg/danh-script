# HANDOFF — NÂNG CẤP DANH SCRIPT LÊN "CHẤT TOONFLOW"
**Cập nhật:** 23/07/2026 · **Model:** Opus 4.8 (9router `cc/claude-opus-4-8`)
**Đọc file này = nắm 100% ngữ cảnh.** Tài liệu chi tiết ở folder `_handoff/` (đọc kèm).

> ⚠️ **CẢNH BÁO TRUNG THỰC:** Công việc **CHƯA XONG**. Mảng 3 mới làm 6/9 thợ.
> Ghi chú "hoàn thành 100%" ở phiên trước là SAI — đã sửa lại bên dưới cho đúng thực tế.

---

## 0. ĐỌC GÌ TRƯỚC (thứ tự)
1. File này (tổng quan + việc còn lại).
2. `_handoff/TOONFLOW-ANALYSIS.md` — **kiến thức cốt lõi**: vì sao Toonflow sâu hơn, khung 7 phần, cơ chế đọc toàn văn, công thức tạo hình. ĐỌC KỸ trước khi viết skill.
3. `_handoff/PROGRESS-DETAIL.md` — bảng done/chưa-done theo TỪNG file + số dòng.
4. Plan gốc: `C:\Users\Admin\.claude\plans\buzzing-tinkering-river.md` (5 mảng đầy đủ).
5. Skill mẫu ĐÃ đạt chuẩn 7 phần để copy cấu trúc: `skills/free/_execution_skeletonWright.md`, `_execution_scriptFinal.md`.

---

## 1. DỰ ÁN LÀ GÌ
**Danh Script** (`C:\Users\Admin\Downloads\APP\APP`) — app Electron/TS/React sinh **PROMPT** tiền kỳ video (kịch bản → nguyên liệu → prompt ảnh → prompt video) rồi **DỪNG Ở PROMPT** (người dùng tự copy sang Coco/Seedream/Seedance tạo ảnh-video, upload ảnh về). KHÔNG bao giờ tự gọi generate_image/generate_video.

**Kiến trúc 3 tầng agent:** Sếp (Decision) → Thợ (Execution, system = skill.md) → Reviewer (Supervision, chấm A/B/C/D).

**Pipeline stage (thứ tự):**
`gate0_ideal` (ý đồ) → `gate1a_draft` (nháp) → `gate1b_skeleton` (khung xương) → `gate1c_adaptation` (chuyển thể) → `gate1d_script` (kịch bản final = **tạo cảnh + bối cảnh + shot** ở ĐÂY) → `gate_director` (đạo diễn) → `gate_assets` (nguyên liệu + @tag + prompt ảnh-asset) → `gate2_image` (prompt ảnh block) → `gate3_video` (prompt video block) → `gate4_export`.

**Mục tiêu nâng cấp:** làm output **sâu bằng Toonflow** + **liên kết bước bằng đọc toàn văn** + **reviewer khắt khe**. KHÔNG bê khái niệm phân tập tiểu thuyết TQ (付费卡点/股价级反转). Giữ triết lý "dừng ở prompt".

---

## 2. TRẠNG THÁI THỰC TẾ (đã soi từng file 23/07)

| Mảng | Trạng thái | Chi tiết |
|---|---|---|
| **1 · Markdown** | ✅ XONG | `Markdown.tsx` áp 8 panel (GateChat/Orchestrator/Prep/ReviewBadge/GateRunner/Gate0). |
| **2 · GATE 0 = ý đồ** | ✅ XONG | `gate0.ts` chỉ ghi `brief`; `Gate0Panel.tsx` hiện ý đồ chốt; `write_scene_context` đã dời sang `gate1d_script`; `snapshotForGate('gate0_ideal')` đọc brief. |
| **4 · Đọc toàn văn** | ✅ XONG | `scenesDigest` + `GateBuildCtx.scenes` đã XÓA; mọi `buildPrompt` = `() =>` ép "BƯỚC 1 BẮT BUỘC: read_*". typecheck sạch. |
| **5 · Reviewer** | ✅ XONG (nhưng bị Mảng 3 kìm) | `reviewer.md` (89 dòng) đã có 3 lớp chấm + RED-LINE stage mới (RI/RK/RA/RV) + "⭐ PHANH ĐỘ ĐẦY ĐỦ KHUNG OUTPUT". |
| **3 · Viết lại 9 thợ + 3 craft** | ⚠️ **CHƯA XONG (6/9)** | Xem mục 3 dưới. **ĐÂY LÀ VIỆC CHÍNH CÒN LẠI.** |

### ✅ 6 thợ ĐÃ đạt khung 7 phần
`ideaAnalyst`(95) · `scriptDraft`(93) · `skeletonWright`(105) · `adaptWright`(111) · `scriptFinal`(135) · `directorPlanner`(109).
→ Đủ: `## Công cụ` (bảng) · `## Quy trình` (bước 1 đọc toàn văn) · `## Ràng buộc cứng` · `## Skills (vốn nghề)` (đánh số) · `## Lưu ý & Tự kiểm` · `## Khung output bắt buộc`.

### ❌ 3 thợ CHƯA viết lại (vẫn khung cũ *Nguyên tắc/Quy trình/Cấm*)
| File | Dòng | Thiếu gì |
|---|---|---|
| `skills/free/_execution_assetDeriver.md` | 44 | Thiếu bảng `## Công cụ` · `## Skills` đánh số · `## Khung output bắt buộc` |
| `skills/free/_execution_imgPrompter.md` | 61 | Như trên (nội dung nghề đã dày, chỉ cần TÁI CẤU TRÚC + thêm template output) |
| `skills/free/_execution_vidPrompter.md` | 75 | Như trên |

### ❌ Craft skill chưa đủ sâu
| File | Dòng | Cần |
|---|---|---|
| `skills/visual-system.md` | 34 | Viết sâu theo `director_planning_style.md`: Color Script bảng có tên+vai trò từng cảnh, hệ ánh sáng nhiều phương án map cảm xúc, texture. |
| `skills/asset-prompt-craft.md` | 83 | Kiểm lại đã đủ 4-view/#F8F4E8/L0-L5/2×2 chưa (có vẻ ĐỦ — xác nhận rồi bỏ qua nếu ok). |
| `skills/storyboard-craft.md` | 157 | ✅ Đã đủ dày (đã bổ sung luật 3 đoạn + phân bổ độ dài). |

---

## 3. VIỆC CÒN PHẢI LÀM (theo thứ tự, làm TUẦN TỰ — đừng bắn song song)

### BƯỚC 1 — Viết lại `_execution_assetDeriver.md` theo khung 7 phần
Giữ nguyên nội dung nghề đang có (tách từ kịch bản, 4-view #F8F4E8, "thà thiếu hơn thừa", L0-L5), CHUYỂN sang 7 phần:
- `## Công cụ` bảng: `read_script_full`/`read_scenes`/`read_assets`/`read_asset_coverage`/`derive_assets`/`write_asset_prompt`/`save_derived_asset`/`write_visual_system`.
- `## Skills (vốn nghề)` đánh số: (1) tách asset trung thực từ narration (2) công thức char sheet 4-view + tỉ lệ đầu-thân (3) công thức scene multi-angle KHÔNG người (4) prop lưới 2×2 (5) hệ phái sinh L0-L5, ranh giới nghiêm (6) luật "thà thiếu hơn thừa" ≤5 biến thể (7) Color Script bám cảm xúc.
- `## Khung output bắt buộc`: template `## 🎨 Nguyên liệu` — bảng asset gốc (tag·loại·prompt✓) + bảng phái sinh + Color Script các mốc màu. **← chính mục này để reviewer PHANH cắn được.**

### BƯỚC 2 — Viết lại `_execution_imgPrompter.md` theo 7 phần
Nội dung nghề (6-phần prompt, @reference Seedream, tách người khỏi cảnh) ĐÃ dày — chỉ TÁI CẤU TRÚC + thêm `## Khung output bắt buộc` (template liệt kê từng block → prompt ảnh).

### BƯỚC 3 — Viết lại `_execution_vidPrompter.md` theo 7 phần
Tương tự: giữ 7 trường video + negative→constraints + image-to-video, thêm `## Khung output bắt buộc`.

### BƯỚC 4 — Viết sâu `visual-system.md`
Theo `director_planning_style.md` của Toonflow (xem `_handoff/TOONFLOW-ANALYSIS.md` mục "Visual System").

### BƯỚC 5 — Xác nhận `asset-prompt-craft.md` đã đủ (đọc, nếu đủ thì thôi).

### BƯỚC 6 — Kiểm thử
```bash
npm run typecheck
```
(skills là markdown → không ảnh hưởng TS; nhưng chạy để chắc engine không vỡ). Rồi `npm run build`. Cuối cùng `npm run dev` để Danh test E2E (mục 6).

---

## 4. KIẾN THỨC CỐT LÕI (tóm tắt — chi tiết ở `_handoff/TOONFLOW-ANALYSIS.md`)

**Vì sao Toonflow sâu hơn (4 nguyên nhân gốc — đã đọc source thật):**
1. Skill thợ Toonflow **~10× dài** (skeleton 27KB vs Danh Script 21 dòng). Mấu chốt là 2 phần: `## Skills` (thư viện kỹ thuật đánh số) + `## Khung output bắt buộc` (template ép điền đủ mục → output LUÔN dài, không tùy hứng model).
2. Toonflow nối context bằng **TOÀN VĂN** (`get_planData` đọc nguyên văn bước trước), KHÔNG digest → mạch không đứt.
3. Reviewer Toonflow là file 17–20KB, chấm theo tiêu chí chất lượng từng giai đoạn → "phanh chất lượng".
4. Khung 7 phần cố định cho mọi thợ.

**Khung 7 phần (BẮT BUỘC mọi thợ):**
1. Vai trò (1 câu) · 2. `## Công cụ` (bảng) · 3. `## Quy trình` (**bước 1 = đọc toàn văn bước trước**) · 4. `## Ràng buộc cứng` · 5. `## Skills (vốn nghề)` (đánh số nhiều mục — phần cho viết SÂU) · 6. `## Lưu ý & Tự kiểm` (không xuất ra) · 7. `## Khung output bắt buộc` (template có tiêu đề).

**Nguyên tắc port (nhớ kỹ):** Toonflow = tiểu thuyết→phim (dài, phân tập). Danh Script = ideal→video ngắn. PORT: độ sâu + khung 7 phần + template + đọc toàn văn + công thức tạo hình. BỎ: phân tập, 付费卡点, twist máy móc mỗi 3 cảnh. Nhịp 3-15-45 (phim dài) → nén thành **3-8-20** (clip ngắn).

**Luật cứng nhớ nằm lòng:**
- `scriptFinal`: PHẢI `write_scene_context` (tạo cảnh) TRƯỚC `plan_shots` — vì `upsertBlock` throw nếu chưa có cảnh.
- @tag chỉ tạo ở `gate_assets` từ kịch bản thật.
- Nhân vật gốc = 4-view nền `#F8F4E8` mặt mộc + tỉ lệ đầu-thân; scene = multi-angle KHÔNG người; prop = lưới 2×2 không tay.
- Prompt: đoạn Hình DÀI nhất, đoạn Style NGẮN nhất (dài hơn = hỏng). STYLE không chứa thời đại.
- Seedance KHÔNG đọc negative → mọi "cấm" viết thành câu khẳng định ở `constraints`.

---

## 5. FILE QUAN TRỌNG CẦN BIẾT (để đọc lại / sửa)

**Engine (TypeScript):**
- `src/main/pipeline/gates.ts` — `GATES` (thợ 1-phát), `snapshotForGate` (gom sản phẩm cho reviewer — CÓ mọi stage mới), `reviewGate`. **`buildPrompt` đều là `() =>` ép đọc toàn văn.**
- `src/main/pipeline/gateChat.ts` — `CHAT_GATES` (hội thoại từng cổng), `READ_TOOLS`, kickoff từng gate, `confirmGate` (chặn chốt nếu thiếu prompt).
- `src/main/pipeline/gate0.ts` — GATE 0 chạy `ideaAnalyst`, chỉ ghi `brief`.
- `src/main/pipeline/orchestrator.ts` — Sếp điều phối (chưa kiểm kỹ — nên soát khớp stage mới).

**Renderer:**
- `src/renderer/src/ui/wizard/Markdown.tsx` — component render markdown (đã có).
- `Gate0Panel.tsx` — hiện "Ý đồ chốt" (đã sửa).
- `GateChatPanel.tsx`, `OrchestratorPanel.tsx`, `PrepPanel.tsx`, `ReviewBadge.tsx`, `GateRunner.tsx` — đã áp Markdown.

**Skills:**
- `skills/reviewer.md` — reviewer nâng cấp (đã xong).
- `skills/free/_execution_*.md` — 9 thợ (6 xong, 3 chưa — xem mục 2).
- `skills/asset-prompt-craft.md`, `visual-system.md`, `storyboard-craft.md` — craft chung.

**Source Toonflow gốc (để tra công thức):** `C:\Users\Admin\Downloads\Toonflow-app\data\skills\` — các file `script_execution_*.md`, `art_character.md`, `art_scene.md`, `art_prop.md`, `director_planning_style.md`, `script_agent_supervision.md`. (Nếu máy nhà không có, xem trích trong `_handoff/TOONFLOW-ANALYSIS.md`.)

---

## 6. KIỂM THỬ E2E (Danh tự làm sau khi code xong)
```bash
npm run dev
```
1. Output render đẹp (hết `**`/`|` thô) ở chat + prep + review.
2. GATE 0 chỉ hỏi–chốt Ý ĐỒ (KHÔNG đẻ cảnh/@tag).
3. Kịch bản final (`gate1d`) mới tạo cảnh + bối cảnh + shot.
4. Mỗi bước hạ nguồn có bước gọi `read_plan`/`read_script_full` trong StepStream (mạch liền).
5. Output mỗi thợ DÀI & đủ mục theo template (khung xương có logline+cảm xúc+payoff; nguyên liệu có 4-view/2×2/Color Script).
6. Reviewer hạ hạng khi thiếu mục bắt buộc (thử xóa 1 mục → điểm tụt).
7. Đóng/mở lại: chat + nguyên liệu + ảnh upload còn nguyên (chung DB).

---

## 7. RÀNG BUỘC LÀM VIỆC (giữ verbatim)
- **Tiếng Việt** mọi output & giao tiếp.
- Danh **không phải dev** → giải thích rõ, tự rà logic.
- **KHÔNG bắn nhiều request song song** (rate-limit) — làm tuần tự.
- App **DỪNG Ở PROMPT** — không gọi API render.
- Model mặc định **Opus 4.8**.
- Ưu tiên **đóng gói local**, không deploy.
- ⚠️ `settings.json` còn plaintext `ANTHROPIC_API_KEY` + token Make.com → **xoay key khi rảnh**, đừng show log ra ngoài.
- Tự kích hoạt skill khớp task.

---
*Agent mới: đọc xong file này + `_handoff/TOONFLOW-ANALYSIS.md`, rồi bắt đầu từ **Mục 3 · Bước 1** (viết lại assetDeriver). Copy cấu trúc từ `skeletonWright.md` đã đạt chuẩn.*
