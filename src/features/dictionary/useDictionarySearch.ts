/**
 * Trạng thái tra từ dùng chung cho hộp trượt và trang Tra từ.
 *
 * Tách riêng khỏi giao diện vì hộp tra từ được mở ngay giữa lúc người học đang
 * làm bài: quét lại toàn bộ bộ từ sau mỗi phím sẽ làm khựng bàn phím, nên truy
 * vấn được hoãn một nhịp ngắn rồi mới đem đi tìm.
 */
import { useEffect, useMemo, useState } from 'react';
import { searchWords, type SearchHit } from '../../lib/vocabulary/search.ts';
import { useSearchIndex, useVocabulary } from '../../hooks/vocabulary-context.ts';
import { useSettings } from '../../hooks/settings-context.ts';
import type { HskLevel, VocabularyWord } from '../../types/vocabulary.ts';

/** Bộ lọc cấp của kết quả; 'all' nghĩa là không lọc. */
export type LevelFilter = HskLevel | 'all';

/**
 * Hoãn 150 mili giây: đủ để bỏ qua các phím gõ liên tiếp nhưng vẫn nằm dưới
 * ngưỡng mà mắt người nhận ra là chậm.
 */
const DEBOUNCE_MS = 150;

const DEFAULT_LIMIT = 20;

/** Số từ gợi ý mặc định khi ô tìm kiếm còn trống. */
const DEFAULT_SUGGESTIONS = 6;

export interface UseDictionarySearchOptions {
  /** Nội dung có sẵn trong ô tìm kiếm ở lần dựng đầu tiên. */
  initialQuery?: string;
  level?: LevelFilter;
  limit?: number;
}

export interface DictionarySearchState {
  query: string;
  setQuery: (value: string) => void;
  /** Truy vấn đã thực sự đem đi tìm, có thể chậm hơn `query` một nhịp. */
  applied: string;
  hits: SearchHit[];
  /** Đang chờ hết nhịp hoãn nên kết quả chưa khớp với ô nhập. */
  pending: boolean;
  /** Bộ từ còn đang tải. */
  loading: boolean;
  error: string | null;
}

export function useDictionarySearch(
  options: UseDictionarySearchOptions = {},
): DictionarySearchState {
  const { initialQuery = '', level = 'all', limit = DEFAULT_LIMIT } = options;
  const { loading, error } = useVocabulary();
  const index = useSearchIndex();
  const [query, setQuery] = useState(initialQuery);
  const [applied, setApplied] = useState(initialQuery);

  useEffect(() => {
    const timer = window.setTimeout(() => setApplied(query), DEBOUNCE_MS);
    // Mỗi phím mới huỷ hẹn cũ, nên chỉ lần gõ cuối cùng mới chạy tìm kiếm.
    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  const hits = useMemo(() => {
    const trimmed = applied.trim();
    if (trimmed === '') return [];
    if (level === 'all') return searchWords(index, trimmed, { limit });
    // Lọc cấp diễn ra sau khi tìm, nên phải lấy dư rồi mới cắt; nếu cắt trước
    // thì lọc xong có khi chẳng còn kết quả nào dù bộ từ vẫn có.
    const wide = searchWords(index, trimmed, { limit: limit * 5 });
    return wide.filter((hit) => hit.word.hskLevel === level).slice(0, limit);
  }, [index, applied, level, limit]);

  return {
    query,
    setQuery,
    applied,
    hits,
    pending: query.trim() !== applied.trim(),
    loading,
    error,
  };
}

/**
 * Vài từ có thật trong cấp người học đang chọn, dùng làm gợi ý khi ô tìm kiếm
 * còn trống. Không xáo trộn ngẫu nhiên để danh sách không nhảy giữa các lần mở.
 */
export function useSuggestedWords(count: number = DEFAULT_SUGGESTIONS): VocabularyWord[] {
  const { index } = useVocabulary();
  const { settings } = useSettings();
  // Ghép thành chuỗi để mảng cấp mới mỗi lần dựng không làm tính lại vô ích.
  const levelKey = (
    settings.activeLevels.length > 0 ? settings.activeLevels : index.levels
  ).join(',');

  return useMemo(() => {
    const wanted = levelKey.split(',');
    return index.words
      .filter((word) => wanted.includes(String(word.hskLevel)))
      .slice(0, count);
  }, [index.words, levelKey, count]);
}
