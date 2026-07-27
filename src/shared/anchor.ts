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

/** Có nội dung khóa nào không (rỗng hết = chưa khóa mặt). */
export function hasLock(lock: IdentityLock | null | undefined): boolean {
  if (!lock) return false
  return ANCHOR_ORDER.some((k) => lock[k]?.trim())
}

/**
 * Dựng 1 DÒNG anchor cho 1 asset: "@TAG: <các mục ghép lại>".
 * Thứ tự cố định theo ANCHOR_ORDER để mọi lần ghép ra chuỗi GIỐNG HỆT nhau —
 * đây chính là thứ khiến 16 block không lệch. Trả '' nếu asset chưa khóa gì.
 */
export function anchorLine(tag: string, lock: IdentityLock | null | undefined): string {
  if (!hasLock(lock)) return ''
  const l = lock as IdentityLock
  const parts = ANCHOR_ORDER.map((k) => l[k]?.trim()).filter((s): s is string => Boolean(s))
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
    const line = anchorLine(a.tag, a.identity_lock)
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
