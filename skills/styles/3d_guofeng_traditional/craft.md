---
name: Craft dựng cảnh · 3D quốc phong truyền thống
description: Công thức bố cục/shot/ánh sáng/prompt cho 3D quốc phong PBR — ánh sáng thể tích, hoa văn tinh xảo, khí chất trang nhã.
axis: art
---

# CRAFT ART · 3D guofeng traditional (PBR trang nhã)

> Rút khi dựng shot/prompt cho style `3d_guofeng_traditional`. Bổ trợ `anchor.md` (3D PBR, volumetric light, ambient occlusion, hoa văn Đông). File này dạy CÁCH DỰNG CẢNH cổ điển hoành tráng. KHÔNG khóa thời đại.

## 1. Nguyên tắc bố cục theo chất liệu
- **Trang nghiêm, đối xứng kiến trúc.** Thẩm mỹ cung đình/sơn thủy: bố cục cân đối, trục trung tâm, kiến trúc mái cong dẫn phối cảnh. Khoe sự tinh xảo hoa văn.
- **Chiều sâu bằng ánh sáng thể tích.** `volumetric light` (anchor): tia sáng xuyên sương/khói/rèm tạo lớp không gian. Ambient occlusion cho khe kẽ chi tiết chân thực.
- **Chất liệu quý làm điểm nhấn.** Ngọc, lụa, gỗ chạm, đồng — đặt gần camera để khoe PBR. Vật liệu kể "đẳng cấp" nhân vật.

## 2. Bảng shot ưu tiên
| Cỡ cảnh | Dùng khi | Lưu ý quốc phong |
|---|---|---|
| Wide kiến trúc | mở cảnh hoành tráng | đối xứng, tia sáng thể tích xuyên |
| Medium trang nhã | nhịp kể chính | nhân vật + y phục lụa PBR, AO rõ |
| Close chất liệu quý | nhấn đẳng cấp/vật | ngọc/lụa/chạm khắc chi tiết cao |
| Slow crane/orbit | khoe không gian | tận dụng 3D, dẫn mắt qua kiến trúc |

- **Chuyển động máy:** `slow crane khoe cung điện`, `dolly trang nghiêm`, `orbit chậm quanh vật quý`. Video: "volumetric light rays drifting, silk and banner flowing, incense smoke rising, slow majestic camera".

## 3. Ánh sáng · màu · texture
- **Volumetric + ambient occlusion là cốt.** `volumetric light, ambient occlusion` (anchor). Ánh xuyên khe/rèm/sương; bóng mềm chi tiết. Ánh vàng ấm cung đình hoặc trăng lạnh thanh nhã.
- **Palette trang nhã.** Bám anchor (nguyệt bạch #E0E8F0, thanh lục #4A8C7E, chu hồng #B22222, kim hoàng #D4AF37…). Kim hoàng nhấn quyền quý; giữ sắc độ tinh tế.
- **Texture:** PBR cao cấp (lụa mờ, ngọc trong, gỗ chạm). Cấm plastic look, cấm low-poly, cấm flat 2D.

## 4. Công thức prompt đặc thù
```
[HÌNH] Chinese-style 3D scene of <chủ thể + hành động>, <bối cảnh cung đình/sơn thủy scene_context>,
<cỡ cảnh, đối xứng>, volumetric light rays, ambient occlusion, ornate oriental detail, PBR silk and jade, <palette trang nhã + nhấn kim>
[STYLE] Chinese-style high-precision 3D render, volumetric light, PBR  ← NGẮN
[CAMERA] <slow crane / dolly trang nghiêm / orbit chậm>
```
- Nhân vật tái dùng: @tag + "identical 3D character model, consistent ornate oriental design".
- Video: tia sáng thể tích trôi, lụa/cờ bay, khói hương lên + camera hoành tráng chậm.

## 5. Cạm bẫy
- ❌ Thiếu volumetric/AO → mất chiều sâu điện ảnh, thành 3D phẳng.
- ❌ Plastic/low-poly → mất đẳng cấp chất liệu quý.
- ❌ Bố cục lộn xộn, phá đối xứng → mất khí chất trang nghiêm.
- ❌ STYLE chứa triều đại cụ thể → sai phân tầng (era ở scene_context).
