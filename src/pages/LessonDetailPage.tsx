/**
 * Một buổi học.
 *
 * Trang này trả lời đúng một câu: bấm gì để bắt đầu. Trước đây nó bày bốn ô chế
 * độ giống hệt nhau nên câu hỏi bị đẩy ngược về phía người học ở đúng bước quan
 * trọng nhất. Nay có một nút chính duy nhất, nội dung nút đổi theo tình trạng
 * thật của buổi (còn từ mới, tới hẹn ôn, hay đã thuộc cả), ba cách luyện còn
 * lại lùi xuống hàng phụ.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { Button } from '../components/ui/Button.tsx';
import { EmptyState, Notice, ProgressBar, Spinner } from '../components/ui/Feedback.tsx';
import { Icon } from '../components/ui/Icon.tsx';
import { LiveMessage } from '../components/ui/LiveMessage.tsx';
import { STUDY_NAV } from '../components/navigation.ts';
import {
  SaveWordButton,
  saveWordMessage,
  WordRow,
  WordStatusChip,
  wordStatus,
} from '../features/shared/index.ts';
import { isLearned, useSavedLessonIds, useWordCards } from '../features/lessons/index.ts';
import { toggleStar } from '../db/index.ts';
import { useLiveMessage } from '../hooks/useLiveMessage.ts';
import { useSettings } from '../hooks/settings-context.ts';
import { useVocabulary } from '../hooks/vocabulary-context.ts';
import type { VocabularyWord } from '../types/vocabulary.ts';

export function LessonDetailPage() {
  const params = useParams();
  const location = useLocation();
  const lessonId = params.lessonId ?? '';
  const { index, loading, error } = useVocabulary();
  const { settings, update } = useSettings();
  const { message, token, announce } = useLiveMessage();

  const lesson = index.byLesson.get(lessonId) ?? null;

  const wordIds = useMemo(() => lesson?.wordIds ?? [], [lesson]);
  const { cards, loading: cardsLoading, readAt } = useWordCards(wordIds);
  const { ids: savedLessons, toggle: toggleSavedLesson } = useSavedLessonIds();
  const saved = savedLessons.has(lessonId);

  const words = useMemo(
    () =>
      wordIds
        .map((id) => index.byId.get(id))
        .filter((word): word is VocabularyWord => word !== undefined),
    [wordIds, index.byId],
  );

  // Ghi lại buổi vừa mở để lần sau danh sách buổi học mở đúng cấp này, thay vì
  // luôn rơi về HSK 1. Chỉ ghi khi thật sự đổi, tránh một lượt ghi kho mỗi lần vẽ.
  useEffect(() => {
    if (lesson === null || settings.lastLessonId === lesson.id) return;
    void update({ lastLessonId: lesson.id });
  }, [lesson, settings.lastLessonId, update]);

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
   * Lưu từ ghi thẳng xuống kho cục bộ, nhưng đọc lại cả buổi chỉ vì một ngôi sao
   * thì phí, nên giữ riêng phần vừa đổi và ưu tiên nó khi vẽ.
   */
  const [starOverrides, setStarOverrides] = useState<ReadonlyMap<string, boolean>>(
    () => new Map(),
  );

  const handleToggleStar = useCallback(
    async (word: VocabularyWord): Promise<void> => {
      try {
        const starred = await toggleStar(word.id);
        setStarOverrides((current) => new Map(current).set(word.id, starred));
        announce(saveWordMessage(word.simplified, starred));
      } catch {
        // Kho cục bộ bị chặn thì nói ra, đừng để ngôi sao đổi hình như thể đã lưu.
        announce('Không lưu được vào máy này. Kiểm tra quyền lưu dữ liệu của trình duyệt.');
      }
    },
    [announce],
  );

  const handleToggleLesson = useCallback((): void => {
    if (lesson === null) return;
    void toggleSavedLesson(lesson.id).then((nowSaved) => {
      announce(
        nowSaved
          ? `Đã lưu buổi ${lesson.index} vào sổ tay`
          : `Đã bỏ buổi ${lesson.index} khỏi sổ tay`,
      );
    });
  }, [lesson, toggleSavedLesson, announce]);

  const learned = useMemo(
    () => wordIds.reduce((count, id) => (isLearned(cards.get(id)) ? count + 1 : count), 0),
    [wordIds, cards],
  );
  // Đếm bằng đúng phép phân loại mà nhãn trạng thái của từng từ dùng, nếu không
  // thì đầu trang nói "6 từ tới hạn" trong khi bên dưới chỉ đếm được 4 chiếc chip.
  const due = useMemo(
    () =>
      wordIds.reduce(
        (count, id) => (wordStatus(cards.get(id), readAt) === 'due' ? count + 1 : count),
        0,
      ),
    [wordIds, cards, readAt],
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
  /*
    Danh sách buổi học giữ cấp và bộ lọc trên địa chỉ. Thẻ buổi học chuyển
    nguyên chuỗi đó sang đây, nên đường về chỉ việc dùng lại; thiếu thì lùi về
    đúng cấp của buổi này.
  */
  const backQuery = location.search === '' ? `?cap=${lesson.level}` : location.search;
  const remaining = total - learned;

  /*
    Nút chính nói đúng việc sắp làm chứ không nói tên chế độ. Nhưng cũng không
    hứa một phiên chỉ gồm N từ: phiên theo buổi luôn đi hết cả buổi, nên con số
    phải nằm ở dòng phụ như một lời mô tả tình trạng, không nằm trên nút như
    một lời hứa về nội dung phiên.
  */
  const primaryLabel =
    cardsLoading || remaining > 0
      ? learned === 0
        ? 'Bắt đầu buổi này'
        : 'Học tiếp buổi này'
      : 'Ôn lại buổi này';

  const primaryHint = cardsLoading
    ? `Cả buổi ${total} từ.`
    : remaining > 0
      ? `Cả buổi ${total} từ, còn ${remaining} từ bạn chưa thuộc.`
      : due > 0
        ? `Bạn đã thuộc cả ${total} từ, trong đó ${due} từ tới hẹn ôn hôm nay.`
        : `Bạn đã thuộc cả ${total} từ, chưa từ nào tới hẹn ôn.`;

  const otherModes = STUDY_NAV.filter((item) => item.to !== '/the');

  return (
    <div
      className="mx-auto w-full max-w-[52rem] min-w-0 space-y-5"
    >
      <div
        className="min-w-0"
      >
        {/* Mang theo cả neo lẫn bộ lọc đang bật: quay lại mà mất bộ lọc thì
            người học phải bấm lại đúng bộ lọc đó sau mỗi buổi. */}
        <Link
          to={`/buoi-hoc${backQuery}#buoi-${lesson.index}`}
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
        <div
          className="flex min-w-0 items-start justify-between"
        >
          <div
            className="min-w-0 pr-3"
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
          </div>
          <Button
            variant={saved ? 'saved' : 'secondary'}
            icon={saved ? 'star-filled' : 'star'}
            onClick={handleToggleLesson}
          >
            {saved ? 'Đã lưu' : 'Lưu buổi'}
          </Button>
        </div>

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

      <section
        aria-label="Bắt đầu luyện buổi này"
        className="min-w-0"
      >
        <Link
          to={`/the?lesson=${encodeURIComponent(lesson.id)}`}
          className="tap flex w-full min-w-0 items-center justify-center border border-cinnabar bg-cinnabar px-5 py-3 text-center text-[1rem] font-medium text-paper no-underline rounded-[0.375rem] transition-colors duration-150 hover:bg-cinnabar-ink"
        >
          {primaryLabel}
        </Link>
        <p
          className="mt-2 text-[0.8125rem] leading-relaxed text-ink-faint"
        >
          {`${primaryHint} Bắt đầu bằng lật thẻ để làm quen mặt chữ, rồi kiểm tra lại bằng ba cách dưới đây.`}
        </p>

        <p
          className="mt-4 text-[0.75rem] font-semibold tracking-wide text-ink-faint uppercase"
        >
          Luyện cách khác
        </p>
        <ul
          className="m-0 mt-2 grid list-none grid-cols-3 gap-2 p-0 xsm:grid-cols-1"
        >
          {otherModes.map((item) => (
            <li
              key={item.to}
              className="min-w-0"
            >
              <Link
                to={`${item.to}?lesson=${encodeURIComponent(lesson.id)}`}
                className="tap flex min-w-0 items-center justify-center border border-line-strong bg-surface px-3 py-2 text-[0.875rem] font-medium text-ink no-underline rounded-[0.375rem] transition-colors duration-150 hover:border-ink-faint hover:bg-sunken"
              >
                <span
                  aria-hidden="true"
                  className="mr-1.5 shrink-0"
                >
                  <Icon name={item.icon} size={1} />
                </span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <LiveMessage message={message} token={token} />

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
                    <SaveWordButton
                      word={word.simplified}
                      saved={starred}
                      onToggle={() => {
                        void handleToggleStar(word);
                      }}
                    />
                    {cardsLoading ? null : <WordStatusChip status={status} />}
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
