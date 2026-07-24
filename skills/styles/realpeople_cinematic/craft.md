---
name: Craft dựng cảnh · Người thật điện ảnh
description: Công thức bố cục/shot/ánh sáng/prompt cho người thật photoreal điện ảnh — DOF nông, đèn 3 điểm, color grading phim.
axis: art
---

# CRAFT ART · realpeople cinematic (photoreal điện ảnh)

> Rút khi dựng shot/prompt cho style `realpeople_cinematic`. Bổ trợ `anchor.md` (photoreal, cinematic lighting, DOF nông, da thật). File này dạy CÁCH DỰNG CẢNH điện ảnh. KHÔNG chứa thời đại/trang phục.

## 1. Nguyên tắc bố cục theo chất liệu
- **Ngôn ngữ điện ảnh thật.** Có DOF, bokeh, tiêu cự ống kính → dựng như quay phim: chọn tiêu cự (35mm rộng-tự nhiên / 50mm chân dung / 85mm nén nền), tách chủ thể bằng khẩu độ mở.
- **Bố cục 1/3 + đường dẫn.** Đặt mắt chủ thể trên đường 1/3 trên; dùng leading lines, framing (khung trong khung) khoe chiều sâu thật.
- **Blocking + eyeline chuẩn.** Nhân vật nhìn đúng hướng, để khoảng nhìn (nose room). Quan hệ nhân vật kể qua vị trí trong khung.

## 2. Bảng shot ưu tiên
| Cỡ cảnh | Dùng khi | Lưu ý điện ảnh |
|---|---|---|
| Establishing wide | mở không gian | bối cảnh + nhân vật nhỏ, chiều sâu lớp |
| Medium 50mm | hội thoại, nhịp chính | DOF vừa, nền bokeh nhẹ tách chủ thể |
| Close-up 85mm | cảm xúc đỉnh | nền nhòe mạnh, mắt nét, da chất thật |
| OTS 2 người | căng thẳng/quan hệ | rack-focus giữa 2 người |

- **Chuyển động máy:** `dolly-in nén cảm xúc`, `slow push`, `handheld nhẹ khi thật`, `crane estab`. Video: "cinematic shallow DOF, subtle rack focus, natural micro-expression, breathing".

## 3. Ánh sáng · màu · texture
- **Đèn điện ảnh có ý đồ.** Three-point (key/fill/rim) hoặc motivated light (từ cửa sổ/đèn thực). Tỉ lệ sáng-tối kể tâm trạng: high-key vui, low-key căng. `cinematic lighting` (anchor).
- **Color grading phim.** Nhiệt độ trung tính 5200–6000K nền tảng; Color Script lệch ấm/lạnh theo cảm xúc. Giữ da chất thật, không bệt.
- **Texture:** lỗ chân lông, tơ vải, phản xạ mắt — `natural skin texture, 8K`. Cấm da nhựa CGI, cấm nét vẽ/anime.

## 4. Công thức prompt đặc thù
```
[HÌNH] photorealistic <cỡ cảnh, tiêu cự> of <chủ thể + hành động/biểu cảm>, <bối cảnh scene_context>,
cinematic <three-point/motivated> lighting, shallow depth of field, natural skin texture, film color grading
[STYLE] photorealistic, cinematic, 8K, film-grade color  ← NGẮN
[CAMERA] <dolly-in / slow push / 85mm close>
```
- Nhân vật tái dùng: @tag + "identical actor, consistent facial identity across the take".
- Video: micro-expression, hơi thở, rack-focus tinh tế — giữ chân thực điện ảnh.

## 5. Cạm bẫy
- ❌ Da nhựa bóng / nét minh họa → rơi khỏi photoreal.
- ❌ Ánh sáng phẳng vô ý đồ → mất chất điện ảnh (thành ảnh chụp nghiệp dư).
- ❌ Mọi thứ nét căng (thiếu DOF) → mất ngôn ngữ ống kính.
- ❌ STYLE chứa era/trang phục → sai phân tầng.
