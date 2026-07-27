// ============================================================
// Danh Script — Preload: cầu API an toàn (contextBridge)
// ============================================================
import { contextBridge, ipcRenderer } from 'electron'
import type {
  CreateProjectInput,
  IpcResult,
  Ideal,
  Project,
  ProjectParams,
  PrepResult,
  DirectorBriefResult,
  Gate0Result,
  GateResult,
  ReviewResult,
  ExportBundle,
  StyleOption,
  GenreOption,
  DirectorOption,
  GateKey,
  AgentStep,
  AssetTag,
  AssetRole,
  LlmSettingsPublic,
  LlmProvider,
  ChatTurn,
  GateChatReply,
  PlanArtifacts,
  AssetFull,
  AssetCoverage,
  IdentityLock,
  VisualSystem,
  BlockView
} from '../shared/types'

// Re-export để renderer import gọn qua 1 chỗ (nếu cần).
export type {
  PrepResult,
  Gate0Result,
  GateResult,
  ReviewResult,
  ExportBlock,
  ExportBundle,
  StyleOption,
  GateKey,
  AgentStep
} from '../shared/types'

export interface DanhScriptApi {
  project: {
    list: () => Promise<IpcResult<Project[]>>
    create: (input: CreateProjectInput) => Promise<IpcResult<Project>>
    get: (id: number) => Promise<IpcResult<Project | undefined>>
    delete: (id: number) => Promise<IpcResult<boolean>>
  }
  llm: {
    ping: () => Promise<IpcResult<string>>
    config: () => Promise<IpcResult<LlmSettingsPublic>>
    listModels: (override?: { baseUrl?: string }) => Promise<IpcResult<string[]>>
  }
  settings: {
    get: () => Promise<IpcResult<LlmSettingsPublic>>
    save: (input: {
      provider: LlmProvider
      modelName?: string
      baseUrl?: string
      apiKey?: string
    }) => Promise<IpcResult<LlmSettingsPublic>>
  }
  prep: {
    run: (projectId: number) => Promise<IpcResult<PrepResult>>
    onStep: (cb: (step: AgentStep) => void) => () => void
  }
  gate0: {
    run: (projectId: number) => Promise<IpcResult<Gate0Result>>
    onStep: (cb: (step: AgentStep) => void) => () => void
  }
  gate: {
    run: (gateKey: GateKey, projectId: number) => Promise<IpcResult<GateResult>>
    review: (projectId: number, gateStage: string) => Promise<IpcResult<ReviewResult>>
    chat: (
      projectId: number,
      gateStage: string,
      message: string | null
    ) => Promise<IpcResult<GateChatReply>>
    chatHistory: (projectId: number, gateStage: string) => Promise<IpcResult<ChatTurn[]>>
    confirm: (
      projectId: number,
      gateStage: string,
      force?: boolean
    ) => Promise<IpcResult<boolean>>
    plan: (projectId: number) => Promise<IpcResult<PlanArtifacts>>
    onStep: (cb: (step: AgentStep) => void) => () => void
  }
  orchestrator: {
    chat: (projectId: number, message: string | null) => Promise<IpcResult<GateChatReply>>
    history: (projectId: number) => Promise<IpcResult<ChatTurn[]>>
    onStep: (cb: (step: AgentStep) => void) => () => void
  }
  project2: {
    setParams: (projectId: number, params: ProjectParams) => Promise<IpcResult<boolean>>
    setDirector: (projectId: number, directorId: string) => Promise<IpcResult<boolean>>
    updateIdeal: (
      projectId: number,
      ideal: Ideal
    ) => Promise<IpcResult<Project | undefined>>
    clearStage: (
      projectId: number,
      step: string,
      backStage: string
    ) => Promise<IpcResult<Project | undefined>>
  }
  assets: {
    list: (projectId: number) => Promise<IpcResult<AssetTag[]>>
    create: (
      projectId: number,
      tag: string,
      type: AssetRole,
      name: string
    ) => Promise<IpcResult<AssetTag[]>>
    attach: (projectId: number, tag: string) => Promise<IpcResult<AssetTag[]>>
    clear: (projectId: number, tag: string) => Promise<IpcResult<AssetTag[]>>
    delete: (projectId: number, tag: string) => Promise<IpcResult<AssetTag[]>>
    thumb: (path: string | null) => Promise<IpcResult<string | null>>
  }
  assets2: {
    full: (projectId: number) => Promise<IpcResult<AssetFull[]>>
    coverage: (projectId: number) => Promise<IpcResult<AssetCoverage>>
    visualSystem: (projectId: number) => Promise<IpcResult<VisualSystem | null>>
    /** ⭐ Khóa mặt bằng TAY (không cần qua agent) — trả danh sách asset đã cập nhật. */
    lock: (
      projectId: number,
      tag: string,
      lock: Partial<IdentityLock>
    ) => Promise<IpcResult<AssetFull[]>>
    /** ⭐ Đọc ảnh tư liệu của @tag → hồ sơ ĐỀ XUẤT (không tự lưu, người dùng duyệt trước). */
    readImage: (
      projectId: number,
      tag: string
    ) => Promise<
      IpcResult<{ lock: Partial<IdentityLock>; notes: string; imageCount: number }>
    >
  }
  blocks: {
    list: (projectId: number) => Promise<IpcResult<BlockView[]>>
  }
  styles: {
    list: () => Promise<IpcResult<StyleOption[]>>
  }
  genres: {
    list: () => Promise<IpcResult<GenreOption[]>>
  }
  directors: {
    list: () => Promise<IpcResult<DirectorOption[]>>
  }
  director: {
    brief: (projectId: number) => Promise<IpcResult<DirectorBriefResult>>
    onStep: (cb: (step: AgentStep) => void) => () => void
  }
  exporter: {
    build: (projectId: number) => Promise<IpcResult<ExportBundle>>
    saveFile: (defaultName: string, content: string) => Promise<IpcResult<string | null>>
  }
}

const api: DanhScriptApi = {
  project: {
    list: () => ipcRenderer.invoke('project:list'),
    create: (input) => ipcRenderer.invoke('project:create', input),
    get: (id) => ipcRenderer.invoke('project:get', id),
    delete: (id) => ipcRenderer.invoke('project:delete', id)
  },
  llm: {
    ping: () => ipcRenderer.invoke('llm:ping'),
    config: () => ipcRenderer.invoke('llm:config'),
    listModels: (override) => ipcRenderer.invoke('llm:listModels', override)
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    save: (input) => ipcRenderer.invoke('settings:save', input)
  },
  prep: {
    run: (projectId) => ipcRenderer.invoke('prep:run', projectId),
    onStep: (cb) => {
      const listener = (_e: unknown, step: AgentStep): void => cb(step)
      ipcRenderer.on('prep:step', listener)
      return () => ipcRenderer.removeListener('prep:step', listener)
    }
  },
  gate0: {
    run: (projectId) => ipcRenderer.invoke('gate0:run', projectId),
    onStep: (cb) => {
      const listener = (_e: unknown, step: AgentStep): void => cb(step)
      ipcRenderer.on('gate0:step', listener)
      return () => ipcRenderer.removeListener('gate0:step', listener)
    }
  },
  gate: {
    run: (gateKey, projectId) => ipcRenderer.invoke('gate:run', gateKey, projectId),
    review: (projectId, gateStage) => ipcRenderer.invoke('gate:review', projectId, gateStage),
    chat: (projectId, gateStage, message) =>
      ipcRenderer.invoke('gate:chat', projectId, gateStage, message),
    chatHistory: (projectId, gateStage) =>
      ipcRenderer.invoke('gate:chatHistory', projectId, gateStage),
    confirm: (projectId, gateStage, force) =>
      ipcRenderer.invoke('gate:confirm', projectId, gateStage, force),
    plan: (projectId) => ipcRenderer.invoke('gate:plan', projectId),
    onStep: (cb) => {
      const listener = (_e: unknown, step: AgentStep): void => cb(step)
      ipcRenderer.on('gate:step', listener)
      return () => ipcRenderer.removeListener('gate:step', listener)
    }
  },
  orchestrator: {
    chat: (projectId, message) => ipcRenderer.invoke('orchestrator:chat', projectId, message),
    history: (projectId) => ipcRenderer.invoke('orchestrator:history', projectId),
    onStep: (cb) => {
      const listener = (_e: unknown, step: AgentStep): void => cb(step)
      ipcRenderer.on('orchestrator:step', listener)
      return () => ipcRenderer.removeListener('orchestrator:step', listener)
    }
  },
  project2: {
    setParams: (projectId, params) =>
      ipcRenderer.invoke('project:setParams', projectId, params),
    setDirector: (projectId, directorId) =>
      ipcRenderer.invoke('project:setDirector', projectId, directorId),
    updateIdeal: (projectId, ideal) =>
      ipcRenderer.invoke('project:updateIdeal', projectId, ideal),
    clearStage: (projectId, step, backStage) =>
      ipcRenderer.invoke('project:clearStage', projectId, step, backStage)
  },
  assets: {
    list: (projectId) => ipcRenderer.invoke('asset:list', projectId),
    create: (projectId, tag, type, name) =>
      ipcRenderer.invoke('asset:create', projectId, tag, type, name),
    attach: (projectId, tag) => ipcRenderer.invoke('asset:attach', projectId, tag),
    clear: (projectId, tag) => ipcRenderer.invoke('asset:clear', projectId, tag),
    delete: (projectId, tag) => ipcRenderer.invoke('asset:delete', projectId, tag),
    thumb: (path) => ipcRenderer.invoke('asset:thumb', path)
  },
  assets2: {
    full: (projectId) => ipcRenderer.invoke('assets2:full', projectId),
    coverage: (projectId) => ipcRenderer.invoke('assets2:coverage', projectId),
    visualSystem: (projectId) => ipcRenderer.invoke('assets2:visualSystem', projectId),
    lock: (projectId, tag, lock) => ipcRenderer.invoke('assets2:lock', projectId, tag, lock),
    readImage: (projectId, tag) => ipcRenderer.invoke('assets2:readImage', projectId, tag)
  },
  blocks: {
    list: (projectId) => ipcRenderer.invoke('blocks:list', projectId)
  },
  styles: {
    list: () => ipcRenderer.invoke('styles:list')
  },
  genres: {
    list: () => ipcRenderer.invoke('genres:list')
  },
  directors: {
    list: () => ipcRenderer.invoke('directors:list')
  },
  director: {
    brief: (projectId) => ipcRenderer.invoke('director:brief', projectId),
    onStep: (cb) => {
      const listener = (_e: unknown, step: AgentStep): void => cb(step)
      ipcRenderer.on('director:step', listener)
      return () => ipcRenderer.removeListener('director:step', listener)
    }
  },
  exporter: {
    build: (projectId) => ipcRenderer.invoke('export:build', projectId),
    saveFile: (defaultName, content) =>
      ipcRenderer.invoke('export:saveFile', defaultName, content)
  }
}

contextBridge.exposeInMainWorld('danh', api)
