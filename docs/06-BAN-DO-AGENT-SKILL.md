# DANH SCRIPT — BẢN ĐỒ AGENT & SKILL (ĐỢT 1)

> Trả lời dứt điểm: "5 nguồn kia đâu?" và "vì sao không phải lấy mỗi Toonflow?".
> App HOÀN TOÀN MỚI. Mỗi agent-thợ = mượn cách nghĩ tốt nhất từ nguồn phù hợp + bộ skill của Danh, viết lại thành `.md` tiếng Việt của mình.

---

## 0. Nguyên tắc phân vai (khắc đá)

- **Pipeline KHÔNG phải khuôn.** Mặc định `free` — ideal bất kỳ. Affiliate/TVC/Fashion chỉ **nạp sẵn skill + tham số gợi ý**, engine vẫn đọc ideal quyết định (như Higgsfield).
- **Bộ não = bottom-up** (TopView intent-first + Higgsfield linh hoạt). Toonflow CHỈ cho mượn **vỏ 3 tầng agent + giám sát A/B/C/D**.
- **Skill marketing/research của Danh = NGUYÊN LIỆU chạy trong app** (Nhóm A). Superpowers/frontend/claude-api = ĐỒ NGHỀ dựng app (Nhóm B), không nằm trong sản phẩm.

---

## 1. Từng agent-thợ mượn gì từ đâu (ĐỢT 1)

| Agent-thợ (chạy trong app) | Cách nghĩ mượn từ | Skill Danh cắm vào (Nhóm A) | GATE |
|---|---|---|---|
| **personaBuilder** (tiền-ideal) | Higgsfield (góc cảm xúc) | `20-customer-persona-builder`, `marketing-psychology` | trước GATE 0 |
| **researcher** ⭐ | **TopView** (intent-first) | `06-market-researcher`, `research.agent`, `deep-research` | GATE 0 |
| **ideaAnalyst** ⭐⭐⭐ | **TopView + Higgsfield** (suy bối cảnh bottom-up) | — (lõi engine, tự viết) | GATE 0 |
| **scriptWorker** | Coco (cắt block 10s) | `ai-business-skills:04-script-video`, `mkt-suite:reels-scripting`, `copywriting` | GATE 1 |
| **voiceWorker** (narration) | Coco (talking/voice) | `mkt-suite:hook-generator` (Hook→Body→CTA), `ai-business-skills:05-copy-quang-cao` | GATE 1 |
| **imgPromptWorker** | Toonflow art_prompt {slots} | `mkt-suite:ad-creative`, `mkt-suite:video` (brief) | GATE 2 |
| **videoPromptWorker** | TopView (omni, 5 trường) | — (target BytePlus) | GATE 3 |
| **consistencyWorker** | Printfilm (asset variations) | — | GATE 4 |
| **reviewer** (giám sát) | **Toonflow** (A/B/C/D + red-line) | — | mọi GATE |

→ **6/9 agent mượn từ 4 nguồn NGOÀI Toonflow.** Toonflow chỉ xuất hiện ở vỏ (reviewer) + template slot ảnh. Đây là bằng chứng "không lấy mỗi Toonflow".

---

## 2. Nhóm A — Skill CẮM THẲNG vào app (nguyên liệu sản phẩm)

Các skill này được **copy về `skills/` → Việt hóa → biến thành `.md` của agent-thợ**:

```
skills/
├── free/                      ← preset mặc định (ideal bất kỳ)
│   ├── _decision.md
│   ├── _execution_persona.md      ← từ 20-customer-persona-builder + marketing-psychology
│   ├── _execution_research.md     ← từ 06-market-researcher + research.agent
│   ├── _execution_ideaAnalyst.md  ← lõi bottom-up (TopView+Higgsfield)
│   ├── _execution_script.md       ← từ ai-business-skills:04 + reels-scripting
│   ├── _execution_voice.md        ← từ hook-generator + 05-copy-quang-cao
│   ├── _execution_imgprompt.md    ← từ ad-creative + Toonflow art_prompt
│   ├── _execution_videoprompt.md  ← 5 trường, target BytePlus
│   └── _execution_consistency.md
├── affiliate/  · tvc/  · fashion/ ← preset = override vài file trên (không đụng code)
├── styles/                    ← THƯ VIỆN STYLE (chất liệu render, L1 cứng)
├── scene-analysis.md          ← LỚP B (bottom-up)
├── identity-lock.md           ← LỚP C
├── review.md                  ← giám sát A/B/C/D (Toonflow)
└── model-catalog.md           ← ràng buộc BytePlus
```

**Thêm pipeline mới = thêm folder `.md`, không đụng `src/`.**

---

## 3. Nhóm B — Skill chỉ để DỰNG app (không vào sản phẩm)

| Skill | Dùng lúc |
|---|---|
| `claude-api` | Code đúng phần gọi API (model id, streaming, tool use, caching) — llmGateway |
| `frontend-design`, `impeccable`, `webapp-testing` | Dựng UI đẹp, test giao diện |
| `spec-driven-development`, `planning-and-task-breakdown` | Viết spec + chia task |
| `superpowers` (systematic-debugging, verification-before-completion) | Debug + verify khi code |

SEO skills = để bán app sau này (landing), KHÔNG liên quan core.

---

## 4. Thứ tự cắm vào ĐỢT 1 (khớp 02-KE-HOACH-BUILD)

1. `agentRunner.ts` chạy 3 tầng → 2. `ideaAnalyst` + `scene-analysis.md` (bottom-up) → 3. bộ tool ghi DB → 4. viết `.md` cho `free/` (cắm skill Nhóm A) → 5. bê 1–2 style Toonflow → 6. reviewer A/B/C/D → 7. wizard 5 cổng → 8. validate BytePlus → 9. màn xuất.

**Test nghiệm thu:** ideal xuyên không (cổ trang → hiện đại) phải KHÔNG fail.

---

## 5. ĐỢT 1.5 — đã cắm thêm (TopView / Higgsfield / Coco + Nhóm A)

Bổ sung sau khi có UI wizard, KHÔNG cần key (chỉ chạy thật lúc demo):

| Thêm gì | Nguồn | File | Vào đâu |
|---|---|---|---|
| **personaBuilder** (target + góc cảm xúc) | Higgsfield + `20-customer-persona-builder`, `marketing-psychology` | `skills/free/_execution_persona.md` | bước **Chuẩn bị** (tiền-ideal, tùy chọn) |
| **researcher** (chống bịa + trend) | TopView intent-first + `06-market-researcher`, `research.agent`, `deep-research` | `skills/free/_execution_research.md` | bước **Chuẩn bị** (cạnh GATE 0) |
| Khung **Hook→Body→CTA** | Coco + `hook-generator`, `copywriting`, `reels-scripting` | `_execution_scriptwright.md` | GATE 1 (khi ideal hướng bán) |
| **motion-library** (palette camera) | TopView camera keywords + Higgsfield presets (Bullet Time/orbit/dolly/crane) | `skills/motion-library.md` | GATE 3 (layer vidPrompter) |
| **model-catalog** (validate tham số) | TopView `list-models` | `skills/model-catalog.md` | GATE 3 (layer vidPrompter) |
| Cú pháp **omni `<<<ImageN>>>`** | TopView omni | trong motion-library | GATE 3 khi Coco chạy Seedance 2.0 |
| tool **write_ideal_brief** + `ideal.brief` | — (đắp brief vào ideal) | `tools/index.ts`, `db.mergeIdealBrief` | Chuẩn bị |

**Chưa cắm (đợt sau, cần render/API thật):** Video Analyzer (#12), Soul-train (#13), Virality (#15) — phụ thuộc video/API ngoài. `ad-creative`/`video` brief cho imgPrompter để đợt tinh chỉnh affiliate.
