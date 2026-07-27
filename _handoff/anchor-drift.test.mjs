// Test bộ KHÓA MẶT (src/shared/anchor.ts): ghép khối anchor + soát tả-chồng-ngoại-hình.
// Regex soát drift dễ sai âm thầm (bắt nhầm biểu cảm / bỏ sót mô tả cố định) nên phải có test.
//
// Chạy (2 dòng, từ gốc repo):
//   npx esbuild src/shared/anchor.ts --format=esm --outfile=_handoff/.anchor.build.mjs
//   node _handoff/anchor-drift.test.mjs

import {
  anchorLine,
  buildAnchorBlock,
  buildDynamicBlock,
  buildVideoIdentityLock,
  ensureAnchor,
  ensureVideoLock,
  hasAnchor,
  checkPromptDrift,
  extractTags,
  ANCHOR_OPEN
} from './.anchor.build.mjs'

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

const LOCK = {
  age: '26',
  face: 'Oval face, warm tan skin',
  features: 'Single-fold almond eyes, straight nose bridge',
  hair: 'Black hair, shoulder-length, center part',
  body: 'Athletic build, 7.5-head proportion',
  aura: 'Quiet stubborn intensity'
}

const ASSETS = [
  { tag: 'NUCHINH', identity_lock: LOCK },
  { tag: 'QUANCAFE', identity_lock: null },
  { tag: 'COCO', identity_lock: { face: 'Slim aluminium can, teal label', body: '330ml' } }
]

console.log('\n[1] anchorLine — thứ tự cố định, ghép ổn định')
{
  const a = anchorLine('NUCHINH', LOCK)
  ok('mở đầu bằng @TAG:', a.startsWith('@NUCHINH: '))
  ok('tuổi đứng trước mặt', a.indexOf('26') < a.indexOf('Oval face'))
  ok('ngũ quan trước tóc', a.indexOf('almond eyes') < a.indexOf('Black hair'))
  ok('dáng trước khí chất', a.indexOf('Athletic build') < a.indexOf('Quiet stubborn'))
  ok('ghép 2 lần ra CHUỖI GIỐNG HỆT', anchorLine('NUCHINH', LOCK) === a)
  ok('lock rỗng → chuỗi rỗng', anchorLine('X', null) === '')
  ok('lock toàn khoảng trắng → rỗng', anchorLine('X', { face: '  ', body: '' }) === '')
}

console.log('\n[2] buildAnchorBlock — lọc theo @tag, bỏ asset chưa khóa')
{
  const all = buildAnchorBlock(ASSETS)
  ok('có nhãn mở', all.includes(ANCHOR_OPEN))
  ok('gồm asset đã khóa', all.includes('@NUCHINH') && all.includes('@COCO'))
  ok('BỎ asset chưa khóa (@QUANCAFE)', !all.includes('@QUANCAFE'))

  const one = buildAnchorBlock(ASSETS, ['NUCHINH'])
  ok('lọc only → chỉ tag yêu cầu', one.includes('@NUCHINH') && !one.includes('@COCO'))
  ok('only chấp nhận có dấu @', buildAnchorBlock(ASSETS, ['@NUCHINH']) === one)
  ok('only không phân biệt hoa/thường', buildAnchorBlock(ASSETS, ['nuchinh']) === one)
  ok('không asset nào khóa → rỗng', buildAnchorBlock([{ tag: 'A', identity_lock: null }]) === '')
}

console.log('\n[3] ensureAnchor — chốt chặn cuối, không chèn chồng')
{
  const raw = '@NUCHINH grips the rope, rain on her jacket.'
  const out = ensureAnchor(raw, ASSETS)
  ok('tự chèn khi thiếu', hasAnchor(out))
  ok('giữ nguyên thân prompt', out.includes(raw))
  ok('anchor đứng ĐẦU', out.trimStart().startsWith(ANCHOR_OPEN))
  ok('chạy lại KHÔNG chèn 2 lần', ensureAnchor(out, ASSETS) === out)
  ok(
    'prompt không @tag nào khóa → giữ nguyên',
    ensureAnchor('Empty cafe at dusk, @QUANCAFE.', ASSETS) === 'Empty cafe at dusk, @QUANCAFE.'
  )
  ok('tự suy @tag từ thân prompt', ensureAnchor(raw, ASSETS).includes('Oval face'))
}

console.log('\n[4] extractTags')
{
  ok('bắt nhiều tag', extractTags('@A and @B_2 meet').join(',') === 'A,B_2')
  ok('khử trùng lặp', extractTags('@A @A @A').length === 1)
  ok('bỏ qua chữ thường', extractTags('@lower').length === 0)
}

const TAGS = ['NUCHINH', 'COCO']
const anchored = (body) => `${buildAnchorBlock(ASSETS, ['NUCHINH'])}\n\n${body}`

console.log('\n[5] checkPromptDrift — BẮT tả chồng ngoại hình')
{
  const codes = (body) => checkPromptDrift(anchored(body), TAGS).map((i) => i.code)

  ok(
    'thiếu anchor mà có @tag → lỗi',
    checkPromptDrift('@NUCHINH climbs.', TAGS).some((i) => i.code === 'thieu-anchor')
  )
  ok(
    '"a young Asian woman" (lỗi thật của dự án)',
    codes('A young Asian woman, @NUCHINH, climbs.').includes('ta-lai-nguoi')
  )
  ok('"oval face"', codes('@NUCHINH, oval face, looks up.').includes('ta-lai-mat'))
  ok('"almond eyes"', codes('@NUCHINH with almond eyes.').includes('ta-lai-ngu-quan'))
  ok('"high cheekbones"', codes('@NUCHINH, high cheekbones.').includes('ta-lai-ngu-quan'))
  ok('"in her mid-20s"', codes('@NUCHINH in her mid-20s climbs.').includes('ta-lai-tuoi'))
  ok('"26-year-old"', codes('@NUCHINH, a 26-year-old, climbs.').includes('ta-lai-tuoi'))
  ok('"tan skin"', codes('@NUCHINH with tan skin.').includes('ta-lai-da'))
  ok('"athletic build"', codes('@NUCHINH, athletic build, climbs.').includes('ta-lai-dang'))
  {
    const is = checkPromptDrift(anchored('@NUCHINH, black hair, climbs.'), TAGS)
    ok('"black hair" bị bắt', is.some((i) => i.code === 'ta-lai-toc'))
    ok(
      'tóc chỉ CẢNH BÁO (lớp mềm L2, đổi được theo cảnh)',
      is.every((i) => i.code !== 'ta-lai-toc' || i.level === 'warn')
    )
  }
  {
    const is = checkPromptDrift(anchored('@NUCHINH, oval face.'), TAGS)
    ok(
      'hint = cụm bị bắt (thấy ngay chỗ sửa)',
      is.some((i) => i.hint.toLowerCase().includes('oval face'))
    )
  }
}

console.log('\n[6] checkPromptDrift — KHÔNG bắt nhầm (false-positive)')
{
  const clean = (body) =>
    checkPromptDrift(anchored(body), TAGS).filter((i) => i.level === 'error').length === 0

  ok(
    'biểu cảm/ánh mắt là lớp MỀM, hợp lệ',
    clean('@NUCHINH grips the rope, her eyes narrowing, jaw tightening.')
  )
  ok('hành động + bối cảnh', clean('@NUCHINH pulls up onto the ledge at @QUANCAFE, rain falling.'))
  ok('trang phục theo cảnh', clean('@NUCHINH in a red waterproof jacket and harness.'))
  ok('ánh sáng/style', clean('@NUCHINH lit by low golden backlight, cinematic, sharp, high detail.'))
  ok('câu ổn định giải phẫu chung', clean('@NUCHINH, natural anatomy, five fingers.'))
  ok(
    'mô tả TRONG khối anchor KHÔNG bị tính là chồng',
    checkPromptDrift(anchored('@NUCHINH climbs.'), TAGS).length === 0
  )
  ok(
    'prompt cảnh nền thuần (không @tag nhân vật) → bỏ qua hoàn toàn',
    checkPromptDrift('A young woman walks past. Empty cafe @QUANCAFE.', TAGS).length === 0
  )
  ok('không tag nào khóa → bỏ qua', checkPromptDrift('@NUCHINH climbs.', []).length === 0)
}

console.log('\n[7] CHỐNG "only.map is not a function" — LLM gửi tag SAI KIỂU')
{
  // Lỗi thật user gặp: thợ gửi associate_asset_tags là CHUỖI, không phải mảng.
  // Bẫy: chuỗi cũng có .length truthy nên guard `only?.length` LỌT, tới .map() mới nổ
  // → mất trắng lượt ghi, thợ tưởng sai tên tool và lặp ~40 bước vô ích.
  const one = buildAnchorBlock(ASSETS, ['NUCHINH'])

  ok('only là CHUỖI 1 tag → không nổ, ra đúng khối', buildAnchorBlock(ASSETS, 'NUCHINH') === one)
  ok('only là CHUỖI có @', buildAnchorBlock(ASSETS, '@NUCHINH') === one)
  ok(
    'only là CHUỖI nhiều tag "@NUCHINH, @COCO"',
    buildAnchorBlock(ASSETS, '@NUCHINH, @COCO') === buildAnchorBlock(ASSETS, ['NUCHINH', 'COCO'])
  )
  ok('only là SỐ → coi như không lọc', buildAnchorBlock(ASSETS, 42) === buildAnchorBlock(ASSETS))
  ok('only là object → coi như không lọc', buildAnchorBlock(ASSETS, {}) === buildAnchorBlock(ASSETS))
  ok('only là chuỗi rỗng → coi như không lọc', buildAnchorBlock(ASSETS, '   ') === buildAnchorBlock(ASSETS))

  const raw = '@NUCHINH grips the rope.'
  ok('ensureAnchor với tags CHUỖI → vẫn chèn anchor', hasAnchor(ensureAnchor(raw, ASSETS, '@NUCHINH')))
  ok('ensureAnchor với tags SỐ → không nổ', ensureAnchor(raw, ASSETS, 7) === ensureAnchor(raw, ASSETS))
  ok('ensureAnchor với tags null → không nổ', hasAnchor(ensureAnchor(raw, ASSETS, null)))
  ok(
    'checkPromptDrift với charTags CHUỖI → không nổ',
    checkPromptDrift('@NUCHINH climbs.', 'NUCHINH').some((i) => i.code === 'thieu-anchor')
  )
  ok('checkPromptDrift với charTags null → bỏ qua', checkPromptDrift('@NUCHINH climbs.', null).length === 0)
}

console.log('\n[8] checkPromptDrift — chế độ VIDEO (requireAnchor: false)')
{
  const vid = (body) => checkPromptDrift(body, TAGS, { requireAnchor: false })

  ok(
    'prompt video KHÔNG anchor → KHÔNG báo thieu-anchor (video bám ảnh, không bám chữ)',
    vid('@Image1 as the first frame; @NUCHINH pulls up, camera dollies in.').length === 0
  )
  ok(
    'nhưng VẪN bắt tả lại ngoại hình',
    vid('@NUCHINH, a young Asian woman, pulls up.').some((i) => i.code === 'ta-lai-nguoi')
  )
  ok(
    'vẫn bắt "almond eyes" trong scene video',
    vid('@NUCHINH with almond eyes turns to camera.').some((i) => i.code === 'ta-lai-ngu-quan')
  )
  ok(
    'mặc định (không opts) vẫn ĐÒI anchor — không phá hành vi cổng ảnh',
    checkPromptDrift('@NUCHINH climbs.', TAGS).some((i) => i.code === 'thieu-anchor')
  )
}

console.log('\n[9] Hồ sơ MỞ RỘNG — signature/wardrobe (tầng ảnh) + demeanor/voice (tầng động)')
{
  const FULL = {
    ...LOCK,
    signature: 'Small mole below outer corner of left eye',
    wardrobe: 'Round tortoiseshell glasses',
    demeanor: 'Long unhurried strides',
    voice: 'Low warm alto'
  }
  const a = anchorLine('NUCHINH', FULL)

  ok('signature VÀO khối anchor', a.includes('Small mole'))
  ok('wardrobe VÀO khối anchor', a.includes('tortoiseshell'))
  ok(
    'signature đứng NGAY SAU ngũ quan (tín hiệu mạnh nhất đặt sớm)',
    a.indexOf('almond eyes') < a.indexOf('Small mole') &&
      a.indexOf('Small mole') < a.indexOf('Black hair')
  )
  ok('wardrobe sau vóc dáng, trước khí chất',
    a.indexOf('Athletic build') < a.indexOf('tortoiseshell') &&
      a.indexOf('tortoiseshell') < a.indexOf('Quiet stubborn'))

  // Đây là ranh giới quan trọng nhất của thay đổi này: nhét dáng đi/giọng vào prompt
  // ẢNH là phình prompt vô ích (ảnh tĩnh không có 2 thứ đó) → phải KHÔNG lọt vào.
  ok('demeanor KHÔNG lọt vào anchor ảnh', !a.includes('unhurried strides'))
  ok('voice KHÔNG lọt vào anchor ảnh', !a.includes('warm alto'))
  ok('ghép 2 lần vẫn GIỐNG HỆT', anchorLine('NUCHINH', FULL) === a)

  // Chỉ khai tầng động = CHƯA khóa mặt. Nếu hasLock trả true ở đây thì UI báo ✅ đã khóa
  // trong khi buildAnchorBlock ra rỗng → đúng bẫy "sạch giả".
  ok(
    'CHỈ có demeanor/voice → coi như CHƯA khóa (anchor rỗng)',
    anchorLine('X', { demeanor: 'walks fast', voice: 'deep' }) === ''
  )

  console.log('  — buildDynamicBlock')
  const dyn = buildDynamicBlock([{ tag: 'NUCHINH', identity_lock: FULL }])
  ok('gom dáng điệu + giọng', dyn.includes('unhurried strides') && dyn.includes('warm alto'))
  ok('KHÔNG kèm mô tả ngoại hình', !dyn.includes('almond eyes') && !dyn.includes('Oval face'))
  ok('dặn rõ KHÔNG chép vào prompt', dyn.includes('KHÔNG chép vào prompt'))
  ok('không ai khai tầng động → rỗng', buildDynamicBlock(ASSETS) === '')
  ok('asset chưa khóa gì → rỗng', buildDynamicBlock([{ tag: 'A', identity_lock: null }]) === '')
}

console.log('\n[10] CHẾ ĐỘ TRỎ — asset đã có ảnh tư liệu thì anchor NGẮN LẠI')
{
  // Ca thật: người dùng ĐÃ đính ảnh vào Seedance mà mặt vẫn trôi. Nguyên nhân: khối chữ
  // tả ngũ quan trở thành NGUỒN THỨ HAI cạnh tranh với chính tấm ảnh → model vẽ mặt THỨ BA.
  const FULL = {
    ...LOCK,
    signature: 'Small mole below outer corner of left eye',
    wardrobe: 'Round tortoiseshell glasses'
  }
  const ref = anchorLine('NUCHINH', FULL, true)
  const desc = anchorLine('NUCHINH', FULL, false)

  ok('vẫn mở đầu bằng @TAG:', ref.startsWith('@NUCHINH: '))
  ok('có câu TRỎ VỀ ẢNH', ref.includes('reference image'))
  ok('câu trỏ đứng ĐẦU (model bám mạnh nhất ở đầu)', ref.indexOf('reference image') < ref.indexOf('Small mole'))

  // 6 ô bị bỏ — đây là toàn bộ lý do tồn tại của chế độ này.
  ok('BỎ tuổi', !ref.includes('26'))
  ok('BỎ khuôn mặt/da', !ref.includes('Oval face'))
  ok('BỎ ngũ quan', !ref.includes('almond eyes'))
  ok('BỎ tóc', !ref.includes('Black hair'))
  ok('BỎ vóc dáng', !ref.includes('Athletic build'))
  ok('BỎ trang phục', !ref.includes('tortoiseshell'))

  // 2 ô GIỮ LẠI — chữ BÙ cho ảnh chứ không đè lên ảnh.
  ok('GIỮ signature (JPEG hay làm mất nốt ruồi/sẹo)', ref.includes('Small mole'))
  ok('GIỮ aura (chi phối biểu cảm, không phải hình dáng)', ref.includes('Quiet stubborn'))

  ok('NGẮN HƠN hẳn chế độ tả', ref.length < desc.length)
  ok('ghép 2 lần vẫn GIỐNG HỆT', anchorLine('NUCHINH', FULL, true) === ref)
  ok('mặc định (không truyền cờ) = chế độ TẢ — không phá hành vi cũ', anchorLine('NUCHINH', FULL) === desc)
  ok('chưa khóa gì → rỗng dù có ảnh', anchorLine('X', null, true) === '')
  ok(
    'chỉ có signature + có ảnh → vẫn ra dòng trỏ',
    anchorLine('X', { signature: 'Chipped front tooth' }, true).includes('reference image')
  )

  console.log('  — buildAnchorBlock tự chọn chế độ THEO TỪNG ASSET')
  const MIXED = [
    { tag: 'NUCHINH', identity_lock: FULL, ref_image_path: 'C:/img/nuchinh.png' },
    { tag: 'BANHMI', identity_lock: { face: 'Golden crusty baguette', aura: 'homely warmth' }, ref_image_path: null }
  ]
  const block = buildAnchorBlock(MIXED)
  ok('asset CÓ ảnh → dòng trỏ', block.includes('reference image'))
  ok('asset CÓ ảnh → không tả ngũ quan', !block.includes('almond eyes'))
  ok('asset CHƯA ảnh → vẫn tả đầy đủ', block.includes('Golden crusty baguette'))
  ok('trộn 2 chế độ trong CÙNG một khối', block.includes('@NUCHINH') && block.includes('@BANHMI'))
  ok('ref_image_path rỗng chuỗi → coi như CHƯA có ảnh',
    buildAnchorBlock([{ tag: 'A', identity_lock: FULL, ref_image_path: '' }]).includes('almond eyes'))
}

console.log('\n[11] KHÓA DANH TÍNH VIDEO — app ghép, không để thợ tự viết')
{
  const V = [
    { tag: 'LAN', role: 'char', identity_lock: LOCK },
    { tag: 'SERUM', role: 'product', identity_lock: { face: 'Frosted glass bottle, gold cap' } },
    { tag: 'QUANCAFE', role: 'scene', identity_lock: { face: 'Corner cafe, warm wood' } },
    { tag: 'CHUAKHOA', role: 'char', identity_lock: null }
  ]

  console.log('  — buildVideoIdentityLock')
  const lock = buildVideoIdentityLock(V)
  ok('gồm nhân vật đã khóa', lock.includes('@LAN'))
  ok('gồm sản phẩm đã khóa', lock.includes('@SERUM'))
  ok('BỎ bối cảnh (không có mặt để trôi)', !lock.includes('@QUANCAFE'))
  ok('BỎ char chưa khóa', !lock.includes('@CHUAKHOA'))
  ok('nhắc "first frame" (video bám ảnh khung đầu)', lock.includes('first frame'))
  ok('KHÔNG tả ngoại hình bằng chữ', !lock.includes('almond eyes') && !lock.includes('Oval face'))
  ok('ghép 2 lần GIỐNG HỆT', buildVideoIdentityLock(V) === lock)
  ok('lọc theo tags', buildVideoIdentityLock(V, ['LAN']).includes('@LAN') && !buildVideoIdentityLock(V, ['LAN']).includes('@SERUM'))
  ok('tags dạng CHUỖI → không nổ', buildVideoIdentityLock(V, '@LAN, @SERUM') === lock)
  ok('không ai khóa → rỗng', buildVideoIdentityLock([{ tag: 'A', role: 'char', identity_lock: null }]) === '')

  console.log('  — ensureVideoLock: gỡ câu thợ viết, ghép câu chuẩn')
  const CORE = 'sharp focus, five fingers, natural anatomy, no watermark'
  const out = ensureVideoLock(CORE, V)
  ok('câu khóa đứng ĐẦU', out.startsWith(lock))
  ok('giữ nguyên ràng buộc kỹ thuật', out.includes('sharp focus') && out.includes('five fingers'))

  // Đây là lõi của thay đổi: thợ viết kiểu gì thì chuỗi LƯU VÀO DB vẫn giống hệt nhau.
  const variants = [
    'preserve @LAN face and outfit exactly, sharp focus',
    'stable consistent face, sharp focus',
    '100% matches the reference, sharp focus',
    'same character as @LAN, sharp focus',
    'face identical to @LAN, sharp focus'
  ].map((c) => ensureVideoLock(c, V))
  ok('5 cách viết khác nhau → 5 kết quả GIỐNG HỆT nhau', new Set(variants).size === 1)
  ok('kết quả đó có đúng 1 câu khóa', (variants[0].match(/first frame/g) ?? []).length === 1)
  ok('vẫn giữ sharp focus sau khi gỡ', variants[0].includes('sharp focus'))

  // Gỡ HẸP: constraints còn chứa ràng buộc hợp lệ khác, không được xén nhầm.
  const layout = ensureVideoLock(
    'preserve @LAN face exactly, exactly one bottle of @SERUM with label facing camera, @LAN stays on the left, sharp focus',
    V
  )
  ok('GIỮ ràng buộc bố trí "exactly one bottle"', layout.includes('exactly one bottle of @SERUM'))
  ok('GIỮ "label facing camera"', layout.includes('label facing camera'))
  ok('GIỮ "@LAN stays on the left"', layout.includes('stays on the left'))
  ok('chỉ còn 1 câu khóa', (layout.match(/first frame/g) ?? []).length === 1)

  console.log('  — dọn dấu câu + ca biên')
  ok('constraints RỖNG → chỉ còn câu khóa', ensureVideoLock('', V) === lock)
  ok('constraints chỉ có câu khóa cũ → không để lại rác', ensureVideoLock('preserve @LAN face exactly', V) === lock)
  ok('không dấu phẩy mồ côi', !/,\s*,|^\s*,|,\s*$/.test(ensureVideoLock('preserve @LAN face exactly, , sharp focus', V)))
  ok('không khoảng trắng đôi', !/ {2}/.test(layout))
  ok(
    'không @tag nào khóa → GIỮ NGUYÊN constraints của thợ',
    ensureVideoLock(CORE, [{ tag: 'A', role: 'char', identity_lock: null }]) === CORE
  )
  ok('tags dạng CHUỖI → không nổ', ensureVideoLock(CORE, V, '@LAN').startsWith(buildVideoIdentityLock(V, ['LAN'])))
  ok('tags dạng SỐ → không nổ', ensureVideoLock(CORE, V, 42) === out)
  ok('chạy 2 lần KHÔNG nhân đôi câu khóa', ensureVideoLock(out, V) === out)

  console.log('  — GIỮ đuôi `avoid ...` (cú pháp CHÍNH THỨC của Seedance)')
  // Tài liệu prompt chính thức Seedance có cú pháp `avoid ...` ở cuối prompt và liệt kê sẵn
  // `avoid identity drift` / `avoid temporal flicker` / `avoid jitter`. Trong đó
  // `avoid identity drift` chính là công cụ CHỐNG TRÔI MẶT do hãng ghi ra — skill thợ video
  // giờ dặn phải viết nó. Nếu ai đó nới VIDEO_LOCK_PATTERNS (VD bỏ dấu phẩy khỏi `[^.,;]*`,
  // hoặc thêm mẫu bắt chữ "identity") thì mấy cụm này bị xén âm thầm: prompt vẫn ghi ra,
  // test cũ vẫn xanh, chỉ có mặt là trôi. Khóa ở đây để hỏng thì hỏng ồn ào.
  const AV = 'sharp focus, five fingers, avoid identity drift, avoid temporal flicker, avoid jitter'
  const avOut = ensureVideoLock(AV, V)
  ok('GIỮ `avoid identity drift` (khóa mặt chính hãng)', avOut.includes('avoid identity drift'))
  ok('GIỮ `avoid temporal flicker`', avOut.includes('avoid temporal flicker'))
  ok('GIỮ `avoid jitter`', avOut.includes('avoid jitter'))
  ok('vẫn ghép câu khóa của app lên đầu', avOut.startsWith(lock))
  ok('vẫn giữ ràng buộc kỹ thuật', avOut.includes('sharp focus') && avOut.includes('five fingers'))
  ok('chạy 2 lần vẫn bất biến (không nhân bản `avoid`)', ensureVideoLock(avOut, V) === avOut)
}

console.log(`\n${fail === 0 ? '✅' : '❌'} ${pass} pass · ${fail} fail\n`)
process.exit(fail === 0 ? 0 : 1)
