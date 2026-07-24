---
name: Craft dựng cảnh · 2D quốc phong thủy mặc
description: Công thức bố cục/shot/ánh sáng/prompt cho 2D quốc phong cel-shade pha thủy mặc — nhịp thở phương Đông, khoảng trắng.
axis: art
---

# CRAFT ART · 2D guofeng ink (cel + thủy mặc)

> Rút khi dựng shot/prompt cho style `2d_guofeng_ink`. Bổ trợ `anchor.md` (cel-shade + accent thủy mặc, brush texture). File này dạy CÁCH DỰNG CẢNH phương Đông. KHÔNG khóa thời đại.

## 1. Nguyên tắc bố cục theo chất liệu
- **Khoảng trắng (lưu bạch) là bố cục.** Thẩm mỹ thủy mặc: chừa mảng trống lớn cho "hơi thở". Chủ thể lệch mạnh về 1 góc, phần còn lại là sương/trời/nước gợi mà không tả.
- **Bố cục dọc gợi cuộn tranh.** Ưa trục dọc, tiền-trung-hậu cảnh xếp lớp theo chiều sâu sương mù (không khí xa mờ dần).
- **Đường brush dẫn mắt.** Cành cây, dòng nước, dải mây vẽ theo nét bút lông dẫn ánh nhìn — vừa chất liệu vừa bố cục.

## 2. Bảng shot ưu tiên
| Cỡ cảnh | Dùng khi | Lưu ý quốc phong |
|---|---|---|
| Wide sơn thủy | mở cảnh, khí chất | núi/nước lớp mờ dần, lưu bạch rộng |
| Medium 1 nhân vật | nhịp kể chính | nhân vật lệch góc, y phục bay theo gió |
| Close chi tiết thanh nhã | nhấn vật/cảm xúc | 1 vật tinh (quạt, kiếm, chén trà), nền brush mờ |
| Layered sương mù | chiều sâu, huyền ảo | 3–4 lớp mờ dần bằng ink-wash |

- **Chuyển động máy:** `slow pan dọc kiểu mở cuộn tranh`, `push tĩnh tại`, `static thiền`. Video: "ink diffusing, mist drifting, robe and hair flowing slowly".

## 3. Ánh sáng · màu · texture
- **Ánh sáng tán mềm, không gắt.** Ưa sáng khuếch tán kiểu sương/nguyệt; tránh spotlight gắt kiểu phương Tây. Điểm sáng kim hoàng làm nhấn quý phái.
- **Palette nhã.** Bám anchor (nguyệt bạch #E8EAF5, thanh lục #4A9B8A, chu hồng #C93752, kim hoàng #D4AF37…). Ít màu, nhiều sắc độ; nhấn 1 chu hồng/kim hoàng.
- **Texture:** brush texture + ink-wash accent (anchor). Cho phép vệt mực loang ở nền/chuyển cảnh. Cấm CGI, cấm gradient số mượt.

## 4. Công thức prompt đặc thù
```
[HÌNH] Chinese-style anime scene of <chủ thể + hành động>, <bối cảnh sơn thủy scene_context>,
<cỡ cảnh>, generous negative space, ink-wash misty layers, <palette nhã + 1 nhấn kim/chu>, elegant brush texture
[STYLE] Chinese-style anime, cel-shaded, ink-wash accents  ← NGẮN
[CAMERA] <slow vertical pan / static thiền>
```
- Nhân vật tái dùng: @tag + "identical character design, consistent oriental styling".
- Video: mực loang, sương trôi, y phục + tóc bay chậm — giữ nhịp thiền.

## 5. Cạm bẫy
- ❌ Nhồi kín khung, mất lưu bạch → phá thẩm mỹ thủy mặc.
- ❌ Spotlight gắt/ánh sáng phương Tây → mất chất tán mềm phương Đông.
- ❌ CGI/gradient số → mất brush texture.
- ❌ STYLE chứa triều đại cụ thể → sai phân tầng (era ở scene_context).
