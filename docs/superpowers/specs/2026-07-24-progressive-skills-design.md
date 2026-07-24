# Progressive-Skills + Kho craft 2 trục ART×STORY — Design

**Ngày:** 2026-07-24 · **Nhánh:** `feature/progressive-skills`

## Mục tiêu
Đưa cơ chế nạp skill của Danh Script sát Toonflow: (A) thợ **tự rút skill** khi cần (progressive-disclosure), (B) **kho craft dày** tách 2 trục **ART** (phong cách thị giác) × **STORY** (thể loại tự sự) + mở rộng thêm style/genre.

## Vì sao (chẩn đoán hiện trạng)
- Danh Script ĐÃ có 3 tầng agent + skill thợ 7 phần + chốt từng bước.
- THIẾU so Toonflow: (1) craft nạp **tĩnh** — nhồi sẵn 1 danh sách layer cố định, thợ không tự lấy thêm; (2) mỗi style chỉ 1 `anchor.md` ~25 dòng (chỉ chất liệu vẽ), không có craft dựng cảnh/phân shot theo style; (3) step đầu (ý đồ→kịch bản) craft mỏng.

## Phần A — Engine progressive-disclosure

### craftRegistry.ts (mới, `src/main/core/`)
- `parseFrontmatter(md)` → `{ meta: {name, description, axis, steps[]}, body }`. Strip YAML frontmatter khỏi body khi nạp.
- `scanCraft()` quét 3 nguồn, đọc frontmatter:
  - `skills/craft/*.md` — **axis: common** (craft chung theo step).
  - `skills/styles/<style>/craft.md` — **axis: art** (craft dựng cảnh/shot theo phong cách).
  - `skills/genres/<genre>.md` — **axis: story** (nhịp kể + phân cảnh theo thể loại).
- `availableCraftFor(step, styleId, genreId)` → lọc: axis=common khớp step; axis=art chỉ style dự án; axis=story chỉ genre dự án (+ liệt kê khác để tham khảo qua tool).
- Guard `isPathInside` chống path-traversal cho `read_skill_file`.

### Tool mới (`tools/index.ts`)
- `list_skills` — trả danh sách `<available_skills>` (name·description·path) khớp step hiện tại.
- `read_skill_file` — đọc TOÀN VĂN 1 craft theo path (đã strip frontmatter, guard path).

### Móc vào gateChat/gates
- Khi build system: giữ layer CỐT LÕI tĩnh (identity-lock, style-constitution — luật bất biến), CỘNG chèn khối `<available_skills>` (danh sách ngắn) + cấp 2 tool trên.
- Mỗi ChatGateSpec khai `step` (chính là gateStage) + engine tự suy axis từ step.

## Phần B — Kho craft 2 trục

### Trục ART — `skills/styles/<style>/craft.md` (mới, mỗi style 1 file)
Frontmatter + nội dung: nguyên tắc bố cục theo phong cách · bảng shot ưu tiên (cỡ cảnh/góc/chuyển động hợp style) · xử lý ánh sáng-màu-texture theo style · công thức prompt ảnh/video đặc thù style · cạm bẫy. Giữ nguyên `anchor.md` cũ (chất liệu vẽ).

### Trục STORY — làm dày `skills/genres/*.md`
Thêm frontmatter (name/description/axis: story/steps) + làm dày mỗi genre theo khung đã có (nhịp · hook · cấu trúc cảnh · cỡ cảnh · mood · cạm bẫy), bổ sung thêm genre mới.

### Craft chung mới — `skills/craft/*.md`
Craft theo step cho các step đang mỏng (ý đồ, khung xương, chuyển thể, đạo diễn) — thợ tự rút.

## Kiểm thử (không có test runner)
- `npm run typecheck` EXIT 0
- `npm run build` EXIT 0
- Rà logic: registry đọc đúng frontmatter, tool guard path, không phá layer tĩnh cũ, tương thích dự án cũ (không có craft.md → fallback anchor).

## Ràng buộc
- Tiếng Việt toàn bộ. App DỪNG ở prompt. Không đụng luật bottom-up (genre chỉ gợi ý). Làm tuần tự (subagent 1 lần 1 cụm). Chạy được macOS. Xong tự PR + merge.
