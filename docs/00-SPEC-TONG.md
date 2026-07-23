# DANH SCRIPT — SPEC TỔNG (bản duyệt trước khi code)

> **Người dùng:** Phạm Thành Danh · **Ngày:** 2026-07-23
> **Tên app:** **Danh Script** (Printfilm là app của người khác — chỉ là 1 trong 5 nguồn tham khảo, KHÔNG phải tên app này).
> **Trạng thái:** 📝 CHỜ DUYỆT — chưa viết code. Đọc file này + `01-KIEN-TRUC.md` + `02-KE-HOACH-BUILD.md` + `04-PHAN-TICH-IDEAL-VA-DO-THAT.md` rồi chốt.

---

## 1. Danh Script là gì (1 đoạn)

**Danh Script** là app desktop (Electron) **HOÀN TOÀN MỚI**, dùng nội bộ, giao diện + tương tác **thuần tiếng Việt**, **mọi prompt sinh ra bằng tiếng Anh**. App nhận 1 *ideal* (concept video) → **PHÂN TÍCH ideal để tự suy ra bối cảnh/nhân vật/thời đại** (bottom-up, KHÔNG áp khuôn từ đầu) → đẻ ra **trọn bộ tiền kỳ**: kịch bản phân cảnh → prompt ẢNH khung đầu → prompt VIDEO chuyển động → luật giữ nhất quán → **xuất bảng copy-paste**.

**5 nguồn (Toonflow · Printfilm · TopView · Higgsfield · Coco) = THAM KHẢO/HỌC THEO.** Vì output của chúng tốt nên **được copy agent & skill về, Việt hóa + sửa thành của mình, hoặc lấy nguyên nếu hợp** (xem chính sách copy ở `05-THU-VIEN-STYLE.md`). App này là sản phẩm mới của Danh, không phải fork của bất kỳ nguồn nào.

**Bộ não = engine PHÂN TÍCH IDEAL** (học intent-first của TopView + triết lý linh hoạt của Higgsfield). Cấu trúc agent/giám sát học từ Toonflow. Xem bản đồ 5 nguồn ở `04`.

**Ranh giới cứng:** App **DỪNG trước bước render**. Không gọi API sinh ảnh/sinh video. Người dùng cầm prompt qua **Coco Studio** render ảnh → cầm ảnh + prompt video render clip. Danh Script = "xưởng viết kịch bản & prompt", không phải "xưởng render".

**Target render = CHỈ model BytePlus** (Coco Studio chỉ chạy BytePlus/Seedance). Model-catalog & validate chỉ theo BytePlus — không đưa Kling/Veo/GPT Image vào (Coco không có).

**Linh hoạt như Higgsfield:** 3 pipeline (Affiliate/TVC/Fashion) chỉ là **cửa vào (preset)**, không phải khuôn ép. Engine xử được **ideal bất kỳ**.

---

## 2. Vì sao làm app này (mục đích thật)

- coco-video hiện là **1 skill chạy trong Claude** → mỗi lần dùng phải mở Claude, không lưu dự án, không quản nhân vật xuyên phiên, không có DB, không UI.
- Bạn cần **công cụ đứng riêng**: mở lên, tạo dự án, chạy wizard, lưu lại, quản lý nhiều video/nhiều nhân vật, xuất bảng gọn để dán sang Coco.
- App nhắm **3 pipeline bán hàng VN**: **Affiliate Video (#1), TVC Short (#2), Fashion Video (#3)** — khoảng trống mà Toonflow (phim truyện Trung) và coco chưa phủ.

---

## 3. Nguyên tắc bất biến (khắc vào đá)

1. **Không render.** App chỉ sinh text/prompt. Điểm dừng = xuất bảng prompt.
2. **UI tiếng Việt — Prompt tiếng Anh.** Người dùng gõ ý tiếng Việt; agent dựng prompt kỹ thuật tiếng Anh. Chỉ *narration/voice* theo ngôn ngữ người dùng chọn.
3. **⭐ IDEAL QUYẾT ĐỊNH, KHÔNG áp style từ đầu (bottom-up).** GATE 0 **phân tích ideal** để suy ra bối cảnh/thời đại/trang phục/nhân vật **theo TỪNG cảnh**. Cấm chọn 1 style rồi nhồi anchor thể loại vào mọi block. → Cảnh xuyên không (cổ trang→hiện đại) KHÔNG bị ép sai, KHÔNG fail. Chi tiết `04`.
4. **⭐ STYLE = chất liệu render (nhất quán toàn dự án), KHÁC BỐI CẢNH = thời đại (theo cảnh).** Style (độ thật / 2D Nhật / 2D Trung / 3D anime / clay...) chọn 1 lần, lặp mọi block (L1 cứng). Bối cảnh/trang phục/thời đại = lớp mềm theo cảnh (L2), do ideal đẻ ra. Có **thư viện style đầy đủ** (`05`) — bê 11 style từ Toonflow + bổ sung style mới (2D/3D phương Tây, webtoon, Ghibli, điện ảnh VN...).
5. **⭐ Nhất quán chỉ khóa CỨNG nhận dạng nhân vật** (mặt, dáng). Đồ/cảnh/thời đại = **mềm**, đổi theo script. Không khóa cứng thể loại.
6. **Linh hồn nằm trong Markdown.** Cách nghĩ/quy trình/tiêu chuẩn/template prompt = file `.md` trong `skills/`. Code chỉ là bộ khung đọc `.md` + gọi LLM + lắp tool. Đổi hành vi = sửa `.md`, không đụng `src/`.
7. **Agent-per-mảng.** Mỗi agent phụ trách 1 mảng: phân tích ideal, kịch bản, prompt ảnh, prompt video, giám sát. Có phân quyền cứng (mượn vỏ Toonflow).
8. **Sinh prompt = chuyển format, KHÔNG sáng tác.** Ideal là nguồn nội dung duy nhất. Cấm tự thêm đạo cụ/nhân vật/cánh hoa mà ideal không có.
9. **Chống bịa.** Số/ngày/tên/giá thật → verify hoặc hỏi, không bịa.
10. **⭐ Target CHỈ BytePlus.** Coco chỉ chạy BytePlus/Seedance. Validate tham số theo BytePlus. Không target model ngoài.
11. **⭐ Ideal nào cũng làm (linh hoạt như Higgsfield).** 3 pipeline chỉ là cửa vào; engine không từ chối ideal lạ.
12. **Chạy tuần tự, không bắn song song ồ ạt.** Hàng đợi 800ms (chống treo/màn trắng — đúng lỗi hay gặp).
13. **Đóng gói cài local.** Không deploy. Build ra .exe chạy Windows.
14. **Model (LLM sinh prompt) qua 1 cổng.** Claude API trực tiếp HOẶC gateway 9router/beeknoee — đổi model không sửa logic. (Khác với model RENDER = BytePlus ở Coco.)

---

## 4. Luồng người dùng (end-to-end)

```
Mở app → Dashboard (danh sách dự án)
   │
   ├─ Tạo dự án mới → chọn pipeline (Affiliate / TVC / Fashion)
   │
   ▼ WIZARD 5 CỔNG (mỗi cổng: sinh → tự giám sát A/B/C/D → trình → chốt)
   │
   ├ GATE 0 · Ý ĐỒ + RESEARCH   → làm giàu ideal, verify fact
   ├ GATE THAM SỐ               → thời lượng · tỉ lệ · phong cách · nhân vật · model · ngôn ngữ
   ├ GATE 1 · KỊCH BẢN          → cắt cảnh → block 10s + narration
   ├ GATE 2 · PROMPT ẢNH        → prompt ảnh khung đầu mỗi block (EN)
   ├ GATE 3 · PROMPT VIDEO      → 5 trường STYLE/SCENE/MOTION/AUDIO/NEGATIVE (EN)
   └ GATE 4 · NHẤT QUÁN + XUẤT  → khóa nhân vật/style, validate, xuất bảng
   │
   ▼ MÀN XUẤT: bảng block, mỗi block có nút [Copy ảnh] [Copy video] [✔ đã render]
   │           + ước tính credit + ghi chú eKYC (nếu Real Human)
   │
   ▼ Người dùng dán prompt sang Coco Studio để render (ngoài app)
```

---

## 5. Phạm vi bản đầu (đề xuất)

**Đợt 1 — MVP 1 pipeline (Affiliate):** chạy trọn 1 luồng Affiliate từ ideal → xuất bảng, có lưu dự án + quản nhân vật cơ bản. Chứng minh engine chạy đúng rồi mới nhân ra TVC/Fashion (chỉ là thêm file `.md`, không đụng code).

> Bạn đã chọn "Build mới hoàn toàn" cho nền code, và spec-first. File `02-KE-HOACH-BUILD.md` sẽ chia task theo đợt.

---

## 6. Cái gì KHÔNG làm ở bản đầu (để sau)

- Gọi API render thật (mãi không làm — đó là ranh giới cứng).
- Module Virality Prediction (chấm điểm video đã render) — cần video thật.
- Train Soul-ID thật (cần API Higgsfield).
- Video Analyzer (bóc clip mẫu) — đợt sau.
- Đa ngôn ngữ UI (chỉ tiếng Việt).

---

## 7. Tài liệu liên quan

- `01-KIEN-TRUC.md` — kiến trúc kỹ thuật: agent, DB, engine, cổng model, cây thư mục.
- `02-KE-HOACH-BUILD.md` — chia task theo đợt, thứ tự làm, tiêu chí "xong".
- `03-MO-VANG-5-NGUON.md` — bảng 15 mỏ vàng + nguồn + vào phần nào (đã soi đủ 5 nguồn).
- `04-PHAN-TICH-IDEAL-VA-DO-THAT.md` — ⭐ bộ não bottom-up + phân biệt STYLE vs BỐI CẢNH (3 lớp L1/L2/L3).
- `05-THU-VIEN-STYLE.md` — ⭐ thư viện style (11 bê Toonflow + bổ sung) + chính sách copy 5 nguồn.
