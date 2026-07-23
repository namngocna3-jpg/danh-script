# LỚP · THƯ VIỆN THỂ LOẠI (genres) — dùng À-LA-CARTE, KHÔNG ép khuôn ⭐

> Bộ "gia vị nhịp kể + phân cảnh" cho từng kiểu video. Chắt từ 12 thể loại Toonflow + định dạng bán hàng + dạng nội dung phổ biến. Mỗi file = **1 thể loại** với: nhịp kể · hook mở · cấu trúc cảnh · cỡ cảnh ưu tiên · chuyển động máy hợp · mood điển hình · cạm bẫy.

## ⚠️ BẤT BIẾN: genre KHÔNG được phá kiến trúc bottom-up
Danh Script **suy bối cảnh từ ideal** (ideaAnalyst), KHÔNG chọn thể loại rồi nhồi khuôn (Sếp + reviewer đã cấm). Vì vậy:
- Genre là **GỢI Ý tùy chọn**, không phải bắt buộc. Ideal quyết định, genre chỉ hỗ trợ nhịp.
- **CHỈ nạp 1 genre khi ideal RÕ RÀNG khớp** thể loại đó (VD ideal review sản phẩm → `sales-affiliate-review`). Ideal mơ hồ/lai → dùng `free` (nhịp tự nhiên), không ép genre.
- Genre KHÔNG chứa: chất liệu render (STYLE lớp A) · thời đại/trang phục cứng (scene_context lớp B). Nó chỉ nói **CÁCH KỂ + CÁCH ĐẶT MÁY**, era-free & render-free.
- Genre KHÔNG ghi đè 7 báu luật của `storyboard-craft`, không ghi đè byteplus-spec. Xung đột → ưu tiên file kỹ thuật chung + ideal.

## Cách Sếp dùng
1. Đọc ideal. Nếu khớp rõ 1 thể loại → gợi ý người dùng ("ideal này hợp nhịp {genre}, dùng nhé?").
2. Người dùng đồng ý → nạp file genre tương ứng cho scriptwright (GATE 1) làm nhịp kể; ideaAnalyst vẫn suy bối cảnh bottom-up như thường.
3. Không khớp / người dùng muốn tự do → bỏ qua, chạy `free`.

## Danh mục (mở rộng dần)

**A · Định dạng BÁN HÀNG / thương mại**
- `sales-affiliate-review` — review/giới thiệu sản phẩm affiliate
- `sales-tvc-ad` — TVC quảng cáo thương hiệu ngắn
- `sales-fashion-lookbook` — thời trang / lookbook / thử đồ
- `sales-unboxing` — mở hộp / trải nghiệm lần đầu
- `sales-testimonial` — chứng thực / phản hồi khách hàng
- `sales-talking-head-kol` — KOL nói thẳng máy (talking-head)
- `sales-before-after` — trước–sau / lột xác / hiệu quả

**B · KỂ CHUYỆN / mini-drama**
- `story-urban-romance` — ngôn tình đô thị hiện đại
- `story-costume-palace` — cổ trang / cung đấu
- `story-xianxia-fantasy` — tiên hiệp / huyền huyễn
- `story-timetravel` — xuyên không / trọng sinh
- `story-revenge-satisfy` — sảng văn phục thù / lật kèo
- `story-family-slice` — gia đình / đời thường
- `story-sweet-fluff` — ngọt sủng / tình cảm nhẹ
- `story-horror-mystery` — kinh dị / huyền nghi / trinh thám
- `story-comedy` — hài / tấu hài tình huống
- `story-healing` — chữa lành / an yên
- `story-youth-campus` — thanh xuân / học đường
- `story-storytime-true` — kể chuyện có thật / tâm sự

**C · DẠNG KHÁC**
- `misc-travel-vlog` — du lịch / vlog
- `misc-food` — ẩm thực / nấu ăn
- `misc-explainer` — giải thích / giáo dục / kiến thức
- `misc-trailer` — trailer phim / teaser kịch tính
- `misc-realestate` — bất động sản / không gian
- `misc-real-human-ekyc` — người thật eKYC / Real Face (Coco)

> Mỗi file theo khung 6 mục cố định để đồng nhất. Thiếu thể loại → tạo file mới theo khung, thêm vào danh mục này.
