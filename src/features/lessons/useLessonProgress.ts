/**
 * Tiến độ học của từng buổi.
 *
 * Trang danh sách hiển thị gần một trăm buổi cùng lúc, mỗi buổi khoảng mười từ.
 * Hỏi IndexedDB riêng cho từng buổi sẽ là gần một trăm lượt đọc chỉ để vẽ xong
 * một màn hình, nên ở đây gom hết mã từ của mọi buổi lại và đọc đúng một lần
 * bằng `getCards`, rồi mới chia kết quả về từng buổi trong bộ nhớ.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCards } from '../../db/index.ts';
import type { CardState } from '../../types/study.ts';
import type { Lesson } from '../../types/vocabulary.ts';

export interface LessonProgress {
  lessonId: string;
  total: number;
  /** Số từ đã rời khỏi giai đoạn 'new'. */
  learned: number;
  /** Số từ đã học và tới hạn ôn lại. */
  due: number;
  done: boolean;
}

export interface WordCardsState {
  cards: ReadonlyMap<string, CardState>;
  loading: boolean;
  /**
   * Mốc thời gian của lần đọc gần nhất. Dùng làm "bây giờ" khi so hạn ôn, để
   * phần vẽ không phải gọi `Date.now()` giữa lúc dựng giao diện.
   */
  readAt: number;
  reload: () => void;
}

export interface LessonProgressState {
  progress: Map<string, LessonProgress>;
  /** Thẻ thô của mọi từ trong các buổi, để bên gọi tự tính thêm mà khỏi đọc lại kho. */
  cards: ReadonlyMap<string, CardState>;
  loading: boolean;
  reload: () => void;
}

/**
 * Trạng thái học của một buổi, dùng cho nhãn và màu viền của thẻ buổi học.
 *
 * `review` tách khỏi `done` vì hai câu "đã xong" và "6 từ cần ôn" từng cùng
 * hiện trên một thẻ và nói ngược nhau. Học hết một buổi không có nghĩa là xong
 * với nó: lịch ôn còn kéo dài nhiều tháng sau đó.
 */
export type LessonStatus = 'new' | 'doing' | 'review' | 'done';

/** Kết quả một lần đọc, gắn với khoá yêu cầu đã sinh ra nó. */
interface LoadedCards {
  key: string;
  cards: ReadonlyMap<string, CardState>;
  at: number;
}

const EMPTY_CARDS: ReadonlyMap<string, CardState> = new Map<string, CardState>();

/**
 * Một từ tính là đã học khi thẻ của nó đã qua ít nhất một lượt ôn. Thẻ chỉ mới
 * được tạo ra vì người học bấm lưu từ thì vẫn là từ mới, nên không bị tính nhầm.
 *
 * Điều kiện này lặp lại đúng `isUnstudied` trong db/cards.ts — cùng một phép thử
 * quyết định "từ này còn mới hay không" ở hàng đợi học, ở tiến độ buổi và ở
 * trang Tiến độ, nên ba nơi không được phép định nghĩa khác nhau.
 */
export function isLearned(card: CardState | undefined): boolean {
  return card !== undefined && !(card.reps === 0 && card.phase === 'new');
}

/** Từ đã học và đã tới hạn ôn lại tính đến thời điểm `now`. */
export function isDue(card: CardState | undefined, now: number): boolean {
  return card !== undefined && card.phase !== 'new' && card.dueAt <= now;
}

export function lessonStatus(progress: LessonProgress | undefined): LessonStatus {
  if (!progress || progress.learned === 0) return 'new';
  if (!progress.done) return 'doing';
  return progress.due > 0 ? 'review' : 'done';
}

/**
 * Đọc trạng thái thẻ của một tập từ.
 *
 * Bên gọi thường dựng mảng mã từ mới sau mỗi lần vẽ lại, nên hiệu ứng phụ thuộc
 * vào chuỗi khoá ghép từ các mã chứ không phụ thuộc vào chính mảng: mảng mới mà
 * nội dung cũ thì không phải đọc lại IndexedDB.
 *
 * Trạng thái "đang đọc" được suy ra bằng cách so khoá yêu cầu với khoá của kết
 * quả đã có, thay vì gọi setState ngay trong thân effect: cách này tránh một
 * lượt vẽ thừa mỗi lần đổi buổi học.
 */
export function useWordCards(wordIds: readonly string[]): WordCardsState {
  const [loaded, setLoaded] = useState<LoadedCards | null>(null);
  const [attempt, setAttempt] = useState(0);

  const signature = useMemo(() => wordIds.join('|'), [wordIds]);
  const requestKey = `${attempt}|${signature}`;

  useEffect(() => {
    let cancelled = false;
    const ids = signature === '' ? [] : signature.split('|');
    getCards(ids).then(
      (found) => {
        if (!cancelled) setLoaded({ key: requestKey, cards: found, at: Date.now() });
      },
      () => {
        // Không đọc được kho cục bộ thì coi như chưa học từ nào: người học vẫn
        // mở được buổi học thay vì gặp một trang trắng.
        if (!cancelled) setLoaded({ key: requestKey, cards: EMPTY_CARDS, at: Date.now() });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [signature, requestKey]);

  const reload = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  const ready = loaded !== null && loaded.key === requestKey;
  return {
    cards: ready ? loaded.cards : EMPTY_CARDS,
    loading: !ready,
    readAt: ready ? loaded.at : 0,
    reload,
  };
}

export function useLessonProgress(lessons: readonly Lesson[]): LessonProgressState {
  const wordIds = useMemo(() => lessons.flatMap((lesson) => lesson.wordIds), [lessons]);
  const { cards, loading, readAt, reload } = useWordCards(wordIds);

  const progress = useMemo(() => {
    const map = new Map<string, LessonProgress>();
    for (const lesson of lessons) {
      let learned = 0;
      let due = 0;
      for (const wordId of lesson.wordIds) {
        const card = cards.get(wordId);
        if (isLearned(card)) learned += 1;
        if (isDue(card, readAt)) due += 1;
      }
      const total = lesson.wordIds.length;
      map.set(lesson.id, {
        lessonId: lesson.id,
        total,
        learned,
        due,
        done: total > 0 && learned === total,
      });
    }
    return map;
  }, [lessons, cards, readAt]);

  return { progress, cards, loading, reload };
}
