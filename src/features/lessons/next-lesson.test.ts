import { describe, expect, it } from 'vitest';
import { pickNextLesson } from './next-lesson.ts';
import type { CardState } from '../../types/study.ts';
import type { Lesson } from '../../types/vocabulary.ts';

function lesson(index: number, wordIds: string[]): Lesson {
  return {
    id: `L1-B${String(index).padStart(2, '0')}`,
    level: 1,
    index,
    wordIds,
    range: { from: wordIds[0] ?? '', to: wordIds[wordIds.length - 1] ?? '' },
  };
}

/** Thẻ đã qua ít nhất một lượt ôn, tức là từ đó không còn mới. */
function studied(wordId: string): CardState {
  return {
    wordId,
    phase: 'review',
    stability: 3,
    difficulty: 5,
    reps: 1,
    lapses: 0,
    correctCount: 1,
    wrongCount: 0,
    lastReviewedAt: 1_000,
    dueAt: 2_000,
    learningStep: 0,
    starred: false,
    weakestMode: null,
    lastMistake: null,
  };
}

/** Thẻ chỉ được tạo ra vì người học bấm lưu từ: vẫn là từ mới. */
function savedOnly(wordId: string): CardState {
  return { ...studied(wordId), phase: 'new', reps: 0, correctCount: 0, starred: true };
}

function cardsOf(...wordIds: string[]): Map<string, CardState> {
  return new Map(wordIds.map((id) => [id, studied(id)]));
}

const LESSONS: Lesson[] = [
  lesson(1, ['a1', 'a2']),
  lesson(2, ['b1', 'b2']),
  lesson(3, ['c1', 'c2']),
  lesson(4, ['d1', 'd2']),
];

describe('pickNextLesson', () => {
  it('người mới bắt đầu từ buổi đầu tiên', () => {
    const next = pickNextLesson(LESSONS, new Map());

    expect(next).toMatchObject({ reason: 'chua-hoc', learned: 0, total: 2 });
    expect(next?.lesson.index).toBe(1);
  });

  it('trả về buổi dở dang có số LỚN NHẤT, tức là chỗ vừa rời đi', () => {
    // Bỏ dở buổi 1 từ lâu rồi tiến tới buổi 3: phải mời vào buổi 3.
    const cards = cardsOf('a1', 'b1', 'b2', 'c1');

    const next = pickNextLesson(LESSONS, cards);

    expect(next?.lesson.index).toBe(3);
    expect(next).toMatchObject({ reason: 'dang-do', learned: 1, total: 2 });
  });

  it('không có buổi dở nào thì lấy buổi chưa đụng tới đầu tiên', () => {
    const cards = cardsOf('a1', 'a2', 'b1', 'b2');

    const next = pickNextLesson(LESSONS, cards);

    expect(next?.lesson.index).toBe(3);
    expect(next?.reason).toBe('chua-hoc');
  });

  it('bỏ qua buổi đã học hết, kể cả khi nó nằm sau buổi đang dở', () => {
    const cards = cardsOf('a1', 'c1', 'c2', 'd1', 'd2');

    // Buổi 1 dở; buổi 3 và 4 đã xong; buổi 2 chưa đụng. Buổi dở thắng.
    expect(pickNextLesson(LESSONS, cards)?.lesson.index).toBe(1);
  });

  it('từ mới được lưu vào sổ tay vẫn là từ mới, không tính là đã học', () => {
    const cards = new Map([['a1', savedOnly('a1')]]);

    const next = pickNextLesson(LESSONS, cards);

    expect(next?.lesson.index).toBe(1);
    expect(next).toMatchObject({ reason: 'chua-hoc', learned: 0 });
  });

  it('học xong hết thì không còn buổi nào để mời', () => {
    const cards = cardsOf('a1', 'a2', 'b1', 'b2', 'c1', 'c2', 'd1', 'd2');

    expect(pickNextLesson(LESSONS, cards)).toBeNull();
  });

  it('danh sách rỗng thì trả về null chứ không ném lỗi', () => {
    expect(pickNextLesson([], new Map())).toBeNull();
  });

  it('bỏ qua buổi không có từ nào thay vì coi nó là đã xong', () => {
    const empty = lesson(9, []);

    expect(pickNextLesson([empty], new Map())).toBeNull();
  });
});
