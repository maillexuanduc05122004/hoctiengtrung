/**
 * Trang "Nghe đoạn văn": nghe một câu chuyện chia đoạn, soạn từ vốn từ đã học.
 *
 * `/nghe-doan-van` mở thẳng bài mới nhất — đa số lần mở là để nghe bài đang
 * học, không cần qua một danh sách; `/nghe-doan-van/bai-NN` mở đúng bài đó.
 * Có từ hai bài trở lên thì đầu trang có hàng chọn bài. Đầu bài ghi rõ bài dùng
 * bao nhiêu từ đã học, để bài "dùng đủ mọi từ" thấy được là đủ thật. Toàn bộ
 * phần nghe nằm trong <PassagePlayer>.
 */
import { Link, useParams } from 'react-router';
import { Chip } from '../components/ui/Controls.tsx';
import { EmptyState } from '../components/ui/Feedback.tsx';
import {
  coverageOf,
  findPassage,
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

  const coverage = coverageOf(passage);
  const complete = coverage.missing.length === 0;
  const sentenceCount = passage.paragraphs.reduce((sum, p) => sum + p.sentences.length, 0);

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
        {`Câu chuyện soạn từ những từ bạn đã học. Đọc xong mỗi đoạn nghỉ ${passage.pauseSeconds} giây rồi tự sang đoạn sau; bấm "Bỏ qua" để sang ngay.`}
      </p>

      {PASSAGES.length > 1 ? (
        <nav
          aria-label="Chọn bài"
          className="mb-5"
        >
          <ul
            className="grid grid-cols-2 gap-2"
          >
            {PASSAGES.map((item) => (
              <li key={item.id}>
                <PassageTab
                  passage={item}
                  active={item.id === passage.id}
                />
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <header
        className="mb-4 min-w-0 border-b border-line pb-4"
      >
        <p
          className="text-[0.75rem] tabular-nums text-ink-faint"
        >
          {`Bài ${passage.number} · ${passage.level} · ${passage.paragraphs.length} đoạn · ${sentenceCount} câu`}
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
        <p
          className="mt-2"
        >
          <Chip
            tone={complete ? 'teal' : 'neutral'}
          >
            {complete
              ? `Dùng đủ ${coverage.used}/${coverage.total} từ đã học`
              : `Dùng ${coverage.used}/${coverage.total} từ đã học`}
          </Chip>
        </p>
      </header>

      {/* Khoá theo mã bài: sang bài khác thì lượt nghe cũ dừng hẳn, mở bài mới ở chỗ nghe dở của nó. */}
      <PassagePlayer
        key={passage.id}
        passage={passage}
        storageKey={`nghe-doan-van:${passage.id}`}
      />

      {passage.words.length > 0 ? (
        <details
          className="mt-6 rounded-[0.375rem] border border-line bg-surface px-3 py-2.5"
        >
          <summary
            className="tap flex cursor-pointer items-center text-[0.9375rem] font-medium text-ink"
          >
            {complete && passage.words.length === coverage.total
              ? `Toàn bộ từ đã học, đều có trong bài (${passage.words.length})`
              : `Từ đã học có trong bài (${passage.words.length})`}
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
    </div>
  );
}

function PassageTab({ passage, active }: { passage: PassageEntry; active: boolean }) {
  return (
    <Link
      to={`${BASE_PATH}/${encodeURIComponent(passage.id)}`}
      aria-current={active ? 'page' : undefined}
      className={[
        'block min-w-0 rounded-[0.375rem] border px-3 py-2 no-underline transition-colors duration-150',
        active ? 'border-cinnabar bg-cinnabar-soft' : 'border-line bg-surface hover:border-line-strong',
      ].join(' ')}
    >
      <span
        className="block text-[0.75rem] tabular-nums text-ink-faint"
      >
        {`Bài ${passage.number} · ${passage.paragraphs.length} đoạn`}
      </span>
      <span
        lang="zh-CN"
        className="han block truncate text-[1.0625rem] text-ink"
      >
        {passage.title}
      </span>
      <span
        className="block truncate text-[0.8125rem] text-ink-soft"
      >
        {passage.titleVi}
      </span>
    </Link>
  );
}

export default PassageListeningPage;
