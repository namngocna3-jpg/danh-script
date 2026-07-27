// ============================================================
// Danh Script — Engine hội thoại tinh chỉnh từng GATE (dùng chung 4 cổng)
// Mỗi cổng = linh hồn thợ + lớp skill + lớp _chat_protocol + history hội thoại.
// Agent HỎI khi thiếu, SỬA đúng chỗ khi được yêu cầu; không tự "qua cổng".
// ============================================================
import { runAgent, type AgentStep } from '../core/agentRunner'
import {
  loadExecutionSkill,
  readSkillOptional,
  composeSystem,
  injectStyleAnchor,
  injectOutputIntent,
  loadDirectorPersona
} from '../core/skillLoader'
import { toolsFor } from '../tools'
import { workerSpec } from './workerSpecs'
import { availableCraftFor, availableSkillsPrompt } from '../core/craftRegistry'
import { extractTags, checkTagsExist } from './tagGuard'
import { buildAnchorBlock, buildDynamicBlock, hasLock } from '../../shared/anchor'
import {
  getProject,
  loadGateChat,
  saveGateChat,
  updateProjectStage,
  coverageReport,
  assetCoverage,
  listScenes,
  listBlocks,
  latestReviews,
  getPlanArtifacts,
  listAssetsFull,
  identityDriftReport,
  videoDriftReport
} from '../db'
import { inheritKeysFor } from '../../shared/wizardSteps'

/** Đặc tả 1 cổng hội thoại. */
interface ChatGateSpec {
  worker: string // tên _execution_<worker>.md
  tools: string[] // tool được cấp (đã kèm read_scenes/read_blocks)
  layers: string[] // mảnh skill chung nạp kèm
  kickoff: string // lời tự-gửi khi mở cổng lần đầu (agent chào + hỏi)
}

// Tool đọc trạng thái cấp cho MỌI cổng để agent xem trước khi sửa.
// read_plan để mọi cổng hiểu mạch chuyện (khung xương + chiến lược) đã chốt ở GATE 1.
const READ_TOOLS = ['read_ideal', 'read_scenes', 'read_blocks', 'read_assets', 'read_plan']

const CHAT_GATES: Record<string, ChatGateSpec> = {
  gate0_ideal: {
    worker: 'ideaAnalyst',
    tools: ['read_ideal', 'read_draft', 'write_ideal_brief'],
    layers: [],
    kickoff:
      'Người dùng vừa mở cổng Ý ĐỒ (SAU khi đã chốt bản NHÁP). BƯỚC 1 BẮT BUỘC: gọi read_draft để đọc TOÀN VĂN bản nháp vừa chốt + read_ideal để xem ý tưởng thô gốc. ' +
      'Rồi CHƯNG CẤT Ý ĐỒ CỐT LÕI TỪ CHÍNH BẢN NHÁP (bottom-up — nháp đã cho thấy hướng, giờ gọi tên ý đồ): ' +
      'CHƯA phân cảnh, CHƯA tạo @tag. Ghi "Ý đồ chốt" qua write_ideal_brief: thông điệp lõi (1 câu) · ' +
      'đối tượng + chân dung · góc cảm xúc + đường cong · tông/mood tổng · thể loại gợi ý · độ dài dự kiến. ' +
      'Nếu nháp còn chỗ ý đồ mập mờ thì HỎI 1–2 câu quan trọng nhất trước khi chốt. Phân cảnh làm ở bước Khung xương/Kịch bản.'
  },
  // ── KỊCH BẢN tách 4 bước chat độc lập (mô hình Toonflow) ──
  gate1a_draft: {
    worker: 'scriptDraft',
    tools: [...READ_TOOLS, 'write_draft', 'read_draft'],
    layers: ['storyboard-craft.md'],
    kickoff:
      'Người dùng vừa mở cổng NHÁP KỊCH BẢN — ĐÂY LÀ BƯỚC ĐẦU TIÊN, CHƯA có ý đồ chốt. BƯỚC 1 BẮT BUỘC: gọi read_ideal để đọc TOÀN VĂN Ý TƯỞNG THÔ (ideal.raw) người dùng nhập. ' +
      'Rồi TỰ DO bung 1 bản KỊCH BẢN NHÁP gọn (mạch kể + tinh thần từng đoạn, CHƯA cần lời thoại chỉn chu, CHƯA phân cảnh cứng) để CHỐT HƯỚNG với người dùng — đọc kỹ ý tưởng thô rồi dựng, KHÔNG ép khuôn. ' +
      'Ghi qua write_draft. Hỏi 1–2 câu nếu hướng/tông chưa rõ. Đây là bước thăm dò — đừng viết quá dài. Ý đồ cốt lõi sẽ được TÁCH Ở BƯỚC SAU từ chính bản nháp này.'
  },
  gate1b_skeleton: {
    worker: 'skeletonWright',
    tools: [...READ_TOOLS, 'read_draft', 'write_skeleton'],
    layers: ['storyboard-craft.md'],
    kickoff:
      'Người dùng vừa mở cổng KHUNG XƯƠNG. BƯỚC 1 BẮT BUỘC: gọi read_draft + read_ideal để đọc TOÀN VĂN nháp kịch bản + Ý đồ chốt. ' +
      'Rồi chốt KHUNG XƯƠNG qua write_skeleton: logline + các nhịp hook→thân→cao trào→kết + đường cong cảm xúc + điểm trả bài. ' +
      'Bám sát nháp đã chốt, không đổi hướng. Hỏi nếu điểm trả bài chưa rõ.'
  },
  gate1c_adaptation: {
    worker: 'adaptWright',
    tools: [...READ_TOOLS, 'read_draft', 'write_adaptation'],
    layers: ['adaptation-craft.md'],
    kickoff:
      'Người dùng vừa mở cổng CHUYỂN THỂ. Hãy chào ngắn, đọc khung xương + nháp (read_plan/read_draft), ' +
      'rồi viết CHIẾN LƯỢC CHUYỂN THỂ qua write_adaptation: mỗi thông điệp ideal → hành động/hình ảnh CỤ THỂ ("cho xem đừng kể") + motif hình + tông + cạm bẫy cần né. ' +
      'Hỏi nếu còn chỗ trừu tượng chưa quy ra được hình.'
  },
  gate1d_script: {
    worker: 'scriptFinal',
    tools: [
      ...READ_TOOLS,
      'read_coverage',
      'read_draft',
      'write_scene_context',
      'write_script',
      'plan_shots'
    ],
    layers: ['scene-analysis.md', 'storyboard-craft.md', 'adaptation-craft.md'],
    kickoff:
      'Người dùng vừa mở cổng KỊCH BẢN FINAL. BƯỚC 1 BẮT BUỘC: đọc TOÀN VĂN khung xương + chiến lược chuyển thể (read_plan) + nháp (read_draft). ' +
      'Rồi làm TUẦN TỰ: ① write_scene_context TỪNG cảnh (order_idx tăng dần từ 1) — dựng bối cảnh riêng mỗi cảnh (era/setting/wardrobe/props/mood), bottom-up không ép khuôn. ' +
      '② write_script (narration tiếng Việt CHỐT từng cảnh, bám khung + chiến lược). ③ plan_shots (quy hoạch shot mỗi cảnh — chia block rõ ý đồ để bước sau dựng ảnh/video không bỏ sót). ' +
      'PHẢI tạo cảnh (①) TRƯỚC khi plan_shots. Đây là narration CHỐT — viết chỉn chu. Hỏi nếu còn phân vân về hướng 1 cảnh.'
  },
  // ── QUY HOẠCH ĐẠO DIỄN (director_plan) — tách cảnh + đếm thoại + chấm cảm xúc ──
  gate_director: {
    worker: 'directorPlanner',
    tools: [...READ_TOOLS, 'read_script_full', 'write_director_plan'],
    layers: workerSpec('directorPlanner').layers,
    kickoff:
      'Người dùng vừa mở cổng QUY HOẠCH ĐẠO DIỄN. Hãy chào ngắn, đọc toàn bộ narration final (read_script_full), ' +
      'rồi PHÂN TÍCH (không sáng tạo nội dung mới): với MỖI cảnh — đếm số câu thoại (line_count), đếm số chữ (char_count, ~4 chữ/giây để ước thời lượng), ' +
      'chấm cảm xúc chủ đạo + độ đậm 0–10, và thiết kế CHUYỂN CẢNH sang cảnh sau (cắt/mờ/match-cut). Ghi qua write_director_plan. ' +
      'Chỉ tách & phân tích — KHÔNG viết lại lời thoại.'
  },
  // ── NGUYÊN LIỆU (Visual System) — tách từ kịch bản → sinh PROMPT tạo ảnh ──
  gate_assets: {
    worker: 'assetDeriver',
    tools: [
      ...READ_TOOLS,
      'read_script_full',
      'read_asset_coverage',
      'derive_assets',
      'lock_identity', // ⭐ khóa mặt — TRƯỚC ĐÂY THIẾU, khiến 100% asset để NULL → trôi mặt
      'write_asset_prompt',
      'save_derived_asset',
      'write_visual_system'
    ],
    layers: workerSpec('assetDeriver').layers,
    kickoff:
      'Người dùng vừa mở cổng NGUYÊN LIỆU. BƯỚC 0 (đọc-trước-khi-làm): đọc sổ cái các bước trước — read_plan (khung xương/chuyển thể/đạo diễn/hệ thị giác) + read_script_full (toàn văn kịch bản) + read_scenes (bối cảnh) + read_assets (@tag đã có). ' +
      'CẤM bịa nhân vật/bối cảnh/đạo cụ KHÔNG có trong kịch bản; thiếu tiền đề thì báo, không tự chế. Sau đó chào ngắn. ' +
      'Làm TUẦN TỰ:\n' +
      '① derive_assets — TÁCH nguyên liệu TỪ kịch bản (nhân vật/bối cảnh/đạo cụ lặp lại), KHÔNG bịa thứ kịch bản không có.\n' +
      '①bis ⭐ lock_identity cho MỌI asset char + product — BƯỚC QUAN TRỌNG NHẤT CỦA CỔNG NÀY. ' +
      'Ghi HỒ SƠ GỐC 6 mục bằng TIẾNG ANH: face (hình mặt/da/nét nhận diện) · features (ngũ quan chi tiết: mắt/mí/mũi/môi/gò má) · ' +
      'hair (màu-dài-kiểu-ngôi) · body (tỉ lệ đầu-thân/thể trạng/tư thế) · age (tuổi cụ thể) · aura (khí chất, ngôn ngữ so sánh trừu tượng). ' +
      'Tả CỤ THỂ ĐO ĐẾM ĐƯỢC, CẤM chung chung ("đẹp", "cuốn hút") và CẤM tên người thật. ' +
      'Kịch bản không tả mặt thì bạn TỰ QUYẾT một hồ sơ hợp vai rồi khóa lại — thà chốt một phương án còn hơn để trống, ' +
      'vì để trống thì mỗi block sẽ ra một khuôn mặt khác nhau. App sẽ chèn khối này vào 100% prompt ảnh về sau. ' +
      '⚠️ TỐI ĐA 3 asset/lượt, lượt sau ghi tiếp.\n' +
      '② write_asset_prompt cho MỖI asset gốc — sinh PROMPT tạo ảnh: nhân vật = character sheet 4-view (nền #F8F4E8, mặt mộc, khai báo tỉ lệ đầu-thân); bối cảnh = 1 ảnh establishing SẠCH, MỘT góc đại diện, KHÔNG người, 16:9 (nhiều góc/địa điểm → tách asset scene riêng hoặc derivative angle, KHÔNG ghép nhiều góc trong 1 ảnh); đạo cụ = lưới 2×2. ⚠️ GHI THEO ĐỢT: mỗi lượt write_asset_prompt cho TỐI ĐA 3 asset rồi lượt sau tự ghi tiếp — CẤM dồn tất cả vào 1 lượt (prompt dài quá 16k token sẽ bị cắt).\n' +
      '③ save_derived_asset cho biến thể cần thiết (nhân vật: biến thể trang phục/trạng thái; bối cảnh: thời gian/thời tiết/góc; đạo cụ KHÔNG phái sinh) — mỗi asset 1–5 biến thể, "thà thiếu còn hơn thừa".\n' +
      '④ write_visual_system — Color Script (tone màu từng cảnh) + ánh sáng + chất liệu toàn phim.\n' +
      'Người dùng sẽ copy prompt sang Coco tạo ảnh rồi upload về — nên prompt phải đủ để tạo ảnh ngay. ' +
      'Cuối cùng gọi read_asset_coverage để soát: missingIdentity PHẢI RỖNG (còn tag nào là còn nguy cơ trôi mặt → khóa nốt rồi soát lại), sau đó mới tới missingPrompt.'
  },
  // ── PHÂN CẢNH (shot_panel) — chia cảnh thành shot + điền khối phân cảnh ──
  gate_storyboard: {
    worker: 'storyboardWright',
    tools: [...READ_TOOLS, 'read_script_full', 'write_shot_panel'],
    layers: workerSpec('storyboardWright').layers,
    kickoff:
      'Người dùng vừa mở cổng PHÂN CẢNH. BƯỚC 0 (đọc-trước-khi-làm): đọc read_plan (khung xương/chuyển thể/đạo diễn/hệ thị giác) + read_script_full (toàn văn narration) + read_scenes (bối cảnh riêng cảnh) + read_assets (@tag đã có). ' +
      'CẤM bịa nhân vật/bối cảnh/đạo cụ không có trong kịch bản; @tag phải trỏ asset CÓ THẬT. Sau đó chào ngắn. ' +
      'Rồi với MỖI cảnh (order_idx tăng dần) → chia 1..n shot; mỗi shot điền khối phân cảnh: shot_size · camera_angle · camera_move · subject(@tag) · action_start→action_end (+1 chi tiết vật lý, cấm động từ mơ hồ) · duration_sec ≤8 · asset_tags. ' +
      'Ghi qua write_shot_panel(scene_order, blocks[]) cho từng cảnh. ⚠️ GHI THEO ĐỢT: mỗi lượt ghi TỐI ĐA 2 cảnh rồi lượt sau tự ghi tiếp — CẤM dồn tất cả cảnh vào 1 lượt (nhiều cảnh × nhiều shot sẽ vượt 16k token và bị cắt). Hỏi nếu còn phân vân số shot 1 cảnh.'
  },
  gate2_image: {
    worker: 'imgPrompter',
    // ⭐ check_identity_drift: tự soát tả-chồng-ngoại-hình (lá chắn #3 chống trôi mặt)
    tools: [
      ...READ_TOOLS,
      'read_coverage',
      'save_asset',
      'write_image_prompt',
      'check_identity_drift'
    ],
    layers: workerSpec('imgPrompter').layers,
    kickoff:
      'Người dùng vừa mở cổng PROMPT ẢNH. BƯỚC 0 (đọc-trước-khi-làm): đọc read_ideal + read_plan (hệ thị giác/Color Script) + read_scenes + read_blocks (KHỐI PHÂN CẢNH shot_panel: cỡ cảnh/góc/camera/Start→End/@tag đã dựng ở bước Phân cảnh) + read_assets (@tag đã có). ' +
      'CẤM bịa asset/@tag không có trong sổ — chỉ nhúng @tag đã tồn tại; thiếu tiền đề thì báo. Sau đó chào ngắn, ' +
      'rồi dựng prompt ảnh khung đầu (tiếng Anh, 3 đoạn, nhúng @tag) cho MỖI block đã có shot_desc. ' +
      'Bám KHỐI PHÂN CẢNH (shot_panel) của mỗi block — KHÔNG bịa lại cỡ cảnh/góc/hành động. ' +
      '⚠️ GHI THEO ĐỢT (BẮT BUỘC, chống cắt token): mỗi lượt gọi write_image_prompt cho TỐI ĐA 3 block — đừng dồn tất cả block vào 1 lượt (JSON dài quá 16k token sẽ bị cắt, mất trắng). ' +
      'Ghi xong 3 block thì lượt tiếp theo tự viết 3 block kế (KHÔNG chờ người dùng gõ "tiếp", KHÔNG dừng hỏi) — cứ thế tới khi MỌI block có prompt. ' +
      '⭐ KHÓA MẶT: khối [IDENTITY LOCK] do APP TỰ CHÈN vào đầu mỗi prompt — bạn TUYỆT ĐỐI KHÔNG tả lại mặt/ngũ quan/tóc/tuổi/da/vóc dáng của @tag bằng lời của mình (tả chồng = model chọn bừa = mặt trôi). Chỉ viết phần MỀM: hành động · biểu cảm/ánh mắt · trang phục theo cảnh · bối cảnh · ánh sáng · style. ' +
      'Cuối cùng gọi read_coverage (không block nào thiếu ảnh) VÀ check_identity_drift (soát tả-chồng-ngoại-hình) — còn lỗi thì xóa cụm bị bắt và ghi lại block đó. Hỏi nếu còn điểm chưa rõ.'
  },
  gate3_video: {
    worker: 'vidPrompter',
    // ⭐ check_video_drift: soát tả-lại-ngoại-hình trong scene/motion (lá chắn #3 bản video)
    tools: [...READ_TOOLS, 'read_coverage', 'write_video_prompt', 'check_video_drift'],
    layers: workerSpec('vidPrompter').layers,
    kickoff:
      'Người dùng vừa mở cổng PROMPT VIDEO. BƯỚC 0 (đọc-trước-khi-làm): đọc ideal + read_blocks (KHỐI PHÂN CẢNH shot_panel: camera_move/shot_size/action_start→action_end + image_prompt_en đã có prompt ẢNH KHUNG ĐẦU GATE 2) + @tag (read_assets); CẤM bịa block/asset không có trong sổ. ' +
      'LUẬT VÀNG image-to-video: mỗi block ĐÃ CÓ ảnh khung đầu (nhân vật/bối cảnh/trang phục/đạo cụ đã đứng yên trong ảnh) → prompt video CHỈ LÀM ĐỘNG ảnh đó, CẤM tả lại ngoại hình/bối cảnh/trang phục. SCENE ngắn (chỉ thay đổi/diễn biến), MOTION mang tải chính. ' +
      'CÁCH B — KHUNG ĐẦU BẮT BUỘC: ảnh khung đầu của block chính là ẢNH GATE 2 ĐÃ RENDER của ĐÚNG block đó (KHÔNG phải ảnh nguyên liệu @tag rời). SCENE PHẢI mở đầu bằng đúng cụm "@Image1 as the first frame;" rồi mới tả thay đổi/diễn biến. @tag chỉ dùng để KHÓA danh tính (giữ mặt/trang phục), KHÔNG phải nguồn khung đầu. ' +
      'MOTION bám action_start→action_end trong shot_panel; camera bám camera_move/shot_size đã chốt. ' +
      'MULTI-SHOT (mọi thể loại): block được 1–3 shot (CUT-by-CUT) cắt bằng "Cut to"/"Lens switch to", mỗi shot khóa lại @tag để không drift; MOTION tả tư thế START→END + chi tiết vật lý (cấm động từ mơ hồ); CONSTRAINTS thêm câu "preserve @tag face and outfit exactly, 100% matches the reference" + 1 positive lock riêng block (danh tính @tag + vị trí + số lượng). ' +
      'Chào ngắn rồi dựng prompt video (STYLE/SCENE/MOTION/AUDIO/CONSTRAINTS + TEXT_OVERLAY nếu cần) cho MỖI block. ' +
      '⚠️ GHI THEO ĐỢT (BẮT BUỘC, chống cắt token): mỗi lượt gọi write_video_prompt cho TỐI ĐA 3 block — đừng bao giờ dồn tất cả block vào 1 lượt (JSON dài quá 16k token sẽ bị cắt, mất trắng). ' +
      'Ghi xong 3 block thì lượt tiếp THEO tự viết 3 block kế (KHÔNG chờ người dùng gõ "tiếp", KHÔNG dừng lại hỏi) — cứ thế cho tới khi MỌI block có prompt. ' +
      'Cuối cùng gọi read_coverage (không block nào thiếu video) VÀ check_video_drift (soát tả-lại-ngoại-hình trong scene/motion) — còn lỗi thì xóa cụm bị bắt và ghi lại block đó. Hỏi nếu chưa rõ.'
  }
}

export interface GateChatReply {
  reply: string
}

// Bản đồ kế thừa dùng chung với renderer — xem inheritKeysFor ở @shared/wizardSteps.
// (Trước đây chép tay 2 nơi nên UI dễ lệch với thứ thợ thật sự nhận.)

/**
 * Dựng "SỔ CÁI BƯỚC TRƯỚC" (tiếng Việt gọn) từ DB — chèn vào system prompt MỖI lượt.
 * Đảm bảo worker LUÔN có dữ liệu kế thừa (nhất là CHUYỂN THỂ) dù không tự gọi read_plan.
 * Đọc DB tươi mỗi lần → sửa bước trước rồi chạy lại bước sau ⇒ nhận data mới.
 * Rỗng nếu cổng không có gì kế thừa (VD gate1a_draft — bước đầu).
 */
function buildInheritedLedger(projectId: number, gateStage: string): string {
  // Gu đạo diễn (chọn đầu dự án) chảy vào MỌI bước — kể cả bước không có key kế thừa
  // (VD gate1a_draft): là kim chỉ nam thẩm mỹ xuyên suốt, đọc DB tươi mỗi lượt.
  const directorBlock = directorSystemBlock(projectId)

  const keys = inheritKeysFor(gateStage)
  if (keys.length === 0) return directorBlock
  const plan = getPlanArtifacts(projectId)
  const out: string[] = []

  for (const k of keys) {
    if (k === 'brief' && plan.brief) {
      const b = plan.brief
      const parts = [
        b.core_message && `Thông điệp lõi: ${b.core_message}`,
        b.output_intent && `Ý đồ đầu ra: ${b.output_intent}`,
        b.mood && `Mood: ${b.mood}`,
        b.genre && `Thể loại: ${b.genre}`
      ].filter(Boolean)
      if (parts.length) out.push(`## Ý ĐỒ CHỐT\n${parts.join('\n')}`)
    } else if (k === 'draft' && plan.draft) {
      out.push(`## BẢN NHÁP\n${plan.draft}`)
    } else if (k === 'skeleton' && plan.skeleton) {
      const sk = plan.skeleton
      out.push(
        `## KHUNG XƯƠNG\nLogline: ${sk.logline}\n` +
          `Nhịp: ${sk.beats.map((b) => `${b.order}.${b.role}: ${b.summary}`).join(' | ')}` +
          (sk.emotional_arc ? `\nCảm xúc: ${sk.emotional_arc}` : '') +
          (sk.payoff ? `\nTrả bài: ${sk.payoff}` : '')
      )
    } else if (k === 'adaptation' && plan.adaptation) {
      const ad = plan.adaptation
      out.push(
        `## CHIẾN LƯỢC CHUYỂN THỂ\nHướng: ${ad.approach}` +
          (ad.tone ? ` · tông ${ad.tone}` : '') +
          (ad.show_dont_tell?.length
            ? `\nCho xem đừng kể:\n${ad.show_dont_tell.map((s) => `• ${s}`).join('\n')}`
            : '') +
          (ad.visual_motifs?.length ? `\nMotif hình: ${ad.visual_motifs.join(' · ')}` : '') +
          (ad.pitfalls?.length ? `\nCạm bẫy né: ${ad.pitfalls.join(' · ')}` : '')
      )
    } else if (k === 'director' && plan.director?.scenes.length) {
      out.push(
        `## QUY HOẠCH ĐẠO DIỄN\n` +
          plan.director.scenes
            .slice()
            .sort((a, b) => a.order - b.order)
            .map(
              (d) =>
                `Cảnh ${d.order}: ${d.line_count} thoại/${d.char_count} chữ · ${d.emotion} ${d.emotion_intensity}/10` +
                (d.transition ? ` · chuyển: ${d.transition}` : '')
            )
            .join('\n')
      )
    } else if (k === 'visual' && plan.visualSystem) {
      const vs = plan.visualSystem
      // Phòng dữ liệu cũ lưu color_script sai kiểu (không phải mảng) → .slice().sort() nổ.
      const colorScript = Array.isArray(vs.color_script) ? vs.color_script : []
      if (colorScript.length || vs.lighting || vs.texture) {
        out.push(
          `## HỆ THỊ GIÁC\n` +
            (colorScript.length
              ? `Color Script: ${colorScript
                  .slice()
                  .sort((a, b) => a.scene_order - b.scene_order)
                  .map((c) => `C${c.scene_order}:${c.palette}`)
                  .join(' | ')}\n`
              : '') +
            (vs.lighting ? `Ánh sáng: ${vs.lighting}\n` : '') +
            (vs.texture ? `Chất liệu: ${vs.texture}` : '')
        )
      }
    } else if (k === 'assets') {
      const assets = listAssetsFull(projectId)
      if (assets.length) {
        // ⭐ KHỐI ANCHOR — app GHÉP sẵn, thợ COPY NGUYÊN VĂN vào đầu prompt (không diễn giải lại).
        // Đây là thứ giữ 16 block cùng một khuôn mặt. Ghép ở đây để thợ THẤY chính xác chuỗi
        // sẽ được dùng; write_image_prompt còn chèn lại lần nữa như chốt chặn cuối.
        const anchor = buildAnchorBlock(assets)
        const dynamicBlock = buildDynamicBlock(assets)

        // ⚠️ Asset chưa khóa mặt: TRƯỚC ĐÂY im lặng — sổ cái vẫn tuyên bố "KHÓA CỨNG" trong khi
        // bên dưới trống rỗng, thợ buộc phải bịa ngoại hình mỗi block một kiểu. Giờ KÊU TO.
        const unlocked = assets
          .filter((a) => (a.role === 'char' || a.role === 'product') && !hasLock(a.identity_lock))
          .map((a) => `@${a.tag}`)

        out.push(
          `## NGUYÊN LIỆU (@tag CÓ THẬT — chỉ nhúng tag trong danh sách này)\n` +
            assets
              .map((a) => {
                const derivs = a.derivatives.length
                  ? ` [biến thể: ${a.derivatives.map((d) => `@${d.tag}`).join(', ')}]`
                  : ''
                const lockMark = hasLock(a.identity_lock) ? ' ✅đã khóa' : ''
                const genHint =
                  !hasLock(a.identity_lock) && a.gen_prompt?.trim()
                    ? `\n   ↳ Ngoại hình gốc (bám sát): ${a.gen_prompt.trim().slice(0, 240)}`
                    : ''
                return `@${a.tag} (${a.role}): ${a.name}${derivs}${lockMark}${genHint}`
              })
              .join('\n') +
            (anchor
              ? `\n\n### HỒ SƠ GỐC BẤT BIẾN — COPY NGUYÊN VĂN, CẤM VIẾT LẠI\n` +
                `> Mỗi prompt ảnh PHẢI mở đầu bằng ĐÚNG khối dưới đây (chỉ giữ dòng của @tag block đó dùng), ` +
                `rồi mới tới bối cảnh/hành động/phong cách. KHÔNG diễn giải, KHÔNG rút gọn, KHÔNG đổi từ — ` +
                `sai một chữ là mặt trôi. Sau khối này CẤM tả lại mặt/ngũ quan/dáng bằng lời của bạn.\n\n` +
                anchor
              : '') +
            // ⭐ Hồ sơ ĐỘNG chỉ có nghĩa ở cổng video (ảnh tĩnh không có dáng đi/giọng nói).
            // Bơm ở cổng ảnh chỉ tổ làm thợ tưởng phải tả vào prompt → phình prompt, loãng tín hiệu.
            (gateStage === 'gate3_video' && dynamicBlock ? `\n\n${dynamicBlock}` : '') +
            (unlocked.length
              ? `\n\n⚠️ CHƯA KHÓA NHẬN DẠNG: ${unlocked.join(', ')} — chưa có hồ sơ gốc. ` +
                `Nếu bạn đang ở cổng Nguyên liệu: gọi lock_identity NGAY cho các tag này. ` +
                `Nếu ở cổng sau: BÁO người dùng quay lại bước Nguyên liệu để khóa, ` +
                `và trong lúc chờ hãy dùng ĐÚNG MỘT mô tả ngoại hình cho tag đó ở TẤT CẢ block (tự nhất quán).`
              : '')
        )
      }
    } else if (k === 'script') {
      // KỊCH BẢN FINAL (narration chốt) — ĐẨY THẲNG vào worker, KHÔNG để phụ thuộc worker
      // có chịu gọi read_script_full hay không. Đây là NGUỒN SỰ THẬT các bước sau (đạo diễn/
      // nguyên liệu/phân cảnh) bám vào — thiếu nó thì worker dễ bịa lời thoại/hành động.
      // Đọc DB tươi mỗi lượt ⇒ sửa 1 cảnh ở bước trước thì bước sau nhận narration mới.
      const scenes = listScenes(projectId).filter((s) => (s.narration_vi ?? '').trim())
      if (scenes.length) {
        out.push(
          `## KỊCH BẢN FINAL (narration chốt — BÁM Y NGUYÊN lời thoại/mạch từng cảnh, KHÔNG viết lại)\n` +
            scenes
              .map((s) => {
                const ctx = s.summary?.trim() ? ` — ${s.summary.trim()}` : ''
                return `[Cảnh ${s.order_idx}${ctx}]\n${(s.narration_vi ?? '').trim()}`
              })
              .join('\n\n')
        )
      }
    }
  }

  if (!out.length) return directorBlock
  const ledger =
    'SỔ CÁI CÁC BƯỚC TRƯỚC (đã chốt — BÁM SÁT, không đổi hướng; ' +
    'đây là ngữ cảnh kế thừa, bạn KHÔNG cần gọi lại read tool để lấy phần này):\n\n' +
    out.join('\n\n')
  return directorBlock ? `${directorBlock}\n\n${ledger}` : ledger
}

/**
 * Khối GU ĐẠO DIỄN chèn vào system MỌI bước (chat + 1-phát) — kim chỉ nam thẩm mỹ xuyên suốt.
 * ƯU TIÊN Director Bible (đã cá nhân hóa cho phim này khi "chốt gu") → GỌN + SÁT brief.
 * FALLBACK persona thô nếu có director_id mà CHƯA sinh bible (dự án cũ / bấm "Bỏ qua").
 * Rỗng nếu chưa chọn gu (director_id NULL — DB cũ vẫn chạy). Đọc DB tươi mỗi lượt.
 */
export function directorSystemBlock(projectId: number): string {
  const bible = getPlanArtifacts(projectId).directorBible
  if (bible) {
    const lines = [
      `Logline hình ảnh: ${bible.logline_visual}`,
      `Color script: ${bible.color_script}`,
      `Ánh sáng: ${bible.lighting}`,
      bible.texture && `Chất liệu: ${bible.texture}`,
      `Ngôn ngữ máy + nhịp cắt: ${bible.camera_language}`,
      bible.emotion_face && `Cảm xúc → mặt/mắt: ${bible.emotion_face}`,
      bible.sound_design && `Âm thanh: ${bible.sound_design}`,
      `Vật lý Seedance: ${bible.physics_notes}`,
      bible.do_dont.length ? `NÊN/TRÁNH:\n${bible.do_dont.map((d) => `• ${d}`).join('\n')}` : ''
    ].filter(Boolean)
    return (
      'CHỈ ĐẠO NGHỆ THUẬT CỦA PHIM (Director Bible — đã áp gu đạo diễn vào brief này; ' +
      'mọi quyết định sáng/màu/nhịp/cảm xúc/máy quay phải NHẤT QUÁN, không tự đổi):\n\n' +
      lines.join('\n')
    )
  }
  const project = getProject(projectId)
  const persona = loadDirectorPersona(project?.director_id).trim()
  if (!persona) return ''
  return (
    'GU ĐẠO DIỄN CỦA DỰ ÁN (chọn ở đầu — kim chỉ nam thẩm mỹ XUYÊN SUỐT: ' +
    'mọi quyết định sáng/màu/nhịp/cảm xúc phải nhất quán với gu này, không tự đổi):\n\n' +
    persona
  )
}

/** Danh sách gate_stage hợp lệ cho hội thoại. */
export function isChatGate(gateStage: string): boolean {
  return gateStage in CHAT_GATES
}

/**
 * Chạy 1 lượt hội thoại của 1 cổng.
 * - userMessage = null  → mở cổng lần đầu, tự gửi kickoff (agent chào + hỏi/dựng).
 * - userMessage = chuỗi → lời người dùng lượt này (yêu cầu sửa / trả lời câu hỏi).
 * Nạp lịch sử từ DB, chạy agent, lưu lại lịch sử mới, trả text agent nói.
 */
export async function runGateChat(
  projectId: number,
  gateStage: string,
  userMessage: string | null,
  onStep?: (s: AgentStep) => void
): Promise<GateChatReply> {
  const spec = CHAT_GATES[gateStage]
  if (!spec) throw new Error(`Cổng không hỗ trợ hội thoại: ${gateStage}`)

  const project = getProject(projectId)
  if (!project) throw new Error('Không tìm thấy dự án')

  const layerParts = spec.layers.map((f) => readSkillOptional(f)).filter(Boolean)

  // Genre à-la-carte (TÙY CHỌN) — đọc 1 lần, dùng cho cả craft tự-rút.
  let genreId: string | null = null
  if (project.params_json) {
    try {
      genreId = (JSON.parse(project.params_json) as { genre?: string }).genre ?? null
    } catch (e) {
      console.warn('[danh-script] runGateChat: params_json hỏng, bỏ qua genre', e)
    }
  }
  // Genre nạp TĨNH cho cổng kịch bản final (giữ hành vi cũ — nhịp kể là cốt lõi ở đây).
  if (gateStage === 'gate1d_script' && genreId) {
    const genreSkill = readSkillOptional(`genres/${genreId}.md`)
    if (genreSkill) layerParts.push(genreSkill)
  }

  // ⭐ Kho CRAFT tự-rút (progressive-disclosure): chèn danh sách <available_skills>
  //    khớp bước + style + genre; thợ tự gọi read_skill_file khi cần chiều sâu.
  //    (gate1d đã nạp tĩnh genre ở trên → loại axis=story khỏi danh sách để khỏi trùng.)
  let craft = availableCraftFor(gateStage, project.style_id, genreId)
  if (gateStage === 'gate1d_script') craft = craft.filter((c) => c.axis !== 'story')
  const craftBlock = availableSkillsPrompt(craft)

  // ⭐ SỔ CÁI KẾ THỪA — bơm THẲNG data bước trước (gồm CHUYỂN THỂ) vào system.
  //    Không chờ worker tự gọi read_plan (nó hay bỏ qua) → liên kết bước ĐẢM BẢO,
  //    không phụ thuộc may rủi. Đọc DB tươi mỗi lượt ⇒ chạy lại bước trước thì bước sau nhận data mới.
  const inheritedLedger = buildInheritedLedger(projectId, gateStage)

  // Lớp giao thức hội thoại luôn nằm cuối để "đè" cách hành xử.
  const chatProtocol = readSkillOptional('free/_chat_protocol.md')
  const system = injectOutputIntent(
    injectStyleAnchor(
      composeSystem(
        loadExecutionSkill(project.pipeline, spec.worker),
        ...layerParts,
        craftBlock,
        inheritedLedger,
        chatProtocol
      ),
      project.style_id
    ),
    projectId
  )

  const history = loadGateChat(projectId, gateStage) as Array<{ role: string; content: unknown }>
  const userTurn = userMessage ?? spec.kickoff

  // Cấp thêm tool tự-rút craft cho MỌI cổng (chỉ khi có craft khả dụng để đỡ nhiễu).
  const toolNames = craft.length ? [...spec.tools, 'list_skills', 'read_skill_file'] : spec.tools

  const result = await runAgent({
    system,
    userPrompt: userTurn,
    tools: toolsFor(toolNames),
    ctx: { projectId },
    history,
    maxSteps: 14,
    temperature: 0.6,
    onStep
  })

  saveGateChat(projectId, gateStage, result.messages)
  return { reply: result.finalText }
}

/** 1 lượt hội thoại hiển thị (đã bỏ khối tool). */
export interface ChatTurn {
  role: 'user' | 'assistant'
  text: string
}

/** Rút text hiển thị từ 1 message thô (bỏ tool_use/tool_result, gộp các khối text). */
function turnText(content: unknown): string {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  return content
    .filter((c) => c && typeof c === 'object' && (c as { type?: string }).type === 'text')
    .map((c) => (c as { text?: string }).text ?? '')
    .join('')
    .trim()
}

/**
 * Đọc lịch sử hội thoại của 1 cổng thành bong bóng user/assistant cho UI.
 * - Bỏ lượt user ĐẦU TIÊN (kickoff tự-gửi, không phải người dùng gõ).
 * - Bỏ lượt user chỉ chứa tool_result (không có text).
 */
export function gateChatHistory(projectId: number, gateStage: string): ChatTurn[] {
  const raw = loadGateChat(projectId, gateStage) as Array<{ role: string; content: unknown }>
  const turns: ChatTurn[] = []
  let skippedKickoff = false
  for (const m of raw) {
    const text = turnText(m.content)
    if (m.role === 'user') {
      if (!skippedKickoff) {
        skippedKickoff = true // lượt user đầu = kickoff → ẩn
        continue
      }
      if (!text) continue // user chỉ chứa tool_result → bỏ
      turns.push({ role: 'user', text })
    } else if (m.role === 'assistant') {
      if (!text) continue // assistant chỉ gọi tool, chưa nói → bỏ
      turns.push({ role: 'assistant', text })
    }
  }
  return turns
}

/**
 * Chốt cổng: cập nhật stage dự án (người dùng bấm "Chốt & sang cổng sau").
 * ⭐ Với gate ảnh/video: chặn nếu còn block trống (cảnh chưa có block, hoặc block thiếu ảnh/video)
 * — đây là lá chắn chống lỗi "(trống — chưa dựng)".
 */
export function confirmGate(projectId: number, gateStage: string, force = false): void {
  if (!isChatGate(gateStage)) throw new Error(`Cổng không hợp lệ: ${gateStage}`)

  // ⭐ Chặn theo điểm review mới nhất của cổng (CHỈ CHẶN, không tự sửa).
  //   D → luôn chặn.  C → chặn trừ khi force.  A/B/?/không-review → qua.
  const review = latestReviews(projectId).find((r) => r.gate_stage === gateStage)
  if (review) {
    const grade = (review.grade || '').toUpperCase()
    const gist = (review.report || '').split('\n').slice(0, 3).join(' ').slice(0, 300)
    if (grade === 'D') {
      throw new Error(
        `Cổng "${gateStage}" đang bị chấm D — chưa thể chốt.\nLý do (tóm): ${gist}\n` +
          `Hãy nhắn agent sửa theo báo cáo rồi CHẤM LẠI trước khi chốt.`
      )
    }
    if (grade === 'C' && !force) {
      throw new Error(
        `Cổng "${gateStage}" đang bị chấm C (chưa đạt tối ưu).\nLý do (tóm): ${gist}\n` +
          `Có thể chốt nếu bạn chấp nhận — bấm lại nút "Chốt dù điểm C".`
      )
    }
  }

  // ⭐ Cổng NGUYÊN LIỆU: chặn chốt nếu còn asset thiếu prompt sinh ảnh.
  if (gateStage === 'gate_assets') {
    const cov = assetCoverage(projectId)
    if (cov.total === 0) {
      throw new Error(
        'Chưa thể chốt cổng — chưa có nguyên liệu nào. Hãy nhắn agent "tách nguyên liệu từ kịch bản" trước.'
      )
    }
    // ⭐ CHẶN SỐ 1 — thiếu khóa nhận dạng là nguyên nhân gốc gây TRÔI MẶT ở bước prompt ảnh.
    // Chặn ở ĐÂY (chứ không ở cổng ảnh) vì đây là nơi duy nhất còn sửa được rẻ: khóa xong
    // thì 100% prompt sau tự bám theo. Qua cổng rồi mới phát hiện thì phải viết lại cả 16 block.
    if (cov.missingIdentity.length) {
      throw new Error(
        `Chưa thể chốt cổng — còn nhân vật/sản phẩm CHƯA KHÓA NHẬN DẠNG: ${cov.missingIdentity.join(', ')}\n` +
          `Đây là nguyên nhân số 1 khiến ảnh/video ra MẶT KHÁC NHAU giữa các cảnh.\n` +
          `Hãy nhắn agent: "khóa nhận dạng cho các nhân vật còn thiếu" rồi chốt lại.`
      )
    }
    if (cov.missingPrompt.length) {
      throw new Error(
        `Chưa thể chốt cổng — còn asset THIẾU prompt sinh ảnh: ${cov.missingPrompt.join(', ')}\n` +
          `Hãy nhắn agent "sinh prompt cho các asset còn thiếu" rồi chốt lại. ` +
          `(Ảnh có thể upload sau — chỉ prompt là bắt buộc để qua cổng.)`
      )
    }
    updateProjectStage(projectId, gateStage)
    return
  }

  if (gateStage === 'gate2_image' || gateStage === 'gate3_video') {
    const need: 'image' | 'video' = gateStage === 'gate2_image' ? 'image' : 'video'
    const cov = coverageReport(projectId)
    const problems: string[] = []
    if (cov.scenesNoBlock.length) {
      problems.push(`Cảnh chưa có shot nào: ${cov.scenesNoBlock.join(', ')}`)
    }
    const missing = cov.gaps.filter((g) => g.missing.includes(need))
    if (missing.length) {
      const label = need === 'image' ? 'ảnh' : 'video'
      const list = missing.map((g) => `${g.scene_order}.${g.block_order}`).join(', ')
      problems.push(`Block chưa có prompt ${label}: ${list}`)
    }
    // ⭐ Cờ mềm @tag: liệt kê @tag nhúng trong prompt mà KHÔNG có asset (gõ sai / mồ côi).
    // Chỉ CẢNH BÁO qua console — không cứng chặn (tránh false-positive cảnh không người).
    const orphanTags = new Set<string>()
    for (const s of listScenes(projectId)) {
      for (const b of listBlocks(s.id)) {
        const text =
          need === 'image' ? (b.image_prompt_en ?? '') : (b.video_prompt_json ?? '')
        const tags = extractTags(text)
        if (tags.length) {
          for (const m of checkTagsExist(projectId, tags).missing) orphanTags.add(m)
        }
      }
    }
    if (orphanTags.size) {
      console.warn(
        `[danh-script] confirmGate ${gateStage}: @tag mồ côi (không có asset): ${[...orphanTags].join(', ')}`
      )
    }
    // ⭐ Lá chắn #3 chống TRÔI MẶT: bắt prompt tả CHỒNG ngoại hình lên khối anchor.
    // CHẶN CỨNG lỗi `error` ở cổng ẢNH — đây là nơi cuối còn sửa rẻ (qua cổng rồi thì
    // prompt video đã kế thừa mô tả sai). Cảnh video không soát (prompt video khác cấu trúc).
    if (need === 'image') {
      const drift = identityDriftReport(projectId)
      // ⭐ CHẶN "SẠCH GIẢ": đã viết prompt ảnh mà CHƯA asset nào khóa nhận dạng thì
      // soát drift luôn trả rỗng (không có hồ sơ gốc để đối chiếu) → báo cáo trông đạt
      // nhưng thực tế 100% prompt đi ra KHÔNG có khối [IDENTITY LOCK] (anchor_applied
      // = false ở mọi block) → chắc chắn trôi mặt. Đây đúng ca người dùng vừa gặp.
      if (drift.checked > 0 && drift.locked_tags.length === 0) {
        problems.push(
          `TRÔI MẶT (nặng) — ${drift.checked} prompt ảnh đã viết nhưng CHƯA nhân vật/sản phẩm nào được khóa nhận dạng` +
            `${drift.unlocked_tags.length ? `: ${drift.unlocked_tags.join(', ')}` : ''}.\n` +
            `    Không có hồ sơ gốc thì app không chèn được khối [IDENTITY LOCK] — mọi prompt ra mặt khác nhau.\n` +
            `    Sửa: quay lại cổng Nguyên liệu, nhắn agent "khóa nhận dạng cho các nhân vật còn thiếu", ` +
            `rồi về cổng này nhắn "ghi lại toàn bộ prompt ảnh" để anchor được chèn.`
        )
      }
      const bad = drift.blocks
        .map((b) => ({ ...b, errs: b.issues.filter((i) => i.level === 'error') }))
        .filter((b) => b.errs.length)
      if (bad.length) {
        problems.push(
          `TRÔI MẶT — ${bad.length} block tả chồng ngoại hình lên khối [IDENTITY LOCK]:\n` +
            bad
              .map(
                (b) =>
                  `    ${b.scene_order}.${b.block_order}: ${b.errs.map((e) => `${e.code} → "${e.hint}"`).join(' | ')}`
              )
              .join('\n') +
            `\n    Sửa: nhắn agent "chạy check_identity_drift rồi xóa mô tả ngoại hình chồng lấn, ghi lại các block đó".`
        )
      }
    }

    // ⭐ Lá chắn #3 phiên bản VIDEO: prompt video tả lại ngoại hình = bảo model VẼ LẠI mặt
    // thay vì bám ảnh first-frame đã khóa → phí công khóa mặt ở bước ảnh. Không đòi anchor
    // (video lấy danh tính từ ảnh, không từ chữ) — chỉ bắt phần tả chồng.
    if (need === 'video') {
      const vd = videoDriftReport(projectId)
      const bad = vd.blocks
        .map((b) => ({ ...b, errs: b.issues.filter((i) => i.level === 'error') }))
        .filter((b) => b.errs.length)
      if (bad.length) {
        problems.push(
          `TRÔI MẶT (video) — ${bad.length} block tả lại ngoại hình nhân vật trong scene/motion:\n` +
            bad
              .map(
                (b) =>
                  `    ${b.scene_order}.${b.block_order}: ${b.errs.map((e) => `${e.code} → "${e.hint}"`).join(' | ')}`
              )
              .join('\n') +
            `\n    Video bám mặt từ ẢNH đầu vào — tả lại ngoại hình bằng chữ là ép model vẽ mặt mới.\n` +
            `    Sửa: nhắn agent "xóa mô tả ngoại hình trong scene/motion, chỉ giữ hành động · camera · ánh sáng, ghi lại các block đó".`
        )
      }
    }
    if (problems.length) {
      throw new Error(
        `Chưa thể chốt cổng — còn thiếu:\n• ${problems.join('\n• ')}\n` +
          `Hãy nhắn agent dựng nốt (hoặc "dựng hết các block còn trống") rồi chốt lại.`
      )
    }
  }

  updateProjectStage(projectId, gateStage)
}
