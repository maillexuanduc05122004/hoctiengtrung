/**
 * Sổ tay buổi học, đọc thẳng từ kho bằng liveQuery của Dexie.
 *
 * Nhờ liveQuery mà lưu một buổi ở trang danh sách thì trang sổ tay đang mở ở
 * thẻ khác cũng đổi theo, không cần ai báo cho ai. Đây cũng là lý do phần này
 * không nhận dữ liệu qua thuộc tính.
 */
import { useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getSavedLessonIds, getSavedLessons, toggleSavedLesson } from '../../db/index.ts';
import type { SavedLesson } from '../../types/study.ts';

const EMPTY_IDS: ReadonlySet<string> = new Set<string>();

export interface SavedLessonsState {
  /** Mã các buổi đã lưu. Rỗng trong lúc còn đang đọc kho. */
  ids: ReadonlySet<string>;
  /** Đang đọc lần đầu; phân biệt "chưa biết" với "biết là chưa lưu buổi nào". */
  loading: boolean;
  /** Bật tắt việc lưu một buổi, trả về trạng thái sau khi đổi. */
  toggle: (lessonId: string) => Promise<boolean>;
}

export function useSavedLessonIds(): SavedLessonsState {
  const ids = useLiveQuery(getSavedLessonIds, []);

  const toggle = useCallback(async (lessonId: string): Promise<boolean> => {
    return toggleSavedLesson(lessonId);
  }, []);

  return { ids: ids ?? EMPTY_IDS, loading: ids === undefined, toggle };
}

export interface SavedLessonRowsState {
  rows: SavedLesson[];
  loading: boolean;
}

/** Danh sách buổi đã lưu kèm mốc thời gian, mới lưu trước cũ sau. */
export function useSavedLessonRows(): SavedLessonRowsState {
  const rows = useLiveQuery(getSavedLessons, []);
  return { rows: rows ?? [], loading: rows === undefined };
}
