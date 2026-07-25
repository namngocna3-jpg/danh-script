// ============================================================
// Danh Script — Đăng ký IPC handlers (renderer ⇆ main)
// Mọi handler bọc kết quả trong IpcResult để không ném lỗi qua bridge.
// ============================================================
import { ipcMain } from 'electron'
import type { CreateProjectInput, IpcResult, ProjectParams, AssetRole, Ideal } from '../shared/types'
import {
  createProject,
  listProjects,
  getProject,
  deleteProject,
  updateProjectParams,
  updateProjectIdeal,
  forceProjectStage,
  clearStageOutputs,
  setProjectDirector,
  updateProjectStage,
  getPlanArtifacts,
  listAssetsFull,
  assetCoverage
} from './db'
import { chat, listModels } from './core/llmGateway'
import { llmQueue } from './core/queue'
import { getPublicSettings, saveSettings, effectiveConfig } from './core/settings'
import type { Provider } from './core/llmGateway'
import { listStyles, listGenres, listDirectors } from './core/skillLoader'
import { runGate0 } from './pipeline/gate0'
import { runGate, reviewGate, buildExport, runPrep, runDirectorBrief } from './pipeline/gates'
import { runGateChat, gateChatHistory, confirmGate } from './pipeline/gateChat'
import { runOrchestrator } from './pipeline/orchestrator'
import {
  listAssetTags,
  createTag,
  attachImage,
  clearImage,
  deleteTag,
  readThumb,
  saveTextFile
} from './assets'

function ok<T>(data: T): IpcResult<T> {
  return { ok: true, data }
}
function fail<T>(error: unknown): IpcResult<T> {
  return { ok: false, error: error instanceof Error ? error.message : String(error) }
}

export function registerIpc(): void {
  // ---- Projects ----
  ipcMain.handle('project:list', async () => {
    try {
      return ok(listProjects())
    } catch (e) {
      return fail(e)
    }
  })

  ipcMain.handle('project:create', async (_e, input: CreateProjectInput) => {
    try {
      return ok(createProject(input))
    } catch (e) {
      return fail(e)
    }
  })

  ipcMain.handle('project:get', async (_e, id: number) => {
    try {
      return ok(getProject(id))
    } catch (e) {
      return fail(e)
    }
  })

  ipcMain.handle('project:delete', async (_e, id: number) => {
    try {
      deleteProject(id)
      return ok(true)
    } catch (e) {
      return fail(e)
    }
  })

  // ---- LLM (qua hàng đợi 800ms) ----
  ipcMain.handle('llm:ping', async () => {
    try {
      const text = await llmQueue.enqueue(() =>
        chat([{ role: 'user', content: 'Trả lời đúng một từ: hello' }], {
          maxTokens: 16
        })
      )
      return ok(text.trim())
    } catch (e) {
      return fail(e)
    }
  })

  // ---- TIỀN-IDEAL: persona + research (Nhóm A) ----
  ipcMain.handle('prep:run', async (e, projectId: number) => {
    try {
      const result = await runPrep(projectId, (step) => {
        e.sender.send('prep:step', step)
      })
      return ok(result)
    } catch (err) {
      return fail(err)
    }
  })

  // ---- GATE 0: phân tích ideal (bottom-up) ----
  ipcMain.handle('gate0:run', async (e, projectId: number) => {
    try {
      const result = await runGate0(projectId, (step) => {
        // stream tiến độ về đúng cửa sổ gọi
        e.sender.send('gate0:step', step)
      })
      return ok(result)
    } catch (err) {
      return fail(err)
    }
  })

  // ---- GATE 1..3: chạy thợ (stream tiến độ) ----
  ipcMain.handle(
    'gate:run',
    async (e, gateKey: 'scriptwright' | 'imgPrompter' | 'vidPrompter', projectId: number) => {
      try {
        const result = await runGate(gateKey, projectId, (step) => {
          e.sender.send('gate:step', step)
        })
        return ok(result)
      } catch (err) {
        return fail(err)
      }
    }
  )

  // ---- Hội thoại tinh chỉnh 1 cổng (chat có trạng thái) ----
  // message = null → mở cổng lần đầu (agent tự chào + hỏi/dựng).
  ipcMain.handle(
    'gate:chat',
    async (e, projectId: number, gateStage: string, message: string | null) => {
      try {
        const result = await runGateChat(projectId, gateStage, message, (step) => {
          e.sender.send('gate:step', step)
        })
        return ok(result)
      } catch (err) {
        return fail(err)
      }
    }
  )

  // ---- Đọc lịch sử hội thoại 1 cổng (dựng lại bong bóng khi mở dự án) ----
  ipcMain.handle('gate:chatHistory', async (_e, projectId: number, gateStage: string) => {
    try {
      return ok(gateChatHistory(projectId, gateStage))
    } catch (err) {
      return fail(err)
    }
  })

  // ---- Chốt cổng: cập nhật stage (người dùng bấm "Chốt & sang cổng sau") ----
  ipcMain.handle(
    'gate:confirm',
    async (_e, projectId: number, gateStage: string, force?: boolean) => {
      try {
        confirmGate(projectId, gateStage, force ?? false)
        return ok(true)
      } catch (err) {
        return fail(err)
      }
    }
  )

  // ---- Đọc khung xương + chiến lược chuyển thể (GATE 1) để hiển thị ----
  ipcMain.handle('gate:plan', async (_e, projectId: number) => {
    try {
      return ok(getPlanArtifacts(projectId))
    } catch (err) {
      return fail(err)
    }
  })

  // ---- Kiểm duyệt 1 cổng (A/B/C/D) ----
  ipcMain.handle('gate:review', async (_e, projectId: number, gateStage: string) => {
    try {
      return ok(await reviewGate(projectId, gateStage))
    } catch (err) {
      return fail(err)
    }
  })

  // ---- Tầng ĐIỀU PHỐI "Sếp" (Pha 4): tự giao thợ + tự chấm, dừng chờ người dùng ----
  // message = null → mở chế độ tự động (Sếp chào + đề xuất).
  ipcMain.handle(
    'orchestrator:chat',
    async (e, projectId: number, message: string | null) => {
      try {
        const result = await runOrchestrator(projectId, message, (step) => {
          e.sender.send('gate:step', step)
        })
        return ok(result)
      } catch (err) {
        return fail(err)
      }
    }
  )

  ipcMain.handle('orchestrator:history', async (_e, projectId: number) => {
    try {
      return ok(gateChatHistory(projectId, 'orchestrator'))
    } catch (err) {
      return fail(err)
    }
  })

  // ---- GATE THAM SỐ: chốt style + tham số ----
  ipcMain.handle(
    'project:setParams',
    async (_e, projectId: number, params: ProjectParams) => {
      try {
        updateProjectParams(projectId, JSON.stringify(params), params.style_id)
        // GATE Style là bước gating → GHI stage để khóa step tiến đúng (monotonic).
        updateProjectStage(projectId, 'gate_params')
        return ok(true)
      } catch (err) {
        return fail(err)
      }
    }
  )

  // ---- Màn Nhân vật: @tag ↔ ảnh tư liệu ----
  ipcMain.handle('asset:list', async (_e, projectId: number) => {
    try {
      return ok(listAssetTags(projectId))
    } catch (err) {
      return fail(err)
    }
  })

  ipcMain.handle(
    'asset:create',
    async (_e, projectId: number, tag: string, type: AssetRole, name: string) => {
      try {
        return ok(createTag(projectId, tag, type, name))
      } catch (err) {
        return fail(err)
      }
    }
  )

  ipcMain.handle('asset:attach', async (_e, projectId: number, tag: string) => {
    try {
      return ok(await attachImage(projectId, tag))
    } catch (err) {
      return fail(err)
    }
  })

  ipcMain.handle('asset:clear', async (_e, projectId: number, tag: string) => {
    try {
      return ok(clearImage(projectId, tag))
    } catch (err) {
      return fail(err)
    }
  })

  ipcMain.handle('asset:delete', async (_e, projectId: number, tag: string) => {
    try {
      return ok(deleteTag(projectId, tag))
    } catch (err) {
      return fail(err)
    }
  })

  ipcMain.handle('asset:thumb', async (_e, path: string | null) => {
    try {
      return ok(readThumb(path))
    } catch (err) {
      return fail(err)
    }
  })

  // ---- Nguyên liệu ĐẦY ĐỦ (gốc + phái sinh + prompt) cho màn AssetStudio ----
  ipcMain.handle('assets2:full', async (_e, projectId: number) => {
    try {
      return ok(listAssetsFull(projectId))
    } catch (err) {
      return fail(err)
    }
  })

  ipcMain.handle('assets2:coverage', async (_e, projectId: number) => {
    try {
      return ok(assetCoverage(projectId))
    } catch (err) {
      return fail(err)
    }
  })

  ipcMain.handle('assets2:visualSystem', async (_e, projectId: number) => {
    try {
      return ok(getPlanArtifacts(projectId).visualSystem)
    } catch (err) {
      return fail(err)
    }
  })

  // ---- Danh sách style cho wizard ----
  ipcMain.handle('styles:list', async () => {
    try {
      return ok(listStyles())
    } catch (err) {
      return fail(err)
    }
  })

  // ---- Liệt kê model của cổng gom (9router/beeknoee) để chọn ----
  // Cho phép override baseUrl đang gõ (chưa lưu); key vẫn lấy từ settings đã lưu.
  ipcMain.handle(
    'llm:listModels',
    async (_e, override?: { baseUrl?: string }) => {
      try {
        const c = effectiveConfig()
        const cfg = {
          provider: c.provider,
          modelName: c.modelName,
          baseUrl: override?.baseUrl?.trim() || c.baseUrl,
          apiKey: c.apiKey
        }
        return ok(await listModels(cfg))
      } catch (err) {
        return fail(err)
      }
    }
  )

  // ---- Danh mục thể loại à-la-carte cho GATE tham số (tùy chọn) ----
  ipcMain.handle('genres:list', async () => {
    try {
      return ok(listGenres())
    } catch (err) {
      return fail(err)
    }
  })

  // ---- Danh mục gu đạo diễn (chọn ở đầu dự án) ----
  ipcMain.handle('directors:list', async () => {
    try {
      return ok(listDirectors())
    } catch (err) {
      return fail(err)
    }
  })

  // ---- Chọn gu đạo diễn cho dự án (không gating: chỉ ghi director_id) ----
  ipcMain.handle('project:setDirector', async (_e, projectId: number, directorId: string) => {
    try {
      setProjectDirector(projectId, directorId)
      return ok(true)
    } catch (err) {
      return fail(err)
    }
  })

  // ---- Sửa ý tưởng (ideal) trong app ----
  ipcMain.handle('project:updateIdeal', async (_e, projectId: number, ideal: Ideal) => {
    try {
      const p = getProject(projectId)
      if (!p) throw new Error('Không tìm thấy dự án')
      const old = JSON.parse(p.ideal_json) as Ideal
      // Giữ brief đã làm giàu (prep/GATE 0) nếu payload không mang theo.
      const merged: Ideal = { ...ideal, brief: ideal.brief ?? old.brief }
      updateProjectIdeal(projectId, JSON.stringify(merged))
      return ok(getProject(projectId))
    } catch (err) {
      return fail(err)
    }
  })

  // ---- Làm lại 1 bước: dọn output cũ (chống stale) + hạ stage mở khóa lại ----
  ipcMain.handle(
    'project:clearStage',
    async (_e, projectId: number, step: string, backStage: string) => {
      try {
        clearStageOutputs(projectId, step)
        forceProjectStage(projectId, backStage)
        return ok(getProject(projectId))
      } catch (err) {
        return fail(err)
      }
    }
  )

  // ---- Chốt gu → thợ directorBrief sinh Director Bible (stream tiến độ như prep) ----
  ipcMain.handle('director:brief', async (e, projectId: number) => {
    try {
      const result = await runDirectorBrief(projectId, (step) => {
        e.sender.send('director:step', step)
      })
      return ok(result)
    } catch (err) {
      return fail(err)
    }
  })

  // ---- GATE 4: gom bundle xuất ----
  ipcMain.handle('export:build', async (_e, projectId: number) => {
    try {
      return ok(buildExport(projectId))
    } catch (err) {
      return fail(err)
    }
  })

  // ---- GATE 4: xuất ra file .md ----
  ipcMain.handle('export:saveFile', async (_e, defaultName: string, content: string) => {
    try {
      return ok(await saveTextFile(defaultName, content))
    } catch (err) {
      return fail(err)
    }
  })

  // ---- Cài đặt LLM (đọc, KHÔNG trả key thô) ----
  ipcMain.handle('settings:get', async () => {
    try {
      return ok(getPublicSettings())
    } catch (e) {
      return fail(e)
    }
  })

  // ---- Lưu cài đặt (key mã hóa theo máy) ----
  ipcMain.handle(
    'settings:save',
    async (
      _e,
      input: { provider: Provider; modelName?: string; baseUrl?: string; apiKey?: string }
    ) => {
      try {
        return ok(saveSettings(input))
      } catch (e) {
        return fail(e)
      }
    }
  )

  // Giữ 'llm:config' làm alias tương thích cũ (trả cài đặt công khai).
  ipcMain.handle('llm:config', async () => {
    try {
      return ok(getPublicSettings())
    } catch (e) {
      return fail(e)
    }
  })
}
