# 📦 BÀN GIAO — Danh Script (chuyển máy làm tiếp)

> File này viết cho **chính bạn ở máy mới** (hoặc AI ở máy mới). Đọc file này TRƯỚC khi làm gì.
> Cập nhật: 2026-07-24 · Nhánh: `main` · Sau đợt nâng cấp nền 9 task / 4 phase.

---

## 1. App này là gì (1 phút)

**Danh Script** = app Electron/TypeScript sinh **PROMPT video tiền kỳ**. Nó KHÔNG render video — dừng lại ở bước sinh prompt (ảnh + video) để bạn copy sang công cụ khác (Coco/Seedream/Seedance/BytePlus) tạo ảnh/video.

- **Luồng chính:** Ý đồ → Kịch bản (nháp → khung xương → chuyển thể → final) → Quy hoạch đạo diễn → Nguyên liệu (@tag + prompt ảnh asset) → Prompt ảnh block → Prompt video block → Xuất.
- **Triết lý:** *bottom-up* (đọc kỹ ý đồ rồi dựng, không ép khuôn) · *style = độ thật* · nhân vật khóa danh tính bằng **@tag** trỏ ảnh tư liệu.
- **"Linh hồn thợ" nằm trong file `.md`** (thư mục `skills/`), KHÔNG phải trong `src/`. Muốn đổi cách 1 thợ hành xử → sửa file `_execution_<tên>.md`, không sửa code.

---

## 2. Chạy app ở máy mới (QUAN TRỌNG)

```bash
cd danh-script
yarn install
npx electron-rebuild -f -w better-sqlite3   # BẮT BUỘC: better-sqlite3 phải khớp ABI Electron, nếu không → màn hình trắng
yarn dev:gui
```

**Lỗi hay gặp:** màn hình trắng = better-sqlite3 sai ABI → chạy lại lệnh `electron-rebuild` ở trên.

### Nghiệm thu không cần chạy app (app này CHƯA có test runner)
```bash
npm run typecheck   # tsc --noEmit cho node + web — phải EXIT 0
npm run build       # electron-vite build — phải EXIT 0
```
Đây là "hàng rào chất lượng" duy nhất hiện có. Trước khi commit bất cứ gì: cả hai phải EXIT 0.

---

## 3. Kiến trúc cốt lõi (đọc để khỏi lạc)

### 3.1. Hai đường chạy song song (DỄ NHẦM)
| | `GATES` | `CHAT_GATES` |
|---|---|---|
| File | `src/main/pipeline/gates.ts` | `src/main/pipeline/gateChat.ts` |
| Hàm | `runGate()` | `runGateChat()` |
| Kiểu | 1-phát, `maxSteps 24` | hội thoại từng lượt, `maxSteps 14` |
| Dùng khi | chạy tự động | người dùng chat tinh chỉnh từng cổng |

→ **Cùng 1 thợ khai ở CẢ HAI nơi.** Layer đã gộp về `workerSpecs.ts` (1 nguồn). `tools` vẫn để literal mỗi nơi vì gateChat spread `READ_TOOLS` khác gates.

### 3.2. Cơ chế tự sửa của agent (nền tảng của mọi guard)
`agentRunner` chạy tool-loop. Handler tool `throw` → set `is_error` → LLM **tự sửa ở lượt sau**. Vì vậy mọi guard chỉ cần `throw new Error("...tiếng Việt rõ...")`, không cần engine retry riêng.

### 3.3. File quan trọng
| File | Vai trò |
|---|---|
| `src/main/pipeline/workerSpecs.ts` | ⭐ MỚI — 1 nguồn khai `tools`+`layers` cho 4 thợ (director/asset/img/vid) |
| `src/main/pipeline/gates.ts` | GATES 1-phát + review A/B/C/D + export |
| `src/main/pipeline/gateChat.ts` | CHAT_GATES + `confirmGate()` (lá chắn chốt cổng) |
| `src/main/pipeline/orchestrator.ts` | "Sếp" điều phối gọi thợ con qua `run_worker` |
| `src/main/pipeline/tagGuard.ts` | ⭐ MỚI — `extractTags` + `checkTagsExist` (chống @tag mồ côi) |
| `src/main/tools/validators.ts` | ⭐ MỚI — 5 guard chống rác LLM vào DB |
| `src/main/tools/index.ts` | Định nghĩa mọi tool + gọi guard trong handler |
| `src/main/db/index.ts` | SQLite: scenes/blocks/assets/reviews. `projectTagMap`, `latestReviews`, `coverageReport`, `assetCoverage` |
| `skills/*.md` | Linh hồn thợ + layer chung (identity-lock, scene-analysis, storyboard-craft…) |
| `skills/free/_execution_*.md` | Linh hồn từng thợ (7 phần: Vai trò·Công cụ·Quy trình·Skills·Ràng buộc·Khung output·Tự kiểm) |

---

## 4. Đã làm gì trong đợt này (9 task / 4 phase)

Nguyên tắc chủ đạo bạn đã chốt: **"Chỉ chặn, không tự sửa"** — máy chỉ CHẶN chốt cổng khi review chấm D; việc sửa vẫn do agent/bạn quyết.

| Phase | Task | Làm gì | Commit |
|---|---|---|---|
| 1 Dọn nền | 1 | Gộp layer 4 thợ → `workerSpecs.ts` (DRY) | `394edb7` |
| | 2 | 5 guard write-tool (`validators.ts`) | `d8c4a46` |
| | 3 | `console.warn` thay `catch{}` nuốt lỗi | `0a8863f` |
| 2 Nhất quán @tag | 4 | Sửa luật docs: gate0 CHỈ ý đồ; @tag tách ở gate_assets | `b0ba1bd` |
| | 5 | `tagGuard.ts` | `3ec7029` |
| | 6 | Cờ mềm @tag mồ côi khi chốt gate2/3 (cảnh báo, không cứng chặn) | `e695555` |
| | 7 | Làm dày `identity-lock.md` (L0–L5 + bảng Giữ/Cấm) | `4821d3a` |
| 3 Rà soát nhẹ | 8 | Verify 3 thợ đủ 7 phần → không cần sửa | (không commit) |
| 4 Chặn theo điểm | 9 | `confirmGate` chặn D · cảnh báo C (force qua). `force` xuyên 5 tầng UI→DB | `b32ecaa` |

**Chi tiết cơ chế chặn (Task 9):** trong `confirmGate(projectId, gateStage, force)`:
- Review mới nhất của cổng chấm **D** → LUÔN throw (chặn).
- Chấm **C** → throw trừ khi `force=true` (nút "Chốt dù điểm C" chỉ hiện khi lỗi chứa cụm "điểm C").
- **A/B/? / chưa review** → qua bình thường.
- Chuỗi truyền `force`: `GateChatPanel.tsx` → `wizardStore.confirmGate` → preload `gate.confirm` → ipc `gate:confirm` → `confirmGate()`.

Kế hoạch + spec đầy đủ: `docs/superpowers/plans/2026-07-23-foundation-upgrade.md` và `docs/superpowers/specs/2026-07-23-foundation-upgrade-design.md`.

---

## 5. Việc CÒN LẠI / gợi ý làm tiếp (ưu tiên trên xuống)

> Đây là các ý tưởng nâng cấp tiếp, CHƯA làm. Không bắt buộc — chọn theo nhu cầu.

1. **Thêm test runner thật** (Vitest). Hiện chỉ có typecheck+build. Nên có unit test cho: `validators.ts` (5 guard), `tagGuard.ts` (extract/check), `confirmGate` (D chặn / C force / A qua). Đây là hố lớn nhất về độ tin cậy.
2. **Cờ @tag mồ côi hiện chỉ `console.warn`** (Task 6). Nếu muốn nghiêm hơn: đẩy vào UI cho người dùng thấy, hoặc chuyển thành chặn cứng có nút bỏ qua (giống cơ chế force của grade C).
3. **`{{OUTPUT_INTENT}}`** hiện chỉ vidPrompter dùng. Cân nhắc có nên inject cho imgPrompter không (hiện handler không inject → cố ý bỏ trống, đừng thêm mù).
4. **Rà các thợ Phase kịch bản** (scriptDraft/skeletonWright/adaptWright/scriptFinal) — đợt này chỉ rà 3 thợ ảnh/video/asset. Chưa verify 7-phần cho nhóm kịch bản.
5. **Reviewer chấm điểm** (`skills/reviewer.md`) — kiểm lại rubric A/B/C/D có khớp thực tế không, vì giờ D đã CHẶN cứng nên rubric sai = chặn oan.
6. **DB migration**: nếu đổi schema assets/reviews, nhớ cơ chế migrate (xem `src/main/db/`). App dùng `better-sqlite3` — file DB nằm ở userData của Electron.

---

## 6. Cảnh báo an toàn (ĐỪNG BỎ QUA)

- ⚠️ **`settings.json` (thư mục `~/.claude`) đang chứa `ANTHROPIC_API_KEY` + token Make.com dạng plaintext.** Khi tiện nên **xoay key** (rotate) và không để lộ ra log/commit công khai. File này KHÔNG thuộc repo danh-script nhưng liên quan môi trường chạy.
- App **dừng ở bước sinh prompt** — không có/không gọi API render. Giữ nguyên ranh giới này.
- Windows báo `LF→CRLF` khi commit: **vô hại**, kệ nó.

---

## 7. Checklist khi ngồi vào máy mới

- [ ] `git clone` repo · `yarn install` · `electron-rebuild better-sqlite3`
- [ ] `yarn dev:gui` → app mở, KHÔNG màn hình trắng
- [ ] `npm run typecheck` + `npm run build` → cả hai EXIT 0
- [ ] Đọc `docs/superpowers/plans/2026-07-23-foundation-upgrade.md` để nắm chi tiết 9 task
- [ ] Chọn việc tiếp theo từ Mục 5
