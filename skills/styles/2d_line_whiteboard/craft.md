---
name: Craft dựng cảnh · Nét vẽ bảng trắng
description: Công thức bố cục/shot/ánh sáng/prompt cho line/whiteboard explainer — nét mảnh, nền sạch, icon đơn giản, hợp giáo dục/khóa học.
axis: art
---

# CRAFT ART · 2d_line_whiteboard (nét vẽ bảng trắng)

> Rút khi dựng shot/prompt cho style `2d_line_whiteboard`. Bổ trợ `anchor.md` (doodle nét mảnh, nền trắng sạch, nhấn 1–2 màu). File này dạy CÁCH DỰNG CẢNH kiểu video explainer/giáo dục. KHÔNG chứa thời đại/trang phục (đó là scene_context lớp B).

## 1. Nguyên tắc bố cục theo chất liệu
- **Rõ ý > đẹp mắt.** Style này để GIẢI THÍCH: mỗi khung tải đúng 1 ý, dựng như một slide sạch. Chủ thể/icon ở giữa hoặc lệch 1/3 dứt khoát, phần còn lại để trắng cho mắt nghỉ.
- **Silhouette đơn giản, nét đồng đều.** Đọc bằng đường viền mảnh một-độ-dày, bỏ chi tiết vụn. Một người = vài nét gọn, một khái niệm = 1 icon. Tránh vẽ tả thực.
- **Bố cục hình học, thẳng.** Ưa trục ngang/dọc ngay ngắn, mũi tên/khung/nhóm icon sắp lưới. Tránh góc nghiêng, tránh phối cảnh sâu (style phẳng).

## 2. Bảng shot ưu tiên (hợp chất liệu doodle)
| Cỡ cảnh | Dùng khi | Lưu ý whiteboard |
|---|---|---|
| Flat frontal "slide" | ý chính / khái niệm | 1 icon-cụm giữa nền trắng, nhấn 1 màu |
| Icon-cluster / sơ đồ | quy trình, so sánh, list | icon + mũi tên sắp lưới, đều khoảng cách |
| Close 1 icon | nhấn 1 điểm | phóng to 1 biểu tượng, nét sạch |
| Nhân vật doodle medium | người dẫn / tình huống | dáng người tối giản, cử chỉ rõ |

- **Chuyển động máy:** phẳng — `static`, `pan ngang theo dòng đọc`, `push nhẹ vào icon`. Đặc sản: cảm giác "đang được vẽ ra" (draw-on). Video: "hand-drawn line reveal, elements drawn on sequentially, simple pop-in, flat 2d".

## 3. Ánh sáng · màu · texture
- **Không ánh sáng thể tích.** Nền trắng phẳng, KHÔNG đổ bóng/gradient. "Sáng" = nền trắng, "nhấn" = màu accent, hết. Từ khóa: `flat white background, no shadow, no gradient`.
- **Màu = công cụ nhấn ý.** Bám palette anchor: chủ đạo trắng + nét đen, chỉ 1–2 màu highlight (xanh #2F80ED / cam #F2994A) cho điểm quan trọng. Color Script ở đây = "tô màu ý cần nhớ", không phải tạo tâm trạng.
- **Texture = gần như không.** Nét mực sạch, đồng đều. Nếu cần chất, chỉ "subtle marker texture" rất nhẹ. Cấm shading, cấm noise, cấm nền hoa văn.

## 4. Công thức prompt đặc thù (đoạn Hình dài nhất, Style ngắn nhất)
```
[HÌNH] minimalist line-art doodle of <chủ thể/khái niệm cụ thể>, <bối cảnh scene_context tối giản>,
composition <icon giữa/sắp lưới + nhiều khoảng trắng>, single accent color <màu> on white, clean thin strokes
[STYLE] whiteboard explainer line-art, flat, no shadow  ← NGẮN, không chứa era
[CAMERA] <flat frontal / pan theo dòng / push vào icon>
```
- Nhân vật/biểu tượng tái dùng: @tag + "identical simple line style, same stroke weight and accent color across the take".
- Video (image-to-video): tả "nét được vẽ dần ra, icon pop-in tuần tự, mũi tên chạy" — KHÔNG tả xoay 3D hay đổ bóng.

## 5. Cạm bẫy (style này hay hỏng)
- ❌ Thêm đổ bóng/gradient/tả thực → phá chất phẳng-sạch của bảng trắng.
- ❌ Nét dày mỏng loạn / nhồi chi tiết → mất sự tối giản, rối slide.
- ❌ Dùng >2–3 màu tràn lan → mất chức năng "màu để nhấn ý".
- ❌ Phối cảnh sâu / góc nghiêng → lộ style vốn phẳng, mất cảm giác slide.
- ❌ Để đoạn STYLE chứa thời đại/trang phục → sai phân tầng (era ở scene_context).
