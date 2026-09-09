/**
 * Sổ tay buổi học.
 *
 * Người học lưu một buổi khi muốn quay lại nó sau, không nhất thiết vì đang học
 * dở. Vì vậy bảng này chỉ giữ đúng ý định đó — mã buổi và mốc lưu — còn "đã học
 * bao nhiêu từ" vẫn tính từ bảng thẻ như mọi nơi khác. Nếu nhét tiến độ vào đây
 * thì sẽ có hai nguồn sự thật cho cùng một con số.
 *
 * Toàn bộ nằm trong IndexedDB của máy, không gửi đi đâu.
 */
import { db } from './database.ts';
import type { SavedLesson } from '../types/study.ts';

/** Các buổi đã lưu, mới lưu trước cũ sau. */
export async function getSavedLessons(): Promise<SavedLesson[]> {
  return db.savedLessons.orderBy('at').reverse().toArray();
}

/** Mã của các buổi đã lưu, dùng khi chỉ cần biết buổi nào có trong sổ tay. */
export async function getSavedLessonIds(): Promise<Set<string>> {
  const rows = await db.savedLessons.toArray();
  return new Set(rows.map((row) => row.lessonId));
}

export async function countSavedLessons(): Promise<number> {
  return db.savedLessons.count();
}

export async function isLessonSaved(lessonId: string): Promise<boolean> {
  return (await db.savedLessons.get(lessonId)) !== undefined;
}

export interface SaveLessonOptions {
  /** Mốc thời gian, chỉ truyền trong kiểm thử. */
  at?: number;
}

/**
 * Lưu một buổi. Lưu lại buổi đã có thì chỉ dời mốc thời gian lên đầu danh sách
 * chứ không tạo thêm dòng.
 */
export async function saveLesson(
  lessonId: string,
  options: SaveLessonOptions = {},
): Promise<SavedLesson | null> {
  if (lessonId === '') return null;
  const row: SavedLesson = { lessonId, at: options.at ?? Date.now() };
  await db.savedLessons.put(row);
  return row;
}

export async function unsaveLesson(lessonId: string): Promise<void> {
  await db.savedLessons.delete(lessonId);
}

/** Bật tắt việc lưu một buổi. Trả về trạng thái sau khi đổi. */
export async function toggleSavedLesson(
  lessonId: string,
  options: SaveLessonOptions = {},
): Promise<boolean> {
  if (lessonId === '') return false;
  const at = options.at ?? Date.now();
  return db.transaction('rw', db.savedLessons, async () => {
    const existing = await db.savedLessons.get(lessonId);
    if (existing) {
      await db.savedLessons.delete(lessonId);
      return false;
    }
    await db.savedLessons.put({ lessonId, at });
    return true;
  });
}

export async function clearSavedLessons(): Promise<void> {
  await db.savedLessons.clear();
}
