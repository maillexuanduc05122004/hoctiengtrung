/**
 * Tra "từ điển lớn" CC-CEDICT trên máy chủ, dùng cho hộp tra từ.
 *
 * Bộ HSK trên máy chỉ có 2.245 từ; gặp một chữ ngoài bộ đó (hay muốn tra
 * ngược từ tiếng Anh) thì phải hỏi máy chủ. Máy chủ ở xa hơn IndexedDB rất
 * nhiều, nên truy vấn được hoãn 300 mili giây và mỗi phím mới huỷ luôn yêu cầu
 * đang bay: gõ "học" thì chỉ có "học" được gửi đi, không phải cả "h", "ho".
 *
 * Lỗi mạng bị nuốt và trả về `failed`: phần "Từ điển lớn" là phần thêm, mất
 * mạng thì nó lặng lẽ ẩn đi chứ không được che kết quả cục bộ bằng một khung
 * báo lỗi.
 */
import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api/client.ts';
import type { DictionaryEntry } from '../../lib/api/types.ts';

/** Hoãn lâu hơn tìm cục bộ (150 ms) vì mỗi lần gửi là một chuyến đi tới máy chủ. */
export const CEDICT_DEBOUNCE_MS = 300;

/** Dưới hai ký tự thì kết quả tiếng Anh toàn "a", "to" — không đáng một chuyến đi. */
export const CEDICT_MIN_QUERY = 2;

/** Đủ để thấy các nghĩa chính mà tấm trượt không phải cuộn quá dài. */
const CEDICT_LIMIT = 15;

export interface CedictSearchState {
  entries: DictionaryEntry[];
  /** Đang hoãn hoặc đang chờ máy chủ, nên kết quả chưa khớp với ô nhập. */
  loading: boolean;
  /** Lần tra gần nhất hỏng (mất mạng, máy chủ lỗi); nơi gọi nên ẩn phần này đi. */
  failed: boolean;
}

interface CedictResult {
  /** Truy vấn (đã cắt khoảng trắng) mà kết quả này thuộc về. */
  query: string;
  entries: DictionaryEntry[];
  failed: boolean;
}

const EMPTY: DictionaryEntry[] = [];

/**
 * Tra CC-CEDICT theo `query`; chuỗi ngắn hơn hai ký tự (hoặc rỗng) thì không
 * gửi gì cả. Nơi gọi truyền chuỗi rỗng khi chưa đăng nhập để tắt hẳn.
 */
export function useCedictSearch(query: string): CedictSearchState {
  const trimmed = query.trim();
  const active = trimmed.length >= CEDICT_MIN_QUERY;
  const [result, setResult] = useState<CedictResult>({ query: '', entries: EMPTY, failed: false });

  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const path = `/dictionary/search?q=${encodeURIComponent(trimmed)}&limit=${CEDICT_LIMIT}`;
      apiFetch<DictionaryEntry[]>(path, { signal: controller.signal }).then(
        (entries) => {
          // Yêu cầu đã bị huỷ thì kết quả này thuộc về một truy vấn cũ, bỏ.
          if (controller.signal.aborted) return;
          setResult({ query: trimmed, entries: Array.isArray(entries) ? entries : EMPTY, failed: false });
        },
        () => {
          if (controller.signal.aborted) return;
          setResult({ query: trimmed, entries: EMPTY, failed: true });
        },
      );
    }, CEDICT_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [active, trimmed]);

  // Kết quả chỉ được coi là "của" ô nhập khi đúng truy vấn; còn lại là đang chờ.
  const matches = active && result.query === trimmed;

  return {
    entries: matches ? result.entries : EMPTY,
    loading: active && !matches,
    failed: matches && result.failed,
  };
}
