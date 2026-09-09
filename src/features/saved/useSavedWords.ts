/**
 * Sổ tay từ vựng.
 *
 * Đọc thẳng từ kho bằng liveQuery của Dexie nên lưu một từ ở bất kỳ đâu — giữa
 * giờ học, trong hộp tra từ, ở trang buổi học — thì sổ tay đang mở cũng đổi
 * theo ngay, không cần màn hình nào báo cho màn hình nào.
 *
 * Từ nào không còn trong bộ từ đang nạp thì bỏ qua chứ không hiện dòng trống:
 * bộ dữ liệu có thể đổi mã từ giữa hai phiên bản.
 */
import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getStarredCards } from '../../db/index.ts';
import { useVocabulary } from '../../hooks/vocabulary-context.ts';
import type { CardState } from '../../types/study.ts';
import type { HskLevel, VocabularyWord } from '../../types/vocabulary.ts';

export interface SavedWord {
  word: VocabularyWord;
  card: CardState;
}

/** Cách sắp xếp sổ tay. Mặc định là mới lưu trước, đúng thứ tự người học nghĩ tới. */
export type SavedSort = 'moi-luu' | 'can-on' | 'theo-cap';

export interface SavedWordsState {
  /** Toàn bộ từ đã lưu, đã sắp theo `sort`. */
  words: SavedWord[];
  /** Số từ đã lưu ở từng cấp, để viết số lên nhãn bộ lọc. */
  byLevel: Map<HskLevel, number>;
  /** Tổng số dòng trong kho, kể cả từ không còn trong bộ dữ liệu. */
  total: number;
  loading: boolean;
  /** Thời điểm đọc, dùng làm "bây giờ" khi so hạn ôn. */
  readAt: number;
}

export interface UseSavedWordsOptions {
  level?: HskLevel | 'all';
  sort?: SavedSort;
}

export function useSavedWords(options: UseSavedWordsOptions = {}): SavedWordsState {
  const { level = 'all', sort = 'moi-luu' } = options;
  const { index } = useVocabulary();
  const loaded = useLiveQuery(async () => {
    const cards = await getStarredCards();
    // Mốc đọc chốt một lần ở đây để phần vẽ không phải gọi Date.now() giữa lúc
    // dựng giao diện, giống cách tiến độ buổi học đang làm.
    return { cards, at: Date.now() };
  }, []);

  const all = useMemo<SavedWord[]>(() => {
    if (loaded === undefined) return [];
    return loaded.cards.flatMap((card) => {
      const word = index.byId.get(card.wordId);
      return word === undefined ? [] : [{ word, card }];
    });
  }, [loaded, index.byId]);

  const byLevel = useMemo(() => {
    const counts = new Map<HskLevel, number>();
    for (const item of all) {
      counts.set(item.word.hskLevel, (counts.get(item.word.hskLevel) ?? 0) + 1);
    }
    return counts;
  }, [all]);

  const readAt = loaded?.at ?? 0;

  const words = useMemo(() => {
    const filtered = level === 'all' ? all : all.filter((item) => item.word.hskLevel === level);
    if (sort === 'moi-luu') return filtered;
    const sorted = [...filtered];
    if (sort === 'theo-cap') {
      sorted.sort(
        (a, b) => a.word.hskLevel - b.word.hskLevel || a.word.id.localeCompare(b.word.id),
      );
      return sorted;
    }
    // 'can-on': từ tới hạn lâu nhất lên trước, từ chưa học xếp cuối vì chúng
    // chưa có hạn ôn nào để so.
    sorted.sort((a, b) => {
      const dueA = a.card.reps === 0 ? Number.POSITIVE_INFINITY : a.card.dueAt;
      const dueB = b.card.reps === 0 ? Number.POSITIVE_INFINITY : b.card.dueAt;
      return dueA - dueB || a.word.id.localeCompare(b.word.id);
    });
    return sorted;
  }, [all, level, sort]);

  return {
    words,
    byLevel,
    total: loaded?.cards.length ?? 0,
    loading: loaded === undefined,
    readAt,
  };
}
