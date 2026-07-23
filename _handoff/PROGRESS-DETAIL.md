# PROGRESS DETAIL — Bảng done/chưa-done theo TỪNG file
> Soi thực tế bằng `wc -l` + đọc từng file ngày 23/07/2026.
> Dùng để agent mới biết CHÍNH XÁC còn phải đụng file nào.

---

## MẢNG 1 — Markdown rendering · ✅ XONG
| File | Trạng thái |
|---|---|
| `src/renderer/src/ui/wizard/Markdown.tsx` | ✅ Đã tạo (component dùng chung) |
| `GateChatPanel.tsx` | ✅ Áp Markdown (bong bóng assistant) |
| `OrchestratorPanel.tsx` | ✅ Áp Markdown |
| `PrepPanel.tsx` | ✅ Áp Markdown (SummaryCard) |
| `ReviewBadge.tsx` | ✅ `<pre>` → `<Markdown>` |
| `GateRunner.tsx` | ✅ Summary thợ dùng Markdown |
| `Gate0Panel.tsx` | ✅ Summary dùng Markdown |
| `ExportPanel.tsx` | ✅ Giữ raw prompt (đúng — cần copy nguyên văn) |
| `package.json` | ✅ Có `react-markdown` + `remark-gfm` |

## MẢNG 2 — GATE 0 = ý đồ · ✅ XONG
| File | Trạng thái |
|---|---|
| `skills/free/_execution_ideaAnalyst.md` (95 dòng) | ✅ Viết lại: làm rõ ý đồ, KHÔNG phân cảnh |
| `src/main/pipeline/gate0.ts` | ✅ Chỉ ghi `brief`, tools = `[read_ideal, write_ideal_brief]` |
| `Gate0Result` | ✅ Shape mới `{ summary, brief, steps }` |
| `Gate0Panel.tsx` | ✅ Hiện "Ý đồ chốt" (BriefField), không list cảnh |
| `gateChat.ts` `gate0_ideal` | ✅ Kickoff hỏi–chốt ý đồ; `write_scene_context` dời sang `gate1d_script` |
| `gates.ts` `snapshotForGate('gate0_ideal')` | ✅ Đọc `ideal.brief`, không đọc scenes |

## MẢNG 4 — Đọc toàn văn · ✅ XONG
| Chỗ | Trạng thái |
|---|---|
| `gates.ts` `scenesDigest()` | ✅ ĐÃ XÓA |
| `gates.ts` `GateBuildCtx.scenes` | ✅ ĐÃ XÓA (chỉ còn `idealRaw`) |
| `gates.ts` import `Scene`/`SceneContext` | ✅ ĐÃ XÓA (unused) |
| Mọi `buildPrompt` trong `GATES` | ✅ `() =>` ép "BƯỚC 1 BẮT BUỘC: read_*" |
| `gateChat.ts` kickoff các gate | ✅ Ép `read_ideal`/`read_draft`/`read_plan`/`read_script_full` bước 1 |
| `npm run typecheck` | ✅ EXIT=0 (đã chạy sau Mảng 4) |

## MẢNG 5 — Reviewer · ✅ XONG
| Chỗ | Trạng thái |
|---|---|
| `skills/reviewer.md` (89 dòng) | ✅ 3 lớp chấm + RED-LINE stage mới (RI1-3/RK1-4/RA1-4/RV1-4) + "⭐ PHANH ĐỘ ĐẦY ĐỦ KHUNG OUTPUT" + tiêu chí chất lượng từng gate |
| `gates.ts` `snapshotForGate` | ✅ Có mọi case: gate0_ideal, gate1a/1b/1c, gate_director, gate_assets, gate1d/gate1_script, gate2/gate3 |
| ⚠️ Lưu ý | Phanh liệt kê "mục bắt buộc" của gate_assets/gate2/gate3 — nhưng 3 THỢ đó CHƯA có `## Khung output bắt buộc` (Mảng 3) → phanh chưa cắn đủ. Xong Mảng 3 thì Mảng 5 mới phát huy 100%. |

## MẢNG 3 — Viết lại 9 thợ + 3 craft · ⚠️ CHƯA XONG (6/9 thợ)

### Thợ khối KỊCH BẢN · ✅ 6/6 xong
| File | Dòng | Khung 7 phần? |
|---|---|---|
| `_execution_ideaAnalyst.md` | 95 | ✅ |
| `_execution_scriptDraft.md` | 93 | ✅ |
| `_execution_skeletonWright.md` | 105 | ✅ (mẫu chuẩn) |
| `_execution_adaptWright.md` | 111 | ✅ |
| `_execution_scriptFinal.md` | 135 | ✅ (mẫu chuẩn) |
| `_execution_directorPlanner.md` | 109 | ✅ (mẫu chuẩn) |

### Thợ khối NGUYÊN LIỆU + PROMPT · ❌ 0/3 xong
| File | Dòng | Khung 7 phần? | Ghi chú |
|---|---|---|---|
| `_execution_assetDeriver.md` | 44 | ❌ khung cũ | Nội dung nghề ĐÃ có (4-view/L0-L5/thà thiếu hơn thừa). Cần TÁI CẤU TRÚC + thêm `## Công cụ` bảng, `## Skills` đánh số, `## Khung output bắt buộc`. |
| `_execution_imgPrompter.md` | 61 | ❌ khung cũ | Nội dung nghề DÀY (6-phần, @reference, tách người khỏi cảnh). Chỉ tái cấu trúc + thêm template output. |
| `_execution_vidPrompter.md` | 75 | ❌ khung cũ | Nội dung DÀY (7 trường, negative→constraints, i2v). Chỉ tái cấu trúc + template output. |

### Craft skills (dùng chung)
| File | Dòng | Trạng thái |
|---|---|---|
| `skills/storyboard-craft.md` | 157 | ✅ Đủ dày (đã bổ sung luật 3 đoạn + phân bổ độ dài) |
| `skills/asset-prompt-craft.md` | 83 | ⚠️ Cần đọc xác nhận đủ 4-view/#F8F4E8/L0-L5/2×2 (có vẻ đủ) |
| `skills/visual-system.md` | 34 | ❌ Mỏng — viết sâu theo `director_planning_style.md` (Color Script bảng có tên+vai trò, hệ ánh sáng nhiều phương án, texture) |

---

## THỨ TỰ LÀM TIẾP (tuần tự)
1. `_execution_assetDeriver.md` → khung 7 phần (QUAN TRỌNG NHẤT — để reviewer phanh cắn được gate_assets).
2. `_execution_imgPrompter.md` → khung 7 phần.
3. `_execution_vidPrompter.md` → khung 7 phần.
4. `visual-system.md` → viết sâu.
5. Đọc xác nhận `asset-prompt-craft.md` (đủ thì thôi).
6. `npm run typecheck` → `npm run build` → `npm run dev` (Danh test E2E).

## MẪU COPY CẤU TRÚC
Khi viết lại 3 thợ, MỞ `skills/free/_execution_scriptFinal.md` hoặc `_execution_directorPlanner.md` xem cách bố trí 7 phần chuẩn rồi làm theo. Giữ NGUYÊN nội dung nghề đang có, chỉ đóng gói lại + thêm `## Khung output bắt buộc`.
