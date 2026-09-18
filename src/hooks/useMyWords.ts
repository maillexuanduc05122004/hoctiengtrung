/**
 * Danh sách từ người học đã học, lấy từ máy chủ.
 *
 * Nạp một lần khi dựng và mỗi khi `reload()` được gọi (sau khi thêm hay bỏ
 * từ). Kích thước trang 500 là đủ cho một vốn từ HSK 1–4 mà không phải phân
 * trang trên giao diện — bảng từ vựng vốn hiện hết một lượt.
 *
 * `loading` suy ra từ việc kết quả đã nạp có khớp lần thử hiện tại hay chưa,
 * nên effect chỉ đặt trạng thái trong nhánh bất đồng bộ (cùng cách với
 * `VocabularyProvider`).
 *
 * Lần nạp gần nhất được chụp lại (`snapshot.ts`): mở trang lần sau thì bảng
 * hiện ngay với `ready = true` và `loading = true`, rồi lượt nạp thật ghi đè
 * khi máy chủ trả lời — máy chủ miễn phí thức dậy chậm không còn chặn màn hình.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { describeApiError } from '../lib/api/client.ts';
import { listMyWords } from '../lib/api/endpoints.ts';
import type { UserWord } from '../lib/api/types.ts';
import { readSnapshot, writeSnapshot } from '../lib/storage/snapshot.ts';

/** Tên bản chụp trong localStorage. */
export const MY_WORDS_SNAPSHOT = 'my-words';

/** Cỡ trang xin máy chủ; vượt mức này thì bảng từ cũng không còn đọc nổi. */
export const MY_WORDS_PAGE_SIZE = 500;

export interface UseMyWordsResult {
  words: UserWord[];
  /** Đang có một lượt nạp chờ máy chủ (kể cả nạp lại). */
  loading: boolean;
  /** Đã nạp thành công ít nhất một lần; nạp lại thất bại vẫn giữ `true`. */
  ready: boolean;
  error: string | null;
  reload: () => void;
}

const EMPTY: UserWord[] = [];

export function useMyWords(): UseMyWordsResult {
  const [attempt, setAttempt] = useState(0);
  // Bản chụp mang attempt -1: có dữ liệu để vẽ nhưng chưa khớp lần thử nào,
  // nên `loading` vẫn đúng cho tới khi máy chủ trả lời.
  const [loaded, setLoaded] = useState<{ attempt: number; words: UserWord[] } | null>(() => {
    const cached = readSnapshot<UserWord[]>(MY_WORDS_SNAPSHOT);
    return Array.isArray(cached) ? { attempt: -1, words: cached } : null;
  });
  const [failure, setFailure] = useState<{ attempt: number; message: string } | null>(null);

  useEffect(() => {
    let active = true;
    listMyWords({ size: MY_WORDS_PAGE_SIZE })
      .then((page) => {
        writeSnapshot(MY_WORDS_SNAPSHOT, page.content);
        if (active) setLoaded({ attempt, words: page.content });
      })
      .catch((cause: unknown) => {
        if (active) setFailure({ attempt, message: describeApiError(cause) });
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  return useMemo(() => {
    const current = loaded?.attempt === attempt;
    const failed = failure?.attempt === attempt;
    return {
      // Đang nạp lại thì vẫn giữ danh sách cũ, để bảng không nháy về rỗng.
      words: current ? loaded.words : (loaded?.words ?? EMPTY),
      loading: !current && !failed,
      ready: loaded !== null,
      error: failed ? failure.message : null,
      reload,
    };
  }, [attempt, failure, loaded, reload]);
}
