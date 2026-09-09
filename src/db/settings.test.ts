import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { getCard, saveCard, toggleStar } from './cards.ts';
import { db, resetDatabase } from './database.ts';
import { getRecentLookups, recordLookup } from './lookups.ts';
import { getDailyStat, recordReview } from './reviews.ts';
import { getSavedLessons, saveLesson } from './saved-lessons.ts';
import {
  BACKUP_VERSION,
  exportProgress,
  importProgress,
  loadSettings,
  patchSettings,
  saveSettings,
} from './settings.ts';
import { DEFAULT_SETTINGS } from '../types/settings.ts';
import type { AppSettings } from '../types/settings.ts';
import type { CardState, ReviewLogEntry } from '../types/study.ts';
import type { HskLevel } from '../types/vocabulary.ts';

const SAMPLE_CARD: CardState = {
  wordId: 'L1-0001',
  phase: 'review',
  stability: 4.5,
  difficulty: 6.25,
  reps: 3,
  lapses: 1,
  correctCount: 2,
  wrongCount: 1,
  lastReviewedAt: 1_700_000_000_000,
  dueAt: 1_700_500_000_000,
  learningStep: 0,
  starred: true,
  weakestMode: 'typing',
  lastMistake: {
    mode: 'typing',
    at: 1_700_000_000_000,
    given: 'ni hao',
    expected: 'nǐ hǎo',
    verdict: 'close',
  },
};

const SAMPLE_REVIEW: Omit<ReviewLogEntry, 'id'> = {
  wordId: 'L1-0001',
  mode: 'typing',
  rating: 2,
  verdict: 'close',
  usedHint: true,
  at: 1_700_000_000_000,
  day: '2026-03-10',
  elapsedMs: 2400,
};

/** Dựng sẵn một ít tiến độ để thử xuất và nạp lại. */
async function seedProgress(): Promise<void> {
  await saveCard(SAMPLE_CARD);
  await recordReview(SAMPLE_REVIEW);
  await saveSettings({ ...DEFAULT_SETTINGS, dailyGoal: 45, activeLevels: [1, 2] });
}

beforeEach(async () => {
  await resetDatabase();
});

describe('loadSettings', () => {
  it('trả về mặc định khi người dùng chưa lưu gì', async () => {
    expect(await loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('không trả về chính đối tượng DEFAULT_SETTINGS để tránh sửa nhầm', async () => {
    const settings = await loadSettings();

    settings.activeLevels.push(3);

    expect(DEFAULT_SETTINGS.activeLevels).toEqual([1]);
  });

  it('bổ sung trường còn thiếu của bản lưu cũ bằng giá trị mặc định', async () => {
    const legacy: Partial<AppSettings> = { dailyGoal: 30 };
    await db.appSettings.put({ key: 'app', value: legacy as AppSettings });

    const settings = await loadSettings();

    expect(settings.dailyGoal).toBe(30);
    expect(settings.displayMode).toBe(DEFAULT_SETTINGS.displayMode);
    expect(settings.activeLevels).toEqual(DEFAULT_SETTINGS.activeLevels);
  });

  // IndexedDB lưu được cả `undefined`, và kiểu AppSettings hứa với giao diện là không có.
  it('không trả về undefined cho trường mà bản lưu ghi undefined', async () => {
    const broken = { ...DEFAULT_SETTINGS, dailyGoal: undefined } as unknown as AppSettings;
    await db.appSettings.put({ key: 'app', value: broken });

    expect((await loadSettings()).dailyGoal).toBe(DEFAULT_SETTINGS.dailyGoal);
  });

  it('lùi về mặc định khi bản lưu chứa giá trị ngoài tập cho phép', async () => {
    const broken = {
      ...DEFAULT_SETTINGS,
      speechRate: 4,
      theme: 'neon',
      newPerDay: Number.NaN,
      activeLevels: [1, 9],
    } as unknown as AppSettings;
    await db.appSettings.put({ key: 'app', value: broken });

    const settings = await loadSettings();

    expect(settings.speechRate).toBe(DEFAULT_SETTINGS.speechRate);
    expect(settings.theme).toBe(DEFAULT_SETTINGS.theme);
    expect(settings.newPerDay).toBe(DEFAULT_SETTINGS.newPerDay);
    expect(settings.activeLevels).toEqual([1]);
  });

  it('giữ nguyên danh sách cấp rỗng vì đó là lựa chọn thật của người dùng', async () => {
    await saveSettings({ ...DEFAULT_SETTINGS, activeLevels: [] });

    expect((await loadSettings()).activeLevels).toEqual([]);
  });
});

describe('saveSettings', () => {
  it('lưu rồi đọc lại nguyên vẹn', async () => {
    const settings: AppSettings = {
      displayMode: 'vi-en-zh',
      theme: 'dark',
      hidePinyin: true,
      showTraditional: true,
      speechRate: 0.7,
      preferredVoiceUri: 'zh-CN-Yunxi',
      dailyGoal: 50,
      newPerDay: 15,
      activeLevels: [1, 2, 3],
      lastLessonId: 'L2-B40',
      lastBackupAt: 1741564800000,
    };

    await saveSettings(settings);

    expect(await loadSettings()).toEqual(settings);
    expect(await db.appSettings.count()).toBe(1);
  });
});

describe('patchSettings', () => {
  it('chỉ đổi trường được truyền và giữ nguyên phần còn lại', async () => {
    await saveSettings({ ...DEFAULT_SETTINGS, dailyGoal: 40 });

    const next = await patchSettings({ theme: 'dark' });

    expect(next.theme).toBe('dark');
    expect(next.dailyGoal).toBe(40);
    expect(await loadSettings()).toEqual(next);
  });

  it('dùng được ngay cả khi chưa có bản ghi cài đặt nào', async () => {
    const next = await patchSettings({ newPerDay: 5 });

    expect(next).toEqual({ ...DEFAULT_SETTINGS, newPerDay: 5 });
  });

  // Partial<AppSettings> cho phép truyền undefined mà TypeScript không báo lỗi.
  it('coi trường undefined là "không đổi" chứ không phải "xoá đi"', async () => {
    await patchSettings({ dailyGoal: 42, preferredVoiceUri: 'zh-CN-Yunxi' });

    const next = await patchSettings({ dailyGoal: undefined, theme: 'dark' });

    expect(next.dailyGoal).toBe(42);
    expect(next.preferredVoiceUri).toBe('zh-CN-Yunxi');
    expect(next.theme).toBe('dark');
    expect(await loadSettings()).toEqual(next);
  });

  it('vẫn bỏ chọn được giọng đọc bằng null', async () => {
    await patchSettings({ preferredVoiceUri: 'zh-CN-Yunxi' });

    expect((await patchSettings({ preferredVoiceUri: null })).preferredVoiceUri).toBeNull();
  });

  it('không dùng chung mảng activeLevels với bên gọi', async () => {
    const levels: HskLevel[] = [1, 2];

    const next = await patchSettings({ activeLevels: levels });
    levels.push(3);

    expect(next.activeLevels).toEqual([1, 2]);
    expect((await loadSettings()).activeLevels).toEqual([1, 2]);
  });
});

describe('exportProgress và importProgress', () => {
  it('người dùng mới xuất ra tệp rỗng nhưng vẫn hợp lệ', async () => {
    const json = await exportProgress();
    const parsed: unknown = JSON.parse(json);

    expect(parsed).toMatchObject({
      version: BACKUP_VERSION,
      cards: [],
      reviews: [],
      dailyStats: [],
      settings: null,
    });
  });

  it('nạp lại sau khi xoá sạch thì khôi phục đúng dữ liệu', async () => {
    await seedProgress();
    const json = await exportProgress();

    await resetDatabase();
    expect(await getCard('L1-0001')).toBeUndefined();

    const counts = await importProgress(json);

    expect(counts).toEqual({ cards: 1, reviews: 1, days: 1, savedLessons: 0, lookups: 0 });
    expect(await getCard('L1-0001')).toEqual(SAMPLE_CARD);
    expect(await getDailyStat('2026-03-10')).toEqual({
      day: '2026-03-10',
      reviews: 1,
      correct: 0,
      newWords: 1,
      studyMs: 2400,
    });
    expect(await loadSettings()).toEqual({
      ...DEFAULT_SETTINGS,
      dailyGoal: 45,
      activeLevels: [1, 2],
    });
    const restored = await db.reviews.toArray();
    expect(restored).toHaveLength(1);
    expect(restored[0]).toMatchObject(SAMPLE_REVIEW);
  });

  it('nạp là thay thế, không cộng thêm vào dữ liệu đang có', async () => {
    await seedProgress();
    const json = await exportProgress();

    await importProgress(json);

    expect(await db.cards.count()).toBe(1);
    expect(await db.reviews.count()).toBe(1);
    expect(await db.dailyStats.count()).toBe(1);
  });

  it('ném lỗi tiếng Việt khi JSON hỏng', async () => {
    await expect(importProgress('{ hỏng')).rejects.toThrow(/Tệp sao lưu không hợp lệ/);
  });

  it('ném lỗi khi nội dung không phải đối tượng', async () => {
    await expect(importProgress('[1, 2, 3]')).rejects.toThrow(/Tệp sao lưu không hợp lệ/);
  });

  it('ném lỗi khi sai phiên bản', async () => {
    const json = JSON.stringify({ version: 99, cards: [], reviews: [], dailyStats: [] });

    await expect(importProgress(json)).rejects.toThrow(/phiên bản 99 không được hỗ trợ/);
  });

  it('ném lỗi khi thiếu danh sách bắt buộc', async () => {
    const json = JSON.stringify({ version: BACKUP_VERSION, cards: [], reviews: [] });

    await expect(importProgress(json)).rejects.toThrow(/"dailyStats" phải là một danh sách/);
  });

  it('ném lỗi khi một thẻ sai kiểu dữ liệu', async () => {
    const json = JSON.stringify({
      version: BACKUP_VERSION,
      cards: [{ ...SAMPLE_CARD, stability: 'nhiều' }],
      reviews: [],
      dailyStats: [],
    });

    await expect(importProgress(json)).rejects.toThrow(/"cards\[0\]\.stability" phải là một số/);
  });

  it('ném lỗi khi chế độ học không nằm trong danh sách cho phép', async () => {
    const json = JSON.stringify({
      version: BACKUP_VERSION,
      cards: [],
      reviews: [{ ...SAMPLE_REVIEW, id: 1, mode: 'karaoke' }],
      dailyStats: [],
    });

    await expect(importProgress(json)).rejects.toThrow(/"reviews\[0\]\.mode"/);
  });

  it('ném lỗi khi ngày sai định dạng', async () => {
    const json = JSON.stringify({
      version: BACKUP_VERSION,
      cards: [],
      reviews: [],
      dailyStats: [{ day: '10-03-2026', reviews: 1, correct: 1, newWords: 0, studyMs: 10 }],
    });

    await expect(importProgress(json)).rejects.toThrow(/YYYY-MM-DD/);
  });

  it('ném lỗi khi cài đặt trong tệp không hợp lệ', async () => {
    const json = JSON.stringify({
      version: BACKUP_VERSION,
      cards: [],
      reviews: [],
      dailyStats: [],
      settings: { ...DEFAULT_SETTINGS, speechRate: 3 },
    });

    await expect(importProgress(json)).rejects.toThrow(/"settings\.speechRate"/);
  });

  it('nạp cùng một tệp hai lần không nhân đôi nhật ký', async () => {
    await seedProgress();
    const json = await exportProgress();

    await importProgress(json);
    await importProgress(json);

    expect(await db.reviews.count()).toBe(1);
    expect(await db.cards.count()).toBe(1);
  });

  it('giữ lại cài đặt đang dùng khi tệp sao lưu không kèm cài đặt', async () => {
    await saveSettings({ ...DEFAULT_SETTINGS, dailyGoal: 45 });
    const json = JSON.stringify({
      version: BACKUP_VERSION,
      exportedAt: 0,
      cards: [],
      reviews: [],
      dailyStats: [],
      settings: null,
    });

    await importProgress(json);

    expect((await loadSettings()).dailyGoal).toBe(45);
  });

  it('không đụng vào dữ liệu đang có khi tệp hỏng', async () => {
    await seedProgress();

    await expect(importProgress('không phải json')).rejects.toThrow();

    expect(await db.cards.count()).toBe(1);
    expect(await loadSettings()).toMatchObject({ dailyGoal: 45 });
  });

  it('mang theo sổ tay buổi học và lịch sử tra từ qua một vòng xuất rồi nạp', async () => {
    await saveLesson('L2-B40', { at: 1_741_000_000_000 });
    await recordLookup('L1-0007', { query: 'xin chào', at: 1_741_000_001_000 });
    const json = await exportProgress();

    await resetDatabase();
    const counts = await importProgress(json);

    expect(counts).toMatchObject({ savedLessons: 1, lookups: 1 });
    expect(await getSavedLessons()).toEqual([{ lessonId: 'L2-B40', at: 1_741_000_000_000 }]);
    expect(await getRecentLookups(10)).toEqual([
      {
        wordId: 'L1-0007',
        at: 1_741_000_001_000,
        count: 1,
        query: 'xin chào',
        source: 'search',
      },
    ]);
  });

  it('giữ nguyên mốc lưu của từng từ trong sổ tay', async () => {
    await toggleStar('L1-0002', { at: 1_741_000_000_000 });
    const json = await exportProgress();

    await resetDatabase();
    await importProgress(json);

    expect((await getCard('L1-0002'))?.starredAt).toBe(1_741_000_000_000);
  });

  it('nạp được tệp cũ chưa biết tới sổ tay và lịch sử tra từ', async () => {
    // Tệp người dùng đã tải về từ bản trước không có hai mảng này. Nếu bắt buộc
    // phải có thì mọi bản sao lưu cũ thành vô dụng, nên chỉ coi là sổ tay rỗng.
    const json = JSON.stringify({
      version: BACKUP_VERSION,
      exportedAt: 0,
      cards: [SAMPLE_CARD],
      reviews: [],
      dailyStats: [],
      settings: null,
    });

    const counts = await importProgress(json);

    expect(counts).toMatchObject({ cards: 1, savedLessons: 0, lookups: 0 });
    expect(await getSavedLessons()).toEqual([]);
  });

  it('ném lỗi khi sổ tay trong tệp sai kiểu', async () => {
    const json = JSON.stringify({
      version: BACKUP_VERSION,
      cards: [],
      reviews: [],
      dailyStats: [],
      savedLessons: [{ lessonId: 'L1-B01' }],
    });

    await expect(importProgress(json)).rejects.toThrow(/"savedLessons\[0\]\.at"/);
  });
});

describe('resetDatabase', () => {
  it('xoá cả tiến độ lẫn cài đặt, đưa về trạng thái người dùng mới', async () => {
    await seedProgress();

    await resetDatabase();

    expect(await db.cards.count()).toBe(0);
    expect(await db.reviews.count()).toBe(0);
    expect(await db.dailyStats.count()).toBe(0);
    expect(await loadSettings()).toEqual(DEFAULT_SETTINGS);
  });
});
