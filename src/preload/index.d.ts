import type { DanhScriptApi } from './index'

declare global {
  interface Window {
    danh: DanhScriptApi
  }
}

export {}
