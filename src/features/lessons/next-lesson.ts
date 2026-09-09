/**
 * Buổi học nên vào tiếp.
 *
 * Trang chủ và trang danh sách buổi học từng tự trả lời câu này theo hai cách
 * ngược nhau: một bên lấy buổi dở dang có số lớn nhất, bên kia lấy số nhỏ nhất.
 * Người từng bỏ dở buổi 5 rồi học tới buổi 42 sẽ được hai màn hình mời vào hai
 * buổi khác nhau, cả hai đều nói chắc như đinh. Quy tắc phải nằm đúng một chỗ.
 *
 * Thứ tự ưu tiên theo đúng cách người học nghĩ:
 * 1. Buổi dở dang có số LỚN NHẤT — đó là chỗ vừa rời đi.
 * 2. Không có buổi dở nào thì lấy buổi chưa đụng tới đầu tiên.
 * Buổi "đã học hết nhưng có từ tới hạn" không chen vào đây: phần ôn đã có nút
 * "Học tiếp" riêng ở trang chủ, và đẩy người học lùi lại buổi cũ mỗi lần tới
 * hẹn ôn thì họ không bao giờ đi tiếp được.
 */
import type { CardState } from '../../types/study.ts';
import type { Lesson } from '../../types/vocabulary.ts';
import { isLearned } from './useLessonProgress.ts';

/** Vì sao buổi này được chọn. Dùng để viết đúng nhãn trên nút. */
export type NextLessonReason = 'dang-do' | 'chua-hoc';

export interface NextLesson {
  lesson: Lesson;
  learned: number;
  total: number;
  reason: NextLessonReason;
}


/**
 * Chọn buổi tiếp theo trong `lessons`, dựa trên các thẻ đã đọc sẵn.
 *
 * Nhận `cards` chứ không tự đọc kho: bên gọi thường đã đọc cả tập thẻ cho việc
 * khác rồi, đọc lại lần nữa là gần một trăm lượt truy vấn thừa cho mỗi lần vẽ.
 * Trả về `null` khi mọi buổi trong danh sách đều đã học xong.
 */
export function pickNextLesson(
  lessons: readonly Lesson[],
  cards: ReadonlyMap<string, CardState>,
): NextLesson | null {
  let started: NextLesson | null = null;
  let untouched: NextLesson | null = null;

  for (const lesson of lessons) {
    const total = lesson.wordIds.length;
    if (total === 0) continue;
    const learned = lesson.wordIds.filter((id) => isLearned(cards.get(id))).length;
    if (learned >= total) continue;
    if (learned > 0) {
      // Danh sách đi từ buổi đầu tới buổi cuối nên giá trị đọng lại là buổi dở
      // có số lớn nhất, tức là chỗ người học vừa rời đi.
      started = { lesson, learned, total, reason: 'dang-do' };
    } else if (untouched === null) {
      untouched = { lesson, learned, total, reason: 'chua-hoc' };
    }
  }

  return started ?? untouched;
}
