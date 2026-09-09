/**
 * Lịch sử tra từ.
 *
 * Mỗi từ chỉ giữ một dòng: tra lại từ cũ thì cập nhật mốc thời gian và tăng số
 * lần chứ không đẻ thêm bản ghi, vì danh sách này để người học nhìn lại xem mình
 * hay vướng ở đâu, không phải nhật ký đầy đủ.
 *
 * Toàn bộ nằm trong IndexedDB của máy, không gửi đi đâu.
 */
import { db } from './database.ts';
import type { LookupEntry, LookupSource } from '../types/study.ts';

/**
 * Quá số này thì cắt bớt các từ tra lâu nhất. Đủ rộng cho vài tuần tra cứu mà
 * vẫn không để một lần dán đoạn văn dài chiếm hết chỗ.
 */
export const MAX_LOOKUPS = 300;

export interface RecordLookupOptions {
  /** Nội dung người học đã gõ; để rỗng khi từ đến từ phần quét đoạn văn. */
  query?: string;
  source?: LookupSource;
  /** Mốc thời gian, chỉ truyền trong kiểm thử. */
  at?: number;
}

/** Xoá bớt các dòng cũ nhất khi lịch sử đã vượt mức. */
async function trim(): Promise<void> {
  const total = await db.lookups.count();
  if (total <= MAX_LOOKUPS) return;
  const oldest = await db.lookups
    .orderBy('at')
    .limit(total - MAX_LOOKUPS)
    .primaryKeys();
  await db.lookups.bulkDelete(oldest);
}

/**
 * Ghi lại một loạt từ vừa tra. Trả về các dòng đã ghi.
 *
 * Cả loạt dùng chung một mốc thời gian: dán một đoạn văn là một lần tra, tách ra
 * từng mili giây chỉ làm thứ tự trong danh sách trông như ngẫu nhiên.
 */
export async function recordLookups(
  wordIds: readonly string[],
  options: RecordLookupOptions = {},
): Promise<LookupEntry[]> {
  const at = options.at ?? Date.now();
  const query = options.query ?? '';
  const source = options.source ?? 'search';
  // Một đoạn văn hay lặp lại cùng một từ, mà lịch sử chỉ giữ một dòng cho mỗi từ.
  const ids = [...new Set(wordIds.filter((id) => id !== ''))];
  if (ids.length === 0) return [];

  return db.transaction('rw', db.lookups, async () => {
    const existing = await db.lookups.bulkGet(ids);
    const rows = ids.map<LookupEntry>((wordId, position) => ({
      wordId,
      at,
      count: (existing[position]?.count ?? 0) + 1,
      query,
      source,
    }));
    await db.lookups.bulkPut(rows);
    await trim();
    return rows;
  });
}

/** Ghi lại một từ vừa tra. */
export async function recordLookup(
  wordId: string,
  options: RecordLookupOptions = {},
): Promise<LookupEntry | null> {
  const [row] = await recordLookups([wordId], options);
  return row ?? null;
}

/** Các từ tra gần đây nhất, mới trước cũ sau. */
export async function getRecentLookups(limit: number): Promise<LookupEntry[]> {
  if (limit <= 0) return [];
  return db.lookups.orderBy('at').reverse().limit(limit).toArray();
}

export async function countLookups(): Promise<number> {
  return db.lookups.count();
}

export async function removeLookup(wordId: string): Promise<void> {
  await db.lookups.delete(wordId);
}

export async function clearLookups(): Promise<void> {
  await db.lookups.clear();
}
