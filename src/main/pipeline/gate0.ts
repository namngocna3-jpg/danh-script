// ============================================================
// Danh Script — GATE 0: chạy ideaAnalyst (LÀM RÕ Ý ĐỒ, chưa phân cảnh)
// Theo mô hình Toonflow: chốt Ý ĐỒ trước → phân cảnh dời về bước Kịch bản final.
// Sản phẩm = "Ý đồ chốt" (thông điệp lõi · đối tượng · tông · thể loại · độ dài)
// ghi vào ideal.brief qua write_ideal_brief. KHÔNG tạo scene/@tag ở bước này.
// ============================================================
import { runAgent, type AgentStep } from '../core/agentRunner'
import { loadExecutionSkill, readSkill, composeSystem, injectOutputIntent } from '../core/skillLoader'
import { toolsFor } from '../tools'
import { getProject, updateProjectStage } from '../db'
import type { Ideal, IdealBrief } from '../../shared/types'

export interface Gate0Result {
  summary: string // tóm tắt tiếng Việt của thợ (Markdown)
  brief: IdealBrief | null // "Ý đồ chốt"
  steps: number
}

/**
 * Chạy ideaAnalyst cho 1 dự án: đọc ideal → LÀM RÕ Ý ĐỒ (không phân cảnh).
 * Ghi kết quả vào ideal.brief. onStep để stream tiến độ ra UI.
 */
export async function runGate0(
  projectId: number,
  onStep?: (s: AgentStep) => void
): Promise<Gate0Result> {
  const project = getProject(projectId)
  if (!project) throw new Error('Không tìm thấy dự án')

  // Linh hồn: skill thợ ideaAnalyst (đã tự chứa khung 7 phần — làm rõ ý đồ).
  const system = injectOutputIntent(
    composeSystem(loadExecutionSkill(project.pipeline, 'ideaAnalyst')),
    projectId
  )

  const ideal = JSON.parse(project.ideal_json) as Ideal
  const userPrompt =
    `Làm RÕ & CHỐT Ý ĐỒ cho ideal sau (CHƯA phân cảnh, CHƯA tạo @tag). ` +
    `Bắt đầu bằng read_ideal, rồi ghi "Ý đồ chốt" qua write_ideal_brief ` +
    `(thông điệp lõi · đối tượng · góc cảm xúc · tông/mood · thể loại · độ dài dự kiến).` +
    `\n\nIDEAL:\n${ideal.raw}`

  const result = await runAgent({
    system,
    userPrompt,
    tools: toolsFor(['read_ideal', 'write_ideal_brief']),
    ctx: { projectId },
    maxSteps: 12,
    temperature: 0.6,
    onStep
  })

  updateProjectStage(projectId, 'gate0_ideal')

  // Đọc lại brief vừa ghi để trả về UI.
  const fresh = getProject(projectId)
  const brief =
    fresh && fresh.ideal_json
      ? ((JSON.parse(fresh.ideal_json) as Ideal).brief ?? null)
      : null

  return {
    summary: result.finalText,
    brief,
    steps: result.steps
  }
}
