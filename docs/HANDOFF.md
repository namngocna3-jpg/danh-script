# HANDOFF — Danh Script (bàn giao cho máy/người mới)

> Đọc file này đầu tiên. Nó là **điểm vào** để hiểu app làm gì, dừng ở đâu, cấu trúc ra sao, và làm sao chạy/sửa/đóng gói tiếp. Chi tiết sâu nằm ở các file `docs/0x-*.md` (trỏ ở cuối).

Cập nhật: 2026-07-23.

---

## 1. App này là gì (1 đoạn)

**Danh Script** = app Electron sinh **prompt video tiền kỳ** cho quy trình làm video AI. Người dùng nhập 1 **ideal** (ý tưởng tiếng Việt) → app chạy qua **5 cổng (GATE)** → xuất ra **bảng prompt** (ảnh khung đầu + video theo chuẩn BytePlus/Seedance) + **bảng @tag→ảnh tư liệu**. **App DỪNG ở prompt** — KHÔNG tự render. Người dùng cầm prompt + ảnh qua **Coco Studio** (chạy BytePlus/Seedance) để render.

Học vỏ điều phối từ Toonflow, nhưng **ruột là engine tự do bottom-up** (như Higgsfield): ideal nào cũng làm, không ép khuôn thể loại.

---

## 2. BẤT BIẾN QUAN TRỌNG NHẤT (đọc kỹ trước khi sửa skill)

Kiến trúc 3 lớp — **không được trộn lẫn**:

| Lớp | Là gì | Khóa | Nằm ở |
|---|---|---|---|
| **A — STYLE** | Chất liệu render tổng thể (2D/3D/người thật/điện ảnh…). **CHỈ là phong cách hình ảnh.** | Cứng L1, cả dự án | `projects.style_id` → `skills/styles/<id>/anchor.md` |
| **B — BỐI CẢNH** | Thời đại + nơi chốn + trang phục + đạo cụ + tông cảm xúc, **suy TỪNG cảnh từ ideal** | Mềm, đổi theo cảnh | `scenes.scene_context_json` (SceneContext) |
| **C — IDENTITY** | Nhận dạng nhân vật: mặt/dáng khóa cứng, tóc/đồ mềm | Mặt/dáng cứng, còn lại mềm | `assets` + @tag |

⚠️ **STYLE TUYỆT ĐỐI KHÔNG chứa thời đại/trang phục/tóc.** Đó là cơ chế chống "xuyên không" (ideal cổ đại/tương lai vẫn ra đúng). Mọi kỹ thuật bê từ nguồn khác **phải lột sạch thời đại/trang phục** trước khi đưa vào skill chung. Xem `skills/craft-photography.md` — nó era-free, chỗ cần trang phục luôn ghi `{wardrobe from scene context}`.

Ngoài ra: **target render DUY NHẤT = BytePlus/Seedance.** Seedance **không đọc negative prompt** → mọi ràng buộc "cấm" phải viết thành câu khẳng định ở trường `constraints`. Xem `skills/byteplus-spec.md`.

---

## 3. Luồng chạy (5 GATE + prep)

```
prep (Nhóm A)   personaBuilder + researcher → làm giàu ideal (target, góc, trigger)
   ▼
GATE 0  ideaAnalyst  → phân tích bottom-up: bối cảnh từng cảnh (lớp B) + @tag nhân vật/đạo cụ
   ▼ (người dùng chốt bối cảnh + chọn STYLE + tham số aspect/duration/lang)
GATE 1  scriptwright → narration/lời thoại tiếng Việt từng cảnh + cắt block
   ▼ (kiểm duyệt A/B/C/D → chốt)
GATE 2  imgPrompter  → prompt ẢNH khung đầu (EN) mỗi block, công thức 6 phần, nhúng @tag
   ▼
GATE 3  vidPrompter  → prompt VIDEO mỗi block: style/scene/motion/audio/constraints/negative/text_overlay + tags
   ▼
GATE 4  export       → bảng copy prompt + bảng @tag→ảnh để mang qua Coco render
```

- **Sếp** (`skills/free/_decision.md`) = AI điều phối, DUY NHẤT nói với người dùng, giao việc ngắn ≤100 chữ, không làm thay thợ.
- **Thợ** = các `_execution_*.md`, có skill đầy đủ; 3 thợ có tool ghi DB: scriptwright, imgPrompter, vidPrompter (`GateKey`).
- **reviewer** (`skills/reviewer.md`) chấm A/B/C/D sau mỗi cổng.

---

## 4. Cấu trúc mã nguồn

```
src/
  main/                     ← Electron main (Node)
    index.ts                ← entry: seedSkills() → initDb() → registerIpc() → createWindow()
    ipc.ts                  ← tất cả IPC handler (project, gate, settings…)
    db/index.ts             ← better-sqlite3, mở DB ở userData, nạp schema.sql
    db/schema.sql           ← schema projects/scenes/blocks/assets
    core/
      settings.ts           ← LLM settings + mã hóa API key (safeStorage), KHÔNG lộ key thô ra renderer
      llmGateway.ts          ← cổng model 1 mối (anthropic tool-use / 9router,beeknoee OpenAI-compat)
      agentRunner.ts        ← vòng chạy agent 3 tầng + stream step ra UI
      queue.ts              ← hàng đợi throttle request
      skillLoader.ts        ← nạp .md skill; ĐỌC userData/skills trước → resources/skills; seedSkills() copy lần đầu
    pipeline/
      gate0.ts              ← GATE 0 ideaAnalyst (bottom-up)
      gates.ts              ← GATES map (worker/stage/layers/buildPrompt), runGate, runPrep, reviewGate, buildExport
    tools/index.ts          ← các tool ghi DB (write_video_prompt…)
    assets.ts               ← quản lý asset/@tag
  preload/index.ts          ← bridge an toàn (window.danh.*), strip apiKey
  renderer/src/
    App.tsx, store.ts, wizardStore.ts
    ui/ … wizard/ …          ← Dashboard, SettingsModal, 5 panel GATE, GateRunner, ExportPanel
  shared/types.ts           ← kiểu dùng chung main⇆renderer (Ideal, SceneContext, VideoPrompt, …)

skills/                     ← "linh hồn" agent (.md) — ĐÓNG GÓI RA NGOÀI asar, sửa được sau khi cài
  free/_decision.md         ← Sếp
  free/_execution_*.md      ← thợ (persona, research, ideaAnalyst, scriptwright, imgPrompter, vidPrompter)
  craft-photography.md      ← ⭐ kỹ thuật nhân vật + ánh sáng (era-free) — nạp cho img+vid
  byteplus-spec.md          ← ⭐ chuẩn viết prompt Seedance (6 phần, negative→constraints)
  motion-library.md, model-catalog.md, consistency.md, identity-lock.md, style-constitution.md
  scene-analysis.md, reviewer.md
  styles/<id>/anchor.md     ← ~11 style (chất liệu render)

docs/                       ← spec chi tiết (xem mục 8)
```

---

## 5. Dữ liệu & bảo mật (nơi lưu khi chạy)

- Tất cả runtime nằm ở **`%APPDATA%\danh-script\`** (userData):
  - `danh-script.db` — SQLite (dự án, cảnh, block, asset).
  - `settings.json` — cấu hình LLM; **API key mã hóa theo máy** (Electron safeStorage/DPAPI). Copy file này sang máy khác **không giải mã được** → phải nhập lại key.
  - `skills/` — bản seed lần chạy đầu; **sửa .md ở đây là app đọc luôn** (ưu tiên hơn bản trong app).
- **Preload không bao giờ trả apiKey thô ra renderer** (`getPublicSettings` chỉ trả `hasKey/encrypted`). Giữ nguyên tắc này khi sửa.

---

## 6. Chạy khi phát triển (dev)

```bash
yarn install          # postinstall tự rebuild better-sqlite3 theo ABI Electron
yarn dev              # electron-vite dev (hot reload)
yarn typecheck        # bắt buộc chạy sau khi sửa types/tool
yarn build            # build ra out/ (main+preload+renderer)
```

Nếu màn hình trắng / sqlite crash: ABI lệch → chạy lại `yarn postinstall` (electron-builder install-app-deps) để rebuild native theo Electron.

---

## 7. Đóng gói

### 7a. Bản PORTABLE (đang dùng để test máy công ty) ✅
Không cần .exe cài. Script ráp tay (đã làm, kết quả ở `portable/`):
1. `yarn build`
2. Copy `node_modules/electron/dist/*` → `portable/DanhScript/`, đổi `electron.exe` → `DanhScript.exe`.
3. `resources/app/` = package.json rút gọn + `out/` + `skills/` + node_modules tối thiểu (better-sqlite3+build, bindings, file-uri-to-path, zustand).
4. Đặt `schema.sql` + `skills/` vào `resources/` (nơi `process.resourcesPath` trỏ).
5. Xóa `resources/default_app.asar`.
→ Nén `DanhScript-portable.zip` (~112MB). Giải nén, chạy `DanhScript.exe`.

### 7b. Bản .exe cài NSIS (để FINAL) — ⚠ đang vướng
`yarn dist` fail trên Windows non-admin: electron-builder tải gói **winCodeSign** (để ký app) chứa **symlink macOS (.dylib)** → 7za không tạo được symlink (thiếu quyền `SeCreateSymbolicLinkPrivilege`).
**Cách gỡ khi làm final:** một trong các cách:
- Bật **Developer Mode** Windows (Settings → For developers) → cho phép tạo symlink, rồi `yarn dist`.
- Hoặc chạy terminal **as Administrator** rồi `yarn dist`.
- Hoặc đặt `CSC_IDENTITY_AUTO_DISCOVERY=false` + không ký; vẫn cần symlink cho rcedit (đặt icon) → vẫn phải qua 1 trong 2 cách trên.
`electron-builder.yml` đã cấu hình sẵn NSIS + extraResources (schema.sql + skills). Chưa có icon (`build/`) → sẽ dùng icon Electron mặc định; muốn icon riêng thì thêm `build/icon.ico`.

---

## 8. Trạng thái tiến độ

**Xong:** scaffold; DB; llmGateway; queue; Dashboard; asset-tag; agentRunner 3 tầng; ideaAnalyst bottom-up; bộ tool ghi DB; skill free/ + Nhóm A; ~11 style + identity-lock; wizard 5 cổng; màn Xuất + tag map; màn Nhân vật gắn ảnh @tag; **màn Cài đặt nhập API key mã hóa** (settings.ts + SettingsModal); **sửa text 5→7 trường**; **nâng cấp knowledge** (craft-photography, byteplus-spec, consistency, model-catalog era-free + negative→constraints); **đóng gói skills ra ngoài asar + seed userData**; **bản portable .zip chạy được**.

**Còn lại:**
- Bản **.exe cài NSIS** (mục 7b) — để final, cần gỡ vướng symlink.
- Chạy thật GATE 0–4 với API key thật để nghiệm thu output (cần key ở máy công ty).
- (Tùy chọn) icon riêng `build/icon.ico`.

---

## 9. Docs chi tiết (đọc khi cần đào sâu)

| File | Nội dung |
|---|---|
| `docs/00-SPEC-TONG.md` | Spec tổng thể app |
| `docs/01-KIEN-TRUC.md` | Kiến trúc kỹ thuật |
| `docs/02-KE-HOACH-BUILD.md` | Kế hoạch build từng bước |
| `docs/03-MO-VANG-5-NGUON.md` | "Mỏ vàng" 5 nguồn (quy ước @tag…) |
| `docs/04-PHAN-TICH-IDEAL-VA-DO-THAT.md` | Phân tích ideal + độ thật (style) |
| `docs/05-THU-VIEN-STYLE.md` | Thư viện style |
| `docs/06-BAN-DO-AGENT-SKILL.md` | Bản đồ agent ↔ skill |
