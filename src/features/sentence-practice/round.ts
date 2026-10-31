/**
 * Chọn câu cho một lượt luyện.
 *
 * Người học muốn mỗi lượt là câu "mới": vì thế máy nhớ (trên chính máy này)
 * những câu đã ra, và lượt sau ưu tiên câu CHƯA ra lần nào, xáo ngẫu nhiên;
 * hết câu mới thì quay lại câu đã ra lâu nhất. Đi hết kho mới gặp lại một câu.
 *
 * Bộ nhớ nằm trong localStorage và mọi lần đọc ghi đều bọc try/catch: chế độ
 * ẩn danh hay trình duyệt chặn lưu trữ thì vẫn luyện được, chỉ là không nhớ.
 */
import { hanziLength, type PracticeSentence } from './pool.ts';

export type LengthFilter = 'all' | 'short' | 'long';

export interface RoundOptions {
  /** `all` hoặc mã bài, ví dụ `bai-06`. */
  lesson: string;
  length: LengthFilter;
  size: number;
}

/** Từ ngưỡng này trở lên là câu dài, khớp với ngưỡng câu gõ pinyin. */
export const LONG_SENTENCE_MIN = 12;

export function filterPool<T extends PracticeSentence>(
  pool: readonly T[],
  options: Pick<RoundOptions, 'lesson' | 'length'>,
): T[] {
  return pool.filter((sentence) => {
    if (options.lesson !== 'all' && sentence.lessonId !== options.lesson) return false;
    if (options.length === 'all') return true;
    const long = hanziLength(sentence.hanzi) >= LONG_SENTENCE_MIN;
    return options.length === 'long' ? long : !long;
  });
}

function shuffle<T>(items: T[], random: () => number): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

/**
 * `seen` là các mã câu đã ra, theo thứ tự cũ trước mới sau. Câu chưa ra đứng
 * trước (xáo ngẫu nhiên), rồi tới câu đã ra lâu nhất.
 */
export function pickRound<T extends PracticeSentence>(
  pool: readonly T[],
  size: number,
  seen: readonly string[],
  random: () => number = Math.random,
): T[] {
  const order = new Map(seen.map((id, index) => [id, index]));
  const fresh = shuffle(
    pool.filter((sentence) => !order.has(sentence.id)),
    random,
  );
  const old = pool
    .filter((sentence) => order.has(sentence.id))
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  return [...fresh, ...old].slice(0, Math.max(0, size));
}

const SEEN_PREFIX = 'moi-ngay:da-ra:';
const SEEN_LIMIT = 3000;

export function loadSeen(key: string): string[] {
  try {
    const raw = window.localStorage.getItem(SEEN_PREFIX + key);
    const parsed: unknown = raw === null ? [] : JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

/** Ghi thêm các câu vừa ra vào cuối danh sách (câu ra lại thì dời về cuối). */
export function rememberSeen(key: string, ids: readonly string[]): string[] {
  const fresh = new Set(ids);
  const next = [...loadSeen(key).filter((id) => !fresh.has(id)), ...ids].slice(-SEEN_LIMIT);
  try {
    window.localStorage.setItem(SEEN_PREFIX + key, JSON.stringify(next));
  } catch {
    // Không lưu được thì lượt sau có thể lặp câu; vẫn luyện bình thường.
  }
  return next;
}

const OPTIONS_PREFIX = 'moi-ngay:tuy-chon:';

export function loadOptions(key: string, fallback: RoundOptions): RoundOptions {
  try {
    const raw = window.localStorage.getItem(OPTIONS_PREFIX + key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw) as Partial<RoundOptions>;
    return {
      lesson: typeof parsed.lesson === 'string' ? parsed.lesson : fallback.lesson,
      length:
        parsed.length === 'all' || parsed.length === 'short' || parsed.length === 'long'
          ? parsed.length
          : fallback.length,
      size: typeof parsed.size === 'number' && parsed.size > 0 ? parsed.size : fallback.size,
    };
  } catch {
    return fallback;
  }
}

export function saveOptions(key: string, options: RoundOptions): void {
  try {
    window.localStorage.setItem(OPTIONS_PREFIX + key, JSON.stringify(options));
  } catch {
    // Chỉ là tiện ích nhớ lựa chọn; mất thì lần sau về mặc định.
  }
}
