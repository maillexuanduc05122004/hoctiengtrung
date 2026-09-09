import 'fake-indexeddb/auto';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';
import { useStudySession } from './useStudySession.ts';
import { SettingsContext } from './settings-context.ts';
import { VocabularyContext } from './vocabulary-context.ts';
import { buildIndex } from '../lib/vocabulary/store.ts';
import { db, getCard, getRecentDays, resetDatabase, saveCard, toggleStar } from '../db/index.ts';
import { DEFAULT_SETTINGS } from '../types/settings.ts';
import type { CardState } from '../types/study.ts';
import type { HskLevel, LevelDataFile, VocabularyWord } from '../types/vocabulary.ts';

function makeWord(index: number, level: HskLevel = 1): VocabularyWord {
  const id = `L${level}-${String(index).padStart(4, '0')}`;
  return {
    id,
    simplified: `字${index}`,
    pinyin: 'zì',
    pinyinPlain: 'zi',
    hskLevel: level,
    meanings: { vi: [`nghĩa ${index}`], en: [`meaning ${index}`] },
    aliases: { vi: [], en: [], pinyin: [] },
    examples: [{ zh: `这是字${index}。`, pinyin: 'zhè shì', vi: 'Đây là.', en: 'This is.' }],
    source: 'kiểm thử',
    datasetVersion: '1.0.0',
    translationStatus: 'machine',
    lessonId: `L${level}-B01`,
  };
}

const WORDS = Array.from({ length: 12 }, (_, i) => makeWord(i + 1));

const FILE: LevelDataFile = {
  level: 1,
  datasetVersion: '1.0.0',
  words: WORDS,
  lessons: [
    {
      id: 'L1-B01',
      level: 1,
      index: 1,
      wordIds: WORDS.slice(0, 10).map((w) => w.id),
      range: { from: WORDS[0].simplified, to: WORDS[9].simplified },
    },
  ],
};

const index = buildIndex([FILE]);

function wrapper({ children }: { children: ReactNode }) {
  return (
    <SettingsContext.Provider
      value={{
        settings: DEFAULT_SETTINGS,
        loading: false,
        update: async () => undefined,
        resolvedTheme: 'light',
      }}
    >
      <VocabularyContext.Provider
        value={{ index, loading: false, error: null, reload: () => undefined }}
      >
        {children}
      </VocabularyContext.Provider>
    </SettingsContext.Provider>
  );
}

function renderSession(pool: 'new' | 'due' | 'lesson' | 'starred' | 'mixed', limit = 5) {
  return renderHook(
    () => useStudySession({ mode: 'flashcards', levels: [1], pool, lessonId: 'L1-B01', limit }),
    { wrapper },
  );
}

describe('useStudySession', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('người học mới nhận được toàn từ mới', async () => {
    const { result } = renderSession('new');
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.queue).toHaveLength(5);
    expect(result.current.current?.id).toBe('L1-0001');
    expect(result.current.stats.total).toBe(5);
    expect(result.current.stats.done).toBe(0);
  });

  it('người học mới chưa có từ nào tới hạn ôn', async () => {
    const { result } = renderSession('due');
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.queue).toEqual([]);
  });

  it('ghi lại kết quả rồi chuyển sang từ kế tiếp', async () => {
    const { result } = renderSession('new');
    await waitFor(() => expect(result.current.loading).toBe(false));
    const first = result.current.current;
    expect(first).not.toBeNull();

    await act(async () => {
      await result.current.submit({
        verdict: 'correct',
        usedHint: false,
        given: 'zì',
        expected: 'zì',
        elapsedMs: 1200,
      });
    });

    expect(result.current.index).toBe(1);
    expect(result.current.stats.done).toBe(1);
    expect(result.current.stats.correct).toBe(1);
    expect(result.current.current?.id).not.toBe(first?.id);

    const card = await getCard(first!.id);
    expect(card).toBeDefined();
    expect(card?.reps).toBe(1);
    expect(card?.correctCount).toBe(1);
    expect(card?.phase).not.toBe('new');
  });

  it('câu sai được lưu kèm nội dung đã nhập để nhắc lại lần sau', async () => {
    const { result } = renderSession('new');
    await waitFor(() => expect(result.current.loading).toBe(false));
    const word = result.current.current!;

    await act(async () => {
      await result.current.submit({
        verdict: 'wrong',
        usedHint: false,
        given: 'sai rồi',
        expected: 'zì',
        elapsedMs: 900,
      });
    });

    const card = await getCard(word.id);
    expect(card?.wrongCount).toBe(1);
    expect(card?.lastMistake?.given).toBe('sai rồi');
    expect(card?.lastMistake?.mode).toBe('flashcards');
    expect(card?.weakestMode).toBe('flashcards');
  });

  it('đếm riêng câu gần đúng và câu đã dùng gợi ý', async () => {
    const { result } = renderSession('new');
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.submit({
        verdict: 'close',
        usedHint: true,
        given: 'zi',
        expected: 'zì',
        elapsedMs: 800,
      });
    });

    expect(result.current.stats.close).toBe(1);
    expect(result.current.stats.hinted).toBe(1);
    expect(result.current.stats.correct).toBe(0);
  });

  it('nhật ký ôn tập được ghi vào thống kê ngày', async () => {
    const { result } = renderSession('new', 2);
    await waitFor(() => expect(result.current.loading).toBe(false));

    for (let i = 0; i < 2; i++) {
      await act(async () => {
        await result.current.submit({
          verdict: i === 0 ? 'correct' : 'wrong',
          usedHint: false,
          given: 'zì',
          expected: 'zì',
          elapsedMs: 1000,
        });
      });
    }

    const reviews = await db.reviews.toArray();
    expect(reviews).toHaveLength(2);
    const today = await getRecentDays(reviews[0].day, 1);
    expect(today[0].reviews).toBe(2);
    expect(today[0].correct).toBe(1);
    expect(today[0].newWords).toBe(2);
  });

  it('kết thúc phiên khi đã trả lời hết hàng đợi', async () => {
    const { result } = renderSession('new', 2);
    await waitFor(() => expect(result.current.loading).toBe(false));

    for (let i = 0; i < 2; i++) {
      await act(async () => {
        await result.current.submit({
          verdict: 'correct',
          usedHint: false,
          given: 'zì',
          expected: 'zì',
          elapsedMs: 500,
        });
      });
    }

    expect(result.current.finished).toBe(true);
    expect(result.current.current).toBeNull();
    expect(result.current.stats.done).toBe(2);
  });

  it('buổi học giữ nguyên thứ tự và đủ số từ', async () => {
    const { result } = renderSession('lesson', 5);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.queue).toHaveLength(10);
    expect(result.current.queue.map((w) => w.id)).toEqual(FILE.lessons[0].wordIds);
  });

  it('đánh dấu từ rồi lọc theo từ đã đánh dấu', async () => {
    const first = renderSession('new');
    await waitFor(() => expect(first.result.current.loading).toBe(false));
    await act(async () => {
      await first.result.current.toggleStar('L1-0003');
    });
    expect(first.result.current.starred.has('L1-0003')).toBe(true);

    const starred = renderSession('starred');
    await waitFor(() => expect(starred.result.current.loading).toBe(false));
    expect(starred.result.current.queue.map((w) => w.id)).toEqual(['L1-0003']);
  });

  it('bỏ qua từ không tính là đã trả lời, nhưng vẫn tính là đã đi qua', async () => {
    const { result } = renderSession('new');
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.skip();
    });

    expect(result.current.index).toBe(1);
    expect(result.current.stats.done).toBe(0);
    // Thanh tiến độ chạy theo done + skipped, nếu không thì bỏ qua ba thẻ là
    // màn hình nói "2/20" trong khi người học đang ở thẻ thứ sáu.
    expect(result.current.stats.skipped).toBe(1);
  });

  it('phát lại đúng những từ vừa học chứ không đọc lại kho', async () => {
    const { result } = renderSession('new', 2);
    await waitFor(() => expect(result.current.loading).toBe(false));
    const played = result.current.queue.map((word) => word.id);

    for (let turn = 0; turn < 2; turn += 1) {
      await act(async () => {
        await result.current.submit({
          verdict: 'correct',
          usedHint: false,
          given: 'zì',
          expected: 'zì',
          elapsedMs: 100,
        });
      });
    }
    expect(result.current.finished).toBe(true);

    act(() => {
      result.current.replay();
    });

    // Dựng lại từ kho sẽ ra hàng đợi rỗng vì hai từ này vừa có thẻ; phát lại
    // thì phải ra đúng hai từ đó.
    expect(result.current.queue.map((word) => word.id)).toEqual(played);
    expect(result.current.finished).toBe(false);
    expect(result.current.stats.done).toBe(0);
  });

  it('chỉ phát lại những từ chưa trả lời đúng', async () => {
    const { result } = renderSession('new', 2);
    await waitFor(() => expect(result.current.loading).toBe(false));
    const wrongWord = result.current.queue[1].id;

    for (const verdict of ['correct', 'wrong'] as const) {
      await act(async () => {
        await result.current.submit({
          verdict,
          usedHint: false,
          given: '',
          expected: 'zì',
          elapsedMs: 100,
        });
      });
    }

    expect(result.current.missed.map((word) => word.id)).toEqual([wrongWord]);

    act(() => {
      result.current.replayMissed();
    });

    expect(result.current.queue.map((word) => word.id)).toEqual([wrongWord]);
  });

  it('sổ tay xếp từ lâu chưa ôn nhất lên trước để đi hết được vòng', async () => {
    // Đây là lỗi từng có: xếp theo mốc LƯU thì phiên nào cũng cắt ra đúng cùng
    // một nhóm đầu danh sách, và từ thứ (limit + 1) trở đi không bao giờ tới lượt.
    await toggleStar('L1-0001', { at: 1_000 });
    await toggleStar('L1-0002', { at: 2_000 });
    await toggleStar('L1-0003', { at: 3_000 });
    // L1-0001 vừa được ôn nên phải tụt xuống cuối.
    await saveCard({
      ...((await getCard('L1-0001')) as CardState),
      phase: 'review',
      reps: 1,
      lastReviewedAt: 9_000,
      dueAt: 9_000,
    });

    const { result } = renderSession('starred', 2);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.queue.map((word) => word.id)).toEqual(['L1-0002', 'L1-0003']);
    expect(result.current.poolTotal).toBe(3);
  });

  it('sổ tay không lọc theo cấp đang chọn', async () => {
    // Lưu một từ rồi đổi cấp học mà từ đó biến mất thì chẳng khác gì mất dữ liệu.
    await toggleStar('L1-0004', { at: 1_000 });

    const { result } = renderHook(
      () => useStudySession({ mode: 'flashcards', levels: [2, 3], pool: 'starred', limit: 5 }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.queue.map((word) => word.id)).toEqual(['L1-0004']);
  });
});
