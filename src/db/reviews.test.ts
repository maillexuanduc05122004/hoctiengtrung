import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db, resetDatabase } from './database.ts';
import {
  countByMode,
  dayKey,
  getDailyStat,
  getRecentDays,
  getStreak,
  recordReview,
  shiftDay,
} from './reviews.ts';
import type { ReviewLogEntry, StudyMode } from '../types/study.ts';

interface ReviewOverrides {
  wordId?: string;
  mode?: StudyMode;
  day?: string;
  verdict?: ReviewLogEntry['verdict'];
  elapsedMs?: number;
  at?: number;
}

function review(overrides: ReviewOverrides = {}): Omit<ReviewLogEntry, 'id'> {
  const day = overrides.day ?? '2026-03-10';
  return {
    wordId: overrides.wordId ?? 'L1-0001',
    mode: overrides.mode ?? 'flashcards',
    rating: 3,
    verdict: overrides.verdict ?? 'correct',
    usedHint: false,
    at: overrides.at ?? new Date(`${day}T08:00:00`).getTime(),
    day,
    elapsedMs: overrides.elapsedMs ?? 1500,
  };
}

beforeEach(async () => {
  await resetDatabase();
});

describe('dayKey', () => {
  it('trả về ngày theo giờ địa phương', () => {
    expect(dayKey(new Date(2026, 2, 10, 13, 45).getTime())).toBe('2026-03-10');
  });

  it('không lệch ngày vào lúc rạng sáng, thời điểm toISOString hay tính sai', () => {
    expect(dayKey(new Date(2026, 2, 10, 0, 5).getTime())).toBe('2026-03-10');
    expect(dayKey(new Date(2026, 2, 10, 23, 55).getTime())).toBe('2026-03-10');
  });

  it('đệm số 0 cho tháng và ngày một chữ số', () => {
    expect(dayKey(new Date(2026, 0, 2, 12, 0).getTime())).toBe('2026-01-02');
  });
});

describe('shiftDay', () => {
  it('lùi qua ranh giới tháng và năm', () => {
    expect(shiftDay('2026-03-01', -1)).toBe('2026-02-28');
    expect(shiftDay('2026-01-01', -1)).toBe('2025-12-31');
    expect(shiftDay('2024-02-28', 1)).toBe('2024-02-29');
  });

  it('báo lỗi khi chuỗi ngày sai định dạng', () => {
    expect(() => shiftDay('10/03/2026', -1)).toThrow(/Ngày không hợp lệ/);
  });
});

describe('người dùng mới', () => {
  it('chưa có lượt ôn nào', async () => {
    expect(await db.reviews.count()).toBe(0);
    expect(await getDailyStat('2026-03-10')).toBeUndefined();
    expect(await getStreak('2026-03-10')).toBe(0);
    expect(await countByMode('L1-0001')).toEqual({
      flashcards: { total: 0, wrong: 0 },
      typing: { total: 0, wrong: 0 },
      listening: { total: 0, wrong: 0 },
      speaking: { total: 0, wrong: 0 },
    });
  });

  it('getRecentDays vẫn trả đủ số ngày với toàn số 0', async () => {
    const days = await getRecentDays('2026-03-10', 3);

    expect(days).toEqual([
      { day: '2026-03-08', reviews: 0, correct: 0, newWords: 0, studyMs: 0 },
      { day: '2026-03-09', reviews: 0, correct: 0, newWords: 0, studyMs: 0 },
      { day: '2026-03-10', reviews: 0, correct: 0, newWords: 0, studyMs: 0 },
    ]);
  });
});

describe('recordReview', () => {
  it('ghi nhật ký và tạo thống kê ngày', async () => {
    await recordReview(review({ elapsedMs: 2000 }));

    expect(await db.reviews.count()).toBe(1);
    expect(await getDailyStat('2026-03-10')).toEqual({
      day: '2026-03-10',
      reviews: 1,
      correct: 1,
      newWords: 1,
      studyMs: 2000,
    });
  });

  it('cộng dồn nhiều lượt trong cùng một ngày', async () => {
    await recordReview(review({ wordId: 'L1-0001', elapsedMs: 1000 }));
    await recordReview(review({ wordId: 'L1-0002', verdict: 'wrong', elapsedMs: 2500 }));
    await recordReview(review({ wordId: 'L1-0002', verdict: 'close', elapsedMs: 500 }));

    expect(await getDailyStat('2026-03-10')).toEqual({
      day: '2026-03-10',
      reviews: 3,
      correct: 1,
      newWords: 2,
      studyMs: 4000,
    });
  });

  it('chỉ đếm từ mới ở lượt đầu tiên của từ đó', async () => {
    await recordReview(review({ wordId: 'L1-0001', day: '2026-03-10' }));
    await recordReview(review({ wordId: 'L1-0001', day: '2026-03-11' }));

    expect((await getDailyStat('2026-03-10'))?.newWords).toBe(1);
    expect((await getDailyStat('2026-03-11'))?.newWords).toBe(0);
  });

  it('tách thống kê theo từng ngày', async () => {
    await recordReview(review({ day: '2026-03-09' }));
    await recordReview(review({ day: '2026-03-10' }));

    expect((await getDailyStat('2026-03-09'))?.reviews).toBe(1);
    expect((await getDailyStat('2026-03-10'))?.reviews).toBe(1);
  });

  it('bỏ qua thời gian trả lời vô lý thay vì làm hỏng thống kê', async () => {
    await recordReview(review({ elapsedMs: Number.NaN }));

    expect((await getDailyStat('2026-03-10'))?.studyMs).toBe(0);
  });

  it('tự suy ra ngày từ mốc thời gian khi trường day sai định dạng', async () => {
    const at = new Date(2026, 2, 12, 9, 30).getTime();
    await recordReview({ ...review({ at }), day: '' });

    expect((await getDailyStat('2026-03-12'))?.reviews).toBe(1);
  });

  it('không cộng thời gian âm vào tổng thời gian học', async () => {
    await recordReview(review({ elapsedMs: -5000 }));

    expect((await getDailyStat('2026-03-10'))?.studyMs).toBe(0);
  });

  it('không để Infinity làm hỏng tổng thời gian học', async () => {
    await recordReview(review({ elapsedMs: Number.POSITIVE_INFINITY }));

    expect((await getDailyStat('2026-03-10'))?.studyMs).toBe(0);
  });

  // Cả day lẫn at cùng hỏng thì dayKey(at) ra "NaN-NaN-NaN", một khoá không bao giờ xoá được.
  it('không tạo khoá ngày rác khi cả day lẫn at đều hỏng', async () => {
    await recordReview({ ...review({ at: Number.NaN }), day: '' });
    await recordReview({ ...review({ at: Number.POSITIVE_INFINITY }), day: 'hôm nay' });

    const keys = await db.dailyStats.toCollection().primaryKeys();

    expect(keys).toHaveLength(1);
    expect(keys.every((key) => /^\d{4}-\d{2}-\d{2}$/.test(String(key)))).toBe(true);
  });

  it('không gắn id vào đối tượng của bên gọi', async () => {
    const entry = review();

    await recordReview(entry);

    expect('id' in entry).toBe(false);
  });

  it('không mất lượt nào khi nhiều lượt được ghi cùng lúc', async () => {
    await Promise.all([
      recordReview(review({ wordId: 'L1-0001' })),
      recordReview(review({ wordId: 'L1-0002' })),
      recordReview(review({ wordId: 'L1-0003' })),
    ]);

    expect(await getDailyStat('2026-03-10')).toMatchObject({ reviews: 3, newWords: 3 });
  });
});

describe('getRecentDays', () => {
  it('trả đủ số ngày yêu cầu, cũ trước mới sau, ngày trống là 0', async () => {
    await recordReview(review({ day: '2026-03-08', elapsedMs: 1000 }));
    await recordReview(review({ wordId: 'L1-0002', day: '2026-03-10', elapsedMs: 3000 }));

    const days = await getRecentDays('2026-03-10', 4);

    expect(days.map((stat) => stat.day)).toEqual([
      '2026-03-07',
      '2026-03-08',
      '2026-03-09',
      '2026-03-10',
    ]);
    expect(days.map((stat) => stat.reviews)).toEqual([0, 1, 0, 1]);
    expect(days.map((stat) => stat.studyMs)).toEqual([0, 1000, 0, 3000]);
  });

  it('trả rỗng khi số ngày không dương', async () => {
    expect(await getRecentDays('2026-03-10', 0)).toEqual([]);
  });
});

describe('getStreak', () => {
  it('ba ngày học liên tiếp trả về 3', async () => {
    await recordReview(review({ day: '2026-03-08' }));
    await recordReview(review({ wordId: 'L1-0002', day: '2026-03-09' }));
    await recordReview(review({ wordId: 'L1-0003', day: '2026-03-10' }));

    expect(await getStreak('2026-03-10')).toBe(3);
  });

  it('ngày trống ở giữa làm đứt chuỗi', async () => {
    await recordReview(review({ day: '2026-03-06' }));
    await recordReview(review({ wordId: 'L1-0002', day: '2026-03-09' }));
    await recordReview(review({ wordId: 'L1-0003', day: '2026-03-10' }));

    expect(await getStreak('2026-03-10')).toBe(2);
  });

  it('hôm nay chưa học thì vẫn tính chuỗi tới hôm qua', async () => {
    await recordReview(review({ day: '2026-03-08' }));
    await recordReview(review({ wordId: 'L1-0002', day: '2026-03-09' }));

    expect(await getStreak('2026-03-10')).toBe(2);
  });

  it('nghỉ hai ngày liền thì chuỗi về 0', async () => {
    await recordReview(review({ day: '2026-03-08' }));

    expect(await getStreak('2026-03-10')).toBe(0);
  });

  it('không tính các ngày nằm sau today', async () => {
    await recordReview(review({ day: '2026-03-11' }));
    await recordReview(review({ wordId: 'L1-0002', day: '2026-03-12' }));

    expect(await getStreak('2026-03-10')).toBe(0);
  });
});

describe('countByMode', () => {
  it('đếm tổng số lượt và số lần sai theo từng chế độ', async () => {
    await recordReview(review({ mode: 'typing', verdict: 'wrong' }));
    await recordReview(review({ mode: 'typing', verdict: 'correct' }));
    await recordReview(review({ mode: 'listening', verdict: 'wrong' }));
    await recordReview(review({ mode: 'typing', wordId: 'L1-0002', verdict: 'wrong' }));

    expect(await countByMode('L1-0001')).toEqual({
      flashcards: { total: 0, wrong: 0 },
      typing: { total: 2, wrong: 1 },
      listening: { total: 1, wrong: 1 },
      speaking: { total: 0, wrong: 0 },
    });
  });

  it('không tính câu gần đúng là sai', async () => {
    await recordReview(review({ mode: 'speaking', verdict: 'close' }));

    expect((await countByMode('L1-0001')).speaking).toEqual({ total: 1, wrong: 0 });
  });

  // Một bản PWA cũ còn trong cache có thể đã ghi chế độ nay không còn nữa.
  it('bỏ qua chế độ lạ trong nhật ký thay vì ném lỗi', async () => {
    const rogue = { ...review(), mode: 'karaoke' } as unknown as ReviewLogEntry;
    await db.reviews.add(rogue);
    await recordReview(review({ mode: 'typing' }));

    expect(await countByMode('L1-0001')).toEqual({
      flashcards: { total: 0, wrong: 0 },
      typing: { total: 1, wrong: 0 },
      listening: { total: 0, wrong: 0 },
      speaking: { total: 0, wrong: 0 },
    });
  });
});
