/**
 * Trạng thái ghi nhớ của một từ.
 *
 * Tách khỏi phần vẽ vì trang buổi học và sổ tay đều cần đúng phép phân loại này;
 * nếu mỗi nơi tự tính thì hai màn hình sẽ nói khác nhau về cùng một thẻ.
 */
import type { CardState } from '../../types/study.ts';

/** Đủ chi tiết để người học biết nên làm gì tiếp, không chỉ "đã học hay chưa". */
export type WordStatus = 'new' | 'learning' | 'due' | 'known';

export const WORD_STATUS_LABEL: Record<WordStatus, string> = {
  new: 'Chưa học',
  learning: 'Đang học',
  due: 'Cần ôn',
  known: 'Đã nhớ',
};

export function wordStatus(card: CardState | undefined, now: number): WordStatus {
  if (card === undefined || card.phase === 'new') return 'new';
  if (card.phase === 'learning' || card.phase === 'relearning') return 'learning';
  return card.dueAt <= now ? 'due' : 'known';
}
