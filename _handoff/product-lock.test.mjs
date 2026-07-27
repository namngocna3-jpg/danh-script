// Test KHÓA NHẬN DẠNG CHO SẢN PHẨM — soát trực tiếp FILE THẬT, không chép lại logic.
//
// Vì sao đọc file thay vì import: form nằm trong .tsx (kéo theo React), còn ANCHOR_ORDER
// nằm ở shared/anchor.ts. Chép lại bảng để test thì test chỉ tự soi chính nó — đúng cái
// "sạch giả" đang chống. Đọc text file thì sửa nhầm bên nào cũng đỏ ngay.
//
// Thứ đang bảo vệ: bảng đè nhãn cho sản phẩm được phép đổi CHỮ HIỂN THỊ, nhưng KHÔNG
// được đổi `key` hay thứ tự — khối [IDENTITY LOCK] ghép theo ANCHOR_ORDER cố định; lệch
// một nhịp là 2 lần ghép ra 2 chuỗi khác nhau, đúng thứ cả cơ chế sinh ra để chống.
//
// Chạy: node _handoff/product-lock.test.mjs

import { readFileSync } from 'fs'

let pass = 0
let fail = 0
function ok(label, cond) {
  if (cond) {
    pass++
    console.log(`  ✓ ${label}`)
  } else {
    fail++
    console.log(`  ✗ ${label}`)
  }
}

const anchorSrc = readFileSync('src/shared/anchor.ts', 'utf-8')
const panelSrc = readFileSync('src/renderer/src/ui/wizard/AssetStudioPanel.tsx', 'utf-8')
const readerSrc = readFileSync('src/main/pipeline/readCharacter.ts', 'utf-8')

/** Cắt phần thân của một mảng khai báo `const NAME ... = [ ... ]`. */
function arrayBody(src, name) {
  const start = src.indexOf(`const ${name}`)
  if (start < 0) throw new Error(`không thấy ${name}`)
  const open = src.indexOf('= [', start)
  if (open < 0) throw new Error(`không thấy thân mảng của ${name}`)
  const end = src.indexOf('\n]', open)
  return src.slice(open, end)
}

// ---- ANCHOR_ORDER: thứ tự ghép chữ vào prompt (nguồn sự thật) ----
const anchorOrder = [...arrayBody(anchorSrc, 'ANCHOR_ORDER').matchAll(/'([a-z]+)'/g)].map(
  (m) => m[1]
)

// ---- LOCK_FIELDS: các ô của form ----
const lockBody = arrayBody(panelSrc, 'LOCK_FIELDS')
// Tách từng entry theo `{ key: 'xxx'` để biết ô nào có `dyn: true`.
const lockEntries = [...lockBody.matchAll(/key:\s*'([a-z]+)'([\s\S]*?)(?=key:\s*'|$)/g)].map(
  (m) => ({ key: m[1], dyn: /dyn:\s*true/.test(m[2]) })
)
const imgFields = lockEntries.filter((e) => !e.dyn).map((e) => e.key)
const dynFields = lockEntries.filter((e) => e.dyn).map((e) => e.key)

console.log('\n[1] LOCK_FIELDS (form) phải KHỚP ANCHOR_ORDER (chữ ghép vào prompt)')
{
  ok('ANCHOR_ORDER đọc được 8 khóa', anchorOrder.length === 8)
  ok(
    'thứ tự ô tầng ảnh trên form = thứ tự ghép anchor',
    JSON.stringify(imgFields) === JSON.stringify(anchorOrder)
  )
  ok('tầng động đúng 2 ô: demeanor + voice', JSON.stringify(dynFields) === '["demeanor","voice"]')
  ok('demeanor KHÔNG nằm trong anchor (ảnh tĩnh không có dáng đi)', !anchorOrder.includes('demeanor'))
  ok('voice KHÔNG nằm trong anchor (ảnh tĩnh không có giọng)', !anchorOrder.includes('voice'))
}

// ---- PRODUCT_FIELD_OVERRIDE: bảng đè nhãn cho sản phẩm ----
const ovStart = panelSrc.indexOf('const PRODUCT_FIELD_OVERRIDE')
const ovEnd = panelSrc.indexOf('\n}', ovStart)
const ovBody = panelSrc.slice(ovStart, ovEnd)
// Khóa cấp 1 = tên ô, nhận diện bằng `<tên>: {` ở đầu dòng thụt 2 khoảng.
const ovKeys = [...ovBody.matchAll(/^ {2}([a-z]+):\s*\{/gm)].map((m) => m[1])
const hidden = [...ovBody.matchAll(/^ {2}([a-z]+):\s*\{\s*hide:\s*true/gm)].map((m) => m[1])

console.log('\n[2] Bảng đè nhãn sản phẩm — chỉ đổi CHỮ, không đẻ khóa mới')
{
  ok('mọi khóa đè đều là ô có thật', ovKeys.every((k) => imgFields.includes(k)))
  ok(
    'KHÔNG đè khóa lạ (khóa lạ sẽ bị lọc bỏ, người dùng gõ xong mất trắng)',
    ovKeys.every((k) => anchorOrder.includes(k))
  )
  ok('ẩn đúng 3 ô vô nghĩa với vật thể', JSON.stringify(hidden.sort()) === '["age","hair","wardrobe"]')

  // Ba ô quyết định sản phẩm vẽ đúng hay sai — phải CÒN HIỆN và phải được đặt lại tên.
  const shown = imgFields.filter((k) => !hidden.includes(k))
  ok('features (chi tiết nhãn) còn hiện', shown.includes('features'))
  ok('signature (dấu thương hiệu) còn hiện', shown.includes('signature'))
  ok('body (tỉ lệ · dung tích) còn hiện', shown.includes('body'))
  ok('face (thân · chất liệu) còn hiện', shown.includes('face'))
  ok('aura (cảm giác thương hiệu) còn hiện', shown.includes('aura'))
  ok('sản phẩm còn 5 ô tầng ảnh', shown.length === 5)

  // Ô ẩn KHÔNG được đặt nhãn/placeholder — đặt là dấu hiệu ai đó định hiện lại nửa vời.
  ok(
    'ô ẩn không kèm nhãn thừa',
    hidden.every((k) => !new RegExp(`${k}:\\s*\\{\\s*hide:\\s*true,`).test(ovBody))
  )

  // Nhãn phải đổi thật, không phải giữ nguyên chữ của người.
  ok('không còn nhãn "Ngũ quan" cho sản phẩm', /features:\s*\{[\s\S]*?Chi tiết nhãn/.test(ovBody))
  ok('không còn nhãn "Vóc dáng" cho sản phẩm', /body:\s*\{[\s\S]*?Tỉ lệ/.test(ovBody))
}

console.log('\n[3] Prompt đọc ảnh — sản phẩm có bộ hướng dẫn RIÊNG')
{
  ok('có SYSTEM_PRODUCT', readerSrc.includes('const SYSTEM_PRODUCT'))
  ok('có SYSTEM_CHAR', readerSrc.includes('const SYSTEM_CHAR'))
  ok('chọn prompt theo role', /isProduct \? SYSTEM_PRODUCT : SYSTEM_CHAR/.test(readerSrc))
  ok("mặc định là 'char' (chỗ gọi cũ không đổi hành vi)", /role: AssetRole = 'char'/.test(readerSrc))

  const prodStart = readerSrc.indexOf('const SYSTEM_PRODUCT')
  const prod = readerSrc.slice(prodStart, readerSrc.indexOf('`', readerSrc.indexOf('`', prodStart) + 1))

  // Khung JSON phải còn ĐỦ 8 khóa: thiếu khóa nào thì model bỏ qua ô đó vĩnh viễn.
  ok('khung JSON còn đủ 8 khóa', anchorOrder.every((k) => prod.includes(`"${k}":""`)))
  ok('dặn để RỖNG 3 ô người-mới-có', /age, hair, wardrobe: ALWAYS return ""/.test(prod))
  ok('cấm bịa dấu thương hiệu', /NEVER invent a mark/.test(prod))
  ok('cấm đoán tên thương hiệu không đọc được', /do not guess it/.test(prod))
  ok('cấm tả ánh sáng/phản chiếu (lớp mềm đổi theo cảnh)', /NEVER describe lighting/.test(prod))
  ok('cấm tả giọt nước/tay cầm', /condensation|hand holding/.test(prod))
  ok('cấm nêu tên thương hiệu có thật', /NEVER name a real brand/.test(prod))
  ok('notes viết tiếng Việt', /notes: Vietnamese/.test(prod))
  ok('nhấn features là ô quan trọng nhất', /single most important field/.test(prod))
}

console.log('\n[4] IPC truyền role xuống — không thì sản phẩm vẫn bị tả như người')
{
  const ipcSrc = readFileSync('src/main/ipc.ts', 'utf-8')
  ok('gọi kèm asset.role', /readCharacterFromImages\(paths, tag, asset\.role\)/.test(ipcSrc))
}

console.log(`\n${fail === 0 ? '✅' : '❌'} ${pass} pass · ${fail} fail\n`)
process.exit(fail === 0 ? 0 : 1)
