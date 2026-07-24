// ============================================================
// Danh Script — Guard validate output LLM (chống rác vào DB)
// Chạy TRONG handler write-tool, TRƯỚC khi ghi DB. Sai → throw lỗi tiếng Việt
// rõ (field nào, kỳ vọng gì). agentRunner bắt lỗi → đẩy is_error cho LLM tự sửa
// lượt sau. KHÔNG kiểm ngữ nghĩa — chỉ field bắt buộc + kiểu cơ bản.
// ============================================================

function isNonEmptyString(v: unknown): boolean {
  return typeof v === 'string' && v.trim().length > 0
}

function isFiniteNumber(v: unknown): boolean {
  return typeof v === 'number' && Number.isFinite(v)
}

/** write_skeleton: logline không rỗng; beats mảng không rỗng; mỗi beat có order(số)/role/summary. */
export function assertSkeleton(input: Record<string, unknown>): void {
  if (!isNonEmptyString(input.logline)) {
    throw new Error('write_skeleton: thiếu "logline" (1 câu tóm cả chuyện). Hãy viết logline rồi gọi lại.')
  }
  const beats = input.beats
  if (!Array.isArray(beats) || beats.length === 0) {
    throw new Error('write_skeleton: "beats" phải là mảng nhịp KHÔNG rỗng (hook→thân→cao trào→kết).')
  }
  beats.forEach((b, i) => {
    const beat = b as Record<string, unknown>
    if (!isFiniteNumber(beat.order)) {
      throw new Error(`write_skeleton: beat #${i + 1} thiếu "order" là SỐ thứ tự nhịp (1,2,3...).`)
    }
    if (!isNonEmptyString(beat.role)) {
      throw new Error(`write_skeleton: beat #${i + 1} thiếu "role" (hook/thiết lập/xung đột/cao trào...).`)
    }
    if (!isNonEmptyString(beat.summary)) {
      throw new Error(`write_skeleton: beat #${i + 1} thiếu "summary" (nội dung nhịp, tiếng Việt).`)
    }
  })
}

/** write_director_plan: scenes mảng không rỗng; mỗi scene có order/line_count/char_count(số) + emotion + emotion_intensity(số). */
export function assertDirectorPlan(input: Record<string, unknown>): void {
  const scenes = input.scenes
  if (!Array.isArray(scenes) || scenes.length === 0) {
    throw new Error('write_director_plan: "scenes" phải là mảng phân tích cảnh KHÔNG rỗng.')
  }
  scenes.forEach((s, i) => {
    const sc = s as Record<string, unknown>
    if (!isFiniteNumber(sc.order)) {
      throw new Error(`write_director_plan: cảnh #${i + 1} thiếu "order" là SỐ (= order_idx của cảnh).`)
    }
    if (!isFiniteNumber(sc.line_count)) {
      throw new Error(`write_director_plan: cảnh order=${String(sc.order)} thiếu "line_count" là SỐ câu thoại.`)
    }
    if (!isFiniteNumber(sc.char_count)) {
      throw new Error(`write_director_plan: cảnh order=${String(sc.order)} thiếu "char_count" là SỐ chữ thoại.`)
    }
    if (!isNonEmptyString(sc.emotion)) {
      throw new Error(`write_director_plan: cảnh order=${String(sc.order)} thiếu "emotion" (cảm xúc chủ đạo).`)
    }
    if (!isFiniteNumber(sc.emotion_intensity)) {
      throw new Error(`write_director_plan: cảnh order=${String(sc.order)} thiếu "emotion_intensity" là SỐ 0–10.`)
    }
  })
}

/** write_video_prompt: đủ trường bắt buộc theo VideoPrompt (scene_order/block_order số; style/scene/motion không rỗng). */
export function assertVideoPrompt(input: Record<string, unknown>): void {
  if (!isFiniteNumber(input.scene_order)) {
    throw new Error('write_video_prompt: thiếu "scene_order" là SỐ thứ tự cảnh.')
  }
  if (!isFiniteNumber(input.block_order)) {
    throw new Error('write_video_prompt: thiếu "block_order" là SỐ thứ tự block (bắt đầu 1).')
  }
  if (!isNonEmptyString(input.style)) {
    throw new Error('write_video_prompt: thiếu "style" (chất liệu render, KHÔNG chứa thời đại).')
  }
  if (!isNonEmptyString(input.scene)) {
    throw new Error('write_video_prompt: thiếu "scene" (bối cảnh cảnh này, nhúng @tag nhân vật/đạo cụ).')
  }
  if (!isNonEmptyString(input.motion)) {
    throw new Error('write_video_prompt: thiếu "motion" (chuyển động camera/nhân vật).')
  }
}

/** plan_shots: scene_order số; shots mảng không rỗng; mỗi shot có block_order≥1 + shot_desc. */
export function assertPlanShots(input: Record<string, unknown>): void {
  if (!isFiniteNumber(input.scene_order)) {
    throw new Error('plan_shots: thiếu "scene_order" là SỐ thứ tự cảnh.')
  }
  const shots = input.shots
  if (!Array.isArray(shots) || shots.length === 0) {
    throw new Error('plan_shots: "shots" phải là mảng shot KHÔNG rỗng (mỗi cảnh tối thiểu 1 block).')
  }
  shots.forEach((sh, i) => {
    const shot = sh as Record<string, unknown>
    if (!isFiniteNumber(shot.block_order) || (shot.block_order as number) < 1) {
      throw new Error(`plan_shots: shot #${i + 1} "block_order" phải là SỐ ≥ 1.`)
    }
    if (!isNonEmptyString(shot.shot_desc)) {
      throw new Error(`plan_shots: shot #${i + 1} thiếu "shot_desc" (ý đồ shot: cỡ cảnh/góc/hành động).`)
    }
  })
}

/** write_image_prompt: scene_order/block_order số; image_prompt_en không rỗng. */
export function assertImagePrompt(input: Record<string, unknown>): void {
  if (!isFiniteNumber(input.scene_order)) {
    throw new Error('write_image_prompt: thiếu "scene_order" là SỐ thứ tự cảnh.')
  }
  if (!isFiniteNumber(input.block_order)) {
    throw new Error('write_image_prompt: thiếu "block_order" là SỐ thứ tự block (bắt đầu 1).')
  }
  if (!isNonEmptyString(input.image_prompt_en)) {
    throw new Error('write_image_prompt: thiếu "image_prompt_en" (prompt ảnh tiếng Anh, KHÔNG rỗng).')
  }
}

/** write_shot_panel: scene_order số; blocks mảng không rỗng; mỗi block có block_order≥1 + shot_size/camera_angle/camera_move/subject/action_start/action_end + duration_sec là SỐ ≤8. */
export function assertShotPanel(input: Record<string, unknown>): void {
  if (!isFiniteNumber(input.scene_order)) {
    throw new Error('write_shot_panel: thiếu "scene_order" là SỐ thứ tự cảnh.')
  }
  const blocks = input.blocks
  if (!Array.isArray(blocks) || blocks.length === 0) {
    throw new Error('write_shot_panel: "blocks" phải là mảng shot KHÔNG rỗng (mỗi cảnh ≥1 shot).')
  }
  blocks.forEach((b, i) => {
    const bl = b as Record<string, unknown>
    const at = `shot #${i + 1}`
    if (!isFiniteNumber(bl.block_order) || (bl.block_order as number) < 1) {
      throw new Error(`write_shot_panel: ${at} "block_order" phải là SỐ ≥ 1.`)
    }
    if (!isNonEmptyString(bl.shot_size)) {
      throw new Error(`write_shot_panel: ${at} thiếu "shot_size" (close-up/medium/wide...).`)
    }
    if (!isNonEmptyString(bl.camera_angle)) {
      throw new Error(`write_shot_panel: ${at} thiếu "camera_angle" (eye-level/low/high/over-shoulder...).`)
    }
    if (!isNonEmptyString(bl.camera_move)) {
      throw new Error(`write_shot_panel: ${at} thiếu "camera_move" (static/pan/dolly/orbit...).`)
    }
    if (!isNonEmptyString(bl.subject)) {
      throw new Error(`write_shot_panel: ${at} thiếu "subject" (chủ thể + @tag dùng trong shot).`)
    }
    if (!isNonEmptyString(bl.action_start)) {
      throw new Error(`write_shot_panel: ${at} thiếu "action_start" (tư thế/trạng thái ĐẦU).`)
    }
    if (!isNonEmptyString(bl.action_end)) {
      throw new Error(`write_shot_panel: ${at} thiếu "action_end" (tư thế/trạng thái CUỐI + 1 chi tiết vật lý).`)
    }
    if (!isFiniteNumber(bl.duration_sec) || (bl.duration_sec as number) <= 0 || (bl.duration_sec as number) > 8) {
      throw new Error(`write_shot_panel: ${at} "duration_sec" phải là SỐ trong (0, 8] (Seedance hỏng ở 5–8s → mỗi shot ≤8s).`)
    }
  })
}
