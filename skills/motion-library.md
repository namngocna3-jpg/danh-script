# LỚP · Thư viện CHUYỂN ĐỘNG (motion-library) ⭐

> Mỏ #14 — chắt từ **TopView** (camera keywords) + **Higgsfield** (motion presets: Bullet Time, 360° orbit, dolly, crane) + camera vocab Seedance 2.x.
> Nạp kèm cho **vidPrompter** (GATE 3). Mục đích: trường `motion` chọn từ BẢNG PALETTE có sẵn thay vì bịa — mỗi block 1 nhịp, ≤15s, hợp Seedance/BytePlus.
> Chi tiết chuẩn máy quay + phân đoạn thời gian: xem **byteplus-spec** mục 4 & 5 (nạp kèm).

## Cấu trúc 1 câu motion (TopView)
```
Subject motion + Camera motion + (nhịp/tốc độ)
```
Ví dụ: *"the character turns head slowly to camera, slow dolly-in, shallow depth of field"*.

## PALETTE CAMERA (chọn 1, tối đa 2 ghép mượt)

| Preset | Từ khóa prompt (EN) | Dùng khi |
|---|---|---|
| Tĩnh | `static shot`, `locked-off camera` | cảnh thoại, nhấn sản phẩm |
| Lia ngang | `slow pan left/right` | mở không gian, giới thiệu bối cảnh |
| Đẩy vào | `slow dolly-in`, `push in` | tăng căng thẳng, zoom cảm xúc |
| Kéo ra | `dolly-out`, `pull back reveal` | hé lộ toàn cảnh ở cuối |
| Bám theo | `tracking shot`, `follow shot` | nhân vật di chuyển |
| Quay quanh | `orbit around subject`, `slow 360° orbit` | khoe sản phẩm/nhân vật 3D |
| Bullet Time | `bullet-time freeze, camera arcs around` | khoảnh khắc đỉnh (1 lần/video) |
| Nâng cần | `crane shot rising`, `boom up` | kết thúc hoành tráng |
| Hạ cần | `crane down`, `boom down` | vào cận cảnh chi tiết |
| Zoom | `zoom in / zoom out` | nhấn nhanh (tiết chế) |
| Góc thấp | `low-angle push` | uy lực, thần thái |
| Cầm tay | `subtle handheld` | chân thực đời thường (đừng lạm dụng) |
| Dolly zoom | `Hitchcock zoom (dolly zoom)` | cảm giác choáng/vỡ nhận thức (1 lần/video) |
| Vụt ngang | `whip pan` | chuyển nhanh sang chủ thể khác (tiết chế) |
| Một cú liền | `one-take, no cuts throughout` | quay liền mạch cả clip |

## PALETTE CHUYỂN ĐỘNG CHỦ THỂ
`turns to camera` · `walks toward lens` · `raises the product` · `hair/fabric flows in wind` · `reaches out` · `looks over shoulder` · `sits down / stands up`.

## ⭐ CẶP BỐ CỤC {khung đầu → khung cuối} (start frame → end frame)

> Chắt từ **Printfilm cameraMovementGuides** — mỗi chuyển động máy KHÔNG chỉ là 1 từ khóa, mà là **1 cặp bố cục**: frame MỞ (khung đầu, chính là ảnh GATE 2) → frame ĐÓNG (khung cuối, đích đến của cú máy). Vì Coco chạy **image-to-video** (đã có ảnh khung đầu), trường `motion` chỉ cần tả **frame đầu bắt đầu ở đâu → frame cuối kết thúc ở đâu**, để Seedance biết đường đi.

**Cách viết trong `motion`:** `Start: {bố cục frame đầu}. End: {bố cục frame cuối}. {tốc độ}.` — hoặc chèn timeline `0–Ns` (byteplus-spec mục 5b).

| Preset | Frame ĐẦU (mở) | Frame CUỐI (đóng) | Câu mẫu (EN) |
|---|---|---|---|
| Đẩy vào | chủ thể ở trung/toàn cảnh, còn thấy môi trường | mặt/chi tiết chủ thể choán khung, hậu cảnh bokeh | `Start on a medium framing, slowly push in until the face fills the frame.` |
| Kéo ra | cận mặt/đặc tả 1 điểm | lộ toàn cảnh, chủ thể nhỏ dần trong không gian | `Start tight on the detail, pull back to reveal the whole environment.` |
| Lia ngang | chủ thể/điểm A lệch một bên khung | quét tới điểm B phía đối diện | `Start framed on the left subject, pan right to land on the second subject.` |
| Bám theo | chủ thể ở giữa khung, môi trường sau lưng | chủ thể vẫn giữa khung, môi trường phía sau đã đổi | `Start behind the walking figure, track forward keeping them centered as the corridor slides past.` |
| Quay quanh | thấy mặt/mặt trước chủ thể | vòng tới thấy hông/sau lưng (đổi 90–180°) | `Start on the front, orbit around until the profile is revealed.` |
| Nâng cần | chủ thể ở tầm mắt, tiền cảnh chiếm khung | máy vượt lên cao, lộ bối cảnh phía trên/xa | `Start at eye level on the subject, crane up to reveal the skyline behind.` |
| Hạ cần | góc rộng từ trên | hạ xuống dừng ở chi tiết/vật thể dưới thấp | `Start high and wide, boom down to settle on the object on the table.` |
| Máy thấp đẩy | thấy chân/thân dưới góc thấp | ngước lộ mặt + trời/trần phía trên | `Start low near the ground, push up to reveal the face against the sky.` |
| Dolly zoom | chủ thể + hậu cảnh bình thường | chủ thể giữ nguyên cỡ, hậu cảnh giãn/nén méo | `Keep the subject the same size while the background warps outward.` |

**Luật cặp bố cục:**
- **Frame đầu = ảnh GATE 2**, KHÔNG tả lại cái đã đứng yên trong ảnh (luật vàng image-to-video). `motion` chỉ tả **sự thay đổi từ đầu → cuối**.
- Frame cuối phải **cùng bối cảnh/nhân vật/trang phục** với frame đầu (chỉ đổi khung/góc/cỡ cảnh — 7 báu luật ② & ③ ở `storyboard-craft`).
- Frame cuối là nơi đặt **điểm nhấn/reveal** của block (mặt lộ ra, sản phẩm hiện, toàn cảnh mở). Một block chỉ 1 reveal.
- Đổi cỡ cảnh giữa đầu→cuối phải theo递进 (đẩy = siết dần, kéo = nhả dần), không nhảy cóc.

## LUẬT (giữ chặt)
- **1 block = 1 nhịp máy.** Không nhồi 3 chuyển động vào 1 clip 5–8s.
- **Nhất quán hướng nhìn** xuyên block (khóa trái/giữa/phải; đổi hướng phải có động tác quay rõ).
- **Bullet Time / 360° orbit**: tối đa 1 lần cho cả video, để dành cho khoảnh khắc đỉnh.
- **Có chuyển động máy → chọn "not fixed camera"** (luật BytePlus, xem byteplus-spec mục 4). Muốn cực ổn định → `static shot, steady camera on tripod` + fixed camera.
- **Degree adverb bắt buộc**: mọi chuyển động ghi kèm tốc độ (`slowly/gently/smoothly/explosively`) — xem byteplus-spec mục 3.
- Tránh camera "loạn" (nhiều hướng mâu thuẫn) → Seedance dễ méo.
- KHÔNG dùng từ làm mờ (`film grain`, `motion blur` quá đà, `imperfect focus`).

## OMNI reference (khi Coco chạy Seedance 2.0 / omni)
Ngoài @tag, Seedance/TopView-omni nhận cú pháp `<<<Image1>>>`, `<<<Video1>>>` để trỏ ảnh/clip mẫu:
```
Apply the motion of <<<Video1>>> to the character from <<<Image1>>>
```
→ Nếu block dùng clip mẫu chuyển động, ghi rõ trong `motion` bằng cú pháp này; app vẫn map @tag ở bảng GATE 4.
