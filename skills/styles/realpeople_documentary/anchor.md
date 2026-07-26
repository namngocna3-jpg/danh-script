---
name: realpeople_documentary
label: Người thật · tài liệu (handheld, ánh sáng tự nhiên)
description: Chất liệu người thật lối phim tài liệu — máy cầm tay, ánh sáng tự nhiên, chân thực đời thường. KHÔNG chứa thời đại/trang phục.
---

# STYLE ANCHOR · realpeople_documentary

**Từ neo phong cách (chèn vào đoạn STYLE của mọi prompt):**
```
photorealistic real human actors, handheld camera breathing motion, available natural light,
visible skin pores, fabric drape and friction, unstaged lived-in realism, documentary cinematography,
high detail, sharp focus, natural color grading
```

**Negative mặc định:**
```
cartoon, anime, 3d render, cgi, illustration, over-polished studio look, plastic skin,
extra fingers, deformed face, text, watermark, blurry
```

**Bảng màu lõi (L1 cứng):** tông tự nhiên đời thường, ánh sáng ngẫu nhiên (cửa sổ, đèn đường, ngược sáng), độ bão hòa thấp-vừa, giữ chất da thật. Khác `realpeople_cinematic` ở chỗ thô mộc, cầm tay, ít dàn dựng.

---

## Triết lý chất liệu (worker đọc để chắt lọc — KHÔNG chép nguyên vào prompt)

> Tài liệu là "bắt được sự thật đang xảy ra", không phải dàn dựng. Máy đi theo nhân vật, ánh sáng có sẵn, khoảnh khắc không hoàn hảo mới đáng tin.

1. **Máy quan sát, không đạo diễn** — cầm tay có nhịp thở, đôi lúc trễ nét rồi bắt lại, khung hơi lệch tự nhiên.
2. **Ánh sáng có sẵn** — chỉ dùng nguồn thật (cửa sổ, đèn trần, đèn đường); không set đèn studio.
3. **Không gian đã được sống** — bừa bộn có chủ ý, dấu vết sinh hoạt, chi tiết không sắp đặt.
4. **Khoảnh khắc thật hơn cái đẹp** — biểu cảm thoáng qua, cử chỉ vô thức đáng giá hơn pose đẹp.

## Cách tả CHỦ THỂ
- Nhân vật đang **làm việc thật** (không nhìn máy), bắt được cử chỉ/biểu cảm tự nhiên giữa chừng.
- Da giữ pores thật, mồ hôi/tóc rối/quần áo nhăn đều được — đó là chân thực.

## Cách tả BỐI CẢNH
- Địa điểm thật, lộn xộn đời thường, có chiều sâu; ánh sáng vào từ nguồn nhìn thấy được.

## Gu ÁNH SÁNG & MÁY (bảng dẫn hướng)

| Tình huống | Máy & sáng | Cảm giác |
|---|---|---|
| Quan sát bình thản | cầm tay nhẹ, ánh sáng cửa sổ | mộc mạc, tin cậy |
| Theo hành động | máy đi theo, hơi rung, nét bám chủ thể | sống động, gấp gáp |
| Phỏng vấn/tâm sự | tĩnh hơn, ánh sáng bên tự nhiên | gần gũi, thật |
| Ngoài trời/đường phố | ngược sáng, flare tự nhiên, phơi sáng lệch | đời thường, tức thời |

## Gu ĐẠO DIỄN (nhịp kể)
- Để cảnh **thở**: giữ khung lâu hơn một nhịp, bắt cái xảy ra sau khoảnh khắc chính.
- Chuyển động do **theo nhân vật** quyết định, không phải cú máy đẹp định sẵn.

**Cấm (thuộc style này):** không hoạt hình hóa, không CGI, không ánh sáng studio bóng bẩy quá mức.

> ⚠️ Anchor này CHỈ nói chất liệu (người thật, lối tài liệu). Thời đại/trang phục/nơi chốn do lớp B (scene_context) quyết định theo từng cảnh — kể cả cổ trang hay tương lai vẫn quay bằng chất liệu người-thật handheld này.
