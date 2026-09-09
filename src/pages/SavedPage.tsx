/**
 * Sổ tay.
 *
 * Trước trang này, mọi ngôi sao trong ứng dụng là một chiều: bấm lưu được nhưng
 * không có đường nào nhìn lại. Đây là đường ra đó, và nó gom đủ ba thứ người
 * học coi là "của mình":
 *
 * 1. Từ đã lưu — do người học tự chọn, giữ đến khi chính họ bỏ.
 * 2. Buổi đã lưu — để dành cả buổi cho lần sau.
 * 3. Vừa tra — máy tự ghi, chỉ giữ 300 dòng gần nhất.
 *
 * Hai loại đầu và loại thứ ba khác hẳn nhau về bản chất, nên trang nói thẳng
 * điều đó bằng chữ thay vì để người học tự đoán rồi mất từ mà không hiểu vì sao.
 */
import { useCallback, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router';
import { Segmented, type SegmentedOption } from '../components/ui/Controls.tsx';
import { EmptyState, Notice, Spinner } from '../components/ui/Feedback.tsx';
import { Icon } from '../components/ui/Icon.tsx';
import { LiveMessage } from '../components/ui/LiveMessage.tsx';
import { STUDY_NAV } from '../components/navigation.ts';
import { countLookups, setStar } from '../db/index.ts';
import { LookupHistory, WordDetailSheet } from '../features/dictionary/index.ts';
import { useSavedLessonIds, useSavedLessonRows } from '../features/lessons/index.ts';
import { SavedLessonList, SavedWordList, useSavedWords } from '../features/saved/index.ts';
import { saveWordMessage } from '../features/shared/index.ts';
import { useLiveMessage } from '../hooks/useLiveMessage.ts';
import { useVocabulary } from '../hooks/vocabulary-context.ts';
import type { SavedSort } from '../features/saved/index.ts';
import type { HskLevel, Lesson, VocabularyWord } from '../types/vocabulary.ts';

type Tab = 'tu' | 'buoi' | 'vua-tra';

type LevelKey = 'all' | '1' | '2' | '3';

const SORT_OPTIONS: readonly SegmentedOption<SavedSort>[] = [
  { value: 'moi-luu', label: 'Mới lưu' },
  { value: 'can-on', label: 'Cần ôn trước' },
  { value: 'theo-cap', label: 'Theo cấp' },
];

const LEVEL_BY_KEY: Record<LevelKey, HskLevel | 'all'> = {
  all: 'all',
  '1': 1,
  '2': 2,
  '3': 3,
};

/** Số dòng lịch sử tra từ hiện trên trang này. Đủ để nhìn lại vài ngày gần đây. */
const LOOKUP_ROWS = 30;

export function SavedPage() {
  const { loading, error } = useVocabulary();
  const { message, token, announce } = useLiveMessage();

  const [tab, setTab] = useState<Tab>('tu');
  const [levelKey, setLevelKey] = useState<LevelKey>('all');
  const [sort, setSort] = useState<SavedSort>('moi-luu');
  const [selected, setSelected] = useState<VocabularyWord | null>(null);

  const saved = useSavedWords({ level: LEVEL_BY_KEY[levelKey], sort });
  const { rows: savedLessons, loading: lessonsLoading } = useSavedLessonRows();
  // Đọc riêng số dòng lịch sử để biết nên vẽ danh sách hay lời mời tra từ.
  const lookupCount = useLiveQuery(countLookups, [], 0);
  const { ids: savedLessonIds, toggle: toggleSavedLesson } = useSavedLessonIds();

  const handleRemoveWord = useCallback(
    (word: VocabularyWord): void => {
      void setStar(word.id, false).then(
        () => announce(saveWordMessage(word.simplified, false)),
        () => announce('Không ghi được vào máy này.'),
      );
    },
    [announce],
  );

  const handleToggleLesson = useCallback(
    (lesson: Lesson): void => {
      void toggleSavedLesson(lesson.id).then((nowSaved) => {
        announce(
          nowSaved
            ? `Đã lưu buổi ${lesson.index} vào sổ tay`
            : `Đã bỏ buổi ${lesson.index} khỏi sổ tay`,
        );
      });
    },
    [toggleSavedLesson, announce],
  );

  const tabs = useMemo<readonly SegmentedOption<Tab>[]>(
    () => [
      {
        value: 'tu',
        label: saved.loading ? 'Từ' : `Từ ${saved.total}`,
        srLabel: `Từ đã lưu, ${saved.total} từ`,
      },
      {
        value: 'buoi',
        label: lessonsLoading ? 'Buổi học' : `Buổi học ${savedLessons.length}`,
        srLabel: `Buổi học đã lưu, ${savedLessons.length} buổi`,
      },
      { value: 'vua-tra', label: 'Vừa tra', srLabel: 'Các từ vừa tra gần đây' },
    ],
    [saved.loading, saved.total, lessonsLoading, savedLessons.length],
  );

  const levelOptions = useMemo<readonly SegmentedOption<LevelKey>[]>(() => {
    const levels: readonly LevelKey[] = ['1', '2', '3'];
    return [
      { value: 'all' as LevelKey, label: 'Tất cả', srLabel: 'Tất cả các cấp' },
      ...levels.map((key) => {
        const count = saved.byLevel.get(LEVEL_BY_KEY[key] as HskLevel) ?? 0;
        return {
          value: key,
          label: `HSK ${key} ${count}`,
          srLabel: `HSK ${key}, ${count} từ`,
        };
      }),
    ];
  }, [saved.byLevel]);

  // Ôn sổ tay không lọc theo cấp: đó là danh sách cá nhân, không phải một lát
  // cắt của bộ từ. Người lưu một từ HSK 3 rồi quay về học HSK 1 vẫn phải gặp nó.
  const studyLink = (path: string): string => `${path}?pool=starred`;

  return (
    <div
      className="mx-auto w-full max-w-[52rem] min-w-0 space-y-5"
    >
      <header
        className="min-w-0"
      >
        <h1
          className="text-[1.375rem] font-semibold tracking-tight text-ink"
        >
          Sổ tay
        </h1>
        <p
          className="mt-1 max-w-[36rem] text-[0.875rem] text-ink-soft"
        >
          Những từ và buổi học bạn tự chọn giữ lại. Tất cả nằm trong máy này.
        </p>
      </header>

      <Segmented
        legend="Xem mục nào"
        options={tabs}
        value={tab}
        onChange={setTab}
        hideLegend
      />

      {error !== null ? (
        <Notice
          tone="error"
          title="Không tải được dữ liệu từ vựng"
        >
          {error}
        </Notice>
      ) : null}

      <LiveMessage message={message} token={token} />

      {tab === 'tu' ? (
        loading || saved.loading ? (
          <Spinner label="Đang mở sổ tay" />
        ) : saved.total === 0 ? (
          <EmptyState
            icon="star"
            title="Sổ tay còn trống"
            description="Bấm ngôi sao khi gặp một từ khó — lúc lật thẻ, lúc gõ đáp án hay lúc tra từ — và từ đó sẽ nằm lại đây cho tới khi bạn tự bỏ."
            action={
              <Link
                to="/tra-tu"
                className="tap inline-flex items-center border border-line-strong bg-surface px-4 py-2 text-[0.9375rem] font-medium text-ink no-underline rounded-[0.375rem] transition-colors duration-150 hover:border-ink-faint"
              >
                Mở trang tra từ
              </Link>
            }
          />
        ) : (
          <>
            {/* Đường vào nguồn từ 'starred' — trước đây chỉ tới được bằng cách
                mở bảng tuỳ chọn ẩn trong một chế độ luyện. */}
            <section
              aria-label="Ôn các từ đã lưu"
              className="min-w-0 border-y border-line py-4"
            >
              {/* Nút không ghi `Ôn 63 từ đã lưu`: một phiên chỉ lấy khoảng hai chục
                  từ, lâu chưa ôn nhất trước, rồi phiên sau đi tiếp phần còn lại. Ghi
                  cả 63 lên nút là hứa một điều phiên học không làm. */}
              <Link
                to={studyLink('/the')}
                className="tap flex w-full min-w-0 items-center justify-center border border-cinnabar bg-cinnabar px-5 py-3 text-center text-[1rem] font-medium text-paper no-underline rounded-[0.375rem] transition-colors duration-150 hover:bg-cinnabar-ink"
              >
                Ôn các từ đã lưu
              </Link>
              <ul
                className="m-0 mt-2 grid list-none grid-cols-3 gap-2 p-0"
              >
                {STUDY_NAV.filter((item) => item.to !== '/the').map((item) => (
                  <li
                    key={item.to}
                    className="min-w-0"
                  >
                    <Link
                      to={studyLink(item.to)}
                      className="tap flex min-w-0 items-center justify-center border border-line-strong bg-surface px-2 py-2 text-[0.8125rem] font-medium text-ink no-underline rounded-[0.375rem] transition-colors duration-150 hover:border-ink-faint hover:bg-sunken"
                    >
                      <span
                        aria-hidden="true"
                        className="mr-1.5 shrink-0"
                      >
                        <Icon name={item.icon} size={1} />
                      </span>
                      {item.shortLabel ?? item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <p
                className="mt-2 text-[0.75rem] leading-snug text-ink-faint"
              >
                {`Mỗi phiên lấy khoảng hai chục từ, lâu chưa ôn nhất trước; phiên sau đi tiếp phần còn lại trong ${saved.total} từ.`}
              </p>
            </section>

            <div
              className="min-w-0 space-y-3"
            >
              <Segmented
                legend="Lọc theo cấp"
                options={levelOptions}
                value={levelKey}
                onChange={setLevelKey}
              />
              <Segmented
                legend="Sắp xếp"
                options={SORT_OPTIONS}
                value={sort}
                onChange={setSort}
              />
            </div>

            <SavedWordList
              words={saved.words}
              readAt={saved.readAt}
              onRemove={handleRemoveWord}
              onSelect={setSelected}
              empty={
                <EmptyState
                  icon="star"
                  title="Không có từ nào ở cấp này"
                  description="Chọn lại “Tất cả” để xem toàn bộ sổ tay."
                />
              }
            />
          </>
        )
      ) : null}

      {tab === 'buoi' ? (
        loading || lessonsLoading ? (
          <Spinner label="Đang mở sổ tay" />
        ) : (
          <SavedLessonList
            rows={savedLessons}
            savedIds={savedLessonIds}
            onToggleSave={handleToggleLesson}
            empty={
              <EmptyState
                icon="book"
                title="Chưa lưu buổi học nào"
                description="Bấm ngôi sao trên một buổi trong danh sách buổi học để để dành buổi đó."
                action={
                  <Link
                    to="/buoi-hoc"
                    className="tap inline-flex items-center border border-line-strong bg-surface px-4 py-2 text-[0.9375rem] font-medium text-ink no-underline rounded-[0.375rem] transition-colors duration-150 hover:border-ink-faint"
                  >
                    Mở danh sách buổi học
                  </Link>
                }
              />
            }
          />
        )
      ) : null}

      {tab === 'vua-tra' ? (
        <section
          className="min-w-0"
        >
          <p
            className="text-[0.8125rem] leading-relaxed text-ink-faint"
          >
            Máy tự ghi lại mỗi lần bạn mở chi tiết một từ, và chỉ giữ 300 từ gần nhất. Muốn giữ
            lâu dài thì bấm ngôi sao để đưa từ đó sang mục “Từ”.
          </p>
          <div
            className="mt-3"
          >
            {/* LookupHistory tự ẩn khi chưa có dòng nào, nên chỗ trống phải được
                lấp bằng một lối ra, không để lại một trang gần như trắng. */}
            {lookupCount === 0 ? (
              <EmptyState
                icon="search"
                title="Chưa tra từ nào"
                description="Mỗi lần bạn mở chi tiết một từ, từ đó sẽ được ghi lại ở đây."
                action={
                  <Link
                    to="/tra-tu"
                    className="tap inline-flex items-center border border-line-strong bg-surface px-4 py-2 text-[0.9375rem] font-medium text-ink no-underline rounded-[0.375rem] transition-colors duration-150 hover:border-ink-faint"
                  >
                    Mở trang tra từ
                  </Link>
                }
              />
            ) : (
              <LookupHistory
                limit={LOOKUP_ROWS}
                onSelect={setSelected}
              />
            )}
          </div>
        </section>
      ) : null}

      <WordDetailSheet
        word={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

export default SavedPage;
