---
name: Craft dựng cảnh · 2D Japanese anime
description: Công thức bố cục/shot/ánh sáng/prompt cho anime 2D Nhật hiện đại — cel-shading 2 lớp, nét sạch, mắt biểu cảm.
axis: art
---

# CRAFT ART · 2D Japanese anime (cel hiện đại)

> Rút khi dựng shot/prompt cho style `2d_japanese_anime`. Bổ trợ `anchor.md` (cel-shading, nét sạch, mắt biểu cảm). File này dạy CÁCH DỰNG CẢNH. KHÔNG chứa thời đại/trang phục.

## 1. Nguyên tắc bố cục theo chất liệu
- **Biểu cảm gương mặt là trung tâm.** Anime hiện đại đọc cảm xúc qua mắt + miệng + đường lông mày. Ưu tiên khung thấy rõ mặt; close mắt khi cao trào.
- **Nét sạch → bố cục gọn.** Ít vật thể rác trong khung, đường dẫn mắt rõ. Nền có thể chi tiết hơn 90s nhưng vẫn phục vụ chủ thể.
- **Speed-line & focus-line khi động.** Đặc sản anime: cảnh gắng sức/bất ngờ dùng đường tốc độ hội tụ về chủ thể (radial/horizontal speed lines).

## 2. Bảng shot ưu tiên
| Cỡ cảnh | Dùng khi | Lưu ý anime |
|---|---|---|
| Medium biểu cảm | nhịp kể chính | mặt rõ, cel 2 lớp sáng-tối |
| Close mắt | cao trào cảm xúc | highlight mắt, phản chiếu trong tròng |
| Dynamic low/high angle | hành động, kịch tính | speed lines hội tụ chủ thể |
| Wide lớp nền | chuyển bối cảnh | background chi tiết vừa, chủ thể tách bằng viền |

- **Chuyển động máy:** `push nhấn cảm xúc`, `whip-pan khi bất ngờ`, `static cho hội thoại`. Video: "expressive idle, blink, subtle head tilt, hair sway".

## 3. Ánh sáng · màu · texture
- **Cel-shading 2 lớp là luật.** Sáng-tối phân mảng rõ (không gradient nhiều bước). Rìm sáng viền + 1 nguồn chính. Từ khóa anchor: `soft anime shading`.
- **Màu tươi cân bằng.** Không đục như 90s, không rực như flat. Color Script chỉnh nhiệt độ + độ tương phản theo cảm xúc.
- **Texture:** da mịn phẳng, KHÔNG grain (khác 90s), KHÔNG lỗ chân lông. Cấm CGI nhựa.

## 4. Công thức prompt đặc thù
```
[HÌNH] 2D anime scene of <chủ thể + hành động/biểu cảm>, <bối cảnh scene_context>,
<cỡ cảnh>, expressive eyes, two-tone cel shading, <2–3 màu chủ đạo>, clean sharp lineart
[STYLE] 2D Japanese anime, cel-shaded, clean line art  ← NGẮN
[CAMERA] <push / static / dynamic angle + speed lines nếu động>
```
- Nhân vật tái dùng: @tag + "identical anime character design, same eye and hair style".
- Video: idle biểu cảm + tóc bay; hành động mạnh thêm "speed lines, impact frame".

## 5. Cạm bẫy
- ❌ Gradient nhiều bước / da nhựa CGI → mất chất cel.
- ❌ Màu đục hoài niệm → nhầm sang 90s (sai style).
- ❌ Mắt vô hồn, thiếu highlight → mất linh hồn anime.
- ❌ STYLE chứa era/trang phục → sai phân tầng.
