import type { IdentityLock, AssetFull } from './types'

/**
 * KHỐI ANCHOR (hồ sơ nhân vật gốc) — trụ chống TRÔI MẶT.
 *
 * VẤN ĐỀ nó giải: app xuất prompt cho công cụ NGOÀI (Coco/Seedance), không sở hữu
 * model sinh ảnh nên KHÔNG khóa được danh tính ở tầng weights như Higgsfield Soul ID.
 * Thứ duy nhất khóa được là CHỮ. Mà trước đây thợ prompt tự "diễn giải lại" ngoại hình
 * theo lời của nó ở TỪNG block → 16 block = 16 mô tả khác nhau → 16 khuôn mặt khác nhau.
 *
 * CÁCH GIẢI: app tự GHÉP 1 khối chữ bất biến từ identity_lock rồi CHÈN NGUYÊN VĂN vào
 * đầu mọi prompt. Thợ KHÔNG được viết lại phần này — chỉ viết phần MỀM (bối cảnh, hành
 * động, ánh sáng). Vì app ghép nên 16/16 block giống nhau đến từng ký tự.
 *
 * Nguyên tắc "copy – dán – thêm bối cảnh": giữ nguyên mô tả gốc trong 100% prompt về sau.
 *
 * Dùng ở 2 nơi:
 * 1. `gateChat.ts` — bơm vào sổ cái kế thừa để thợ THẤY khối chuẩn.
 * 2. `tools/index.ts` — `write_image_prompt` tự chèn nếu thợ quên (chốt chặn cuối).
 */

/** Nhãn mở/đóng khối anchor. Dùng để nhận biết prompt ĐÃ có anchor (tránh chèn 2 lần). */
export const ANCHOR_OPEN = '[IDENTITY LOCK — DO NOT ALTER]'
export const ANCHOR_CLOSE = '[END IDENTITY LOCK]'

/**
 * ⭐ THỨ TỰ GHÉP KHỐI ANCHOR — nguồn sự thật DUY NHẤT, mọi nơi phải theo.
 *
 * Vì sao phải cố định và tập trung một chỗ: khối anchor được chèn nguyên văn vào 100%
 * prompt ảnh; chỉ cần thứ tự lệch giữa 2 lần ghép là 2 block ra 2 chuỗi khác nhau →
 * đúng thứ mà cả cơ chế này sinh ra để chống. Form UI cũng đọc thứ tự này.
 *
 * Vì sao XẾP THẾ NÀY: đi từ đặc trưng KHÓ đổi nhất tới dễ đổi nhất, và đẩy
 * `signature` (nốt ruồi/sẹo/xăm) lên ngay sau ngũ quan — đó là tín hiệu danh tính
 * mạnh nhất trên mỗi đơn vị chữ, nằm đầu câu thì model bám chắc hơn nằm cuối.
 *
 * `demeanor`/`voice` CỐ Ý không có ở đây: ảnh tĩnh không có dáng đi và giọng nói.
 */
const ANCHOR_ORDER = [
  'age',
  'face',
  'features',
  'signature',
  'hair',
  'body',
  'wardrobe',
  'aura'
] as const satisfies ReadonlyArray<keyof IdentityLock>

/**
 * ⭐ CHẾ ĐỘ TRỎ — thứ tự ghép khi asset ĐÃ CÓ ẢNH tư liệu.
 *
 * VÌ SAO PHẢI KHÁC: khi người dùng đính ảnh ref vào Seedance, khối chữ tả lại ngũ quan
 * ("oval face, almond eyes, fair skin") trở thành NGUỒN MÔ TẢ THỨ HAI cạnh tranh với
 * chính tấm ảnh. Model có 2 nguồn tả mặt → vẽ ra mặt THỨ BA. Đây đúng ca thật: người
 * dùng đã đính ảnh mà mặt vẫn trôi.
 *
 * Chính `identity-lock.md` đã ghi luật này ("có ảnh tham chiếu thì prompt phải NGẮN LẠI,
 * không dài ra" — theo khuyến nghị BytePlus) nhưng app mới chỉ áp cho dáng đi/giọng nói,
 * chưa áp cho khối anchor.
 *
 * GIỮ LẠI đúng 2 ô:
 *  • `signature` — nốt ruồi/sẹo/xăm. Ảnh nén JPEG hay làm mất chi tiết nhỏ này, mà nó
 *    lại là tín hiệu danh tính mạnh nhất trên mỗi đơn vị chữ → chữ BÙ cho ảnh, không đè.
 *  • `aura` — khí chất chi phối BIỂU CẢM, không phải hình dáng ngũ quan → không cạnh tranh.
 *
 * BỎ: age/face/features/hair/body/wardrobe — ảnh đã nói hết, viết lại chỉ gây xung đột.
 *
 * ⚠️ ĐỪNG NỚI DANH SÁCH NÀY khi đọc "kỹ thuật giữ nhân vật #2" của tài liệu chính thức
 * (câu đó bảo *vẫn nhắc lại ngoại hình bằng chữ*). Nghe như chỏi nhau nhưng không phải:
 * kỹ thuật #2 nói về **character reference dùng lại xuyên nhiều clip**, và nói **liều NHẸ**
 * (1–2 đặc điểm ổn định) — đúng bằng `signature` + `aura` ở đây. Còn khi tham chiếu là
 * **khung đầu của chính clip đó** thì tài liệu image-to-video dặn ngược lại: KHÔNG tả lại.
 * Nới về 8 ô = quay lại đúng lỗi cũ "đính ảnh mà mặt vẫn trôi". Xem byteplus-spec mục 8bis-A.
 */
const ANCHOR_ORDER_REF = ['signature', 'aura'] as const satisfies ReadonlyArray<
  keyof IdentityLock
>

/**
 * Câu TRỎ VỀ ẢNH — thay cho đoạn tả ngũ quan khi asset đã có ảnh tư liệu.
 * Viết TIẾNG ANH vì đây là chữ đi thẳng vào prompt cho engine.
 */
function refPointer(tag: string): string {
  return (
    `identity, facial structure and body proportions come from the @${tag} reference image ` +
    `— reproduce exactly, do not reinterpret`
  )
}

/** Có nội dung khóa nào không (rỗng hết = chưa khóa mặt). */
export function hasLock(lock: IdentityLock | null | undefined): boolean {
  if (!lock) return false
  return ANCHOR_ORDER.some((k) => lock[k]?.trim())
}

/**
 * Dựng 1 DÒNG anchor cho 1 asset: "@TAG: <các mục ghép lại>".
 * Thứ tự cố định để mọi lần ghép ra chuỗi GIỐNG HỆT nhau — đây chính là thứ khiến
 * 16 block không lệch. Trả '' nếu asset chưa khóa gì.
 *
 * `hasRefImage`: asset đã gắn ảnh tư liệu chưa.
 *  • false (mặc định) → CHẾ ĐỘ MÔ TẢ: ghép đủ 8 ô, vì chữ là thứ DUY NHẤT khóa được.
 *  • true             → CHẾ ĐỘ TRỎ: câu trỏ về ảnh + signature + aura (xem ANCHOR_ORDER_REF).
 *
 * Quyết định theo TỪNG asset, không theo cả dự án: @NUCHINH có ảnh thì dùng dòng trỏ,
 * @BANHMI chưa có ảnh vẫn dùng dòng tả đầy đủ — trộn trong cùng một khối là đúng.
 */
export function anchorLine(
  tag: string,
  lock: IdentityLock | null | undefined,
  hasRefImage = false
): string {
  if (!hasLock(lock)) return ''
  const l = lock as IdentityLock
  const order = hasRefImage ? ANCHOR_ORDER_REF : ANCHOR_ORDER
  const parts = order.map((k) => l[k]?.trim()).filter((s): s is string => Boolean(s))
  // Chế độ trỏ: câu trỏ đứng ĐẦU (model bám mạnh nhất ở đầu câu), signature/aura bổ sung sau.
  if (hasRefImage) parts.unshift(refPointer(tag))
  return `@${tag}: ${parts.join('. ')}.`
}

/**
 * Dựng KHỐI ANCHOR đầy đủ cho danh sách asset (chỉ những asset ĐÃ khóa).
 * Trả '' khi không asset nào khóa → chỗ gọi tự bỏ qua, không chèn khối rỗng.
 *
 * `only`: giới hạn theo @tag block đang dùng (không kèm @). Bỏ trống = lấy tất cả.
 * Vì sao cần lọc: prompt 1 block chỉ nhắc 2–3 @tag; nhét cả 11 asset vào sẽ phình
 * prompt vô ích và làm loãng tín hiệu.
 */
/**
 * ⭐ CHUẨN HÓA danh sách @tag về MẢNG chuỗi — chống lỗi "only.map is not a function".
 *
 * Vì sao PHẢI có ở tầng này (chứ không chỉ chặn ở chỗ gọi): tham số `only`/`tags`
 * nhận thẳng từ field `associate_asset_tags` do LLM sinh ra. LLM (qua 9router) rất
 * hay gửi 1 CHUỖI "@NUCHINH, @COCOENERGY" thay vì mảng. Bẫy ở chỗ chuỗi cũng có
 * `.length` truthy → mọi guard kiểu `only?.length` đều LỌT, rồi `.map()` mới nổ →
 * mất trắng cả lượt write_image_prompt (đúng lỗi user gặp: thợ lặp ~40 bước vì tưởng
 * sai tên tool). Chuẩn hóa tại LÕI thì không chỗ gọi nào còn giẫm được nữa.
 */
function toTagArray(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((t): t is string => typeof t === 'string' && t.trim() !== '')
  }
  if (typeof raw === 'string' && raw.trim() !== '') {
    return raw
      .split(/[,;\s]+/)
      .map((t) => t.trim())
      .filter((t) => t !== '')
  }
  return []
}

export function buildAnchorBlock(assets: AssetFull[], only?: unknown): string {
  const list = toTagArray(only)
  const want = list.length
    ? new Set(list.map((t) => t.replace(/^@/, '').toUpperCase()))
    : null
  const lines: string[] = []
  for (const a of assets) {
    if (want && !want.has(a.tag.toUpperCase())) continue
    // ⭐ Có ảnh tư liệu → dòng TRỎ (ngắn, không tả ngũ quan). Chưa có → dòng TẢ đầy đủ.
    //    Tự chuyển chế độ khi người dùng gắn ảnh ở Xưởng nguyên liệu — không có nút gạt nào để quên.
    const line = anchorLine(a.tag, a.identity_lock, !!a.ref_image_path)
    if (line) lines.push(line)
  }
  if (!lines.length) return ''
  return `${ANCHOR_OPEN}\n${lines.join('\n')}\n${ANCHOR_CLOSE}`
}

/**
 * ⭐ HỒ SƠ ĐỘNG cho cổng VIDEO — dáng điệu + giọng.
 *
 * KHÔNG chèn vào prompt (video bám danh tính từ ẢNH khung đầu, thêm chữ chỉ làm loãng).
 * Chỉ bơm vào SỔ CÁI KẾ THỪA để thợ video THẤY mà viết `motion`/`audio` cho đúng người:
 * cùng một nhân vật thì lượt nào cũng đi cùng một dáng, nói cùng một chất giọng —
 * chứ không phải block 1 "bước dứt khoát", block 5 lại "bước rón rén".
 *
 * Trả '' khi không asset nào khai 2 ô này (đa số dự án) → chỗ gọi tự bỏ qua.
 */
export function buildDynamicBlock(assets: AssetFull[]): string {
  const lines: string[] = []
  for (const a of assets) {
    const l = a.identity_lock
    if (!l) continue
    const parts = [
      l.demeanor?.trim() && `dáng điệu: ${l.demeanor.trim()}`,
      l.voice?.trim() && `giọng: ${l.voice.trim()}`
    ].filter((s): s is string => Boolean(s))
    if (parts.length) lines.push(`@${a.tag} — ${parts.join(' · ')}`)
  }
  if (!lines.length) return ''
  return (
    '## Hồ sơ ĐỘNG (dáng điệu · giọng) — giữ nhất quán xuyên block\n' +
    'KHÔNG chép vào prompt. Dùng để viết `motion` (dáng đi/cử chỉ) và `audio` (chất giọng) cho đúng người.\n' +
    lines.join('\n')
  )
}

/** Prompt đã chứa khối anchor chưa (để không chèn chồng khi thợ đã tự chèn đúng). */
export function hasAnchor(prompt: string): boolean {
  return prompt.includes(ANCHOR_OPEN)
}

// ============================================================
// CÂU KHÓA DANH TÍNH CHO PROMPT VIDEO
// ============================================================

/**
 * ⭐ Câu khóa danh tính cho ô `constraints` của prompt VIDEO — APP GHÉP, không để thợ viết.
 *
 * VÌ SAO PHẢI CÓ: prompt ẢNH được app chèn cứng khối [IDENTITY LOCK] (ensureAnchor) nên
 * 16 block ra 16 chuỗi giống hệt nhau. Prompt VIDEO thì KHÔNG có cơ chế tương đương —
 * câu khóa do thợ tự viết tay, chỉ được "dặn" trong mô tả tool. Mỗi block một câu khóa
 * khác nhau ("preserve face" / "stable consistent face" / "100% matches reference") →
 * đúng chỗ trôi mặt ở khâu video.
 *
 * KHÁC anchor ảnh ở chỗ: video KHÔNG tả ngoại hình dù asset chưa có ảnh tư liệu. Video
 * luôn chạy image-to-video từ ảnh khung đầu (GATE 2) — ảnh đó ĐÃ mang sẵn khuôn mặt.
 * Tả thêm bằng lời là ép model vẽ lại mặt thay vì làm động ảnh có sẵn.
 *
 * CHỈ MỘT câu cho mọi @tag: BytePlus khuyến nghị prompt có ảnh ref phải NGẮN. Ba biến thể
 * cùng một ý dồn vào 1 prompt làm loãng chính câu khóa (xem `_execution_vidPrompter.md`).
 *
 * Trả '' khi không @tag nào đã khóa → chỗ gọi giữ nguyên constraints của thợ.
 */
export function buildVideoIdentityLock(assets: AssetFull[], only?: unknown): string {
  const list = toTagArray(only)
  const want = list.length ? new Set(list.map((t) => t.replace(/^@/, '').toUpperCase())) : null
  const tags: string[] = []
  for (const a of assets) {
    if (want && !want.has(a.tag.toUpperCase())) continue
    // Chỉ khóa char/product — bối cảnh/đạo cụ phụ không có "khuôn mặt" để trôi.
    if (a.role !== 'char' && a.role !== 'product') continue
    if (!hasLock(a.identity_lock)) continue
    tags.push(`@${a.tag}`)
  }
  if (!tags.length) return ''
  const list_ = tags.join(' and ')
  // ⚠️ CỐ Ý KHÔNG có dấu phẩy trong câu này. `VIDEO_LOCK_PATTERNS` dừng ở dấu phẩy (để
  // không xén nhầm ràng buộc hợp lệ đứng sau); nếu chính câu chuẩn có phẩy thì lần chạy
  // thứ hai chỉ gỡ được nửa đầu, nửa sau ở lại và bị nhân bản mỗi lần ghi lại prompt.
  return `preserve ${list_} face and outfit exactly as in the first frame with natural anatomy`
}

/**
 * Các mẫu câu khóa danh tính THỢ TỰ VIẾT — cần gỡ trước khi app ghép câu chuẩn vào,
 * nếu không prompt sẽ có 2–3 câu cùng ý nằm cạnh nhau (chính thứ làm loãng tín hiệu).
 *
 * Cố ý bắt HẸP (chỉ các cụm khóa danh tính quen thuộc), KHÔNG bắt rộng: `constraints`
 * còn chứa ràng buộc hợp lệ khác ("exactly one bottle", "sharp focus") phải giữ nguyên.
 *
 * ⚠️ Đuôi `[^.,;]*` phải loại CẢ DẤU PHẨY, không chỉ `.` và `;`. Thợ viết constraints
 * ngăn nhau bằng dấu phẩy và thường KHÔNG có dấu chấm nào; nếu đuôi cho phép nuốt phẩy
 * thì mẫu đầu tiên ăn trọn cả chuỗi ("preserve @LAN face…, exactly one bottle…, sharp
 * focus") → xóa sạch ràng buộc hợp lệ, đúng thứ mà chính chú thích trên hứa giữ lại.
 */
const VIDEO_LOCK_PATTERNS: RegExp[] = [
  /\bpreserve\s+@?[A-Z0-9_]+(?:\s+and\s+@?[A-Z0-9_]+)*\s+(?:face|identity)[^.,;]*/gi,
  /\b(?:stable|consistent)\s+(?:and\s+)?(?:stable|consistent)?\s*face[^.,;]*/gi,
  /\b(?:100%\s+)?matches?\s+the\s+reference[^.,;]*/gi,
  /\bsame\s+(?:character|person)\s+as\s+@?[A-Z0-9_]+[^.,;]*/gi,
  /\bface\s+identical\s+to\s+@?[A-Z0-9_]+[^.,;]*/gi
]

/**
 * ⭐ CHỐT CHẶN CUỐI cho prompt video: gỡ câu khóa thợ tự viết rồi ghép câu CHUẨN của app.
 *
 * Đối xứng với `ensureAnchor` bên prompt ảnh. Dù thợ viết kiểu gì, câu khóa LƯU VÀO DB
 * vẫn giống hệt nhau ở mọi block.
 *
 * Trả nguyên `constraints` khi không có @tag nào đã khóa (không có gì để khóa).
 */
export function ensureVideoLock(
  constraints: string,
  assets: AssetFull[],
  tags?: unknown
): string {
  const lock = buildVideoIdentityLock(assets, tags)
  if (!lock) return constraints

  // Gỡ mọi biến thể câu khóa thợ tự viết, rồi dọn dấu câu thừa do việc gỡ để lại.
  let rest = constraints
  for (const re of VIDEO_LOCK_PATTERNS) {
    re.lastIndex = 0
    rest = rest.replace(re, '')
  }
  rest = rest
    .replace(/\s*[,;]\s*(?=[,;])/g, '') // dấu phẩy dính nhau sau khi gỡ
    .replace(/(^|[.;])\s*[,;]\s*/g, '$1 ') // phẩy mồ côi đầu câu/mệnh đề
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;])/g, '$1')
    .replace(/^[\s,;.]+|[\s,;]+$/g, '')
    .trim()

  return rest ? `${lock}, ${rest}` : lock
}

/**
 * Trích @tag từ 1 đoạn prompt. Dùng khi thợ không khai `associate_asset_tags` —
 * app vẫn biết block nhắc tới ai để chèn đúng anchor.
 * Quy ước tag: VIẾT HOA không dấu, cho phép _ và số (VD @NUCHINH_STATE1).
 */
export function extractTags(prompt: string): string[] {
  const found = prompt.match(/@([A-Z][A-Z0-9_]*)/g) ?? []
  return [...new Set(found.map((t) => t.slice(1)))]
}

/**
 * CHÈN anchor vào đầu prompt (nếu chưa có và có gì để chèn).
 * Đây là CHỐT CHẶN CUỐI: dù thợ quên, prompt lưu vào DB vẫn có khối khóa mặt.
 * Không đụng tới prompt đã có anchor — tránh chèn chồng khi chạy lại.
 */
export function ensureAnchor(prompt: string, assets: AssetFull[], tags?: unknown): string {
  if (hasAnchor(prompt)) return prompt
  // `tags` để kiểu unknown có chủ đích: nó đến thẳng từ LLM, có thể là chuỗi/null/số.
  const declared = toTagArray(tags)
  const use = declared.length ? declared : extractTags(prompt)
  const block = buildAnchorBlock(assets, use)
  return block ? `${block}\n\n${prompt}` : prompt
}

// ============================================================
// SOÁT TRÔI MẶT (drift check) — ép AI tự kiểm tra tính nhất quán
// ============================================================

/**
 * Phần THÂN prompt (sau khối anchor). Chỉ soát ở đây — bên trong khối anchor
 * thì mô tả ngoại hình là ĐÚNG, ngoài khối mới là mô tả chồng lấn gây trôi mặt.
 */
export function promptBody(prompt: string): string {
  const i = prompt.indexOf(ANCHOR_CLOSE)
  return i >= 0 ? prompt.slice(i + ANCHOR_CLOSE.length) : prompt
}

/** 1 lỗi soát được trong 1 prompt. */
export interface DriftIssue {
  level: 'error' | 'warn'
  code: string
  hint: string // đoạn chữ vi phạm (để người dùng thấy ngay chỗ sửa)
}

/**
 * Các mẫu mô tả NGOẠI HÌNH CỐ ĐỊNH — thứ chỉ được nằm trong khối anchor.
 * Viết lại chúng ở thân prompt = 2 mô tả chồng nhau = model chọn bừa = TRÔI MẶT.
 *
 * Vì sao chỉ bắt cụm (tính từ + danh từ) chứ không bắt từ đơn: "eyes" một mình là
 * biểu cảm (`eyes narrowing` — lớp MỀM, hợp lệ); "almond eyes" mới là đặc điểm cố định.
 */
const DRIFT_PATTERNS: Array<{ code: string; re: RegExp; level: 'error' | 'warn' }> = [
  {
    code: 'ta-lai-nguoi',
    // "a young Asian woman in her mid-20s" — đúng câu đã gây lỗi trong dự án thật
    re: /\ba\s+(?:young|old|middle-aged|elderly)?\s*(?:asian|caucasian|african|european|latina|latino|western|vietnamese)?\s*(?:man|woman|girl|boy|male|female|guy|lady)\b/gi,
    level: 'error'
  },
  {
    code: 'ta-lai-mat',
    re: /\b(?:oval|round|square|heart-shaped|angular|chiselled|chiseled|slender)\s+(?:face|jawline|jaw)\b/gi,
    level: 'error'
  },
  {
    code: 'ta-lai-ngu-quan',
    re: /\b(?:almond|round|hooded|deep-set|monolid|single-fold|double-fold|wide-set|expressive|piercing)\s+eyes?\b|\b(?:straight|aquiline|button|broad)\s+nose\b|\b(?:full|thin|plump)\s+lips?\b|\bhigh\s+cheekbones?\b/gi,
    level: 'error'
  },
  {
    code: 'ta-lai-tuoi',
    re: /\bin\s+(?:his|her|their)\s+(?:early|mid|late)?[-\s]?(?:teens|twenties|thirties|forties|fifties)\b|\bmid[-\s]?\d{2}s\b|\b\d{2}[-\s]years?[-\s]old\b/gi,
    level: 'error'
  },
  {
    code: 'ta-lai-da',
    re: /\b(?:fair|tan|olive|pale|dark|warm|light)\s+skin\b/gi,
    level: 'error'
  },
  {
    code: 'ta-lai-dang',
    re: /\b(?:slim|athletic|stocky|petite|muscular|lean|heavyset)\s+(?:build|frame|figure|physique)\b/gi,
    level: 'error'
  },
  {
    code: 'ta-lai-toc',
    // tóc là lớp MỀM L2 (đổi được theo cảnh) → chỉ CẢNH BÁO, không chặn
    re: /\b(?:black|brown|blonde|blond|red|silver|grey|gray|auburn)\s+hair\b|\bshoulder[-\s]length\b/gi,
    level: 'warn'
  }
]

/**
 * Soát 1 prompt ảnh: thiếu anchor? có tả chồng ngoại hình không?
 *
 * `charTags` = @tag NHÂN VẬT/SẢN PHẨM đã khóa của dự án. Chỉ soát khi prompt có
 * nhắc ít nhất 1 tag trong đó — prompt ảnh cảnh nền thuần (không người) thì mô tả
 * "a young woman" cũng chẳng có ai để trôi.
 */
export function checkPromptDrift(
  prompt: string,
  charTags: unknown,
  opts?: { requireAnchor?: boolean }
): DriftIssue[] {
  const issues: DriftIssue[] = []
  const used = extractTags(prompt)
  const want = new Set(toTagArray(charTags).map((t) => t.replace(/^@/, '').toUpperCase()))
  const touchesChar = used.some((t) => want.has(t.toUpperCase()))
  if (!touchesChar) return issues

  // requireAnchor=false cho prompt VIDEO: app chỉ chèn anchor vào prompt ẢNH (video lấy
  // danh tính từ ảnh đầu vào, không từ chữ) → đòi anchor ở video là báo lỗi oan 100%.
  // Nhưng phần tả-CHỒNG ngoại hình thì vẫn phải soát: video mà tả lại "a young Asian
  // woman" là ép model vẽ lại mặt thay vì bám ảnh gốc → vẫn trôi.
  if ((opts?.requireAnchor ?? true) && !hasAnchor(prompt)) {
    issues.push({
      level: 'error',
      code: 'thieu-anchor',
      hint: 'Prompt nhắc @tag nhân vật nhưng KHÔNG có khối [IDENTITY LOCK] mở đầu.'
    })
  }

  const body = promptBody(prompt)
  for (const p of DRIFT_PATTERNS) {
    p.re.lastIndex = 0
    const m = body.match(p.re)
    if (m?.length) {
      issues.push({ level: p.level, code: p.code, hint: [...new Set(m)].join(' · ') })
    }
  }
  return issues
}
