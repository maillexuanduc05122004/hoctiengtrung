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
 * Luôn có gì đó để vẽ ngay, không bao giờ chờ máy chủ để hiện màn hình đầu:
 * bản chụp của lần nạp trước (`snapshot.ts`), hoặc — chưa có bản chụp — bộ dự
 * phòng đóng gói sẵn (`fallback.ts`). `origin` nói dữ liệu đang hiện đến từ
 * đâu; chỉ khi là `server` thì mã từ mới là mã thật để xoá được. Lượt nạp thật
 * chạy nền, tự thử lại trong lúc máy chủ miễn phí thức dậy (`retry.ts`), và
 * ghi đè khi về tới.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FALLBACK_WORDS } from '../features/sentences/fallback.ts';
import { describeApiError } from '../lib/api/client.ts';
import { listMyWords } from '../lib/api/endpoints.ts';
import { withRetry } from '../lib/api/retry.ts';
import type { UserWord } from '../lib/api/types.ts';
import { readSnapshot, writeSnapshot, type DataOrigin } from '../lib/storage/snapshot.ts';

/** Tên bản chụp trong localStorage. */
export const MY_WORDS_SNAPSHOT = 'my-words';

/** Cỡ trang xin máy chủ; vượt mức này thì bảng từ cũng không còn đọc nổi. */
export const MY_WORDS_PAGE_SIZE = 500;

export interface UseMyWordsResult {
  words: UserWord[];
  /** Dữ liệu đang hiện đến từ đâu; `server` nghĩa là máy chủ đã trả lời trong phiên này. */
  origin: DataOrigin;
  /** Đang có một lượt nạp chờ máy chủ (kể cả nạp lại và các lần tự thử lại). */
  loading: boolean;
  /** Lượt nạp gần nhất thất bại hẳn (đã hết lượt thử lại, hoặc lỗi không tạm thời). */
  error: string | null;
  reload: () => void;
}

interface Loaded {
  /** `-1` cho bản chụp hay bộ dự phòng: có dữ liệu để vẽ nhưng chưa khớp lần thử nào. */
  attempt: number;
  origin: DataOrigin;
  words: UserWord[];
}

function initialLoaded(): Loaded {
  const cached = readSnapshot<UserWord[]>(MY_WORDS_SNAPSHOT);
  return Array.isArray(cached)
    ? { attempt: -1, origin: 'snapshot', words: cached }
    : { attempt: -1, origin: 'builtin', words: [...FALLBACK_WORDS] };
}

export function useMyWords(): UseMyWordsResult {
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<Loaded>(initialLoaded);
  const [failure, setFailure] = useState<{ attempt: number; message: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    withRetry((signal) => listMyWords({ size: MY_WORDS_PAGE_SIZE }, signal), {
      signal: controller.signal,
    })
      .then((page) => {
        if (controller.signal.aborted) return;
        writeSnapshot(MY_WORDS_SNAPSHOT, page.content);
        setLoaded({ attempt, origin: 'server', words: page.content });
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setFailure({ attempt, message: describeApiError(cause) });
      });
    return () => controller.abort();
  }, [attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  return useMemo(() => {
    const current = loaded.attempt === attempt;
    const failed = failure?.attempt === attempt;
    return {
      // Đang nạp lại thì vẫn giữ danh sách cũ, để bảng không nháy về rỗng.
      words: loaded.words,
      origin: loaded.origin,
      loading: !current && !failed,
      error: failed ? failure.message : null,
      reload,
    };
  }, [attempt, failure, loaded, reload]);
}
