// Test CHỐNG TÁI PHÁT ca "thợ dừng giữa chừng vì tưởng hồ sơ chưa đủ mục".
//
// BỆNH CŨ: tool read_assets chỉ ló ra 2 trường identity_face + identity_body. Người dùng
// điền đủ 6/8 ô ở form, nhưng thợ ĐỌC CHỈ THẤY 2 → nó tự kết luận "mới có 2 mục, chưa đủ
// ghép khối" → bịa ra luật "phải có features mới chèn được anchor" → DỪNG sau 3/16 block.
// Luật đó KHÔNG tồn tại: hasLock() chỉ cần MỘT ô có chữ.
//
// Test đọc thẳng FILE THẬT (không import: tools/index.ts kéo theo electron + db).
// Chạy: node _handoff/read-assets-lock.test.mjs

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

const toolsSrc = readFileSync('src/main/tools/index.ts', 'utf-8')
const anchorSrc = readFileSync('src/shared/anchor.ts', 'utf-8')
const skillSrc = readFileSync('skills/free/_execution_imgPrompter.md', 'utf-8')

/** Cắt thân của một khai báo `const NAME: ToolDef = { ... }` tới dấu `\n}` đầu tiên. */
function toolBody(name) {
  const start = toolsSrc.indexOf(`const ${name}: ToolDef`)
  if (start < 0) throw new Error(`không thấy tool ${name}`)
  const end = toolsSrc.indexOf('\n}', start)
  return toolsSrc.slice(start, end)
}

const readAssets = toolBody('readAssets')

console.log('\n[1] read_assets phải ló ra ĐỦ hồ sơ, không chỉ 2 trường')
{
  // Soát dạng KHAI BÁO FIELD (`identity_face:`) chứ không soát chuỗi trần — phần comment
  // giải thích bệnh cũ có nhắc tên hai trường này, đó là tư liệu chứ không phải code.
  ok('KHÔNG còn trường cụt identity_face', !/identity_face:/.test(readAssets))
  ok('KHÔNG còn trường cụt identity_body', !/identity_body:/.test(readAssets))
  ok('có identity_locked (trạng thái khóa)', /identity_locked:/.test(readAssets))
  ok('có identity_anchor (khối chữ app sẽ chèn)', /identity_anchor:/.test(readAssets))
  ok('trạng thái khóa tính bằng hasLock', /hasLock\(a\?\.identity_lock\)/.test(readAssets))
  ok('anchor ghép bằng anchorLine (đúng thứ tự ANCHOR_ORDER)', /anchorLine\(t\.tag/.test(readAssets))
  ok(
    'chưa khóa thì identity_anchor để undefined (không trả chuỗi rỗng gây hiểu nhầm)',
    /locked \? anchorLine\([\s\S]*?: undefined/.test(readAssets)
  )
}

console.log('\n[2] Mô tả tool phải DẶN THẲNG: locked=true thì cứ ghi, cấm dừng')
{
  ok('nhắc đọc identity_locked', /ĐỌC `identity_locked`/.test(readAssets))
  ok('nói rõ true = app tự chèn', /true = ĐÃ khóa, app sẽ tự chèn/.test(readAssets))
  ok('cấm dừng đòi bổ sung', /KHÔNG được dừng lại đòi bổ sung/.test(readAssets))
  ok('nói rõ KHÔNG cần điền thêm ô nào', /KHÔNG cần điền thêm ô nào/.test(readAssets))
  ok('dặn không chép lại anchor vào prompt', /KHÔNG phải chép lại/.test(readAssets))
  ok('chỉ gọi lock_identity khi locked=false', /Chỉ khi identity_locked=false/.test(readAssets))
}

console.log('\n[3] Luật gốc KHÔNG đổi — vẫn là "một ô cũng đủ"')
{
  // Đây là thứ khiến lời dặn ở trên ĐÚNG. Nếu ai đó siết hasLock lại thành "đủ 3 ô"
  // thì mô tả tool thành nói dối — nên khóa luôn ở đây.
  ok(
    'hasLock = some() (MỘT ô có chữ là đủ)',
    /export function hasLock[\s\S]*?ANCHOR_ORDER\.some\(\(k\) => lock\[k\]\?\.trim\(\)\)/.test(
      anchorSrc
    )
  )
  ok('KHÔNG có luật đếm số ô tối thiểu', !/\.filter\([\s\S]{0,60}\)\.length\s*>=\s*[23]/.test(anchorSrc))
  ok(
    'anchorLine ghép mọi ô CÓ CHỮ, không đòi ô cụ thể',
    /parts = ANCHOR_ORDER\.map\(\(k\) => l\[k\]\?\.trim\(\)\)\.filter/.test(anchorSrc)
  )
  ok(
    'ensureAnchor vẫn là chốt chặn cuối trong write_image_prompt',
    /ensureAnchor\(raw, assets, declared\)/.test(toolsSrc)
  )
}

console.log('\n[4] Skill thợ ảnh KHÔNG được dạy luật "đủ mục" bịa ra')
{
  ok('có cảnh báo CHỈ dừng khi có warning thật', /CHỈ dừng khi có `warning` THẬT/.test(skillSrc))
  ok('nói rõ ÍT NHẤT MỘT ô là đủ', /ÍT NHẤT MỘT\*{0,2} ô hồ sơ ảnh không rỗng/.test(skillSrc))
  ok('phủ nhận luật số ô tối thiểu', /KHÔNG có luật số ô tối thiểu/.test(skillSrc))
  ok('nói rõ features KHÔNG bắt buộc', /kể cả `features`/.test(skillSrc))
  ok('locked=true thì ghi hết 100% block', /cứ ghi hết 100% block, cấm dừng/.test(skillSrc))
  // Câu cũ "điền tối thiểu 3 ô" đọc như điều kiện kỹ thuật → phải bỏ.
  ok('bỏ chữ "điền tối thiểu 3 ô"', !/điền tối thiểu 3 ô/.test(skillSrc))
}

console.log(`\n${fail === 0 ? '✅' : '❌'} ${pass} pass · ${fail} fail\n`)
process.exit(fail === 0 ? 0 : 1)
