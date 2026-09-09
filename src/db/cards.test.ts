import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  countLearnedByWordIds,
  countStarred,
  getCard,
  getCards,
  getDueCards,
  getNewWordIds,
  getStarredCards,
  getStarredWordIds,
  getTroubleWords,
  saveCard,
  setStar,
  toggleStar,
} from './cards.ts';
import { db, resetDatabase } from './database.ts';
import type { CardState } from '../types/study.ts';

/** Thẻ đã qua ít nhất một lượt ôn, tức là không còn là từ mới. */
function studiedCard(wordId: string, overrides: Partial<CardState> = {}): CardState {
  return {
    wordId,
    phase: 'review',
    stability: 3.2,
    difficulty: 5.1,
    reps: 2,
    lapses: 0,
    correctCount: 2,
    wrongCount: 0,
    lastReviewedAt: 1_700_000_000_000,
    dueAt: 1_700_100_000_000,
    learningStep: 0,
    starred: false,
    weakestMode: null,
    lastMistake: null,
    ...overrides,
  };
}

const ALL = ['L1-0001', 'L1-0002', 'L1-0003', 'L1-0004'];

beforeEach(async () => {
  await resetDatabase();
});

describe('người dùng mới', () => {
  it('không có bản ghi nào nên mọi truy vấn đều rỗng', async () => {
    expect(await getCard('L1-0001')).toBeUndefined();
    expect(await getCards(ALL)).toEqual(new Map());
    expect(await getDueCards(ALL, Date.now(), 20)).toEqual([]);
    expect(await getStarredWordIds(ALL)).toEqual([]);
    expect(await getTroubleWords(ALL, 10)).toEqual([]);
    expect(await countLearnedByWordIds(ALL)).toBe(0);
    expect(await db.cards.count()).toBe(0);
  });

  it('coi mọi từ là từ mới', async () => {
    expect(await getNewWordIds(ALL, 10)).toEqual(ALL);
  });
});

describe('saveCard và getCard', () => {
  it('đọc lại giữ nguyên mọi trường', async () => {
    const card = studiedCard('L1-0007', {
      phase: 'relearning',
      lapses: 3,
      wrongCount: 4,
      learningStep: 1,
      starred: true,
      weakestMode: 'listening',
      lastMistake: {
        mode: 'typing',
        at: 1_700_000_500_000,
        given: 'hao',
        expected: 'hǎo',
        verdict: 'close',
      },
    });

    await saveCard(card);

    expect(await getCard('L1-0007')).toEqual(card);
  });

  it('lưu lại lần nữa thì ghi đè chứ không nhân đôi', async () => {
    await saveCard(studiedCard('L1-0007', { reps: 1 }));
    await saveCard(studiedCard('L1-0007', { reps: 9 }));

    expect(await db.cards.count()).toBe(1);
    expect((await getCard('L1-0007'))?.reps).toBe(9);
  });
});

describe('getCards', () => {
  it('chỉ trả về những từ đã có bản ghi', async () => {
    await saveCard(studiedCard('L1-0001'));
    await saveCard(studiedCard('L1-0003'));

    const found = await getCards(ALL);

    expect([...found.keys()]).toEqual(['L1-0001', 'L1-0003']);
    expect(found.get('L1-0001')?.wordId).toBe('L1-0001');
  });

  it('trả map rỗng khi danh sách đầu vào rỗng', async () => {
    expect(await getCards([])).toEqual(new Map());
  });
});

describe('getDueCards', () => {
  const now = 1_000_000;

  beforeEach(async () => {
    await saveCard(studiedCard('L1-0001', { dueAt: now - 3000 }));
    await saveCard(studiedCard('L1-0002', { dueAt: now - 1000 }));
    await saveCard(studiedCard('L1-0003', { dueAt: now }));
    await saveCard(studiedCard('L1-0004', { dueAt: now + 1 }));
  });

  it('chỉ lấy từ tới hạn và sắp theo dueAt tăng dần', async () => {
    const due = await getDueCards(ALL, now, 10);

    expect(due.map((card) => card.wordId)).toEqual(['L1-0001', 'L1-0002', 'L1-0003']);
  });

  it('tôn trọng limit và vẫn ưu tiên từ tới hạn sớm nhất', async () => {
    const due = await getDueCards(ALL, now, 2);

    expect(due.map((card) => card.wordId)).toEqual(['L1-0001', 'L1-0002']);
  });

  it('bỏ qua từ ngoài tập wordIds được lọc', async () => {
    const due = await getDueCards(['L1-0002'], now, 10);

    expect(due.map((card) => card.wordId)).toEqual(['L1-0002']);
  });

  it('không tính thẻ chưa từng học dù dueAt bằng 0', async () => {
    await toggleStar('L1-0009');

    const due = await getDueCards([...ALL, 'L1-0009'], now, 10);

    expect(due.map((card) => card.wordId)).not.toContain('L1-0009');
  });

  it('trả rỗng khi limit không dương', async () => {
    expect(await getDueCards(ALL, now, 0)).toEqual([]);
  });

  // Nếu Dexie cắt limit trước khi lọc thì truy vấn này trả rỗng.
  it('cắt limit sau khi lọc chứ không phải trước', async () => {
    const due = await getDueCards(['L1-0003'], now, 1);

    expect(due.map((card) => card.wordId)).toEqual(['L1-0003']);
  });
});

describe('getNewWordIds', () => {
  it('chỉ trả về từ chưa có bản ghi, giữ nguyên thứ tự đầu vào', async () => {
    await saveCard(studiedCard('L1-0002'));

    expect(await getNewWordIds(ALL, 10)).toEqual(['L1-0001', 'L1-0003', 'L1-0004']);
  });

  it('cắt theo limit', async () => {
    expect(await getNewWordIds(ALL, 2)).toEqual(['L1-0001', 'L1-0002']);
  });

  it('từ mới chỉ được đánh dấu sao thì vẫn là từ mới', async () => {
    await toggleStar('L1-0002');

    expect(await getNewWordIds(ALL, 10)).toEqual(ALL);
  });
});

describe('toggleStar và getStarredWordIds', () => {
  it('bật rồi tắt được', async () => {
    expect(await toggleStar('L1-0002')).toBe(true);
    expect(await getStarredWordIds(ALL)).toEqual(['L1-0002']);

    expect(await toggleStar('L1-0002')).toBe(false);
    expect(await getStarredWordIds(ALL)).toEqual([]);
  });

  it('không làm mất tiến độ của thẻ đang học', async () => {
    await saveCard(studiedCard('L1-0001', { reps: 5, stability: 12.5 }));

    await toggleStar('L1-0001');
    const card = await getCard('L1-0001');

    expect(card?.starred).toBe(true);
    expect(card?.reps).toBe(5);
    expect(card?.stability).toBe(12.5);
  });

  it('chỉ trả về từ có sao trong tập được hỏi', async () => {
    await toggleStar('L1-0001');
    await toggleStar('L1-0009');

    expect(await getStarredWordIds(ALL)).toEqual(['L1-0001']);
  });
});

describe('sổ tay từ vựng', () => {
  it('xếp từ mới lưu lên đầu', async () => {
    await toggleStar('L1-0001', { at: 1_000 });
    await toggleStar('L1-0002', { at: 3_000 });
    await toggleStar('L1-0003', { at: 2_000 });

    expect((await getStarredCards()).map((card) => card.wordId)).toEqual([
      'L1-0002',
      'L1-0003',
      'L1-0001',
    ]);
  });

  it('đọc cả bảng nên thấy cả từ ngoài các cấp đang chọn', async () => {
    await toggleStar('L3-0900', { at: 1_000 });

    expect((await getStarredCards()).map((card) => card.wordId)).toEqual(['L3-0900']);
    expect(await countStarred()).toBe(1);
  });

  it('bỏ lưu rồi lưu lại thì từ đó nhảy lên đầu, không giữ chỗ cũ', async () => {
    await toggleStar('L1-0001', { at: 1_000 });
    await toggleStar('L1-0002', { at: 2_000 });

    await toggleStar('L1-0001', { at: 3_000 });
    expect(await countStarred()).toBe(1);

    await toggleStar('L1-0001', { at: 4_000 });

    expect((await getStarredCards()).map((card) => card.wordId)).toEqual(['L1-0001', 'L1-0002']);
  });

  it('bỏ lưu thì xoá luôn mốc lưu', async () => {
    await toggleStar('L1-0001', { at: 1_000 });
    await toggleStar('L1-0001', { at: 2_000 });

    expect((await getCard('L1-0001'))?.starredAt).toBeUndefined();
  });

  it('thẻ lưu từ trước khi có mốc lưu bị xếp xuống cuối chứ không lên đầu', async () => {
    await saveCard(studiedCard('L1-0004', { starred: true }));
    await toggleStar('L1-0001', { at: 1_000 });

    expect((await getStarredCards()).map((card) => card.wordId)).toEqual(['L1-0001', 'L1-0004']);
  });

  it('setStar ghi thẳng trạng thái, gọi lại nhiều lần vẫn ra một kết quả', async () => {
    expect(await setStar('L1-0001', true, { at: 1_000 })).toBe(true);
    expect(await setStar('L1-0001', true, { at: 2_000 })).toBe(true);

    expect(await countStarred()).toBe(1);
    expect((await getCard('L1-0001'))?.starredAt).toBe(2_000);

    expect(await setStar('L1-0001', false)).toBe(false);
    expect(await countStarred()).toBe(0);
  });

  it('lưu một từ chưa học không biến nó thành từ đã học', async () => {
    await toggleStar('L1-0001', { at: 1_000 });

    expect(await getNewWordIds(ALL, 10)).toContain('L1-0001');
    expect(await countLearnedByWordIds(ALL)).toBe(0);
  });
});

describe('getTroubleWords', () => {
  it('sắp giảm dần theo số lần sai và bỏ qua từ chưa sai lần nào', async () => {
    await saveCard(studiedCard('L1-0001', { wrongCount: 1 }));
    await saveCard(studiedCard('L1-0002', { wrongCount: 7 }));
    await saveCard(studiedCard('L1-0003', { wrongCount: 0 }));
    await saveCard(studiedCard('L1-0004', { wrongCount: 3 }));

    const trouble = await getTroubleWords(ALL, 10);

    expect(trouble.map((card) => card.wordId)).toEqual(['L1-0002', 'L1-0004', 'L1-0001']);
  });

  it('tôn trọng limit', async () => {
    await saveCard(studiedCard('L1-0001', { wrongCount: 1 }));
    await saveCard(studiedCard('L1-0002', { wrongCount: 7 }));

    expect((await getTroubleWords(ALL, 1)).map((card) => card.wordId)).toEqual(['L1-0002']);
  });
});

describe('countLearnedByWordIds', () => {
  it('đếm thẻ đã qua ít nhất một lượt ôn', async () => {
    await saveCard(studiedCard('L1-0001'));
    await saveCard(studiedCard('L1-0002', { phase: 'learning', reps: 1 }));
    await toggleStar('L1-0003');

    expect(await countLearnedByWordIds(ALL)).toBe(2);
  });
});

describe('danh sách đầu vào có id lặp lại', () => {
  const TWICE = ['L1-0001', 'L1-0002', 'L1-0001'];

  it('getNewWordIds không đưa cùng một từ vào hàng đợi hai lần', async () => {
    expect(await getNewWordIds(TWICE, 10)).toEqual(['L1-0001', 'L1-0002']);
  });

  it('countLearnedByWordIds không đếm một từ thành hai', async () => {
    await saveCard(studiedCard('L1-0001'));

    expect(await countLearnedByWordIds(TWICE)).toBe(1);
  });

  it('getStarredWordIds không trả về bản trùng', async () => {
    await toggleStar('L1-0001');

    expect(await getStarredWordIds(TWICE)).toEqual(['L1-0001']);
  });

  it('getTroubleWords không trả về bản trùng', async () => {
    await saveCard(studiedCard('L1-0001', { wrongCount: 2 }));

    expect((await getTroubleWords(TWICE, 10)).map((card) => card.wordId)).toEqual(['L1-0001']);
  });
});

describe('không sửa đối tượng của bên gọi', () => {
  it('saveCard giữ nguyên thẻ được truyền vào', async () => {
    const card = studiedCard('L1-0001');
    const before = JSON.stringify(card);

    await saveCard(card);

    expect(JSON.stringify(card)).toBe(before);
  });
});
