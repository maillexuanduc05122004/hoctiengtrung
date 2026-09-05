import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { buildIndex, EMPTY_INDEX, loadLevels, type VocabularyIndex } from '../../lib/vocabulary/store.ts';
import { VocabularyContext, type VocabularyContextValue } from '../../hooks/vocabulary-context.ts';
import type { HskLevel } from '../../types/vocabulary.ts';

const ALL_LEVELS: readonly HskLevel[] = [1, 2, 3];

/**
 * Nạp toàn bộ từ vựng cấp 1 đến 3 một lần khi mở ứng dụng.
 *
 * Nạp cả ba cấp thay vì nạp dần vì hộp tra từ phải tìm được mọi từ, và vì dữ
 * liệu đã nằm sẵn trong gói cài đặt nên lần sau service worker phục vụ ngay từ
 * bộ nhớ đệm, không cần mạng.
 *
 * `loading` được suy ra từ việc kết quả đã nạp có khớp lần thử hiện tại hay
 * chưa, nên effect chỉ đặt trạng thái trong nhánh bất đồng bộ.
 */
export function VocabularyProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState<{ attempt: number; index: VocabularyIndex } | null>(null);
  const [failure, setFailure] = useState<{ attempt: number; message: string } | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    loadLevels(ALL_LEVELS)
      .then((files) => {
        if (active) setLoaded({ attempt, index: buildIndex(files) });
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setFailure({
          attempt,
          message:
            cause instanceof Error
              ? cause.message
              : 'Không tải được dữ liệu từ vựng. Kiểm tra kết nối rồi thử lại.',
        });
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  const value = useMemo<VocabularyContextValue>(() => {
    const ready = loaded?.attempt === attempt;
    const failed = failure?.attempt === attempt;
    return {
      index: ready ? loaded.index : EMPTY_INDEX,
      loading: !ready && !failed,
      error: failed ? failure.message : null,
      reload,
    };
  }, [loaded, failure, attempt, reload]);

  return <VocabularyContext.Provider value={value}>{children}</VocabularyContext.Provider>;
}
