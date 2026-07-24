---
name: Craft dựng SCENE-CONTEXT + quy hoạch SHOT
description: Cách dựng bối cảnh riêng từng cảnh (era/setting/wardrobe/props/mood) + chia block shot rõ ý đồ. Dùng ở bước Kịch bản final.
axis: common
steps: [gate1d_script, gate1_script]
---

# CRAFT COMMON · SCENE-CONTEXT + quy hoạch SHOT

> Rút ở bước **Kịch bản final** (gate1d_script). Dựng bối cảnh TỪNG cảnh (bottom-up) rồi chia block shot. Đây là nơi ĐẶT thời đại/trang phục (KHÔNG để ở STYLE).

## 1. Scene-context = lớp B (nơi chứa era/setting/wardrobe/props)
- Mỗi cảnh dựng RIÊNG, không ép 1 khuôn: **era** (thời đại), **setting** (không gian cụ thể), **wardrobe** (trang phục hợp era + nhân vật), **props** (đạo cụ then chốt), **mood** (tâm trạng cảnh).
- Bottom-up: đọc narration cảnh đó cần gì thì dựng nấy — đừng copy bối cảnh cảnh trước.
- Đây là ranh giới phân tầng: STYLE = chất liệu vẽ (bất biến), scene_context = thế giới cảnh (biến thiên).

## 2. Chia block = chia Ý ĐỒ SHOT, không chia đều máy móc
- 1 cảnh = 1..n block. Mỗi block = 1 shot có ý đồ rõ (1 khoảnh khắc/1 nhịp hình).
- Chia khi: đổi cỡ cảnh, đổi chủ thể, đổi nhịp cảm xúc, cần insert nhấn. KHÔNG chia chỉ để cho nhiều.
- Block_order bắt đầu 1. Mỗi block ghi shot_desc đủ để bước ảnh/video dựng không đoán mò.

## 3. Nối shot trong cảnh (mini-grammar)
- Wide thiết lập → medium kể → close nhấn: mẫu kinh điển an toàn.
- Xen insert (vật/tay/mắt) để giữ nhịp + giấu mối nối.
- Giữ trục 180° (eyeline nhất quán) khi 2 nhân vật đối thoại.

## 4. Bám khung + chiến lược
- Mỗi cảnh phục vụ 1 beat ở khung xương; mỗi hình cụ thể lấy từ bảng chuyển thể "cho xem đừng kể".
- Narration CHỐT ở bước này (viết chỉn chu) — không còn là nháp.

## Cạm bẫy
- ❌ Nhét era/trang phục vào đoạn STYLE của prompt → sai phân tầng (phải ở scene_context).
- ❌ plan_shots TRƯỚC khi tạo cảnh → thiếu chỗ neo (phải write_scene_context trước).
- ❌ Chia block đều tăm tắp không theo ý đồ → shot vô hồn.
- ❌ Copy bối cảnh giữa các cảnh → mất tính riêng.
