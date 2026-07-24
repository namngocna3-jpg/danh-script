-- ============================================================
-- Danh Script — Schema SQLite
-- Điểm mấu chốt chống lỗi "xuyên không":
--   · style_id nằm ở projects (L1 cứng, chất liệu render toàn dự án)
--   · scene_context_json nằm ở scenes (L2 mềm, bối cảnh RIÊNG từng cảnh)
--   · identity_lock_json chỉ khóa mặt/dáng; đồ/tóc ở variations (mềm)
-- ============================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS projects (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  pipeline    TEXT NOT NULL DEFAULT 'free',
  ideal_json  TEXT NOT NULL,
  params_json TEXT,
  style_id    TEXT,                      -- style đã chọn (khóa L1 cứng)
  stage       TEXT NOT NULL DEFAULT 'draft',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS scenes (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id         INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  order_idx          INTEGER NOT NULL,
  summary            TEXT NOT NULL DEFAULT '',
  narration_vi       TEXT NOT NULL DEFAULT '',
  scene_context_json TEXT                -- {era,setting,wardrobe,props,mood} RIÊNG từng cảnh (lớp B)
);

CREATE TABLE IF NOT EXISTS blocks (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  scene_id         INTEGER NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  order_idx        INTEGER NOT NULL,
  shot_desc        TEXT,                  -- ⭐ ý đồ shot (quy hoạch TRƯỚC ở GATE 1): góc/hành động/nội dung khung — để img/vid bám, chống block trống
  image_prompt_en  TEXT,
  video_prompt_json TEXT,
  shot_panel_json  TEXT,                  -- ⭐ khối phân cảnh CHI TIẾT (bước Phân cảnh): cỡ cảnh/góc/camera/Start→End/duration/@tag
  rendered_bool    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS assets (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id         INTEGER REFERENCES projects(id) ON DELETE CASCADE, -- null = global
  type               TEXT NOT NULL DEFAULT 'char',  -- char | prop | product | scene
  name               TEXT NOT NULL,
  identity_lock_json TEXT,               -- CHỈ mặt/dáng (lớp C, khóa cứng)
  variations_json    TEXT,               -- đồ/tóc/đạo cụ theo cảnh (mềm) + {tag}
  ref_image_path     TEXT,
  gen_prompt         TEXT,               -- ⭐ prompt SINH ảnh nguyên liệu (điểm dừng: copy → Coco → upload ảnh về)
  parent_id          INTEGER REFERENCES assets(id) ON DELETE CASCADE, -- asset phái sinh trỏ về gốc (null = gốc)
  derive_kind        TEXT,               -- biến thể: wardrobe | state | time | weather | angle (null = gốc)
  source             TEXT NOT NULL DEFAULT 'manual' -- 'auto' (assetDeriver tách từ kịch bản) | 'manual'
);

CREATE TABLE IF NOT EXISTS memories (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  iso_key        TEXT,
  kind           TEXT NOT NULL DEFAULT 'short', -- short | summary | rag
  content        TEXT NOT NULL,
  embedding_blob BLOB
);

CREATE TABLE IF NOT EXISTS reviews (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  block_id      INTEGER REFERENCES blocks(id) ON DELETE CASCADE,
  grade         TEXT,                    -- A | B | C | D
  redlines_json TEXT,
  notes         TEXT
);

-- Hội thoại tinh chỉnh từng GATE: mỗi (dự án, gate) giữ 1 cuộc chat có trạng thái.
-- messages_json = mảng raw content-block (Anthropic) của cả cuộc, để agent nhớ lịch sử.
CREATE TABLE IF NOT EXISTS gate_chats (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id    INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  gate_stage    TEXT NOT NULL,           -- gate0_ideal | gate1a_draft | gate1b_skeleton | gate1c_adaptation | gate1d_script | gate_assets | gate2_image | gate3_video
  messages_json TEXT NOT NULL DEFAULT '[]',
  UNIQUE(project_id, gate_stage)
);

-- ⭐ Khung xương cốt chuyện + chiến lược chuyển thể (GATE 1, dựng TRƯỚC narration).
-- Đây là 2 artifact tiền-kịch-bản giúp kịch bản "dày": biên kịch phải có khung + chiến lược
-- rồi mới viết lời thoại/quy hoạch shot — mỗi bước neo bước trước (mô hình Toonflow).
CREATE TABLE IF NOT EXISTS plan_artifacts (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  kind         TEXT NOT NULL,            -- draft | skeleton | adaptation | visual_system
  content_json TEXT NOT NULL DEFAULT '{}',
  UNIQUE(project_id, kind)
);

-- ⭐ Bảng nối block ↔ asset (như o_assets2Storyboard của Toonflow): 1 block (shot) dùng
-- những nguyên liệu/biến thể NÀO. Lưu asset_id THẬT (kể cả biến thể phái sinh), không chỉ
-- @tag trong text — để bước sinh video/export biết đích danh ảnh nguyên liệu của từng block.
CREATE TABLE IF NOT EXISTS block_assets (
  block_id INTEGER NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
  asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  PRIMARY KEY (block_id, asset_id)
);

CREATE INDEX IF NOT EXISTS idx_scenes_project ON scenes(project_id, order_idx);
CREATE INDEX IF NOT EXISTS idx_blocks_scene   ON blocks(scene_id, order_idx);
CREATE INDEX IF NOT EXISTS idx_assets_project ON assets(project_id);
CREATE INDEX IF NOT EXISTS idx_block_assets_block ON block_assets(block_id);
