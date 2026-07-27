# MODEL · Seedance 2.0 — LUẬT VIẾT PROMPT VIDEO ⭐ (bản đang chạy)

> Khối này được app chèn vào system của **vidPrompter (GATE 3)** khi dự án chọn Seedance 2.0.
> Đây là **bản chuẩn** — mọi luật ở `byteplus-spec` và `_execution_vidPrompter` viết theo 2.0.
> File này chốt **giới hạn cứng** của đời model để thợ không viết thứ engine không làm được.

---

## 1 · GIỚI HẠN CỨNG

| | Seedance 2.0 |
|---|---|
| Độ dài 1 lần sinh | **4–15 s** (app vẫn cắt block **≤8 s** — điểm hỏng 5–8s) |
| Tham chiếu | **≤12 file**: 9 ảnh · 3 video · 3 audio |
| Độ phân giải | 480 / 720 / 1080 (2K) |
| Tỉ lệ | mọi tỉ lệ phổ biến |
| Audio gốc | có |
| Sửa theo vùng | ❌ **không** (2.5 mới có) |

⚠️ **>9 @tag ảnh trong một cảnh là VƯỢT TRẦN** → phải gộp bớt hoặc tách block. Đây là lỗi âm thầm:
Coco nhận file thứ 10 rồi bỏ qua, prompt vẫn ghi `@X` mà engine không có ảnh nào cho `@X`.

---

## 2 · CÔNG THỨC (bản chuẩn — giữ nguyên)

```
[Subject], [Action], in [Environment + Lighting], camera [Camera Movement],
style [Style], avoid [Constraints]
```

**LUẬT TÁCH CÂU — lỗi số 1:** chuyển động **MÁY** và chuyển động **CHỦ THỂ** phải ở **hai câu riêng**.
- ❌ `she turns while the camera dollies in around her`
- ✅ `She turns her head slowly toward the window. Camera dollies in steadily on her face.`

**KHÔNG ghi thông số máy** (`85mm`, `f/2.8`, `ISO 800`, `24fps`) — đó là chữ của prompt ẢNH.
Video dùng **cỡ cảnh + động tác + từ nhịp** (`slow/smooth/steady/gradual`).

**Ngân sách chữ: 60–100 từ, trần 150** — tổng cả 7 trường cộng lại.

---

## 3 · CHỐNG TRÔI MẶT TRÊN 2.0

2.0 **chưa có** bộ khóa nhân vật xuyên cú quay của 2.5 → phải bù bằng 3 thứ:

1. **Ảnh khung đầu** — `@Image1 as the first frame;` mở đầu trường `scene`. Thiếu = mất neo.
2. **`avoid identity drift`** ở đuôi `constraints` — cú pháp chính hãng, miễn phí.
3. ⭐ **NỐI KHUNG** — xuất khung cuối clip N làm ảnh khung đầu clip N+1 (byteplus-spec 8bis-A).
   Trên 2.0 đây là kỹ thuật **mạnh nhất** vì engine không tự giữ danh tính giúp.

Cộng thêm `No scene cuts throughout, one continuous shot.` ở cuối `motion` — 2.0 hay tự chèn cắt
cảnh, mỗi lát cắt là một cơ hội trôi.

---

## 4 · CẤM

- ❌ Duration >8 s cho một block (validator chặn; engine hỏng ở 5–8s nếu chuyển động phức tạp).
- ❌ Quá 9 @tag ảnh trong một cảnh.
- ❌ Nhắc "sửa vùng"/"region edit" — 2.0 không có.
- ❌ Thông số máy quay trong prompt.
- ❌ Nhiều hơn MỘT thành phần được `fast`.
- ❌ Nhạc nền (BGM) — chỉ ambient + âm hiệu.
