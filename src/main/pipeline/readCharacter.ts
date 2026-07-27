// ============================================================
// Danh Script — ĐỌC ẢNH NHÂN VẬT → HỒ SƠ KHÓA MẶT
//
// Người dùng upload ảnh tư liệu (character sheet 4-view do Coco tạo, hoặc ảnh người
// thật). Bấm "Đọc ảnh" → model NHÌN ảnh rồi điền sẵn các ô của hồ sơ gốc.
//
// ⭐ VÌ SAO CẦN: trước đây thợ assetDeriver chỉ thấy `has_ref_image: true` chứ KHÔNG
// thấy ảnh — nó tự bịa ngoại hình từ kịch bản. Ảnh bạn upload và hồ sơ chữ nói hai
// đằng ⇒ prompt ảnh mang chữ chống lại ảnh tham chiếu ⇒ đúng cái "trôi mặt" cần chống.
//
// App KHÔNG tự lưu: kết quả đổ vào form cho người dùng duyệt rồi mới bấm Lưu.
// ============================================================

import { chatVision, dataUrlToImageBlock, type ContentBlock } from '../core/llmGateway'
import { readImageForModel } from '../assets'
import type { AssetRole, IdentityLock } from '../../shared/types'

/**
 * Hướng dẫn cho model đọc ảnh.
 *
 * Ba điều đắt giá nhất ở đây, đừng sửa mất:
 *
 * 1. **Cấm đoán thứ không thấy.** Model ảnh rất hay "điền cho đủ" — thấy mặt châu Á là
 *    tự thêm "nốt ruồi dưới cằm" cho có. Dấu nhận diện bịa còn TAI HẠI HƠN bỏ trống:
 *    nó vào 100% prompt ảnh và bắt model vẽ một thứ không có trong ảnh gốc.
 *
 * 2. **Chỉ tả thứ CỐ ĐỊNH.** Biểu cảm, ánh sáng, góc máy, phông nền là lớp MỀM đổi
 *    theo cảnh. Lọt vào hồ sơ gốc là chúng chống lại bối cảnh từng block.
 *
 * 3. **wardrobe bỏ trống theo mặc định.** Ô này chèn vào MỌI prompt; phim đổi đồ mà
 *    khóa cứng "áo hoodie xanh" thì cảnh mặc áo mưa có hai mô tả đánh nhau.
 */
const SYSTEM_CHAR = `You are a forensic character-reference analyst for a film production pipeline.
You look at a character reference image and extract ONLY the PERMANENT identity traits,
written as compact English prompt fragments that will be pasted verbatim into every image
prompt for this character.

Return STRICT JSON only — no markdown fence, no commentary. Shape:
{"age":"","face":"","features":"","signature":"","hair":"","body":"","wardrobe":"","aura":"","notes":""}

FIELD RULES
- age: approximate apparent age as a number or tight range. e.g. "26" or "24-28".
- face: face shape + skin tone. e.g. "Oval face, warm tan skin".
- features: DETAILED eyes/nose/mouth/brows/cheekbones. This decides likeness more than
  anything else. Be specific and measurable. e.g. "Single-fold almond eyes slightly
  downturned, straight nose bridge, full lower lip, high cheekbones".
- signature: PERMANENT distinguishing marks ONLY IF CLEARLY VISIBLE — moles (state exact
  position), scars, freckles, tattoos, dimples, a chipped/crooked tooth, heterochromia.
  ⚠️ If you cannot clearly see such a mark, return "". NEVER invent one. A fabricated mark
  is worse than an empty field: it forces the generator to draw something absent from the
  reference.
- hair: colour + length + cut + parting as seen. e.g. "Black hair, shoulder-length, center part".
- body: head-to-body proportion, build, posture. e.g. "Athletic build, 7.5-head proportion,
  broad shoulders, upright posture". Estimate proportion from the full-body view if present.
- wardrobe: LEAVE "" unless this is clearly a fixed uniform/signature outfit worn in every
  scene (mascot costume, brand uniform, glasses that are never removed). A neutral base
  outfit on a character sheet is NOT a signature outfit — return "".
- aura: temperament in abstract comparative language. e.g. "quiet stubborn intensity".
  NEVER name a real person, actor or celebrity.
- notes: Vietnamese, 1-2 short sentences — what you were unsure about, or what the image
  did not show (e.g. "Chỉ có ảnh chân dung nên không đoán được tỉ lệ đầu-thân").

HARD RULES
- Describe ONLY traits that stay the same across every scene. NEVER describe expression,
  gaze direction, lighting, camera angle, background, mood of the moment, or the pose.
- Write every field except "notes" in ENGLISH, as prompt fragments (no full sentences,
  no "The character has...").
- If a trait is not visible in the image, return "" for it. Empty is correct; guessing is not.
- If the image contains multiple views of the SAME person (a 4-view character sheet),
  merge them into ONE profile — that is the intended input.
- If the image shows several DIFFERENT people, describe the most prominent one and say so
  in "notes".`

/**
 * ⭐ Bản dành cho SẢN PHẨM (chai/lon/hộp/thiết bị).
 *
 * Vì sao phải tách hẳn chứ không dùng chung SYSTEM_CHAR: bảo một "chuyên gia phân tích
 * chân dung" đi tả cái chai thì nó vẫn cố điền tuổi/ngũ quan/tóc/khí chất cho đủ ô —
 * ra rác, đúng cái kiểu bịa mà cả file này dựng lên để chặn.
 *
 * Với TVC, sản phẩm còn ĐẮT hơn mặt diễn viên: mặt trôi một chút khán giả bỏ qua, chứ
 * nhãn sai màu / logo sai chỗ / dáng chai đổi giữa các cảnh là hàng của khách bị vẽ sai.
 *
 * Dùng LẠI đúng 8 khóa của tầng ảnh (không đẻ khóa mới) vì khối [IDENTITY LOCK] ghép
 * theo ANCHOR_ORDER cố định — thêm khóa lạ sẽ bị lọc bỏ, còn đổi thứ tự thì 2 lần ghép
 * ra 2 chuỗi khác nhau. Nên ở đây chỉ ĐỔI NGHĨA từng ô cho hợp vật thể:
 *   face → thân/vỏ + chất liệu · features → chi tiết nhãn · signature → dấu thương hiệu
 *   body → tỉ lệ + dung tích · aura → cảm giác thương hiệu
 *   age/hair/wardrobe → luôn rỗng (vô nghĩa với vật thể).
 */
const SYSTEM_PRODUCT = `You are a packaging-reference analyst for a film/TVC production pipeline.
You look at a product reference image and extract ONLY the PERMANENT physical identity of
the product, written as compact English prompt fragments that will be pasted verbatim into
every image prompt featuring this product.

Return STRICT JSON only — no markdown fence, no commentary. Shape:
{"age":"","face":"","features":"","signature":"","hair":"","body":"","wardrobe":"","aura":"","notes":""}

⚠️ The keys are fixed by the pipeline. For a PRODUCT they carry DIFFERENT meanings:

- face: container shape + material + finish. e.g. "Slim cylindrical aluminium can, matte
  teal body with satin finish". Include the closure/cap if visible.
- features: THE LABEL, IN DETAIL — this is the single most important field. Layout of the
  logo, typeface style, colour bands and their order top-to-bottom, illustrations, cap
  colour, any window/seal. Name colours concretely ("deep teal", "warm gold") and state
  WHERE each element sits. e.g. "Coconut-leaf logo centered upper third, white bold
  sans-serif wordmark below it, gold horizontal band at the base, matte black cap".
- signature: the ONE brand mark that identifies it instantly at a glance — the logo emblem,
  a unique silhouette notch, an embossed pattern, a distinctive cap colour.
  ⚠️ Only if CLEARLY VISIBLE. NEVER invent a mark or guess a brand name you cannot read.
- body: proportions and size. e.g. "330ml, roughly 2.4:1 height-to-width, straight sides,
  slight taper at shoulder". Estimate from the image; say so in notes if uncertain.
- aura: the brand feeling the packaging projects, in abstract terms. e.g. "clean tropical
  freshness, premium but approachable". NEVER name a real brand or competitor.
- age, hair, wardrobe: ALWAYS return "" — these are person-only fields and are meaningless
  for a product. Do NOT try to fill them.
- notes: Vietnamese, 1-2 short sentences — what you were unsure about or could not read
  (e.g. "Chữ nhỏ mặt sau nhãn bị mờ, không đọc được dung tích").

HARD RULES
- Describe ONLY what stays the same in every shot. NEVER describe lighting, reflections,
  camera angle, background, condensation droplets, hand holding it, or the pose — those
  change per scene and would fight the scene description.
- Do NOT read out marketing copy or ingredient text; describe the VISUAL design.
- If you cannot read a word on the label, do not guess it — leave it out and note it.
- Write every field except "notes" in ENGLISH, as prompt fragments.
- If several views of the SAME product are shown, merge them into ONE profile.`

/** Kết quả đọc ảnh: hồ sơ đề xuất + ghi chú tiếng Việt cho người dùng. */
export interface ReadCharacterResult {
  lock: Partial<IdentityLock>
  /** Ghi chú của model (tiếng Việt): chỗ không chắc, thứ ảnh không cho thấy. */
  notes: string
  /** Số ảnh thực sự gửi được lên model (0 = không đọc được ảnh nào). */
  imageCount: number
}

/** Các khóa hợp lệ của tầng ảnh — lọc rác model trả thừa (vd "clothing", "gender"). */
const IMG_KEYS = [
  'age',
  'face',
  'features',
  'signature',
  'hair',
  'body',
  'wardrobe',
  'aura'
] as const

/**
 * Bóc JSON từ text model. Model hay bọc ```json dù đã dặn đừng, nên gỡ rào trước;
 * nếu vẫn hỏng thì vớt cụm `{...}` dài nhất. Thà cố thêm một nhịp còn hơn bắt người
 * dùng bấm lại từ đầu chỉ vì thừa 3 dấu backtick.
 */
function parseJson(text: string): Record<string, unknown> {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  try {
    return JSON.parse(cleaned) as Record<string, unknown>
  } catch {
    const m = /\{[\s\S]*\}/.exec(cleaned)
    if (m) {
      try {
        return JSON.parse(m[0]) as Record<string, unknown>
      } catch {
        /* rơi xuống dưới */
      }
    }
    throw new Error(`Model không trả JSON hợp lệ. Nội dung nhận được:\n${text.slice(0, 400)}`)
  }
}

/**
 * Đọc 1..n ảnh của một nhân vật → hồ sơ đề xuất.
 *
 * Nhận NHIỀU ảnh vì một @tag thường có ảnh gốc + vài biến thể; nhìn cả cụm thì model
 * chốt được đặc điểm nào THẬT SỰ cố định (xuất hiện ở mọi ảnh) thay vì bám vào một
 * khoảnh khắc. Giới hạn 4 ảnh — thêm nữa chỉ tốn token, không thêm tín hiệu.
 *
 * `role` chọn bộ hướng dẫn: 'product' tả bao bì/nhãn, còn lại tả người. Mặc định 'char'
 * để chỗ gọi cũ không đổi hành vi.
 */
export async function readCharacterFromImages(
  paths: Array<string | null>,
  tag: string,
  role: AssetRole = 'char'
): Promise<ReadCharacterResult> {
  const isProduct = role === 'product'
  const blocks: ContentBlock[] = []
  let imageCount = 0
  for (const p of paths.slice(0, 4)) {
    const block = dataUrlToImageBlock(readImageForModel(p))
    if (block) {
      blocks.push(block)
      imageCount++
    }
  }
  if (!imageCount) {
    throw new Error(
      `@${tag} chưa có ảnh đọc được. Hãy bấm "Upload ảnh" ở thẻ này trước, rồi đọc lại.`
    )
  }

  const subject = isProduct ? 'product' : 'character'
  blocks.push({
    type: 'text',
    text:
      `The image(s) above are the ${subject} reference for @${tag}.\n` +
      (imageCount > 1
        ? `There are ${imageCount} images of the SAME ${subject}. Merge them: keep only traits ` +
          `consistent across all of them.\n`
        : '') +
      `Extract the permanent identity profile as STRICT JSON per your instructions.`
  })

  const raw = await chatVision(blocks, {
    system: isProduct ? SYSTEM_PRODUCT : SYSTEM_CHAR,
    maxTokens: 1200,
    temperature: 0.2
  })
  const json = parseJson(raw)

  const lock: Partial<IdentityLock> = {}
  for (const k of IMG_KEYS) {
    const v = json[k]
    if (typeof v === 'string' && v.trim()) lock[k] = v.trim()
  }
  const notes = typeof json.notes === 'string' ? json.notes.trim() : ''
  return { lock, notes, imageCount }
}
