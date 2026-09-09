import { Link } from 'react-router';
import { IconButton } from '../../components/ui/Button.tsx';
import { Chip } from '../../components/ui/Controls.tsx';
import { useVocabulary } from '../../hooks/vocabulary-context.ts';
import type { Lesson } from '../../types/vocabulary.ts';
import { lessonStatus, type LessonProgress, type LessonStatus } from './useLessonProgress.ts';

export interface LessonCardProps {
  lesson: Lesson;
  /** Chưa có khi tiến độ còn đang đọc từ kho cục bộ. */
  progress?: LessonProgress;
  /** Ghi thêm cấp HSK vào thẻ, dùng khi danh sách trộn nhiều cấp. */
  showLevel?: boolean;
  /** Buổi này đang nằm trong sổ tay. */
  saved?: boolean;
  onToggleSave?: (lesson: Lesson) => void;
  /** Đánh dấu đây là chỗ người học vừa rời đi. */
  current?: boolean;
  /**
   * Chuỗi truy vấn của danh sách (cấp, bộ lọc), gắn vào địa chỉ buổi học để
   * đường quay lại dựng đúng danh sách cũ thay vì một danh sách mặc định.
   */
  listQuery?: string;
}

const STATUS_LABEL: Record<LessonStatus, string> = {
  new: 'Chưa học',
  doing: 'Đang học',
  review: 'Cần ôn',
  done: 'Đã xong',
};

/*
  Màu ở đây theo đúng một quy tắc, không phải tô cho đẹp:
  đỏ son là việc cần làm ngay, vàng đất là đang dở dang, xanh ngọc là đã xong,
  xám là chưa đụng tới. Nhờ vậy liếc qua cả lưới là biết nên vào buổi nào.
*/
const STATUS_TONE: Record<LessonStatus, 'neutral' | 'cinnabar' | 'teal' | 'warn'> = {
  new: 'neutral',
  doing: 'warn',
  review: 'cinnabar',
  done: 'teal',
};

/** Số từ hiện ra làm nhận dạng của buổi. Bốn từ vừa một dòng trên máy hẹp nhất. */
const PREVIEW_WORDS = 4;

/**
 * Một buổi học trong danh sách.
 *
 * Dựng theo kiểu dòng chứ không phải thẻ cao: một cấp có tới 97 buổi, mà thẻ cũ
 * cao 11rem nên trên điện thoại danh sách dài hơn mười màn hình. Dòng gọn lại
 * còn khoảng một phần ba chiều cao mà vẫn nói đủ: số buổi, vài từ để nhận ra
 * buổi, tiến độ và việc cần làm.
 *
 * Vùng bấm là một liên kết phủ cả dòng thay vì bọc cả dòng vào trong liên kết.
 * Cách này giữ được một điểm dừng duy nhất cho trình đọc màn hình, mà nút lưu
 * vẫn bấm riêng được — nút nằm trong liên kết là HTML không hợp lệ, và thanh
 * tiến độ nằm trong liên kết thì bị đọc thành một phần của tên liên kết.
 */
export function LessonCard({
  lesson,
  progress,
  showLevel = false,
  saved = false,
  onToggleSave,
  current = false,
  listQuery = '',
}: LessonCardProps) {
  const { index } = useVocabulary();
  const total = progress?.total ?? lesson.wordIds.length;
  const learned = progress?.learned ?? 0;
  const due = progress?.due ?? 0;
  const status = lessonStatus(progress);
  const known = progress !== undefined;

  // Khoảng "từ đầu → từ cuối" không giúp nhận ra buổi vì các buổi xếp theo thứ
  // tự trong danh sách gốc chứ không theo chủ đề. Vài từ đầu thì nhận ra ngay.
  const preview = lesson.wordIds
    .slice(0, PREVIEW_WORDS)
    .map((id) => index.byId.get(id)?.simplified)
    .filter((word): word is string => word !== undefined);

  const title = showLevel ? `HSK ${lesson.level} · Buổi ${lesson.index}` : `Buổi ${lesson.index}`;
  const percent = total > 0 ? Math.min(100, Math.round((learned / total) * 100)) : 0;

  const spoken = known
    ? `${STATUS_LABEL[status]}, đã học ${learned} trên ${total} từ${due > 0 ? `, ${due} từ cần ôn` : ''}`
    : `${total} từ`;

  return (
    <div
      className={[
        'relative flex min-w-0 items-center border bg-surface px-3 py-2.5 rounded-[0.375rem]',
        'transition-colors duration-150',
        current
          ? 'border-cinnabar'
          : status === 'new'
            ? 'border-line hover:border-line-strong'
            : 'border-line-strong hover:border-ink-faint',
      ].join(' ')}
    >
      <Link
        to={`/buoi-hoc/${encodeURIComponent(lesson.id)}${listQuery}`}
        aria-label={`${title}. ${spoken}.`}
        className="absolute top-0 right-0 bottom-0 left-0 rounded-[0.375rem]"
      />

      <div
        className="min-w-0 flex-1"
      >
        <div
          className="flex min-w-0 flex-wrap items-center"
        >
          <span
            className="mr-2 text-[0.875rem] font-semibold text-ink"
          >
            {title}
          </span>
          {current ? (
            <span
              className="mr-2 text-[0.6875rem] font-semibold tracking-wide text-cinnabar uppercase"
            >
              Bạn đang ở đây
            </span>
          ) : null}
          {known ? <Chip tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Chip> : null}
        </div>

        {preview.length > 0 ? (
          <p
            lang="zh-Hans"
            aria-hidden="true"
            className="han mt-1 min-w-0 truncate text-[1.0625rem] text-ink-soft"
          >
            {preview.join(' ')}
            {lesson.wordIds.length > preview.length ? ' …' : ''}
          </p>
        ) : null}

        <div
          className="mt-1.5 flex min-w-0 items-center"
        >
          {/* Thanh tiến độ ở đây là hình vẽ thuần: số liệu đã có trong nhãn liên
              kết ngay trên, thêm một progressbar nữa chỉ làm trình đọc nói hai lần. */}
          <span
            aria-hidden="true"
            className="mr-2 h-1 w-[4.5rem] shrink-0 overflow-hidden rounded-full bg-sunken"
          >
            <span
              style={{ width: `${percent}%` }}
              className={[
                'block h-full rounded-full',
                status === 'done' || status === 'review' ? 'bg-teal' : 'bg-cinnabar',
              ].join(' ')}
            />
          </span>
          <span
            aria-hidden="true"
            className="min-w-0 truncate text-[0.75rem] tabular-nums text-ink-faint"
          >
            {`${learned}/${total} từ`}
            {due > 0 ? ` · ${due} cần ôn` : ''}
          </span>
        </div>
      </div>

      {onToggleSave !== undefined ? (
        <span
          className="relative z-10 ml-2 shrink-0"
        >
          <IconButton
            icon={saved ? 'star-filled' : 'star'}
            label={saved ? `Bỏ lưu ${title}` : `Lưu ${title} vào sổ tay`}
            pressed={saved}
            pressedVariant="saved"
            iconSize={1.125}
            onClick={() => onToggleSave(lesson)}
          />
        </span>
      ) : null}
    </div>
  );
}
