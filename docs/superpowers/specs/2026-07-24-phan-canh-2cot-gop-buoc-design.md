# Thiết kế: Bước Phân cảnh + Layout 2 cột + Gộp bước kịch bản

**Ngày:** 2026-07-24
**Trạng thái:** Chờ duyệt spec → writing-plans
**Bối cảnh:** Sau khi so danh-script với Toonflow (báo cáo `. MỖI BƯỚC CHẠY SKILLPROMPT GÌ.txt`), phát hiện 3 khoảng trống: (1) UI xếp dọc khó nhìn, chat đè output; (2) "phân cảnh" quá mỏng (`shot_desc` 1 dòng cụt) khiến AI ảnh/video phải bịa lại; (3) 13 bước bấm rườm + dự án mới auto-nhảy qua Chuẩn bị.

> **Nguyên tắc bất di:** KHÔNG đổi provider (9router), KHÔNG đổi engine (Seedance/BytePlus). KHÔNG gộp worker (giữ tách sub-agent như Toonflow — đây là điểm mạnh, không phá). Trả lời/UI tiếng Việt.

---

## 1. Mục tiêu

Làm danh-script "nắm data chắc + AI hiểu sâu" như Toonflow, mà vẫn gọn hơn về số màn:

- **G1** — Layout 2 cột (chat trái · output phải cuộn riêng) cho mọi bước có chat.
- **G2** — Panel output DÀI & GIÀU cho MỌI bước (không chỉ khung xương).
- **G3** — Khối "📥 Kế thừa từ bước trước" để thấy tận mắt data xuyên suốt.
- **G4** — Gộp 5 bước kịch bản thành 1 màn 5 tab (dưới mui vẫn 5 worker + review riêng).
- **G5** — Fix định tuyến: dự án mới dừng ở **Chuẩn bị**, không auto-nhảy Nháp.
- **G6** ⭐ — Thêm bước **Phân cảnh** riêng (worker `storyboardWright`): mỗi cảnh → chia shot/cut → khối phân cảnh chi tiết, đứng SAU Nguyên liệu.

**Không làm (YAGNI):** không gộp worker; không đổi cách review A/B/C/D; không đụng style/@tag system; không thêm engine render.

---

## 2. Pipeline mới (13 → 9 màn)

| # | Màn | Ghi chú |
|---|-----|---------|
| 1 | 🤖 Tự động | giữ |
| 2 | Chuẩn bị | **dừng ở đây khi mở dự án mới (G5)** |
| 3 | 📝 **Kịch bản** | **GỘP 5 tab (G4):** Nháp · Ý đồ · Khung xương · Chuyển thể · Final |
| 4 | Style | giữ (ParamsPanel) |
| 5 | 🎬 Đạo diễn | giữ |
| 6 | 🎨 Nguyên liệu | giữ (sinh @tag + prompt ảnh) |
| 7 | 🎞️ **Phân cảnh** | ⭐ **MỚI (G6)** — sau Nguyên liệu để gán @tag vào shot |
| 8 | 🖼️ Prompt ảnh | kế thừa khối phân cảnh |
| 9 | 🎥 Prompt video → Xuất | kế thừa khối phân cảnh |

**Vì sao Phân cảnh đứng sau Nguyên liệu:** Toonflow gán `associateAssetsIds` vào từng panel — phải có @tag (asset) trước mới gán được. danh-script đã có bảng `block_assets` (đúng vai trò này) nhưng chưa có bước điền nó một cách chủ động.

---

## 3. G6 — Bước Phân cảnh chi tiết (trọng tâm)

### 3.1 Vấn đề hiện tại
`plan_shots` (tools/index.ts:245) ghi `shot_desc` = 1 dòng tiếng Việt cụt ("Close-up tay mở hộp, sản phẩm lộ ra"). GATE 2/3 phải bịa lại toàn bộ chi tiết từ 1 dòng → prompt ảnh/video không bám sát.

Toonflow B5 (`production_execution_storyboard_panel.md`) viết mỗi panel thành XML giàu: `videoDesc` + `prompt` + `track` + `duration` + `associateAssetsIds`. Chính độ chi tiết này làm AI hiểu kỹ.

### 3.2 Giải pháp — worker `storyboardWright` + cột `shot_panel_json`

**DB (migration additive, an toàn — pattern có sẵn db/index.ts:64):**
```sql
ALTER TABLE blocks ADD COLUMN shot_panel_json TEXT
```
Không đổi cột cũ, không phá DB cũ. `shot_desc` giữ nguyên (fallback/tóm tắt); `shot_panel_json` là khối chi tiết.

**Cấu trúc `shot_panel_json` (1 block = 1 shot):**
```
{
  shot_size: string,        // "close-up" | "medium" | "wide" | "extreme wide"...
  camera_angle: string,     // "eye-level" | "low angle" | "high angle" | "over-shoulder"...
  camera_move: string,      // "static" | "pan left" | "dolly in" | "orbit"... (motion-library)
  subject: string,          // chủ thể + @tag dùng trong shot
  action_start: string,     // tư thế/trạng thái ĐẦU (upgrade D)
  action_end: string,       // tư thế/trạng thái CUỐI + 1 chi tiết vật lý
  layout: string | null,    // map bố trí không gian khi ≥2 vật (upgrade Map)
  cuts: string | null,      // CUT-by-CUT nếu shot nhiều cắt (upgrade CUT)
  duration_sec: number,     // ước tính (như Toonflow duration), ≤8s/shot
  asset_tags: string[],     // @tag nguyên liệu → ghi vào block_assets
  notes: string | null      // ý đồ cảm xúc/ánh sáng của shot
}
```

**Worker mới:** `skills/free/_execution_storyboardWright.md`
- Đọc: `read_script_full` + `read_scenes` + `read_plan` (đạo diễn) + `read_assets`.
- Với MỖI cảnh → chia thành 1..n shot; mỗi shot điền đủ khối trên.
- Gán `asset_tags` → ghi bảng `block_assets` (link block↔asset thật).
- Ràng buộc: duration mỗi shot ≤8s (điểm hỏng Seedance 5–8s); @tag phải có thật.

**Tool mới:** `write_shot_panel(scene_order, blocks[])` — upsert `shot_panel_json` + `block_assets`. `plan_shots` cũ GIỮ (tạo khung block nhanh ở bước Kịch bản); `write_shot_panel` làm giàu ở bước Phân cảnh.

**GATE 2/3 kế thừa:** kickoff imgPrompter/vidPrompter đọc `shot_panel_json` (qua `read_blocks`) và bám nguyên khối — KHÔNG bịa lại. Reviewer kiểm prompt có khớp panel không.

### 3.3 Stage + wizardSteps
- Thêm stage `gate_storyboard` vào `STAGE_ORDER` (giữa `gate_assets` và `gate2_image`).
- Thêm step `{ key: 'storyboard', label: '🎞️ Phân cảnh', confirmStage: 'gate_storyboard' }`.
- Thêm `gate_storyboard` vào `CHAT_GATES` (gateChat.ts) + `GATE_STAGE` (wizardStore) + reviewer snapshot (gates.ts `snapshotBody`).

---

## 4. G1+G2+G3 — Layout 2 cột + output giàu

### 4.1 Layout (component `GateWorkbench` bọc chung)
```
┌──────────────── CHAT (~40%) ────────────────┬──────────────── OUTPUT (~60%, cuộn riêng) ─┐
│  tiêu đề + mô tả bước                        │  [tab: theo bước]                          │
│  bong bóng chat (cuộn)                       │  ── panel output đầy đủ (mục 4.2) ──       │
│  ô nhập + [Gửi]                              │  ...                                       │
│  [Kiểm duyệt A/B/C/D] [Chốt →]               │  📥 Kế thừa từ bước trước (mục 4.3)        │
└─────────────────────────────────────────────┴────────────────────────────────────────────┘
```
- Grid `lg:grid-cols-[2fr_3fr]`; mỗi cột `overflow-y-auto` riêng, chiều cao `calc(100vh - header)`.
- Màn hẹp (`< lg`): xếp dọc lại (output trên, chat dưới) — responsive.
- `GateChatPanel` hiện tại refactor: phần chat → cột trái; thêm slot `rightPanel` cho cột phải.

### 4.2 Panel output đầy đủ MỖI bước (thay `PlanArtifactsView` mỏng)
Component `StageOutputView` chọn render theo stage:

| Bước | Hiện trọn |
|------|-----------|
| Nháp | toàn văn `plan.draft` |
| Ý đồ | 6 mục: core_message · target · angle · mood · genre · duration_hint (+ output_intent, triggers) |
| Khung xương | logline + từng nhịp (role+summary+hint) + emotional_arc + payoff |
| Chuyển thể | approach + bảng show_dont_tell đầy đủ + motif + pitfalls |
| Kịch bản | **narration TRỌN VẸN từng cảnh** (không cắt) + shot đã quy hoạch |
| Đạo diễn | bảng từng cảnh: line_count · char_count · emotion(0–10) · transition |
| Nguyên liệu | từng @tag + gen_prompt đầy đủ + biến thể + Color Script |
| **Phân cảnh** | từng cảnh → từng shot: khối `shot_panel_json` đầy đủ (mục 3.2) |
| Prompt ảnh | image_prompt_en đầy đủ từng block |
| Prompt video | video_prompt_json đầy đủ từng block (+ Style Prefix) |

Data đã có sẵn trong store (`plan`, `assetsFull`, `visualSystem`, scenes/blocks qua read tool) — chỉ cần render đầy đủ thay vì tóm tắt.

### 4.3 Khối "📥 Kế thừa từ bước trước"
Cuối cột phải, khối gọn (thu gọn được) hiện data bước hiện tại kế thừa từ DB:
- Kịch bản ← ý đồ chốt + khung xương.
- Đạo diễn ← narration final.
- Nguyên liệu ← kịch bản + bối cảnh cảnh.
- Phân cảnh ← kịch bản + đạo diễn + @tag.
- Prompt ảnh/video ← khối phân cảnh + @tag + Color Script.

Mục tiêu tâm lý: anh THẤY bước sau đang cầm chắc bước trước (đúng cảm giác Toonflow "nắm data chắc"). Đọc qua read tool sẵn có, không thêm API.

---

## 5. G4 — Gộp 5 bước kịch bản thành 1 màn 5 tab

- Component `ScriptWorkbench`: 5 tab (Nháp · Ý đồ · Khung xương · Chuyển thể · Final), mỗi tab render `GateWorkbench` với stage tương ứng.
- **Dưới mui KHÔNG đổi:** vẫn 5 stage riêng, 5 worker riêng, 5 review riêng, DB riêng. Chỉ gộp VỎ UI.
- Luật khóa tab: tab N mở khi stage N-1 đã chốt (tái dùng `stepUnlocked`). Chốt tab cuối (Final) → sang Style.
- WizardView: thay 5 nhánh `step===draft/gate0/...` bằng 1 nhánh `step==='script'` render `ScriptWorkbench`.

---

## 6. G5 — Fix định tuyến dừng ở Chuẩn bị

`stepFromStage` (wizardSteps.ts:104): dự án mới stage=`draft` (rank -1) → hiện nhảy thẳng Nháp. Sửa: khi `stageRank(stage) < 0` (chưa chốt gì) → trả `'prep'` thay vì bước kế. Các bước phụ trợ (`prep`) vẫn luôn unlocked nên anh bấm qua lại tự do.

---

## 7. Files sẽ đụng

| File | Thay đổi |
|------|----------|
| `src/main/db/schema.sql` | thêm cột `shot_panel_json` (+ migration db/index.ts) |
| `src/main/db/index.ts` | migration ALTER; hàm upsert shot_panel + block_assets; read cho panel |
| `src/main/tools/index.ts` | tool `write_shot_panel`; read_blocks trả `shot_panel_json` |
| `src/main/tools/validators.ts` | validate input `write_shot_panel` |
| `skills/free/_execution_storyboardWright.md` | ⭐ worker mới |
| `skills/reviewer.md` | tiêu chí gate_storyboard |
| `src/main/pipeline/gateChat.ts` | CHAT_GATES thêm `gate_storyboard` + kickoff; imgPrompter/vidPrompter kickoff đọc panel |
| `src/main/pipeline/gates.ts` | snapshotBody cho gate_storyboard; buildPrompt cập nhật |
| `src/main/pipeline/workerSpecs.ts` | spec storyboardWright |
| `src/shared/wizardSteps.ts` | thêm stage+step storyboard; fix stepFromStage (G5) |
| `src/shared/types.ts` | type `ShotPanel`; stage `gate_storyboard` |
| `src/renderer/src/wizardStore.ts` | GATE_STAGE + GateId thêm storyboard |
| `src/renderer/src/ui/wizard/GateWorkbench.tsx` | ⭐ MỚI — layout 2 cột, slot rightPanel |
| `src/renderer/src/ui/wizard/StageOutputView.tsx` | ⭐ MỚI — panel output đầy đủ mọi bước |
| `src/renderer/src/ui/wizard/InheritedDataView.tsx` | ⭐ MỚI — khối "kế thừa" |
| `src/renderer/src/ui/wizard/ScriptWorkbench.tsx` | ⭐ MỚI — 5 tab kịch bản |
| `src/renderer/src/ui/wizard/StoryboardPanel.tsx` | ⭐ MỚI — màn Phân cảnh |
| `src/renderer/src/ui/wizard/GateChatPanel.tsx` | refactor thành cột trái của GateWorkbench |
| `src/renderer/src/ui/wizard/WizardView.tsx` | gộp nhánh script; thêm nhánh storyboard |

---

## 8. Verification

- `npm run typecheck` + `npm run build` EXIT 0.
- `npm run dev`: mở dự án mới → dừng ở **Chuẩn bị** (không nhảy Nháp).
- Màn Kịch bản có 5 tab, chat trái output phải, output hiện narration đầy đủ.
- Chạy tới **Phân cảnh** → mỗi cảnh chia shot, mỗi shot có khối chi tiết (cỡ cảnh/góc/camera/Start→End/duration/@tag).
- GATE ảnh/video → prompt bám khối phân cảnh (kiểm 1 block: prompt nhắc đúng @tag + hành động panel).
- Khối "Kế thừa" hiện đúng data bước trước.
- DB cũ mở được (migration additive không phá).

---

## 9. Thứ tự làm (tuần tự, không chạy song song nhiều request)

1. **DB + backend phân cảnh:** schema/migration → tool `write_shot_panel` + validator → worker `.md` → workerSpecs → gateChat/gates (stage, snapshot, kickoff).
2. **wizardSteps + types + store:** thêm stage/step storyboard; fix stepFromStage (G5).
3. **UI:** GateWorkbench (2 cột) → StageOutputView → InheritedDataView → refactor GateChatPanel → ScriptWorkbench (tab) → StoryboardPanel → WizardView.
4. **Typecheck + build + dev thử.**
5. Commit theo nhóm, `git add` đúng file (không `git add .`).
