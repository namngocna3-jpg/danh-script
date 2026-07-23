import { create } from 'zustand'
import type { CreateProjectInput, Project, LlmSettingsPublic } from '@shared/types'

interface AppState {
  projects: Project[]
  loading: boolean
  error: string | null
  llmInfo: LlmSettingsPublic | null
  settingsOpen: boolean

  // ---- Wizard: dự án đang mở ----
  activeProject: Project | null

  loadProjects: () => Promise<void>
  createProject: (input: CreateProjectInput) => Promise<Project | null>
  deleteProject: (id: number) => Promise<void>
  loadLlmInfo: () => Promise<void>
  openSettings: () => void
  closeSettings: () => void

  openProject: (id: number) => Promise<void>
  closeProject: () => void
  refreshActiveProject: () => Promise<void>
}

export const useApp = create<AppState>((set, get) => ({
  projects: [],
  loading: false,
  error: null,
  llmInfo: null,
  settingsOpen: false,
  activeProject: null,

  async loadProjects() {
    set({ loading: true, error: null })
    const res = await window.danh.project.list()
    if (res.ok) set({ projects: res.data, loading: false })
    else set({ error: res.error, loading: false })
  },

  async createProject(input) {
    const res = await window.danh.project.create(input)
    if (res.ok) {
      await get().loadProjects()
      return res.data
    }
    set({ error: res.error })
    return null
  },

  async deleteProject(id) {
    const res = await window.danh.project.delete(id)
    if (res.ok) await get().loadProjects()
    else set({ error: res.error })
  },

  async loadLlmInfo() {
    const res = await window.danh.settings.get()
    if (res.ok) set({ llmInfo: res.data })
  },

  openSettings() {
    set({ settingsOpen: true })
  },

  closeSettings() {
    set({ settingsOpen: false })
  },

  async openProject(id) {
    const res = await window.danh.project.get(id)
    if (res.ok && res.data) set({ activeProject: res.data })
    else set({ error: res.ok ? 'Không tìm thấy dự án' : res.error })
  },

  closeProject() {
    set({ activeProject: null })
    void get().loadProjects()
  },

  async refreshActiveProject() {
    const cur = get().activeProject
    if (!cur) return
    const res = await window.danh.project.get(cur.id)
    if (res.ok && res.data) set({ activeProject: res.data })
  }
}))
