/**
 * Một bài nghe cố định.
 *
 * Trang chỉ lo khung: đường về danh sách, tên bài và lời giới thiệu giữ
 * nguyên từ tệp gốc, rồi lối sang bài trước / bài sau ở cuối để nghe xong
 * không phải quay lại danh sách. Toàn bộ phần nghe nằm trong
 * <FixedListeningPlayer>.
 */
import { Link, useParams } from 'react-router';
import { EmptyState } from '../components/ui/Feedback.tsx';
import { Icon } from '../components/ui/Icon.tsx';
import {
  FIXED_LISTENING_LESSONS,
  FixedListeningPlayer,
  findFixedLesson,
} from '../features/fixed-listening/index.ts';

const LIST_PATH = '/nghe-co-dinh';

export function FixedListeningLessonPage() {
  const { lessonId } = useParams();
  const lesson = findFixedLesson(lessonId);

  if (lesson === null) {
    return (
      <div
        className="mx-auto w-full max-w-[34rem] min-w-0"
      >
        <EmptyState
          icon="search"
          title="Không có bài nghe này"
          description="Đường dẫn có thể đã cũ hoặc bị gõ sai."
          action={
            <Link
              to={LIST_PATH}
              className="tap inline-flex items-center justify-center rounded-[0.375rem] border border-cinnabar bg-cinnabar px-5 py-3 font-medium text-paper no-underline transition-colors duration-150 hover:bg-cinnabar-ink"
            >
              Xem các bài nghe
            </Link>
          }
        />
      </div>
    );
  }

  const position = FIXED_LISTENING_LESSONS.findIndex((item) => item.id === lesson.id);
  const previous = position > 0 ? FIXED_LISTENING_LESSONS[position - 1] : null;
  const next =
    position >= 0 && position < FIXED_LISTENING_LESSONS.length - 1
      ? FIXED_LISTENING_LESSONS[position + 1]
      : null;

  return (
    <div
      className="mx-auto w-full max-w-[52rem] min-w-0"
    >
      <Link
        to={LIST_PATH}
        className="tap -ml-1 inline-flex items-center px-1 text-[0.8125rem] font-medium text-ink-soft no-underline transition-colors duration-150 hover:text-ink"
      >
        <span
          aria-hidden="true"
          className="mr-1"
        >
          <Icon name="chevron-left" size={1} />
        </span>
        Danh sách bài nghe
      </Link>

      <header
        className="mt-2 mb-5 min-w-0 border-b border-line pb-4"
      >
        <h1
          className="text-[1.375rem] font-semibold tracking-tight break-words text-ink"
        >
          {`Bài ${lesson.number} · ${lesson.title}`}
        </h1>
        {lesson.notes.map((note) => (
          <p
            key={note}
            className="mt-1 min-w-0 break-words text-[0.875rem] text-ink-soft"
          >
            {note}
          </p>
        ))}
      </header>

      {/* Khoá theo mã bài: sang bài khác thì mục đang chọn về lại mục đầu. */}
      <FixedListeningPlayer
        key={lesson.id}
        lesson={lesson}
      />

      {previous !== null || next !== null ? (
        <nav
          aria-label="Bài nghe khác"
          className="mt-6 flex justify-between border-t border-line pt-4"
        >
          {previous !== null ? (
            <Link
              to={`${LIST_PATH}/${encodeURIComponent(previous.id)}`}
              className="tap inline-flex items-center text-[0.9375rem] font-medium text-ink-soft no-underline hover:text-ink"
            >
              <span
                aria-hidden="true"
                className="mr-1"
              >
                <Icon name="chevron-left" size={1} />
              </span>
              {`Bài ${previous.number}`}
            </Link>
          ) : (
            <span />
          )}
          {next !== null ? (
            <Link
              to={`${LIST_PATH}/${encodeURIComponent(next.id)}`}
              className="tap inline-flex items-center text-[0.9375rem] font-medium text-ink-soft no-underline hover:text-ink"
            >
              {`Bài ${next.number}`}
              <span
                aria-hidden="true"
                className="ml-1"
              >
                <Icon name="chevron-right" size={1} />
              </span>
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}

export default FixedListeningLessonPage;
