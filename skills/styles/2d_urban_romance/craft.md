---
name: Craft dựng cảnh · 2D ngôn tình đô thị
description: Công thức bố cục/shot/ánh sáng/prompt cho anime ngôn tình đô thị — cel-shade điện ảnh, low-key kịch tính, cảm xúc chín.
axis: art
---

# CRAFT ART · 2D urban romance (cel-shade điện ảnh)

> Rút khi dựng shot/prompt cho style `2d_urban_romance`. Bổ trợ `anchor.md` (cel-shade, low-key, khí chất trưởng thành). File này dạy CÁCH DỰNG CẢNH. KHÔNG khóa thời đại/trang phục.

## 1. Nguyên tắc bố cục theo chất liệu
- **Ánh sáng kịch tính low-key kể cảm xúc.** Style này sống bằng tương phản sáng-tối mạnh: nửa mặt trong tối, viền sáng từ đèn phố/cửa sổ. Bố cục để vùng tối chiếm diện tích lớn (nén cảm xúc).
- **Khoảng cách 2 nhân vật = kịch bản.** Ngôn tình đọc bằng blocking: gần/xa, quay lưng/đối mặt, tay chạm/không chạm. Dựng khung nói lên quan hệ.
- **Đô thị làm nền tâm trạng.** Đèn neon nhòe, cửa kính phản chiếu, mưa — nền là "nhân vật thứ 3". Dùng bokeh vẽ tay tách chủ thể.

## 2. Bảng shot ưu tiên
| Cỡ cảnh | Dùng khi | Lưu ý ngôn tình |
|---|---|---|
| Medium 2-shot | quan hệ, đối thoại | khoảng cách + hướng mặt nói lên tình cảm |
| Close nửa mặt low-key | nội tâm, giằng xé | nửa tối, viền sáng, mắt ẩn cảm xúc |
| Over-shoulder | căng thẳng/thân mật | nền đô thị bokeh, DOF vẽ tay |
| Wide đô thị đêm | cô đơn, chuyển tâm trạng | nhân vật nhỏ giữa phố đèn |

- **Chuyển động máy:** `slow push nén cảm xúc`, `rack-focus vẽ tay giữa 2 người`, `static giữ im lặng`. Video: "subtle breathing, eye shift, city light flicker, rain".

## 3. Ánh sáng · màu · texture
- **Low-key điện ảnh là linh hồn.** `dramatic low-key cinematic lighting, film-grade shading` (anchor). 1 nguồn chính lệch + rìm; vùng tối giữ chi tiết mờ, không bệt đen chết.
- **Palette lạnh trầm + 1 điểm ấm.** Bám anchor (da lạnh #F5EDE8, xanh nhạt #B8D4E3, hồng khói #F2D7D5…). Ấm (đèn phố) chỉ dùng làm điểm nhấn cảm xúc.
- **Texture:** cel-shading mịn + chút film-grade grain rất nhẹ cho phép. Cấm màu rực trẻ con, cấm chibi.

## 4. Công thức prompt đặc thù
```
[HÌNH] mature urban romance anime scene of <chủ thể + quan hệ/hành động>, <bối cảnh đô thị scene_context>,
<cỡ cảnh + blocking>, dramatic low-key lighting, rim light, <palette lạnh trầm + 1 điểm ấm>, hand-drawn bokeh
[STYLE] mature urban romance anime, cel-shaded, cinematic low-key  ← NGẮN
[CAMERA] <slow push / over-shoulder / static>
```
- Nhân vật tái dùng: @tag + "identical character design, consistent mature anime styling".
- Video: hơi thở, ánh mắt đảo, đèn phố nhấp nháy, mưa rơi — giữ tĩnh giàu cảm xúc.

## 5. Cạm bẫy
- ❌ Ánh sáng phẳng đều sáng → mất kịch tính, thành slice-of-life thường.
- ❌ Palette rực/tươi trẻ con hoặc chibi → sai khí chất trưởng thành.
- ❌ Bệt đen chết vùng tối → mất chi tiết điện ảnh.
- ❌ STYLE chứa era/trang phục → sai phân tầng.
