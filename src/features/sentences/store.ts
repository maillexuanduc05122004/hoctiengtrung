/**
 * Kho câu người học tự thêm.
 *
 * Nằm ở localStorage chứ không ở IndexedDB như phần còn lại của ứng dụng, vì hai
 * lý do. Một: đây là NỘI DUNG người học dán vào, không phải tiến độ — nút "đặt
 * lại tiến độ" xoá sạch IndexedDB, mà xoá luôn cả những câu họ đã cất công nhờ
 * AI tạo thì không ai ngờ tới. Hai: vài trăm câu chỉ chừng vài chục KB, không
 * đáng dựng thêm một bảng Dexie và một lần nâng phiên bản lược đồ.
 *
 * Mọi thao tác đọc ghi đều nuốt lỗi: trình duyệt ở chế độ riêng tư hoặc đã chặn
 * lưu trữ thì trang vẫn phải chạy với 90 câu có sẵn.
 */
import type { MySentence } from './corpus.ts';
import { sentenceKey } from './parse.ts';
import type { ParsedSentence } from './parse.ts';

const STORAGE_KEY = 'moingay.cau-cua-toi.v1';

/** Chặn trên để một lần dán nhầm cả cuốn sách không làm hỏng localStorage. */
export const MAX_STORED = 1000;

export interface StoredSentence extends MySentence {
  /** Mốc thời gian lúc thêm, để xếp lần nhập mới nhất lên trước. */
  addedAt: number;
}

function read(): StoredSentence[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Dữ liệu cũ hoặc hỏng thì lọc từng dòng, không vứt cả kho.
    return parsed.filter((item): item is StoredSentence => {
      if (typeof item !== 'object' || item === null) return false;
      const row = item as Record<string, unknown>;
      return typeof row.id === 'string' && typeof row.hanzi === 'string';
    });
  } catch {
    return [];
  }
}

function write(rows: readonly StoredSentence[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    return true;
  } catch {
    return false;
  }
}

export function loadStoredSentences(): StoredSentence[] {
  return read();
}

export interface AddResult {
  added: StoredSentence[];
  /** Số câu bị bỏ vì đã có sẵn trong 90 câu gốc hoặc trong kho. */
  duplicates: number;
  /** Số câu bị bỏ vì kho đã đầy. */
  overflow: number;
  /** `false` khi trình duyệt không cho ghi; câu vẫn hiện trong phiên này. */
  saved: boolean;
}

/**
 * Thêm các câu vừa đọc được, bỏ qua câu đã có.
 *
 * `existingKeys` là khoá của những câu đang hiển thị (cả 90 câu gốc lẫn câu đã
 * lưu), do nơi gọi truyền vào — kho này không biết gì về bộ câu gốc.
 */
export function addStoredSentences(
  incoming: readonly ParsedSentence[],
  existingKeys: ReadonlySet<string>,
): AddResult {
  const current = read();
  const keys = new Set(existingKeys);
  const added: StoredSentence[] = [];
  let duplicates = 0;
  let overflow = 0;
  const now = Date.now();

  for (const item of incoming) {
    const key = sentenceKey(item.hanzi);
    if (keys.has(key)) {
      duplicates += 1;
      continue;
    }
    if (current.length + added.length >= MAX_STORED) {
      overflow += 1;
      continue;
    }
    keys.add(key);
    added.push({
      // Mốc thời gian cộng số thứ tự là đủ duy nhất, và vẫn đọc được bằng mắt
      // khi cần soi localStorage.
      id: `u${now.toString(36)}-${added.length.toString(36)}`,
      hanzi: item.hanzi,
      pinyin: item.pinyin,
      vi: item.vi,
      level: 3,
      addedAt: now,
    });
  }

  const saved = added.length === 0 ? true : write([...current, ...added]);
  return { added, duplicates, overflow, saved };
}

export function removeStoredSentence(id: string): StoredSentence[] {
  const next = read().filter((row) => row.id !== id);
  write(next);
  return next;
}

export function clearStoredSentences(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Không xoá được thì danh sách vẫn còn; nơi gọi đọc lại sẽ thấy đúng sự thật.
  }
}
