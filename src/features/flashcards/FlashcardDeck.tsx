/**
 * Chế độ lật thẻ.
 *
 * Bộ thẻ lo phần điều khiển phiên học: dựng hàng đợi qua useStudySession, lật
 * thẻ, chuyển thẻ bằng nút hoặc bằng vuốt, rồi gửi đánh giá của người học về
 * thuật toán lặp lại ngắt quãng.
 *
 * Vuốt chỉ là lối tắt: mọi việc vuốt làm được đều có nút bấm tương đương, và khi
 * người dùng bật giảm chuyển động thì phần vuốt tắt hẳn.
 */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { Button, IconButton } from '../../components/ui/Button.tsx';
import { EmptyState, Notice, Spinner } from '../../components/ui/Feedback.tsx';
import { DictionarySheet } from '../dictionary/DictionarySheet.tsx';
import { SessionSummary } from '../shared/SessionSummary.tsx';
import { SpeakerButton } from '../shared/SpeakerButton.tsx';
import { StudyHeader } from '../shared/StudyHeader.tsx';
import { StudyOptions, type StudyOptionsValue } from '../shared/StudyOptions.tsx';
import { useSettings } from '../../hooks/settings-context.ts';
import { useStudySession, type PoolKind } from '../../hooks/useStudySession.ts';
import type { AnswerVerdict } from '../../types/study.ts';
import type { HskLevel } from '../../types/vocabulary.ts';
import { Flashcard } from './Flashcard.tsx';

export interface FlashcardDeckProps {
  levels: readonly HskLevel[];
  pool: PoolKind;
  /** Chỉ dùng khi học theo buổi. */
  lessonId?: string;
  /** Tên buổi học, có giá trị thì bảng chọn cấp nhường chỗ cho tên buổi. */
  lessonLabel?: string;
  onOptionsChange: (next: StudyOptionsValue) => void;
  limit?: number;
}

/** Quãng vuốt tối thiểu để tính là chuyển thẻ. */
const SWIPE_THRESHOLD_REM = 4;

/**
 * Khoảng lặng sau mỗi lần chấm.
 *
 * Chấm xong là thẻ kế tiếp hiện ra ngay dưới ngón tay đang bấm, nên chạm hai lần
 * thật nhanh trên điện thoại sẽ chấm luôn một thẻ người học chưa kịp nhìn thấy.
 * Đọc xong một thẻ không thể nhanh hơn ngần này nên nuốt cú chạm thứ hai là an toàn.
 */
const RATE_LOCK_MS = 350;

/** Cỡ chữ gốc mặc định của trình duyệt, dùng khi không đọc được giá trị thật. */
const DEFAULT_ROOT_FONT_SIZE = 16;

const POOL_LABEL: Record<PoolKind, string> = {
  due: 'Từ cần ôn',
  new: 'Từ mới',
  starred: 'Từ đã đánh dấu',
  mixed: 'Trộn từ cần ôn và từ mới',
  lesson: 'Theo buổi học',
};

const EMPTY_TEXT: Record<PoolKind, { title: string; description: string }> = {
  due: {
    title: 'Không còn thẻ nào tới hạn ôn',
    description:
      'Ở các cấp đang chọn, mọi từ đã học đều chưa tới hẹn ôn lại. Bạn có thể học thêm từ mới, hoặc quay lại khi tới hẹn.',
  },
  new: {
    title: 'Hết từ mới ở các cấp đang chọn',
    description:
      'Mọi từ của các cấp này đều đã vào lịch ôn. Hãy chọn thêm cấp HSK khác, hoặc quay lại phần từ cần ôn.',
  },
  starred: {
    title: 'Chưa có từ nào được đánh dấu',
    description:
      'Bấm ngôi sao ở đầu trang khi gặp một từ khó, từ đó sẽ vào danh sách này. Trong lúc chờ, hãy học từ mới.',
  },
  mixed: {
    title: 'Chưa có thẻ nào để học',
    description:
      'Các cấp đang chọn không còn từ tới hạn ôn lẫn từ mới. Hãy chọn thêm cấp HSK hoặc quay lại sau.',
  },
  lesson: {
    title: 'Buổi học này chưa có thẻ nào',
    description:
      'Buổi học có thể chưa tải xong hoặc không còn từ nào. Bạn có thể chuyển sang học từ mới theo cấp.',
  },
};

/** Đọc cỡ chữ gốc để quy quãng vuốt từ px của con trỏ về rem của giao diện. */
function rootFontSizePx(): number {
  const size = Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize);
  return Number.isFinite(size) && size > 0 ? size : DEFAULT_ROOT_FONT_SIZE;
}

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/** Vài môi trường (kể cả khi chạy kiểm thử) không có matchMedia, khi đó coi như không giảm chuyển động. */
function reducedMotionMedia(): MediaQueryList | null {
  return typeof window.matchMedia === 'function' ? window.matchMedia(REDUCED_MOTION_QUERY) : null;
}

function subscribeReducedMotion(onChange: () => void): () => void {
  const media = reducedMotionMedia();
  if (media === null) return () => undefined;
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

function readReducedMotion(): boolean {
  return reducedMotionMedia()?.matches ?? false;
}

/** Theo dõi lựa chọn giảm chuyển động của hệ điều hành. */
function usePrefersReducedMotion(): boolean {
  // Đây là trạng thái nằm ngoài React nên đọc thẳng qua useSyncExternalStore,
  // vừa không cần effect vừa luôn khớp với giá trị thật lúc render.
  return useSyncExternalStore(subscribeReducedMotion, readReducedMotion, () => false);
}

type RatingTone = 'wrong' | 'close' | 'correct';

const RATING_TONES: Record<RatingTone, string> = {
  wrong: 'border-cinnabar/55 bg-surface text-cinnabar-ink hover:bg-cinnabar-soft',
  close: 'border-partial/55 bg-surface text-partial hover:bg-partial-soft',
  correct: 'border-teal bg-teal text-paper hover:bg-teal-ink',
};

interface RatingButtonProps {
  tone: RatingTone;
  label: string;
  disabled: boolean;
  onClick: () => void;
}

/**
 * Nút đánh giá trí nhớ.
 *
 * Viết riêng thay vì dùng <Button> vì ba nút này cần đúng ba màu trạng thái của
 * bảng màu, mà các biến thể sẵn có không có màu vàng đất và xanh ngọc.
 */
function RatingButton({ tone, label, disabled, onClick }: RatingButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        'tap flex w-full min-w-0 items-center justify-center border px-1.5 py-2 text-center',
        'text-[0.875rem] leading-tight font-medium rounded-[0.375rem] transition-colors duration-150',
        'disabled:cursor-not-allowed disabled:opacity-45',
        RATING_TONES[tone],
      ].join(' ')}
    >
      {label}
    </button>
  );
}

export function FlashcardDeck({
  levels,
  pool,
  lessonId,
  lessonLabel,
  onOptionsChange,
  limit = 20,
}: FlashcardDeckProps) {
  const { settings } = useSettings();
  const reduceMotion = usePrefersReducedMotion();
  const session = useStudySession({ mode: 'flashcards', levels, pool, lessonId, limit });
  const {
    queue,
    index,
    current,
    finished,
    loading,
    error,
    stats,
    starred,
    submit,
    skip,
    restart,
    toggleStar,
  } = session;

  // Trạng thái lật và trạng thái xem lại đều gắn với thẻ sinh ra chúng: đổi thẻ
  // là giá trị suy ra trở về mặc định, khỏi phải đặt lại bằng effect.
  const [flip, setFlip] = useState<{ wordId: string | null; open: boolean }>({
    wordId: null,
    open: false,
  });
  const [peek, setPeek] = useState<{ at: number; steps: number }>({ at: 0, steps: 0 });
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [dictionaryOpen, setDictionaryOpen] = useState(false);
  const [offsetRem, setOffsetRem] = useState(0);
  const [dragging, setDragging] = useState(false);

  const shownAt = useRef<number>(0);
  // Mốc của lần chấm gần nhất, để nhận ra cú chạm dính ngay sau đó.
  const ratedAt = useRef<number>(0);
  const drag = useRef<{ pointerId: number; x: number; y: number; unit: number } | null>(null);
  // Vuốt xong trình duyệt vẫn bắn một sự kiện click; cờ này để nuốt nó đi, nếu
  // không thì mỗi lần vuốt xong thẻ mới lại bị lật ngay.
  const swallowClick = useRef(false);

  // Số thẻ đang lùi lại để xem lại; 0 nghĩa là đang ở thẻ phải trả lời.
  const back = peek.at === index ? peek.steps : 0;
  const viewIndex = index - back;
  const word = queue[viewIndex] ?? null;
  const reviewing = back > 0 && word !== null;
  const wordId = word?.id ?? null;
  const flipped = flip.wordId === wordId && flip.open;

  // Sang thẻ khác thì tính lại thời gian trả lời từ đầu.
  useEffect(() => {
    shownAt.current = Date.now();
  }, [wordId]);

  const canGoPrevious = viewIndex > 0;

  const goPrevious = useCallback(() => {
    if (index - back <= 0) return;
    setPeek({ at: index, steps: back + 1 });
  }, [index, back]);

  const goNext = useCallback(() => {
    if (back > 0) {
      setPeek({ at: index, steps: back - 1 });
      return;
    }
    skip();
  }, [index, back, skip]);

  const rate = useCallback(
    (verdict: AnswerVerdict) => {
      // Đang xem lại thẻ cũ thì không chấm, tránh chấm nhầm sang thẻ hiện tại.
      if (current === null || back > 0) return;
      // Cú chạm thứ hai rơi vào thẻ kế tiếp chứ không phải thẻ vừa chấm, nên bỏ đi.
      const now = Date.now();
      if (now - ratedAt.current < RATE_LOCK_MS) return;
      ratedAt.current = now;
      const startedAt = shownAt.current;
      void submit({
        verdict,
        usedHint: false,
        given: '',
        expected: current.pinyin,
        elapsedMs: startedAt > 0 ? Math.max(0, now - startedAt) : 0,
      });
    },
    [current, back, submit],
  );

  const handleToggleStar = useCallback(() => {
    if (word === null) return;
    void toggleStar(word.id);
  }, [word, toggleStar]);

  const handleFlip = useCallback(() => {
    setFlip((previous) => ({
      wordId,
      open: !(previous.wordId === wordId && previous.open),
    }));
  }, [wordId]);

  // Bàn phím: phím cách hoặc Enter lật thẻ, hai phím mũi tên chuyển thẻ.
  useEffect(() => {
    if (dictionaryOpen || word === null) return undefined;

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target;
      // Bỏ qua khi tiêu điểm đang ở một thành phần tự xử lý phím.
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(target.tagName))
      ) {
        return;
      }

      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        handleFlip();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goPrevious();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goNext();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dictionaryOpen, word, handleFlip, goPrevious, goNext]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    swallowClick.current = false;
    // Vuốt là thao tác của ngón tay và bút; chuột đã có sẵn nút bấm.
    if (reduceMotion || event.pointerType === 'mouse' || word === null) return;
    drag.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      unit: rootFontSizePx(),
    };
    // Giữ con trỏ để vẫn nhận được sự kiện khi ngón tay ra ngoài thẻ.
    if (typeof event.currentTarget.setPointerCapture === 'function') {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const start = drag.current;
    if (start === null || start.pointerId !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    // Kéo dọc nhiều hơn ngang nghĩa là người dùng đang cuộn trang, nhường lại.
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > start.unit / 2) {
      drag.current = null;
      setDragging(false);
      setOffsetRem(0);
      return;
    }
    setDragging(true);
    setOffsetRem(dx / start.unit);
  };

  const finishDrag = (event: ReactPointerEvent<HTMLDivElement>, apply: boolean): void => {
    const start = drag.current;
    drag.current = null;
    setDragging(false);
    setOffsetRem(0);
    if (start === null || start.pointerId !== event.pointerId || !apply) return;

    const moved = (event.clientX - start.x) / start.unit;
    if (moved <= -SWIPE_THRESHOLD_REM) {
      swallowClick.current = true;
      goNext();
    } else if (moved >= SWIPE_THRESHOLD_REM) {
      swallowClick.current = true;
      goPrevious();
    }
  };

  const onClickCapture = (event: ReactMouseEvent<HTMLDivElement>): void => {
    if (!swallowClick.current) return;
    swallowClick.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  const levelList = [...levels];
  const empty = !loading && error === null && !finished && word === null;
  const showOptions = optionsOpen || empty;
  const fallbackPool: PoolKind = pool === 'new' ? 'due' : 'new';
  const fallbackLabel = pool === 'new' ? 'Chuyển sang Từ cần ôn' : 'Chuyển sang Từ mới';
  const subtitle =
    lessonLabel !== undefined && lessonLabel !== ''
      ? lessonLabel
      : `${POOL_LABEL[pool]} · HSK ${levelList.join(', ')}`;
  const isStarred = word !== null && starred.has(word.id);

  let body: ReactNode;

  if (error !== null) {
    body = (
      <Notice
        tone="error"
        title="Không mở được phiên học"
      >
        <p
          className="break-words"
        >
          {error}
        </p>
      </Notice>
    );
  } else if (loading) {
    body = <Spinner label="Đang chọn thẻ" />;
  } else if (finished) {
    body = (
      <SessionSummary
        stats={stats}
        onRestart={restart}
        extra={
          pool === 'new' ? null : (
            <Button
              variant="secondary"
              size="lg"
              icon="arrow-right"
              block
              onClick={() => onOptionsChange({ levels: levelList, pool: 'new' })}
            >
              Học tiếp từ mới
            </Button>
          )
        }
      />
    );
  } else if (word === null) {
    body = (
      <EmptyState
        icon="card"
        title={EMPTY_TEXT[pool].title}
        description={EMPTY_TEXT[pool].description}
        action={
          <Button
            variant="primary"
            icon="arrow-right"
            onClick={() => onOptionsChange({ levels: levelList, pool: fallbackPool })}
          >
            {fallbackLabel}
          </Button>
        }
      />
    );
  } else {
    body = (
      <div
        className="min-w-0"
      >
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(event) => finishDrag(event, true)}
          onPointerCancel={(event) => finishDrag(event, false)}
          onClickCapture={onClickCapture}
          className="min-w-0 touch-pan-y"
        >
          <Flashcard
            word={word}
            flipped={flipped}
            onFlip={handleFlip}
            displayMode={settings.displayMode}
            hidePinyin={settings.hidePinyin}
            showTraditional={settings.showTraditional}
            offsetRem={offsetRem}
            dragging={dragging}
            note={reviewing ? 'Đang xem lại' : undefined}
          />
        </div>

        <div
          className="mt-3 flex min-w-0 items-center justify-between"
        >
          <IconButton
            icon="chevron-left"
            label="Xem lại thẻ trước"
            disabled={!canGoPrevious}
            onClick={goPrevious}
          />
          <p
            className="min-w-0 px-2 text-center text-[0.8125rem] tabular-nums text-ink-faint"
          >
            {`Thẻ ${viewIndex + 1}/${queue.length}`}
          </p>
          <IconButton
            icon="chevron-right"
            label={reviewing ? 'Quay lại thẻ đang học' : 'Bỏ qua, sang thẻ sau'}
            onClick={goNext}
          />
        </div>

        {reduceMotion ? null : (
          <p
            className="mt-1.5 hidden text-center text-[0.75rem] text-ink-faint xsm:block"
          >
            Vuốt sang trái để sang thẻ sau, vuốt sang phải để xem lại thẻ trước.
          </p>
        )}
        <p
          className="mt-1.5 text-center text-[0.75rem] text-ink-faint xsm:hidden"
        >
          Phím cách hoặc Enter để lật thẻ, phím mũi tên trái phải để chuyển thẻ.
        </p>

        {reviewing ? (
          <p
            role="status"
            className="mt-2 min-w-0 break-words text-center text-[0.75rem] text-partial"
          >
            Đang xem lại thẻ đã trả lời nên chưa đánh giá được. Quay lại thẻ đang học để chấm.
          </p>
        ) : null}

        {/* Hàng nút dính đáy vùng cuộn, nâng lên trên thanh điều hướng của điện thoại. */}
        <div
          className="sticky bottom-0 z-20 mt-4 border-t border-line bg-paper pt-3 pb-3 xsm:bottom-[calc(4.75rem+env(safe-area-inset-bottom))]"
        >
          <div
            className="flex min-w-0 items-center justify-between"
          >
            <div
              className="flex items-center space-x-1.5"
            >
              <SpeakerButton
                text={word.simplified}
                label={`Nghe phát âm ${word.simplified}`}
              />
              <SpeakerButton
                text={word.simplified}
                slow
                label={`Nghe chậm hơn ${word.simplified}`}
              />
            </div>
            <Button
              variant="quiet"
              icon="search"
              onClick={() => setDictionaryOpen(true)}
            >
              Tra từ
            </Button>
          </div>

          <div
            className="mt-2 grid grid-cols-3 gap-2"
          >
            <RatingButton
              tone="wrong"
              label="Chưa nhớ"
              disabled={reviewing}
              onClick={() => rate('wrong')}
            />
            <RatingButton
              tone="close"
              label="Gần nhớ"
              disabled={reviewing}
              onClick={() => rate('close')}
            />
            <RatingButton
              tone="correct"
              label="Đã nhớ"
              disabled={reviewing}
              onClick={() => rate('correct')}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-w-0"
    >
      <StudyHeader
        title="Lật thẻ"
        done={stats.done}
        total={stats.total}
        subtitle={subtitle}
        right={
          <>
            <IconButton
              icon="flip"
              label={flipped ? 'Xem lại mặt trước' : 'Lật thẻ để xem nghĩa'}
              disabled={word === null}
              onClick={handleFlip}
            />
            <IconButton
              icon={isStarred ? 'star-filled' : 'star'}
              label={
                word === null
                  ? 'Đánh dấu từ'
                  : isStarred
                    ? `Bỏ đánh dấu từ ${word.simplified}`
                    : `Đánh dấu từ ${word.simplified}`
              }
              pressed={isStarred}
              disabled={word === null}
              onClick={handleToggleStar}
            />
            <IconButton
              icon="settings"
              label="Tùy chọn phiên học"
              pressed={optionsOpen}
              onClick={() => setOptionsOpen((value) => !value)}
            />
          </>
        }
      />

      {showOptions ? (
        <section
          aria-label="Tùy chọn phiên học"
          className="mt-4 border-b border-line pb-4"
        >
          <StudyOptions
            value={{ levels: levelList, pool }}
            onChange={onOptionsChange}
            lessonLabel={lessonLabel}
          />
        </section>
      ) : null}

      <div
        className="mt-4 min-w-0"
      >
        {body}
      </div>

      <DictionarySheet
        open={dictionaryOpen}
        onClose={() => setDictionaryOpen(false)}
      />
    </div>
  );
}
