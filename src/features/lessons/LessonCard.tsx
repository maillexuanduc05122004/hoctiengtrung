import { Link } from 'react-router';
import { Chip } from '../../components/ui/Controls.tsx';
import { ProgressBar } from '../../components/ui/Feedback.tsx';
import type { Lesson } from '../../types/vocabulary.ts';
import { lessonStatus, type LessonProgress, type LessonStatus } from './useLessonProgress.ts';

export interface LessonCardProps {
  lesson: Lesson;
  /** Chưa có khi tiến độ còn đang đọc từ kho cục bộ. */
  progress?: LessonProgress;
  /** Ghi thêm cấp HSK vào thẻ, dùng khi danh sách trộn nhiều cấp. */
  showLevel?: boolean;
}

const STATUS_LABEL: Record<LessonStatus, string> = {
  new: 'Chưa học',
  doing: 'Đang học',
  done: 'Đã xong',
};

const STATUS_TONE: Record<LessonStatus, 'neutral' | 'cinnabar' | 'teal'> = {
  new: 'neutral',
  doing: 'cinnabar',
  done: 'teal',
};

// Buổi đang học dở được viền đỏ son để mắt tìm ra ngay trong lưới gần một trăm
// buổi; buổi chưa học và buổi đã xong đều dùng đường kẻ mảnh như phần còn lại
// của trang, tránh biến danh sách thành một bảng màu.
const STATUS_BORDER: Record<LessonStatus, string> = {
  new: 'border-line hover:border-line-strong',
  doing: 'border-cinnabar/45 hover:border-cinnabar',
  done: 'border-line hover:border-line-strong',
};

/**
 * Một buổi học trong lưới danh sách.
 *
 * Cả thẻ là một liên kết duy nhất nên chạm ở đâu cũng mở được buổi học, và
 * trình đọc màn hình chỉ gặp một điểm dừng thay vì bốn năm mẩu chữ rời rạc.
 */
export function LessonCard({ lesson, progress, showLevel = false }: LessonCardProps) {
  const total = progress?.total ?? lesson.wordIds.length;
  const learned = progress?.learned ?? 0;
  const due = progress?.due ?? 0;
  const status = lessonStatus(progress);
  const known = progress !== undefined;

  const description = known
    ? `${STATUS_LABEL[status]}, đã học ${learned} trên ${total} từ`
    : `${total} từ`;

  return (
    <Link
      to={`/buoi-hoc/${encodeURIComponent(lesson.id)}`}
      aria-label={`Buổi ${lesson.index}, HSK ${lesson.level}, từ ${lesson.range.from} đến ${lesson.range.to}. ${description}.`}
      className={[
        'tap block min-w-0 border bg-surface px-4 py-3.5 no-underline rounded-[0.375rem]',
        'transition-colors duration-150',
        STATUS_BORDER[status],
      ].join(' ')}
    >
      <div
        className="flex min-w-0 items-start justify-between"
      >
        <p
          className="min-w-0 text-[0.75rem] font-semibold tracking-wide text-ink-faint uppercase"
        >
          {showLevel ? `HSK ${lesson.level} · Buổi ${lesson.index}` : `Buổi ${lesson.index}`}
        </p>
        {known ? (
          <span
            className="ml-2 shrink-0"
          >
            <Chip tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Chip>
          </span>
        ) : null}
      </div>

      <p
        lang="zh-Hans"
        className="han mt-1.5 min-w-0 text-[1.25rem] break-words text-ink"
      >
        {lesson.range.from}
        <span
          aria-hidden="true"
          className="mx-1.5 text-[0.9375rem] text-ink-faint"
        >
          →
        </span>
        {lesson.range.to}
      </p>

      <div
        className="mt-3"
      >
        <ProgressBar
          value={learned}
          max={total}
          label="Đã học"
          hint={`${learned}/${total} từ`}
          tone={status === 'done' ? 'teal' : 'cinnabar'}
        />
      </div>

      {due > 0 ? (
        <p
          className="mt-2 text-[0.75rem] text-cinnabar-ink"
        >
          {`${due} từ cần ôn`}
        </p>
      ) : null}
    </Link>
  );
}
