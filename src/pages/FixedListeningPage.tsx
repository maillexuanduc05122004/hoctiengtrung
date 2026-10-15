/**
 * Trang "Nghe cố định": danh sách các bài nghe soạn sẵn.
 *
 * Mỗi bài là một bộ từ mới và câu ghép không đổi — nghe lại bao nhiêu lần cũng
 * đúng những mục đó, đúng thứ tự đó. Bài mới vào danh sách bằng cách thêm một
 * tệp `bai-NN.ts` (xem `npm run data:nghe`), nên trang chỉ việc liệt kê.
 */
import { Link } from 'react-router';
import { EmptyState } from '../components/ui/Feedback.tsx';
import { Icon } from '../components/ui/Icon.tsx';
import {
  FIXED_LISTENING_LESSONS,
  itemCount,
  type FixedListeningEntry,
} from '../features/fixed-listening/index.ts';

/** Số chữ Hán hiện ra làm nhận dạng của bài, vừa một dòng trên máy hẹp. */
const PREVIEW_ITEMS = 6;

export function FixedListeningPage() {
  return (
    <div
      className="mx-auto w-full max-w-[52rem] min-w-0"
    >
      <h1
        className="text-[1.375rem] font-semibold tracking-tight text-ink"
      >
        Nghe cố định
      </h1>
      <p
        className="mt-1 mb-5 text-[0.9375rem] text-ink-soft"
      >
        Bài nghe soạn sẵn, không đổi: mở lúc nào cũng đúng những từ và câu đó, đúng thứ tự đó.
      </p>

      {FIXED_LISTENING_LESSONS.length === 0 ? (
        <EmptyState
          icon="headphones"
          title="Chưa có bài nghe nào"
          description="Trong lúc chờ bài mới, nghe câu ghép từ chính vốn từ của bạn."
          action={
            <Link
              to="/cau-cua-toi"
              className="tap inline-flex items-center justify-center rounded-[0.375rem] border border-cinnabar bg-cinnabar px-5 py-3 font-medium text-paper no-underline transition-colors duration-150 hover:bg-cinnabar-ink"
            >
              Mở Câu của tôi
            </Link>
          }
        />
      ) : (
        <ul
          className="space-y-2"
        >
          {FIXED_LISTENING_LESSONS.map((lesson) => (
            <li key={lesson.id}>
              <LessonRow lesson={lesson} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LessonRow({ lesson }: { lesson: FixedListeningEntry }) {
  // Phần đầu thường là từ mới của bài: vài từ đó là cách nhận ra bài nhanh nhất.
  const firstItems = lesson.sections.length > 0 ? lesson.sections[0].items : [];
  const preview = firstItems.slice(0, PREVIEW_ITEMS).map((item) => item.hanzi);
  const parts = lesson.sections
    .map((section) => `${section.items.length} ${section.itemLabel.toLowerCase()}`)
    .join(' · ');

  return (
    <Link
      to={`/nghe-co-dinh/${encodeURIComponent(lesson.id)}`}
      aria-label={`Bài ${lesson.number}: ${lesson.title}. ${parts}${lesson.typing.length > 0 ? `, ${lesson.typing.length} câu gõ pinyin` : ''}.`}
      className="flex min-w-0 items-center rounded-[0.375rem] border border-line bg-surface px-3 py-2.5 no-underline transition-colors duration-150 hover:border-line-strong"
    >
      <div
        className="min-w-0 flex-1"
      >
        <p
          className="text-[0.875rem] font-semibold text-ink"
        >
          {`Bài ${lesson.number}`}
          <span
            className="ml-2 font-normal text-ink-soft"
          >
            {lesson.title}
          </span>
        </p>
        <p
          lang="zh-Hans"
          aria-hidden="true"
          className="han mt-1 min-w-0 truncate text-[1.0625rem] text-ink-soft"
        >
          {preview.join(' ')}
          {firstItems.length > preview.length ? ' …' : ''}
        </p>
        <p
          aria-hidden="true"
          className="mt-1 text-[0.75rem] tabular-nums text-ink-faint"
        >
          {`${parts} · ${itemCount(lesson)} mục`}
          {lesson.typing.length > 0 ? ` · ${lesson.typing.length} câu gõ pinyin` : ''}
        </p>
      </div>
      <span
        aria-hidden="true"
        className="ml-2 shrink-0 text-ink-faint"
      >
        <Icon name="chevron-right" size={1.125} />
      </span>
    </Link>
  );
}

export default FixedListeningPage;
