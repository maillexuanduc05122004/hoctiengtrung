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
}

/**
 * Lưới các buổi học.
 *
 * Số cột tự giãn theo bề rộng còn lại thay vì cắt cứng theo từng loại thiết bị:
 * máy tính vừa ba cột, máy tính bảng còn hai, và điện thoại bị ép về một cột để
 * chữ Hán trong khoảng từ không phải xuống dòng giữa chừng.
 *
 * Mỗi ô khai báo `content-visibility` vì một cấp có tới gần một trăm buổi:
 * trình duyệt bỏ qua phần dựng của những ô còn nằm ngoài màn hình nên cuộn
 * không bị khựng, mà thanh cuộn vẫn dài đúng nhờ kích thước dự trù.
 */
export function LessonList({ lessons, progress, label, showLevel = false }: LessonListProps) {
  if (lessons.length === 0) {
    return (
      <EmptyState
        icon="book"
        title="Chưa có buổi học nào"
        description="Cấp này chưa có dữ liệu buổi học trong bộ từ đang dùng."
      />
    );
  }

  return (
    <ul
      aria-label={label}
      className="grid min-w-0 grid-cols-[repeat(auto-fill,minmax(16.5rem,1fr))] gap-3 xsm:grid-cols-1"
    >
      {lessons.map((lesson) => (
        <li
          key={lesson.id}
          className="min-w-0 [contain-intrinsic-size:auto_11rem] [content-visibility:auto]"
        >
          <LessonCard
            lesson={lesson}
            progress={progress.get(lesson.id)}
            showLevel={showLevel}
          />
        </li>
      ))}
    </ul>
  );
}
