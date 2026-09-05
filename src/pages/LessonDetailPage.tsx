import { useCallback, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { IconButton } from '../components/ui/Button.tsx';
import { Chip, type ChipProps } from '../components/ui/Controls.tsx';
import { EmptyState, Notice, ProgressBar, Spinner } from '../components/ui/Feedback.tsx';
import { Icon } from '../components/ui/Icon.tsx';
import { STUDY_NAV } from '../components/navigation.ts';
import { WordRow } from '../features/shared/index.ts';
import { isLearned, useWordCards } from '../features/lessons/index.ts';
import { toggleStar } from '../db/index.ts';
import { useSettings } from '../hooks/settings-context.ts';
import { useVocabulary } from '../hooks/vocabulary-context.ts';
import type { CardState } from '../types/study.ts';
import type { VocabularyWord } from '../types/vocabulary.ts';

/** Trạng thái ghi nhớ của một từ, đủ chi tiết để người học biết nên làm gì tiếp. */
type WordStatus = 'new' | 'learning' | 'due' | 'known';

const STATUS_LABEL: Record<WordStatus, string> = {
  new: 'Chưa học',
  learning: 'Đang học',
  due: 'Cần ôn',
  known: 'Đã nhớ',
};

const STATUS_TONE: Record<WordStatus, NonNullable<ChipProps['tone']>> = {
  new: 'neutral',
  learning: 'warn',
  due: 'cinnabar',
  known: 'teal',
};

function wordStatus(card: CardState | undefined, now: number): WordStatus {
  if (card === undefined || card.phase === 'new') return 'new';
  if (card.phase === 'learning' || card.phase === 'relearning') return 'learning';
  return card.dueAt <= now ? 'due' : 'known';
}

export function LessonDetailPage() {
  const params = useParams();
  const lessonId = params.lessonId ?? '';
  const { index, loading, error } = useVocabulary();
  const { settings } = useSettings();

  const lesson = index.byLesson.get(lessonId) ?? null;

  const wordIds = useMemo(() => lesson?.wordIds ?? [], [lesson]);
  const { cards, loading: cardsLoading, readAt } = useWordCards(wordIds);

  const words = useMemo(
    () =>
      wordIds
        .map((id) => index.byId.get(id))
        .filter((word): word is VocabularyWord => word !== undefined),
    [wordIds, index.byId],
  );

  // Các buổi cùng cấp giữ nguyên thứ tự trong dữ liệu gốc nên buổi trước và
  // buổi sau chỉ là hai ô liền kề, không cần sắp lại.
  const siblings = useMemo(
    () => (lesson === null ? [] : index.lessons.filter((item) => item.level === lesson.level)),
    [index.lessons, lesson],
  );
  const position = siblings.findIndex((item) => item.id === lessonId);
  const previous = position > 0 ? siblings[position - 1] : null;
  const next = position >= 0 && position < siblings.length - 1 ? siblings[position + 1] : null;

  /**
   * Đánh dấu sao ghi thẳng xuống kho cục bộ, nhưng đọc lại cả buổi chỉ vì một
   * ngôi sao thì phí, nên giữ riêng phần vừa đổi và ưu tiên nó khi vẽ.
   */
  const [starOverrides, setStarOverrides] = useState<ReadonlyMap<string, boolean>>(
    () => new Map(),
  );

  const handleToggleStar = useCallback(async (wordId: string): Promise<void> => {
    const starred = await toggleStar(wordId);
    setStarOverrides((current) => new Map(current).set(wordId, starred));
  }, []);

  const learned = useMemo(
    () => wordIds.reduce((count, id) => (isLearned(cards.get(id)) ? count + 1 : count), 0),
    [wordIds, cards],
  );

  if (loading) {
    return <Spinner label="Đang mở buổi học" />;
  }

  if (error !== null) {
    return (
      <Notice
        tone="error"
        title="Không tải được dữ liệu từ vựng"
      >
        {error}
      </Notice>
    );
  }

  if (lesson === null) {
    return (
      <EmptyState
        icon="book"
        title="Không tìm thấy buổi học này"
        description="Địa chỉ có thể đã cũ hoặc mã buổi học bị gõ sai."
        action={
          <Link
            to="/buoi-hoc"
            className="tap inline-flex items-center border border-line-strong bg-surface px-4 py-2 text-[0.9375rem] font-medium text-ink no-underline rounded-[0.375rem] transition-colors duration-150 hover:border-ink-faint"
          >
            Về danh sách buổi học
          </Link>
        }
      />
    );
  }

  const total = lesson.wordIds.length;

  return (
    <div
      className="min-w-0 space-y-5"
    >
      <div
        className="min-w-0"
      >
        <Link
          to={`/buoi-hoc?cap=${lesson.level}`}
          className="tap -ml-1 inline-flex items-center px-1 text-[0.8125rem] font-medium text-ink-soft no-underline transition-colors duration-150 hover:text-ink"
        >
          <span
            aria-hidden="true"
            className="mr-1"
          >
            <Icon name="chevron-left" size={1} />
          </span>
          Danh sách buổi học
        </Link>
      </div>

      <header
        className="min-w-0 border-b border-line pb-4"
      >
        <h1
          className="text-[1.375rem] font-semibold tracking-tight break-words text-ink"
        >
          {`Buổi ${lesson.index} · HSK ${lesson.level}`}
        </h1>
        <p
          className="mt-1 min-w-0 break-words text-[0.875rem] text-ink-soft"
        >
          {`${total} từ · `}
          <span
            lang="zh-Hans"
            className="han"
          >
            {`${lesson.range.from} → ${lesson.range.to}`}
          </span>
        </p>
        <div
          className="mt-3.5"
        >
          <ProgressBar
            value={learned}
            max={total}
            label="Đã học"
            hint={cardsLoading ? 'Đang đọc tiến độ' : `${learned}/${total} từ`}
            tone={learned === total ? 'teal' : 'cinnabar'}
          />
        </div>
      </header>

      <nav
        aria-label="Luyện tập buổi này"
        className="grid min-w-0 grid-cols-4 gap-2 xsm:grid-cols-2"
      >
        {STUDY_NAV.map((item) => (
          <Link
            key={item.to}
            to={`${item.to}?lesson=${encodeURIComponent(lesson.id)}`}
            className="tap flex min-w-0 flex-col items-center justify-center border border-line-strong bg-surface px-2 py-3 text-center text-ink no-underline rounded-[0.375rem] transition-colors duration-150 hover:border-ink-faint hover:bg-sunken"
          >
            <Icon name={item.icon} size={1.25} />
            <span
              className="mt-1.5 text-[0.8125rem] font-medium"
            >
              {item.label}
            </span>
          </Link>
        ))}
      </nav>

      <section
        className="min-w-0"
      >
        <h2
          className="border-b border-line pb-2 text-[0.75rem] font-semibold tracking-wide text-ink-faint uppercase"
        >
          Từ vựng trong buổi
        </h2>
        <ul
          className="min-w-0"
        >
          {words.map((word) => {
            const card = cards.get(word.id);
            const status = wordStatus(card, readAt);
            const starred = starOverrides.get(word.id) ?? card?.starred ?? false;
            return (
              <li
                key={word.id}
                className="min-w-0 border-b border-line"
              >
                <div
                  className="flex min-w-0 items-center"
                >
                  <div
                    className="min-w-0 flex-1"
                  >
                    <WordRow
                      word={word}
                      displayMode={settings.displayMode}
                      hidePinyin={settings.hidePinyin}
                      showTraditional={settings.showTraditional}
                    />
                  </div>
                  <div
                    className="ml-2 flex shrink-0 flex-col items-end space-y-1.5"
                  >
                    <IconButton
                      icon={starred ? 'star-filled' : 'star'}
                      label={
                        starred
                          ? `Bỏ đánh dấu từ ${word.simplified}`
                          : `Đánh dấu từ ${word.simplified}`
                      }
                      pressed={starred}
                      onClick={() => {
                        void handleToggleStar(word.id);
                      }}
                      className={starred ? 'text-cinnabar' : 'text-ink-faint'}
                    />
                    {cardsLoading ? null : (
                      <Chip tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Chip>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <nav
        aria-label="Chuyển buổi học"
        className="flex min-w-0 items-center justify-between border-t border-line pt-4"
      >
        {previous !== null ? (
          <Link
            to={`/buoi-hoc/${encodeURIComponent(previous.id)}`}
            className="tap inline-flex min-w-0 items-center border border-line-strong bg-surface px-3 py-2 text-[0.875rem] font-medium text-ink no-underline rounded-[0.375rem] transition-colors duration-150 hover:border-ink-faint"
          >
            <span
              aria-hidden="true"
              className="mr-1.5 shrink-0"
            >
              <Icon name="chevron-left" size={1} />
            </span>
            {`Buổi ${previous.index}`}
          </Link>
        ) : (
          <span
            aria-hidden="true"
          />
        )}

        {next !== null ? (
          <Link
            to={`/buoi-hoc/${encodeURIComponent(next.id)}`}
            className="tap inline-flex min-w-0 items-center border border-line-strong bg-surface px-3 py-2 text-[0.875rem] font-medium text-ink no-underline rounded-[0.375rem] transition-colors duration-150 hover:border-ink-faint"
          >
            {`Buổi ${next.index}`}
            <span
              aria-hidden="true"
              className="ml-1.5 shrink-0"
            >
              <Icon name="chevron-right" size={1} />
            </span>
          </Link>
        ) : (
          <span
            aria-hidden="true"
          />
        )}
      </nav>
    </div>
  );
}

export default LessonDetailPage;
