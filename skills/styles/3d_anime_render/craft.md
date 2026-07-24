---
name: Craft dựng cảnh · 3D anime render
description: Công thức bố cục/shot/ánh sáng/prompt cho 3D anime cel-look chữa lành — viền rõ, ánh ấm mềm, chất liệu chi tiết.
axis: art
---

# CRAFT ART · 3D anime render (cel-look chữa lành)

> Rút khi dựng shot/prompt cho style `3d_anime_render`. Bổ trợ `anchor.md` (3D cel-look, outline rõ, ánh ấm mềm). File này dạy CÁCH DỰNG CẢNH tận dụng chiều sâu 3D. KHÔNG chứa thời đại/trang phục.

## 1. Nguyên tắc bố cục theo chất liệu
- **Được phép chiều sâu thật.** Khác 2D — 3D render có DOF, parallax, camera bay. Dựng cảnh khoe chiều sâu: tiền cảnh có vật (lá, cốc, khung cửa) tạo lớp, hậu cảnh bokeh thật.
- **Chất liệu là điểm mạnh.** `high-detail materials` (anchor): vải, gỗ, gốm, kim loại phản xạ mềm. Đặt vật gần camera để khoe chất chữa lành, ấm cúng.
- **Bố cục ấm cúng, an toàn.** Style "healing" → khung gọn gàng, cân đối, ánh sáng ôm chủ thể; tránh góc gắt/bất an.

## 2. Bảng shot ưu tiên
| Cỡ cảnh | Dùng khi | Lưu ý 3D cel |
|---|---|---|
| Medium DOF nông | nhịp kể chính | chủ thể nét, nền bokeh ấm |
| Insert chất liệu | khoe vật/không khí | close vật (trà, sách), chất liệu rõ |
| Slow dolly/orbit nhẹ | mở không gian ấm | tận dụng parallax 3D (được phép!) |
| Wide ánh vàng | estab chữa lành | ánh xuyên cửa sổ, bụi sáng bay |

- **Chuyển động máy:** 3D CHO PHÉP `slow orbit`, `dolly-in`, `crane nhẹ` — dùng để tạo ấm áp, KHÔNG hành động gắt. Video: "gentle camera drift, dust motes floating, soft idle motion".

## 3. Ánh sáng · màu · texture
- **Ánh ấm mềm điện ảnh + rìm.** `soft warm cinematic lighting` (anchor). Golden hour, ánh xuyên rèm, ambient bounce ấm. Giữ outline cel rõ để không rơi vào photoreal.
- **Palette ấm chữa lành.** Bám anchor (cam ấm #F5A673, hồng anh đào #F4D5D5…). Color Script giữ ấm, chỉ hạ nhẹ khi trầm.
- **Texture:** vật liệu chi tiết + shading stylized. Cấm da nhựa bóng (plastic skin), cấm phẳng hoàn toàn kiểu 2D.

## 4. Công thức prompt đặc thù
```
[HÌNH] 3D anime cel-render scene of <chủ thể + hành động>, <bối cảnh ấm cúng scene_context>,
<cỡ cảnh>, shallow depth of field, warm rim light, detailed materials, <palette ấm>, clean outline
[STYLE] 3D anime cel-look render, clear outlines, stylized shading  ← NGẮN
[CAMERA] <slow orbit / dolly-in / static ấm>
```
- Nhân vật tái dùng: @tag + "identical 3D character model, same cel outline styling".
- Video: được phép orbit/dolly nhẹ + hạt bụi sáng bay + idle mềm.

## 5. Cạm bẫy
- ❌ Da nhựa bóng, mất outline → rơi vào 3D generic/photoreal.
- ❌ Phẳng hoàn toàn như 2D → phí thế mạnh chiều sâu 3D.
- ❌ Ánh lạnh gắt/hành động mạnh → mất khí chất "chữa lành".
- ❌ STYLE chứa era/trang phục → sai phân tầng.
