---
name: Craft dựng cảnh · 2D flat design
description: Công thức bố cục/shot/ánh sáng/prompt cho phong cách minh họa phẳng — khối màu thuần, không đổ bóng.
axis: art
---

# CRAFT ART · 2D flat design (minh họa phẳng)

> Rút khi dựng shot/prompt ảnh-video cho dự án style `2d_flat_design`. Bổ trợ cho `anchor.md` (chất liệu vẽ) — file này dạy CÁCH DỰNG CẢNH hợp chất liệu phẳng. KHÔNG chứa thời đại/trang phục (đó là scene_context lớp B).

## 1. Nguyên tắc bố cục theo chất liệu
- **Hình khối > chi tiết.** Flat design đọc bằng silhouette. Mỗi khung 1 chủ thể rõ, nền phân lớp bằng mảng màu lớn (foreground/mid/background = 3 mảng phẳng chồng), KHÔNG chồng nhiều lớp rối.
- **Canh giữa hoặc lệch 1/3 dứt khoát.** Style này không có DOF/bokeh để tách chủ thể → phải tách bằng tương phản màu + khoảng trống (negative space rộng).
- **Đường chân trời/trục dọc thẳng.** Ưa bố cục hình học cân đối; tránh góc nghiêng lộn xộn (Dutch angle chỉ khi cần bất an).

## 2. Bảng shot ưu tiên (hợp chất liệu phẳng)
| Cỡ cảnh | Dùng khi | Lưu ý phẳng |
|---|---|---|
| Wide/estab phẳng | mở cảnh, khoe không gian | nền = 2–3 mảng màu lớn, ít vật thể |
| Medium 1 chủ thể | nhịp kể chính | chủ thể chiếm ~40% khung, viền màu tách nền |
| Close biểu tượng | nhấn cảm xúc/vật | phóng to hình khối, bỏ chi tiết vụn |
| Flat-lay top-down | khoe sản phẩm/bày vật | rất hợp flat — bố cục lưới, đổ bóng phẳng đều |

- **Chuyển động máy:** ưu tiên `static`, `pan ngang`, `push thẳng` chậm. TRÁNH orbit 3D / dolly cong (chất liệu phẳng lộ giả khi xoay chiều sâu).

## 3. Ánh sáng · màu · texture
- **Ánh sáng = mảng, không phải nguồn.** Không mô tả "đổ bóng mềm từ cửa sổ" — thay bằng "khối sáng/khối tối phân mảng phẳng". Từ khóa: `flat lighting, no gradient, solid light/shadow shapes`.
- **Màu là nhân vật chính.** Bám bảng màu lõi trong anchor (xanh #3B82F6, cam #F59E0B…). Mỗi cảnh chọn 2–3 màu chủ đạo + 1 nhấn; Color Script điều tiết cảm xúc bằng SẮC ĐỘ (tươi→trầm), không bằng ánh sáng.
- **Texture = tối giản.** Không grain, không noise, không gradient. Nếu cần chất, dùng "subtle paper grain" rất nhẹ, không hơn.

## 4. Công thức prompt đặc thù (đoạn Hình dài nhất, Style ngắn nhất)
```
[HÌNH] flat vector illustration of <chủ thể + hành động cụ thể>, <bối cảnh scene_context>,
composition <bố cục hình học>, <2–3 màu chủ đạo> color scheme, bold clean shapes, generous negative space
[STYLE] 2D flat design, solid color blocks, no shadows no gradients  ← NGẮN, không chứa era
[CAMERA] <cỡ cảnh + chuyển động phẳng>
```
- Nhân vật tái dùng: nhúng @tag + "identical flat character design across the take".
- Video (image-to-video): chỉ tả THAY ĐỔI dạng phẳng (mảng màu trượt, hình khối biến hình, cut phẳng), không tả xoay chiều sâu.

## 5. Cạm bẫy (style này hay hỏng)
- ❌ Mô tả đổ bóng/gradient/ánh sáng thể tích → phá chất phẳng (reviewer bắt RV2).
- ❌ Nhồi chi tiết vụn (hoa văn li ti, texture da) → flat design phải rút gọn thành khối.
- ❌ Orbit/xoay 3D chủ thể → lộ ra style không có chiều sâu.
- ❌ Để đoạn STYLE chứa thời đại/trang phục → sai phân tầng (era ở scene_context).
