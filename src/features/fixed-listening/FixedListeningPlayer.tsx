/**
 * Trình phát một bài nghe cố định.
 *
 * Giữ đúng cách dùng của trang HTML gốc mà người học đã quen: mọi mục hiện
 * sẵn chữ Hán, pinyin và nghĩa; luôn có đúng một mục đang chọn, tô viền và tự
 * cuộn tới giữa màn hình khi đổi; ↓ mục sau, ↑ mục trước, Enter phát mục đang
 * chọn; đọc ở tốc độ cố định của bài (trang gốc là 0,75×), không theo cài đặt
 * chung — bài soạn sẵn cho đúng tốc độ đó.
 *
 * Khác trang gốc ở hai chỗ nhỏ. Thanh điều khiển dính ở ĐÁY chứ không ở đầu,
 * như mọi phiên luyện khác của ứng dụng, để ngón cái với tới trên điện thoại.
 * Và nút phát đổi thành nút dừng trong lúc đang đọc, giống nút loa ở mọi chỗ
 * khác, thay cho hai nút riêng; Esc cũng dừng.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../../components/ui/Button.tsx';
import { Notice } from '../../components/ui/Feedback.tsx';
import { Icon } from '../../components/ui/Icon.tsx';
import { useSpeech } from '../../hooks/useSpeech.ts';
import { speechOf } from './registry.ts';
import type { FixedListeningItem, FixedListeningLesson } from './types.ts';

/** Chữ Hán tới chừng này chữ là một từ: in to như mặt thẻ. Dài hơn là câu, in nhỏ lại. */
const SHORT_HANZI = 4;

interface FlatItem {
  item: FixedListeningItem;
  /** Nhãn kèm số thứ tự trong mục, ví dụ "Câu ghép 07". */
  label: string;
}

export interface FixedListeningPlayerProps {
  lesson: FixedListeningLesson;
}

/** Vài môi trường (kể cả khi chạy kiểm thử) không có matchMedia, khi đó coi như không giảm chuyển động. */
function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Vị trí trong thứ tự phẳng của mục đầu tiên mỗi phần. */
function sectionOffsets(lesson: FixedListeningLesson): number[] {
  const offsets: number[] = [];
  let start = 0;
  for (const section of lesson.sections) {
    offsets.push(start);
    start += section.items.length;
  }
  return offsets;
}

/** Tốc độ viết kiểu Việt: 0.75 thành "0,75". */
function formatRate(rate: number): string {
  return String(rate).replace('.', ',');
}

export function FixedListeningPlayer({ lesson }: FixedListeningPlayerProps) {
  const { supported, speaking, speak, cancel } = useSpeech();
  // Như trang gốc: mở ra là đã chọn sẵn mục đầu, Enter phát được ngay.
  const [current, setCurrent] = useState(0);
  const nodes = useRef(new Map<number, HTMLElement>());

  /** Thứ tự phẳng qua mọi mục, đúng thứ tự trên màn hình, dùng cho ↑ ↓. */
  const flat = useMemo<FlatItem[]>(
    () =>
      lesson.sections.flatMap((section) =>
        section.items.map((item, i) => ({
          item,
          label: `${section.itemLabel} ${String(i + 1).padStart(2, '0')}`,
        })),
      ),
    [lesson],
  );

  const offsets = useMemo(() => sectionOffsets(lesson), [lesson]);

  const play = useCallback(
    (index: number) => {
      const entry = flat[index];
      if (entry === undefined) return;
      setCurrent(index);
      if (speaking) cancel();
      void speak(speechOf(entry.item), 'zh-CN', lesson.rate);
    },
    [cancel, flat, lesson.rate, speak, speaking],
  );

  const move = useCallback(
    (step: number) => {
      if (flat.length === 0) return;
      const next = Math.max(0, Math.min(flat.length - 1, current + step));
      setCurrent(next);
      nodes.current.get(next)?.scrollIntoView({
        block: 'center',
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      });
    },
    [current, flat.length],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      // Đang gõ trong một ô, hay đang ở trong hộp tra từ, thì phím thuộc về chỗ đó.
      const target = event.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) {
          return;
        }
        if (target.closest('dialog, [role="dialog"]') !== null) return;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        move(1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        move(-1);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        play(current);
      } else if (event.key === 'Escape' && speaking) {
        cancel();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cancel, current, move, play, speaking]);

  const register = useCallback((index: number, node: HTMLElement | null) => {
    if (node === null) nodes.current.delete(index);
    else nodes.current.set(index, node);
  }, []);

  const selected = flat[current];

  return (
    <div
      className="min-w-0"
    >
      {!supported ? (
        <div
          className="mb-4"
        >
          <Notice
            tone="warn"
            title="Thiết bị này chưa đọc được tiếng Trung"
          >
            Trình duyệt không có bộ đọc văn bản, hoặc chưa cài giọng tiếng Trung nào, nên nút nghe
            sẽ im lặng. Chữ Hán, pinyin và nghĩa vẫn hiện đủ; muốn nghe thì mở bằng Chrome hoặc
            Safari bản mới, hoặc cài thêm giọng tiếng Trung trong cài đặt máy.
          </Notice>
        </div>
      ) : null}

      <p
        className="mb-4 text-[0.8125rem] text-ink-faint"
      >
        Đọc {formatRate(lesson.rate)}× · ↓ mục sau · ↑ mục trước · Enter phát mục đang chọn · Esc
        dừng. Bấm vào một mục để chọn.
      </p>

      {lesson.sections.map((section, s) => (
        <section
          key={`${s}-${section.title}`}
          className="mb-8"
        >
          <h2
            className="mb-2.5 text-[1rem] font-semibold tracking-tight text-ink"
          >
            {section.title}
          </h2>
          <ol
            className="space-y-2"
          >
            {section.items.map((item, i) => {
              const index = offsets[s] + i;
              return (
                <li key={index}>
                  <ItemCard
                    item={item}
                    label={flat[index].label}
                    index={index}
                    current={index === current}
                    speakerSupported={supported}
                    onSelect={setCurrent}
                    onPlay={play}
                    onRegister={register}
                  />
                </li>
              );
            })}
          </ol>
        </section>
      ))}

      {/*
        Thanh điều khiển dính ở đáy vùng cuộn, đặt SAU danh sách nên dính suốt
        từ đầu tới cuối bài. Trên điện thoại chừa đúng chỗ thanh điều hướng, và
        bóng màu nền lấp khe giữa hai thanh để chữ cuộn qua không lộ ra.
      */}
      {selected !== undefined ? (
        <div
          className="sticky bottom-0 z-20 mt-6 min-w-0 border-t border-line bg-paper pt-2.5 pb-3 xsm:bottom-[calc(4.75rem+env(safe-area-inset-bottom))] xsm:shadow-[0_1.25rem_0_0_var(--color-paper)]"
        >
          <p
            role="status"
            aria-live="polite"
            className="mb-2 truncate text-[0.8125rem] text-ink-soft"
          >
            <span
              className="tabular-nums"
            >
              {current + 1}/{flat.length}
            </span>
            {` · ${selected.label}`}
          </p>
          <div
            className="grid grid-cols-[auto_1fr_auto] gap-2"
          >
            <Button
              variant="secondary"
              icon="chevron-left"
              disabled={current === 0}
              onClick={() => move(-1)}
            >
              Trước
            </Button>
            <Button
              variant="primary"
              icon={speaking ? 'stop' : 'volume'}
              disabled={!supported}
              onClick={() => (speaking ? cancel() : play(current))}
            >
              {speaking ? 'Dừng' : 'Phát'}
            </Button>
            <Button
              variant="secondary"
              disabled={current === flat.length - 1}
              onClick={() => move(1)}
            >
              Tiếp
              <span
                className="ml-2 shrink-0"
              >
                <Icon name="chevron-right" size={1.125} />
              </span>
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

interface ItemCardProps {
  item: FixedListeningItem;
  label: string;
  index: number;
  current: boolean;
  speakerSupported: boolean;
  onSelect: (index: number) => void;
  onPlay: (index: number) => void;
  onRegister: (index: number, node: HTMLElement | null) => void;
}

function ItemCard({
  item,
  label,
  index,
  current,
  speakerSupported,
  onSelect,
  onPlay,
  onRegister,
}: ItemCardProps) {
  const short = [...item.hanzi].length <= SHORT_HANZI;

  return (
    <article
      ref={(node) => onRegister(index, node)}
      aria-current={current ? 'true' : undefined}
      onClick={() => onSelect(index)}
      className={[
        'flex items-start justify-between rounded-[0.375rem] border px-3 py-2.5 transition-colors duration-150',
        current ? 'border-cinnabar bg-cinnabar-soft' : 'border-line bg-surface',
      ].join(' ')}
    >
      <div
        className="min-w-0 pr-3"
      >
        <p
          className="text-[0.75rem] tabular-nums text-ink-faint"
        >
          {label}
        </p>
        <p
          lang="zh-CN"
          className={[
            'han mt-0.5 break-words text-ink',
            short ? 'text-[2rem]' : 'text-[1.625rem] leading-snug',
          ].join(' ')}
        >
          {item.hanzi}
        </p>
        {item.pinyin !== '' ? (
          <p
            className="mt-1 text-[0.9375rem] text-ink-soft"
          >
            {item.pinyin}
          </p>
        ) : null}
        {item.vi !== '' ? (
          <p
            className="mt-0.5 text-[0.9375rem] text-ink"
          >
            {item.vi}
          </p>
        ) : null}
      </div>
      <span
        className="shrink-0"
      >
        <Button
          variant={current ? 'primary' : 'quiet'}
          icon="volume"
          aria-label={`Nghe ${label}`}
          disabled={!speakerSupported}
          onClick={() => onPlay(index)}
        >
          Nghe
        </Button>
      </span>
    </article>
  );
}
