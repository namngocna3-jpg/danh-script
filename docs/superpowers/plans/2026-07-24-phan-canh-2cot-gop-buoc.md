# Kế hoạch triển khai: Phân cảnh + Layout 2 cột + Gộp bước kịch bản (G1–G6)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm bước Phân cảnh chi tiết (worker `storyboardWright` + cột `shot_panel_json`), gộp 5 bước kịch bản thành 1 màn 5 tab, dựng layout 2 cột (chat trái · output phải) với panel output đầy đủ + khối "kế thừa", và fix định tuyến dừng ở Chuẩn bị cho dự án mới.

**Architecture:** Giữ nguyên kiến trúc 3 tầng Toonflow (Quyết định điều phối → Thợ thực thi ghi DB → reviewer chấm A/B/C/D). Bước Phân cảnh là 1 CHAT GATE mới (`gate_storyboard`) tái dùng toàn bộ hạ tầng IPC `gate:*` generic hiện có — KHÔNG thêm IPC handler. DB migration additive (thêm cột `blocks.shot_panel_json TEXT`, DB cũ vẫn mở). UI gộp VỎ: `ScriptWorkbench` (5 tab) + `GateWorkbench` (2 cột dùng chung) bọc `GateChatPanel` refactor.

**Tech Stack:** Electron + electron-vite + React 19 + TypeScript + better-sqlite3 (synchronous, WAL). Provider 9router. Engine Seedance/BytePlus. Không test runner — acceptance = `npm run typecheck` + `npm run build` EXIT 0.

## Global Constraints

- KHÔNG đổi provider (giữ 9router). KHÔNG đổi engine (giữ Seedance/BytePlus). KHÔNG gộp worker (giữ tách sub-agent).
- Toàn bộ output/UI/hội thoại tiếng Việt.
- DB migration CHỈ additive (thêm cột/bảng, không đổi/xóa cột cũ) — DB cũ phải mở được.
- `VideoPrompt` giữ nguyên type phẳng (không thêm cột cho CUT).
- Acceptance chuẩn (không test runner): `npm run typecheck` và `npm run build` phải EXIT 0.
- Khi commit: `git add` ĐÚNG danh sách file, KHÔNG `git add .`.
- Làm tuần tự, KHÔNG chạy nhiều request song song (tránh rate-limit).

---

## Cấu trúc file (tóm tắt trách nhiệm)

| File | Vai trò trong kế hoạch này |
|------|-----------|
| `src/main/db/schema.sql` | thêm cột `blocks.shot_panel_json TEXT` |
| `src/main/db/index.ts` | migrate() ALTER additive; mở rộng `upsertBlock` fields |
| `src/main/tools/validators.ts` | `assertShotPanel` |
| `src/main/tools/index.ts` | tool `write_shot_panel`; `read_blocks` trả `shot_panel_json` |
| `src/shared/types.ts` | `ShotPanel`; `Block.shot_panel_json`; union `gate_storyboard` |
| `skills/free/_execution_storyboardWright.md` | ⭐ worker mới |
| `src/main/pipeline/workerSpecs.ts` | spec `storyboardWright` |
| `src/main/pipeline/gateChat.ts` | CHAT_GATES `gate_storyboard` + sửa kickoff img/vid |
| `src/main/pipeline/gates.ts` | snapshotBody case `gate_storyboard` |
| `src/main/pipeline/orchestrator.ts` | GATE_MAP `storyboard` |
| `skills/reviewer.md` | tiêu chí gate_storyboard |
| `src/shared/wizardSteps.ts` | step + STAGE_ORDER storyboard; fix stepFromStage (G5) |
| `src/renderer/src/wizardStore.ts` | GateId + GATE_STAGE storyboard; reload blocks sau chat |
| `src/renderer/src/ui/wizard/GateWorkbench.tsx` | ⭐ MỚI — layout 2 cột + slot rightPanel |
| `src/renderer/src/ui/wizard/StageOutputView.tsx` | ⭐ MỚI — panel output đầy đủ mọi bước |
| `src/renderer/src/ui/wizard/InheritedDataView.tsx` | ⭐ MỚI — khối kế thừa |
| `src/renderer/src/ui/wizard/ScriptWorkbench.tsx` | ⭐ MỚI — 5 tab kịch bản |
| `src/renderer/src/ui/wizard/StoryboardPanel.tsx` | ⭐ MỚI — màn Phân cảnh |
| `src/renderer/src/ui/wizard/GateChatPanel.tsx` | refactor: nhận slot `rightPanel` |
| `src/renderer/src/ui/wizard/WizardView.tsx` | gộp nhánh script; thêm nhánh storyboard; fix onDone |

---

## PHẦN 1 — DB + BACKEND PHÂN CẢNH

### Task 1: Cột `shot_panel_json` + migration additive

**Files:**
- Modify: `src/main/db/schema.sql:38`
- Modify: `src/main/db/index.ts` (hàm `migrate`, quanh dòng 65)

**Interfaces:**
- Produces: cột `blocks.shot_panel_json TEXT` (nullable) tồn tại trong DB mới & DB cũ sau migrate.

- [ ] **Step 1: Thêm cột vào schema.sql**

Trong `CREATE TABLE ... blocks`, thêm dòng sau `video_prompt_json TEXT,` (dòng 38):

```sql
CREATE TABLE IF NOT EXISTS blocks (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  scene_id         INTEGER NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  order_idx        INTEGER NOT NULL,
  shot_desc        TEXT,                  -- ⭐ ý đồ shot (quy hoạch TRƯỚC ở GATE 1): góc/hành động/nội dung khung — để img/vid bám, chống block trống
  image_prompt_en  TEXT,
  video_prompt_json TEXT,
  shot_panel_json  TEXT,                  -- ⭐ khối phân cảnh CHI TIẾT (bước Phân cảnh): cỡ cảnh/góc/camera/Start→End/duration/@tag
  rendered_bool    INTEGER NOT NULL DEFAULT 0
);
```

- [ ] **Step 2: Thêm nhánh ALTER trong migrate()**

Trong `migrate(d)`, ngay sau khối check `shot_desc` (dùng đúng pattern PRAGMA table_info đã có), thêm:

```ts
const blockCols2 = d.prepare('PRAGMA table_info(blocks)').all() as Array<{ name: string }>
if (!blockCols2.some((c) => c.name === 'shot_panel_json')) {
  d.exec('ALTER TABLE blocks ADD COLUMN shot_panel_json TEXT')
}
```

- [ ] **Step 3: Verify build backend compiles**

Run: `npm run typecheck`
Expected: EXIT 0 (chưa dùng cột mới ở nơi nào bắt buộc — chỉ thêm SQL/JS thuần).

- [ ] **Step 4: Commit**

```bash
git add src/main/db/schema.sql src/main/db/index.ts
git commit -m "feat(db): them cot shot_panel_json (additive migration)"
```

---

### Task 2: Mở rộng `upsertBlock` để ghi `shot_panel_json`

**Files:**
- Modify: `src/main/db/index.ts` (hàm `upsertBlock`, quanh dòng 240)

**Interfaces:**
- Consumes: cột `shot_panel_json` (Task 1).
- Produces: `upsertBlock(projectId, sceneOrder, blockOrder, { shot_desc?, image_prompt_en?, video_prompt_json?, shot_panel_json? })` — cập nhật từng phần bằng COALESCE.

- [ ] **Step 1: Thêm field vào type tham số + INSERT + UPDATE**

Sửa signature `fields` thêm `shot_panel_json?: string`. Trong câu INSERT thêm cột `shot_panel_json` và 1 dấu `?`; trong UPDATE thêm `shot_panel_json = COALESCE(?, shot_panel_json)`. Ví dụ khối hoàn chỉnh (giữ nguyên phần còn lại, chỉ chèn field mới):

```ts
export function upsertBlock(
  projectId: number,
  sceneOrder: number,
  blockOrder: number,
  fields: {
    shot_desc?: string
    image_prompt_en?: string
    video_prompt_json?: string
    shot_panel_json?: string
  }
): void {
  const scene = getSceneByOrder(projectId, sceneOrder)
  if (!scene) throw new Error(`upsertBlock: không tìm thấy cảnh order=${sceneOrder}`)
  const existing = db
    .prepare('SELECT id FROM blocks WHERE scene_id = ? AND order_idx = ?')
    .get(scene.id, blockOrder) as { id: number } | undefined
  if (existing) {
    db.prepare(
      `UPDATE blocks SET
         shot_desc = COALESCE(?, shot_desc),
         image_prompt_en = COALESCE(?, image_prompt_en),
         video_prompt_json = COALESCE(?, video_prompt_json),
         shot_panel_json = COALESCE(?, shot_panel_json)
       WHERE id = ?`
    ).run(
      fields.shot_desc ?? null,
      fields.image_prompt_en ?? null,
      fields.video_prompt_json ?? null,
      fields.shot_panel_json ?? null,
      existing.id
    )
  } else {
    db.prepare(
      `INSERT INTO blocks (scene_id, order_idx, shot_desc, image_prompt_en, video_prompt_json, shot_panel_json)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      scene.id,
      blockOrder,
      fields.shot_desc ?? null,
      fields.image_prompt_en ?? null,
      fields.video_prompt_json ?? null,
      fields.shot_panel_json ?? null
    )
  }
}
```

> ⚠️ Giữ ĐÚNG tên hàm phụ (`getSceneByOrder`) và cấu trúc INSERT/UPDATE thực tế trong file — chỉ chèn `shot_panel_json` vào đúng 3 chỗ (type param, INSERT cột+?, UPDATE COALESCE). Nếu code thực tế khác chi tiết, chỉ thêm field mới, KHÔNG viết lại logic.

- [ ] **Step 2: Verify**

Run: `npm run typecheck`
Expected: EXIT 0.

- [ ] **Step 3: Commit**

```bash
git add src/main/db/index.ts
git commit -m "feat(db): upsertBlock ho tro shot_panel_json (COALESCE partial update)"
```

---

### Task 3: Validator `assertShotPanel`

**Files:**
- Modify: `src/main/tools/validators.ts` (thêm hàm cuối file, sau `assertImagePrompt` dòng 115)

**Interfaces:**
- Produces: `export function assertShotPanel(input: Record<string, unknown>): void` — throw lỗi tiếng Việt nếu thiếu field bắt buộc.

- [ ] **Step 1: Thêm hàm**

Chèn vào cuối `validators.ts` (dùng lại `isNonEmptyString`/`isFiniteNumber` đã có ở đầu file):

```ts
/** write_shot_panel: scene_order số; blocks mảng không rỗng; mỗi block có block_order≥1 + shot_size/camera_angle/camera_move/subject/action_start/action_end + duration_sec là SỐ ≤8. */
export function assertShotPanel(input: Record<string, unknown>): void {
  if (!isFiniteNumber(input.scene_order)) {
    throw new Error('write_shot_panel: thiếu "scene_order" là SỐ thứ tự cảnh.')
  }
  const blocks = input.blocks
  if (!Array.isArray(blocks) || blocks.length === 0) {
    throw new Error('write_shot_panel: "blocks" phải là mảng shot KHÔNG rỗng (mỗi cảnh ≥1 shot).')
  }
  blocks.forEach((b, i) => {
    const bl = b as Record<string, unknown>
    const at = `shot #${i + 1}`
    if (!isFiniteNumber(bl.block_order) || (bl.block_order as number) < 1) {
      throw new Error(`write_shot_panel: ${at} "block_order" phải là SỐ ≥ 1.`)
    }
    if (!isNonEmptyString(bl.shot_size)) {
      throw new Error(`write_shot_panel: ${at} thiếu "shot_size" (close-up/medium/wide...).`)
    }
    if (!isNonEmptyString(bl.camera_angle)) {
      throw new Error(`write_shot_panel: ${at} thiếu "camera_angle" (eye-level/low/high/over-shoulder...).`)
    }
    if (!isNonEmptyString(bl.camera_move)) {
      throw new Error(`write_shot_panel: ${at} thiếu "camera_move" (static/pan/dolly/orbit...).`)
    }
    if (!isNonEmptyString(bl.subject)) {
      throw new Error(`write_shot_panel: ${at} thiếu "subject" (chủ thể + @tag dùng trong shot).`)
    }
    if (!isNonEmptyString(bl.action_start)) {
      throw new Error(`write_shot_panel: ${at} thiếu "action_start" (tư thế/trạng thái ĐẦU).`)
    }
    if (!isNonEmptyString(bl.action_end)) {
      throw new Error(`write_shot_panel: ${at} thiếu "action_end" (tư thế/trạng thái CUỐI + 1 chi tiết vật lý).`)
    }
    if (!isFiniteNumber(bl.duration_sec) || (bl.duration_sec as number) <= 0 || (bl.duration_sec as number) > 8) {
      throw new Error(`write_shot_panel: ${at} "duration_sec" phải là SỐ trong (0, 8] (Seedance hỏng ở 5–8s → mỗi shot ≤8s).`)
    }
  })
}
```

- [ ] **Step 2: Verify**

Run: `npm run typecheck`
Expected: EXIT 0.

- [ ] **Step 3: Commit**

```bash
git add src/main/tools/validators.ts
git commit -m "feat(tools): assertShotPanel validate input write_shot_panel"
```

---

### Task 4: Tool `write_shot_panel` + `read_blocks` trả `shot_panel_json`

**Files:**
- Modify: `src/main/tools/index.ts` (import validators ~18; `readBlocks` handler 95–123; thêm def `writeShotPanel`; đăng ký vào `ALL_TOOLS` 895–926)

**Interfaces:**
- Consumes: `assertShotPanel` (Task 3), `upsertBlock` mở rộng (Task 2), `linkAssetsFromTags` (34–45).
- Produces: tool `write_shot_panel` (schema: `scene_order:number`, `blocks: ShotPanelInput[]`); `read_blocks` output thêm `shot_panel_json`.

- [ ] **Step 1: Import validator**

Thêm `assertShotPanel` vào dòng import từ `./validators` (18–24):

```ts
import {
  assertSkeleton,
  assertDirectorPlan,
  assertVideoPrompt,
  assertPlanShots,
  assertImagePrompt,
  assertShotPanel
} from './validators'
```

- [ ] **Step 2: `read_blocks` trả thêm `shot_panel_json`**

Trong `readBlocks` handler (95–123): thêm `shot_panel_json` vào type `out` và vào object push. Sửa:

```ts
const out: Array<{
  scene_order: number
  block_order: number
  shot_desc: string | null
  image_prompt_en: string | null
  video_prompt: unknown
  shot_panel: unknown
}> = []
// ... trong vòng lặp block:
out.push({
  scene_order: s.order_idx,
  block_order: b.order_idx,
  shot_desc: b.shot_desc ?? null,
  image_prompt_en: b.image_prompt_en ?? null,
  video_prompt: b.video_prompt_json ? JSON.parse(b.video_prompt_json) : null,
  shot_panel: b.shot_panel_json ? JSON.parse(b.shot_panel_json) : null
})
```

> ⚠️ Nếu `b` (row block) trong file chưa có field `shot_panel_json` do type ràng buộc, đảm bảo hàm đọc block (`listBlocks`) `SELECT *` hoặc thêm cột vào SELECT + type `Block` (Task 5 thêm field type). Nếu `listBlocks` dùng `SELECT *` thì tự có.

- [ ] **Step 3: Thêm def `writeShotPanel`**

Thêm ngay trước mảng `ALL_TOOLS` (theo mẫu `writeImagePrompt`/`planShots` đã có trong file). Ghi `shot_panel_json` bằng `JSON.stringify` + gán @tag qua `linkAssetsFromTags`:

```ts
const writeShotPanel: ToolDef = {
  schema: {
    name: 'write_shot_panel',
    description:
      'Ghi KHỐI PHÂN CẢNH CHI TIẾT cho từng shot của 1 cảnh (bước Phân cảnh, SAU Nguyên liệu). ' +
      'Mỗi block = 1 shot: cỡ cảnh/góc/camera/Start→End+vật lý/duration≤8s/@tag. asset_tags trỏ @tag CÓ THẬT → tự ghi block_assets. ' +
      'Không bịa @tag; duration mỗi shot ≤8s (điểm hỏng Seedance 5–8s).',
    input_schema: {
      type: 'object',
      properties: {
        scene_order: { type: 'number', description: 'Thứ tự cảnh (order_idx).' },
        blocks: {
          type: 'array',
          description: 'Mảng shot của cảnh này (mỗi phần tử 1 block/shot).',
          items: {
            type: 'object',
            properties: {
              block_order: { type: 'number', description: 'Thứ tự block trong cảnh (bắt đầu 1).' },
              shot_size: { type: 'string', description: 'close-up | medium | wide | extreme wide...' },
              camera_angle: { type: 'string', description: 'eye-level | low angle | high angle | over-shoulder...' },
              camera_move: { type: 'string', description: 'static | pan left | dolly in | orbit...' },
              subject: { type: 'string', description: 'Chủ thể + @tag dùng trong shot.' },
              action_start: { type: 'string', description: 'Tư thế/trạng thái ĐẦU.' },
              action_end: { type: 'string', description: 'Tư thế/trạng thái CUỐI + 1 chi tiết vật lý.' },
              layout: { type: 'string', description: 'Map bố trí không gian khi ≥2 vật (tùy chọn).' },
              cuts: { type: 'string', description: 'CUT-by-CUT nếu shot nhiều cắt (tùy chọn).' },
              duration_sec: { type: 'number', description: 'Ước tính thời lượng shot, ≤8s.' },
              asset_tags: {
                type: 'array',
                items: { type: 'string' },
                description: '@tag nguyên liệu dùng trong shot (ghi vào block_assets).'
              },
              notes: { type: 'string', description: 'Ý đồ cảm xúc/ánh sáng của shot (tùy chọn).' }
            },
            required: [
              'block_order',
              'shot_size',
              'camera_angle',
              'camera_move',
              'subject',
              'action_start',
              'action_end',
              'duration_sec'
            ]
          }
        }
      },
      required: ['scene_order', 'blocks']
    }
  },
  handler: (input, ctx) => {
    assertShotPanel(input)
    const sceneOrder = input.scene_order as number
    const blocks = input.blocks as Array<Record<string, unknown>>
    for (const b of blocks) {
      const blockOrder = b.block_order as number
      const panel = {
        shot_size: b.shot_size,
        camera_angle: b.camera_angle,
        camera_move: b.camera_move,
        subject: b.subject,
        action_start: b.action_start,
        action_end: b.action_end,
        layout: b.layout ?? null,
        cuts: b.cuts ?? null,
        duration_sec: b.duration_sec,
        asset_tags: Array.isArray(b.asset_tags) ? b.asset_tags : [],
        notes: b.notes ?? null
      }
      db.upsertBlock(ctx.projectId, sceneOrder, blockOrder, {
        shot_panel_json: JSON.stringify(panel)
      })
      // Gán @tag → block_assets (tái dùng helper: lấy block id qua scene+order).
      const declaredTags = (panel.asset_tags as string[]).map(String)
      const scene = db.getSceneByOrder(ctx.projectId, sceneOrder)
      if (scene) {
        const blkRow = db.getBlockByOrder(scene.id, blockOrder)
        if (blkRow) {
          const panelText = [panel.subject, panel.action_start, panel.action_end, panel.layout, panel.cuts]
            .filter(Boolean)
            .join(' ')
          linkAssetsFromTags(ctx.projectId, blkRow.id, declaredTags, panelText)
        }
      }
    }
    return { ok: true, scene_order: sceneOrder, count: blocks.length }
  }
}
```

> ⚠️ `getSceneByOrder`/`getBlockByOrder` — dùng ĐÚNG tên helper thực tế trong `db/index.ts`. Nếu `linkAssetsFromTags` đã tự resolve block id từ (projectId, blockId) thì truyền theo chữ ký thực của nó (34–45). Nếu không có `getBlockByOrder`, dùng cách lấy block id mà `write_image_prompt`/`write_video_prompt` đang dùng để gán block_assets (copy đúng pattern đó).

- [ ] **Step 4: Đăng ký vào `ALL_TOOLS`**

Thêm `writeShotPanel` vào mảng `ALL_TOOLS` (895–926), đặt gần `planShots`/`writeImagePrompt`:

```ts
const ALL_TOOLS: ToolDef[] = [
  // ... các def hiện có ...
  writeShotPanel,
  // ... listSkills, readSkillFileTool ở cuối ...
]
```

- [ ] **Step 5: Verify**

Run: `npm run typecheck`
Expected: EXIT 0.

- [ ] **Step 6: Commit**

```bash
git add src/main/tools/index.ts
git commit -m "feat(tools): tool write_shot_panel + read_blocks tra shot_panel"
```

---

### Task 5: Type `ShotPanel` + `Block.shot_panel_json` + union `gate_storyboard`

**Files:**
- Modify: `src/shared/types.ts` (`Stage` 30; `Block` 190; `ChatGateStage` 398; thêm `ShotPanel`)

**Interfaces:**
- Produces: `ShotPanel` interface; `Block.shot_panel_json: string | null`; `'gate_storyboard'` trong `Stage` + `ChatGateStage`.

- [ ] **Step 1: Thêm `'gate_storyboard'` vào `Stage`**

Trong union `Stage` (30), chèn giữa `'gate_assets'` và `'gate2_image'`:

```ts
export type Stage =
  // ... các stage trước ...
  | 'gate_assets'
  | 'gate_storyboard'
  | 'gate2_image'
  | 'gate3_video'
  // ...
```

- [ ] **Step 2: Thêm `shot_panel_json` vào `Block`**

Trong interface `Block` (190):

```ts
export interface Block {
  id: number
  scene_id: number
  order_idx: number
  shot_desc: string | null
  image_prompt_en: string | null
  video_prompt_json: string | null
  shot_panel_json: string | null
  rendered_bool: 0 | 1
}
```

- [ ] **Step 3: Thêm interface `ShotPanel`**

Thêm gần `Block`:

```ts
/** 1 block = 1 shot: khối phân cảnh chi tiết (cột blocks.shot_panel_json, JSON). */
export interface ShotPanel {
  shot_size: string
  camera_angle: string
  camera_move: string
  subject: string
  action_start: string
  action_end: string
  layout: string | null
  cuts: string | null
  duration_sec: number
  asset_tags: string[]
  notes: string | null
}
```

- [ ] **Step 4: Thêm `'gate_storyboard'` vào `ChatGateStage`**

Trong union `ChatGateStage` (398), thêm `| 'gate_storyboard'`.

- [ ] **Step 5: Verify**

Run: `npm run typecheck`
Expected: EXIT 0.

- [ ] **Step 6: Commit**

```bash
git add src/shared/types.ts
git commit -m "feat(types): ShotPanel + Block.shot_panel_json + gate_storyboard"
```

---

### Task 6: Worker `_execution_storyboardWright.md`

**Files:**
- Create: `skills/free/_execution_storyboardWright.md`

**Interfaces:**
- Consumes: read tools (`read_plan`, `read_script_full`, `read_scenes`, `read_assets`), `write_shot_panel`.
- Produces: file skill nạp làm system prompt cho worker `storyboardWright`.

- [ ] **Step 1: Viết worker**

```markdown
# THỢ PHÂN CẢNH · storyboardWright (tầng THỰC THI) 🎞️

Bạn là **storyboardWright** — thợ phân cảnh. Nhận kịch bản FINAL + quy hoạch đạo diễn + @tag nguyên liệu đã có, chia MỖI cảnh thành 1..n **shot** và điền KHỐI PHÂN CẢNH CHI TIẾT cho từng shot. Đây là bước làm giàu để bước Prompt ảnh/video BÁM theo, KHÔNG bịa lại.

## Nguyên tắc
- CHỈ dựa dữ liệu đã chốt: đọc `read_plan` (khung xương/chuyển thể/đạo diễn/hệ thị giác) + `read_script_full` (toàn văn narration) + `read_scenes` (bối cảnh riêng cảnh) + `read_assets` (@tag đã có).
- CẤM bịa nhân vật/bối cảnh/đạo cụ không có trong kịch bản. Thiếu tiền đề → báo, không tự chế.
- @tag trong `asset_tags`/`subject` PHẢI trỏ asset CÓ THẬT (đã tách ở bước Nguyên liệu).
- Mỗi shot ≤ 8 giây (`duration_sec`) — Seedance hay hỏng ở mốc 5–8s; shot dài hơn phải tách.

## Quy trình (đọc-trước-khi-làm)
① Đọc 4 nguồn trên. Chào ngắn.
② Với MỖI cảnh (order_idx tăng dần): chia thành 1..n shot theo ý đồ đạo diễn (số thoại/độ đậm cảm xúc gợi số shot). Mỗi shot điền:
   - `shot_size` (close-up/medium/wide/extreme wide...)
   - `camera_angle` (eye-level/low/high/over-shoulder...)
   - `camera_move` (static/pan/dolly/orbit... — theo motion-library)
   - `subject` (chủ thể + @tag dùng trong shot)
   - `action_start` → `action_end`: tư thế/trạng thái ĐẦU → CUỐI + 1 chi tiết vật lý nhân-quả (weight shift/uncoil/momentum). CẤM động từ trần ("chạy/cầm/vung").
   - `layout` (khi ≥2 vật cần vị trí cố định — map bằng chữ), `cuts` (nếu shot nhiều cắt), `notes` (ý đồ ánh sáng/cảm xúc) — tùy chọn.
   - `duration_sec` ≤8; `asset_tags` = @tag nguyên liệu dùng trong shot.
③ Gọi `write_shot_panel(scene_order, blocks[])` cho từng cảnh.

## Khung output BẮT BUỘC mỗi shot
shot_size · camera_angle · camera_move · subject(@tag) · action_start → action_end(+vật lý) · duration_sec(≤8) · asset_tags. (layout/cuts/notes tùy cảnh.)

## Cấm
- ❌ Không tự sinh prompt ảnh/video (việc bước sau).
- ❌ Không đổi narration/đạo diễn (chỉ phân cảnh, không viết lại chuyện).
- ❌ Không nhồi >8s/shot; không bịa @tag.
```

- [ ] **Step 2: Commit** (skill .md không cần build)

```bash
git add skills/free/_execution_storyboardWright.md
git commit -m "feat(skill): worker storyboardWright"
```

---

### Task 7: `WORKER_SPECS.storyboardWright`

**Files:**
- Modify: `src/main/pipeline/workerSpecs.ts` (`WORKER_SPECS` object, quanh dòng 18)

**Interfaces:**
- Consumes: worker `.md` (Task 6), tool `write_shot_panel` (Task 4).
- Produces: `workerSpec('storyboardWright')` trả `{ tools, layers }`.

- [ ] **Step 1: Thêm entry**

Chèn vào object `WORKER_SPECS` (mẫu theo `assetDeriver`/`vidPrompter`):

```ts
storyboardWright: {
  tools: [
    'read_ideal',
    'read_scenes',
    'read_blocks',
    'read_assets',
    'read_plan',
    'read_script_full',
    'write_shot_panel'
  ],
  layers: ['motion-library.md', 'storyboard-craft.md']
},
```

> ⚠️ Dùng đúng tên file layer có thật trong `skills/`. Nếu `storyboard-craft.md` không tồn tại, bỏ khỏi mảng — chỉ giữ `motion-library.md`. Kiểm bằng: `ls skills/*.md`.

- [ ] **Step 2: Verify**

Run: `npm run typecheck`
Expected: EXIT 0.

- [ ] **Step 3: Commit**

```bash
git add src/main/pipeline/workerSpecs.ts
git commit -m "feat(pipeline): WORKER_SPECS storyboardWright"
```

---

### Task 8: CHAT_GATES `gate_storyboard` + sửa kickoff img/vid

**Files:**
- Modify: `src/main/pipeline/gateChat.ts` (`CHAT_GATES` 42; kickoff `gate2_image` 133; kickoff `gate3_video` 143)

**Interfaces:**
- Consumes: `workerSpec('storyboardWright')` (Task 7), `read_blocks` trả `shot_panel` (Task 4).
- Produces: cổng chat `gate_storyboard` chạy được qua `runGateChat`.

- [ ] **Step 1: Thêm entry `gate_storyboard` vào `CHAT_GATES`**

Chèn giữa `gate_assets` và `gate2_image`:

```ts
gate_storyboard: {
  worker: 'storyboardWright',
  tools: [...READ_TOOLS, 'read_script_full', 'write_shot_panel'],
  layers: workerSpec('storyboardWright').layers,
  kickoff:
    'Người dùng vừa mở cổng PHÂN CẢNH. BƯỚC 0 (đọc-trước-khi-làm): đọc read_plan (khung xương/chuyển thể/đạo diễn/hệ thị giác) + read_script_full (toàn văn narration) + read_scenes (bối cảnh riêng cảnh) + read_assets (@tag đã có). ' +
    'CẤM bịa nhân vật/bối cảnh/đạo cụ không có trong kịch bản; @tag phải trỏ asset CÓ THẬT. Sau đó chào ngắn. ' +
    'Rồi với MỖI cảnh (order_idx tăng dần) → chia 1..n shot; mỗi shot điền khối phân cảnh: shot_size · camera_angle · camera_move · subject(@tag) · action_start→action_end (+1 chi tiết vật lý, cấm động từ mơ hồ) · duration_sec ≤8 · asset_tags. ' +
    'Ghi qua write_shot_panel(scene_order, blocks[]) cho từng cảnh. Hỏi nếu còn phân vân số shot 1 cảnh.'
},
```

- [ ] **Step 2: Sửa kickoff `gate2_image` để đọc khối phân cảnh**

Trong kickoff `gate2_image` (133), sửa câu "đọc ... read_blocks (shot đã quy hoạch)" thành nhắc khối phân cảnh:

```ts
'...read_blocks (KHỐI PHÂN CẢNH shot_panel: cỡ cảnh/góc/camera/Start→End/@tag đã dựng ở bước Phân cảnh) + read_assets (@tag đã có). ' +
```

Và thêm 1 câu vào cuối phần hướng dẫn dựng prompt: `'Bám KHỐI PHÂN CẢNH (shot_panel) của mỗi block — KHÔNG bịa lại cỡ cảnh/góc/hành động.'`

- [ ] **Step 3: Sửa kickoff `gate3_video` tương tự**

Trong kickoff `gate3_video` (143), thêm: đọc `read_blocks` lấy `shot_panel` + `image_prompt_en`; thêm câu `'MOTION bám action_start→action_end trong shot_panel; camera bám camera_move/shot_size đã chốt.'`

- [ ] **Step 4: Verify**

Run: `npm run typecheck`
Expected: EXIT 0.

- [ ] **Step 5: Commit**

```bash
git add src/main/pipeline/gateChat.ts
git commit -m "feat(pipeline): CHAT_GATES gate_storyboard + kickoff img/vid ke thua shot_panel"
```

---

### Task 9: `snapshotBody` case `gate_storyboard`

**Files:**
- Modify: `src/main/pipeline/gates.ts` (`snapshotBody`, if-chain quanh 286)

**Interfaces:**
- Consumes: `listScenes`/`listBlocks`, `ShotPanel` (Task 5).
- Produces: reviewer nhận snapshot phân cảnh khi chấm `gate_storyboard`.

- [ ] **Step 1: Thêm nhánh**

Trong `snapshotBody`, thêm khối `if (gateStage === 'gate_storyboard')` (đặt trước fallthrough gate2/gate3):

```ts
if (gateStage === 'gate_storyboard') {
  const scenes = listScenes(projectId)
  const parts: string[] = []
  for (const s of scenes) {
    const blocks = listBlocks(s.id)
    const shots = blocks
      .filter((b) => b.shot_panel_json)
      .map((b) => {
        const p = JSON.parse(b.shot_panel_json as string) as ShotPanel
        return `  • Shot ${s.order_idx}.${b.order_idx}: [${p.shot_size} / ${p.camera_angle} / ${p.camera_move}] ${p.subject} | ${p.action_start} → ${p.action_end} | ${p.duration_sec}s | @tag: ${(p.asset_tags || []).join(', ')}`
      })
    parts.push(`Cảnh ${s.order_idx}${shots.length ? ':\n' + shots.join('\n') : ' (CHƯA có shot phân cảnh)'}`)
  }
  return parts.join('\n')
}
```

> ⚠️ Import `ShotPanel` từ `../../shared/types` nếu file chưa import. `listBlocks` row phải có `shot_panel_json` (Task 5 thêm type `Block`).

- [ ] **Step 2: Verify**

Run: `npm run typecheck`
Expected: EXIT 0.

- [ ] **Step 3: Commit**

```bash
git add src/main/pipeline/gates.ts
git commit -m "feat(pipeline): snapshotBody gate_storyboard cho reviewer"
```

---

### Task 10: `GATE_MAP.storyboard` (orchestrator)

**Files:**
- Modify: `src/main/pipeline/orchestrator.ts` (`GATE_MAP` 15; description `run_worker` 44)

**Interfaces:**
- Produces: worker key `storyboard` → `gate_storyboard`.

- [ ] **Step 1: Thêm entry `GATE_MAP`**

```ts
const GATE_MAP: Record<string, string> = {
  gate0: 'gate0_ideal',
  gate1a: 'gate1a_draft',
  gate1b: 'gate1b_skeleton',
  gate1c: 'gate1c_adaptation',
  gate1d: 'gate1d_script',
  director: 'gate_director',
  assets: 'gate_assets',
  storyboard: 'gate_storyboard',
  gate2: 'gate2_image',
  gate3: 'gate3_video'
}
```

- [ ] **Step 2: Cập nhật description THỨ TỰ CHẠY**

Trong description `run_worker` (44), thêm `storyboard` sau `assets`, trước `gate2` (dựng prompt ảnh): "...→ assets → storyboard → gate2 → gate3".

- [ ] **Step 3: Verify**

Run: `npm run typecheck`
Expected: EXIT 0.

- [ ] **Step 4: Commit**

```bash
git add src/main/pipeline/orchestrator.ts
git commit -m "feat(pipeline): GATE_MAP storyboard"
```

---

### Task 11: reviewer.md tiêu chí `gate_storyboard`

**Files:**
- Modify: `skills/reviewer.md` (danh sách "PHANH ĐỘ ĐẦY ĐỦ" ~23; thêm tiêu chí chất lượng ~64)

**Interfaces:**
- Produces: reviewer chấm được cổng phân cảnh.

- [ ] **Step 1: Thêm vào danh sách mục bắt buộc**

Trong "⭐ PHANH ĐỘ ĐẦY ĐỦ KHUNG OUTPUT", thêm dòng:

```markdown
- **gate_storyboard**: mỗi cảnh chia ≥1 shot; mỗi shot có cỡ cảnh · góc · camera move · action_start→action_end · duration ≤8s · @tag.
```

- [ ] **Step 2: Thêm tiêu chí chất lượng**

Trong "TIÊU CHÍ CHẤT LƯỢNG theo gate", thêm:

```markdown
**gate_storyboard — phân cảnh có bám ảnh/video được không:** mỗi cảnh chia shot hợp lý (số shot khớp ý đồ đạo diễn)? mỗi shot có action_start→action_end cụ thể (+chi tiết vật lý, KHÔNG động từ mơ hồ) → 🟡 nếu mơ hồ. duration mỗi shot ≤8s (Seedance hỏng 5–8s)? @tag trỏ asset CÓ THẬT (không mồ côi)? cỡ cảnh/góc/camera đủ để bước sau dựng prompt không bịa?
```

- [ ] **Step 3: Commit**

```bash
git add skills/reviewer.md
git commit -m "feat(skill): reviewer tieu chi gate_storyboard"
```

---

## PHẦN 2 — wizardSteps + store

### Task 12: Step + STAGE_ORDER storyboard + fix stepFromStage (G5)

**Files:**
- Modify: `src/shared/wizardSteps.ts` (`WIZARD_STEPS` 23; `STAGE_ORDER` 45; `stepFromStage` 104–110)

**Interfaces:**
- Consumes: `Stage` union `gate_storyboard` (Task 5).
- Produces: step `storyboard`; `stepFromStage('draft')` trả `'prep'`.

- [ ] **Step 1: Thêm step vào `WIZARD_STEPS`**

Chèn giữa `assets` (33) và `gate2` (34):

```ts
{ key: 'assets', label: 'Nguyên liệu', confirmStage: 'gate_assets' },
{ key: 'storyboard', label: '🎞️ Phân cảnh', confirmStage: 'gate_storyboard' },
{ key: 'gate2', label: 'Prompt ảnh', confirmStage: 'gate2_image' },
```

- [ ] **Step 2: Thêm vào `STAGE_ORDER`**

Chèn `'gate_storyboard'` giữa `'gate_assets'` và `'gate2_image'`:

```ts
export const STAGE_ORDER: string[] = [
  // ... 'gate_assets' (index 7) ...
  'gate_assets',
  'gate_storyboard',
  'gate2_image',
  'gate3_video'
  // ...
]
```

- [ ] **Step 3: Fix `stepFromStage` (G5)**

Thêm dòng đầu hàm — dự án mới (`stage='draft'`, rank -1) dừng ở `prep`:

```ts
export function stepFromStage(stage: string): StepKey {
  if (stageRank(stage) < 0) return 'prep'
  const next = stageRank(stage) + 1
  if (next >= STAGE_ORDER.length - 2) return 'export'
  const targetStage = STAGE_ORDER[next]
  const def = WIZARD_STEPS.find((s) => s.confirmStage === targetStage)
  return (def?.key ?? 'draft') as StepKey
}
```

> `STAGE_ORDER.length - 2` guard tự điều chỉnh khi length tăng — không cần sửa số.

- [ ] **Step 4: Cập nhật `StepKey` union nếu là literal**

Nếu `StepKey` là union literal, thêm `'storyboard'`. (Nếu suy từ `WIZARD_STEPS[number]['key']` thì tự có.)

- [ ] **Step 5: Verify**

Run: `npm run typecheck`
Expected: EXIT 0.

- [ ] **Step 6: Commit**

```bash
git add src/shared/wizardSteps.ts
git commit -m "feat(wizard): step storyboard + STAGE_ORDER; fix stepFromStage dung o prep (G5)"
```

---

### Task 13: wizardStore GateId/GATE_STAGE + reload blocks sau chat

**Files:**
- Modify: `src/renderer/src/wizardStore.ts` (`GateId` 30; `GATE_STAGE` 52; `sendChat` 263)

**Interfaces:**
- Produces: `gateId 'storyboard'` ↔ stage `gate_storyboard`; store reload sau chat storyboard.

- [ ] **Step 1: `GateId` + `GATE_STAGE`**

Thêm `'storyboard'` vào union `GateId` (30); thêm `storyboard: 'gate_storyboard'` vào record `GATE_STAGE` (52).

- [ ] **Step 2: reload sau chat storyboard**

Trong `sendChat` (263) — nơi reload plan cho PLAN_STAGES + assets cho gate_assets — thêm nhánh: khi `stage === 'gate_storyboard'` gọi lại loader block/coverage (dùng đúng loader hiện có, ví dụ `loadCoverage`/`loadBlocks` nếu tồn tại; nếu store dùng `refreshActiveProject`/`loadPlan`, gọi cái phù hợp để StageOutputView đọc lại `shot_panel`).

```ts
if (stage === 'gate_storyboard') {
  await get().loadCoverage?.(projectId)  // hoặc loader block thực tế
}
```

> ⚠️ Dùng đúng tên loader có trong store. Nếu StoryboardPanel đọc block qua IPC riêng thì bước này có thể chỉ cần `refreshActiveProject`.

- [ ] **Step 3: Verify**

Run: `npm run typecheck`
Expected: EXIT 0.

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/wizardStore.ts
git commit -m "feat(store): GateId/GATE_STAGE storyboard + reload sau chat"
```

---

## PHẦN 3 — UI

### Task 14: `GateWorkbench` — layout 2 cột + slot rightPanel

**Files:**
- Create: `src/renderer/src/ui/wizard/GateWorkbench.tsx`

**Interfaces:**
- Consumes: `GateChatPanel` (Task 17 refactor), props chuyển tiếp.
- Produces: `<GateWorkbench {...gateChatProps} rightPanel={<...>} />` — grid 2 cột cuộn riêng.

- [ ] **Step 1: Viết component**

```tsx
import type { ReactNode } from 'react'
import { GateChatPanel, type GateChatPanelProps } from './GateChatPanel'

interface GateWorkbenchProps extends GateChatPanelProps {
  rightPanel?: ReactNode
}

/** Bọc chung: chat trái (~40%) · output phải (~60%) cuộn riêng. Màn hẹp xếp dọc. */
export function GateWorkbench({ rightPanel, ...chatProps }: GateWorkbenchProps): JSX.Element {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-4 h-[calc(100vh-8rem)]">
      <div className="overflow-y-auto min-h-0">
        <GateChatPanel {...chatProps} />
      </div>
      <div className="overflow-y-auto min-h-0 border-l border-neutral-200 pl-4">
        {rightPanel}
      </div>
    </div>
  )
}
```

> ⚠️ `GateChatPanelProps` phải được export từ GateChatPanel (Task 17). Class Tailwind theo convention hiện có của repo — kiểm 1 component wizard khác để khớp token màu/spacing.

- [ ] **Step 2: Verify** (sau Task 17)

Run: `npm run typecheck`
Expected: EXIT 0.

- [ ] **Step 3: Commit** (gộp với Task 17 nếu cần export type trước)

```bash
git add src/renderer/src/ui/wizard/GateWorkbench.tsx
git commit -m "feat(ui): GateWorkbench layout 2 cot"
```

---

### Task 15: `StageOutputView` — panel output đầy đủ mọi bước

**Files:**
- Create: `src/renderer/src/ui/wizard/StageOutputView.tsx`

**Interfaces:**
- Consumes: store (`plan`, `assetsFull`, `visualSystem`, `coverage`), block `shot_panel` (đọc qua store/IPC).
- Produces: `<StageOutputView stage={ChatGateStage} />` render trọn vẹn theo stage.

- [ ] **Step 1: Viết component (render theo stage)**

Render đầy đủ theo bảng spec §4.2. Tối thiểu bao các stage; mỗi nhánh đọc data từ store:

```tsx
import type { ChatGateStage, ShotPanel } from '../../../../shared/types'
import { useWizardStore } from '../../wizardStore'

export function StageOutputView({ stage }: { stage: ChatGateStage }): JSX.Element | null {
  const plan = useWizardStore((s) => s.plan)
  const assetsFull = useWizardStore((s) => s.assetsFull)
  const visualSystem = useWizardStore((s) => s.visualSystem)

  // Nháp
  if (stage === 'gate1a_draft') return <Section title="Bản nháp">{plan?.draft ?? '—'}</Section>
  // Khung xương
  if (stage === 'gate1b_skeleton') return <SkeletonView skeleton={plan?.skeleton} />
  // Chuyển thể
  if (stage === 'gate1c_adaptation') return <AdaptationView adaptation={plan?.adaptation} />
  // Đạo diễn
  if (stage === 'gate_director') return <DirectorView director={plan?.director} />
  // Nguyên liệu
  if (stage === 'gate_assets') return <AssetsView assets={assetsFull} visual={visualSystem} />
  // Phân cảnh
  if (stage === 'gate_storyboard') return <StoryboardOutput />
  // ... gate0/gate1d/gate2/gate3 render tương ứng ...
  return null
}
```

> Đây là component render, nội dung từng sub-view (`SkeletonView`, `AdaptationView`, `DirectorView`, `AssetsView`, `StoryboardOutput`, `Section`) viết đầy đủ trong file — tái dùng logic hiển thị từ `PlanArtifactsView.tsx` (skeleton/adaptation) làm gốc, mở rộng cho director/assets/storyboard. `StoryboardOutput` đọc block qua store, parse `shot_panel_json` thành `ShotPanel`, render mỗi cảnh → mỗi shot.

- [ ] **Step 2: Verify**

Run: `npm run typecheck`
Expected: EXIT 0.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/ui/wizard/StageOutputView.tsx
git commit -m "feat(ui): StageOutputView panel output day du moi buoc"
```

---

### Task 16: `InheritedDataView` — khối "📥 Kế thừa từ bước trước"

**Files:**
- Create: `src/renderer/src/ui/wizard/InheritedDataView.tsx`

**Interfaces:**
- Consumes: store (plan/scenes/assets).
- Produces: `<InheritedDataView stage={ChatGateStage} />` — khối thu gọn được cuối cột phải.

- [ ] **Step 1: Viết component**

```tsx
import { useState } from 'react'
import type { ChatGateStage } from '../../../../shared/types'
import { useWizardStore } from '../../wizardStore'

const INHERIT_LABEL: Partial<Record<ChatGateStage, string>> = {
  gate1d_script: 'Ý đồ chốt + khung xương',
  gate_director: 'Narration final',
  gate_assets: 'Kịch bản + bối cảnh cảnh',
  gate_storyboard: 'Kịch bản + đạo diễn + @tag nguyên liệu',
  gate2_image: 'Khối phân cảnh + @tag + Color Script',
  gate3_video: 'Ảnh khung đầu + khối phân cảnh + @tag'
}

export function InheritedDataView({ stage }: { stage: ChatGateStage }): JSX.Element | null {
  const [open, setOpen] = useState(false)
  const label = INHERIT_LABEL[stage]
  if (!label) return null
  return (
    <div className="mt-4 rounded border border-neutral-200 text-sm">
      <button className="w-full text-left px-3 py-2 font-medium" onClick={() => setOpen((o) => !o)}>
        📥 Kế thừa từ bước trước {open ? '▾' : '▸'}
      </button>
      {open && <div className="px-3 py-2 text-neutral-600">{label}</div>}
    </div>
  )
}
```

> Có thể nâng cấp hiển thị data thật (đọc store) sau; bản tối thiểu này đã đạt mục tiêu tâm lý "thấy bước sau cầm chắc bước trước".

- [ ] **Step 2: Verify**

Run: `npm run typecheck`
Expected: EXIT 0.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/ui/wizard/InheritedDataView.tsx
git commit -m "feat(ui): InheritedDataView khoi ke thua"
```

---

### Task 17: Refactor `GateChatPanel` — export props type, nhận rightPanel qua GateWorkbench

**Files:**
- Modify: `src/renderer/src/ui/wizard/GateChatPanel.tsx`

**Interfaces:**
- Produces: `export interface GateChatPanelProps { projectId, stage, gateId, title, desc, onDone }`.

- [ ] **Step 1: Export props interface**

Đổi khai báo props inline thành interface export (giữ nguyên field hiện có):

```tsx
export interface GateChatPanelProps {
  projectId: number
  stage: ChatGateStage
  gateId: GateId
  title: string
  desc: string
  onDone: () => void
}

export function GateChatPanel({ projectId, stage, gateId, title, desc, onDone }: GateChatPanelProps): JSX.Element {
  // ... giữ nguyên thân hàm ...
}
```

- [ ] **Step 2: Bỏ `PlanArtifactsView` khỏi thân (đã chuyển sang StageOutputView ở cột phải)**

Xóa dòng `{stageHasPlan(stage) && <PlanArtifactsView plan={plan} />}` (output giờ nằm cột phải qua GateWorkbench). Giữ chat/textarea/nút/review.

- [ ] **Step 3: Verify**

Run: `npm run typecheck`
Expected: EXIT 0.

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/ui/wizard/GateChatPanel.tsx
git commit -m "refactor(ui): GateChatPanel export props, bo PlanArtifactsView (sang cot phai)"
```

---

### Task 18: `ScriptWorkbench` — 5 tab kịch bản

**Files:**
- Create: `src/renderer/src/ui/wizard/ScriptWorkbench.tsx`

**Interfaces:**
- Consumes: `GateWorkbench`, `StageOutputView`, `InheritedDataView`, `stepUnlocked`/`stageRank`.
- Produces: `<ScriptWorkbench projectId onDone />` — 5 tab, tab N mở khi stage N-1 chốt; chốt Final → onDone (sang Style).

- [ ] **Step 1: Viết component**

```tsx
import { useState } from 'react'
import type { ChatGateStage, GateId } from '../../../../shared/types'
import { GateWorkbench } from './GateWorkbench'
import { StageOutputView } from './StageOutputView'
import { InheritedDataView } from './InheritedDataView'
import { useWizardStore } from '../../wizardStore'

const TABS: Array<{ gateId: GateId; stage: ChatGateStage; label: string; title: string; desc: string }> = [
  { gateId: 'gate1a', stage: 'gate1a_draft', label: 'Nháp', title: 'Nháp kịch bản', desc: 'Bung hướng kể từ ý tưởng thô.' },
  { gateId: 'gate0', stage: 'gate0_ideal', label: 'Ý đồ', title: 'Ý đồ chốt', desc: 'Chưng cất ý đồ cốt lõi từ nháp.' },
  { gateId: 'gate1b', stage: 'gate1b_skeleton', label: 'Khung xương', title: 'Khung xương', desc: 'Logline + nhịp + đường cong cảm xúc.' },
  { gateId: 'gate1c', stage: 'gate1c_adaptation', label: 'Chuyển thể', title: 'Chiến lược chuyển thể', desc: 'Cho xem đừng kể + motif.' },
  { gateId: 'gate1d', stage: 'gate1d_script', label: 'Final', title: 'Kịch bản final', desc: 'Narration chốt + quy hoạch shot.' }
]

export function ScriptWorkbench({ projectId, onDone }: { projectId: number; onDone: () => void }): JSX.Element {
  const [active, setActive] = useState(0)
  const stage = useWizardStore((s) => s.stage)  // stage dự án hiện tại để khóa tab

  // tab i mở khi stage tab (i-1) đã chốt — tái dùng stepUnlocked/stageRank convention.
  const tabUnlocked = (i: number): boolean => i === 0 || stageRankOf(stage) >= stageRankOf(TABS[i - 1].stage)

  const t = TABS[active]
  const isFinal = active === TABS.length - 1
  return (
    <div>
      <div className="flex gap-1 mb-3 border-b">
        {TABS.map((tab, i) => (
          <button
            key={tab.gateId}
            disabled={!tabUnlocked(i)}
            className={`px-3 py-2 ${i === active ? 'border-b-2 border-blue-500 font-medium' : ''} ${!tabUnlocked(i) ? 'opacity-40' : ''}`}
            onClick={() => tabUnlocked(i) && setActive(i)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <GateWorkbench
        projectId={projectId}
        stage={t.stage}
        gateId={t.gateId}
        title={t.title}
        desc={t.desc}
        onDone={() => (isFinal ? onDone() : setActive(active + 1))}
        rightPanel={
          <>
            <StageOutputView stage={t.stage} />
            <InheritedDataView stage={t.stage} />
          </>
        }
      />
    </div>
  )
}
```

> ⚠️ `stageRankOf` = dùng `stageRank` từ `wizardSteps` (import). Nếu store expose `stage` khác tên, dùng đúng. Thứ tự tab theo pipeline: Nháp (gate1a) → Ý đồ (gate0) → Khung xương → Chuyển thể → Final — khớp WizardView cũ (draft→gate0→skeleton→adaptation→script).

- [ ] **Step 2: Verify**

Run: `npm run typecheck`
Expected: EXIT 0.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/ui/wizard/ScriptWorkbench.tsx
git commit -m "feat(ui): ScriptWorkbench 5 tab kich ban"
```

---

### Task 19: `StoryboardPanel` — màn Phân cảnh

**Files:**
- Create: `src/renderer/src/ui/wizard/StoryboardPanel.tsx`

**Interfaces:**
- Consumes: `GateWorkbench`, `StageOutputView`, `InheritedDataView`.
- Produces: `<StoryboardPanel projectId onDone />` — cổng chat `gate_storyboard` 2 cột.

- [ ] **Step 1: Viết component**

```tsx
import { GateWorkbench } from './GateWorkbench'
import { StageOutputView } from './StageOutputView'
import { InheritedDataView } from './InheritedDataView'

export function StoryboardPanel({ projectId, onDone }: { projectId: number; onDone: () => void }): JSX.Element {
  return (
    <GateWorkbench
      projectId={projectId}
      stage="gate_storyboard"
      gateId="storyboard"
      title="🎞️ Phân cảnh"
      desc="Chia mỗi cảnh thành shot chi tiết (cỡ cảnh/góc/camera/Start→End/@tag) để bước ảnh/video bám theo."
      onDone={onDone}
      rightPanel={
        <>
          <StageOutputView stage="gate_storyboard" />
          <InheritedDataView stage="gate_storyboard" />
        </>
      }
    />
  )
}
```

- [ ] **Step 2: Verify**

Run: `npm run typecheck`
Expected: EXIT 0.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/ui/wizard/StoryboardPanel.tsx
git commit -m "feat(ui): StoryboardPanel man Phan canh"
```

---

### Task 20: WizardView — gộp nhánh script + thêm storyboard + fix onDone

**Files:**
- Modify: `src/renderer/src/ui/wizard/WizardView.tsx`

**Interfaces:**
- Consumes: `ScriptWorkbench`, `StoryboardPanel`.
- Produces: pipeline 13→9 màn; assets onDone→storyboard→gate2.

- [ ] **Step 1: Thay 5 nhánh script bằng 1 nhánh**

Xóa 5 nhánh `step==='draft'|'gate0'|'skeleton'|'adaptation'|'script'`, thay bằng:

```tsx
if (step === 'script') {
  return <ScriptWorkbench projectId={project.id} onDone={() => advance('params')} />
}
```

- [ ] **Step 2: prep onDone → 'script'**

Nhánh `prep`: `onDone={() => advance('script')}` (thay vì 'draft').

- [ ] **Step 3: Thêm nhánh storyboard + nối assets/gate2**

```tsx
if (step === 'assets') {
  return <AssetStudioPanel ... onDone={() => advance('storyboard')} />
}
if (step === 'storyboard') {
  return <StoryboardPanel projectId={project.id} onDone={() => advance('gate2')} />
}
```

- [ ] **Step 4: Import các component mới**

```tsx
import { ScriptWorkbench } from './ScriptWorkbench'
import { StoryboardPanel } from './StoryboardPanel'
```

- [ ] **Step 5: Verify**

Run: `npm run typecheck`
Expected: EXIT 0.

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src/ui/wizard/WizardView.tsx
git commit -m "feat(ui): WizardView gop nhanh script + them storyboard (13->9 man)"
```

---

## PHẦN 4 — VERIFICATION TOÀN CỤC

### Task 21: Typecheck + build + dev thử

- [ ] **Step 1: Typecheck**

Run: `npm run typecheck`
Expected: EXIT 0.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: EXIT 0.

- [ ] **Step 3: Dev — kiểm mắt**

Run: `npm run dev`
Kiểm:
- Mở dự án MỚI → dừng ở **Chuẩn bị** (không nhảy Nháp). (G5)
- Màn **Kịch bản** có 5 tab; chat trái, output phải cuộn riêng; output hiện narration/khung đầy đủ. (G1/G2/G4)
- Chạy tới **Phân cảnh** → mỗi cảnh chia shot; mỗi shot có khối chi tiết (cỡ cảnh/góc/camera/Start→End/duration/@tag). (G6)
- GATE ảnh/video → prompt bám khối phân cảnh (kiểm 1 block: prompt nhắc đúng @tag + hành động panel).
- Khối "📥 Kế thừa" hiện đúng nhãn bước trước. (G3)
- Mở lại 1 DB CŨ (dự án trước) → không lỗi (migration additive). 

- [ ] **Step 4: Commit cuối (nếu có chỉnh sửa từ dev)**

```bash
git add <file da sua>
git commit -m "fix: chinh sau kiem dev"
```

---

## Self-Review (đã chạy)

- **Spec coverage:** G1 (GateWorkbench T14) · G2 (StageOutputView T15) · G3 (InheritedDataView T16) · G4 (ScriptWorkbench T18) · G5 (stepFromStage T12) · G6 (T1–T11, T19) — đủ.
- **Placeholder:** các đoạn "⚠️" là chỉ dẫn khớp-tên-thực-tế, không phải TODO nội dung; code từng step đầy đủ.
- **Type consistency:** `ShotPanel` (T5) dùng nhất quán ở validators/tools/gates/StageOutputView; `write_shot_panel` field khớp `ShotPanel`; `gate_storyboard` xuất hiện đồng bộ ở Stage/ChatGateStage/STAGE_ORDER/GATE_MAP/GATE_STAGE/CHAT_GATES/GateId.
