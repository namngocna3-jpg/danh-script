// Stub electron cho test thuần Node — llmGateway kéo theo settings.ts (dùng app/safeStorage).
// Hàm đang test (dataUrlToImageBlock) không chạm electron nên stub rỗng là đủ.
export const app = { getPath: () => '/tmp' }
export const safeStorage = { isEncryptionAvailable: () => false }
