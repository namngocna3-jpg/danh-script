// ============================================================
// Danh Script — Cài đặt LLM lưu tại userData (mã hóa key theo máy)
// Người dùng dán API key trong app → lưu userData/settings.json.
// Key được mã hóa bằng Electron safeStorage (DPAPI trên Windows) → gắn máy,
// copy file sang máy khác KHÔNG giải mã được. Không đụng biến môi trường.
// ============================================================
import { app, safeStorage } from 'electron'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import type { Provider } from './llmGateway'

/** Cài đặt hiển thị ra renderer — KHÔNG bao giờ chứa apiKey thô. */
export interface LlmSettingsPublic {
  provider: Provider
  modelName: string
  baseUrl: string
  hasKey: boolean
  encrypted: boolean // key có được mã hóa theo máy không (safeStorage khả dụng)
}

/** Bản ghi trên đĩa: key ở dạng đã mã hóa base64 (hoặc thô nếu safeStorage tắt). */
interface StoredSettings {
  provider: Provider
  modelName: string
  baseUrl: string
  apiKeyEnc?: string // base64 ciphertext (safeStorage)
  apiKeyPlain?: string // fallback khi safeStorage không khả dụng
}

const DEFAULTS: Record<Provider, { modelName: string; baseUrl: string }> = {
  anthropic: { modelName: 'claude-opus-4-8', baseUrl: 'https://api.anthropic.com' },
  '9router': { modelName: 'claude-opus-4-8', baseUrl: 'https://9router.example/v1' },
  beeknoee: { modelName: 'claude-opus-4-8', baseUrl: 'https://platform.beeknoee.com/api/v1' }
}

function settingsPath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

function readStored(): StoredSettings | null {
  try {
    const p = settingsPath()
    if (!existsSync(p)) return null
    return JSON.parse(readFileSync(p, 'utf-8')) as StoredSettings
  } catch {
    return null
  }
}

function writeStored(s: StoredSettings): void {
  writeFileSync(settingsPath(), JSON.stringify(s, null, 2), 'utf-8')
}

/** Giải mã key đã lưu (trả '' nếu chưa có/lỗi). Chỉ dùng ở main. */
export function getApiKey(): string {
  const s = readStored()
  if (!s) return ''
  if (s.apiKeyEnc) {
    try {
      if (safeStorage.isEncryptionAvailable()) {
        return safeStorage.decryptString(Buffer.from(s.apiKeyEnc, 'base64'))
      }
    } catch {
      /* rơi xuống fallback / env */
    }
  }
  if (s.apiKeyPlain) return s.apiKeyPlain
  return ''
}

/** Cấu hình LLM hiệu lực: settings đã lưu > mặc định theo provider. */
export function effectiveConfig(): {
  provider: Provider
  modelName: string
  baseUrl: string
  apiKey: string
} {
  const s = readStored()
  const provider: Provider = s?.provider ?? 'anthropic'
  const def = DEFAULTS[provider]
  return {
    provider,
    modelName: s?.modelName || def.modelName,
    baseUrl: s?.baseUrl || def.baseUrl,
    // ưu tiên key đã lưu trong app; nếu chưa có thì thử biến môi trường (dev)
    apiKey: getApiKey() || process.env.DS_API_KEY || process.env.ANTHROPIC_API_KEY || ''
  }
}

/** Cài đặt công khai cho renderer (ẩn key). */
export function getPublicSettings(): LlmSettingsPublic {
  const c = effectiveConfig()
  return {
    provider: c.provider,
    modelName: c.modelName,
    baseUrl: c.baseUrl,
    hasKey: !!c.apiKey,
    encrypted: safeStorageOk()
  }
}

function safeStorageOk(): boolean {
  try {
    return safeStorage.isEncryptionAvailable()
  } catch {
    return false
  }
}

/**
 * Lưu cài đặt từ renderer. apiKey rỗng = GIỮ key cũ (không xóa).
 * Truyền apiKey = '__CLEAR__' để xóa key.
 */
export function saveSettings(input: {
  provider: Provider
  modelName?: string
  baseUrl?: string
  apiKey?: string
}): LlmSettingsPublic {
  const prev = readStored()
  const def = DEFAULTS[input.provider]
  const next: StoredSettings = {
    provider: input.provider,
    modelName: input.modelName?.trim() || def.modelName,
    baseUrl: input.baseUrl?.trim() || def.baseUrl,
    apiKeyEnc: prev?.apiKeyEnc,
    apiKeyPlain: prev?.apiKeyPlain
  }

  const rawKey = input.apiKey
  if (rawKey === '__CLEAR__') {
    delete next.apiKeyEnc
    delete next.apiKeyPlain
  } else if (rawKey && rawKey.trim()) {
    const key = rawKey.trim()
    if (safeStorageOk()) {
      next.apiKeyEnc = safeStorage.encryptString(key).toString('base64')
      delete next.apiKeyPlain
    } else {
      next.apiKeyPlain = key
      delete next.apiKeyEnc
    }
  }

  writeStored(next)
  return getPublicSettings()
}
