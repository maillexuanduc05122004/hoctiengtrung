import 'fake-indexeddb/auto';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';
import { useStudySession } from './useStudySession.ts';
import { SettingsContext } from './settings-context.ts';
import { VocabularyContext } from './vocabulary-context.ts';
import { buildIndex } from '../lib/vocabulary/store.ts';
import { db, getCard, getRecentDays, resetDatabase } from '../db/index.ts';
import { DEFAULT_SETTINGS } from '../types/settings.ts';
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

  it('bỏ qua từ thì không tính vào thống kê', async () => {
    const { result } = renderSession('new');
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.skip();
    });

    expect(result.current.index).toBe(1);
    expect(result.current.stats.done).toBe(0);
  });
});
