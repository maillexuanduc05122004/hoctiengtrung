import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { resetDatabase } from './database.ts';
import {
  clearSavedLessons,
  countSavedLessons,
  getSavedLessonIds,
  getSavedLessons,
  isLessonSaved,
  saveLesson,
  toggleSavedLesson,
  unsaveLesson,
} from './saved-lessons.ts';

const T0 = 1_741_000_000_000;

beforeEach(async () => {
  await resetDatabase();
});

describe('người dùng mới', () => {
  it('sổ tay buổi học rỗng', async () => {
    expect(await getSavedLessons()).toEqual([]);
    expect(await getSavedLessonIds()).toEqual(new Set());
    expect(await countSavedLessons()).toBe(0);
    expect(await isLessonSaved('L1-B01')).toBe(false);
  });
});

describe('saveLesson', () => {
  it('lưu rồi đọc lại được', async () => {
    expect(await saveLesson('L1-B01', { at: T0 })).toEqual({ lessonId: 'L1-B01', at: T0 });

    expect(await isLessonSaved('L1-B01')).toBe(true);
    expect(await countSavedLessons()).toBe(1);
  });

  it('lưu lại buổi đã có chỉ dời mốc thời gian, không tạo thêm dòng', async () => {
    await saveLesson('L1-B01', { at: T0 });
    await saveLesson('L1-B01', { at: T0 + 5_000 });

    expect(await countSavedLessons()).toBe(1);
    expect((await getSavedLessons())[0].at).toBe(T0 + 5_000);
  });

  it('bỏ qua mã buổi rỗng thay vì ghi một dòng vô nghĩa', async () => {
    expect(await saveLesson('')).toBeNull();

    expect(await countSavedLessons()).toBe(0);
  });
});

describe('getSavedLessons', () => {
  it('xếp buổi mới lưu lên đầu', async () => {
    await saveLesson('L1-B01', { at: T0 });
    await saveLesson('L2-B40', { at: T0 + 2_000 });
    await saveLesson('L3-B07', { at: T0 + 1_000 });

    expect((await getSavedLessons()).map((row) => row.lessonId)).toEqual([
      'L2-B40',
      'L3-B07',
      'L1-B01',
    ]);
  });
});

describe('toggleSavedLesson', () => {
  it('bấm lần đầu là lưu, bấm lần nữa là bỏ lưu', async () => {
    expect(await toggleSavedLesson('L1-B03', { at: T0 })).toBe(true);
    expect(await isLessonSaved('L1-B03')).toBe(true);

    expect(await toggleSavedLesson('L1-B03', { at: T0 + 1 })).toBe(false);
    expect(await isLessonSaved('L1-B03')).toBe(false);
    expect(await countSavedLessons()).toBe(0);
  });
});

describe('unsaveLesson và clearSavedLessons', () => {
  it('xoá đúng một buổi, giữ nguyên các buổi còn lại', async () => {
    await saveLesson('L1-B01', { at: T0 });
    await saveLesson('L1-B02', { at: T0 + 1 });

    await unsaveLesson('L1-B01');

    expect(await getSavedLessonIds()).toEqual(new Set(['L1-B02']));
  });

  it('bỏ lưu một buổi chưa từng lưu không gây lỗi', async () => {
    await expect(unsaveLesson('L9-B99')).resolves.toBeUndefined();
  });

  it('xoá sạch sổ tay', async () => {
    await saveLesson('L1-B01', { at: T0 });
    await saveLesson('L1-B02', { at: T0 + 1 });

    await clearSavedLessons();

    expect(await countSavedLessons()).toBe(0);
  });
});
