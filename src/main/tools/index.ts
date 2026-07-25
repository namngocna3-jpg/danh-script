// ============================================================
// Danh Script — Bộ tool agent-thợ gọi được (mỏ #1)
// ❌ KHÔNG có generate_image/generate_video — điểm dừng của app.
// Mỗi tool: schema (cho LLM) + handler (chạy thật, ghi DB).
// ============================================================
import type { ToolSchema } from '../core/llmGateway'
import * as db from '../db'
import type {
  SceneContext,
  VideoPrompt,
  StorySkeleton,
  AdaptationStrategy,
  DirectorPlan,
  DirectorBible,
  VisualSystem,
  AssetRole,
  DeriveKind
} from '../../shared/types'
import {
  assertSkeleton,
  assertDirectorPlan,
  assertDirectorBible,
  assertVideoPrompt,
  assertPlanShots,
  assertImagePrompt,
  assertShotPanel
} from './validators'
import { scanCraft, readCraftFile } from '../core/craftRegistry'
import { extractTags } from '../pipeline/tagGuard'

/**
 * Nối 1 block → các asset nó dùng, gộp 2 nguồn:
 *  · agent KHAI RÕ qua field associate_asset_tags (nếu có)
 *  · TỰ-BÙ: @tag nhúng trong chính chuỗi prompt (image/video)
 * Bỏ tag không khớp asset. An toàn nếu rỗng.
 */
function linkAssetsFromTags(
  projectId: number,
  blockId: number,
  declaredTags: string[] | undefined,
  promptText: string
): void {
  const tags = new Set<string>()
  for (const t of declaredTags ?? []) tags.add(t.replace(/^@/, '').toUpperCase())
  for (const t of extractTags(promptText)) tags.add(t)
  const ids = db.resolveTagsToAssetIds(projectId, [...tags])
  db.linkBlockAssets(blockId, ids)
}

/** Ngữ cảnh chạy tool: buộc trong 1 dự án. */
export interface ToolContext {
  projectId: number
}

export interface ToolDef {
  schema: ToolSchema
  // Handler có thể đồng bộ (ghi DB) HOẶC bất đồng bộ (điều phối: gọi agent con).
  handler: (input: Record<string, unknown>, ctx: ToolContext) => unknown | Promise<unknown>
}

// ---------------- Định nghĩa từng tool ----------------

const readIdeal: ToolDef = {
  schema: {
    name: 'read_ideal',
    description: 'Đọc ideal (ý tưởng gốc) + tham số của dự án hiện tại.',
    input_schema: { type: 'object', properties: {} }
  },
  handler: (_input, ctx) => {
    const p = db.getProject(ctx.projectId)
    if (!p) throw new Error('Không tìm thấy dự án')
    return {
      ideal: JSON.parse(p.ideal_json),
      params: p.params_json ? JSON.parse(p.params_json) : null,
      style_id: p.style_id,
      pipeline: p.pipeline
    }
  }
}

const readScenes: ToolDef = {
  schema: {
    name: 'read_scenes',
    description:
      'Đọc TẤT CẢ cảnh đã dựng của dự án (order, tóm tắt, narration, bối cảnh). Dùng để xem cái đã có TRƯỚC khi sửa — sửa = ghi lại đúng order_idx.',
    input_schema: { type: 'object', properties: {} }
  },
  handler: (_input, ctx) => {
    return db.listScenes(ctx.projectId).map((s) => ({
      order_idx: s.order_idx,
      summary: s.summary,
      narration_vi: s.narration_vi,
      scene_context: s.scene_context_json ? JSON.parse(s.scene_context_json) : null
    }))
  }
}

const readBlocks: ToolDef = {
  schema: {
    name: 'read_blocks',
    description:
      'Đọc TẤT CẢ block (shot_desc + prompt ảnh + prompt video) của dự án theo cảnh. shot_desc = ý đồ shot đã quy hoạch ở GATE 1 — img/vid bám vào đây. Dùng để xem cái đã có TRƯỚC khi sửa — sửa = ghi lại đúng scene_order/block_order.',
    input_schema: { type: 'object', properties: {} }
  },
  handler: (_input, ctx) => {
    const out: Array<{
      scene_order: number
      block_order: number
      shot_desc: string | null
      image_prompt_en: string | null
      video_prompt: unknown
      shot_panel: unknown
    }> = []
    for (const s of db.listScenes(ctx.projectId)) {
      for (const b of db.listBlocks(s.id)) {
        const shotPanelJson = (b as { shot_panel_json?: string | null }).shot_panel_json
        out.push({
          scene_order: s.order_idx,
          block_order: b.order_idx,
          shot_desc: b.shot_desc ?? null,
          image_prompt_en: b.image_prompt_en ?? null,
          video_prompt: b.video_prompt_json ? JSON.parse(b.video_prompt_json) : null,
          shot_panel: shotPanelJson ? JSON.parse(shotPanelJson) : null
        })
      }
    }
    return out
  }
}

const readAssets: ToolDef = {
  schema: {
    name: 'read_assets',
    description:
      '⭐ Đọc TẤT CẢ @tag tài nguyên đã tạo (nhân vật/sản phẩm/đạo cụ/BỐI CẢNH) + loại + mô tả khóa. ' +
      'Dùng TRƯỚC khi viết prompt để nhúng ĐÚNG @tag — nhất là @tag bối cảnh (type=scene) cho mọi cảnh cùng nơi chốn.',
    input_schema: { type: 'object', properties: {} }
  },
  handler: (_input, ctx) => {
    // ⭐ Trả kèm KHÓA CỨNG (mặt/dáng) + tóm tắt gen_prompt để worker khóa ngoại hình,
    //    không chỉ lock_note chung chung → chống nhân vật trôi mặt giữa các block.
    const full = db.listAssetsFull(ctx.projectId)
    const lockByTag = new Map(full.map((a) => [a.tag, a]))
    return db.projectTagMap(ctx.projectId).map((t) => {
      const a = lockByTag.get(t.tag)
      return {
        tag: `@${t.tag}`,
        role: t.role,
        lock_note: t.lock_note,
        identity_face: a?.identity_lock?.face || undefined,
        identity_body: a?.identity_lock?.body || undefined,
        appearance_hint: a?.gen_prompt ? a.gen_prompt.slice(0, 240) : undefined,
        has_ref_image: !!t.ref_image_path
      }
    })
  }
}

const writeSceneContext: ToolDef = {
  schema: {
    name: 'write_scene_context',
    description:
      '⭐ Ghi bối cảnh RIÊNG cho 1 cảnh (lớp B, bottom-up): thời đại/nơi/trang phục/đạo cụ/tông. Tạo cảnh nếu chưa có.',
    input_schema: {
      type: 'object',
      properties: {
        order_idx: { type: 'number', description: 'Thứ tự cảnh (1,2,3...)' },
        summary: { type: 'string', description: 'Tóm tắt cảnh (tiếng Việt)' },
        scene_context: {
          type: 'object',
          properties: {
            era: { type: 'string', description: 'Thời đại: cổ đại/hiện đại/tương lai...' },
            setting: { type: 'string' },
            wardrobe: { type: 'string' },
            props: { type: 'array', items: { type: 'string' } },
            mood: { type: 'string' }
          },
          required: ['era', 'setting', 'wardrobe', 'props', 'mood']
        }
      },
      required: ['order_idx', 'summary', 'scene_context']
    }
  },
  handler: (input, ctx) => {
    const id = db.upsertScene(
      ctx.projectId,
      input.order_idx as number,
      (input.summary as string) ?? '',
      undefined,
      input.scene_context as SceneContext
    )
    return { scene_id: id, ok: true }
  }
}

const writeIdealBrief: ToolDef = {
  schema: {
    name: 'write_ideal_brief',
    description:
      '⭐ Ghi brief tiền-ideal + "Ý đồ chốt" (GATE 0). target/góc cảm xúc (personaBuilder) + ghi chú research (researcher) + thông điệp lõi/mood/thể loại/độ dài (ideaAnalyst). Merge vào ideal, KHÔNG ghi đè ý tưởng gốc. Gọi lại để bổ sung/sửa từng trường.',
    input_schema: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'Chân dung đối tượng xem' },
        angle: { type: 'string', description: 'Góc cảm xúc chính' },
        triggers: {
          type: 'array',
          items: { type: 'string' },
          description: 'Trigger tâm lý (khan hiếm, bằng chứng xã hội...)'
        },
        core_message: { type: 'string', description: 'Thông điệp lõi 1 câu' },
        research_notes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Ngữ cảnh ngành/trend đã kiểm chứng'
        },
        claims_flagged: {
          type: 'array',
          items: { type: 'string' },
          description: 'Khẳng định bị gắn cờ ⚠ hoặc gỡ bỏ (kèm lý do)'
        },
        mood: {
          type: 'string',
          description: 'Tông/mood tổng thể video (VD: ấm áp hoài niệm, gấp gáp kịch tính)'
        },
        genre: {
          type: 'string',
          description: 'Thể loại gợi ý (VD: kể chuyện đời thường, quảng cáo cảm xúc, hài tình huống)'
        },
        duration_hint: {
          type: 'string',
          description: 'Độ dài dự kiến (VD: "30–45 giây, ~5 cảnh")'
        },
        output_intent: {
          type: 'string',
          description:
            'Ý đồ đầu ra — mô tả TỰ DO: kể chuyện thuần / có bán-chuyển đổi / lai. Mặc định nghiêng kể chuyện (không CTA); chỉ nêu mục tiêu thương mại + mức CTA khi ideal nói rõ bán hàng.'
        }
      }
    }
  },
  handler: (input, ctx) => {
    db.mergeIdealBrief(ctx.projectId, {
      target: input.target as string | undefined,
      angle: input.angle as string | undefined,
      triggers: input.triggers as string[] | undefined,
      core_message: input.core_message as string | undefined,
      research_notes: input.research_notes as string[] | undefined,
      claims_flagged: input.claims_flagged as string[] | undefined,
      mood: input.mood as string | undefined,
      genre: input.genre as string | undefined,
      duration_hint: input.duration_hint as string | undefined,
      output_intent: input.output_intent as string | undefined
    })
    return { ok: true }
  }
}

const planShots: ToolDef = {
  schema: {
    name: 'plan_shots',
    description:
      '⭐ QUY HOẠCH SHOT cho 1 cảnh (chạy TRƯỚC khi viết prompt ảnh/video). Tạo sẵn khung các block với ý đồ shot (góc/hành động/nội dung khung) — mỗi cảnh tối thiểu 1 block, block_order bắt đầu 1. imgPrompter/vidPrompter sẽ bám shot_desc này để KHÔNG bỏ sót block nào (chống block trống). Gọi lại để sửa mô tả shot của 1 block.',
    input_schema: {
      type: 'object',
      properties: {
        scene_order: { type: 'number' },
        shots: {
          type: 'array',
          description: 'Danh sách shot của cảnh, theo thứ tự. Mỗi phần tử = 1 block.',
          items: {
            type: 'object',
            properties: {
              block_order: { type: 'number', description: 'Thứ tự shot trong cảnh (1,2,3...)' },
              shot_desc: {
                type: 'string',
                description:
                  'Ý đồ shot: cỡ cảnh/góc máy + chủ thể + hành động + nội dung khung (tiếng Việt, gọn). VD "Close-up tay mở hộp, sản phẩm lộ ra".'
              }
            },
            required: ['block_order', 'shot_desc']
          }
        }
      },
      required: ['scene_order', 'shots']
    }
  },
  handler: (input, ctx) => {
    assertPlanShots(input)
    const sceneOrder = input.scene_order as number
    const shots = (input.shots as Array<{ block_order: number; shot_desc: string }>) ?? []
    const ids: number[] = []
    for (const sh of shots) {
      ids.push(
        db.upsertBlock(ctx.projectId, sceneOrder, sh.block_order, { shot_desc: sh.shot_desc })
      )
    }
    return { scene_order: sceneOrder, blocks: ids.length, ok: true }
  }
}

const readCoverage: ToolDef = {
  schema: {
    name: 'read_coverage',
    description:
      '⭐ Kiểm tra ĐỘ PHỦ: liệt kê cảnh CHƯA có block nào + block thiếu (shot/ảnh/video). Dùng để đảm bảo không bỏ sót trước khi chốt cổng. gaps rỗng + scenesNoBlock rỗng = đủ.',
    input_schema: { type: 'object', properties: {} }
  },
  handler: (_input, ctx) => db.coverageReport(ctx.projectId)
}

const writeSkeleton: ToolDef = {
  schema: {
    name: 'write_skeleton',
    description:
      '⭐ BƯỚC 1 của GATE 1: ghi KHUNG XƯƠNG cốt chuyện TRƯỚC khi viết lời thoại. ' +
      'Chốt logline + các nhịp chính (hook→thân→cao trào→kết) + đường cong cảm xúc + điểm trả bài. ' +
      'Đây là bộ khung để narration bám vào cho mạch dày, không rời rạc. Gọi lại để sửa.',
    input_schema: {
      type: 'object',
      properties: {
        logline: {
          type: 'string',
          description: '1 câu tóm cả chuyện: ai · muốn gì · cản trở/điều bất ngờ gì.'
        },
        beats: {
          type: 'array',
          description: 'Các nhịp chính theo trình tự.',
          items: {
            type: 'object',
            properties: {
              order: { type: 'number', description: 'Thứ tự nhịp (1,2,3...)' },
              role: {
                type: 'string',
                description: 'Vai trò nhịp: hook | thiết lập | xung đột | cao trào | giải quyết | CTA...'
              },
              summary: { type: 'string', description: 'Nội dung nhịp (tiếng Việt, gọn)' },
              scene_hint: {
                type: 'string',
                description: 'Gợi ý nhịp rơi vào cảnh nào (VD "cảnh 1-2"). Tùy chọn.'
              }
            },
            required: ['order', 'role', 'summary']
          }
        },
        emotional_arc: {
          type: 'string',
          description: 'Đường cong cảm xúc xuyên video (VD "tò mò → căng → vỡ oà → nhẹ nhõm").'
        },
        payoff: { type: 'string', description: 'Điểm trả bài / cú chốt khán giả chờ.' }
      },
      required: ['logline', 'beats']
    }
  },
  handler: (input, ctx) => {
    assertSkeleton(input)
    const skeleton: StorySkeleton = {
      logline: input.logline as string,
      beats: (input.beats as StorySkeleton['beats']) ?? [],
      emotional_arc: input.emotional_arc as string | undefined,
      payoff: input.payoff as string | undefined
    }
    db.savePlanArtifact(ctx.projectId, 'skeleton', skeleton)
    return { ok: true, beats: skeleton.beats.length }
  }
}

const writeAdaptation: ToolDef = {
  schema: {
    name: 'write_adaptation',
    description:
      '⭐ BƯỚC 2 của GATE 1 (sau khung xương, trước lời thoại): ghi CHIẾN LƯỢC CHUYỂN THỂ — ' +
      'biến ideal trừu tượng thành hành động/hình ảnh CỤ THỂ camera quay được (chống "kể chay"). ' +
      'Gồm hướng chuyển thể tổng + các phép "cho xem đừng kể" + motif hình + tông + cạm bẫy. Gọi lại để sửa.',
    input_schema: {
      type: 'object',
      properties: {
        approach: {
          type: 'string',
          description: 'Hướng chuyển thể tổng (VD "kể qua 1 ngày của nhân vật", "cấu trúc trước/sau").'
        },
        show_dont_tell: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Các phép "cho xem thay vì kể": mỗi phần tử = thông điệp trừu tượng → hành động/hình ảnh cụ thể. VD "sản phẩm tiện lợi → cảnh tay pha xong ly cà phê trong 5 giây".'
        },
        visual_motifs: {
          type: 'array',
          items: { type: 'string' },
          description: 'Motif hình lặp lại giữ mạch (màu/vật/động tác biểu tượng). Tùy chọn.'
        },
        tone: { type: 'string', description: 'Tông tổng thể (ấm áp/kịch tính/hài...).' },
        pitfalls: {
          type: 'array',
          items: { type: 'string' },
          description: 'Cạm bẫy cần né khi viết lời thoại/dựng cảnh. Tùy chọn.'
        }
      },
      required: ['approach', 'show_dont_tell']
    }
  },
  handler: (input, ctx) => {
    const strat: AdaptationStrategy = {
      approach: input.approach as string,
      show_dont_tell: (input.show_dont_tell as string[]) ?? [],
      visual_motifs: input.visual_motifs as string[] | undefined,
      tone: input.tone as string | undefined,
      pitfalls: input.pitfalls as string[] | undefined
    }
    db.savePlanArtifact(ctx.projectId, 'adaptation', strat)
    return { ok: true }
  }
}

const readPlan: ToolDef = {
  schema: {
    name: 'read_plan',
    description:
      '⭐ Đọc lại KHUNG XƯƠNG + CHIẾN LƯỢC CHUYỂN THỂ đã ghi (GATE 1). ' +
      'Dùng để bám khung khi viết/sửa narration, hoặc để các cổng sau hiểu mạch chuyện. null = chưa dựng.',
    input_schema: { type: 'object', properties: {} }
  },
  handler: (_input, ctx) => db.getPlanArtifacts(ctx.projectId)
}

const writeScript: ToolDef = {
  schema: {
    name: 'write_script',
    description: 'Ghi narration/lời thoại (tiếng Việt) cho 1 cảnh đã có.',
    input_schema: {
      type: 'object',
      properties: {
        order_idx: { type: 'number' },
        narration_vi: { type: 'string' }
      },
      required: ['order_idx', 'narration_vi']
    }
  },
  handler: (input, ctx) => {
    const id = db.upsertScene(
      ctx.projectId,
      input.order_idx as number,
      undefined,
      input.narration_vi as string,
      undefined
    )
    return { scene_id: id, ok: true }
  }
}

const saveAsset: ToolDef = {
  schema: {
    name: 'save_asset',
    description:
      '⭐ Lưu tài nguyên để nhúng @tag vào prompt. 4 loại:\n' +
      "• 'char' = nhân vật (khóa CỨNG mặt/dáng ở identity_lock, MỀM đồ/tóc)\n" +
      "• 'product' = sản phẩm cần quảng bá (khóa hình dạng/nhãn)\n" +
      "• 'prop' = đạo cụ phụ xuất hiện lặp lại\n" +
      "• 'scene' = ⭐ BỐI CẢNH/địa điểm (quán, phòng, phố...). Dùng identity_lock.face để tả TỔNG THỂ nơi chốn (kiến trúc/bố cục/chất liệu/không khí, KHÔNG người), body để trống. Mọi cảnh cùng địa điểm nhúng chung 1 @tag scene để nhất quán.\n" +
      'Trả về @tag để dùng trong prompt.',
    input_schema: {
      type: 'object',
      properties: {
        tag: {
          type: 'string',
          description: 'Tên tag VIẾT HOA không dấu, VD ADIL, REMOTE, QUANCAFE, PHONGNGU'
        },
        type: { type: 'string', enum: ['char', 'product', 'prop', 'scene'] },
        name: { type: 'string' },
        identity_lock: {
          type: 'object',
          properties: {
            face: {
              type: 'string',
              description:
                'Với char: mô tả khuôn mặt. Với scene: mô tả TỔNG THỂ bối cảnh (kiến trúc/bố cục/chất liệu/ánh sáng chủ đạo, KHÔNG có người).'
            },
            body: {
              type: 'string',
              description: 'Với char: vóc dáng. Với scene/product/prop: để trống.'
            }
          }
        }
      },
      required: ['tag', 'type', 'name']
    }
  },
  handler: (input, ctx) => {
    const id = db.saveAsset(ctx.projectId, {
      tag: input.tag as string,
      type: input.type as 'char' | 'product' | 'prop' | 'scene',
      name: input.name as string,
      identity_lock: input.identity_lock as { face: string; body: string } | undefined
    })
    return { asset_id: id, tag: `@${input.tag}`, ok: true }
  }
}

const writeImagePrompt: ToolDef = {
  schema: {
    name: 'write_image_prompt',
    description:
      '⭐ Ghi prompt ẢNH khung đầu (tiếng Anh) cho 1 block. Nhúng @tag nhân vật/đạo cụ + câu "comes from the @X reference and stays identical across the take".',
    input_schema: {
      type: 'object',
      properties: {
        scene_order: { type: 'number' },
        block_order: { type: 'number' },
        image_prompt_en: { type: 'string' },
        associate_asset_tags: {
          type: 'array',
          description:
            '⭐ Danh sách @tag nguyên liệu/biến thể block này DÙNG (không kèm @). App lưu bảng nối block↔asset để bước video/export biết đích danh ảnh tư liệu. Nếu bỏ trống, app tự trích @tag từ prompt.',
          items: { type: 'string' }
        }
      },
      required: ['scene_order', 'block_order', 'image_prompt_en']
    }
  },
  handler: (input, ctx) => {
    assertImagePrompt(input)
    const promptText = input.image_prompt_en as string
    const id = db.upsertBlock(
      ctx.projectId,
      input.scene_order as number,
      input.block_order as number,
      { image_prompt_en: promptText }
    )
    linkAssetsFromTags(ctx.projectId, id, input.associate_asset_tags as string[] | undefined, promptText)
    return { block_id: id, ok: true }
  }
}

const writeVideoPrompt: ToolDef = {
  schema: {
    name: 'write_video_prompt',
    description:
      '⭐ Ghi prompt VIDEO cho 1 block. QUAN TRỌNG (image-to-video): ảnh GATE 2 của block này = KHUNG ĐẦU đã có sẵn nhân vật/bối cảnh/trang phục — prompt video chỉ LÀM ĐỘNG nó, KHÔNG dựng lại cảnh từ đầu. STYLE = chất liệu (không thời đại). SCENE = CHỈ tả thay đổi/diễn biến so với khung đầu, KHÔNG tả lại ngoại hình/bối cảnh/trang phục đã đứng yên trong ảnh; nhúng @tag. MOTION mang tải chính (camera + chuyển động chủ thể). CONSTRAINTS = ràng buộc POSITIVE cho Seedance (sharp focus, five fingers, stable face...) — engine BytePlus đọc cái này thay negative. TEXT_OVERLAY = chữ CTA/giá tiếng Việt chính xác dán ở khâu dựng (trống nếu block không cần chữ). Target BytePlus.',
    input_schema: {
      type: 'object',
      properties: {
        scene_order: { type: 'number' },
        block_order: { type: 'number' },
        style: { type: 'string' },
        scene: {
          type: 'string',
          description:
            '⭐ MỞ ĐẦU BẮT BUỘC bằng "@Image1 as the first frame;" — ảnh KHUNG ĐẦU = ảnh ĐÃ RENDER của CHÍNH block này ở GATE 2 (VD ảnh Cảnh 1.1), KHÔNG phải ảnh nguyên liệu thô. Sau đó CHỈ mô tả CHUYỂN ĐỘNG & THAY ĐỔI so với khung đầu; nhúng @tag nhân vật/sản phẩm ĐANG diễn để khóa danh tính. CẤM tả lại mặt/dáng/bối cảnh/trang phục đã đứng yên trong ảnh. Ngắn gọn, nhường tải cho MOTION.'
        },
        motion: {
          type: 'string',
          description:
            'Mang tải chính. Cho phép 1–3 shot (CUT-by-CUT) nối bằng "Cut to"/"Lens switch to" hoặc nhãn Shot 1/2/3, tối đa 3 cắt (mọi thể loại video); mỗi shot = 1 lens/FOV + 1 camera move + 1 subject beat, cùng khóa @tag để không drift. One-take → "No cuts throughout". Tả tư thế START→END cụ thể + 1 chi tiết vật lý (weight shift/uncoil/momentum); CẤM động từ mơ hồ (chạy/cầm/vung). Kèm degree adverb (slowly/explosively...).'
        },
        audio: { type: 'string' },
        constraints: {
          type: 'string',
          description:
            'Ràng buộc POSITIVE cho Seedance (câu khẳng định thay cho negative): sharp focus, five fingers, natural anatomy, stable face, consistent outfit within the scene... ⭐ CÁCH B (khóa danh tính khi có ảnh khung đầu): THÊM câu "preserve @LAN face and outfit exactly, 100% matches the reference" + positive lock riêng block: nhắc lại danh tính @tag + vị trí + SỐ LƯỢNG vật/người (VD "exactly one bottle of @SERUM, label faces camera, @LAN stays on the left"). Block động mạnh/nhiều cut → khóa đậm hơn.'
        },
        negative: { type: 'string' },
        text_overlay: {
          type: 'string',
          description:
            'Chữ CTA/giá tiếng Việt CHÍNH XÁC để dán ở khâu dựng (CapCut). Trống nếu block không cần chữ. KHÔNG bắt AI render chữ dài — chỉ ghi nội dung chữ ra đây.'
        },
        tags: {
          type: 'array',
          description: 'Danh sách @tag dùng trong prompt (không kèm @)',
          items: { type: 'string' }
        }
      },
      required: ['scene_order', 'block_order', 'style', 'scene', 'motion']
    }
  },
  handler: (input, ctx) => {
    assertVideoPrompt(input)
    const tagNames = (input.tags as string[]) ?? []
    const vp: VideoPrompt = {
      style: input.style as string,
      scene: input.scene as string,
      motion: input.motion as string,
      audio: (input.audio as string) ?? '',
      constraints: (input.constraints as string) ?? '',
      negative: (input.negative as string) ?? '',
      text_overlay: (input.text_overlay as string) ?? '',
      tags: db.resolveTags(ctx.projectId, tagNames)
    }
    const id = db.upsertBlock(
      ctx.projectId,
      input.scene_order as number,
      input.block_order as number,
      { video_prompt_json: JSON.stringify(vp) }
    )
    linkAssetsFromTags(ctx.projectId, id, tagNames, `${input.scene as string} ${input.motion as string}`)
    return { block_id: id, ok: true }
  }
}

// ---------------- Nhóm KỊCH BẢN TÁCH BƯỚC (draft → skeleton → adaptation → script) ----------------

const writeDraft: ToolDef = {
  schema: {
    name: 'write_draft',
    description:
      '⭐ BƯỚC NHÁP: ghi KỊCH BẢN NHÁP/TẠM (tiếng Việt, gọn) để chốt HƯỚNG với người dùng trước khi làm chỉn chu. ' +
      'Chưa cần khung xương/thoại hoàn chỉnh — chỉ cần mạch chuyện + nhân vật + hướng kể để người dùng duyệt. Gọi lại để sửa cả bản.',
    input_schema: {
      type: 'object',
      properties: {
        draft: { type: 'string', description: 'Toàn văn kịch bản nháp (tiếng Việt).' }
      },
      required: ['draft']
    }
  },
  handler: (input, ctx) => {
    db.saveDraft(ctx.projectId, input.draft as string)
    return { ok: true }
  }
}

const readDraft: ToolDef = {
  schema: {
    name: 'read_draft',
    description: 'Đọc lại kịch bản nháp đã ghi (chuỗi rỗng nếu chưa có).',
    input_schema: { type: 'object', properties: {} }
  },
  handler: (_input, ctx) => ({ draft: db.loadDraft(ctx.projectId) })
}

const readScriptFull: ToolDef = {
  schema: {
    name: 'read_script_full',
    description:
      '⭐ Đọc TOÀN BỘ narration/lời thoại các cảnh đã viết (kịch bản final). ' +
      'assetDeriver dùng để TÁCH nguyên liệu TỪ kịch bản thật (không bịa).',
    input_schema: { type: 'object', properties: {} }
  },
  handler: (_input, ctx) =>
    db.listScenes(ctx.projectId).map((s) => ({
      order_idx: s.order_idx,
      summary: s.summary,
      narration_vi: s.narration_vi,
      scene_context: s.scene_context_json ? JSON.parse(s.scene_context_json) : null
    }))
}

// ---------------- Nhóm QUY HOẠCH ĐẠO DIỄN (gate_director) ----------------

const writeDirectorPlan: ToolDef = {
  schema: {
    name: 'write_director_plan',
    description:
      '⭐ QUY HOẠCH ĐẠO DIỄN (Toonflow director_plan): với MỖI cảnh — ĐẾM số câu + số chữ thoại, ' +
      'CHẤM cảm xúc chủ đạo + độ đậm 0–10, thiết kế chuyển cảnh sang cảnh sau. ' +
      'Chỉ TÁCH & phân tích từ kịch bản, KHÔNG sáng tạo nội dung mới (trừ mô tả chuyển cảnh). ' +
      'Số chữ thoại ước thời lượng ~4 chữ/giây. Gọi lại để sửa cả bảng.',
    input_schema: {
      type: 'object',
      properties: {
        scenes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              order: { type: 'number', description: 'Thứ tự cảnh (= order_idx)' },
              line_count: { type: 'number', description: 'Số câu thoại/VO trong cảnh' },
              char_count: { type: 'number', description: 'Tổng số chữ thoại (ước ~4 chữ/giây)' },
              emotion: {
                type: 'string',
                description: 'Cảm xúc chủ đạo, ghi X→Y nếu có chuyển (VD "tò mò → vỡ oà")'
              },
              emotion_intensity: { type: 'number', description: 'Độ đậm cảm xúc 0–10' },
              transition: {
                type: 'string',
                description: 'Thiết kế chuyển sang cảnh sau (cắt thẳng/mờ dần/match-cut...). Tùy chọn.'
              },
              note: { type: 'string', description: 'Lưu ý dựng cảnh riêng. Tùy chọn.' }
            },
            required: ['order', 'line_count', 'char_count', 'emotion', 'emotion_intensity']
          }
        },
        overall_note: { type: 'string', description: 'Lưu ý xuyên phim (nhịp tổng, motif chuyển cảnh).' }
      },
      required: ['scenes']
    }
  },
  handler: (input, ctx) => {
    assertDirectorPlan(input)
    const plan: DirectorPlan = {
      scenes: (input.scenes as DirectorPlan['scenes']) ?? [],
      overall_note: input.overall_note as string | undefined
    }
    db.saveDirectorPlan(ctx.projectId, plan)
    return { ok: true, scenes: plan.scenes.length }
  }
}

const writeDirectorBible: ToolDef = {
  schema: {
    name: 'write_director_bible',
    description:
      '⭐ HIẾN PHÁP THẨM MỸ (Director Bible): CÁ NHÂN HÓA gu đạo diễn (đã bơm sẵn vào system) cho ĐÚNG brief phim này. ' +
      'KHÔNG bịa cảnh/nhân vật (chưa có kịch bản) — chỉ định hướng thẩm mỹ TỔNG: màu/sáng/chất liệu/máy quay/cảm xúc-mặt/âm thanh/vật lý Seedance. ' +
      'Viết GỌN, mỗi field vài câu, sát brief (không chép nguyên persona). Gọi 1 lần; gọi lại để sửa cả bản.',
    input_schema: {
      type: 'object',
      properties: {
        logline_visual: { type: 'string', description: '1 câu: phim này TRÔNG như thế nào (không kể cốt truyện).' },
        color_script: { type: 'string', description: 'Bảng màu theo cung cảm xúc, áp brief này (mở→cao trào→kết).' },
        lighting: { type: 'string', description: 'Scheme ánh sáng chọn (nguồn/độ tương phản/hướng).' },
        texture: { type: 'string', description: 'Chất liệu/bề mặt nhấn (da/vải/kim loại/kính...). Tùy chọn.' },
        camera_language: {
          type: 'string',
          description: 'Ngôn ngữ máy + nhịp cắt (lens/FOV theo cảm xúc, CUT-by-CUT: cắt nhanh/chậm, Cut to/Lens switch to).'
        },
        emotion_face: { type: 'string', description: 'Map cảm xúc → mặt/mắt/hình thể diễn viên. Tùy chọn.' },
        sound_design: { type: 'string', description: 'Nhạc/ambient định hướng (nhịp/thể loại nhạc/tiếng nền). Tùy chọn.' },
        physics_notes: {
          type: 'string',
          description: 'Vật lý Seedance áp cho phim: quán tính/trọng tâm, khóa @tag chống drift, điểm hỏng giây 5–8.'
        },
        do_dont: {
          type: 'array',
          items: { type: 'string' },
          description: '3–6 điều NÊN/TRÁNH cụ thể phim này (mỗi dòng 1 điều). Tùy chọn.'
        }
      },
      required: ['logline_visual', 'color_script', 'lighting', 'camera_language', 'physics_notes']
    }
  },
  handler: (input, ctx) => {
    assertDirectorBible(input)
    const project = db.getProject(ctx.projectId)
    const bible: DirectorBible = {
      director_id: project?.director_id ?? '',
      logline_visual: input.logline_visual as string,
      color_script: input.color_script as string,
      lighting: input.lighting as string,
      texture: (input.texture as string) ?? '',
      camera_language: input.camera_language as string,
      emotion_face: (input.emotion_face as string) ?? '',
      sound_design: (input.sound_design as string) ?? '',
      physics_notes: input.physics_notes as string,
      do_dont: Array.isArray(input.do_dont) ? (input.do_dont as string[]) : []
    }
    db.saveDirectorBible(ctx.projectId, bible)
    return { ok: true, director_id: bible.director_id }
  }
}

// ---------------- Nhóm NGUYÊN LIỆU (gate_assets — Visual System) ----------------

const deriveAssets: ToolDef = {
  schema: {
    name: 'derive_assets',
    description:
      '⭐ TÁCH nguyên liệu GỐC từ kịch bản (hàng loạt). Mỗi mục = 1 @tag: nhân vật (char) / bối cảnh (scene) / ' +
      'đạo cụ (prop) / sản phẩm (product). Chỉ tách thứ XUẤT HIỆN trong kịch bản, "thà thiếu còn hơn thừa". ' +
      'Ghi gen_prompt luôn nếu đã dựng (prompt sinh ảnh gốc: char=4-view sheet, scene=1 ảnh sạch 1 góc KHÔNG người 16:9, prop=2×2). ' +
      'source=auto. Idempotent theo tag.',
    input_schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tag: { type: 'string', description: 'Tên tag VIẾT HOA không dấu (VD LINH, QUANCAFE, DIENTHOAI)' },
              type: { type: 'string', enum: ['char', 'prop', 'product', 'scene'] },
              name: { type: 'string', description: 'Tên gợi nhớ (tiếng Việt)' },
              gen_prompt: {
                type: 'string',
                description: 'Prompt tiếng Anh sinh ảnh nguyên liệu gốc (tùy chọn, có thể ghi sau bằng write_asset_prompt).'
              }
            },
            required: ['tag', 'type', 'name']
          }
        }
      },
      required: ['items']
    }
  },
  handler: (input, ctx) => {
    const items = (input.items as Array<{
      tag: string
      type: AssetRole
      name: string
      gen_prompt?: string
    }>) ?? []
    const n = db.deriveAssetsBatch(ctx.projectId, items)
    return { ok: true, count: n }
  }
}

const writeAssetPrompt: ToolDef = {
  schema: {
    name: 'write_asset_prompt',
    description:
      '⭐ Ghi PROMPT SINH ẢNH (tiếng Anh) cho 1 nguyên liệu GỐC theo @tag (điểm dừng: người dùng copy prompt → Coco tạo ảnh → upload về). ' +
      'Công thức: char = character sheet 4 view (cận chân dung + chính diện 0° + nghiêng 90° + sau lưng 180°), nền trắng ngà #F8F4E8, mặt mộc, khai báo chiều cao + tỉ lệ đầu-thân. ' +
      'scene = 1 ảnh establishing SẠCH, MỘT góc đại diện, KHÔNG người, 16:9 (cần nhiều góc/địa điểm → tách asset scene riêng hoặc derivative angle, KHÔNG ghép nhiều góc trong 1 ảnh). prop = lưới 2×2 (chính/nghiêng/sau/cận), không tay/người.',
    input_schema: {
      type: 'object',
      properties: {
        tag: { type: 'string', description: 'Tag nguyên liệu gốc (không kèm @)' },
        gen_prompt: { type: 'string', description: 'Prompt tiếng Anh sinh ảnh nguyên liệu.' }
      },
      required: ['tag', 'gen_prompt']
    }
  },
  handler: (input, ctx) => {
    db.saveAssetPromptByTag(ctx.projectId, input.tag as string, input.gen_prompt as string)
    return { ok: true }
  }
}

const saveDerivedAssetTool: ToolDef = {
  schema: {
    name: 'save_derived_asset',
    description:
      '⭐ Tạo 1 nguyên liệu PHÁI SINH trỏ về asset gốc (luật Toonflow). ' +
      'Nhân vật: chỉ biến thể trạng thái/trang phục (wardrobe|state). Bối cảnh: chỉ biến thể thời gian/thời tiết (time|weather). ' +
      'Đạo cụ: KHÔNG phái sinh. Mỗi gốc 1–5 phái sinh, "thà thiếu còn hơn thừa". ' +
      'gen_prompt là img2img giữ mặt/dáng gốc, chỉ đổi lớp biến thể.',
    input_schema: {
      type: 'object',
      properties: {
        parent_tag: { type: 'string', description: 'Tag asset gốc (không kèm @)' },
        derive_kind: {
          type: 'string',
          enum: ['wardrobe', 'state', 'time', 'weather', 'angle'],
          description: 'Loại biến thể. char→wardrobe/state, scene→time/weather.'
        },
        name: { type: 'string', description: 'Tên biến thể ngắn (VD "Áo mưa", "Đêm mưa")' },
        gen_prompt: { type: 'string', description: 'Prompt sinh ảnh biến thể (giữ nhất quán gốc).' }
      },
      required: ['parent_tag', 'derive_kind', 'name']
    }
  },
  handler: (input, ctx) => {
    const id = db.saveDerivedAsset(ctx.projectId, {
      parentTag: input.parent_tag as string,
      deriveKind: input.derive_kind as DeriveKind,
      name: input.name as string,
      gen_prompt: input.gen_prompt as string | undefined
    })
    return { ok: true, asset_id: id }
  }
}

const writeVisualSystem: ToolDef = {
  schema: {
    name: 'write_visual_system',
    description:
      '⭐ Ghi HỆ THỐNG THỊ GIÁC toàn phim (Toonflow Bước 1.4): Color Script (tone màu + cảm xúc từng cảnh, ' +
      'tương phản, độ bão hòa) + thiết kế ánh sáng + chất liệu chủ đạo. Giữ tông nhất quán khi sinh ảnh nguyên liệu. Gọi lại để sửa.',
    input_schema: {
      type: 'object',
      properties: {
        color_script: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scene_order: { type: 'number' },
              palette: { type: 'string', description: 'Màu chủ đạo (VD "cam hoàng hôn ấm, bóng tím")' },
              emotion: { type: 'string', description: 'Cảm xúc gắn với màu' },
              contrast: { type: 'string', description: 'Tương phản (cao/thấp). Tùy chọn.' },
              saturation: { type: 'string', description: 'Độ bão hòa (rực/trầm). Tùy chọn.' }
            },
            required: ['scene_order', 'palette', 'emotion']
          }
        },
        lighting: { type: 'string', description: 'Thiết kế ánh sáng tổng (nguồn sáng, tương phản).' },
        texture: { type: 'string', description: 'Chất liệu/bề mặt chủ đạo (da/vải/kim loại/gỗ/đá).' },
        palette_note: { type: 'string', description: 'Bảng màu tổng + emotional palette.' }
      },
      required: ['color_script']
    }
  },
  handler: (input, ctx) => {
    const vs: VisualSystem = {
      color_script: (input.color_script as VisualSystem['color_script']) ?? [],
      lighting: input.lighting as string | undefined,
      texture: input.texture as string | undefined,
      palette_note: input.palette_note as string | undefined
    }
    db.saveVisualSystem(ctx.projectId, vs)
    return { ok: true, entries: vs.color_script.length }
  }
}

const readAssetCoverage: ToolDef = {
  schema: {
    name: 'read_asset_coverage',
    description:
      '⭐ Soát ĐỘ PHỦ nguyên liệu: liệt kê @tag thiếu prompt sinh ảnh / thiếu ảnh đã upload. ' +
      'Dùng để không bỏ sót trước khi chốt cổng Nguyên liệu. missingPrompt rỗng = đủ prompt.',
    input_schema: { type: 'object', properties: {} }
  },
  handler: (_input, ctx) => db.assetCoverage(ctx.projectId)
}

// ---------------- Craft tự-rút (progressive-disclosure) ----------------

const listSkills: ToolDef = {
  schema: {
    name: 'list_skills',
    description:
      'Liệt kê KHO CRAFT khả dụng cho dự án (theo phong cách + thể loại đã chọn): tên · mô tả · path. ' +
      'Dùng khi cần xem có "vốn nghề" chiều sâu nào để rút. Sau đó gọi read_skill_file(path) để đọc toàn văn.',
    input_schema: { type: 'object', properties: {} }
  },
  handler: (_input, ctx) => {
    const p = db.getProject(ctx.projectId)
    if (!p) throw new Error('Không tìm thấy dự án')
    let genre: string | null = null
    try {
      if (p.params_json) genre = (JSON.parse(p.params_json) as { genre?: string }).genre ?? null
    } catch {
      /* params hỏng → bỏ genre */
    }
    const craft = scanCraft().filter((c) => {
      if (c.axis === 'common') return true
      if (c.axis === 'art') return c.relPath === `styles/${p.style_id}/craft.md`
      if (c.axis === 'story') return Boolean(genre) && c.relPath === `genres/${genre}.md`
      return false
    })
    return {
      skills: craft.map((c) => ({
        name: c.name,
        description: c.description,
        axis: c.axis,
        path: c.relPath
      }))
    }
  }
}

const readSkillFileTool: ToolDef = {
  schema: {
    name: 'read_skill_file',
    description:
      'Đọc TOÀN VĂN 1 craft trong kho theo path (VD "styles/2d_flat_design/craft.md" hoặc ' +
      '"genres/sales-affiliate-review.md" hoặc "craft/skeleton-beats.md"). Chỉ đọc file .md trong skills/.',
    input_schema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'Đường dẫn tương đối trong skills/' } },
      required: ['path']
    }
  },
  handler: (input) => {
    const path = String(input.path || '').trim()
    if (!path) throw new Error('Thiếu path')
    return { path, content: readCraftFile(path) }
  }
}

// ---------------- Nhóm PHÂN CẢNH CHI TIẾT (shot panel — sau Nguyên liệu) ----------------

const writeShotPanel: ToolDef = {
  schema: {
    name: 'write_shot_panel',
    description:
      'Ghi KHỐI PHÂN CẢNH CHI TIẾT cho từng shot của 1 cảnh (bước Phân cảnh, SAU Nguyên liệu). ' +
      'Mỗi block = 1 shot: cỡ cảnh/góc/camera/Start→End+vật lý/duration≤8s/@tag. asset_tags trỏ @tag CÓ THẬT → tự ghi block_assets. ' +
      'Không bịa @tag; duration mỗi shot ≤8s (điểm hỏng Seedance 5–8s).',
    input_schema: {
      type: 'object',
      properties: {
        scene_order: { type: 'number', description: 'Thứ tự cảnh (order_idx).' },
        blocks: {
          type: 'array',
          description: 'Mảng shot của cảnh này (mỗi phần tử 1 block/shot).',
          items: {
            type: 'object',
            properties: {
              block_order: { type: 'number', description: 'Thứ tự block trong cảnh (bắt đầu 1).' },
              shot_size: { type: 'string', description: 'close-up | medium | wide | extreme wide...' },
              camera_angle: { type: 'string', description: 'eye-level | low angle | high angle | over-shoulder...' },
              camera_move: { type: 'string', description: 'static | pan left | dolly in | orbit...' },
              subject: { type: 'string', description: 'Chủ thể + @tag dùng trong shot.' },
              action_start: { type: 'string', description: 'Tư thế/trạng thái ĐẦU.' },
              action_end: { type: 'string', description: 'Tư thế/trạng thái CUỐI + 1 chi tiết vật lý.' },
              layout: { type: 'string', description: 'Map bố trí không gian khi ≥2 vật (tùy chọn).' },
              cuts: { type: 'string', description: 'CUT-by-CUT nếu shot nhiều cắt (tùy chọn).' },
              duration_sec: { type: 'number', description: 'Ước tính thời lượng shot, ≤8s.' },
              asset_tags: {
                type: 'array',
                items: { type: 'string' },
                description: '@tag nguyên liệu dùng trong shot (ghi vào block_assets).'
              },
              notes: { type: 'string', description: 'Ý đồ cảm xúc/ánh sáng của shot (tùy chọn).' }
            },
            required: [
              'block_order',
              'shot_size',
              'camera_angle',
              'camera_move',
              'subject',
              'action_start',
              'action_end',
              'duration_sec'
            ]
          }
        }
      },
      required: ['scene_order', 'blocks']
    }
  },
  handler: (input, ctx) => {
    assertShotPanel(input)
    const sceneOrder = input.scene_order as number
    const blocks = input.blocks as Array<Record<string, unknown>>
    for (const b of blocks) {
      const blockOrder = b.block_order as number
      const panel = {
        shot_size: b.shot_size,
        camera_angle: b.camera_angle,
        camera_move: b.camera_move,
        subject: b.subject,
        action_start: b.action_start,
        action_end: b.action_end,
        layout: b.layout ?? null,
        cuts: b.cuts ?? null,
        duration_sec: b.duration_sec,
        asset_tags: Array.isArray(b.asset_tags) ? b.asset_tags : [],
        notes: b.notes ?? null
      }
      const id = db.upsertBlock(ctx.projectId, sceneOrder, blockOrder, {
        shot_panel_json: JSON.stringify(panel)
      })
      // Gán @tag → block_assets (đúng pattern write_image_prompt/write_video_prompt:
      // upsertBlock trả block.id → linkAssetsFromTags(projectId, blockId, tags, text)).
      const declaredTags = (panel.asset_tags as unknown[]).map(String)
      const panelText = [panel.subject, panel.action_start, panel.action_end, panel.layout, panel.cuts]
        .filter(Boolean)
        .join(' ')
      linkAssetsFromTags(ctx.projectId, id, declaredTags, panelText)
    }
    return { ok: true, scene_order: sceneOrder, count: blocks.length }
  }
}

// ---------------- Registry ----------------

export const ALL_TOOLS: ToolDef[] = [
  readIdeal,
  readScenes,
  readBlocks,
  readAssets,
  readCoverage,
  readPlan,
  writeIdealBrief,
  writeSceneContext,
  writeSkeleton,
  writeAdaptation,
  planShots,
  writeShotPanel,
  writeScript,
  saveAsset,
  writeImagePrompt,
  writeVideoPrompt,
  // kịch bản tách bước
  writeDraft,
  readDraft,
  readScriptFull,
  // đạo diễn
  writeDirectorPlan,
  writeDirectorBible,
  // nguyên liệu
  deriveAssets,
  writeAssetPrompt,
  saveDerivedAssetTool,
  writeVisualSystem,
  readAssetCoverage,
  // craft tự-rút (progressive-disclosure)
  listSkills,
  readSkillFileTool
]

/** Lọc tool theo tên (mỗi agent-thợ chỉ được cấp 1 nhóm tool). */
export function toolsFor(names: string[]): ToolDef[] {
  return ALL_TOOLS.filter((t) => names.includes(t.schema.name))
}

export function schemasOf(defs: ToolDef[]): ToolSchema[] {
  return defs.map((d) => d.schema)
}

export function findTool(defs: ToolDef[], name: string): ToolDef | undefined {
  return defs.find((d) => d.schema.name === name)
}
