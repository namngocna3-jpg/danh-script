---
name: Craft dựng cảnh · Người thật tài liệu
description: Công thức bố cục/shot/ánh sáng/prompt cho người thật lối tài liệu — máy cầm tay, ánh sáng có sẵn, chân thực đời thường.
axis: art
---

# CRAFT ART · realpeople documentary (tài liệu chân thực)

> Rút khi dựng shot/prompt cho style `realpeople_documentary`. Bổ trợ `anchor.md` (handheld, ánh sáng tự nhiên, lỗ chân lông, đời thường). File này dạy CÁCH DỰNG CẢNH kiểu phim tài liệu. KHÔNG chứa thời đại/trang phục.

## 1. Nguyên tắc bố cục theo chất liệu
- **"Bắt được" chứ không "dàn dựng".** Thẩm mỹ tài liệu: khung như vô tình bắt gặp khoảnh khắc thật — hơi lệch, có thể vướng tiền cảnh, không hoàn hảo studio. Đó là điểm mạnh.
- **Máy cầm tay thở.** `handheld camera breathing motion` (anchor): khung rung nhẹ tự nhiên, reframe theo chủ thể như người quay đang bám theo.
- **Bối cảnh thật, bừa có chủ đích.** Không gian sống có đồ đạc đời thường, dấu vết sử dụng — kể sự thật về nhân vật.

## 2. Bảng shot ưu tiên
| Cỡ cảnh | Dùng khi | Lưu ý tài liệu |
|---|---|---|
| Handheld medium | nhịp kể chính | khung thở nhẹ, reframe theo chủ thể |
| Observational wide | quan sát bối cảnh | thấy môi trường thật, nhân vật trong đời sống |
| Close vội | cảm xúc bắt được | hơi mất nét thoáng qua rồi lấy lại — chân thực |
| Verité follow | theo hành động | máy bám lưng/bên hông nhân vật |

- **Chuyển động máy:** `handheld follow`, `whip-pan tìm chủ thể`, `search-and-settle focus`. Video: "handheld breathing, natural reframe, available light flicker, unstaged motion".

## 3. Ánh sáng · màu · texture
- **Ánh sáng CÓ SẴN, không dàn đèn.** `available natural light` (anchor): cửa sổ, đèn trần, đèn phố — chấp nhận vùng cháy/vùng tối như đời thực. KHÔNG three-point studio hoàn hảo.
- **Màu tự nhiên, ít grade.** Giữ nhiệt độ nguồn sáng thật (đèn vàng ám vàng, ngày ám lạnh). Color Script chỉ nhấn nhẹ, tránh grade phim quá bóng bẩy.
- **Texture:** lỗ chân lông, vải nhăn, ma sát, bụi — `visible skin pores, fabric drape`. Cho phép noise ISO cao chỗ thiếu sáng. Cấm da nhựa, cấm bóng bẩy quá mức (over-polished).

## 4. Công thức prompt đặc thù
```
[HÌNH] photorealistic documentary <cỡ cảnh> of <chủ thể + hành động đời thường>, <bối cảnh thật scene_context>,
handheld framing, available natural light, visible skin pores, unstaged lived-in realism
[STYLE] photorealistic documentary, handheld, natural light  ← NGẮN
[CAMERA] <handheld follow / observational wide / search-and-settle>
```
- Nhân vật tái dùng: @tag + "identical person, consistent natural appearance".
- Video: máy thở, reframe tự nhiên, ánh sáng có sẵn lay động, chuyển động không dàn dựng.

## 5. Cạm bẫy
- ❌ Đèn studio ba điểm hoàn hảo / bóng bẩy → mất chất "bắt được" tài liệu.
- ❌ Khung cân đối tĩnh như quảng cáo → mất verité.
- ❌ Da nhựa, grade quá bóng → phản chân thực.
- ❌ STYLE chứa era/trang phục → sai phân tầng.
