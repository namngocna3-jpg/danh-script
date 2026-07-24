---
name: Craft dựng cảnh · 3D quốc phong cyber
description: Công thức bố cục/shot/ánh sáng/prompt cho 3D quốc phong × cyber — neon rìm, hologram, glow thể tích, Đông × công nghệ.
axis: art
---

# CRAFT ART · 3D guofeng cyber (Đông × công nghệ)

> Rút khi dựng shot/prompt cho style `3d_guofeng_cyber`. Bổ trợ `anchor.md` (3D PBR, neon rim, hologram, glow). File này dạy CÁCH DỰNG CẢNH pha Đông × cyber. KHÔNG khóa thời đại vào 1 mốc.

## 1. Nguyên tắc bố cục theo chất liệu
- **Tương phản Đông × công nghệ trong 1 khung.** Sức mạnh style: cổ (mái cong, hoa văn, y phục) đặt cạnh mới (neon, hologram, mạch sáng). Dựng khung để 2 lớp này va nhau — ví dụ họa tiết cổ phát sáng neon.
- **Chiều sâu bằng lớp glow.** Volumetric glow + neon tạo khí quyển: tiền cảnh tối, mid nhân vật rìm neon, hậu cảnh hologram nhòe sâu.
- **Bố cục hoành tráng, hơi thấp.** Low angle tôn khí chất; đối xứng kiểu kiến trúc Đông pha đường chéo năng lượng.

## 2. Bảng shot ưu tiên
| Cỡ cảnh | Dùng khi | Lưu ý cyber-Đông |
|---|---|---|
| Wide hoành tráng | mở thế giới | kiến trúc Đông + neon, glow thể tích sâu |
| Medium rìm neon | nhịp kể chính | nhân vật viền neon lam/tím, PBR rõ |
| Close hologram | nhấn công nghệ | chi tiết mạch sáng/hologram trên vật cổ |
| Low-angle anh hùng | khí chất, cao trào | ngược sáng neon, bụi/khói thể tích |

- **Chuyển động máy:** 3D cho phép `slow orbit khoe kiến trúc`, `crane lên`, `push xuyên glow`. Video: "volumetric glow pulsing, hologram flicker, neon reflection shifting, slow camera move".

## 3. Ánh sáng · màu · texture
- **Neon rim + glow thể tích là linh hồn.** `neon rim light, holographic accents, volumetric glow` (anchor). Nền tối sâu để neon nổi. 1–2 màu neon chủ đạo (lam/tím) + nhấn kim hoàng cổ.
- **Palette tối + neon.** Bám anchor (nền #12121C, neon lam #3AA0FF, tím điện #A34BFF, kim hoàng #D4AF37…). Color Script đổi màu neon theo cảm xúc (lam=tĩnh, tím=huyền, đỏ=nguy).
- **Texture:** PBR chi tiết cao (kim loại, ngọc, vải phát sáng). Cấm flat 2D, cấm ánh sáng phẳng đục (dull flat lighting).

## 4. Công thức prompt đặc thù
```
[HÌNH] Chinese-cyber 3D scene of <chủ thể + hành động>, <bối cảnh Đông × công nghệ scene_context>,
<cỡ cảnh, low angle>, neon rim light, volumetric glow, holographic accents, PBR materials, <neon lam/tím + nhấn kim>
[STYLE] Chinese-style 3D render fused with cyber aesthetic, neon rim, volumetric glow  ← NGẮN
[CAMERA] <slow orbit / crane / push xuyên glow>
```
- Nhân vật tái dùng: @tag + "identical 3D character model, consistent oriental-cyber design".
- Video: glow đập nhịp, hologram nhấp nháy, phản chiếu neon trôi + camera chậm hoành tráng.

## 5. Cạm bẫy
- ❌ Ánh sáng phẳng đục, thiếu neon rim → mất chất cyber, thành 3D cổ thường.
- ❌ Low-poly / thiếu PBR → mất độ nét công nghệ.
- ❌ Bỏ lớp cổ (chỉ còn sci-fi) → mất "quốc phong", thành cyberpunk generic.
- ❌ STYLE chứa triều đại cụ thể → sai phân tầng.
