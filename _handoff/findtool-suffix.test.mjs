// Test thuần cho luật khớp tên tool chịu hậu tố lạ (9router thêm "_ide").
// Chạy: node _handoff/findtool-suffix.test.mjs
// Sao chép NGUYÊN luật của findTool (tools/index.ts) để test không kéo theo db/electron.

function findTool(defs, name) {
  const exact = defs.find((d) => d.schema.name === name)
  if (exact) return exact
  let best
  for (const d of defs) {
    const n = d.schema.name
    if (name.startsWith(n) && (!best || n.length > best.schema.name.length)) best = d
  }
  return best
}

const tools = [
  { schema: { name: 'read_ideal' } },
  { schema: { name: 'read_scenes' } },
  { schema: { name: 'read_script_full' } },
  { schema: { name: 'write_ideal_brief' } }
]

let pass = 0
let fail = 0
function eq(label, got, want) {
  if (got === want) {
    pass++
  } else {
    fail++
    console.error(`✗ ${label}: nhận "${got}", mong "${want}"`)
  }
}

// Khớp chính xác (Anthropic thật)
eq('exact read_ideal', findTool(tools, 'read_ideal')?.schema.name, 'read_ideal')
// Hậu tố 9router "_ide"
eq('read_ideal_ide', findTool(tools, 'read_ideal_ide')?.schema.name, 'read_ideal')
eq('write_ideal_brief_ide', findTool(tools, 'write_ideal_brief_ide')?.schema.name, 'write_ideal_brief')
// Không nhầm read_scenes sang read_script_full (chọn tiền tố dài nhất, không mơ hồ)
eq('read_scenes_ide', findTool(tools, 'read_scenes_ide')?.schema.name, 'read_scenes')
eq('read_script_full_ide', findTool(tools, 'read_script_full_ide')?.schema.name, 'read_script_full')
// Tên hoàn toàn lạ → không khớp
eq('unknown', findTool(tools, 'totally_unknown')?.schema.name, undefined)

console.log(`\n${pass} pass, ${fail} fail`)
process.exit(fail ? 1 : 0)
