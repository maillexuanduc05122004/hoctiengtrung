/**
 * Phần 2: luyện nghe câu.
 *
 * Mặc định mỗi câu chỉ có nút phát — không chữ Hán, không pinyin, không nghĩa.
 * Đó là yêu cầu cốt lõi của người học: nghe trước, tự đoán, rồi mới mở ra. Ba
 * nút Hán / Pinyin / Nghĩa mở riêng từng phần cho riêng câu đó, nên đoán được
 * chữ mà chưa đoán ra nghĩa thì chỉ cần mở đúng phần còn thiếu.
 *
 * Thanh "Mặc định hiện" đổi trạng thái ban đầu của cả danh sách. Đổi nó thì xoá
 * luôn các lần mở lẻ, vì giữ lại sẽ thành một trạng thái không ai đoán được:
 * chuyển sang "Chỉ nghe" mà vài câu vẫn hiện chữ.
 *
 * Bàn phím theo đúng thói quen người học đã quen: ↓ câu sau, ↑ câu trước, Enter
 * phát câu đang chọn.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, IconButton } from '../../components/ui/Button.tsx';
import { Segmented, type SegmentedOption } from '../../components/ui/Controls.tsx';
import { useSpeech } from '../../hooks/useSpeech.ts';
import { SENTENCE_LEVELS } from './corpus.ts';
import type { MySentence, SentenceLevel } from './corpus.ts';
import type { StoredSentence } from './store.ts';

type RevealMode = 'audio' | 'hanzi' | 'all';
type Field = 'hanzi' | 'pinyin' | 'vi';

const REVEAL_MODES: readonly SegmentedOption<RevealMode>[] = [
  { value: 'audio', label: 'Chỉ nghe' },
  { value: 'hanzi', label: 'Hiện chữ Hán' },
  { value: 'all', label: 'Hiện hết' },
];

const BASELINE: Record<RevealMode, Record<Field, boolean>> = {
  audio: { hanzi: false, pinyin: false, vi: false },
  hanzi: { hanzi: true, pinyin: false, vi: false },
  all: { hanzi: true, pinyin: true, vi: true },
};

const FIELD_LABELS: Record<Field, string> = {
  hanzi: 'Chữ Hán',
  pinyin: 'Pinyin',
  vi: 'Nghĩa',
};

export interface SentenceDrillProps {
  /** 90 câu có sẵn. */
  builtIn: readonly MySentence[];
  /** Câu người học tự thêm, mới nhất nằm cuối. */
  stored: readonly StoredSentence[];
  rate: number;
  onRemoveStored: (id: string) => void;
}

export function SentenceDrill({ builtIn, stored, rate, onRemoveStored }: SentenceDrillProps) {
  const [mode, setMode] = useState<RevealMode>('audio');
  const [overrides, setOverrides] = useState<Record<string, Partial<Record<Field, boolean>>>>({});
  const [currentId, setCurrentId] = useState<string | null>(null);
  const nodes = useRef(new Map<string, HTMLElement>());

  /** Thứ tự phẳng dùng cho phím ↑ ↓, đúng thứ tự đang hiện trên màn hình. */
  const order = useMemo(
    () => [...builtIn.map((s) => s.id), ...stored.map((s) => s.id)],
    [builtIn, stored],
  );

  const changeMode = useCallback((next: RevealMode) => {
    setMode(next);
    setOverrides({});
  }, []);

  const toggleField = useCallback((id: string, field: Field, currentlyOpen: boolean) => {
    setOverrides((previous) => ({
      ...previous,
      [id]: { ...previous[id], [field]: !currentlyOpen },
    }));
  }, []);

  const move = useCallback(
    (step: number) => {
      if (order.length === 0) return;
      const at = currentId === null ? -1 : order.indexOf(currentId);
      // Chưa chọn câu nào mà bấm ↓ thì vào câu đầu, bấm ↑ thì vào câu cuối.
      const next = at < 0 ? (step > 0 ? 0 : order.length - 1) : at + step;
      if (next < 0 || next >= order.length) return;
      const id = order[next];
      setCurrentId(id);
      nodes.current.get(id)?.scrollIntoView({
        block: 'center',
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth',
      });
    },
    [currentId, order],
  );

  const all = useMemo(() => [...builtIn, ...stored], [builtIn, stored]);
  const { supported, speaking, speak, cancel } = useSpeech();

  const play = useCallback(
    (hanzi: string) => {
      if (speaking) cancel();
      void speak(hanzi, 'zh-CN', rate);
    },
    [cancel, rate, speak, speaking],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      // Đang gõ trong ô dán câu thì phím mũi tên thuộc về ô đó.
      const target = event.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) return;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        move(1);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        move(-1);
        return;
      }
      if (event.key === 'Enter' && currentId !== null) {
        const sentence = all.find((item) => item.id === currentId);
        if (sentence) {
          event.preventDefault();
          play(sentence.hanzi);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [all, currentId, move, play]);

  const register = useCallback((id: string, node: HTMLElement | null) => {
    if (node === null) nodes.current.delete(id);
    else nodes.current.set(id, node);
  }, []);

  /**
   * Chia câu theo cấp, kèm số thứ tự mở đầu của từng cấp. Số thứ tự phải đánh
   * liên tục qua cả ba cấp — người học nói "câu 47" là một câu duy nhất, không
   * phải câu thứ 47 của cấp nào đó — nên phải tính sẵn ở đây thay vì cộng dồn
   * một biến trong lúc dựng giao diện.
   */
  const { byLevel, levelStart } = useMemo(() => {
    const map = new Map<SentenceLevel, MySentence[]>();
    for (const sentence of builtIn) {
      const bucket = map.get(sentence.level);
      if (bucket) bucket.push(sentence);
      else map.set(sentence.level, [sentence]);
    }
    const starts = new Map<SentenceLevel, number>();
    let at = 0;
    for (const level of SENTENCE_LEVELS) {
      starts.set(level.level, at);
      at += map.get(level.level)?.length ?? 0;
    }
    return { byLevel: map, levelStart: starts };
  }, [builtIn]);

  return (
    <div>
      <div
        className="mb-4 border border-line rounded-[0.375rem] bg-surface px-3 py-2.5"
      >
        <Segmented
          legend="Mặc định hiện"
          options={REVEAL_MODES}
          value={mode}
          onChange={changeMode}
        />
        <p
          className="mt-2 text-[0.8125rem] text-ink-faint"
        >
          ↓ câu sau · ↑ câu trước · Enter phát câu đang chọn. Bấm vào một câu để chọn câu đó.
        </p>
      </div>

      {SENTENCE_LEVELS.map((level) => {
        const sentences = byLevel.get(level.level) ?? [];
        if (sentences.length === 0) return null;
        const start = levelStart.get(level.level) ?? 0;
        return (
          <section
            key={level.level}
            className="mb-8"
          >
            <h2
              className="mb-1 text-[1rem] font-semibold tracking-tight text-ink"
            >
              {level.title}
              <span
                className="ml-2 text-[0.8125rem] font-normal text-ink-faint"
              >
                {sentences.length} câu
              </span>
            </h2>
            <p
              className="mb-2.5 text-[0.8125rem] text-ink-faint"
            >
              {level.note}
            </p>
            <ul
              className="space-y-2"
            >
              {sentences.map((sentence, index) => (
                <li key={sentence.id}>
                  <SentenceCard
                    sentence={sentence}
                    number={start + index + 1}
                    mode={mode}
                    override={overrides[sentence.id]}
                    current={currentId === sentence.id}
                    speakerSupported={supported}
                    onSelect={() => setCurrentId(sentence.id)}
                    onPlay={() => play(sentence.hanzi)}
                    onToggleField={toggleField}
                    onRegister={register}
                  />
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {stored.length > 0 ? (
        <section
          className="mb-8"
        >
          <h2
            className="mb-1 text-[1rem] font-semibold tracking-tight text-ink"
          >
            Câu bạn tự thêm
            <span
              className="ml-2 text-[0.8125rem] font-normal text-ink-faint"
            >
              {stored.length} câu
            </span>
          </h2>
          <p
            className="mb-2.5 text-[0.8125rem] text-ink-faint"
          >
            Nằm trên máy này, không mất khi đặt lại tiến độ.
          </p>
          <ul
            className="space-y-2"
          >
            {stored.map((sentence, index) => (
              <li key={sentence.id}>
                <SentenceCard
                  sentence={sentence}
                  number={builtIn.length + index + 1}
                  mode={mode}
                  override={overrides[sentence.id]}
                  current={currentId === sentence.id}
                  speakerSupported={supported}
                  onSelect={() => setCurrentId(sentence.id)}
                  onPlay={() => play(sentence.hanzi)}
                  onToggleField={toggleField}
                  onRegister={register}
                  onRemove={() => onRemoveStored(sentence.id)}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

interface SentenceCardProps {
  sentence: MySentence;
  number: number;
  mode: RevealMode;
  override: Partial<Record<Field, boolean>> | undefined;
  current: boolean;
  speakerSupported: boolean;
  onSelect: () => void;
  onPlay: () => void;
  onToggleField: (id: string, field: Field, currentlyOpen: boolean) => void;
  onRegister: (id: string, node: HTMLElement | null) => void;
  onRemove?: () => void;
}

function SentenceCard({
  sentence,
  number,
  mode,
  override,
  current,
  speakerSupported,
  onSelect,
  onPlay,
  onToggleField,
  onRegister,
  onRemove,
}: SentenceCardProps) {
  const open = (field: Field): boolean => override?.[field] ?? BASELINE[mode][field];

  return (
    <article
      ref={(node) => onRegister(sentence.id, node)}
      onClick={onSelect}
      className={[
        'rounded-[0.375rem] border px-3 py-2.5 transition-colors duration-150',
        current ? 'border-cinnabar bg-cinnabar-soft' : 'border-line bg-surface',
      ].join(' ')}
    >
      <div
        className="flex items-start justify-between"
      >
        <div
          className="flex min-w-0 items-center"
        >
          <span
            className="mr-2.5 shrink-0 text-[0.75rem] tabular-nums text-ink-faint"
          >
            {number.toString().padStart(2, '0')}
          </span>
          <Button
            variant={current ? 'primary' : 'quiet'}
            icon="volume"
            disabled={!speakerSupported}
            onClick={onPlay}
          >
            Nghe câu
          </Button>
        </div>

        {onRemove ? (
          <IconButton
            icon="close"
            label={`Xoá câu ${sentence.hanzi}`}
            iconSize={1}
            onClick={onRemove}
          />
        ) : null}
      </div>

      {/*
        Ba nút mở nằm NGAY dưới nút nghe, trước cả phần nội dung. Xếp sau nội
        dung thì lúc chưa mở gì cả chúng trôi lên sát nút nghe rồi lại tụt xuống
        khi mở dần, khiến chỗ bấm nhảy liên tục.
      */}
      <div
        className="mt-2 flex flex-wrap"
      >
        {(['hanzi', 'pinyin', 'vi'] as const).map((field) => (
          <button
            key={field}
            type="button"
            aria-pressed={open(field)}
            onClick={() => onToggleField(sentence.id, field, open(field))}
            className={[
              'tap mr-1.5 mb-1.5 rounded-[0.375rem] border px-2.5 py-1 text-[0.8125rem] font-medium transition-colors duration-150',
              open(field)
                ? 'border-line-strong bg-sunken text-ink'
                : 'border-line bg-transparent text-ink-faint hover:text-ink-soft',
            ].join(' ')}
          >
            {open(field) ? 'Ẩn ' : 'Hiện '}
            {FIELD_LABELS[field]}
          </button>
        ))}
      </div>

      {open('hanzi') ? (
        <p
          className="han mt-1 text-[1.625rem] leading-snug text-ink"
        >
          {sentence.hanzi}
        </p>
      ) : null}

      {open('pinyin') ? (
        <p
          className="mt-1 text-[0.9375rem] text-ink-soft"
        >
          {sentence.pinyin === '' ? '— bản dán không có pinyin —' : sentence.pinyin}
        </p>
      ) : null}

      {open('vi') ? (
        <p
          className="mt-1 text-[0.9375rem] text-ink"
        >
          {sentence.vi === '' ? '— bản dán không có nghĩa —' : sentence.vi}
        </p>
      ) : null}
    </article>
  );
}
