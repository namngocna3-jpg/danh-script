---
name: Craft dựng cảnh · Màu nước kể chuyện
description: Công thức bố cục/shot/ánh sáng/prompt cho watercolor storybook — loang mềm, viền ẩm, giấy thô, cảm giác lật trang sách.
axis: art
---

# CRAFT ART · 2d_watercolor_storybook (màu nước kể chuyện)

> Rút khi dựng shot/prompt cho style `2d_watercolor_storybook`. Bổ trợ `anchor.md` (loang ướt, giấy thô, viền ẩm). File này dạy CÁCH DỰNG CẢNH kiểu tranh minh họa sách thiếu nhi. KHÔNG chứa thời đại/trang phục (đó là scene_context lớp B).

## 1. Nguyên tắc bố cục theo chất liệu
- **Khung như một trang sách tranh.** Mỗi cảnh đọc trong 1 nhịp — chủ thể rõ, nền để "thở" bằng khoảng trắng giấy (negative space rộng, viền loang nhạt dần ra rìa). Đừng lấp kín khung.
- **Mềm, không sắc.** Không cạnh vector cứng. Tách chủ thể bằng đậm-nhạt của sắc nước + viền ẩm (wet edge), KHÔNG bằng đường contour đen dày.
- **Bố cục ấm, hiền.** Ưa eye-level ngang tầm nhân vật, cân đối nhẹ hoặc lệch 1/3 mềm. Tránh góc nghiêng gắt, tránh phối cảnh sâu hun hút (mất chất phẳng-ấm của tranh giấy).

## 2. Bảng shot ưu tiên (hợp chất liệu màu nước)
| Cỡ cảnh | Dùng khi | Lưu ý màu nước |
|---|---|---|
| Wide loang nền | mở cảnh, tả không gian | nền = mảng loang lớn nhạt dần, ít chi tiết |
| Medium 1 chủ thể | nhịp kể chính | chủ thể ~40% khung, viền ẩm tách nền mềm |
| Close cảm xúc | nhấn tình cảm | phóng gương mặt/bàn tay, giữ nét vẽ tay run nhẹ |
| Insert vật nhỏ | chi tiết ấm (tách trà, lá, thư) | 1 vật trên nền giấy trắng, loang bóng nhẹ |

- **Chuyển động máy:** ưu tiên `static`, `pan ngang chậm`, `push thẳng rất chậm` như lật trang. TRÁNH orbit 3D / dolly cong (chất giấy phẳng lộ giả khi xoay chiều sâu).

## 3. Ánh sáng · màu · texture
- **Ánh sáng = sắc độ nước, không phải nguồn cứng.** Không tả "spotlight gắt"; thay bằng "ánh nắng ấm loang qua giấy", vùng sáng = giấy chừa trắng, vùng tối = lớp nước chồng đậm hơn. Từ khóa: `soft diffused light, warm glow, paper-white highlights`.
- **Màu trong, để thở.** Bám palette anchor (xanh phấn #A8C7D8, vàng bơ #F3E1B0, hồng đào #F4C9C0…). Mỗi cảnh 2–3 màu chủ đạo pha loãng; Color Script điều tiết cảm xúc bằng ĐỘ TRONG/ĐỤC của nước, không bằng đèn.
- **Texture = giấy + loang.** Bắt buộc: `visible paper grain, wet-on-wet bleed, soft granulation`. Cho phép viền loang, vệt cọ hữu cơ. Cấm gradient số mịn, cấm khối màu bệt phẳng, cấm bề mặt CGI trơn.

## 4. Công thức prompt đặc thù (đoạn Hình dài nhất, Style ngắn nhất)
```
[HÌNH] hand-painted watercolor illustration of <chủ thể + hành động cụ thể>, <bối cảnh scene_context>,
composition <bố cục mềm + khoảng trắng giấy>, <2–3 màu nước chủ đạo> palette, soft wet edges, tender storybook mood
[STYLE] watercolor storybook, wet-on-wet bleed, paper grain  ← NGẮN, không chứa era
[CAMERA] <cỡ cảnh + chuyển động phẳng chậm>
```
- Nhân vật tái dùng: nhúng @tag + "identical watercolor character design, same soft palette across the take".
- Video (image-to-video): chỉ tả THAY ĐỔI mềm (màu nước loang thêm, ánh sáng ấm lay nhẹ, lật trang cut mềm), KHÔNG tả xoay chiều sâu 3D.

## 5. Cạm bẫy (style này hay hỏng)
- ❌ Viền contour đen dày / cạnh vector cứng → thành flat/anime, mất chất nước.
- ❌ Khối màu bệt phẳng, gradient số mịn → mất loang và giấy thô.
- ❌ Nhồi chi tiết vụn kín khung → mất khoảng trắng "thở" đặc trưng sách tranh.
- ❌ Orbit/xoay 3D chủ thể → lộ ra giấy phẳng, phá ảo giác tranh vẽ tay.
- ❌ Để đoạn STYLE chứa thời đại/trang phục → sai phân tầng (era ở scene_context).
