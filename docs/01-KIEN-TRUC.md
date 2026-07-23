# DANH SCRIPT — KIẾN TRÚC KỸ THUẬT

> Đọc sau `00-SPEC-TONG.md` và `04-PHAN-TICH-IDEAL-VA-DO-THAT.md`. File này mô tả: agent, DB, engine, cổng model, cây thư mục. Vẫn CHỜ DUYỆT.
> **Tên app: Danh Script.** Bộ não = engine phân tích ideal (TopView + Higgsfield); Toonflow chỉ là vỏ.

---

## 1. Triết lý nền: "Cơ thể vs Linh hồn" (vỏ mượn Toonflow, não là TopView+Higgsfield)

```
CODE (src/)        = CƠ THỂ  : đọc .md, nạp dữ liệu, lắp tool, gọi LLM, hàng đợi, DB, UI
MARKDOWN (skills/) = LINH HỒN: quy trình, tiêu chuẩn, template prompt, cách nghĩ, độ thật
```

Thêm 1 pipeline mới (TVC, Fashion) = viết bộ `.md` mới, **không đụng code**. Việt hóa = dịch `.md`.

---

## 2. Stack công nghệ

| Lớp | Chọn | Vì sao |
|---|---|---|
| Khung app | **Electron** | Đóng gói .exe chạy local Windows (yêu cầu của bạn) |
| UI | **React + TypeScript + Vite** | Giống Printfilm gốc, dễ đọc, cộng đồng lớn |
| CSS | **Tailwind + shadcn/ui** | UI "xịn" không generic, có điểm nhấn |
| DB | **SQLite (better-sqlite3)** | Lưu dự án/tài sản/ký ức; Toonflow dùng cái này |
| Embedding (RAG, đợt 2) | **all-MiniLM-L6-v2 local** | Chạy offline, giống Toonflow |
| Gọi LLM | **1 module `llmGateway.ts`** | Claude API trực tiếp / 9router / beeknoee — đổi bằng config |
| State | **Zustand** (nhẹ) hoặc Context | Quản state wizard theo dự án |

---

## 3. Kiến trúc agent 3 tầng (mỏ #1 — xương sống)

Mỗi **pipeline** (Affiliate/TVC/Fashion) = 1 bộ 3 tầng agent, mỗi tầng đọc 1 file `.md` làm system prompt:

```
┌─ TẦNG QUYẾT ĐỊNH (Decision / "Sếp") ─────────────────────┐
│  · Nói chuyện với người dùng, chạy wizard, hỏi & chốt      │
│  · Ra lệnh cho thợ ≤100 chữ · KHÔNG tự làm việc của thợ    │
│  · KHÔNG tiếp quản khi thợ lỗi (chống lỗi Toonflow)        │
│  skill: <pipeline>_decision.md                            │
└──────────────────────────────────────────────────────────┘
        │ gọi tool run_worker(...)         ▲ báo cáo
        ▼                                  │
┌─ TẦNG THỰC THI (Execution / "Thợ") ──────────────────────┐
│  · Có tool đầy đủ: đọc ideal, ghi DB, sinh kịch bản/prompt │
│  · Mỗi thợ 1 mảng: scriptWorker · imgPromptWorker ·        │
│    videoPromptWorker · consistencyWorker                   │
│  skill: <pipeline>_execution_<mảng>.md                    │
└──────────────────────────────────────────────────────────┘
        │ nộp sản phẩm                     ▲ điểm A/B/C/D
        ▼                                  │
┌─ TẦNG GIÁM SÁT (Supervision / "Biên tập") ───────────────┐
│  · Độc lập chấm A/B/C/D + quét red-line (RK/RA/RV)         │
│  · KHÔNG tự sửa — nêu lỗi, trả về để thợ sửa               │
│  skill: review.md (dùng chung)                            │
└──────────────────────────────────────────────────────────┘
```

**Các "thợ" theo mảng:**
- `ideaAnalyst` ⭐ — **phân tích ideal → Scene Context từng cảnh + Identity Lock** (bộ não bottom-up, mượn TopView). Đây là thợ QUAN TRỌNG NHẤT, chạy ở GATE 0.
- `scriptWorker` — cắt cảnh → block 10s + narration
- `imgPromptWorker` — ghép 3 lớp (độ thật + identity + bối cảnh cảnh) → prompt ảnh
- `videoPromptWorker` — 5 trường STYLE/SCENE/MOTION/AUDIO/NEGATIVE
- `consistencyWorker` — kiểm khóa identity mềm, không ép thể loại

**Tool mà thợ được gọi** (code thật trong `src/tools/`):
- `read_ideal` · `read_project` · `read_asset` — đọc dữ liệu
- `write_scene_context` ⭐ — ghi bối cảnh RIÊNG từng cảnh (lớp B, không lặp cứng)
- `write_script` · `write_image_prompt` · `write_video_prompt` — ghi DB
- `save_asset` · `get_asset` — quản nhân vật/sản phẩm; asset chỉ khóa identity mềm (mỏ #6)
- `activate_skill` · `read_skill_file` — lazy-load (mỏ #3)
- `recall_memory` (đợt 2) — RAG (mỏ #4)
- `validate_params` — check aspect/res/duration theo **BytePlus/Seedance** (mỏ #9)
- `export_bundle` — xuất bảng prompt
- ❌ **KHÔNG có** `generate_image` / `generate_video` — điểm dừng của app.

---

## 4. Cổng model 1 mối (mỏ #10) — PHÂN BIỆT 2 loại model

⚠️ **Có 2 loại model khác nhau, đừng lẫn:**

**(a) Model LLM sinh prompt** (app dùng để suy nghĩ/viết) — qua cổng 1 mối:
```ts
// src/core/llmGateway.ts — MỌI lời gọi LLM đi qua đây
interface ModelConfig {
  provider: 'anthropic' | '9router' | 'beeknoee';
  modelName: string;      // 'claude-opus-4-8', 'deepseek-chat', ...
  baseUrl: string; apiKey: string;
}
// Đổi model = đổi 1 dòng config. Agent rẻ (giám sát) dùng model rẻ, agent khó (phân tích/kịch bản) dùng Opus.
```

**(b) Model RENDER = CHỈ BytePlus/Seedance** (Coco Studio chỉ chạy BytePlus). App KHÔNG gọi loại này — chỉ **validate prompt theo ràng buộc BytePlus** rồi để người dùng render ở Coco. `model-catalog.md` chỉ liệt kê BytePlus (Seedance 2.0/Mini...), KHÔNG có Kling/Veo/GPT Image.

---

## 5. Chống treo (mỏ #2 + #7)

```ts
// src/core/queue.ts
createTaskQueue({ intervalMs: 800 })   // rải request 800ms, tuần tự
// Mỗi lời gọi LLM: async + polling trạng thái, có timeout + retry
// Cây recovery (mượn TopView): gọi lỗi → retry → tăng timeout → báo người dùng
```

Đây là cơ chế chống đúng 3 lỗi bạn hay gặp: `emptyPrompt`, sinh hàng loạt lỗi, màn hình trắng.

---

## 6. Cơ sở dữ liệu (SQLite)

```
projects        (id, name, pipeline, ideal_json, params_json, style_id, stage, created_at)
                 -- style_id: style đã chọn cho dự án (khóa L1 cứng toàn dự án)
scenes          (id, project_id, order, summary, narration_vi,
                 scene_context_json)   -- ⭐ {era,setting,wardrobe,props,mood} RIÊNG từng cảnh (lớp B)
blocks          (id, scene_id, order, image_prompt_en, video_prompt_json, rendered_bool)
assets          (id, project_id|global, type[char|product], name,
                 identity_lock_json,    -- ⭐ CHỈ mặt/dáng (lớp C, khóa cứng)
                 variations_json,       -- đồ/tóc/đạo cụ theo cảnh (mềm)
                 ref_image_path)
memories        (id, iso_key, kind[short|summary|rag], content, embedding_blob)  -- đợt 2
reviews         (id, block_id, grade[A|B|C|D], redlines_json, notes)
```

Điểm mấu chốt: **bối cảnh nằm ở `scenes.scene_context_json` (mỗi cảnh khác nhau)**, KHÔNG nằm ở project. Nhân vật `assets.identity_lock` chỉ khóa mặt/dáng — đồ để ở `variations` (đổi theo cảnh). Đây là cách chống lỗi xuyên không ở tầng DB.

---

## 7. Thư viện STYLE + 3 lớp (xem `04` và `05` chi tiết)

**STYLE = chất liệu render, chọn 1 lần/dự án, nhất quán mọi block.** Thư viện đầy đủ (bê 11 style Toonflow + bổ sung mới). Mỗi style 1 folder theo khuôn Toonflow:

```
skills/
├── styles/                    ← THƯ VIỆN STYLE (nhiều style, chọn 1/dự án) — xem `05`
│   ├── real-photoreal/         · prefix.md (hex + L1/L2/L3) + art_prompt/ + director/ + preview.png
│   ├── 2d-chinese-guofeng/     · hoạt hình 2D Trung (donghua)
│   ├── 3d-anime-render/        · hoạt hình 3D
│   ├── ... (11 style Toonflow + style mới: 2D/3D phương Tây, webtoon, Ghibli, điện ảnh VN)
│   └── <thêm style = thêm folder, không đụng code>
├── scene-analysis.md          ← LỚP B: luật suy Scene Context TỪNG cảnh từ ideal (bottom-up)
├── identity-lock.md           ← LỚP C: khóa CỨNG mặt/dáng nhân vật, MỀM đồ/cảnh/thời đại
└── motion-presets.md          ← camera/motion preset (Higgsfield): orbit, dolly, bullet-time
```

**Prompt ảnh = [A STYLE chất liệu] + [C identity nếu có] + [B bối cảnh cảnh này] + [nội dung block].**
Chất liệu vẽ (L1) nhất quán toàn video; bối cảnh/thời đại (L2) đổi theo cảnh → cảnh hiện đại KHÔNG lọt "cổ trang", vẫn cùng phong cách vẽ với cảnh cổ. Mỗi `prefix.md` bê từ Toonflow đã có sẵn cơ chế L1硬/L2软/L3例外 — chỉ Việt hóa + đảm bảo thời đại nằm ở L2.

---

## 8. Cây thư mục dự án

```
DANH-SCRIPT/                    ← (thư mục vật lý hiện tại: E:\PRINTFILM-APP, sẽ đổi tên)
├── docs/                      ← spec (đang đọc)
├── electron/                  ← main process, cửa sổ, đóng gói
├── src/
│   ├── core/                  ← CƠ THỂ (không đụng khi thêm pipeline)
│   │   ├── llmGateway.ts       · cổng model LLM 1 mối (#10)
│   │   ├── queue.ts            · hàng đợi 800ms + recovery (#2,#7)
│   │   ├── agentRunner.ts      · chạy 3 tầng agent (#1)
│   │   ├── skillLoader.ts      · lazy-load .md (#3)
│   │   ├── memory.ts           · RAG (#4, đợt 2)
│   │   └── validate.ts         · check tham số theo BytePlus (#9)
│   ├── tools/                 ← các tool agent gọi được
│   ├── db/                    ← SQLite schema + query
│   ├── ui/                    ← React: Dashboard, Wizard, Export
│   └── types.ts
├── skills/                    ← LINH HỒN (thêm pipeline = thêm ở đây)
│   ├── affiliate/             · _decision.md, _execution_{ideaAnalyst,script,imgprompt,videoprompt,consistency}.md
│   ├── tvc/                    · (đợt 2)
│   ├── fashion/                · (đợt 3)
│   ├── realism/constitution.md · ⭐ LỚP A hiến pháp độ thật (thay kho style)
│   ├── scene-analysis.md       · ⭐ LỚP B luật suy bối cảnh từng cảnh (bottom-up)
│   ├── identity-lock.md        · ⭐ LỚP C khóa nhận dạng nhân vật (mềm phần còn lại)
│   ├── motion-presets.md       · camera/motion preset (Higgsfield)
│   ├── review.md               · giám sát A/B/C/D + red-line
│   └── model-catalog.md        · ràng buộc tham số BytePlus/Seedance (#9)
└── package.json
```

---

## 9. Học gì / bỏ gì từ 5 nguồn (Danh Script là app MỚI)

| Nguồn có | Danh Script |
|---|---|
| Toonflow: tool `generate_*_images` + workbench render | ❌ Bỏ — thay bằng `export_bundle` (xuất bảng prompt), người dùng render ở Coco |
| Toonflow: 3 tầng agent + giám sát A/B/C/D | ✅ Học + viết lại `.md` tiếng Việt |
| Toonflow: 11 art_skills style (folder prefix+art_prompt+director) | ✅ **Copy về + Việt hóa + rà L1/L2/L3** (xem `05`) |
| Toonflow: RAG memory + hàng đợi chống treo | ✅ Học (RAG đợt 2) |
| TopView: run/submit/query, validate model-catalog, omni syntax | ✅ Học logic → viết cho cổng BytePlus |
| Coco: wizard 5 cổng, 5-review, module talking/product/voice | ✅ Bê template |
| Printfilm: khung app, cổng model, asset variations, né kiểm duyệt | ✅ Tham khảo |
| Vendor Trung Quốc (Toonflow) | ❌ Thay: LLM qua 9router/beeknoee; render = BytePlus ở Coco |
