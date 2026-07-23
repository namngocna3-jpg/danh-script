# PHÂN TÍCH IDEAL (bottom-up) + phân biệt STYLE vs BỐI CẢNH

> File quan trọng nhất — **bộ não** của Danh Script.
> **Sửa hiểu nhầm trước đó:** lỗi xuyên không KHÔNG phải do "có style", mà do xếp nhầm "cổ trang" thành style.
>
> **Phân biệt cốt lõi:**
> - **STYLE = chất liệu hình / phong cách render** (độ thật, hoạt hình 2D Nhật, 2D Trung, 3D anime, 3D clay...) → **NHẤT QUÁN toàn dự án**, lặp mọi block. Đổi giữa chừng = video lúc thật lúc hoạt hình = hỏng.
> - **BỐI CẢNH = thời đại / nơi chốn / trang phục** (cổ trang, hiện đại, xuyên không) → **THEO TỪNG CẢNH**, bottom-up từ ideal.
>
> Ví dụ đúng: style = "2D Trung (donghua)" cho cả video. Cảnh 1 = donghua+cổ trang, cảnh 5 = donghua+phố Sài Gòn hiện đại. **Cùng chất liệu hình, khác bối cảnh → không fail.**
> "Độ thật" chỉ là MỘT style trong thư viện (xem `05-THU-VIEN-STYLE.md`), không phải cái duy nhất.

---

## 1. Vấn đề của cách cũ (top-down) — VÌ SAO fail

```
❌ CÁCH SAI (Toonflow art_skills + coco style-library):
   Chọn 1 style "cổ trang" ở đầu
      → nhồi anchor "ancient palace, hanfu, imperial era" vào MỌI block
      → Block 5 kịch bản là "xuyên không về hiện đại, đi xe máy Sài Gòn"
      → prompt vẫn ép "hanfu + ancient palace"
      → ẢNH FAIL: nhân vật mặc hanfu chạy xe máy giữa phố hiện đại 💥
```

Gốc lỗi: **style được quyết định TRƯỚC khi đọc kịch bản**, rồi ép ngược lên toàn dự án.

---

## 2. Cách đúng (bottom-up) — IDEAL đẻ ra bối cảnh

```
✅ CÁCH ĐÚNG (intent-first của TopView + linh hoạt của Higgsfield):
   GATE 0 đọc ideal + kịch bản
      → PHÂN TÍCH từng cảnh: cảnh này ở đâu? thời đại nào? nhân vật mặc gì? đạo cụ gì?
      → đẻ ra "Scene Context" RIÊNG cho từng cảnh
      → Block 1: {era: cổ đại, setting: cung điện, wardrobe: hanfu}
      → Block 5: {era: hiện đại, setting: phố Sài Gòn, wardrobe: áo thun + xe máy}
      → nhân vật GIỮ NGUYÊN MẶT, còn lại đổi theo cảnh
      → KHÔNG conflict, KHÔNG fail ✅
```

**Nguyên tắc:** cái gì lặp mọi block phải **an toàn với mọi thể loại** (= độ thật). Cái gì dính thể loại phải **theo cảnh** (= bối cảnh mềm).

---

## 3. Ba lớp: STYLE (cứng) + BỐI CẢNH (mềm) + IDENTITY (cứng có chọn lọc)

> Toonflow đã giải sẵn bài này trong mỗi `prefix.md` bằng 3 mức ràng buộc **L1硬/L2软/L3例外**.
> Ta bê nguyên cơ chế đó: chất liệu style vào **L1 (cứng)**, bối cảnh/thời đại vào **L2 (mềm)**.

### 🟢 LỚP A — "STYLE = chất liệu render" (L1 cứng, lặp y hệt MỌI block)

Đây là phong cách hình được chọn 1 lần cho cả dự án (từ thư viện — xem `05`). Ví dụ với style "độ thật":

```
STYLE CONSTITUTION (dán vào mọi block, mọi cảnh — CHỈ nói chất liệu hình, KHÔNG nói thời đại):
[Ví dụ style = Photoreal]
• Photorealistic, real camera optics · ánh sáng vật lý thật · chất liệu thật (da/vải/kim loại/kính)
• Skin texture thật (không airbrush nhựa) · DoF quang học · grain nhẹ · color science trung tính
[Ví dụ style = 2D Trung donghua]
• Cel-shaded flat coloring · nét mực mảnh · bảng màu truyền thống Trung (hex cố định)
• Japanese-style rendering · điện ảnh bố cục
```

> ⚠️ Điểm mấu chốt: STYLE constitution **tuyệt đối KHÔNG chứa từ thời đại** ("ancient"/"modern"). Nó chỉ nói *vẽ kiểu gì*, không nói *vẽ thời nào*. Nhờ vậy lặp mọi block không bao giờ conflict với bối cảnh.

### 🟡 LỚP B — "BỐI CẢNH THEO CẢNH" (L2 mềm, do GATE 0 phân tích ideal đẻ ra, KHÔNG lặp cứng)

```
SCENE CONTEXT (riêng từng cảnh, engine tự suy từ kịch bản):
• era       : thời đại của CẢNH NÀY (cổ đại / hiện đại / tương lai...)
• setting   : bối cảnh (cung điện / phố Sài Gòn / studio...)
• wardrobe  : trang phục hợp thời đại cảnh này
• props     : đạo cụ hợp cảnh
• mood/light: tông cảm xúc + kiểu sáng của cảnh (hoàng hôn / neon đêm...)
```

Lớp B **đổi theo từng block**. Đây là chỗ "cổ trang" hay "hiện đại" sống — theo cảnh, không áp toàn dự án.

### 🔴 LỚP C — "KHÓA NHẬN DẠNG NHÂN VẬT" (cứng, xuyên mọi block CÓ nhân vật đó)

```
CHARACTER IDENTITY LOCK (chỉ khóa thứ KHÔNG đổi theo cảnh):
• khuôn mặt (đặc điểm bất biến: mắt/mũi/xương hàm)
• dáng người, tông da, tuổi
• (tùy chọn) 1 dấu hiệu nhận dạng: nốt ruồi, sẹo...
KHÔNG khóa: quần áo, tóc-kiểu, đạo cụ → những cái này THEO CẢNH (lớp B)
```

→ Nhân vật xuyên không vẫn **cùng 1 mặt**, nhưng cảnh 1 mặc hanfu, cảnh 5 mặc áo thun. Nhất quán ĐÚNG CHỖ.

---

## 4. Prompt ảnh cuối = ghép 3 lớp

```
[LỚP A STYLE chất liệu]  +  [LỚP C identity nếu có nhân vật]  +  [LỚP B bối cảnh cảnh này]  +  [nội dung block]

Ví dụ style = "2D Trung donghua", Block 5 (xuyên không hiện đại):
"<DONGHUA STYLE CONSTITUTION: cel-shaded, ink linework, traditional Chinese palette>,
a woman with [identity: oval face, single mole under left eye, mid-20s],
wearing a modern white tee and jeans, riding a motorbike through a busy Saigon street
at golden hour, neon signs..."
   ↑ STYLE chất liệu (A, cứng)   ↑ identity (C, cứng)   ↑ bối cảnh MỀM theo cảnh (B)
```

Chất liệu hình = donghua xuyên suốt (nhất quán). Bối cảnh = hiện đại (đúng cảnh 5). Không lọt "cổ trang" → **không fail**, mà vẫn cùng phong cách vẽ với cảnh 1.

---

## 5. GATE 0 — Engine phân tích ideal (bộ não thật)

Đây là agent "Phân tích ideal" (mảng mới, mượn intent-first TopView):

```
INPUT: ideal (nói về gì + tóm tắt cảnh)
   │
   ▼ Bước 1 — Phân rã ý đồ (TopView intent analysis):
   │   output type · mục đích · chất liệu có sẵn · tông · thời lượng · kênh
   │
   ▼ Bước 2 — Tách cảnh & suy Scene Context TỪNG cảnh (bottom-up):
   │   với mỗi cảnh → {era, setting, wardrobe, props, mood} riêng
   │   ⚠️ nếu ideal có chuyển thời đại/không gian → mỗi cảnh 1 context khác nhau
   │
   ▼ Bước 3 — Nhận diện nhân vật lặp lại → tạo Identity Lock (lớp C)
   │   chỉ khóa mặt/dáng, KHÔNG khóa đồ
   │
   ▼ Bước 4 — Chốt "độ thật" chung (lớp A) — luôn photoreal trừ khi ideal nói khác
   │
   ▼ OUTPUT: bảng phân tích → trình người dùng duyệt trước khi qua GATE 1
```

**Người dùng vẫn chốt** — nhưng app **đề xuất từ ideal**, không bắt chọn khuôn trước.

---

## 6. Bản đồ 5 nguồn ĐÚNG (sửa lỗi "chỉ lấy Toonflow")

| Nguồn | Vai trò THẬT trong Danh Script | Trọng số |
|---|---|---|
| **TopView** | 🧠 **Bộ não: intent-first — phân tích ideal → suy bối cảnh (bottom-up)**. Model-catalog validate. Omni `<<<ref>>>`. Recovery run/submit/query | ⭐⭐⭐ |
| **Higgsfield** | 🧠 **Triết lý: ideal NÀO cũng làm, không khóa khuôn**. Motion/camera preset. Video analyzer (sau) | ⭐⭐⭐ |
| **Printfilm** | 🏗️ Khung app nhẹ + cổng model 1 mối. Asset `variations`. Né kiểm duyệt | ⭐⭐ |
| **Toonflow** | 🎛️ **CHỈ mượn vỏ:** agent-per-mảng + giám sát A/B/C/D + ý tưởng khóa identity (nhưng làm MỀM hơn) | ⭐⭐ |
| **Coco** | 📋 Wizard 5 cổng + **target BytePlus/Seedance** + credit + eKYC + tiếng Việt | ⭐⭐ |

> ❌ **KHÔNG lấy từ Toonflow:** art_skills khóa-cứng-thể-loại (chính là thứ gây lỗi xuyên không), khung phim truyện dài tập.
> ✅ Bộ não = **TopView + Higgsfield**. Toonflow chỉ là vỏ điều phối.

---

## 7. Ảnh hưởng tới kho phong cách (sửa `01-KIEN-TRUC.md` §7)

Kho `skills/styles/` KHÔNG còn là "11 style khóa thể loại". Thay bằng:

```
skills/
├── realism/
│   └── constitution.md      ← LỚP A: hiến pháp độ thật (1 file, lặp mọi block)
├── scene-analysis.md        ← luật suy Scene Context từ ideal (LỚP B, bottom-up)
├── identity-lock.md         ← luật khóa nhận dạng nhân vật (LỚP C, mềm phần còn lại)
└── motion-presets.md        ← camera/motion preset (Higgsfield): orbit, dolly, bullet-time
```

Có thể có vài "tông thị giác" tùy chọn (VD: "TVC sang trọng" = thêm gợi ý ánh sáng/khung), nhưng đó chỉ là **gợi ý mềm**, KHÔNG ép anchor thể loại vào mọi block.
