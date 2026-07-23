# DANH SCRIPT — KẾ HOẠCH BUILD (chia task theo đợt)

> Đọc sau `00`, `01`, `04`. Nền code: **build mới hoàn toàn**. Cách làm: **spec-first** (duyệt xong mới code). Làm **tuần tự**, không bắn song song.

---

## ĐỢT 0 — Móng (khung chạy được, chưa có trí tuệ)

| # | Task | Xong khi |
|---|---|---|
| 0.1 | Khởi tạo Electron + React + Vite + TS + Tailwind + shadcn | `yarn dev` mở cửa sổ trắng có tiêu đề "Printfilm" |
| 0.2 | SQLite (better-sqlite3) + schema `projects/scenes/blocks/assets` | Tạo/đọc 1 dự án test trong DB |
| 0.3 | `llmGateway.ts` — cổng model 1 mối, config provider/model | Gọi thử Claude API trả về "hello" |
| 0.4 | `queue.ts` — hàng đợi 800ms + async + timeout/retry | Test bắn 5 lệnh, chạy tuần tự cách 800ms |
| 0.5 | Dashboard UI — danh sách dự án, nút tạo mới | Thấy dự án test hiện trên màn hình |

**Mốc:** app mở được, tạo dự án, gọi được LLM qua cổng, có hàng đợi. Chưa có agent.

---

## ĐỢT 1 — MVP 1 pipeline Affiliate (chứng minh engine)

| # | Task | Xong khi |
|---|---|---|
| 1.1 | `agentRunner.ts` — chạy 3 tầng (Decision/Execution/Supervision) | 1 agent đọc `.md` làm system prompt, gọi được tool |
| 1.2 | ⭐ **`ideaAnalyst`** + `scene-analysis.md` — phân tích ideal → Scene Context TỪNG cảnh (bottom-up) | Ideal xuyên không → cảnh 1 cổ trang, cảnh 5 hiện đại, KHÔNG lẫn |
| 1.3 | Bộ tool: `read_ideal/write_scene_context/write_script/write_image_prompt/write_video_prompt/save_asset/export_bundle` | Thợ ghi được bối cảnh/kịch bản/prompt vào DB |
| 1.4 | `skillLoader.ts` — nạp `.md` (chưa cần lazy-load) | Đọc đúng `affiliate/_decision.md` |
| 1.5 | Viết linh hồn: `affiliate/_decision.md` + `_execution_{ideaAnalyst,script,imgprompt,videoprompt,consistency}.md` | Bottom-up, không áp style từ đầu |
| 1.6 | ⭐ **Bê 1–2 style từ Toonflow** (VD `real-photoreal` + `2d-chinese-guofeng`): copy folder → Việt hóa prefix → rà L1/L2/L3. Thêm `identity-lock.md` (lớp C) | Prompt ghép 3 lớp; cảnh hiện đại KHÔNG lọt "cổ trang"; đổi style thấy đổi chất liệu hình |
| 1.7 | `review.md` + giám sát A/B/C/D + red-line (thêm red-line: "lọt anchor thể loại sai cảnh") | Trình báo cáo lỗi trước khi chốt |
| 1.8 | Wizard UI 5 cổng — GATE 0 (phân tích ideal) → 4, mỗi cổng hỏi/chốt | Chạy 1 dự án Affiliate từ ideal → xuất bảng |
| 1.9 | `validate.ts` + `model-catalog.md` — check theo **BytePlus/Seedance** | Cảnh báo khi tham số sai ràng buộc BytePlus |
| 1.10 | Màn Xuất — bảng block, nút [Copy ảnh][Copy video][✔ rendered] + ước tính credit | Copy được prompt, đánh dấu đã render |

**Mốc:** chạy trọn 1 luồng Affiliate, **test bằng ideal xuyên không để chứng minh không fail**, xuất bảng copy sang Coco. **Đây là bản demo để bạn nghiệm thu.**

---

## ĐỢT 2 — Nâng chất + thêm pipeline

| # | Task |
|---|---|
| 2.1 | Lazy-load skill (mỏ #3) — khi kho style phình to |
| 2.2 | RAG memory (mỏ #4) — SQLite + all-MiniLM-L6-v2, nhớ nhân vật xuyên dự án |
| 2.3 | Recovery + estimate-cost bản LLM (mỏ #7) |
| 2.4 | Omni `<<<Image1>>>` + first/end frame vào prompt video (mỏ #8) |
| 2.5 | Thư viện chuyển động camera preset (mỏ #14) |
| 2.6 | Né kiểm duyệt eKYC (mỏ #11) — khi làm Real Human |
| 2.7 | Thêm pipeline **TVC** = viết bộ `.md` mới (không đụng code) |
| 2.8 | ⭐ **Bê đủ 11 style Toonflow** (Việt hóa prefix + rà L1/L2/L3) + **dựng style mới**: 2D Disney/phương Tây, 3D Pixar, webtoon Hàn, Ghibli, điện ảnh VN (áo dài/phố cổ) |
| 2.9 | UI chọn style có preview.png (grid thumbnail) |

---

## ĐỢT 3 — Mở rộng (cần render/API thật, để sau)

| # | Task |
|---|---|
| 3.1 | Thêm pipeline **Fashion** |
| 3.2 | Module Video Analyzer (mỏ #12) |
| 3.3 | Virality Prediction (mỏ #15) |
| 3.4 | Đóng gói .exe (electron-builder) + installer |

---

## Thứ tự tuyệt đối (không nhảy)

```
ĐỢT 0 (móng) → nghiệm thu → ĐỢT 1 (MVP Affiliate) → NGHIỆM THU DEMO
   → ĐỢT 2 (nâng chất + TVC) → ĐỢT 3 (Fashion + mở rộng + đóng gói)
```

**Quy tắc:** mỗi task xong phải chạy thử đúng "Xong khi" rồi mới sang task sau. Không viết code đợt sau khi đợt trước chưa nghiệm thu.

---

## Việc cần bạn quyết trước khi bắt đầu ĐỢT 0

1. **Cổng model LLM dùng cái nào trước?** Claude API trực tiếp (cần key) hay 9router/beeknoee?
   (Nhắc: đây là model app dùng để *suy nghĩ/viết prompt* — KHÁC model render BytePlus ở Coco.)
2. **Có kết nối MCP Higgsfield** (bằng tài khoản bạn) để tôi soi thật tool #12–15 không? Không thì để đợt 3.
3. ✅ Tên app đã chốt: **Danh Script**. Có đổi tên thư mục `E:\PRINTFILM-APP` → `E:\DANH-SCRIPT` luôn không?
