# Thiết kế: Tham số "Ý đồ đầu ra" (output_intent)

> Ngày: 2026-07-23 · Dự án: Danh Script · Trạng thái: chờ duyệt spec

## 1. Bối cảnh & Vấn đề

Danh Script sinh prompt tiền kỳ cho **nhiều thể loại**: phim ngắn, cinematic, anime, hoạt hình, TVC, quảng cáo, affiliate... Nhưng toàn bộ chuỗi thợ (worker) đang **mặc định giả định "để bán hàng"**: nhịp kết luôn có CTA, có "điểm chạm sản phẩm", chữ overlay gợi CTA. Với một phim ngắn cảm xúc hay MV, giả định này **sai bản chất** — kết phim không phải để bán.

Vấn đề nằm ở **lớp .md skill** (không phải lớp code — code đã trung tính, tôn trọng bottom-up). Các điểm rò CTA đã xác minh:

| File | Dòng | Rò rỉ |
|---|---|---|
| `skills/free/_execution_scriptDraft.md` | 24, 51, 86, 88 | "payoff/CTA", "Pipeline bán hàng", "điểm chạm sản phẩm" như mặc định |
| `skills/free/_execution_skeletonWright.md` | 48, 98 | beat role liệt kê "CTA" như chuẩn; template "N \| payoff/CTA" |
| `skills/free/_decision.md` | 36 | sơ đồ GATE 3 "+ chữ CTA" |
| `skills/reviewer.md` | 26 | có "(điểm chạm SP nếu bán hàng)" — đã điều kiện nhưng chưa phạt chiều ngược |
| `skills/free/_execution_vidPrompter.md` | trường text_overlay | mặc định gợi CTA |

## 2. Nguyên tắc thiết kế (quan trọng)

- **KHÔNG fix cứng.** Không phân loại ideal vào enum `story/commercial/hybrid` — đó chỉ là một kiểu ép khuôn mới. Ideal quá đa dạng.
- **Mô tả tự do.** `output_intent` là một đoạn văn tiếng Việt do AI suy, mô tả đúng cỡ đa dạng của ideal.
- **Đảo mặc định.** Giả định gốc lật từ "mọi thứ để bán" → "mọi thứ là kể chuyện, TRỪ KHI ideal nói bán". Một luật duy nhất, viết một lần ở lớp nền.
- **Đúng pattern có sẵn.** Bắt chước `{{STYLE_ANCHOR}}` / `injectStyleAnchor()` — cơ chế đã kiểm chứng trong app.
- **Engine đụng tối thiểu.** 1 field JSON (không migration DB) + 1 hàm inject + 1 file nền. Không thêm UI mới.

## 3. Thiết kế chi tiết

### 3.1. Dữ liệu

Thêm 1 field mềm vào `IdealBrief` (`src/shared/types.ts`, cạnh `mood`/`genre`/`duration_hint`):

```ts
// Ý đồ đầu ra — mô tả TỰ DO (không enum): video này để kể chuyện thuần,
// để bán/chuyển đổi, hay lai. Dẫn tông toàn pipeline + quyết định có/không CTA.
output_intent?: string
```

Brief lưu trong `ideal_json` (JSON) → **không bảng mới, không migration**. `mergeIdealBrief` đã merge động theo key nên tự nhận field mới, không phải sửa.

### 3.2. GATE 0 — AI suy + bạn sửa qua chat

GATE 0 vốn là **chat gate** (người dùng nhắn chỉnh được) → phần "cho sửa" KHÔNG cần widget UI mới.

**Sửa `skills/free/_execution_ideaAnalyst.md`:**
- Thêm 1 mục Skills: "Suy ý đồ đầu ra" — hướng dẫn thợ đọc ideal, tự viết đoạn mô tả tự do (mặc định nghiêng kể chuyện; chỉ ghi mục tiêu thương mại/CTA khi ideal nêu rõ bán/chuyển đổi).
- Thêm 1 trục trong "Khung output bắt buộc": `**Ý đồ đầu ra:** <mô tả tự do — kể chuyện thuần / có bán / lai, có/không CTA>`.
- Ghi qua `write_ideal_brief`.

**Sửa tool `write_ideal_brief` (`src/main/tools/index.ts`):**
- Thêm property `output_intent` (string) vào `input_schema`.
- Thêm `output_intent: input.output_intent as string | undefined` vào handler `mergeIdealBrief(...)`.

**Sửa `snapshotForGate` (`src/main/pipeline/gates.ts` ~dòng 283):** thêm dòng hiển thị `Ý đồ đầu ra` cho reviewer thấy.

Người dùng sửa: nhắn thẳng trong chat GATE 0 (VD "đổi thành kể chuyện thuần, bỏ CTA") → ideaAnalyst gọi lại `write_ideal_brief` ghi đè `output_intent`.

### 3.3. Cơ chế tiêm — bắt chước `{{STYLE_ANCHOR}}`

**File nền cố định mới `skills/output-intent.md`** — luật đảo mặc định (đọc-only, áp mọi dự án):

> Nội dung lõi: "Mặc định KHÔNG có CTA / chữ bán hàng / điểm chạm sản phẩm ép buộc. Nhịp kết = payoff cảm xúc. CHỈ đưa CTA/giá/link/điểm chạm sản phẩm khi Ý ĐỒ ĐẦU RA của dự án nêu rõ mục tiêu thương mại. Mức độ CTA (không / gài nhẹ / chốt rõ) đọc theo lời mô tả ý đồ, không theo nhãn cứng."

**Hàm mới `injectOutputIntent(system, projectId)` (`src/main/core/skillLoader.ts`):**
- Nếu system không chứa `{{OUTPUT_INTENT}}` → trả nguyên (giống `injectStyleAnchor`).
- Ngược lại thay `{{OUTPUT_INTENT}}` bằng: `[nội dung output-intent.md] + [đoạn mô tả output_intent của dự án nếu có]`.
- Không có `output_intent` → chỉ luật nền (mặc định không CTA) → an toàn cho mọi ideal.

**Gọi `injectOutputIntent()` cạnh mỗi `injectStyleAnchor()` đã có:** trong `gates.ts` (runGate), `gateChat.ts` (runGateChat), `gate0.ts` (runGate0). Vì hàm bỏ qua khi không có placeholder, gọi thừa cũng vô hại.

### 3.4. Vá các điểm rò CTA (chèn placeholder + bỏ giả định cứng)

- **`_execution_scriptDraft.md`**: dòng 24 "payoff/CTA" → "payoff (CTA nếu ý đồ thương mại)"; mục Skills #5 "Pipeline bán hàng" → bọc rõ "CHỈ khi ý đồ đầu ra là thương mại"; template dòng 86/88 → điều kiện hóa; chèn `{{OUTPUT_INTENT}}` gần đầu file.
- **`_execution_skeletonWright.md`**: dòng 48 danh sách beat role bỏ "CTA" khỏi chuẩn mặc định (thành "... / giải quyết / CTA *nếu thương mại*"); template dòng 98 "payoff/CTA" → "payoff (CTA nếu thương mại)"; chèn `{{OUTPUT_INTENT}}`.
- **`_decision.md`**: dòng 36 sơ đồ GATE 3 "+ chữ CTA" → "+ chữ CTA *nếu thương mại*".
- **`reviewer.md`**: dòng 26 giữ điều kiện "nếu bán hàng"; thêm luật phạt: **chèn CTA/chào hàng khi ý đồ đầu ra là kể chuyện thuần = hạ hạng** (phạt cả 2 chiều).
- **`_execution_vidPrompter.md`**: chèn `{{OUTPUT_INTENT}}` gần mô tả trường `text_overlay`; nêu rõ text_overlay mặc định TRỐNG, chỉ điền CTA/giá khi ý đồ thương mại.

### 3.5. Genre giữ nguyên

Hệ genre à-la-carte KHÔNG đụng. `output_intent` (mô tả tự do, luôn có, dẫn tông + CTA) và `genre` (slug tùy chọn, gợi nhịp kể) là 2 trục độc lập.

## 4. Danh sách thay đổi (tổng)

**Code (engine):**
1. `src/shared/types.ts` — thêm `output_intent?: string` vào `IdealBrief`.
2. `src/main/tools/index.ts` — thêm `output_intent` vào schema + handler `write_ideal_brief`.
3. `src/main/core/skillLoader.ts` — thêm hàm `injectOutputIntent()`.
4. `src/main/pipeline/gates.ts` — gọi `injectOutputIntent()` trong `runGate`; thêm dòng hiển thị trong `snapshotForGate`.
5. `src/main/pipeline/gateChat.ts` — gọi `injectOutputIntent()` trong `runGateChat`.
6. `src/main/pipeline/gate0.ts` — gọi `injectOutputIntent()` trong `runGate0`.

**Skill (.md):**
7. `skills/output-intent.md` — TẠO MỚI (file nền luật đảo mặc định).
8. `skills/free/_execution_ideaAnalyst.md` — thêm skill "suy ý đồ đầu ra" + trục output.
9. `skills/free/_execution_scriptDraft.md` — điều kiện hóa CTA + chèn placeholder.
10. `skills/free/_execution_skeletonWright.md` — điều kiện hóa CTA + chèn placeholder.
11. `skills/free/_execution_vidPrompter.md` — điều kiện hóa text_overlay + chèn placeholder.
12. `skills/free/_decision.md` — điều kiện hóa CTA trong sơ đồ GATE 3.
13. `skills/reviewer.md` — thêm luật phạt CTA sai ý đồ (2 chiều).

## 5. Kiểm chứng

- **Typecheck + build** sau khi sửa code (EXIT=0).
- **E2E trong app** (người dùng chạy): tạo 1 dự án phim ngắn cảm xúc (ideal không bán gì) → kiểm GATE 0 suy `output_intent` nghiêng kể chuyện → kịch bản + prompt KHÔNG chèn CTA. Tạo 1 dự án affiliate → `output_intent` thương mại → CTA quay lại đúng chỗ.

## 6. Ngoài phạm vi (không làm ở spec này)

- Làm dày skill/thợ như Toonflow (phần 2 của yêu cầu — làm SAU khi gỡ CTA xong).
- Thêm UI widget chọn ý đồ (đã quyết: AI suy + sửa qua chat, không cần widget).
- Đụng vào hệ genre à-la-carte.
