# Output Intent (Ý đồ đầu ra) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm tham số "ý đồ đầu ra" (mô tả tự do do AI suy ở GATE 0) đảo mặc định toàn pipeline từ "để bán hàng" → "kể chuyện, trừ khi ideal nói bán", gỡ giả định CTA cứng khỏi các thợ.

**Architecture:** Bắt chước cơ chế `{{STYLE_ANCHOR}}`/`injectStyleAnchor()` đã kiểm chứng: thêm 1 field mềm `output_intent` vào `IdealBrief` (lưu JSON, không migration), 1 file nền `output-intent.md` chứa luật đảo mặc định, 1 hàm `injectOutputIntent()` thay chuỗi `{{OUTPUT_INTENT}}` trong prompt thợ, gọi cạnh mỗi `injectStyleAnchor()` đã có. Vá các điểm rò CTA trong 6 file .md skill.

**Tech Stack:** Electron + TypeScript + electron-vite. Không có test framework → cổng kiểm mỗi task = `npm run typecheck` (code) + grep xác minh (.md). E2E do người dùng chạy trong app.

## Global Constraints

- Mọi output/comment/nội dung .md bằng **tiếng Việt** (app phục vụ người Việt).
- App **DỪNG Ở PROMPT** — không thêm bất kỳ lời gọi sinh ảnh/video nào.
- **KHÔNG enum cứng** cho ý đồ — `output_intent` luôn là mô tả tự do (string).
- **Đảo mặc định:** mặc định KHÔNG CTA/chữ bán hàng; CHỈ có CTA khi ý đồ nêu rõ thương mại.
- **KHÔNG migration DB** — brief lưu trong `ideal_json` (JSON), `mergeIdealBrief` merge động theo key.
- **KHÔNG thêm UI widget** — AI suy ở GATE 0, người dùng sửa qua chat GATE 0.
- **KHÔNG đụng** hệ genre à-la-carte.
- Không có key/token rò ra log ngoài; không commit trừ khi người dùng yêu cầu.

---

### Task 1: Thêm field `output_intent` vào type + tool ghi

**Files:**
- Modify: `src/shared/types.ts` (interface `IdealBrief`, ~dòng 61-72)
- Modify: `src/main/tools/index.ts` (tool `write_ideal_brief`, schema ~dòng 178-190 + handler ~dòng 193-204)

**Interfaces:**
- Produces: `IdealBrief.output_intent?: string` — mọi task sau đọc field này.
- Produces: tool `write_ideal_brief` nhận thêm property `output_intent`.

- [ ] **Step 1: Thêm field vào `IdealBrief`**

Trong `src/shared/types.ts`, trong interface `IdealBrief`, ngay sau dòng `duration_hint?: string`, thêm:

```ts
  // ⭐ Ý ĐỒ ĐẦU RA — mô tả TỰ DO (KHÔNG enum): video này để kể chuyện thuần,
  // để bán/chuyển đổi, hay lai. Dẫn tông toàn pipeline + quyết định có/không CTA.
  // Mặc định nghiêng kể chuyện; chỉ ghi mục tiêu thương mại khi ideal nêu rõ.
  output_intent?: string
```

- [ ] **Step 2: Thêm property vào schema tool `write_ideal_brief`**

Trong `src/main/tools/index.ts`, trong `input_schema.properties` của `writeIdealBrief`, ngay sau khối `duration_hint: {...}`, thêm:

```ts
        output_intent: {
          type: 'string',
          description:
            'Ý đồ đầu ra — mô tả TỰ DO: kể chuyện thuần / có bán-chuyển đổi / lai. Mặc định nghiêng kể chuyện (không CTA); chỉ nêu mục tiêu thương mại + mức CTA khi ideal nói rõ bán hàng.'
        }
```

- [ ] **Step 3: Thêm vào handler**

Trong cùng file, trong `handler` của `writeIdealBrief`, trong object truyền vào `db.mergeIdealBrief(...)`, ngay sau dòng `duration_hint: input.duration_hint as string | undefined`, thêm dấu phẩy vào dòng đó và thêm:

```ts
      output_intent: input.output_intent as string | undefined
```

- [ ] **Step 4: Typecheck**

Run: `cd /e/danh-script && npm run typecheck`
Expected: EXIT 0, không lỗi type mới.

- [ ] **Step 5: Xác minh field đã có mặt cả 3 nơi**

Run: `cd /e/danh-script && grep -rn "output_intent" src/`
Expected: thấy `output_intent` ở `types.ts` (1), `tools/index.ts` (2: schema + handler). Tổng ≥3 dòng.

---

### Task 2: File nền luật đảo mặc định `skills/output-intent.md`

**Files:**
- Create: `skills/output-intent.md`

**Interfaces:**
- Produces: file nền cố định, nội dung được `injectOutputIntent()` (Task 3) chèn vào `{{OUTPUT_INTENT}}`.

- [ ] **Step 1: Tạo file nền**

Tạo `skills/output-intent.md` với nội dung:

```markdown
# LỚP NỀN · Ý đồ đầu ra (đảo mặc định CTA) ⭐

> Luật này áp cho MỌI thợ khi prompt có chèn `{{OUTPUT_INTENT}}`. Đây là "công tắc gốc" quyết định video có mang chất bán hàng hay không — đọc kỹ trước khi dựng nhịp kết / chữ overlay / điểm chạm sản phẩm.

## Luật gốc — MẶC ĐỊNH KHÔNG BÁN HÀNG

- **Mặc định: KHÔNG CTA, KHÔNG chữ chào hàng, KHÔNG "điểm chạm sản phẩm" ép buộc.** Nhịp kết = **payoff cảm xúc** (trả đúng cái hook mở ra), không phải lời kêu gọi mua/đăng ký/để lại thông tin.
- Danh Script phục vụ ĐA THỂ LOẠI: phim ngắn, cinematic, anime, hoạt hình, MV, TVC, quảng cáo, affiliate... Phần lớn KHÔNG để bán. Vì vậy giả định gốc là **kể chuyện**, không phải bán hàng.
- **CHỈ đưa CTA / giá / link / lời chào hàng / điểm khoe sản phẩm KHI** ý đồ đầu ra của dự án (bên dưới) **nêu rõ mục tiêu thương mại** (bán, chuyển đổi, kéo về sản phẩm/dịch vụ).

## Đọc theo lời, không theo nhãn

Ý đồ đầu ra là **mô tả tự do**, không phải nhãn cứng. Đọc lời mô tả để quyết mức độ:
- Không nhắc bán / mục tiêu cảm xúc thuần → **0 CTA**. Kết bằng cảm xúc.
- "Gài thương hiệu nhẹ", "branded", "lai" → **CTA gài mềm**: sản phẩm/thông điệp xuất hiện có lý do trong mạch, không hô khẩu hiệu.
- "Bán", "chuyển đổi", "review affiliate", "chốt đơn", "để lại SĐT" → **CTA chốt rõ**: có điểm chạm sản phẩm + lời kêu gọi cuối.

## Tự kiểm

- Nếu ý đồ KHÔNG nói thương mại mà bạn đang định chèn CTA/giá/chào hàng → **DỪNG, bỏ đi**. Đó là thói quen cũ sai, không phải yêu cầu của dự án này.
- Nếu ý đồ NÓI thương mại mà bạn quên điểm chạm sản phẩm → thiếu, bổ sung.

---

**Ý ĐỒ ĐẦU RA CỦA DỰ ÁN NÀY:**
```

Lưu ý: file kết thúc bằng dòng nhãn "Ý ĐỒ ĐẦU RA CỦA DỰ ÁN NÀY:" — `injectOutputIntent()` (Task 3) sẽ nối đoạn mô tả tự do của dự án ngay sau nhãn này (hoặc "(chưa xác định — dùng mặc định kể chuyện, không CTA)" nếu trống).

- [ ] **Step 2: Xác minh file tạo đúng**

Run: `cd /e/danh-script && grep -c "MẶC ĐỊNH KHÔNG BÁN HÀNG" skills/output-intent.md`
Expected: `1`

---

### Task 3: Hàm `injectOutputIntent()` trong skillLoader

**Files:**
- Modify: `src/main/core/skillLoader.ts` (thêm hàm mới cuối vùng inject, sau `injectStyleAnchor` ~dòng 142)

**Interfaces:**
- Consumes: `readSkillOptional('output-intent.md')`, `IdealBrief.output_intent` (Task 1), `getProject` từ db.
- Produces: `injectOutputIntent(system: string, projectId: number): string` — Task 4/5/6 gọi.

- [ ] **Step 1: Thêm import getProject nếu chưa có**

Trong `src/main/core/skillLoader.ts`, kiểm tra đầu file. Nếu chưa import `getProject`, thêm:

```ts
import { getProject } from '../db'
```

(Kiểm bằng grep ở Step 4; nếu đã có import từ `../db` thì gộp vào dòng import đó thay vì thêm dòng mới.)

- [ ] **Step 2: Thêm hàm `injectOutputIntent`**

Ngay sau hàm `injectStyleAnchor` (~dòng 142), thêm:

```ts
/**
 * Thay {{OUTPUT_INTENT}} trong system prompt bằng: [luật nền output-intent.md]
 * + [đoạn mô tả ý đồ đầu ra của dự án]. Không có placeholder → trả nguyên.
 * Không có output_intent → chỉ luật nền (mặc định kể chuyện, không CTA) → an toàn.
 * Bắt chước injectStyleAnchor: gọi sau composeSystem, cạnh injectStyleAnchor.
 */
export function injectOutputIntent(system: string, projectId: number): string {
  if (!system.includes('{{OUTPUT_INTENT}}')) return system
  const base = readSkillOptional('output-intent.md').trim()
  let intent = '(chưa xác định — dùng mặc định kể chuyện, không CTA)'
  try {
    const project = getProject(projectId)
    if (project?.ideal_json) {
      const ideal = JSON.parse(project.ideal_json) as {
        brief?: { output_intent?: string }
      }
      const v = ideal.brief?.output_intent?.trim()
      if (v) intent = v
    }
  } catch {
    /* ideal_json hỏng → giữ mặc định, không chặn */
  }
  const block = base ? `${base}\n${intent}` : intent
  return system.replaceAll('{{OUTPUT_INTENT}}', block)
}
```

- [ ] **Step 3: Typecheck**

Run: `cd /e/danh-script && npm run typecheck`
Expected: EXIT 0.

- [ ] **Step 4: Xác minh export + không import trùng**

Run: `cd /e/danh-script && grep -n "injectOutputIntent\|import.*getProject" src/main/core/skillLoader.ts`
Expected: thấy 1 dòng `export function injectOutputIntent`, và `getProject` được import đúng 1 lần (không lặp).

---

### Task 4: Gọi `injectOutputIntent` ở 3 gate

**Files:**
- Modify: `src/main/pipeline/gates.ts` (`runGate`, ~dòng 189-192)
- Modify: `src/main/pipeline/gateChat.ts` (`runGateChat`, ~dòng 208-215)
- Modify: `src/main/pipeline/gate0.ts` (`runGate0`, ~dòng 31)

**Interfaces:**
- Consumes: `injectOutputIntent` (Task 3).

- [ ] **Step 1: gates.ts — bọc injectOutputIntent quanh injectStyleAnchor**

Trong `src/main/pipeline/gates.ts`, tại `runGate`, tìm khối:

```ts
  const system = injectStyleAnchor(
    composeSystem(loadExecutionSkill(project.pipeline, spec.worker), ...layerParts),
    project.style_id
  )
```

Thay bằng (thêm import `injectOutputIntent` ở đầu file cùng dòng import `injectStyleAnchor`):

```ts
  const system = injectOutputIntent(
    injectStyleAnchor(
      composeSystem(loadExecutionSkill(project.pipeline, spec.worker), ...layerParts),
      project.style_id
    ),
    projectId
  )
```

- [ ] **Step 2: gateChat.ts — tương tự**

Trong `src/main/pipeline/gateChat.ts`, tại `runGateChat`, tìm:

```ts
  const system = injectStyleAnchor(
    composeSystem(
      loadExecutionSkill(project.pipeline, spec.worker),
      ...layerParts,
      chatProtocol
    ),
    project.style_id
  )
```

Thay bằng:

```ts
  const system = injectOutputIntent(
    injectStyleAnchor(
      composeSystem(
        loadExecutionSkill(project.pipeline, spec.worker),
        ...layerParts,
        chatProtocol
      ),
      project.style_id
    ),
    projectId
  )
```

- [ ] **Step 3: gate0.ts — tương tự**

Trong `src/main/pipeline/gate0.ts`, tại `runGate0`, tìm:

```ts
  const system = composeSystem(loadExecutionSkill(project.pipeline, 'ideaAnalyst'))
```

Thay bằng:

```ts
  const system = injectOutputIntent(
    composeSystem(loadExecutionSkill(project.pipeline, 'ideaAnalyst')),
    projectId
  )
```

- [ ] **Step 4: Sửa import ở cả 3 file**

Ở mỗi file (`gates.ts`, `gateChat.ts`, `gate0.ts`), thêm `injectOutputIntent` vào dòng import từ `../core/skillLoader`. Ví dụ gate0.ts:

```ts
import { loadExecutionSkill, readSkill, composeSystem, injectOutputIntent } from '../core/skillLoader'
```

(gates.ts và gateChat.ts đã import `injectStyleAnchor` từ đó — thêm `injectOutputIntent` vào cùng danh sách.)

- [ ] **Step 5: Typecheck**

Run: `cd /e/danh-script && npm run typecheck`
Expected: EXIT 0.

- [ ] **Step 6: Xác minh cả 3 gate đã gọi**

Run: `cd /e/danh-script && grep -rn "injectOutputIntent" src/main/pipeline/`
Expected: thấy ở gates.ts, gateChat.ts, gate0.ts — mỗi file ≥1 lần gọi (chưa kể import).

---

### Task 5: ideaAnalyst suy ý đồ đầu ra + snapshot hiển thị

**Files:**
- Modify: `skills/free/_execution_ideaAnalyst.md`
- Modify: `src/main/pipeline/gates.ts` (`snapshotForGate`, ~dòng 283)

**Interfaces:**
- Consumes: field `output_intent` (Task 1).

- [ ] **Step 1: Thêm skill "suy ý đồ đầu ra" vào ideaAnalyst**

Trong `skills/free/_execution_ideaAnalyst.md`, trong mục "## Skills (vốn nghề)", sau mục "**8. Xử ideal khó**", thêm:

```markdown
**9. ⭐ Suy Ý ĐỒ ĐẦU RA (quyết định có/không CTA).** Đọc ideal, tự viết **1 đoạn mô tả tự do** cho `output_intent`: video này để **kể chuyện thuần** (phim ngắn, cinematic, MV — không bán gì), **thương mại** (TVC/affiliate/review — có bán, có chuyển đổi), hay **lai** (branded film — kể là chính, gài thương hiệu nhẹ). **MẶC ĐỊNH nghiêng kể chuyện** — chỉ ghi mục tiêu thương mại/CTA khi ideal NÊU RÕ bán/chuyển đổi/khoe sản phẩm. Đừng nhét ý bán hàng vào ideal chỉ kể chuyện. Mô tả đúng cỡ đa dạng của ideal, KHÔNG ép vào 3 nhãn — 3 cái trên chỉ là mốc tham chiếu.
```

- [ ] **Step 2: Thêm trục vào khung output ideaAnalyst**

Trong cùng file, trong khối "## Khung output bắt buộc", sau dòng `**Thể loại gợi ý:** <nhịp kể gợi ý>`, thêm:

```markdown
**Ý đồ đầu ra:** <mô tả tự do — kể chuyện thuần / thương mại / lai; có hay không CTA, mức độ nào>
```

- [ ] **Step 3: Cập nhật quy trình + tự kiểm ideaAnalyst**

Trong cùng file, tại "## Quy trình" bước 4, đổi dòng liệt kê trường ghi để bao gồm output_intent. Tìm:

```markdown
4. **Ghi** qua `write_ideal_brief` (điền càng nhiều trường càng tốt: core_message, target, angle, mood, genre, duration_hint, triggers).
```

Thay bằng:

```markdown
4. **Ghi** qua `write_ideal_brief` (điền càng nhiều trường càng tốt: core_message, target, angle, mood, genre, duration_hint, triggers, **output_intent**).
```

Và trong "## Lưu ý & Tự kiểm", sau dòng `- [ ] 6 trục có trục nào để trống...`, thêm:

```markdown
- [ ] Đã suy `output_intent` chưa? Mặc định kể chuyện — có lỡ nhét ý bán hàng vào ideal chỉ kể chuyện không?
```

- [ ] **Step 4: Thêm dòng hiển thị trong snapshotForGate**

Trong `src/main/pipeline/gates.ts`, trong `snapshotForGate`, khối `gate0_ideal`, sau dòng:

```ts
    if (b.genre) lines.push(`Thể loại: ${b.genre}`)
```

thêm:

```ts
    if (b.output_intent) lines.push(`Ý đồ đầu ra: ${b.output_intent}`)
```

- [ ] **Step 5: Typecheck**

Run: `cd /e/danh-script && npm run typecheck`
Expected: EXIT 0.

- [ ] **Step 6: Xác minh**

Run: `cd /e/danh-script && grep -n "output_intent\|Ý đồ đầu ra" skills/free/_execution_ideaAnalyst.md src/main/pipeline/gates.ts`
Expected: ideaAnalyst.md có ≥3 chỗ (skill 9 + khung output + tự kiểm); gates.ts có 1 dòng push.

---

### Task 6: Vá điểm rò CTA trong scriptDraft + skeletonWright

**Files:**
- Modify: `skills/free/_execution_scriptDraft.md`
- Modify: `skills/free/_execution_skeletonWright.md`

**Interfaces:**
- Consumes: `{{OUTPUT_INTENT}}` (Task 3 thay nội dung).

- [ ] **Step 1: scriptDraft — chèn placeholder gần đầu**

Trong `skills/free/_execution_scriptDraft.md`, ngay sau dòng blockquote nguyên lý (dòng 5, bắt đầu "> Nguyên lý:"), thêm dòng trống rồi:

```markdown
{{OUTPUT_INTENT}}
```

- [ ] **Step 2: scriptDraft — điều kiện hóa dòng 24**

Tìm (trong Quy trình bước 2):

```markdown
2. **Chọn 1 mạch kể** (đừng đưa 3 phương án lửng): mở ở đâu (hook) → đẩy qua đâu → chốt ở đâu (payoff/CTA). Bám **đường cong cảm xúc** đã chốt.
```

Thay `payoff/CTA` bằng `payoff (CTA CHỈ khi ý đồ đầu ra là thương mại)`:

```markdown
2. **Chọn 1 mạch kể** (đừng đưa 3 phương án lửng): mở ở đâu (hook) → đẩy qua đâu → chốt ở đâu (payoff — CTA CHỈ khi ý đồ đầu ra là thương mại). Bám **đường cong cảm xúc** đã chốt.
```

- [ ] **Step 3: scriptDraft — điều kiện hóa mục Skills #5**

Tìm:

```markdown
**5. Pipeline bán hàng (nếu ideal hướng affiliate/TVC/fashion).** Chỉ rõ đâu là **hook** (cảnh đầu chặn lướt) và đâu là **CTA / điểm chạm sản phẩm** (cảnh cuối) — nhưng chỉ ở mức Ý, đừng viết lời chào hàng. Sản phẩm xuất hiện có lý do trong mạch, không "dán" vào cuối.
```

Thay bằng:

```markdown
**5. Điểm chạm sản phẩm — CHỈ KHI Ý ĐỒ ĐẦU RA LÀ THƯƠNG MẠI.** Đọc `{{OUTPUT_INTENT}}` ở đầu: nếu là **kể chuyện thuần → BỎ HẲN mục này**, kết bằng payoff cảm xúc, KHÔNG có CTA/điểm chạm sản phẩm. Nếu **thương mại/lai** → chỉ rõ **hook** (cảnh đầu chặn lướt) và **CTA / điểm chạm sản phẩm** (cảnh cuối) ở mức Ý, đừng viết lời chào hàng; sản phẩm xuất hiện có lý do trong mạch, không "dán" vào cuối.
```

- [ ] **Step 4: scriptDraft — điều kiện hóa template (dòng 86, 88)**

Trong khối "## Khung output bắt buộc", tìm:

```markdown
N. <Chốt — payoff / CTA / điểm chạm sản phẩm>

**Điểm chạm sản phẩm (nếu bán hàng):** <sản phẩm xuất hiện ở nhịp nào, có lý do gì>
```

Thay bằng:

```markdown
N. <Chốt — payoff cảm xúc; CTA/điểm chạm sản phẩm CHỈ nếu ý đồ đầu ra là thương mại>

**Điểm chạm sản phẩm (CHỈ nếu ý đồ đầu ra thương mại, không thì BỎ dòng này):** <sản phẩm xuất hiện ở nhịp nào, có lý do gì>
```

- [ ] **Step 5: skeletonWright — chèn placeholder gần đầu**

Trong `skills/free/_execution_skeletonWright.md`, sau dòng blockquote nguyên lý (dòng 6, "> Nguyên lý gốc..."), thêm dòng trống rồi:

```markdown
{{OUTPUT_INTENT}}
```

- [ ] **Step 6: skeletonWright — điều kiện hóa beat role (dòng 48)**

Tìm:

```markdown
**3. Thiết kế NHỊP (beats) trên đường cong cảm xúc.** Mỗi beat có: `order` · `role` (vai trò nhịp: hook / thiết lập / đẩy / cao trào / giải quyết / CTA) · `summary` (nội dung gọn) · `scene_hint` (rơi vào cảnh nào). Quy tắc:
```

Thay bằng:

```markdown
**3. Thiết kế NHỊP (beats) trên đường cong cảm xúc.** Mỗi beat có: `order` · `role` (vai trò nhịp: hook / thiết lập / đẩy / cao trào / giải quyết; thêm **CTA CHỈ khi ý đồ đầu ra là thương mại**) · `summary` (nội dung gọn) · `scene_hint` (rơi vào cảnh nào). Quy tắc:
```

- [ ] **Step 7: skeletonWright — điều kiện hóa template (dòng 98)**

Tìm dòng bảng:

```markdown
| N | payoff/CTA | <…> | Cảnh N |
```

Thay bằng:

```markdown
| N | payoff (CTA nếu thương mại) | <…> | Cảnh N |
```

- [ ] **Step 8: Xác minh cả 2 file**

Run: `cd /e/danh-script && grep -n "{{OUTPUT_INTENT}}\|CHỈ khi ý đồ\|CHỈ nếu ý đồ\|nếu thương mại" skills/free/_execution_scriptDraft.md skills/free/_execution_skeletonWright.md`
Expected: scriptDraft có placeholder + ≥3 chỗ điều kiện; skeletonWright có placeholder + ≥2 chỗ điều kiện.

- [ ] **Step 9: Xác minh KHÔNG còn CTA vô điều kiện**

Run: `cd /e/danh-script && grep -n "payoff/CTA\|payoff / CTA" skills/free/_execution_scriptDraft.md skills/free/_execution_skeletonWright.md`
Expected: KHÔNG còn match nào (đã điều kiện hóa hết).

---

### Task 7: Vá vidPrompter + _decision + reviewer

**Files:**
- Modify: `skills/free/_execution_vidPrompter.md`
- Modify: `skills/free/_decision.md`
- Modify: `skills/reviewer.md`

**Interfaces:**
- Consumes: `{{OUTPUT_INTENT}}` (Task 3), field `output_intent`.

- [ ] **Step 1: vidPrompter — chèn placeholder gần đầu**

Trong `skills/free/_execution_vidPrompter.md`, sau dòng blockquote nguyên lý TỐI CAO (dòng 6, "> Nguyên tắc TỐI CAO"), thêm dòng trống rồi:

```markdown
{{OUTPUT_INTENT}}
```

- [ ] **Step 2: vidPrompter — điều kiện hóa trường text_overlay**

Trong bảng 7 trường (mục Skills #1), tìm dòng:

```markdown
| **text_overlay** | chữ CTA/giá tiếng Việt CHÍNH XÁC (nếu cần) | Mặc định trống → dán ở CapCut. Baked-in chữ ngắn → byteplus-spec 11b. |
```

Thay bằng:

```markdown
| **text_overlay** | Mặc định TRỐNG. Chữ CTA/giá/link CHỈ khi ý đồ đầu ra thương mại | Kể chuyện thuần → để TRỐNG (không CTA). Thương mại → chữ VN chính xác, dán ở CapCut. Baked-in chữ ngắn → byteplus-spec 11b. |
```

- [ ] **Step 3: _decision — điều kiện hóa sơ đồ GATE 3 (dòng 36)**

Trong `skills/free/_decision.md`, tìm trong sơ đồ:

```
GATE 3   vidPrompter    → prompt VIDEO mỗi block: STYLE/SCENE/MOTION/AUDIO/CONSTRAINTS + chữ CTA (target BytePlus)
```

Thay bằng:

```
GATE 3   vidPrompter    → prompt VIDEO mỗi block: STYLE/SCENE/MOTION/AUDIO/CONSTRAINTS + chữ CTA (CHỈ nếu ý đồ đầu ra thương mại) (target BytePlus)
```

- [ ] **Step 4: reviewer — thêm luật phạt 2 chiều**

Trong `skills/reviewer.md`, tìm dòng ~26 (có "(điểm chạm SP nếu bán hàng)"). Đọc nguyên văn dòng đó trước khi sửa, rồi ngay sau mục/dòng đó thêm 1 gạch đầu dòng luật mới:

```markdown
- ⭐ **Ý đồ đầu ra (CTA đúng chỗ):** đọc `output_intent` của dự án. Nếu ý đồ là **kể chuyện thuần** mà thợ CHÈN CTA/chào hàng/điểm chạm sản phẩm → **HẠ HẠNG** (sai bản chất). Nếu ý đồ là **thương mại** mà thợ QUÊN điểm chạm sản phẩm/CTA → cũng trừ điểm. Phạt cả 2 chiều.
```

(Nếu dòng 26 hiện tại đã đủ ý một chiều, chỉ cần thêm dòng phạt chiều ngược lại — không xóa dòng cũ.)

- [ ] **Step 5: Xác minh 3 file**

Run: `cd /e/danh-script && grep -n "{{OUTPUT_INTENT}}\|CHỈ khi ý đồ\|CHỈ nếu ý đồ\|Ý đồ đầu ra\|output_intent" skills/free/_execution_vidPrompter.md skills/free/_decision.md skills/reviewer.md`
Expected: vidPrompter có placeholder + text_overlay điều kiện; _decision có "CHỈ nếu ý đồ đầu ra thương mại"; reviewer có luật phạt 2 chiều.

---

### Task 8: Kiểm tổng thể + build

**Files:** (không sửa, chỉ kiểm)

- [ ] **Step 1: Typecheck toàn bộ**

Run: `cd /e/danh-script && npm run typecheck`
Expected: EXIT 0.

- [ ] **Step 2: Build toàn bộ**

Run: `cd /e/danh-script && npm run build`
Expected: EXIT 0, ra bundle main/preload/renderer.

- [ ] **Step 3: Quét không còn CTA vô điều kiện trong skills thợ**

Run: `cd /e/danh-script && grep -rn "CTA" skills/free/*.md skills/reviewer.md | grep -iv "nếu\|CHỈ\|thương mại\|output_intent"`
Expected: KHÔNG còn dòng CTA nào thiếu điều kiện (mọi CTA đều kèm "nếu/CHỈ/thương mại"). Nếu còn → điều kiện hóa nốt.

- [ ] **Step 4: Xác minh placeholder có mặt ở đúng các thợ**

Run: `cd /e/danh-script && grep -rln "{{OUTPUT_INTENT}}" skills/`
Expected: scriptDraft, skeletonWright, vidPrompter (≥3 file). File nền output-intent.md KHÔNG chứa placeholder (nó LÀ nội dung thay vào).

- [ ] **Step 5: Báo cáo người dùng**

Tóm tắt: đã đảo mặc định (kể chuyện, không CTA trừ khi ideal nói bán); liệt kê file đã sửa; nhắc **cần E2E trong app**: tạo 1 dự án phim ngắn không bán → kiểm GATE 0 suy output_intent nghiêng kể chuyện + prompt không CTA; tạo 1 dự án affiliate → CTA quay lại. Nhắc typecheck/build chỉ chứng minh engine chạy, KHÔNG chứng minh chất lượng output — phải chạy app mới biết.

---

## Ghi chú thực thi

- **KHÔNG commit** trừ khi người dùng yêu cầu (repo có thể chưa init git ở E:\danh-script — kiểm trước bằng `git status`; nếu không phải git repo thì bỏ mọi bước commit).
- Thứ tự task quan trọng: Task 1→3 (nền code) phải xong trước Task 4 (gọi hàm), Task 3 phải xong trước khi placeholder trong .md có tác dụng. Task 6,7 (.md) độc lập nhau, làm sau Task 3.
- Mỗi lần sửa .md xong nên đọc lại đoạn sửa để chắc không lệch định dạng bảng Markdown.
