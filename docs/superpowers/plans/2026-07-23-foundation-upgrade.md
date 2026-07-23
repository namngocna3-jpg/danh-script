# Nâng cấp nền Danh Script — Kế hoạch triển khai

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Làm cứng nền Danh Script — một nguồn sự thật cho spec thợ, chống rác output LLM, lá chắn kỹ thuật cho @tag, và chặn chốt cổng theo điểm review — mà không phá kiến trúc "linh hồn trong markdown".

**Architecture:** Ưu tiên sửa markdown + thêm helper TypeScript nhỏ, thuần, không thư viện mới. 4 phase độc lập, mỗi phase có cổng nghiệm thu riêng. Guard validate chạy TRONG handler write-tool và `throw` lỗi tiếng Việt → `agentRunner` bắt lỗi, đẩy `is_error` cho LLM tự sửa lượt sau (cơ chế đã có sẵn, không cần retry engine).

**Tech Stack:** Electron + TypeScript, electron-vite, better-sqlite3. Không thêm dependency. Không có test runner → nghiệm thu bằng `npm run typecheck` (EXIT 0) + `npm run build` (EXIT 0) + `grep` xác nhận nội dung.

## Global Constraints

- Ngôn ngữ mọi thông điệp lỗi/nội dung: **tiếng Việt**.
- **KHÔNG** thêm thư viện (không zod). Validate bằng guard tay dựa type trong `src/shared/types.ts`.
- **KHÔNG** thêm gọi API render/generate — giữ ranh giới "dừng-ở-prompt".
- Cơ chế review: **CHỈ CHẶN, KHÔNG tự sửa**. Grade D → chặn; C → cảnh báo (qua được nếu `force`); A/B/không-review → qua.
- Mỗi phase xong PHẢI qua cổng nghiệm thu (typecheck EXIT 0 + build EXIT 0 + grep) TRƯỚC khi sang phase sau.
- Ưu tiên sửa `.md`; chỉ thêm code khi bắt buộc.
- Path chuẩn (đã xác minh): DB ở `src/main/db/index.ts` (thư mục, không phải file `db.ts`); skill nền ở `skills/identity-lock.md` (gốc `skills/`, KHÔNG có `skills/shared/`).
- Guard `throw new Error(...)` — KHÔNG return `{error}` (handler đồng bộ ném lỗi là đủ; agentRunner bắt và đóng gói).

---

## Bối cảnh phát hiện quan trọng (đọc trước khi làm)

Spec `2026-07-23-foundation-upgrade-design.md` Phase 3 giả định 3 thợ sát đầu ra còn mỏng (44/61/75 dòng). **Thực tế đã dày**: `_execution_assetDeriver.md` = 127 dòng, `_execution_imgPrompter.md` = 110 dòng, `_execution_vidPrompter.md` = 122 dòng, đều đủ 7 phần + template. Người dùng đã chốt: **Phase 3 đổi thành pass rà soát nhẹ** (chỉ kiểm đủ heading + template + đúng 1 `{{OUTPUT_INTENT}}`, vá vặt nếu thiếu — KHÔNG viết lại). Thứ thật sự mỏng là `skills/identity-lock.md` = 21 dòng → làm dày ở Phase 2.

---

## File Structure

**Tạo mới:**
- `src/main/pipeline/workerSpecs.ts` — bảng `WORKER_SPECS` (nguồn sự thật tool+layer cho 4 thợ dùng chung 2 đường chạy).
- `src/main/tools/validators.ts` — guard tay cho 5 write-tool trọng yếu.
- `src/main/pipeline/tagGuard.ts` — `extractTags` + `checkTagsExist`.

**Sửa:**
- `src/main/pipeline/gates.ts` — GATES đọc tool/layer từ WORKER_SPECS; thêm `console.warn` vào 2 catch nuốt lỗi.
- `src/main/pipeline/gateChat.ts` — CHAT_GATES đọc tool/layer từ WORKER_SPECS; `confirmGate` nhận `force`, chặn theo grade; thêm `console.warn` vào catch genre.
- `src/main/tools/index.ts` — 5 handler gọi guard tương ứng.
- `src/main/pipeline/gate0.ts` — thêm `console.warn` vào catch JSON.parse (nếu có nuốt lỗi).
- `src/main/ipc.ts` — `gate:confirm` nhận `force`.
- `src/preload/index.ts` — bridge `confirm` nhận `force`.
- `src/renderer/src/wizardStore.ts` — `confirmGate` nhận `force`.
- `src/renderer/src/ui/wizard/GateChatPanel.tsx` — nút "Chốt dù điểm C" khi bị chặn mềm.
- `skills/identity-lock.md` — làm dày L0–L5 + bảng R/X (21 → ~120–150 dòng).
- `skills/free/_execution_assetDeriver.md` — sửa docs mâu thuẫn (ai tạo @tag) nếu có.
- `src/main/pipeline/orchestrator.ts` — sửa mô tả `run_worker` gate0.

---

## PHASE 1 — Dọn nền kỹ thuật

### Task 1: Gộp nguồn tool/layer trùng vào WORKER_SPECS

**Files:**
- Create: `src/main/pipeline/workerSpecs.ts`
- Modify: `src/main/pipeline/gates.ts` (GATES: directorPlanner, assetDeriver, imgPrompter, vidPrompter — thay literal `tools`/`layers` bằng đọc từ WORKER_SPECS)
- Modify: `src/main/pipeline/gateChat.ts` (CHAT_GATES: gate_director, gate_assets, gate2_image, gate3_video — tương tự)

**Interfaces:**
- Produces: `WORKER_SPECS: Record<string, { tools: string[]; layers: string[] }>`; `workerSpec(name: string): { tools: string[]; layers: string[] }`.
- Consumes: `gates.ts` và `gateChat.ts` gọi `workerSpec(...)` để lấy `tools`/`layers`.

**Bối cảnh khác biệt 2 đường chạy (QUAN TRỌNG — không được xoá):**
- `gates.ts` GATES cấp tool GỌN (thợ 1-phát). VD `imgPrompter`: `['read_ideal','read_scenes','read_blocks','read_assets','read_coverage','save_asset','write_image_prompt']`.
- `gateChat.ts` CHAT_GATES cấp thêm READ_TOOLS chung (`read_plan`) qua spread `[...READ_TOOLS, ...]`. VD `gate2_image`: `[...READ_TOOLS, 'read_coverage','save_asset','write_image_prompt']`.
- → WORKER_SPECS.tools chỉ chứa phần tool **riêng của thợ** (write + read đặc thù). Đường chat tự spread READ_TOOLS như cũ. Đường gates tự thêm các read cơ bản nó cần. KHÔNG gộp READ_TOOLS vào WORKER_SPECS (tránh cấp thừa tool cho đường 1-phát).
- **Quyết định gộp:** chỉ gộp `layers` (giống hệt 2 nơi) + phần **write-tool cốt lõi** của mỗi thợ. Các read-tool khác nhau giữ tại chỗ.

**layers thực tế (đã xác minh, phải khớp verbatim):**
- directorPlanner: `['storyboard-craft.md']`
- assetDeriver: `['asset-prompt-craft.md','visual-system.md','identity-lock.md','style-constitution.md']`
- imgPrompter: `['style-constitution.md','identity-lock.md','craft-photography.md','byteplus-spec.md','consistency.md','moderation-softening.md']`
- vidPrompter: `['style-constitution.md','craft-photography.md','motion-library.md','byteplus-spec.md','model-catalog.md','consistency.md','moderation-softening.md']`

- [ ] **Step 1: Tạo file WORKER_SPECS**

Create `src/main/pipeline/workerSpecs.ts`:

```typescript
// ============================================================
// Danh Script — NGUỒN SỰ THẬT tool + layer của thợ (dùng chung 2 đường chạy)
// gates.ts (1-phát) và gateChat.ts (hội thoại) cùng đọc bảng này để KHÔNG
// khai báo trùng ở 2 nơi → sửa quyền tool/layer 1 chỗ, cả 2 đường đồng bộ.
//
// LƯU Ý: chỉ gộp phần CHUNG:
//  • layers  — danh sách mảnh skill nạp kèm (giống hệt 2 nơi).
//  • tools   — write-tool + read đặc thù CỐT LÕI của thợ.
// Đường chat tự spread READ_TOOLS (read_plan...) như cũ; đường gates tự thêm
// các read cơ bản riêng. Không nhồi READ_TOOLS vào đây (tránh cấp thừa cho 1-phát).
// ============================================================

export interface WorkerSpec {
  tools: string[] // tool riêng cốt lõi của thợ (write + read đặc thù)
  layers: string[] // mảnh skill chung nạp kèm (tên file trong skills/)
}

export const WORKER_SPECS: Record<string, WorkerSpec> = {
  directorPlanner: {
    tools: ['read_ideal', 'read_scenes', 'read_script_full', 'write_director_plan'],
    layers: ['storyboard-craft.md']
  },
  assetDeriver: {
    tools: [
      'read_ideal',
      'read_scenes',
      'read_assets',
      'read_script_full',
      'read_asset_coverage',
      'derive_assets',
      'write_asset_prompt',
      'save_derived_asset',
      'write_visual_system'
    ],
    layers: [
      'asset-prompt-craft.md',
      'visual-system.md',
      'identity-lock.md',
      'style-constitution.md'
    ]
  },
  imgPrompter: {
    tools: [
      'read_ideal',
      'read_scenes',
      'read_blocks',
      'read_assets',
      'read_coverage',
      'save_asset',
      'write_image_prompt'
    ],
    layers: [
      'style-constitution.md',
      'identity-lock.md',
      'craft-photography.md',
      'byteplus-spec.md',
      'consistency.md',
      'moderation-softening.md'
    ]
  },
  vidPrompter: {
    tools: [
      'read_ideal',
      'read_scenes',
      'read_blocks',
      'read_assets',
      'read_coverage',
      'write_video_prompt'
    ],
    layers: [
      'style-constitution.md',
      'craft-photography.md',
      'motion-library.md',
      'byteplus-spec.md',
      'model-catalog.md',
      'consistency.md',
      'moderation-softening.md'
    ]
  }
}

/** Lấy spec 1 thợ; ném lỗi rõ nếu tên sai (chống lệch âm thầm). */
export function workerSpec(name: string): WorkerSpec {
  const s = WORKER_SPECS[name]
  if (!s) throw new Error(`[danh-script] Không có WORKER_SPEC cho thợ: ${name}`)
  return s
}
```

- [ ] **Step 2: gates.ts đọc WORKER_SPECS cho directorPlanner**

Trong `src/main/pipeline/gates.ts`, thêm import ở đầu (cạnh các import khác):

```typescript
import { workerSpec } from './workerSpecs'
```

Sửa GATES.directorPlanner — thay 2 dòng `tools`/`layers` literal bằng spread từ workerSpec. Đổi khối:

```typescript
  directorPlanner: {
    worker: 'directorPlanner',
    tools: ['read_ideal', 'read_scenes', 'read_plan', 'read_script_full', 'write_director_plan'],
    stage: 'gate_director',
    layers: ['storyboard-craft.md'],
    buildPrompt: () =>
```

thành:

```typescript
  directorPlanner: {
    worker: 'directorPlanner',
    tools: [...workerSpec('directorPlanner').tools, 'read_plan'],
    stage: 'gate_director',
    layers: workerSpec('directorPlanner').layers,
    buildPrompt: () =>
```

(Đường gates cần thêm `read_plan` — giữ nó ở chỗ nối, vì WORKER_SPECS không chứa read chung.)

- [ ] **Step 3: gates.ts đọc WORKER_SPECS cho assetDeriver**

Đổi khối GATES.assetDeriver: thay mảng `tools: [...]` (10 phần tử) và `layers: [...]` bằng:

```typescript
    tools: workerSpec('assetDeriver').tools,
    stage: 'gate_assets',
    layers: workerSpec('assetDeriver').layers,
```

- [ ] **Step 4: gates.ts đọc WORKER_SPECS cho imgPrompter + vidPrompter**

GATES.imgPrompter:

```typescript
    tools: workerSpec('imgPrompter').tools,
    stage: 'gate2_image',
    layers: workerSpec('imgPrompter').layers,
```

GATES.vidPrompter:

```typescript
    tools: workerSpec('vidPrompter').tools,
    stage: 'gate3_video',
    layers: workerSpec('vidPrompter').layers,
```

- [ ] **Step 5: gateChat.ts đọc WORKER_SPECS cho 4 cổng**

Trong `src/main/pipeline/gateChat.ts`, thêm import:

```typescript
import { workerSpec } from './workerSpecs'
```

Sửa 4 khối CHAT_GATES (giữ nguyên `[...READ_TOOLS, ...]`, chỉ thay phần tool riêng + layers):

gate_director:
```typescript
  gate_director: {
    worker: 'directorPlanner',
    tools: [...READ_TOOLS, 'read_script_full', 'write_director_plan'],
    layers: workerSpec('directorPlanner').layers,
    kickoff:
```
(tool riêng của cổng chat này = `read_script_full` + `write_director_plan`; giữ nguyên vì READ_TOOLS đã có read_ideal/read_scenes.)

gate_assets:
```typescript
    tools: [
      ...READ_TOOLS,
      'read_script_full',
      'read_asset_coverage',
      'derive_assets',
      'write_asset_prompt',
      'save_derived_asset',
      'write_visual_system'
    ],
    layers: workerSpec('assetDeriver').layers,
```

gate2_image:
```typescript
    tools: [...READ_TOOLS, 'read_coverage', 'save_asset', 'write_image_prompt'],
    layers: workerSpec('imgPrompter').layers,
```

gate3_video:
```typescript
    tools: [...READ_TOOLS, 'read_coverage', 'write_video_prompt'],
    layers: workerSpec('vidPrompter').layers,
```

> Lưu ý: chỉ `layers` được thay bằng workerSpec (giống hệt 2 nơi). `tools` ở đường chat GIỮ literal vì cấu trúc spread READ_TOOLS khác đường gates — đây là chủ đích, không phải trùng lặp thật. Kết quả: layers là 1 nguồn; sửa layer 1 chỗ cả 2 đường đồng bộ.

- [ ] **Step 6: typecheck + build**

```bash
cd /e/danh-script && npm run typecheck && npm run build
```
Expected: cả hai EXIT 0.

- [ ] **Step 7: grep xác nhận layers không còn literal trùng**

```bash
cd /e/danh-script && grep -n "storyboard-craft.md" src/main/pipeline/gateChat.ts
```
Expected: KHÔNG còn dòng nào literal `'storyboard-craft.md'` trong CHAT_GATES.gate_director (đã thay bằng `workerSpec(...).layers`). Còn ở các cổng script (gate1a/1b/1d) là đúng — chúng không thuộc 4 thợ gộp.

- [ ] **Step 8: Commit**

```bash
cd /e/danh-script && git add src/main/pipeline/workerSpecs.ts src/main/pipeline/gates.ts src/main/pipeline/gateChat.ts && git commit -m "refactor(pipeline): gộp layer 4 thợ vào workerSpecs (DRY)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Guard validate output LLM (chống rác)

**Files:**
- Create: `src/main/tools/validators.ts`
- Modify: `src/main/tools/index.ts` (5 handler gọi guard: writeSkeleton, writeDirectorPlan, writeVideoPrompt, planShots, writeImagePrompt)

**Interfaces:**
- Produces: `assertSkeleton`, `assertDirectorPlan`, `assertVideoPrompt`, `assertPlanShots`, `assertImagePrompt` — mỗi hàm nhận `input: Record<string, unknown>`, `throw new Error` tiếng Việt nếu sai, `void` nếu đạt.
- Consumes: 5 handler trong `index.ts` gọi guard ở dòng đầu, TRƯỚC khi ghi DB.

**Bối cảnh cơ chế (không được hiểu sai):** handler là đồng bộ hoặc async; `agentRunner` bọc try/catch quanh `handler(...)`. Guard chỉ cần `throw new Error('...')` — agentRunner tự set `is_error` và đẩy message cho LLM. KHÔNG return `{error}`.

- [ ] **Step 1: Tạo validators.ts**

Create `src/main/tools/validators.ts`:

```typescript
// ============================================================
// Danh Script — Guard validate output LLM (chống rác vào DB)
// Chạy TRONG handler write-tool, TRƯỚC khi ghi DB. Sai → throw lỗi tiếng Việt
// rõ (field nào, kỳ vọng gì). agentRunner bắt lỗi → đẩy is_error cho LLM tự sửa
// lượt sau. KHÔNG kiểm ngữ nghĩa — chỉ field bắt buộc + kiểu cơ bản.
// ============================================================

function isNonEmptyString(v: unknown): boolean {
  return typeof v === 'string' && v.trim().length > 0
}

function isFiniteNumber(v: unknown): boolean {
  return typeof v === 'number' && Number.isFinite(v)
}

/** write_skeleton: logline không rỗng; beats mảng không rỗng; mỗi beat có order(số)/role/summary. */
export function assertSkeleton(input: Record<string, unknown>): void {
  if (!isNonEmptyString(input.logline)) {
    throw new Error('write_skeleton: thiếu "logline" (1 câu tóm cả chuyện). Hãy viết logline rồi gọi lại.')
  }
  const beats = input.beats
  if (!Array.isArray(beats) || beats.length === 0) {
    throw new Error('write_skeleton: "beats" phải là mảng nhịp KHÔNG rỗng (hook→thân→cao trào→kết).')
  }
  beats.forEach((b, i) => {
    const beat = b as Record<string, unknown>
    if (!isFiniteNumber(beat.order)) {
      throw new Error(`write_skeleton: beat #${i + 1} thiếu "order" là SỐ thứ tự nhịp (1,2,3...).`)
    }
    if (!isNonEmptyString(beat.role)) {
      throw new Error(`write_skeleton: beat #${i + 1} thiếu "role" (hook/thiết lập/xung đột/cao trào...).`)
    }
    if (!isNonEmptyString(beat.summary)) {
      throw new Error(`write_skeleton: beat #${i + 1} thiếu "summary" (nội dung nhịp, tiếng Việt).`)
    }
  })
}

/** write_director_plan: scenes mảng không rỗng; mỗi scene có order/line_count/char_count(số) + emotion + emotion_intensity(số). */
export function assertDirectorPlan(input: Record<string, unknown>): void {
  const scenes = input.scenes
  if (!Array.isArray(scenes) || scenes.length === 0) {
    throw new Error('write_director_plan: "scenes" phải là mảng phân tích cảnh KHÔNG rỗng.')
  }
  scenes.forEach((s, i) => {
    const sc = s as Record<string, unknown>
    if (!isFiniteNumber(sc.order)) {
      throw new Error(`write_director_plan: cảnh #${i + 1} thiếu "order" là SỐ (= order_idx của cảnh).`)
    }
    if (!isFiniteNumber(sc.line_count)) {
      throw new Error(`write_director_plan: cảnh order=${String(sc.order)} thiếu "line_count" là SỐ câu thoại.`)
    }
    if (!isFiniteNumber(sc.char_count)) {
      throw new Error(`write_director_plan: cảnh order=${String(sc.order)} thiếu "char_count" là SỐ chữ thoại.`)
    }
    if (!isNonEmptyString(sc.emotion)) {
      throw new Error(`write_director_plan: cảnh order=${String(sc.order)} thiếu "emotion" (cảm xúc chủ đạo).`)
    }
    if (!isFiniteNumber(sc.emotion_intensity)) {
      throw new Error(`write_director_plan: cảnh order=${String(sc.order)} thiếu "emotion_intensity" là SỐ 0–10.`)
    }
  })
}

/** write_video_prompt: đủ trường bắt buộc theo VideoPrompt (scene_order/block_order số; style/scene/motion không rỗng). */
export function assertVideoPrompt(input: Record<string, unknown>): void {
  if (!isFiniteNumber(input.scene_order)) {
    throw new Error('write_video_prompt: thiếu "scene_order" là SỐ thứ tự cảnh.')
  }
  if (!isFiniteNumber(input.block_order)) {
    throw new Error('write_video_prompt: thiếu "block_order" là SỐ thứ tự block (bắt đầu 1).')
  }
  if (!isNonEmptyString(input.style)) {
    throw new Error('write_video_prompt: thiếu "style" (chất liệu render, KHÔNG chứa thời đại).')
  }
  if (!isNonEmptyString(input.scene)) {
    throw new Error('write_video_prompt: thiếu "scene" (bối cảnh cảnh này, nhúng @tag nhân vật/đạo cụ).')
  }
  if (!isNonEmptyString(input.motion)) {
    throw new Error('write_video_prompt: thiếu "motion" (chuyển động camera/nhân vật).')
  }
}

/** plan_shots: scene_order số; shots mảng không rỗng; mỗi shot có block_order≥1 + shot_desc. */
export function assertPlanShots(input: Record<string, unknown>): void {
  if (!isFiniteNumber(input.scene_order)) {
    throw new Error('plan_shots: thiếu "scene_order" là SỐ thứ tự cảnh.')
  }
  const shots = input.shots
  if (!Array.isArray(shots) || shots.length === 0) {
    throw new Error('plan_shots: "shots" phải là mảng shot KHÔNG rỗng (mỗi cảnh tối thiểu 1 block).')
  }
  shots.forEach((sh, i) => {
    const shot = sh as Record<string, unknown>
    if (!isFiniteNumber(shot.block_order) || (shot.block_order as number) < 1) {
      throw new Error(`plan_shots: shot #${i + 1} "block_order" phải là SỐ ≥ 1.`)
    }
    if (!isNonEmptyString(shot.shot_desc)) {
      throw new Error(`plan_shots: shot #${i + 1} thiếu "shot_desc" (ý đồ shot: cỡ cảnh/góc/hành động).`)
    }
  })
}

/** write_image_prompt: scene_order/block_order số; image_prompt_en không rỗng. */
export function assertImagePrompt(input: Record<string, unknown>): void {
  if (!isFiniteNumber(input.scene_order)) {
    throw new Error('write_image_prompt: thiếu "scene_order" là SỐ thứ tự cảnh.')
  }
  if (!isFiniteNumber(input.block_order)) {
    throw new Error('write_image_prompt: thiếu "block_order" là SỐ thứ tự block (bắt đầu 1).')
  }
  if (!isNonEmptyString(input.image_prompt_en)) {
    throw new Error('write_image_prompt: thiếu "image_prompt_en" (prompt ảnh tiếng Anh, KHÔNG rỗng).')
  }
}
```

- [ ] **Step 2: import guard vào index.ts**

Trong `src/main/tools/index.ts`, thêm sau import types (dòng ~17):

```typescript
import {
  assertSkeleton,
  assertDirectorPlan,
  assertVideoPrompt,
  assertPlanShots,
  assertImagePrompt
} from './validators'
```

- [ ] **Step 3: gọi guard trong 5 handler**

planShots.handler — thêm dòng đầu (trước `const sceneOrder`):
```typescript
  handler: (input, ctx) => {
    assertPlanShots(input)
    const sceneOrder = input.scene_order as number
```

writeSkeleton.handler:
```typescript
  handler: (input, ctx) => {
    assertSkeleton(input)
    const skeleton: StorySkeleton = {
```

writeImagePrompt.handler:
```typescript
  handler: (input, ctx) => {
    assertImagePrompt(input)
    const id = db.upsertBlock(
```

writeVideoPrompt.handler:
```typescript
  handler: (input, ctx) => {
    assertVideoPrompt(input)
    const tagNames = (input.tags as string[]) ?? []
```

writeDirectorPlan.handler:
```typescript
  handler: (input, ctx) => {
    assertDirectorPlan(input)
    const plan: DirectorPlan = {
```

- [ ] **Step 4: typecheck + build**

```bash
cd /e/danh-script && npm run typecheck && npm run build
```
Expected: cả hai EXIT 0.

- [ ] **Step 5: grep xác nhận guard đã nối**

```bash
cd /e/danh-script && grep -n "assert" src/main/tools/index.ts
```
Expected: 5 dòng gọi guard (assertPlanShots, assertSkeleton, assertImagePrompt, assertVideoPrompt, assertDirectorPlan) + 1 khối import.

- [ ] **Step 6: Commit**

```bash
cd /e/danh-script && git add src/main/tools/validators.ts src/main/tools/index.ts && git commit -m "feat(tools): guard validate 5 write-tool trọng yếu (chống rác LLM)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Hết nuốt lỗi im lặng (console.warn trong catch)

**Files:**
- Modify: `src/main/pipeline/gates.ts` (catch genre ~185, catch ideal_json ~285)
- Modify: `src/main/pipeline/gateChat.ts` (catch genre ~202)
- Modify: `src/main/pipeline/gate0.ts` (nếu có catch JSON.parse nuốt lỗi)

**Interfaces:** Không đổi chữ ký hàm; chỉ thêm `console.warn('[danh-script] <chỗ>: <lý do>')` trong catch. Không đổi luồng (vẫn không chặn).

- [ ] **Step 1: gates.ts — catch genre**

Trong `runGate`, khối genre à-la-carte, sửa catch rỗng:
```typescript
    } catch {
      /* params_json hỏng → bỏ qua genre, không chặn cổng */
    }
```
thành:
```typescript
    } catch (e) {
      console.warn('[danh-script] runGate: params_json hỏng, bỏ qua genre', e)
    }
```

- [ ] **Step 2: gates.ts — catch ideal_json trong outputIntentHeader**

Sửa:
```typescript
  } catch {
    /* ideal_json hỏng → bỏ header */
  }
```
thành:
```typescript
  } catch (e) {
    console.warn('[danh-script] outputIntentHeader: ideal_json hỏng, bỏ header', e)
  }
```

- [ ] **Step 3: gateChat.ts — catch genre**

Sửa:
```typescript
    } catch {
      /* params_json hỏng → bỏ qua genre */
    }
```
thành:
```typescript
    } catch (e) {
      console.warn('[danh-script] runGateChat: params_json hỏng, bỏ qua genre', e)
    }
```

- [ ] **Step 4: gate0.ts — kiểm & vá nếu có catch nuốt lỗi**

Đọc `src/main/pipeline/gate0.ts`. Nếu có `catch {}` rỗng quanh `JSON.parse`, thêm `console.warn('[danh-script] gate0: <lý do>', e)`. Nếu không có catch nuốt lỗi (JSON.parse trần), BỎ QUA task con này — không tự thêm try/catch mới (giữ luồng như cũ, tránh đổi hành vi).

- [ ] **Step 5: typecheck + build**

```bash
cd /e/danh-script && npm run typecheck && npm run build
```
Expected: cả hai EXIT 0.

- [ ] **Step 6: grep xác nhận**

```bash
cd /e/danh-script && grep -rn "danh-script\]" src/main/pipeline/gates.ts src/main/pipeline/gateChat.ts
```
Expected: ≥3 dòng console.warn mới.

- [ ] **Step 7: Commit**

```bash
cd /e/danh-script && git add src/main/pipeline/gates.ts src/main/pipeline/gateChat.ts src/main/pipeline/gate0.ts && git commit -m "fix(pipeline): console.warn thay catch nuốt lỗi im lặng

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Sửa docs mâu thuẫn (luật gate0 / ai tạo @tag)

**Files:**
- Modify: `skills/identity-lock.md:19-21` ("ideaAnalyst phát hiện... tạo tag" → assetDeriver tách @tag TỪ kịch bản ở gate_assets)
- Modify: `src/main/pipeline/orchestrator.ts` (mô tả `run_worker`: `gate0 (ý đồ/bối cảnh)` → `gate0 (chỉ ý đồ — KHÔNG tạo cảnh/@tag)`)

**Bối cảnh:** Luật mới (đã xác minh trong code): gate0/ideaAnalyst CHỈ chốt ý đồ (write_ideal_brief), KHÔNG tạo cảnh/@tag. @tag tách ở gate_assets (assetDeriver via derive_assets). Docs cũ nói ngược → sửa cho khớp.

- [ ] **Step 1: Sửa identity-lock.md phần "Ai tạo tag?"**

Trong `skills/identity-lock.md`, thay khối:
```markdown
## Ai tạo tag?

`ideaAnalyst` phát hiện nhân vật/đạo cụ lặp lại trong ideal → gọi `save_asset` tạo tag + identity_lock (mặt/dáng nếu ideal có mô tả; không có thì để trống, người dùng bổ sung ảnh tư liệu sau).
```
thành:
```markdown
## Ai tạo tag?

`assetDeriver` (cổng NGUYÊN LIỆU / gate_assets) TÁCH @tag TỪ kịch bản final: đọc toàn văn narration (`read_script_full`) rồi `derive_assets` cho nhân vật/bối cảnh/đạo cụ LẶP LẠI thật sự có trong kịch bản. `ideaAnalyst` (gate0) CHỈ chốt ý đồ — KHÔNG tạo cảnh, KHÔNG tạo @tag. Mặt/dáng để trống nếu kịch bản chưa tả; người dùng bổ sung ảnh tư liệu sau.
```

- [ ] **Step 2: Sửa orchestrator.ts mô tả run_worker**

Trong `src/main/pipeline/orchestrator.ts`, mô tả tool `run_worker`, sửa:
```typescript
        'gate: gate0 (ý đồ/bối cảnh) | gate1a (nháp) | gate1b (khung xương) | gate1c (chuyển thể) | ' +
```
thành:
```typescript
        'gate: gate0 (chỉ ý đồ — KHÔNG tạo cảnh/@tag) | gate1a (nháp) | gate1b (khung xương) | gate1c (chuyển thể) | ' +
```

- [ ] **Step 3: typecheck + build**

```bash
cd /e/danh-script && npm run typecheck && npm run build
```
Expected: cả hai EXIT 0.

- [ ] **Step 4: grep xác nhận**

```bash
cd /e/danh-script && grep -n "KHÔNG tạo cảnh" src/main/pipeline/orchestrator.ts skills/identity-lock.md
```
Expected: ≥2 dòng khớp.

- [ ] **Step 5: Commit**

```bash
cd /e/danh-script && git add skills/identity-lock.md src/main/pipeline/orchestrator.ts && git commit -m "docs: sửa luật gate0 chỉ chốt ý đồ; @tag tách ở gate_assets

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

**Gate P1 (nghiệm thu Phase 1):** `npm run typecheck` EXIT 0 + `npm run build` EXIT 0. Grep: layers 4 thợ đọc từ workerSpecs; 5 guard đã nối; ≥3 console.warn; docs gate0 khớp luật mới.

---

## PHASE 2 — Lá chắn nhất quán @tag

### Task 5: Helper tagGuard (kiểm @tag tồn tại thật)

**Files:**
- Create: `src/main/pipeline/tagGuard.ts`

**Interfaces:**
- Produces: `extractTags(text: string): string[]` (regex `@[\w-]+`, bỏ `@`, trả UNIQUE upper-cased); `checkTagsExist(projectId: number, tags: string[]): { missing: string[] }` (đối chiếu `projectTagMap`).
- Consumes: Task 6 dùng trong đường chặn chốt cổng.

**Bối cảnh:** `projectTagMap(projectId)` trả `AssetTag[]` với field `tag` (không kèm `@`, VD `'ADIL'`). So khớp KHÔNG phân biệt hoa/thường để khoan dung lỗi gõ.

- [ ] **Step 1: Tạo tagGuard.ts**

Create `src/main/pipeline/tagGuard.ts`:

```typescript
// ============================================================
// Danh Script — Lá chắn @tag: kiểm @tag nhúng trong prompt có asset thật không.
// Chống asset mồ côi do gõ sai tên tag. Chỉ ĐỐI CHIẾU, không tự sửa.
// ============================================================
import { projectTagMap } from '../db'

/** Rút mọi @tag trong text → mảng tên (KHÔNG kèm @), viết HOA, unique. */
export function extractTags(text: string): string[] {
  if (!text) return []
  const found = text.match(/@[\w-]+/g) ?? []
  const set = new Set<string>()
  for (const raw of found) {
    const name = raw.slice(1).toUpperCase()
    if (name) set.add(name)
  }
  return [...set]
}

/**
 * Đối chiếu danh sách tag (tên, không @) với asset thật của dự án.
 * Trả { missing } = tag KHÔNG có asset tương ứng (so khớp không phân biệt hoa/thường).
 */
export function checkTagsExist(projectId: number, tags: string[]): { missing: string[] } {
  const known = new Set(projectTagMap(projectId).map((a) => a.tag.toUpperCase()))
  const missing = tags.filter((t) => !known.has(t.toUpperCase()))
  return { missing }
}
```

- [ ] **Step 2: typecheck + build**

```bash
cd /e/danh-script && npm run typecheck && npm run build
```
Expected: cả hai EXIT 0.

- [ ] **Step 3: Commit**

```bash
cd /e/danh-script && git add src/main/pipeline/tagGuard.ts && git commit -m "feat(pipeline): tagGuard extractTags + checkTagsExist

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Đưa cờ @tag vào lá chắn chốt cổng gate2/gate3

**Files:**
- Modify: `src/main/pipeline/gateChat.ts` (`confirmGate`, nhánh gate2_image/gate3_video: thêm kiểm @tag mồ côi)

**Interfaces:**
- Consumes: `extractTags`, `checkTagsExist` từ tagGuard; `listScenes`, `listBlocks` từ db.
- Produces: `confirmGate` thêm dòng cảnh báo (KHÔNG cứng chặn) vào `problems` khi có @tag mồ côi.

**Bối cảnh:** Đây là **cờ mềm** — @tag nhúng trong prompt mà không có asset → liệt kê rõ nhưng KHÔNG chặn cứng (tránh false-positive). Chèn vào `problems[]` hiện có với tiền tố `⚠`. Vì `problems.length` đang chặn cứng, ta tách cờ mềm ra biến riêng để CHỈ cảnh báo (không throw).

- [ ] **Step 1: import tagGuard + listScenes/listBlocks**

Trong `src/main/pipeline/gateChat.ts`, thêm import (cạnh import db):
```typescript
import { extractTags, checkTagsExist } from './tagGuard'
import { listScenes, listBlocks } from '../db'
```
(Nếu `listScenes`/`listBlocks` chưa import ở file này thì thêm; nếu đã có, chỉ thêm dòng tagGuard.)

- [ ] **Step 2: Thêm khối cảnh báo @tag mồ côi trong confirmGate**

Trong `confirmGate`, nhánh `if (gateStage === 'gate2_image' || gateStage === 'gate3_video')`, NGAY TRƯỚC khối `if (problems.length) { throw ... }`, chèn:

```typescript
    // ⭐ Cờ mềm @tag: liệt kê @tag nhúng trong prompt mà KHÔNG có asset (gõ sai / mồ côi).
    // Chỉ CẢNH BÁO qua console — không cứng chặn (tránh false-positive cảnh không người).
    const orphanTags = new Set<string>()
    for (const s of listScenes(projectId)) {
      for (const b of listBlocks(s.id)) {
        const text =
          need === 'image' ? (b.image_prompt_en ?? '') : (b.video_prompt_json ?? '')
        const tags = extractTags(text)
        if (tags.length) {
          for (const m of checkTagsExist(projectId, tags).missing) orphanTags.add(m)
        }
      }
    }
    if (orphanTags.size) {
      console.warn(
        `[danh-script] confirmGate ${gateStage}: @tag mồ côi (không có asset): ${[...orphanTags].join(', ')}`
      )
    }
```

> Ghi chú thiết kế: cờ này CỐ Ý không đẩy vào `problems` (không chặn chốt) — chỉ log để bạn/reviewer thấy. Nếu sau này muốn chặn cứng, chuyển sang `problems.push(...)`. Spec Phase 2.2 yêu cầu "cờ mềm, không cứng chặn" → giữ ở console + (tùy chọn) report reviewer.

- [ ] **Step 3: typecheck + build**

```bash
cd /e/danh-script && npm run typecheck && npm run build
```
Expected: cả hai EXIT 0.

- [ ] **Step 4: grep xác nhận nhánh @tag**

```bash
cd /e/danh-script && grep -n "mồ côi\|orphanTags\|checkTagsExist" src/main/pipeline/gateChat.ts
```
Expected: ≥3 dòng.

- [ ] **Step 5: Commit**

```bash
cd /e/danh-script && git add src/main/pipeline/gateChat.ts && git commit -m "feat(pipeline): cờ mềm @tag mồ côi khi chốt gate ảnh/video

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: Làm dày identity-lock.md (L0–L5 + bảng R/X)

**Files:**
- Modify: `skills/identity-lock.md` (21 → ~120–150 dòng)

**Interfaces:** Không code. Nội dung markdown thuần, được nạp làm layer chung cho assetDeriver/imgPrompter (đã trong WORKER_SPECS.layers).

**Bối cảnh:** Mượn mô hình phái sinh phân lớp L0–L5 + luật "面容不变/姿态不变" (mặt không đổi/dáng không đổi). GIỮ toàn bộ nội dung cũ (Nguyên tắc, Quy ước @tag trong prompt, đã sửa "Ai tạo tag?" ở Task 4), THÊM 2 mục mới: hệ phái sinh L0–L5 và bảng Giữ/Cấm (R/X).

- [ ] **Step 1: Thêm 2 mục vào cuối identity-lock.md**

Nối vào CUỐI `skills/identity-lock.md` (sau mục "Ai tạo tag?" đã sửa):

```markdown

## Phái sinh phân lớp L0 → L5 (mượn art_character_derivative)

Nhân vật KHÔNG vẽ lại từ đầu mỗi biến thể. Dựng 1 lần **L0**, rồi phái sinh từng lớp — MỖI lớp chỉ đổi đúng phần của nó, các lớp dưới GIỮ NGUYÊN.

| Lớp | Đổi gì | Khóa gì (bất biến) |
|---|---|---|
| **L0** | Base: mặt + vóc dáng gốc (character sheet 4-view, mặt mộc, nền trơn) | — (đây là gốc) |
| **L1** | Trang điểm / biểu cảm | Mặt (xương/mắt/mũi/miệng), dáng |
| **L2** | Kiểu & màu tóc | Mặt, dáng, lớp L1 |
| **L3** | Trang phục chính (theo era/bối cảnh) | Mặt, dáng, tóc |
| **L4** | Lớp áo ngoài / biến thể trang phục | Mặt, dáng, tóc, L3 nền |
| **L5** | Phụ kiện (kính, mũ, trang sức, đạo cụ cầm tay) | Toàn bộ L0–L4 |

**Luật cốt:**
- **面容不变 (mặt không đổi):** L1–L5 TUYỆT ĐỐI không đổi cấu trúc khuôn mặt. Đổi mặt = nhân vật khác = hỏng nhất quán.
- **姿态不变 (dáng không đổi):** vóc dáng/tỉ lệ cơ thể giữ nguyên xuyên mọi biến thể.
- Phái sinh đi TỪ DƯỚI LÊN: muốn đổi tóc (L2) thì L0+L1 phải cố định trước.
- Mỗi biến thể trong prompt = nhúng `@tag` gốc + CHỈ mô tả phần lớp đang đổi. VD: `@LAN in a red áo dài (L3), hair and face identical to @LAN reference`.

## Bảng Giữ / Cấm (R = giữ / X = cấm) cho nhất quán danh tính

| Hạng mục | R (giữ) | X (cấm) |
|---|---|---|
| Khuôn mặt | Nhúng @tag + "face identical to @tag reference" | Tả lại mắt/mũi/miệng bằng lời khi đã có @tag |
| Vóc dáng | Giữ tỉ lệ đầu-thân đã khai ở L0 | Đổi chiều cao/thân hình giữa các cảnh |
| Tóc | Đổi theo cảnh nhưng khai rõ lớp L2 | Đổi tóc mà không ghi là biến thể (gây "người khác") |
| Trang phục | Đổi theo era/bối cảnh (L3/L4) | Trộn era (đồ cổ + đồng hồ hiện đại) trừ khi chủ đích |
| @tag | 1 nhân vật = 1 tag VIẾT HOA không dấu, dùng lại | Tạo tag mới cho cùng 1 người ở cảnh khác |
| Mô tả prompt | Chỉ tả phần MỀM (đồ/hành động/lớp đang đổi) | Mô tả cứng mặt/dáng chồng lên @tag (xung đột ảnh tư liệu) |
```

- [ ] **Step 2: build (đảm bảo bundle skill không vỡ)**

```bash
cd /e/danh-script && npm run build
```
Expected: EXIT 0 (chỉ .md, build vẫn phải sạch).

- [ ] **Step 3: grep xác nhận L0–L5 + R/X**

```bash
cd /e/danh-script && grep -n "L0\|面容不变\|R = giữ\|Phái sinh phân lớp" skills/identity-lock.md
```
Expected: ≥3 dòng khớp (L0, luật mặt-không-đổi, tiêu đề bảng R/X).

- [ ] **Step 4: Commit**

```bash
cd /e/danh-script && git add skills/identity-lock.md && git commit -m "docs(skill): làm dày identity-lock L0-L5 + bảng R/X

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

**Gate P2 (nghiệm thu Phase 2):** typecheck + build EXIT 0. Grep `identity-lock.md` có L0–L5 + R/X. Grep `gateChat.ts` chứa nhánh `checkTagsExist` (cờ @tag mồ côi). tagGuard.ts tồn tại + biên dịch.

---

## PHASE 3 — Rà soát nhẹ 3 thợ sát đầu ra (KHÔNG viết lại)

### Task 8: Verify 3 thợ đủ 7 phần + template + đúng 1 {{OUTPUT_INTENT}}

**Files:**
- Read/verify: `skills/free/_execution_assetDeriver.md`, `_execution_imgPrompter.md`, `_execution_vidPrompter.md`
- Modify: CHỈ khi phát hiện thiếu heading/template hoặc sai số lượng `{{OUTPUT_INTENT}}` (vá tối thiểu).

**Bối cảnh:** 3 thợ đã dày (127/110/122 dòng). Task này là **kiểm tra**, không làm dày. Chỉ sửa nếu grep lộ khuyết thật.

Khung 7 phần cần có (theo `scriptFinal.md`): `# Vai trò` · `## Công cụ` · `## Quy trình` · `## Skills` · `## Ràng buộc`/red-line · `## Khung output BẮT BUỘC`/template · `## Tự kiểm`/checklist.

- [ ] **Step 1: grep heading 3 thợ**

```bash
cd /e/danh-script && for f in assetDeriver imgPrompter vidPrompter; do echo "=== $f ==="; grep -n "^#" "skills/free/_execution_$f.md"; done
```
Expected: mỗi thợ có heading Vai trò + Công cụ + Quy trình + Skills + Ràng buộc/red-line + Khung output/template + Tự kiểm. Nếu THIẾU heading nào, ghi lại thợ + heading thiếu.

- [ ] **Step 2: grep {{OUTPUT_INTENT}} (đếm)**

```bash
cd /e/danh-script && for f in assetDeriver imgPrompter vidPrompter; do echo "=== $f ==="; grep -c "{{OUTPUT_INTENT}}" "skills/free/_execution_$f.md"; done
```
Expected: `vidPrompter` = 1 (đã có). `assetDeriver`/`imgPrompter` = 0 là chấp nhận được (2 thợ này không phụ thuộc output_intent theo thiết kế hiện tại). **KHÔNG** tự thêm `{{OUTPUT_INTENT}}` vào thợ chưa có nếu handler không inject cho thợ đó — chỉ đảm bảo KHÔNG có thợ nào có >1 (chống replaceAll lặp thừa). Nếu bất kỳ thợ nào >1 → xoá bản dư.

- [ ] **Step 3: grep template output**

```bash
cd /e/danh-script && for f in assetDeriver imgPrompter vidPrompter; do echo "=== $f ==="; grep -ni "khung output\|template\|BẮT BUỘC" "skills/free/_execution_$f.md" | head -3; done
```
Expected: mỗi thợ có mục khung output/template. Nếu thiếu ở thợ nào → thêm 1 mục `## Khung output BẮT BUỘC` tối thiểu mô tả cấu trúc trả về của thợ đó (bảng asset cho assetDeriver / prompt 3 đoạn cho imgPrompter / JSON 7 trường cho vidPrompter). CHỈ thêm khi thật sự thiếu.

- [ ] **Step 4: (chỉ nếu Step 1-3 lộ khuyết) vá tối thiểu + build**

Nếu có sửa: `cd /e/danh-script && npm run build` → EXIT 0. Nếu KHÔNG sửa gì (3 thợ đã đủ), bỏ qua build, ghi chú "Phase 3: 3 thợ đã đạt, không cần sửa."

- [ ] **Step 5: Commit (chỉ nếu có sửa)**

```bash
cd /e/danh-script && git add skills/free/_execution_*.md && git commit -m "docs(skill): vá vặt 3 thợ sát đầu ra (rà soát 7 phần)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```
Nếu không sửa gì: bỏ qua commit, báo lại đã verify đạt.

**Gate P3 (nghiệm thu Phase 3):** grep 3 thợ đủ 7 heading + có template; không thợ nào >1 `{{OUTPUT_INTENT}}`. Nếu có sửa: build EXIT 0.

---

## PHASE 4 — Chặn chốt cổng theo điểm review (không tự sửa)

### Task 9: confirmGate chặn grade D, cảnh báo C (force qua)

**Files:**
- Modify: `src/main/pipeline/gateChat.ts` (`confirmGate` thêm tham số `force`, đọc grade review, chặn D)
- Modify: `src/main/ipc.ts` (`gate:confirm` nhận `force`)
- Modify: `src/preload/index.ts` (bridge `confirm` nhận `force`)
- Modify: `src/renderer/src/wizardStore.ts` (`confirmGate` nhận `force`)
- Modify: `src/renderer/src/ui/wizard/GateChatPanel.tsx` (nút "Chốt dù điểm C")

**Interfaces:**
- `confirmGate(projectId: number, gateStage: string, force?: boolean): void` — D → luôn throw; C → throw trừ khi `force`; A/B/`?`/không-review → qua.
- Chuỗi IPC: `gate:confirm(projectId, gateStage, force)` → preload `confirm(projectId, gateStage, force)` → store `confirmGate(projectId, stage, force)`.
- Consumes: `latestReviews(projectId)` từ db (đã có: trả `Array<{gate_stage, grade, report}>`).

**Bối cảnh:** `latestReviews` đọc bảng reviews (grade + notes AS report). `saveReview` DELETE-then-INSERT nên mỗi cổng chỉ 1 review mới nhất. Grade có thể là `'A'|'B'|'C'|'D'|'?'`.

- [ ] **Step 1: confirmGate đọc grade + chặn**

Trong `src/main/pipeline/gateChat.ts`, thêm import:
```typescript
import { latestReviews } from '../db'
```
(nếu chưa có trong khối import db — gộp vào import hiện tại.)

Đổi chữ ký + thêm khối kiểm grade Ở ĐẦU hàm (sau dòng `if (!isChatGate...)`):
```typescript
export function confirmGate(projectId: number, gateStage: string, force = false): void {
  if (!isChatGate(gateStage)) throw new Error(`Cổng không hợp lệ: ${gateStage}`)

  // ⭐ Chặn theo điểm review mới nhất của cổng (CHỈ CHẶN, không tự sửa).
  //   D → luôn chặn.  C → chặn trừ khi force.  A/B/?/không-review → qua.
  const review = latestReviews(projectId).find((r) => r.gate_stage === gateStage)
  if (review) {
    const grade = (review.grade || '').toUpperCase()
    const gist = (review.report || '').split('\n').slice(0, 3).join(' ').slice(0, 300)
    if (grade === 'D') {
      throw new Error(
        `Cổng "${gateStage}" đang bị chấm D — chưa thể chốt.\nLý do (tóm): ${gist}\n` +
          `Hãy nhắn agent sửa theo báo cáo rồi CHẤM LẠI trước khi chốt.`
      )
    }
    if (grade === 'C' && !force) {
      throw new Error(
        `Cổng "${gateStage}" đang bị chấm C (chưa đạt tối ưu).\nLý do (tóm): ${gist}\n` +
          `Có thể chốt nếu bạn chấp nhận — bấm lại nút "Chốt dù điểm C".`
      )
    }
  }
  // (tiếp tục các lá chắn coverage/@tag hiện có bên dưới)
```

> Đặt khối grade Ở TRÊN các lá chắn coverage hiện có: nếu D thì chặn ngay, khỏi chạy coverage. Giữ nguyên toàn bộ logic coverage/@tag phía sau + `updateProjectStage` cuối hàm.

- [ ] **Step 2: ipc.ts truyền force**

Trong `src/main/ipc.ts`, sửa handler `gate:confirm`:
```typescript
  ipcMain.handle('gate:confirm', async (_e, projectId: number, gateStage: string, force?: boolean) => {
    try {
      confirmGate(projectId, gateStage, force ?? false)
      return ok(true)
    } catch (err) {
      return fail(err)
    }
  })
```

- [ ] **Step 3: preload bridge nhận force**

Trong `src/preload/index.ts`, sửa khai báo type (dòng ~82):
```typescript
    confirm: (projectId: number, gateStage: string, force?: boolean) => Promise<IpcResult<boolean>>
```
và implement (dòng ~163):
```typescript
    confirm: (projectId, gateStage, force) =>
      ipcRenderer.invoke('gate:confirm', projectId, gateStage, force),
```

- [ ] **Step 4: wizardStore.confirmGate nhận force**

Trong `src/renderer/src/wizardStore.ts`, sửa type (dòng ~113):
```typescript
  confirmGate: (projectId: number, stage: ChatGateStage, force?: boolean) => Promise<boolean>
```
và impl (dòng ~352):
```typescript
  async confirmGate(projectId, stage, force) {
    const res = await window.danh.gate.confirm(projectId, stage, force)
    if (res.ok) {
      set({ wizardError: null })
      return true
    }
    set({ wizardError: res.error })
    return false
  },
```

- [ ] **Step 5: GateChatPanel nút "Chốt dù điểm C"**

Trong `src/renderer/src/ui/wizard/GateChatPanel.tsx`, khối nút chốt (dòng ~173-179). Thêm nút force PHỤ chỉ hiện khi `wizardError` chứa cụm "điểm C". Sửa khối:

```tsx
        <button
          className="btn-primary ml-auto text-xs disabled:cursor-not-allowed disabled:opacity-50"
          disabled={anyBusy}
          onClick={() => void confirmGate(projectId, stage).then((okr) => okr && onDone())}
        >
          Chốt &amp; sang cổng sau →
        </button>
```
thành:
```tsx
        {wizardError?.includes('điểm C') && (
          <button
            className="btn-ghost text-xs text-amber-400 disabled:opacity-50"
            disabled={anyBusy}
            onClick={() => void confirmGate(projectId, stage, true).then((okr) => okr && onDone())}
          >
            Chốt dù điểm C
          </button>
        )}
        <button
          className="btn-primary ml-auto text-xs disabled:cursor-not-allowed disabled:opacity-50"
          disabled={anyBusy}
          onClick={() => void confirmGate(projectId, stage).then((okr) => okr && onDone())}
        >
          Chốt &amp; sang cổng sau →
        </button>
```

> Kiểm biến `wizardError` có sẵn trong scope component chưa. Nếu chưa, thêm `const wizardError = useWizard((s) => s.wizardError)` cạnh các selector khác ở đầu component (dòng ~37 vùng khai báo). Xác minh `wizardError` là field trong store (đã dùng `set({ wizardError })` ở store → có).

- [ ] **Step 6: typecheck + build**

```bash
cd /e/danh-script && npm run typecheck && npm run build
```
Expected: cả hai EXIT 0.

- [ ] **Step 7: grep xác nhận chuỗi force + chặn D**

```bash
cd /e/danh-script && grep -n "grade === 'D'\|force" src/main/pipeline/gateChat.ts src/main/ipc.ts src/preload/index.ts src/renderer/src/wizardStore.ts
```
Expected: nhánh `grade === 'D'` ở gateChat; `force` xuất hiện xuyên 4 file.

- [ ] **Step 8: Commit**

```bash
cd /e/danh-script && git add src/main/pipeline/gateChat.ts src/main/ipc.ts src/preload/index.ts src/renderer/src/wizardStore.ts src/renderer/src/ui/wizard/GateChatPanel.tsx && git commit -m "feat(gate): chặn chốt cổng khi review D; cảnh báo C (force qua)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

**Gate P4 (nghiệm thu Phase 4):** typecheck + build EXIT 0. Đọc code: `confirmGate` có nhánh đọc grade + chặn D + cảnh báo C (force). Test tay mô tả: cổng có review D → `gate:confirm` trả lỗi; force qua C được; A/B/không-review qua bình thường.

---

## Rủi ro & giảm thiểu

- **Task 6 (@tag mồ côi) false-positive** → giữ ở console.warn, KHÔNG đẩy `problems` (không chặn cứng). Đúng ý spec "cờ mềm".
- **Task 9 sửa luồng chốt cổng** → làm cuối; giữ `force` để không kẹt cứng ở C; D chặn cứng nhưng luôn cho phép "sửa + chấm lại".
- **Guard Task 2 quá gắt** → chỉ kiểm field bắt buộc + kiểu, KHÔNG kiểm ngữ nghĩa; message hướng dẫn LLM sửa.
- **Đổi chữ ký confirmGate** lan 4 file → mỗi bước có typecheck bắt lệch type ngay.
- **Mỗi phase có typecheck+build gác**; markdown chiếm phần lớn → rủi ro vỡ app thấp.

## Ngoài phạm vi (không làm lần này)

- Vòng tự-sửa tự động (người dùng chọn "chỉ chặn").
- Web search thật cho `research`.
- Render/generate API (ranh giới cứng).
- Làm dày thêm 3 thợ sát đầu ra (đã đủ; Phase 3 chỉ verify).
- Progressive disclosure skill.

---

## Self-Review (đã chạy)

**1. Spec coverage:** Phase 1.1 → Task 1. Phase 1.2 → Task 2. Phase 1.3 → Task 3. Phase 1.4 → Task 4. Phase 2.1 → Task 5. Phase 2.2 → Task 6. Phase 2.3 → Task 7. Phase 3 (điều chỉnh thành verify theo quyết định người dùng) → Task 8. Phase 4.1 → Task 9. Phase 4.2 (review chọn lọc = gợi ý luồng, không code bắt buộc) → ghi nhận trong mô tả, không tạo task riêng (spec nói "chỉ gợi ý, không ép").

**2. Placeholder scan:** Không có TBD/TODO; mọi step code có code thật; message lỗi viết đầy đủ tiếng Việt.

**3. Type consistency:** `confirmGate(projectId, gateStage, force?)` nhất quán 4 file. `WorkerSpec`/`workerSpec()` khớp giữa workerSpecs.ts và 2 nơi tiêu thụ. Guard `assert*` tên khớp import trong index.ts. `extractTags`/`checkTagsExist` khớp tagGuard ↔ gateChat. `latestReviews` trả `{gate_stage, grade, report}` — dùng đúng field trong Task 9.
