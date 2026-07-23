# Nâng cấp nền Danh Script — Thiết kế (làm dày thợ + cơ chế nền "như Toonflow")

> Ngày: 2026-07-23 · Nhánh: `feature/foundation-upgrade`
> Mục tiêu người dùng: "thợ/agent/skill dày, kỹ thuật xịn, nền cứng cáp như Toonflow".

## Bối cảnh & chẩn đoán

App **Danh Script** (Electron/TS, dừng-ở-prompt) có **đồ nghề tốt** nhưng **thợ non + nền thiếu cơ chế tự bảo vệ**. Đối chiếu với Toonflow (bản `E:\Toonflow-viet`) rút ra 5 khoảng cách nền:

1. **Thợ sát đầu ra mỏng**: `assetDeriver` (~44 dòng), `imgPrompter` (~61), `vidPrompter` (~75) chưa có "khung output bắt buộc". Toonflow: thợ 154–419 dòng, có "vốn nghề" đánh số + template ép output.
2. **Không có gác điểm**: reviewer chấm A/B/C/D nhưng **chấm D vẫn chốt cổng được** (`confirmGate` chỉ kiểm coverage). Không tự sửa, không chặn.
3. **Không validate output LLM**: handler cast `as` lỏng, `JSON.parse` nuốt lỗi im lặng → dữ liệu bẩn vào DB, lộ muộn.
4. **Hai đường chạy trùng**: `GATES` (gates.ts) vs `CHAT_GATES` (gateChat.ts) khai báo tool+layer cùng thợ **2 nơi** → dễ lệch. Docs cũ còn nói "gate0 tạo cảnh/@tag" (ngược luật mới).
5. **Nhất quán chỉ là chữ**: @tag lưu chuỗi tự do trong `variations_json.tag`, sai chính tả = asset mồ côi, không lá chắn kỹ thuật.

**Điểm mạnh phải GIỮ:** lớp chung `byteplus-spec.md` (16.8KB), `storyboard-craft.md` (14.7KB), `consistency.md`, `craft-photography.md` — chất lượng cao. Kiến trúc "linh hồn trong markdown": sửa hành vi = sửa `.md`, không đụng `src/`.

## Quyết định đã chốt với người dùng

- **Làm hết cả 4 mảng** (không bỏ mảng nào).
- **Cơ chế review: CHỈ CHẶN, KHÔNG tự sửa** (rẻ LLM, đơn giản). Reviewer chấm D → chặn chốt cổng + báo rõ; người dùng tự yêu cầu sửa.
- **Thứ tự: Phase 1 → 2 → 3 → 4** (dọn nền trước, làm dày giữa, chặn gate cuối).

## Nguyên tắc kỹ thuật xuyên suốt

- Ưu tiên sửa **markdown** (an toàn, không vỡ app). Code chỉ thêm khi bắt buộc.
- Mỗi phase là 1 khối độc lập: xong → gate nghiệm thu (`npm run typecheck` EXIT 0 + `npm run build` EXIT 0 + grep .md) → mới qua phase sau.
- Không thêm thư viện nặng (không zod). Validate bằng guard tay theo type có sẵn trong `shared/types.ts`.
- Giữ ranh giới "dừng-ở-prompt": không thêm gọi API render.

---

## PHASE 1 — Dọn nền kỹ thuật

**Mục tiêu:** một nguồn sự thật cho spec thợ; chống rác output; hết nuốt lỗi im lặng; docs khớp luật.

### 1.1. Gộp nguồn tool/layer trùng (DRY)
- Hiện `directorPlanner/assetDeriver/imgPrompter/vidPrompter` khai báo tool+layer ở **cả** `gates.ts:79-152` **và** `gateChat.ts:93-162`.
- Tạo `src/main/pipeline/workerSpecs.ts`: 1 bảng `WORKER_SPECS: Record<string, { tools: string[]; layers: string[] }>`.
- `gates.ts` (GateSpec) và `gateChat.ts` (ChatGateSpec) đọc `tools`/`layers` từ bảng chung này; giữ phần riêng (buildPrompt/kickoff/stage) tại chỗ.
- Kết quả: sửa quyền tool 1 nơi → cả 2 đường chạy đồng bộ.

### 1.2. Validate output LLM (chống rác) — guard tay
- Thêm `src/main/tools/validators.ts`: mỗi write-tool trọng yếu có 1 guard kiểm field bắt buộc + kiểu cơ bản (số là số, mảng không rỗng khi cần).
- Guard chạy TRONG handler write-tool: sai → `throw` với thông điệp tiếng Việt rõ (field nào, kỳ vọng gì). `agentRunner` đã bắt lỗi tool và đẩy `is_error` cho LLM đọc → LLM tự sửa lượt sau (không cần retry engine mới).
- Phạm vi guard (đúng chỗ dễ bẩn nhất): `write_skeleton` (beats không rỗng, mỗi beat có order/role/summary), `write_director_plan` (line_count/char_count/emotion_intensity là số), `write_video_prompt` (đủ trường bắt buộc theo `VideoPrompt`), `plan_shots` (mỗi shot có block_order≥1 + shot_desc), `write_image_prompt` (prompt_en không rỗng).

### 1.3. Hết nuốt lỗi im lặng
- `JSON.parse` bọc catch ở `gates.ts` (params_json/ideal_json), `gate0.ts`, `gateChat.ts` (genre) → thêm `console.warn('[danh-script] <chỗ>: <lý do>')` trong catch. Không đổi luồng (vẫn không chặn), chỉ để lộ vấn đề khi debug.

### 1.4. Sửa docs mâu thuẫn
- `skills/identity-lock.md:~21` "ideaAnalyst tạo tag" → sửa thành "assetDeriver tách @tag TỪ kịch bản (gate_assets)".
- `orchestrator.ts` mô tả `run_worker` gate0 "(ý đồ/bối cảnh)" → "(chỉ ý đồ — KHÔNG tạo cảnh/@tag)".
- Docs `01-KIEN-TRUC.md`, `06-BAN-DO-AGENT-SKILL.md` (nếu có trong repo): thêm ghi chú "CẬP NHẬT: gate0 chỉ chốt ý đồ; tách cảnh ở gate1d, @tag ở gate_assets".

**Gate P1:** typecheck EXIT 0 + build EXIT 0. Test tay: 2 đường chạy đọc cùng WORKER_SPECS (grep xác nhận không còn tool-list literal ở gateChat cho 4 thợ). Guard chặn được input rác (kiểm bằng đọc code, không có test runner).

---

## PHASE 2 — Lá chắn nhất quán @tag

**Mục tiêu:** @tag không còn "niềm tin", có kiểm chứng kỹ thuật.

### 2.1. Kiểm @tag tồn tại thật
- Thêm helper `src/main/pipeline/tagGuard.ts`: `extractTags(text): string[]` (regex `@[\w-]+`) + `checkTagsExist(projectId, tags): { missing: string[] }` (đối chiếu bảng asset qua `projectTagMap`).
- Dùng ở `coverageReport`/`assetCoverage` (đường chặn chốt cổng đã có ở `gateChat.ts:287-330`): block nhúng `@tag` không có trong asset → liệt kê `missing`, đưa vào report của cổng gate2/gate3.

### 2.2. Ép nhúng xuyên cảnh (cờ mềm)
- Mở rộng coverage: block ở gate2/gate3 mà narration/scene có nhân vật nhưng prompt **không nhúng @tag nào** → cờ "⚠ block X thiếu @tag neo nhân vật". Không cứng chặn (tránh false-positive cảnh không người) nhưng hiện rõ trong report để reviewer/bạn thấy.

### 2.3. Làm dày `identity-lock.md` (1.5KB → ~5-6KB)
- Mượn mô hình Toonflow `art_character_derivative.md`: phái sinh phân lớp **L0 (base/mặt-dáng gốc) → L1 trang điểm → L2 tóc → L3/L4 trang phục → L5 phụ kiện**, luật "面容不变/姿态不变" (mặt không đổi/dáng không đổi).
- Quy ước @tag chặt: đặt tên, chống trùng, cách nhúng vào prompt (thay MỌI tên nhân vật trong thân prompt bằng @tag — như luật `@图N` của Toonflow).
- Bảng "giữ / cấm" (R/X) cho nhất quán danh tính.

**Gate P2:** typecheck + build EXIT 0. Grep `identity-lock.md` có mục L0-L5 + R/X. Đọc code: coverage report chứa nhánh `missing tags`.

---

## PHASE 3 — Làm dày 3 thợ sát đầu ra

**Mục tiêu:** 3 thợ mỏng → dày như chuẩn 7 phần; reviewer có template để "phanh".

Khung 7 phần (theo các thợ đã chuẩn như `scriptFinal.md`):
`# Vai trò · ## Công cụ (bảng) · ## Quy trình (tuần tự) · ## Skills (vốn nghề, ĐÁNH SỐ) · ## Ràng buộc red-line · ## Khung output BẮT BUỘC (template) · ## Tự kiểm (checklist)`

### 3.1. `assetDeriver.md` (44 → ~220 dòng)
- Vốn nghề: cách TÁCH nguyên liệu từ kịch bản (nhân vật/bối cảnh/đạo cụ lặp), "thà thiếu hơn thừa", quy tắc character sheet 4-view / scene multi-angle KHÔNG người / prop lưới 2×2, phái sinh L0-L5 (nối identity-lock).
- Template: bảng asset {@tag · role · prompt gốc · biến thể}.

### 3.2. `imgPrompter.md` (61 → ~240 dòng)
- Vốn nghề (rút từ byteplus-spec/craft-photography/consistency đã có, đánh số thành khẩu quyết thợ): 3 đoạn 【画面】→【光影】→【风格】, nhúng @tag, tỉ lệ đầu-thân, ánh sáng 2 lớp, chống lệch nhân vật.
- Template: prompt EN 3 đoạn + khối "NHẤT QUÁN (@tag dùng)".

### 3.3. `vidPrompter.md` (75 → ~260 dòng)
- Vốn nghề (rút từ byteplus-spec/motion-library): STYLE/SCENE/MOTION/AUDIO/CONSTRAINTS, cặp bố cục {khung đầu→khung cuối}, ngôn ngữ máy quay, luật "chuyển định dạng KHÔNG sáng tác", text_overlay theo output_intent (đã có).
- Template: JSON VideoPrompt 7 trường + NEGATIVE dự phòng + TEXT_OVERLAY (điều kiện thương mại).

> Lưu ý: KHÔNG chép lại nội dung lớp chung vào thợ (tránh phình + lệch nguồn). Thợ **trỏ tới** lớp chung + thêm khẩu quyết vận dụng + template. Giữ `{{OUTPUT_INTENT}}`, `{{STYLE_ANCHOR}}` nếu thợ có.

**Gate P3:** typecheck + build EXIT 0 (chỉ sửa .md nên chủ yếu build). Grep 3 thợ có đủ 7 heading + template. Mỗi thợ đúng 1 `{{OUTPUT_INTENT}}` (nếu áp dụng).

---

## PHASE 4 — Chặn gate theo điểm (không tự sửa)

**Mục tiêu:** điểm D không lọt; review có chọn lọc để tiết kiệm LLM.

### 4.1. Chặn chốt cổng theo điểm
- `confirmGate` (hiện chỉ kiểm coverage) đọc thêm review mới nhất của cổng từ bảng `reviews` (đã có `saveReview`).
- Luật: grade **D → CHẶN** chốt cổng (trả lỗi có report). **C → cảnh báo** (cho qua nếu người dùng xác nhận — cờ `force`). **A/B → qua**. Không có review → cho qua (không ép phải chấm).
- UI/handler: thông điệp tiếng Việt rõ "Cổng X đang bị chấm D: <tóm tắt lý do>. Sửa rồi chấm lại trước khi chốt."

### 4.2. Review có chọn lọc (mượn Toonflow "缺资产不审核" + gate rules)
- Không auto-chấm mọi cổng. Đánh dấu cổng **trọng yếu** tự gợi ý chấm: `gate1d_script`, `gate2_image`, `gate3_video`. Cổng khác chấm khi người dùng bấm.
- (Chỉ là gợi ý luồng, không ép — người dùng vẫn chủ động chấm bất kỳ cổng nào.)

**Gate P4:** typecheck + build EXIT 0. Đọc code: `confirmGate` có nhánh đọc grade + chặn D. Test tay mô tả: cổng có review D → confirm trả lỗi; force qua C được.

---

## Rủi ro & giảm thiểu

- **Sửa nhầm luồng chốt cổng** (P4) → làm cuối, sau khi nền chắc; giữ `force` để không kẹt cứng.
- **Guard validate quá gắt** (P1.2) → chỉ kiểm field bắt buộc rõ ràng, không kiểm ngữ nghĩa; thông điệp hướng dẫn LLM sửa.
- **Thợ dày gây phình context** (P3) → thợ TRỎ lớp chung, không chép; đo độ dài mục tiêu, không vượt cần thiết.
- **Toàn bộ có typecheck+build gác mỗi phase**; markdown chiếm phần lớn → rủi ro vỡ app thấp.

## Ngoài phạm vi (không làm lần này)

- Vòng tự-sửa tự động (người dùng chọn "chỉ chặn").
- Web search thật cho `research` (ghi nhận là nợ, làm sau nếu cần).
- Render/generate API (ranh giới cứng của app).
- Progressive disclosure skill (tối ưu context) — cân nhắc sau, không cấp thiết.
