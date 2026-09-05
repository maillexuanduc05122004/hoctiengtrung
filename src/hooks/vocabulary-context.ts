import { createContext, useContext, useMemo } from 'react';
import type { HskLevel, Lesson, VocabularyWord } from '../types/vocabulary.ts';
import { EMPTY_INDEX, type VocabularyIndex } from '../lib/vocabulary/store.ts';
import { buildSearchIndex, type SearchIndex } from '../lib/vocabulary/search.ts';

export interface VocabularyContextValue {
  index: VocabularyIndex;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export const VocabularyContext = createContext<VocabularyContextValue>({
  index: EMPTY_INDEX,
  loading: true,
  error: null,
  reload: () => undefined,
});

export function useVocabulary(): VocabularyContextValue {
  return useContext(VocabularyContext);
}

/** Lấy các từ thuộc những cấp đang chọn, giữ nguyên thứ tự trong danh sách gốc. */
export function useWordsByLevels(levels: readonly HskLevel[]): VocabularyWord[] {
  const { index } = useVocabulary();
  const key = [...levels].sort().join(',');
  return useMemo(
    () => index.words.filter((word) => key.split(',').includes(String(word.hskLevel))),
    [index.words, key],
  );
}

/** Lấy các buổi học của một cấp. */
export function useLessons(level: HskLevel | 'all' = 'all'): Lesson[] {
  const { index } = useVocabulary();
  return useMemo(
    () => (level === 'all' ? index.lessons : index.lessons.filter((l) => l.level === level)),
    [index.lessons, level],
  );
}

/** Chỉ mục tìm kiếm, dựng lại chỉ khi bộ từ thay đổi. */
export function useSearchIndex(): SearchIndex {
  const { index } = useVocabulary();
  return useMemo(() => buildSearchIndex(index.words), [index.words]);
}
