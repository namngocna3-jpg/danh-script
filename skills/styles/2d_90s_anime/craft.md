---
name: Craft dựng cảnh · 2D 90s anime
description: Công thức bố cục/shot/ánh sáng/prompt cho anime vẽ tay kiểu 90s — cel tô phẳng, grain hoài niệm, key visual tĩnh.
axis: art
---

# CRAFT ART · 2D 90s anime (retro cel)

> Rút khi dựng shot/prompt cho style `2d_90s_anime`. Bổ trợ `anchor.md` (chất liệu cel + grain). File này dạy CÁCH DỰNG CẢNH hợp chất liệu vẽ tay 90s. KHÔNG chứa thời đại/trang phục (ở scene_context).

## 1. Nguyên tắc bố cục theo chất liệu
- **Khung "key visual" hơn khung động.** 90s anime đẹp nhất ở pose tĩnh giàu cảm xúc (nhân vật dừng, gió thổi tóc, mắt ngân nước). Dựng như 1 tấm cel treo, không như video 60fps.
- **Chiều sâu bằng lớp cel, không bằng DOF thật.** Foreground nét đậm — mid nhân vật — background vẽ mờ hơn (mất chi tiết, tông nhạt). Đây là "book layers" cổ điển.
- **Chừa khoảng trời/khoảng trống trên đầu** cho cảm giác hoài niệm, tĩnh lặng. Bố cục 1/3 cổ điển, ít Dutch angle.

## 2. Bảng shot ưu tiên
| Cỡ cảnh | Dùng khi | Lưu ý retro |
|---|---|---|
| Wide bầu trời | mở cảnh, hoài niệm | trời chiếm nửa khung, mây vẽ tay khối |
| Medium eye-level | đối thoại, cảm xúc | pose tĩnh, tóc/áo bắt gió |
| Close mắt long lanh | nhấn cảm xúc đỉnh | highlight mắt hình sao/đốm, má ửng |
| Emotive over-shoulder | căng thẳng 2 người | nền bokeh vẽ tay (không DOF số) |

- **Chuyển động máy:** `slow pan`, `slow push`, `static hold có gió`. TRÁNH camera nhanh/lia gắt — lộ ít frame kiểu số. Video: ưu tiên "subtle idle motion, hair and cloth drift, blinking".

## 3. Ánh sáng · màu · texture
- **Ánh sáng ấm mềm điện ảnh + grain phim.** Giữ `soft warm cinematic lighting, retro film grain` từ anchor. Rìm sáng viền tóc/vai là dấu hiệu 90s.
- **Bảng màu đục ấm hoài niệm.** Bám palette anchor (vàng ấm #F5E6D0, hồng anh đào #F4D5D5…). Color Script hạ bão hòa khi buồn, KHÔNG chuyển sang xám lạnh số.
- **Texture:** grain phim nhẹ + cel banding cho phép; cấm gradient số mượt, cấm bloom HDR.

## 4. Công thức prompt đặc thù
```
[HÌNH] 90s anime key visual of <chủ thể + pose cảm xúc tĩnh>, <bối cảnh scene_context>,
<cỡ cảnh>, hair and cloth caught in breeze, <2–3 màu palette hoài niệm>, soft rim light
[STYLE] 90s Japanese anime, hand-drawn cel, flat color fill, retro film grain  ← NGẮN
[CAMERA] <slow pan / static hold>
```
- Nhân vật tái dùng: @tag + "identical hand-drawn character design, same cel shading".
- Video: tả idle drift (tóc, áo, chớp mắt, hơi thở) — KHÔNG tả chuyển cảnh 3D.

## 5. Cạm bẫy
- ❌ Da mượt kiểu số/CGI, bloom HDR → mất chất cel 90s.
- ❌ Chuyển động mượt 60fps → phá "cảm giác vẽ tay từng frame".
- ❌ Palette rực bão hòa cao → thành anime hiện đại, mất hoài niệm.
- ❌ STYLE chứa era/trang phục → sai phân tầng.
