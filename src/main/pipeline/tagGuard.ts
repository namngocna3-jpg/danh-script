// ============================================================
// Danh Script — Lá chắn @tag: kiểm @tag nhúng trong prompt có asset thật không.
// Chống asset mồ côi do gõ sai tên tag. Chỉ ĐỐI CHIẾU, không tự sửa.
// ============================================================
import { projectTagMap } from '../db'

/** Rút mọi @tag trong text → mảng tên (KHÔNG kèm @), viết HOA, unique. */
export function extractTags(text: string): string[] {
  if (!text) return []
  const found = text.match(/@[\w-]+/g) ?? []
  const set = new Set<string>()
  for (const raw of found) {
    const name = raw.slice(1).toUpperCase()
    if (name) set.add(name)
  }
  return [...set]
}

/**
 * Đối chiếu danh sách tag (tên, không @) với asset thật của dự án.
 * Trả { missing } = tag KHÔNG có asset tương ứng (so khớp không phân biệt hoa/thường).
 */
export function checkTagsExist(projectId: number, tags: string[]): { missing: string[] } {
  const known = new Set(projectTagMap(projectId).map((a) => a.tag.toUpperCase()))
  const missing = tags.filter((t) => !known.has(t.toUpperCase()))
  return { missing }
}
