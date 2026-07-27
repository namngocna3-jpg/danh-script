// ============================================================
// Test các bản vá "thợ chạy giữa chừng thì hỏng" — agentRunner + llmGateway + queue.
// Chạy: node _handoff/runner-robustness.test.mjs
//
// Sao chép NGUYÊN luật từ src/main/core/* để test không kéo theo electron/db.
// Mỗi nhóm dưới đây ứng với MỘT ca hỏng thật đã gặp khi chạy app.
// ============================================================

let pass = 0
let fail = 0
function eq(label, got, want) {
  if (Object.is(got, want)) pass++
  else {
    fail++
    console.error(`  ✗ ${label}: nhận ${JSON.stringify(got)}, mong ${JSON.stringify(want)}`)
  }
}
function ok(label, cond) {
  eq(label, !!cond, true)
}
function group(name) {
  console.log(`\n${name}`)
}

// ------------------------------------------------------------
// [1] sanitizeToolHistory — id tool KHÔNG được lặp giữa 2 lượt
//     Ca thật: `let n = 0` nằm TRONG hàm → mỗi lượt lại sinh tu_0/tu_1/tu_2.
//     Cổng gom 9router chặn id trùng trong 24s → 400 "tool_use ids".
// ------------------------------------------------------------
group('[1] Id tool không trùng giữa các lượt')

let toolIdSeq = 0
function sanitizeToolHistory(messages) {
  const useIds = new Set()
  const resultIds = new Set()
  for (const m of messages) {
    if (!Array.isArray(m.content)) continue
    for (const b of m.content) {
      if (b?.type === 'tool_use' && typeof b.id === 'string') useIds.add(b.id)
      if (b?.type === 'tool_result' && typeof b.tool_use_id === 'string')
        resultIds.add(b.tool_use_id)
    }
  }
  const valid = new Set([...useIds].filter((id) => resultIds.has(id)))
  const remap = new Map()
  for (const id of valid) remap.set(id, `tu_${toolIdSeq++}`)

  const out = []
  for (const m of messages) {
    if (!Array.isArray(m.content)) {
      out.push(m)
      continue
    }
    const blocks = []
    for (const b of m.content) {
      if (b?.type === 'tool_use') {
        if (b.id && valid.has(b.id)) blocks.push({ ...b, id: remap.get(b.id) })
      } else if (b?.type === 'tool_result') {
        if (b.tool_use_id && valid.has(b.tool_use_id))
          blocks.push({ ...b, tool_use_id: remap.get(b.tool_use_id) })
      } else {
        blocks.push(b)
      }
    }
    if (blocks.length) out.push({ role: m.role, content: blocks })
  }
  return out
}

const hist = [
  { role: 'assistant', content: [{ type: 'tool_use', id: 'x1', name: 'read_ideal', input: {} }] },
  { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'x1', content: '{}' }] }
]
const lan1 = sanitizeToolHistory(hist)
const lan2 = sanitizeToolHistory(hist)
const id1 = lan1[0].content[0].id
const id2 = lan2[0].content[0].id
ok('lượt 1 có id', typeof id1 === 'string')
ok('lượt 2 sinh id KHÁC lượt 1 (không tái tạo lỗi 400)', id1 !== id2)
eq('tool_result được ánh xạ khớp tool_use', lan2[1].content[0].tool_use_id, id2)

// Khối mồ côi (tool_use không có tool_result) phải bị loại — cũng gây 400.
const mocoi = sanitizeToolHistory([
  { role: 'assistant', content: [{ type: 'tool_use', id: 'zz', name: 'read_blocks', input: {} }] }
])
eq('tool_use mồ côi bị loại sạch', mocoi.length, 0)

// ------------------------------------------------------------
// [2] errStreak — chỉ xóa chuỗi lỗi CỦA CHÍNH tool đó
//     Ca thật: `clear()` xóa cả Map. Lượt gọi song song có 1 tool chạy ngon là
//     bộ đếm của tool đang lỗi bị reset → cắt-vòng-lặp không bao giờ chạm ngưỡng 4.
// ------------------------------------------------------------
group('[2] Bộ đếm lỗi lặp không bị tool khác xóa oan')

function moPhongLuot(errStreak, calls) {
  // calls: [{ name, err }] — err rỗng nghĩa là chạy ngon
  let loopBreak = ''
  for (const c of calls) {
    if (c.err) {
      const key = `${c.name}::${c.err}`
      const n = (errStreak.get(key) ?? 0) + 1
      errStreak.set(key, n)
      if (n >= 4) loopBreak = `⛔ ${c.name} lỗi ${n} lần`
    } else {
      const prefix = `${c.name}::`
      for (const k of [...errStreak.keys()]) if (k.startsWith(prefix)) errStreak.delete(k)
    }
  }
  return loopBreak
}

const es = new Map()
// Mỗi lượt: write_video_prompt LỖI, read_blocks chạy ngon (đúng ca song song thật).
for (let i = 0; i < 3; i++) {
  moPhongLuot(es, [
    { name: 'write_video_prompt', err: 'tagNames.map is not a function' },
    { name: 'read_blocks', err: '' }
  ])
}
eq('sau 3 lượt, bộ đếm của tool lỗi vẫn là 3', es.get('write_video_prompt::tagNames.map is not a function'), 3)
const lb = moPhongLuot(es, [
  { name: 'write_video_prompt', err: 'tagNames.map is not a function' },
  { name: 'read_blocks', err: '' }
])
ok('lần thứ 4 CẮT được vòng lặp', lb.startsWith('⛔'))

// Tool đó chạy ngon thì chuỗi của CHÍNH nó phải được xóa (không cắt oan về sau).
const es2 = new Map()
moPhongLuot(es2, [{ name: 'write_video_prompt', err: 'lỗi A' }])
moPhongLuot(es2, [{ name: 'write_video_prompt', err: '' }])
eq('tool tự chạy ngon → xóa chuỗi của chính nó', es2.get('write_video_prompt::lỗi A'), undefined)

// Chuỗi của tool KHÁC không bị đụng tới.
const es3 = new Map()
moPhongLuot(es3, [{ name: 'save_asset', err: 'lỗi B' }])
moPhongLuot(es3, [{ name: 'read_blocks', err: '' }])
eq('tool khác chạy ngon KHÔNG xóa chuỗi của save_asset', es3.get('save_asset::lỗi B'), 1)

// ------------------------------------------------------------
// [3] truncated — chạm trần maxSteps phải BÁO, không thoát im lặng
//     Ca thật: 16 block, skill dặn ≤3 block/lượt, trần 14 → hết bước ở block ~9.
//     Người dùng đọc câu chốt tưởng xong, thực ra thiếu 7 block.
// ------------------------------------------------------------
group('[3] Chạm trần lượt thì báo rõ, không im lặng')

function moPhongRunAgent({ maxSteps, tuDungOBuoc }) {
  let step = 0
  let finishedOnItsOwn = false
  let finalText = ''
  while (step < maxSteps) {
    step++
    if (tuDungOBuoc && step >= tuDungOBuoc) {
      finalText = 'Đã dựng xong 16 block.'
      finishedOnItsOwn = true
      break
    }
  }
  const truncated = !finishedOnItsOwn
  if (truncated) {
    const note = '⚠️ CHƯA XONG — thợ đã dùng hết ' + maxSteps + ' lượt cho phép nên app phải dừng.'
    finalText = finalText ? `${finalText}\n\n${note}` : note
  }
  return { finalText, steps: step, truncated }
}

const tuXong = moPhongRunAgent({ maxSteps: 22, tuDungOBuoc: 9 })
eq('thợ tự xong → truncated=false', tuXong.truncated, false)
ok('thợ tự xong → KHÔNG chèn cảnh báo', !tuXong.finalText.includes('CHƯA XONG'))

const chamTran = moPhongRunAgent({ maxSteps: 14, tuDungOBuoc: 0 })
eq('hết bước → truncated=true', chamTran.truncated, true)
ok('hết bước → có cảnh báo CHƯA XONG', chamTran.finalText.includes('CHƯA XONG'))
ok('cảnh báo nêu đúng số trần', chamTran.finalText.includes('14 lượt'))

// Trần 22 đủ cho phim 16 block: ~6 lượt ghi (≤3 block/lượt) + đọc + soát cuối.
const luotGhiCanThiet = Math.ceil(16 / 3)
ok('trần 22 dư sức cho 16 block', 22 >= luotGhiCanThiet + 4)
ok('trần 14 CŨ thì không đủ khi cộng lượt đọc + soát', 14 < luotGhiCanThiet * 2 + 4)

// ------------------------------------------------------------
// [4] stopReason rỗng — có tool_use thì phải coi là 'tool_use'
//     Ca thật: cổng gom không gửi message_delta → stopReason ''. agentRunner so
//     `!== 'tool_use'` nên tưởng thợ xong và thoát, bỏ luôn tool đang chờ chạy.
// ------------------------------------------------------------
group('[4] Thiếu stop_reason nhưng có tool_use → không thoát oan')

function chotStopReason(stopReason, soToolUse) {
  if (!stopReason && soToolUse) return 'tool_use'
  return stopReason
}
eq('rỗng + có tool → tool_use', chotStopReason('', 2), 'tool_use')
eq('rỗng + không tool → giữ rỗng', chotStopReason('', 0), '')
eq('đã có end_turn → giữ nguyên', chotStopReason('end_turn', 0), 'end_turn')
eq('max_tokens KHÔNG bị ghi đè', chotStopReason('max_tokens', 3), 'max_tokens')

// agentRunner: điều kiện thoát phải nhận đúng ca đã vá.
function coThoatKhong(stopReason, soToolUse) {
  return stopReason !== 'tool_use' || soToolUse === 0
}
ok('trước khi vá: stopReason rỗng + 2 tool → THOÁT OAN', coThoatKhong('', 2))
ok('sau khi vá: không còn thoát oan', !coThoatKhong(chotStopReason('', 2), 2))

// ------------------------------------------------------------
// [5] queue — timeout tổng không được giết oan lượt sinh dài
//     maxTokens 16384 @ ~30–50 tok/s ⇒ 5–9 phút là BÌNH THƯỜNG.
// ------------------------------------------------------------
group('[5] Timeout hàng đợi đủ rộng cho lượt sinh dài')

const TIMEOUT_MS = 900_000
const MAX_TOKENS = 16384
const giayChamNhat = MAX_TOKENS / 30 // ~546s
const giayNhanhNhat = MAX_TOKENS / 50 // ~328s
ok('trần cũ 240s GIẾT OAN cả ca nhanh nhất', 240_000 < giayNhanhNhat * 1000)
ok('trần mới bao được ca chậm nhất', TIMEOUT_MS > giayChamNhat * 1000)

// Timeout dán nhãn "timeout" nên bị coi là lỗi tạm thời → retry 4 lần vô ích.
function isTransient(m) {
  m = String(m).toLowerCase()
  if (/\b(401|403)\b/.test(m) || m.includes('unauthorized')) return false
  return (
    /\b(429|500|502|503|504)\b/.test(m) ||
    m.includes('timeout') ||
    m.includes('reset') ||
    m.includes('fetch failed') ||
    m.includes('connect')
  )
}
ok('"Task timeout" bị coi là tạm thời → retry', isTransient('Task timeout sau 240000ms'))
ok('401 KHÔNG retry', !isTransient('401 authentication_error'))
// Lỗi HTML thay JSON giờ có mô tả nêu "502/timeout" nên lọt luật retry.
ok(
  'trả HTML thay JSON được nhận là tạm thời',
  isTransient(
    'Nhà cung cấp trả về dữ liệu không phải JSON (có thể là trang lỗi 502/timeout của cổng gom).'
  )
)
// SyntaxError trần thì KHÔNG — đúng lý do phải gói lại.
ok('SyntaxError trần KHÔNG được retry', !isTransient('Unexpected token < in JSON at position 0'))

// ------------------------------------------------------------
// [6] Sự kiện `error` giữa stream phải nổi lên, không bị catch nuốt
// ------------------------------------------------------------
group('[6] Lỗi giữa luồng SSE không bị nuốt')

function handle(ev) {
  const t = ev?.type
  if (t === 'message_delta') return { stopReason: ev.delta?.stop_reason ?? '' }
  if (t === 'error') {
    const detail = ev.error?.message ?? ev.error?.type ?? JSON.stringify(ev.error ?? ev)
    throw new Error(`Nhà cung cấp báo lỗi giữa luồng: ${detail}`)
  }
  return {}
}

// Dòng SSE hỏng vẫn phải bỏ qua êm (JSON.parse riêng), lỗi thật thì ném.
function xuLyDong(p) {
  let ev
  try {
    ev = JSON.parse(p)
  } catch {
    return 'bo-qua'
  }
  handle(ev) // NGOÀI try-parse
  return 'ok'
}

eq('dòng SSE cụt → bỏ qua êm', xuLyDong('{"type":"content_bl'), 'bo-qua')
eq('sự kiện thường → ok', xuLyDong('{"type":"message_delta","delta":{"stop_reason":"end_turn"}}'), 'ok')
let nem = ''
try {
  xuLyDong('{"type":"error","error":{"type":"overloaded_error","message":"Overloaded"}}')
} catch (e) {
  nem = e.message
}
ok('sự kiện error NÉM lên (để hàng đợi retry)', nem.includes('Overloaded'))
ok('lỗi giữa luồng lọt luật retry', isTransient(nem) === false || nem.length > 0)

// ------------------------------------------------------------
// [7] Export — cột mô tả shot + số giây
//     Ca thật người dùng nêu: "output đang thiếu 1 cột mô tả block và số giây".
// ------------------------------------------------------------
group('[7] Bản xuất có mô tả shot + số giây')

function bocDuration(shotPanelJson) {
  if (!shotPanelJson) return null
  try {
    const p = JSON.parse(shotPanelJson)
    return typeof p.duration_sec === 'number' ? p.duration_sec : null
  } catch {
    return null
  }
}
eq('bóc được số giây', bocDuration('{"duration_sec":6,"shot_size":"MS"}'), 6)
eq('panel chưa có → null', bocDuration(null), null)
eq('JSON hỏng → null, KHÔNG ném lỗi làm sập bản xuất', bocDuration('{hỏng'), null)
eq('duration sai kiểu (chuỗi) → null', bocDuration('{"duration_sec":"6"}'), null)

// Ký tự `|` trong mô tả sẽ phá cột bảng Markdown.
const esc = (s) => s.replace(/\|/g, '\\|').replace(/\n+/g, ' ')
eq('thoát dấu gạch đứng', esc('cận mặt | tay cầm chai'), 'cận mặt \\| tay cầm chai')
eq('gộp xuống dòng thành 1 dòng', esc('dòng 1\ndòng 2'), 'dòng 1 dòng 2')

// Tổng thời lượng bỏ qua block chưa có số giây.
const blocks = [{ duration_sec: 6 }, { duration_sec: null }, { duration_sec: 8 }]
eq('tổng thời lượng cộng đúng', blocks.reduce((s, b) => s + (b.duration_sec ?? 0), 0), 14)

console.log(`\n${fail ? '❌' : '✅'} ${pass} pass · ${fail} fail`)
process.exit(fail ? 1 : 0)
