---
name: Craft dựng cảnh · Hoạt hình 3D bo tròn
description: Công thức bố cục/shot/ánh sáng/prompt cho Pixar-style cartoon — khối bo tròn, đèn studio ấm, biểu cảm phóng đại, hợp mascot/TVC vui.
axis: art
---

# CRAFT ART · 3d_pixar_cartoon (hoạt hình 3D bo tròn)

> Rút khi dựng shot/prompt cho style `3d_pixar_cartoon`. Bổ trợ `anchor.md` (khối bo tròn, da nhựa dịu, mắt to, đèn studio ấm). File này dạy CÁCH DỰNG CẢNH kiểu phim hoạt hình quảng cáo. KHÔNG chứa thời đại/trang phục (đó là scene_context lớp B).

## 1. Nguyên tắc bố cục theo chất liệu
- **Nhân vật là trung tâm cảm xúc.** Style này sống bằng biểu cảm phóng đại (appeal): dựng khung ưu tiên khoe mặt + ngôn ngữ cơ thể rõ. Chủ thể chiếm khung lớn, tư thế cong mềm (line of action), tránh đứng đơ.
- **Chiều sâu thật + DOF điện ảnh.** Khác flat/anime: có phối cảnh 3D thật, hậu cảnh nhòe mềm tách chủ thể. Dùng góc máy điện ảnh (hero low-angle cho oai, high-angle cho đáng thương).
- **Sạch, đọc nhanh.** Silhouette rõ, ít vật thừa. Nền gợi ý bằng vài khối lớn bo tròn, không nhồi chi tiết vụn — mắt phải bắt ngay chủ thể.

## 2. Bảng shot ưu tiên (hợp chất liệu CGI cartoon)
| Cỡ cảnh | Dùng khi | Lưu ý cartoon |
|---|---|---|
| Medium hero | nhịp kể chính | tư thế cong mềm, biểu cảm rõ, DOF tách nền |
| Close reaction | nhấn cảm xúc | mắt to long lanh, chân mày/miệng phóng đại |
| Wide thiết lập | mở không gian | khối nền bo tròn lớn, ánh đèn ấm ôm cảnh |
| Insert đạo cụ/sản phẩm | khoe vật (TVC) | vật CGI bóng dịu, highlight mềm, bo góc |

- **Chuyển động máy:** cho phép `slow push`, `arc/orbit nhẹ`, `crane lên/xuống` — chất 3D thật nên xoay chiều sâu ĐẸP (khác flat). Video: "smooth cinematic camera move, gentle depth parallax, bouncy character motion".

## 3. Ánh sáng · màu · texture
- **Đèn studio điện ảnh ấm.** `warm key light + soft fill + rim light` (three-point mềm). Có bóng đổ mượt, có highlight bóng dịu trên da/vật. Từ khóa: `soft cinematic studio lighting, warm rim light, gentle bounce`.
- **Màu bắt mắt, thân thiện.** Bám palette anchor (cam nắng #F5A623, xanh trời #4A90D9…). Bão hòa vừa phải; Color Script nhấn cảm xúc bằng nhiệt độ đèn (ấm=vui, xanh lạnh=buồn/đêm) — style này CÓ đèn nên tận dụng.
- **Texture:** da subsurface mềm mịn (KHÔNG lỗ chân lông thật), vải có nếp gấp bo tròn, vật liệu bóng dịu. Cấm da photoreal, cấm bề mặt nhựa đồ chơi cứng, cấm cel-shade phẳng.

## 4. Công thức prompt đặc thù
```
[HÌNH] stylized 3d cartoon render of <chủ thể + hành động + biểu cảm>, <bối cảnh scene_context>,
<cỡ cảnh + góc hero>, appealing rounded design, soft subsurface skin, warm studio lighting, shallow depth of field, <palette bắt mắt>
[STYLE] pixar-like 3d cartoon, rounded shapes, warm cinematic light  ← NGẮN, không chứa era
[CAMERA] <slow push / gentle arc / crane>
```
- Nhân vật tái dùng: @tag + "identical 3d character design, same proportions and shading across the take".
- Video (image-to-video): tả chuyển động nảy mềm (squash & stretch nhẹ), máy lướt có chiều sâu, biểu cảm biến đổi — tận dụng chất 3D thật.

## 5. Cạm bẫy (style này hay hỏng)
- ❌ Da lỗ chân lông photoreal → rơi vào uncanny valley, mất "appeal" hoạt hình.
- ❌ Cel-shade phẳng / line 2D → thành anime, không còn CGI bo tròn.
- ❌ Tư thế đứng đơ, mặt vô cảm → mất linh hồn cartoon (phải phóng đại biểu cảm).
- ❌ Nhồi chi tiết vụn, nền rối → mất silhouette đọc-nhanh.
- ❌ Để đoạn STYLE chứa thời đại/trang phục → sai phân tầng (era ở scene_context).
