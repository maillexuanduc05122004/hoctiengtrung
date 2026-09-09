/**
 * Câu mô tả nguồn từ của một phiên, dùng chung cho cả bốn chế độ.
 *
 * Trước đây mỗi chế độ tự ghép một chuỗi riêng, nên chế độ nói không hiện nguồn
 * từ còn chế độ gõ lại hiện hai lần. Gom về một hàm để bốn màn hình nói giống
 * hệt nhau, và để câu đó nói được điều quan trọng nhất mà trước đây bị giấu:
 * phiên này chỉ lấy bao nhiêu từ trong tổng số đang có.
 */
import type { PoolKind } from '../../hooks/useStudySession.ts';
import type { HskLevel } from '../../types/vocabulary.ts';

export const POOL_LABEL: Record<PoolKind, string> = {
  due: 'Từ cần ôn',
  new: 'Từ mới',
  starred: 'Từ đã lưu',
  mixed: 'Trộn ôn và từ mới',
  lesson: 'Theo buổi học',
};

export interface StudySourceOptions {
  pool: PoolKind;
  levels: readonly HskLevel[];
  /** Tên buổi học khi đang luyện theo buổi. */
  lessonLabel?: string;
  /** Số từ trong hàng đợi lần này. */
  shown: number;
  /** Số từ nguồn này đang có, trước khi cắt bớt. */
  total: number;
}

export function studySourceLabel({
  pool,
  levels,
  lessonLabel,
  shown,
  total,
}: StudySourceOptions): string {
  const head =
    lessonLabel !== undefined && lessonLabel !== ''
      ? lessonLabel
      : pool === 'starred'
        ? // Sổ tay không lọc theo cấp nên nhắc tới cấp ở đây là nói sai.
          POOL_LABEL.starred
        : `${POOL_LABEL[pool]} · HSK ${[...levels].sort((a, b) => a - b).join(', ')}`;

  // Chỉ nói "20 trong 63" khi thật sự có phần bị cắt; còn lại chỉ cần một số.
  if (total > shown && shown > 0) return `${head} · ${shown} trong ${total} từ`;
  if (shown > 0) return `${head} · ${shown} từ`;
  return head;
}

/**
 * Chuỗi truy vấn mô tả phiên đang học, để hàng đổi cách luyện mang theo đúng
 * tập từ này sang chế độ khác.
 *
 * Luôn ghi đủ cả `level` lẫn `pool` ngay cả khi địa chỉ hiện tại chưa có: bốn
 * trang luyện có bốn nguồn từ mặc định khác nhau, nên chuyển một chuỗi rỗng
 * sang trang khác là lặng lẽ đổi luôn nguồn từ giữa chừng.
 */
export function studySessionQuery(
  pool: PoolKind,
  levels: readonly HskLevel[],
  lessonId?: string,
): string {
  // Học theo buổi thì chỉ cần mã buổi: trang nhận tự suy ra cấp và nguồn từ.
  if (lessonId !== undefined && lessonId !== '') {
    return `?lesson=${encodeURIComponent(lessonId)}`;
  }
  const level = [...levels].sort((a, b) => a - b).join(',');
  return `?level=${level}&pool=${pool === 'lesson' ? 'mixed' : pool}`;
}
