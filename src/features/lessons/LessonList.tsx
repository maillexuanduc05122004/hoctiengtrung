import type { ReactNode } from 'react';
import { EmptyState } from '../../components/ui/Feedback.tsx';
import type { Lesson } from '../../types/vocabulary.ts';
import { LessonCard } from './LessonCard.tsx';
import type { LessonProgress } from './useLessonProgress.ts';

export interface LessonListProps {
  lessons: readonly Lesson[];
  progress: ReadonlyMap<string, LessonProgress>;
  /** Nhãn nhóm cho trình đọc màn hình, ví dụ "Các buổi học HSK 2". */
  label: string;
  showLevel?: boolean;
  /** Mã các buổi đang nằm trong sổ tay. */
  savedIds?: ReadonlySet<string>;
  onToggleSave?: (lesson: Lesson) => void;
  /** Buổi người học vừa rời đi, được viền đậm và có neo để cuộn tới. */
  currentId?: string | null;
  /** Chuỗi truy vấn của trang danh sách, để đường quay lại giữ đúng cấp và bộ lọc. */
  listQuery?: string;
  /** Nội dung hiện khi danh sách rỗng vì bộ lọc chứ không phải vì thiếu dữ liệu. */
  empty?: ReactNode;
}

/**
 * Danh sách các buổi học.
 *
 * Số cột tự giãn theo bề rộng còn lại thay vì cắt cứng theo từng loại thiết bị:
 * máy tính vừa hai đến ba cột, điện thoại bị ép về một cột.
 *
 * Cố ý KHÔNG dùng `content-visibility`: nó bật containment sơn cho từng ô, mà
 * vòng tiêu điểm được vẽ bên ngoài thẻ nên sẽ bị cắt trụi — người dùng bàn phím
 * mất dấu hoàn toàn. Dòng gọn hiện nay nhẹ hơn thẻ cũ nhiều lần nên gần một trăm
 * ô vẫn cuộn mượt mà không cần đến nó.
 *
 * Mỗi ô mang một `id` dạng `buoi-<số>` để trang chi tiết quay lại đúng chỗ cũ
 * bằng địa chỉ (`/buoi-hoc?cap=2#buoi-42`) thay vì rơi lên đầu danh sách.
 */
export function LessonList({
  lessons,
  progress,
  label,
  showLevel = false,
  savedIds,
  onToggleSave,
  currentId = null,
  listQuery = '',
  empty,
}: LessonListProps) {
  if (lessons.length === 0) {
    return (
      empty ?? (
        <EmptyState
          icon="book"
          title="Chưa có buổi học nào"
          description="Cấp này chưa có dữ liệu buổi học trong bộ từ đang dùng."
        />
      )
    );
  }

  return (
    <ul
      aria-label={label}
      className="grid min-w-0 grid-cols-[repeat(auto-fill,minmax(19rem,1fr))] gap-2.5 xsm:grid-cols-1"
    >
      {lessons.map((lesson) => (
        <li
          key={lesson.id}
          id={`buoi-${lesson.index}`}
          className="min-w-0"
        >
          <LessonCard
            lesson={lesson}
            progress={progress.get(lesson.id)}
            showLevel={showLevel}
            saved={savedIds?.has(lesson.id) ?? false}
            onToggleSave={onToggleSave}
            current={lesson.id === currentId}
            listQuery={listQuery}
          />
        </li>
      ))}
    </ul>
  );
}
