/**
 * Trình phát một bài nghe đoạn văn.
 *
 * Chạy như một bài nghe bình thường: bấm "Bắt đầu" một lần, bộ đọc đọc hết
 * đoạn 1, nghỉ `pauseSeconds` giây (mặc định 20) cho người học kịp nghĩ lại,
 * rồi tự sang đoạn 2, cứ thế tới hết bài. "Bỏ qua" sang ngay đoạn sau, kể cả
 * lúc đang đọc dở hay đang nghỉ; "Tạm dừng" giữ nguyên chỗ đang nghe — đang
 * đọc thì tiếp tục từ câu bị dừng, đang nghỉ thì giữ số giây còn lại.
 *
 * Đọc TỪNG CÂU chứ không đọc cả đoạn một lượt: Chrome hay cắt ngang câu nói dài
 * quá mười mấy giây, và đọc theo câu thì tô sáng được câu đang nghe.
 *
 * Mặc định ẩn lời để nghe thật; ba nút bật riêng chữ Hán, pinyin và nghĩa để
 * dò lại sau. Tốc độ đọc chọn ngay trên trang, đổi giữa chừng thì áp dụng từ
 * câu kế tiếp.
 *
 * Có `storageKey` thì nhớ đoạn đang nghe trên máy: bài dài nghe dở, lần sau mở
 * lại có nút "Tiếp đoạn N". Nghe hết bài thì quên đi để lần sau nghe từ đầu.
 *
 * Bộ đọc chỉ phát sau một thao tác của người học (nút "Bắt đầu"); các đoạn
 * sau tự phát nối tiếp trong cùng lượt nghe mà người học đã chủ động mở.
 */
import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';
import { Button } from '../../components/ui/Button.tsx';
import { Chip, Segmented } from '../../components/ui/Controls.tsx';
import { Notice } from '../../components/ui/Feedback.tsx';
import { Icon } from '../../components/ui/Icon.tsx';
import { useSpeech } from '../../hooks/useSpeech.ts';
import type { Passage, PassageParagraph, PassageSentence } from './types.ts';

/** Nghỉ ngắn giữa hai câu trong một đoạn, cho giống người đọc thật. */
const SENTENCE_GAP_MS = 600;
/** Nhịp cập nhật đồng hồ đếm ngược; đếm theo mốc thời gian nên nhịp lệch cũng không trôi giây. */
const TICK_MS = 250;

type RateValue = '0.6' | '0.75' | '0.9' | '1';

const RATE_OPTIONS: readonly { value: RateValue; label: string; srLabel: string }[] = [
  { value: '0.6', label: '0,6×', srLabel: 'Chậm, 0,6 lần' },
  { value: '0.75', label: '0,75×', srLabel: 'Vừa, 0,75 lần' },
  { value: '0.9', label: '0,9×', srLabel: 'Hơi nhanh, 0,9 lần' },
  { value: '1', label: '1×', srLabel: 'Bình thường, 1 lần' },
];

/** Như các trang HTML người học đã quen: 0,75×. */
const DEFAULT_RATE: RateValue = '0.75';

/**
 * `ready`: chưa nghe gì. `speaking`: đang đọc một đoạn. `waiting`: vừa đọc xong
 * một đoạn, đang nghỉ trước đoạn sau. `done`: đã đọc xong đoạn cuối.
 */
type Phase = 'ready' | 'speaking' | 'waiting' | 'done';

interface Visibility {
  hanzi: boolean;
  pinyin: boolean;
  vi: boolean;
}

export interface PassagePlayerProps {
  passage: Passage;
  /** Khoá lưu đoạn đang nghe dở trên máy; thiếu thì không nhớ gì. */
  storageKey?: string;
}

/** Vài môi trường (kể cả khi chạy kiểm thử) không có matchMedia, khi đó coi như không giảm chuyển động. */
function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Đoạn đã nghe dở lần trước; 0 khi chưa có, khi số lưu không còn hợp, hoặc khi kho bị chặn. */
function readSaved(key: string | undefined, total: number): number {
  if (key === undefined) return 0;
  try {
    const value = Number(window.localStorage.getItem(key));
    return Number.isInteger(value) && value > 0 && value < total ? value : 0;
  } catch {
    return 0;
  }
}

/** Ghi đoạn đang nghe; `null` hay đoạn đầu thì xoá, lần sau nghe từ đầu. */
function writeSaved(key: string | undefined, index: number | null): void {
  if (key === undefined) return;
  try {
    if (index === null || index === 0) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, String(index));
  } catch {
    // Kho bị chặn (duyệt ẩn danh, chặn dữ liệu trang) thì chỉ không nhớ được chỗ nghe dở.
  }
}

export function PassagePlayer({ passage, storageKey }: PassagePlayerProps) {
  const { supported, speak, cancel } = useSpeech();
  const total = passage.paragraphs.length;
  const last = total - 1;

  const [phase, setPhase] = useState<Phase>('ready');
  const [paused, setPaused] = useState(false);
  /**
   * Đoạn đang đọc; lúc nghỉ là đoạn VỪA đọc xong, để "Nghe lại" đọc lại đúng đoạn đó.
   * Mở trang thì là đoạn nghe dở lần trước (nếu có).
   */
  const [current, setCurrent] = useState(() => readSaved(storageKey, total));
  /** Câu đang đọc trong đoạn; -1 khi không đọc câu nào. */
  const [sentence, setSentence] = useState(-1);
  /** Số giây nghỉ còn lại trước đoạn sau. */
  const [remaining, setRemaining] = useState(0);
  const [heard, setHeard] = useState<ReadonlySet<number>>(() => new Set());
  const [rate, setRate] = useState<RateValue>(DEFAULT_RATE);
  const [visible, setVisible] = useState<Visibility>({ hanzi: false, pinyin: false, vi: false });

  /**
   * Mỗi lượt đọc hay lượt nghỉ mang một mã. Dừng, bỏ qua hay đọc lại đều đổi mã,
   * và vòng đọc cũ thấy mã đã khác thì tự thôi — không cần huỷ từng lời hứa.
   */
  const control = useRef({
    token: 0,
    timer: null as ReturnType<typeof setInterval> | null,
    rate: Number(DEFAULT_RATE),
    /** Chính trang này đang chiếm bộ đọc hay không, để lúc rời trang chỉ tắt tiếng của mình. */
    speaking: false,
  });
  const nodes = useRef(new Map<number, HTMLElement>());

  /** Chặn mọi lượt đang chạy (đọc hoặc nghỉ) và trả về mã của lượt mới. */
  const halt = useCallback((): number => {
    const ctl = control.current;
    ctl.token += 1;
    if (ctl.timer !== null) {
      clearInterval(ctl.timer);
      ctl.timer = null;
    }
    if (ctl.speaking) {
      ctl.speaking = false;
      cancel();
    }
    return ctl.token;
  }, [cancel]);

  // Rời trang giữa chừng thì tắt tiếng và đồng hồ, không để đoạn sau tự đọc ở trang khác.
  useEffect(() => () => void halt(), [halt]);

  function reveal(index: number): void {
    nodes.current.get(index)?.scrollIntoView({
      block: 'center',
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  }

  /** Nghỉ `seconds` giây rồi tự đọc đoạn `next`. */
  function startPause(next: number, seconds: number): void {
    const token = halt();
    const ctl = control.current;
    const deadline = Date.now() + seconds * 1000;
    setPhase('waiting');
    setPaused(false);
    setRemaining(seconds);
    ctl.timer = setInterval(() => {
      if (ctl.token !== token) return;
      const left = Math.ceil((deadline - Date.now()) / 1000);
      if (left > 0) {
        setRemaining(left);
        return;
      }
      void playFrom(next, 0);
    }, TICK_MS);
  }

  /** Đọc đoạn `index` bắt đầu từ câu `from`, xong thì nghỉ rồi sang đoạn sau. */
  async function playFrom(index: number, from: number): Promise<void> {
    const paragraph = passage.paragraphs[index];
    if (paragraph === undefined) return;
    const token = halt();
    const ctl = control.current;
    writeSaved(storageKey, index);
    setCurrent(index);
    setPhase('speaking');
    setPaused(false);
    setRemaining(0);
    if (from === 0) reveal(index);

    for (let s = from; s < paragraph.sentences.length; s += 1) {
      setSentence(s);
      ctl.speaking = true;
      await speak(paragraph.sentences[s].hanzi, 'zh-CN', ctl.rate);
      if (ctl.token !== token) return;
      ctl.speaking = false;
      if (s < paragraph.sentences.length - 1) {
        await wait(SENTENCE_GAP_MS);
        if (ctl.token !== token) return;
      }
    }

    setSentence(-1);
    setHeard((prev) => new Set(prev).add(index));
    if (index >= last) {
      writeSaved(storageKey, null);
      setPhase('done');
      return;
    }
    startPause(index + 1, passage.pauseSeconds);
  }

  function skip(): void {
    if (current >= last) {
      // Bỏ qua đoạn cuối là nghe xong bài.
      halt();
      writeSaved(storageKey, null);
      setSentence(-1);
      setPaused(false);
      setPhase('done');
      return;
    }
    void playFrom(current + 1, 0);
  }

  /** Nút bên trái: lúc chưa nghe mà có chỗ nghe dở thì nghe từ đầu, còn lại là đọc lại đoạn này. */
  function replay(): void {
    void playFrom(phase === 'ready' ? 0 : current, 0);
  }

  /** Nút chính: bắt đầu, tạm dừng, tiếp tục, hoặc nghe lại từ đầu tuỳ lúc. */
  function primary(): void {
    if (phase === 'ready') {
      void playFrom(current, 0);
    } else if (phase === 'done') {
      void playFrom(0, 0);
    } else if (!paused) {
      halt();
      setPaused(true);
    } else if (phase === 'speaking') {
      void playFrom(current, Math.max(0, sentence));
    } else {
      startPause(current + 1, remaining);
    }
  }

  function changeRate(value: RateValue): void {
    setRate(value);
    control.current.rate = Number(value);
  }

  const onKey = useEffectEvent((event: KeyboardEvent): void => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    // Đang gõ trong một ô, đang đứng trên một nút (Enter tự bấm nút đó rồi), hay
    // đang ở trong hộp tra từ, thì phím thuộc về chỗ đó.
    const target = event.target;
    if (target instanceof HTMLElement) {
      const tag = target.tagName;
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        tag === 'BUTTON' ||
        tag === 'A' ||
        target.isContentEditable
      ) {
        return;
      }
      if (target.closest('dialog, [role="dialog"]') !== null) return;
    }
    if (!supported) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      primary();
    } else if (event.key === 'ArrowRight' && (phase === 'speaking' || phase === 'waiting')) {
      event.preventDefault();
      skip();
    } else if (event.key === 'Escape' && !paused && (phase === 'speaking' || phase === 'waiting')) {
      halt();
      setPaused(true);
    }
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent): void => onKey(event);
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);

  const register = useCallback((index: number, node: HTMLElement | null) => {
    if (node === null) nodes.current.delete(index);
    else nodes.current.set(index, node);
  }, []);

  const running = phase === 'speaking' || phase === 'waiting';
  const anyVisible = visible.hanzi || visible.pinyin || visible.vi;
  const sentenceCount = passage.paragraphs[current]?.sentences.length ?? 0;

  const resuming = phase === 'ready' && current > 0;

  let status: string;
  if (resuming) {
    status = `Lần trước nghe tới đoạn ${current + 1}/${total}`;
  } else if (phase === 'ready') {
    status = `${total} đoạn · đọc xong mỗi đoạn nghỉ ${passage.pauseSeconds} giây`;
  } else if (phase === 'done') {
    status = `Đã nghe hết ${total} đoạn`;
  } else if (phase === 'speaking') {
    status = `${paused ? 'Đã tạm dừng · ' : ''}Đoạn ${current + 1}/${total} · câu ${Math.max(0, sentence) + 1}/${sentenceCount}`;
  } else {
    status = `${paused ? 'Đã tạm dừng · ' : ''}Nghỉ trước đoạn ${current + 2}/${total}`;
  }

  // Nhãn nút chính giữ ngắn để ba nút vừa một hàng trên máy 360px mà không xuống dòng.
  let primaryLabel: string;
  let primaryIcon: 'volume' | 'pause' | 'play' | 'refresh';
  if (phase === 'ready') {
    primaryLabel = resuming ? `Tiếp đoạn ${current + 1}` : 'Bắt đầu';
    primaryIcon = 'volume';
  } else if (phase === 'done') {
    primaryLabel = 'Từ đầu';
    primaryIcon = 'refresh';
  } else if (paused) {
    primaryLabel = 'Tiếp tục';
    primaryIcon = 'play';
  } else {
    primaryLabel = 'Tạm dừng';
    primaryIcon = 'pause';
  }

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
            Trình duyệt không có bộ đọc văn bản, hoặc chưa cài giọng tiếng Trung nào, nên bài nghe
            sẽ im lặng. Vẫn bật được chữ Hán, pinyin và nghĩa để đọc; muốn nghe thì mở bằng Chrome
            hoặc Safari bản mới, hoặc cài thêm giọng tiếng Trung trong cài đặt máy.
          </Notice>
        </div>
      ) : null}

      <div
        className="mb-5 grid grid-cols-1 gap-4 rounded-[0.375rem] border border-line bg-surface px-3 py-3"
      >
        <Segmented
          legend="Tốc độ đọc"
          options={RATE_OPTIONS}
          value={rate}
          onChange={changeRate}
        />
        <div
          className="min-w-0"
        >
          <p
            id="hien-loi"
            className="mb-1.5 text-[0.8125rem] font-medium text-ink-soft"
          >
            Hiện lời
          </p>
          <div
            role="group"
            aria-labelledby="hien-loi"
            className="grid grid-cols-3 gap-2"
          >
            <VisibilityButton
              label="Chữ Hán"
              on={visible.hanzi}
              onToggle={() => setVisible((v) => ({ ...v, hanzi: !v.hanzi }))}
            />
            <VisibilityButton
              label="Pinyin"
              on={visible.pinyin}
              onToggle={() => setVisible((v) => ({ ...v, pinyin: !v.pinyin }))}
            />
            <VisibilityButton
              label="Nghĩa"
              on={visible.vi}
              onToggle={() => setVisible((v) => ({ ...v, vi: !v.vi }))}
            />
          </div>
        </div>
      </div>

      <p
        className="mb-3 text-[0.8125rem] text-ink-faint"
      >
        Enter bắt đầu / tạm dừng · → bỏ qua sang đoạn sau · Esc tạm dừng. Nên nghe vài lượt với lời
        ẩn trước, rồi mới bật chữ để dò lại.
      </p>

      <ol
        className="space-y-2"
      >
        {passage.paragraphs.map((paragraph, index) => (
          <li key={index}>
            <ParagraphCard
              paragraph={paragraph}
              index={index}
              current={index === current && (phase !== 'ready' || resuming)}
              speakingSentence={index === current && phase === 'speaking' ? sentence : -1}
              paused={paused}
              heard={heard.has(index)}
              visible={visible}
              anyVisible={anyVisible}
              speakerSupported={supported}
              onPlay={(i) => void playFrom(i, 0)}
              onRegister={register}
            />
          </li>
        ))}
      </ol>

      {/*
        Thanh điều khiển dính ở đáy như "Nghe cố định": trên điện thoại chừa đúng
        chỗ thanh điều hướng, bóng màu nền lấp khe giữa hai thanh.
      */}
      <div
        className="sticky bottom-0 z-20 mt-6 min-w-0 border-t border-line bg-paper pt-2.5 pb-3 xsm:bottom-[calc(4.75rem+env(safe-area-inset-bottom))] xsm:shadow-[0_1.25rem_0_0_var(--color-paper)]"
      >
        <div
          className="mb-2 flex min-w-0 items-baseline justify-between"
        >
          <p
            role="status"
            aria-live="polite"
            className="min-w-0 truncate text-[0.8125rem] text-ink-soft"
          >
            {status}
          </p>
          {phase === 'waiting' ? (
            <span
              aria-hidden="true"
              className="ml-2 shrink-0 text-[0.9375rem] font-semibold tabular-nums text-ink"
            >
              {`${remaining} giây`}
            </span>
          ) : null}
        </div>
        {phase === 'waiting' ? (
          <div
            aria-hidden="true"
            className="mb-2.5 h-1 overflow-hidden rounded-full bg-sunken"
          >
            <div
              className="h-full bg-teal"
              style={{ width: `${(remaining / Math.max(1, passage.pauseSeconds)) * 100}%` }}
            />
          </div>
        ) : null}
        <div
          className="grid grid-cols-[auto_1fr_auto] gap-2"
        >
          {/* Trên điện thoại hai nút bên bỏ biểu tượng, nhường chỗ cho nhãn nút chính. */}
          <Button
            variant="secondary"
            disabled={!supported || (phase === 'ready' && !resuming)}
            onClick={replay}
          >
            <span
              className="mr-2 shrink-0 xsm:hidden"
            >
              <Icon name="refresh" size={1.125} />
            </span>
            {resuming ? 'Từ đầu' : 'Nghe lại'}
          </Button>
          <Button
            variant="primary"
            icon={primaryIcon}
            aria-label={phase === 'done' ? 'Nghe lại từ đầu' : undefined}
            disabled={!supported}
            onClick={primary}
          >
            {primaryLabel}
          </Button>
          <Button
            variant="secondary"
            disabled={!supported || !running}
            onClick={skip}
          >
            Bỏ qua
            <span
              className="ml-2 shrink-0 xsm:hidden"
            >
              <Icon name="skip" size={1.125} />
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}

function VisibilityButton({
  label,
  on,
  onToggle,
}: {
  label: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <Button
      variant={on ? 'saved' : 'secondary'}
      aria-pressed={on}
      onClick={onToggle}
      className="min-w-0"
    >
      {label}
    </Button>
  );
}

interface ParagraphCardProps {
  paragraph: PassageParagraph;
  index: number;
  current: boolean;
  /** Câu đang đọc của đoạn này, -1 nếu đoạn này không đang đọc. */
  speakingSentence: number;
  paused: boolean;
  heard: boolean;
  visible: Visibility;
  anyVisible: boolean;
  speakerSupported: boolean;
  onPlay: (index: number) => void;
  onRegister: (index: number, node: HTMLElement | null) => void;
}

function ParagraphCard({
  paragraph,
  index,
  current,
  speakingSentence,
  paused,
  heard,
  visible,
  anyVisible,
  speakerSupported,
  onPlay,
  onRegister,
}: ParagraphCardProps) {
  const label = `Đoạn ${index + 1}`;
  return (
    <article
      ref={(node) => onRegister(index, node)}
      aria-current={current ? 'true' : undefined}
      aria-label={label}
      className={[
        'rounded-[0.375rem] border px-3 py-2.5 transition-colors duration-150',
        current ? 'border-cinnabar bg-cinnabar-soft' : 'border-line bg-surface',
      ].join(' ')}
    >
      <div
        className="flex min-w-0 items-center justify-between"
      >
        <p
          className="flex min-w-0 items-center text-[0.875rem] font-semibold text-ink"
        >
          {label}
          <span
            className="ml-2 font-normal text-ink-faint"
          >
            {`${paragraph.sentences.length} câu`}
          </span>
          {speakingSentence >= 0 ? (
            <Chip
              tone={paused ? 'neutral' : 'cinnabar'}
              className="ml-2"
            >
              {paused ? 'Tạm dừng' : 'Đang đọc'}
            </Chip>
          ) : heard ? (
            <Chip
              tone="teal"
              className="ml-2"
            >
              Đã nghe
            </Chip>
          ) : null}
        </p>
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
      </div>

      {anyVisible ? (
        <div
          className="mt-2 space-y-2"
        >
          {paragraph.sentences.map((item, s) => (
            <SentenceLine
              key={s}
              sentence={item}
              active={s === speakingSentence}
              visible={visible}
            />
          ))}
        </div>
      ) : (
        <p
          className="mt-1 text-[0.8125rem] text-ink-faint"
        >
          Lời đang ẩn.
        </p>
      )}
    </article>
  );
}

function SentenceLine({
  sentence,
  active,
  visible,
}: {
  sentence: PassageSentence;
  active: boolean;
  visible: Visibility;
}) {
  return (
    <div
      className={[
        'rounded-[0.25rem] border-l-2 py-0.5 pl-2.5',
        active ? 'border-cinnabar bg-surface' : 'border-transparent',
      ].join(' ')}
    >
      {visible.hanzi ? (
        <p
          lang="zh-CN"
          className="han text-[1.375rem] leading-snug break-words text-ink"
        >
          {sentence.hanzi}
        </p>
      ) : null}
      {visible.pinyin ? (
        <p
          className="mt-0.5 text-[0.9375rem] break-words text-ink-soft"
        >
          {sentence.pinyin}
        </p>
      ) : null}
      {visible.vi ? (
        <p
          className="mt-0.5 text-[0.9375rem] break-words text-ink"
        >
          {sentence.vi}
        </p>
      ) : null}
    </div>
  );
}
