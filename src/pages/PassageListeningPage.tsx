/**
 * Trang "Nghe đoạn văn": nghe một câu chuyện ngắn chia đoạn, soạn từ vốn từ đã học.
 *
 * `/nghe-doan-van` mở thẳng bài mới nhất — đa số lần mở là để nghe bài đang
 * học, không cần qua một danh sách; `/nghe-doan-van/bai-NN` mở đúng bài đó.
 * Có từ hai bài trở lên thì cuối trang liệt kê các bài còn lại. Toàn bộ phần
 * nghe nằm trong <PassagePlayer>.
 */
import { Link, useParams } from 'react-router';
import { EmptyState } from '../components/ui/Feedback.tsx';
import { Icon } from '../components/ui/Icon.tsx';
import {
  findPassage,
  paragraphText,
  PassagePlayer,
  PASSAGES,
  type PassageEntry,
} from '../features/passage-listening/index.ts';

const BASE_PATH = '/nghe-doan-van';

export function PassageListeningPage() {
  const { passageId } = useParams();
  const passage = findPassage(passageId);

  if (passage === null) {
    return (
      <div
        className="mx-auto w-full max-w-[34rem] min-w-0"
      >
        <EmptyState
          icon="search"
          title={passageId === undefined ? 'Chưa có bài nghe đoạn văn nào' : 'Không có bài này'}
          description="Trong lúc chờ, nghe các bài từ mới và câu ghép soạn sẵn."
          action={
            <Link
              to="/nghe-co-dinh"
              className="tap inline-flex items-center justify-center rounded-[0.375rem] border border-cinnabar bg-cinnabar px-5 py-3 font-medium text-paper no-underline transition-colors duration-150 hover:bg-cinnabar-ink"
            >
              Mở Nghe cố định
            </Link>
          }
        />
      </div>
    );
  }

  const others = PASSAGES.filter((item) => item.id !== passage.id);

  return (
    <div
      className="mx-auto w-full max-w-[52rem] min-w-0"
    >
      <h1
        className="text-[1.375rem] font-semibold tracking-tight text-ink"
      >
        Nghe đoạn văn
      </h1>
      <p
        className="mt-1 mb-5 text-[0.9375rem] text-ink-soft"
      >
        {`Câu chuyện ngắn soạn từ những từ bạn đã học. Đọc xong mỗi đoạn nghỉ ${passage.pauseSeconds} giây rồi tự sang đoạn sau; bấm "Bỏ qua" để sang ngay.`}
      </p>

      <header
        className="mb-4 min-w-0 border-b border-line pb-4"
      >
        <p
          className="text-[0.75rem] tabular-nums text-ink-faint"
        >
          {`Bài ${passage.number} · ${passage.level} · ${passage.paragraphs.length} đoạn`}
        </p>
        <h2
          lang="zh-CN"
          className="han mt-0.5 text-[1.75rem] break-words text-ink"
        >
          {passage.title}
        </h2>
        <p
          className="mt-0.5 text-[0.9375rem] text-ink-soft"
        >
          {`${passage.titlePinyin} · ${passage.titleVi}`}
        </p>
      </header>

      {/* Khoá theo mã bài: sang bài khác thì lượt nghe cũ dừng hẳn, bắt đầu lại từ đoạn 1. */}
      <PassagePlayer
        key={passage.id}
        passage={passage}
      />

      {passage.words.length > 0 ? (
        <details
          className="mt-6 rounded-[0.375rem] border border-line bg-surface px-3 py-2.5"
        >
          <summary
            className="tap flex cursor-pointer items-center text-[0.9375rem] font-medium text-ink"
          >
            {`Từ đã học có trong bài (${passage.words.length})`}
          </summary>
          <ul
            className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 xsm:grid-cols-1"
          >
            {passage.words.map((word) => (
              <li
                key={word.hanzi}
                className="flex min-w-0 items-baseline"
              >
                <span
                  lang="zh-CN"
                  className="han shrink-0 text-[1.125rem] text-ink"
                >
                  {word.hanzi}
                </span>
                <span
                  className="ml-2 min-w-0 truncate text-[0.875rem] text-ink-soft"
                >
                  {`${word.pinyin} · ${word.vi}`}
                </span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {others.length > 0 ? (
        <nav
          aria-label="Bài nghe đoạn văn khác"
          className="mt-6 border-t border-line pt-4"
        >
          <h2
            className="mb-2.5 text-[1rem] font-semibold tracking-tight text-ink"
          >
            Bài khác
          </h2>
          <ul
            className="space-y-2"
          >
            {others.map((item) => (
              <li key={item.id}>
                <OtherPassage passage={item} />
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}

function OtherPassage({ passage }: { passage: PassageEntry }) {
  const first = passage.paragraphs[0];
  return (
    <Link
      to={`${BASE_PATH}/${encodeURIComponent(passage.id)}`}
      aria-label={`Bài ${passage.number}: ${passage.titleVi}`}
      className="flex min-w-0 items-center rounded-[0.375rem] border border-line bg-surface px-3 py-2.5 no-underline transition-colors duration-150 hover:border-line-strong"
    >
      <div
        className="min-w-0 flex-1"
      >
        <p
          className="text-[0.875rem] font-semibold text-ink"
        >
          {`Bài ${passage.number}`}
          <span
            lang="zh-CN"
            className="han ml-2 font-normal text-ink-soft"
          >
            {passage.title}
          </span>
        </p>
        {first !== undefined ? (
          <p
            lang="zh-CN"
            aria-hidden="true"
            className="han mt-1 min-w-0 truncate text-[0.9375rem] text-ink-faint"
          >
            {paragraphText(first)}
          </p>
        ) : null}
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

export default PassageListeningPage;
