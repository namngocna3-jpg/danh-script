// Test 2 chỗ dễ sai âm thầm của luồng ĐỌC ẢNH NHÂN VẬT:
//   1. dataUrlToImageBlock — tách data URL → khối ảnh Anthropic (sai regex = API 400)
//   2. lọc/bóc JSON model trả về (model hay bọc ```json, hay trả thừa khóa lạ)
//
// Vì sao phải test: cả hai đều "im lặng khi hỏng". Regex sai thì nút Đọc ảnh chỉ báo
// lỗi mơ hồ; lọc khóa sai thì rác model bịa (vd "gender") lọt thẳng vào hồ sơ khóa mặt
// rồi chui vào 100% prompt ảnh.
//
// Chạy (2 dòng, từ gốc repo). Cần --bundle vì llmGateway kéo theo settings.ts, và cần
// --alias:electron vì settings.ts dùng app/safeStorage (stub rỗng là đủ — hàm đang test
// không chạm electron):
//   node_modules/@esbuild/win32-x64/esbuild.exe src/main/core/llmGateway.ts --bundle --platform=node --format=esm --outfile=_handoff/.gw.build.mjs --alias:electron=./_handoff/.electron-stub.mjs
//   node _handoff/read-character.test.mjs

import { dataUrlToImageBlock } from './.gw.build.mjs'

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

console.log('\n[1] dataUrlToImageBlock — tách data URL')
{
  const b = dataUrlToImageBlock('data:image/png;base64,iVBORw0KGgo=')
  ok('type = image', b?.type === 'image')
  ok('source.type = base64', b?.source?.type === 'base64')
  ok('lấy đúng media_type', b?.source?.media_type === 'image/png')
  ok(
    'BỎ tiền tố data: — Anthropic đòi base64 THUẦN',
    b?.source?.data === 'iVBORw0KGgo=' && !b.source.data.includes('data:')
  )

  ok('jpeg', dataUrlToImageBlock('data:image/jpeg;base64,/9j/4A==')?.source.media_type === 'image/jpeg')
  ok('webp', dataUrlToImageBlock('data:image/webp;base64,UklGRg==')?.source.media_type === 'image/webp')
  ok(
    'svg+xml (mime có dấu +)',
    dataUrlToImageBlock('data:image/svg+xml;base64,PHN2Zz4=')?.source.media_type === 'image/svg+xml'
  )
  ok('HOA/thường lẫn lộn vẫn nhận', dataUrlToImageBlock('DATA:IMAGE/PNG;BASE64,AAAA') !== null)
  ok('có khoảng trắng thừa 2 đầu', dataUrlToImageBlock('  data:image/png;base64,AAAA  ') !== null)

  // Các ca PHẢI trả null — thà không gửi còn hơn gửi rác lên API rồi ăn 400 khó hiểu.
  ok('null → null', dataUrlToImageBlock(null) === null)
  ok('undefined → null', dataUrlToImageBlock(undefined) === null)
  ok('chuỗi rỗng → null', dataUrlToImageBlock('') === null)
  ok('đường dẫn file (readThumb trả null) → null', dataUrlToImageBlock('C:/refs/1/a.png') === null)
  ok('data URL KHÔNG phải ảnh → null', dataUrlToImageBlock('data:text/plain;base64,QUJD') === null)
  ok('thiếu phần base64 → null', dataUrlToImageBlock('data:image/png;base64,') === null)
  ok('không có ;base64 → null', dataUrlToImageBlock('data:image/png,rawdata') === null)
}

// ---- Bản sao logic parse/lọc trong readCharacter.ts ----
// Chép lại (không import) vì readCharacter.ts kéo theo electron + db, không build được
// thành ESM thuần. Đổi bên kia thì phải đổi cả bên này — 2 khối nhỏ, chấp nhận được.
const IMG_KEYS = ['age', 'face', 'features', 'signature', 'hair', 'body', 'wardrobe', 'aura']

function parseJson(text) {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  try {
    return JSON.parse(cleaned)
  } catch {
    const m = /\{[\s\S]*\}/.exec(cleaned)
    if (m) {
      try {
        return JSON.parse(m[0])
      } catch {
        /* rơi xuống dưới */
      }
    }
    throw new Error('bad json')
  }
}

function toLock(json) {
  const lock = {}
  for (const k of IMG_KEYS) {
    const v = json[k]
    if (typeof v === 'string' && v.trim()) lock[k] = v.trim()
  }
  return lock
}

console.log('\n[2] parseJson — model hay bọc rào dù đã dặn đừng')
{
  ok('JSON trần', parseJson('{"face":"Oval"}').face === 'Oval')
  ok('bọc ```json', parseJson('```json\n{"face":"Oval"}\n```').face === 'Oval')
  ok('bọc ``` trơn', parseJson('```\n{"face":"Oval"}\n```').face === 'Oval')
  ok('có chữ dẫn trước JSON', parseJson('Here you go:\n{"face":"Oval"}').face === 'Oval')
  ok('thừa khoảng trắng 2 đầu', parseJson('  \n {"face":"Oval"} \n ').face === 'Oval')
  let threw = false
  try {
    parseJson('xin lỗi tôi không đọc được ảnh')
  } catch {
    threw = true
  }
  ok('không có JSON → NÉM lỗi (không nuốt im lặng)', threw)
}

console.log('\n[3] toLock — lọc rác, giữ đúng 8 ô tầng ảnh')
{
  const lock = toLock({
    age: '26',
    face: 'Oval face, warm tan skin',
    features: '  Almond eyes  ',
    signature: '',
    hair: 'Black, shoulder-length',
    body: '7.5-head',
    wardrobe: '',
    aura: 'quiet intensity',
    notes: 'Ảnh chỉ có chân dung',
    gender: 'female',
    expression: 'smiling'
  })

  ok('giữ ô có chữ', lock.face === 'Oval face, warm tan skin')
  ok('CẮT khoảng trắng 2 đầu', lock.features === 'Almond eyes')
  ok('BỎ ô rỗng (signature) — thà trống còn hơn bịa', !('signature' in lock))
  ok('BỎ ô rỗng (wardrobe)', !('wardrobe' in lock))
  ok('BỎ khóa lạ model tự thêm: gender', !('gender' in lock))
  ok('BỎ khóa lạ: expression (đó là lớp MỀM, lọt vào là chống bối cảnh)', !('expression' in lock))
  ok('BỎ notes khỏi hồ sơ (notes là chữ tiếng Việt cho người, không vào prompt)', !('notes' in lock))
  ok('đúng 6 ô còn lại', Object.keys(lock).length === 6)

  // Tầng ĐỘNG không nằm trong IMG_KEYS: model có bịa ra cũng không lọt vào hồ sơ,
  // vì ảnh tĩnh không cho biết dáng đi/giọng nói.
  const dyn = toLock({ face: 'Oval', demeanor: 'walks fast', voice: 'deep alto' })
  ok('BỎ demeanor — ảnh tĩnh không có dáng đi', !('demeanor' in dyn))
  ok('BỎ voice — ảnh tĩnh không có giọng', !('voice' in dyn))

  ok('sai kiểu (số) → bỏ', !('age' in toLock({ age: 26 })))
  ok('sai kiểu (mảng) → bỏ', !('features' in toLock({ features: ['a', 'b'] })))
  ok('null → bỏ', !('face' in toLock({ face: null })))
  ok('toàn khoảng trắng → bỏ', !('face' in toLock({ face: '   ' })))
  ok('JSON rỗng → hồ sơ rỗng', Object.keys(toLock({})).length === 0)
}

console.log(`\n${fail === 0 ? '✅' : '❌'} ${pass} pass · ${fail} fail\n`)
process.exit(fail === 0 ? 0 : 1)
