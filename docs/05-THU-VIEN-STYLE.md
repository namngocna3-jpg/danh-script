# THƯ VIỆN STYLE + chính sách COPY từ 5 nguồn

> App HOÀN TOÀN MỚI. 5 nguồn = tham khảo/học theo. Được **copy agent & skill của 5 nguồn** (vì output tốt), Việt hóa + sửa thành của mình, hoặc lấy nguyên nếu hợp.
> STYLE = chất liệu render (nhất quán toàn dự án). Xem cơ chế L1/L2/L3 ở `04`.

---

## 1. Chính sách COPY (bạn đã bật đèn xanh)

| Nguồn | Copy cái gì về | Xử lý |
|---|---|---|
| **Toonflow art_skills** | **11 style folder** (prefix.md + art_prompt/ + director_skills/) | Bê nguyên → **Việt hóa prefix** → sửa để bối cảnh vào L2 |
| **Toonflow** | Agent 3 tầng, cơ chế giám sát A/B/C/D, art_prompt template {slots} | Copy logic → viết lại `.md` tiếng Việt |
| **TopView scripts/** | `run/submit/query` pattern, validate model-catalog, omni syntax | Copy ý tưởng code → viết lại cho cổng BytePlus |
| **coco references/** | Wizard 5 cổng, 5-review, module talking/product/voice | Bê template → gắn vào pipeline |
| **Printfilm** | Khung app React, cổng model, asset variations, né kiểm duyệt | Tham khảo cấu trúc |
| **Higgsfield** | Motion/camera preset, video analyzer (sau) | Tham khảo docs |

**Nguyên tắc copy:** lấy về `E:\PHAN-TICH-2APP\SOURCES\` để đối chiếu, rồi **viết bản của mình** trong `skills/` (tiếng Việt, đã sửa lỗi cứng/mềm). Không nhét thẳng file gốc chưa sửa vào app.

---

## 2. Thư viện STYLE — 11 bê từ Toonflow + bổ sung

### Nhóm A — Người thật (Real / độ thật)
| Style | Từ Toonflow | Mô tả |
|---|---|---|
| `real-photoreal` | realpeople_modern_city / urban_modern | Độ thật tối đa, quang học camera thật |
| `real-ancient` | realpeople_ancient_chinese | Người thật bối cảnh cổ (chất liệu ảnh thật, KHÔNG hoạt hình) |

> Lưu ý: "ancient" ở đây là style-variant chất liệu ảnh thật, nhưng **thời đại cụ thể vẫn để L2 theo cảnh**.

### Nhóm B — Hoạt hình 2D
| Style | Từ Toonflow | Mô tả |
|---|---|---|
| `2d-anime-jp90s` | 2D_90s_japanese_anime | Anime Nhật thập niên 90 |
| `2d-chinese-guofeng` | 2D_chinese_guofeng | **Hoạt hình 2D Trung (donghua/quốc phong)** ⭐ bạn nhắc |
| `2d-flat-design` | 2D_flat_design | Phẳng, tối giản, màu khối |
| `2d-urban-romance` | 2D_mature_urban_romance | Ngôn tình đô thị 2D |

### Nhóm C — Hoạt hình 3D
| Style | Từ Toonflow | Mô tả |
|---|---|---|
| `3d-anime-render` | 3D_anime_render | **Hoạt hình 3D** kiểu anime ⭐ bạn nhắc |
| `3d-chinese-traditional` | 3D_chinese_traditional | 3D phong cách Trung truyền thống |
| `3d-clay-stopmotion` | 3D_clay_stopmotion | Đất nặn / stop-motion |
| `3d-guofeng-cyber` | 3D_guofeng_cyber | Quốc phong + cyber |

### Nhóm D — Bổ sung MỚI (bạn muốn thêm — tôi tự dựng style)
| Style | Trạng thái | Mô tả |
|---|---|---|
| `2d-disney-western` | 🆕 tôi dựng | Hoạt hình 2D phương Tây (Disney/Pixar 2D) |
| `3d-pixar` | 🆕 tôi dựng | 3D Pixar (nhân vật bo tròn, dễ thương) |
| `2d-korean-webtoon` | 🆕 tôi dựng | Webtoon Hàn (nét mảnh, màu pastel) |
| `anime-ghibli` | 🆕 tôi dựng | Ghibli (màu nước, thiên nhiên) |
| `real-cinematic-vn` | 🆕 tôi dựng | Điện ảnh VN thật (áo dài, phố cổ, cà phê Sài Gòn) |

> Bạn cứ liệt kê thêm style muốn có, tôi dựng theo đúng khuôn `prefix.md` (bảng màu hex + L1/L2/L3 + template).

---

## 3. Mỗi style là 1 folder (khuôn chuẩn, bê từ Toonflow)

```
skills/styles/<tên-style>/
├── prefix.md              ← hiến pháp: gen phong cách + bảng màu hex + L1硬/L2软/L3例外 + mood palette
│                            ⚠️ KHÔNG chứa từ thời đại — chỉ nói chất liệu vẽ
├── art_prompt/
│   ├── art_character.md    ← template nhân vật {slots}
│   ├── art_prop.md         ← template đạo cụ
│   ├── art_scene.md        ← template bối cảnh (chỗ này nhận L2 bối cảnh theo cảnh)
│   └── art_storyboard.md   ← template storyboard→video
├── director/
│   └── director_planning.md ← anchor phong cách + cách lên storyboard
└── preview.png            ← ảnh mẫu để chọn trong UI
```

**GATE THAM SỐ:** người dùng chọn 1 style (xem preview). Style đó khóa L1 cứng toàn dự án.
**GATE 0:** phân tích ideal → bối cảnh L2 mềm từng cảnh (không đụng L1).

---

## 4. Việc cần làm khi bê 1 style về (checklist)

1. Copy folder từ `E:\Toonflow-viet\data\skills\art_skills\<style>` → `skills/styles/<tên-việt>`.
2. **Việt hóa** `prefix.md` (đang tiếng Trung) — giữ bảng màu hex nguyên.
3. **Rà L1/L2/L3:** đảm bảo thời đại/trang phục nằm ở **L2 (mềm)**, chất liệu vẽ ở **L1 (cứng)**. Nếu prefix gốc nhét "cổ trang" vào L1 → chuyển xuống L2.
4. Việt hóa template `art_prompt/*.md`, giữ {slots}.
5. Chụp `preview.png` để chọn trong UI.

---

## 5. Ảnh hưởng tới các file spec khác

- `01-KIEN-TRUC.md §7` — kho `skills/styles/` giờ là **thư viện nhiều style** (không chỉ realism). realism chỉ là 1 style.
- `04` — LỚP A đổi tên "hiến pháp ĐỘ THẬT" → "STYLE constitution" (độ thật là 1 lựa chọn).
- DB `projects` thêm cột `style_id` (style đã chọn cho dự án).
- `02-KE-HOACH-BUILD.md` — ĐỢT 1 bê 1–2 style; ĐỢT 2 bê đủ 11 + Việt hóa; bổ sung style mới rải các đợt.
