---
name: Craft dựng cảnh · Đất sét stop-motion
description: Công thức bố cục/shot/ánh sáng/prompt cho clay stop-motion — vân tay, set thu nhỏ, DOF nông, nhịp giật đặc trưng.
axis: art
---

# CRAFT ART · 3D clay stop-motion (đất sét)

> Rút khi dựng shot/prompt cho style `3d_clay_stopmotion`. Bổ trợ `anchor.md` (đất sét vân tay, set miniature, DOF nông). File này dạy CÁCH DỰNG CẢNH kiểu phim búp bê. KHÔNG chứa thời đại/trang phục.

## 1. Nguyên tắc bố cục theo chất liệu
- **Cảm giác "set thu nhỏ" (miniature).** Mọi thứ như mô hình bàn tay nặn: tỉ lệ hơi mập, bo tròn, không sắc cạnh. Dựng khung như đang quay một sân khấu tí hon có chiều sâu thật.
- **DOF nông tô-tilt-shift.** Đặc sản stop-motion: nền mờ nhanh làm cảnh trông "bé xíu đáng yêu". Chủ thể nét, hậu cảnh nhòe mượt.
- **Bố cục chính diện, ấm cúng.** Ưa eye-level ngang tầm búp bê, bố cục cân, ánh đèn sân khấu ôm chủ thể.

## 2. Bảng shot ưu tiên
| Cỡ cảnh | Dùng khi | Lưu ý clay |
|---|---|---|
| Medium eye-level | nhịp kể chính | ngang tầm búp bê, vân tay đất sét rõ |
| Macro chất liệu | khoe vân tay, đáng yêu | close bề mặt nặn tay, dấu ngón |
| Wide set thu nhỏ | mở "sân khấu" | thấy rìa set, đạo cụ thủ công |
| Insert đạo cụ nặn | vật nhỏ | đồ vật đất sét bo tròn |

- **Chuyển động máy:** giữ nhịp GIẬT nhẹ đặc trưng stop-motion (không mượt). `static`, `step-pan`, `slow push` với "subtle stop-motion jitter". Video: "stop-motion frame-stepped movement, slight jitter, handcrafted motion".

## 3. Ánh sáng · màu · texture
- **Ánh đèn sân khấu ấm, phân lớp.** `soft warm lighting layers` (anchor). Đèn tập trung như phim búp bê studio; bóng đổ mềm, ấm.
- **Palette kem ấm.** Bám anchor (vàng kem #F5E6D0, đỏ đất nung #C96E5A…). Màu như đất sét thật — hơi đục, ấm, không rực số.
- **Texture:** VÂN TAY + dấu ngón là bắt buộc (`visible fingerprint marks`). Bề mặt hơi bóng dầu nhẹ của plasticine. Cấm bề mặt CGI nhựa trơn, cấm sắc cạnh số.

## 4. Công thức prompt đặc thù
```
[HÌNH] claymation stop-motion scene of <chủ thể + hành động>, <bối cảnh set thu nhỏ scene_context>,
<cỡ cảnh>, visible fingerprint clay texture, shallow depth of field, warm studio light, <palette kem ấm>
[STYLE] stop-motion claymation, handcrafted clay, fingerprint marks  ← NGẮN
[CAMERA] <static / slow push với subtle jitter>
```
- Nhân vật tái dùng: @tag + "identical clay puppet design, same handcrafted texture".
- Video: nhấn "frame-stepped, slight stop-motion jitter" — KHÔNG mượt như CGI.

## 5. Cạm bẫy
- ❌ Bề mặt trơn bóng, mất vân tay → thành CGI thường, không còn đất sét.
- ❌ Chuyển động mượt 60fps → phá nhịp giật stop-motion đặc trưng.
- ❌ Màu rực số, sắc cạnh → mất chất thủ công ấm.
- ❌ STYLE chứa era/trang phục → sai phân tầng.
