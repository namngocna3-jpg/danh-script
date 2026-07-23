# 15 MỎ VÀNG từ 5 nguồn — soi đầy đủ

> Bảng này trả lời câu bạn hỏi: *"check lại skill & agent 5 nguồn xem bổ sung được gì để app mạnh hơn coco."*
> Đã soi THẲNG: Toonflow + Printfilm (`E:\PHAN-TICH-2APP`), TopView (clone `SOURCES/topview-skill`). Higgsfield qua docs (MCP đòi OAuth, không tải được tool list).

---

## Bảng tổng — 15 mỏ

| # | Mỏ vàng | Nguồn | coco có? | Vào phần nào của Printfilm |
|---|---|---|---|---|
| 1 | **Agent 3 tầng phân quyền cứng** — Quyết định (sếp, ≤100 chữ, không tự làm) / Thực thi (thợ, có tool) / Giám sát (chấm A/B/C/D độc lập) | Toonflow | ❌ | **Engine lõi** |
| 2 | **Hàng đợi 800ms + async polling** — `createSocketQueue`, rải request | Toonflow + TopView | ❌ | **Chống treo/màn trắng** |
| 3 | **Lazy-load skill** — nạp danh sách tên trước, đọc nội dung khi cần | Toonflow | 🟡 | **Kho phong cách vô hạn** |
| 4 | **RAG memory mini** — SQLite + embedding local, tự nén ký ức, cosine top-k | Toonflow | ❌ | **Nhớ nhân vật xuyên dự án** |
| 5 | **Phong cách 3 tầng** — prefix "hiến pháp thẩm mỹ" (hex/Kelvin) + template `{slots}` + anchor words | Toonflow | 🟡 | **Chống ảnh "generic AI"** |
| 6 | **Tài sản + biến thể có cấu trúc** — Character/Scene + `variations` + `coreFeatures` + `referenceImage` | Printfilm | 🟡 | **DB tài sản** |
| 7 | **`run/submit/query` + cây recovery + `estimate-cost`** — điều phối tác vụ chậm, hồi phục timeout | TopView | ❌ | **Điều phối tác vụ LLM** |
| 8 | **Omni reference `<<<Image1>>>` + first/end frame** — cú pháp nhúng tham chiếu | TopView | ❌ | **Cú pháp prompt video** |
| 9 | **Model catalog ràng buộc per-model** — aspect/resolution/duration hợp lệ theo từng model | TopView | 🟡 | **Bộ validate tham số** |
| 10 | **Registry model 1 cổng** — provider+modelName, đổi model không sửa logic | Printfilm | ❌ | **Nối 9router/beeknoee** |
| 11 | **`rewritePromptForModeration` / `textToVideoOnly`** — né kiểm duyệt người thật | Printfilm | ❌ | **Hợp USP eKYC face thật** |
| 12 | **Video Analyzer** — bóc 1 clip mẫu → trả prompt sẵn | Higgsfield | ❌ | **Module reverse-engineer (đợt sau)** |
| 13 | **Soul character training** — nhân vật nhất quán từ ảnh ref | Higgsfield | 🟡 | **Đặc tả nhân vật (metadata)** |
| 14 | **Camera/Motion presets** — Bullet Time, slow 360° orbit, dolly, crane | Higgsfield + TopView | 🟡 | **Thư viện chuyển động** |
| 15 | **Virality Prediction** — chấm hook/retention/viral | Higgsfield | 🟡 | **Module chấm điểm (đợt sau, cần video thật)** |

Chú thích: ✅ có · 🟡 có sơ sài/rút gọn · ❌ chưa có.

---

## Nhóm theo mức ưu tiên đưa vào MVP

### 🔴 PHẢI CÓ ngay (đợt 1) — đây là "xương sống"
- **#1 Agent 3 tầng** — không có cái này thì chỉ là coco đổi tên.
- **#2 Hàng đợi + async** — chống đúng lỗi bạn hay gặp (màn trắng, sinh hàng loạt lỗi).
- **#5 Phong cách 3 tầng** — thứ làm output KHÔNG generic (yêu cầu cứng của bạn về UI/thẩm mỹ).
- **#6 DB tài sản** — app thật cần lưu nhân vật/sản phẩm.
- **#9 Validate tham số** — xuất prompt sai model là vô dụng.
- **#10 Cổng model 1 mối** — nối beeknoee/9router như bạn muốn.

### 🟡 NÊN CÓ (đợt 2) — nâng chất
- **#3 Lazy-load** (khi kho phong cách phình to).
- **#4 RAG memory** (khi nhân vật lặp qua nhiều dự án).
- **#7 recovery + estimate-cost** (bản LLM: retry khi gọi LLM lỗi + ước credit render).
- **#8 Omni/first-last frame** (làm giàu prompt video).
- **#11 Né kiểm duyệt** (khi làm Real Human/eKYC).
- **#14 Thư viện chuyển động** (preset camera sẵn để chọn).

### ⚪ ĐỂ SAU (đợt 3+) — cần render/API thật
- **#12 Video Analyzer**, **#13 Soul train thật**, **#15 Virality** — phụ thuộc video/API bên ngoài.

---

## Ghi chú Higgsfield (chưa soi thật được)

MCP `https://mcp.higgsfield.ai/mcp` **đòi đăng nhập OAuth** (openid/email/offline_access). Không có tài khoản → không đọc được tool list thật, chỉ suy từ docs công khai.

**Nếu muốn soi thật:** kết nối MCP đó vào Claude Code bằng tài khoản Higgsfield của bạn (Settings → MCP), rồi tôi đọc trực tiếp danh sách tool + tham số. Không thì bản chắt lọc trên đã đủ để thiết kế (các mỏ #12–15 vốn thuộc "đợt sau").
