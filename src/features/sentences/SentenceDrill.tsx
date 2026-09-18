/**
 * Phần 2: luyện nghe câu.
 *
 * Mặc định mỗi câu chỉ có nút phát — không chữ Hán, không pinyin, không nghĩa.
 * Đó là yêu cầu cốt lõi của người học: nghe trước, tự đoán, rồi mới mở ra. Ba
 * nút Hán / Pinyin / Nghĩa mở riêng từng phần cho riêng câu đó, nên đoán được
 * chữ mà chưa đoán ra nghĩa thì chỉ cần mở đúng phần còn thiếu.
 *
 * Không hiện cả kho một lúc mà rút một BỘ ngẫu nhiên (mặc định 20 câu). Nghe
 * hết bộ thì bấm "Đổi câu khác" để lấy bộ mới, không trùng bộ vừa nghe. Cuộn
 * qua 90 câu mỗi sáng thì đến câu 40 người học đã biết câu 41 là gì; rút ngẫu
 * nhiên thì không đoán trước được, đúng tinh thần luyện nghe.
 *
 * Thanh "Mặc định hiện" đổi trạng thái ban đầu của cả bộ. Đổi nó — hay đổi bộ
 * câu — thì xoá luôn các lần mở lẻ, vì giữ lại sẽ thành một trạng thái không
 * ai đoán được: chuyển sang "Chỉ nghe" mà vài câu vẫn hiện chữ.
 *
 * Bàn phím theo đúng thói quen người học đã quen: ↓ câu sau, ↑ câu trước, Enter
 * phát câu đang chọn.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, IconButton } from '../../components/ui/Button.tsx';
import { Segmented, type SegmentedOption } from '../../components/ui/Controls.tsx';
import { useSpeech } from '../../hooks/useSpeech.ts';
import { drawBatch, matchesQuery } from './batch.ts';
import { SENTENCE_LEVELS } from './corpus.ts';
import type { MySentence } from './corpus.ts';
import type { StoredSentence } from './store.ts';

type RevealMode = 'audio' | 'hanzi' | 'all';
type Field = 'hanzi' | 'pinyin' | 'vi';
type BatchSize = '10' | '20' | '30' | 'all';

const REVEAL_MODES: readonly SegmentedOption<RevealMode>[] = [
  { value: 'audio', label: 'Chỉ nghe' },
  { value: 'hanzi', label: 'Hiện chữ Hán' },
  { value: 'all', label: 'Hiện hết' },
];

const BATCH_SIZES: readonly SegmentedOption<BatchSize>[] = [
  { value: '10', label: '10' },
  { value: '20', label: '20' },
  { value: '30', label: '30' },
  { value: 'all', label: 'Tất cả' },
];

const DEFAULT_SIZE: BatchSize = '20';

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
  /** Chuỗi trong ô tìm. Đang tìm thì hiện MỌI câu khớp, bỏ qua bộ ngẫu nhiên. */
  query: string;
  onRemoveStored: (id: string) => void;
}

interface Section {
  key: string;
  title: string;
  note: string;
  items: { sentence: MySentence; number: number }[];
}

export function SentenceDrill({
  builtIn,
  stored,
  rate,
  query,
  onRemoveStored,
}: SentenceDrillProps) {
  const [mode, setMode] = useState<RevealMode>('audio');
  const [overrides, setOverrides] = useState<Record<string, Partial<Record<Field, boolean>>>>({});
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [size, setSize] = useState<BatchSize>(DEFAULT_SIZE);
  const nodes = useRef(new Map<string, HTMLElement>());
  const top = useRef<HTMLDivElement>(null);

  const pool = useMemo(() => [...builtIn, ...stored], [builtIn, stored]);
  const poolIds = useMemo(() => pool.map((sentence) => sentence.id), [pool]);

  // Rút bộ đầu tiên ngay lúc dựng, để lần vẽ đầu đã có câu chứ không nháy rỗng.
  const [batch, setBatch] = useState<Set<string>>(() => drawBatch(poolIds, Number(DEFAULT_SIZE)));

  const searching = query.trim() !== '';

  const visible = useMemo(() => {
    if (searching) return pool.filter((sentence) => matchesQuery(sentence, query));
    if (size === 'all') return pool;
    return pool.filter((sentence) => batch.has(sentence.id));
  }, [batch, pool, query, searching, size]);

  /** Thứ tự phẳng dùng cho phím ↑ ↓, đúng thứ tự đang hiện trên màn hình. */
  const order = useMemo(() => visible.map((sentence) => sentence.id), [visible]);

  /** Về trạng thái "chưa mở gì, chưa chọn gì" — dùng mỗi khi danh sách đổi hẳn. */
  const resetReveal = useCallback(() => {
    setOverrides({});
    setCurrentId(null);
  }, []);

  const reload = useCallback(() => {
    if (size === 'all') return;
    setBatch(drawBatch(poolIds, Number(size), batch));
    resetReveal();
    // Bấm từ nút cuối danh sách thì phải đưa người học lên đầu bộ mới, nếu không
    // họ đứng ở cuối và tưởng nút không có tác dụng.
    top.current?.scrollIntoView({ block: 'start' });
  }, [batch, poolIds, resetReveal, size]);

  const changeSize = useCallback(
    (next: BatchSize) => {
      setSize(next);
      if (next !== 'all') setBatch(drawBatch(poolIds, Number(next)));
      resetReveal();
    },
    [poolIds, resetReveal],
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
      // Đang gõ trong ô tìm hay ô dán câu thì phím thuộc về ô đó.
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
        const sentence = visible.find((item) => item.id === currentId);
        if (sentence) {
          event.preventDefault();
          play(sentence.hanzi);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentId, move, play, visible]);

  const register = useCallback((id: string, node: HTMLElement | null) => {
    if (node === null) nodes.current.delete(id);
    else nodes.current.set(id, node);
  }, []);

  /**
   * Chia câu đang hiện thành các mục: ba cấp của bộ có sẵn, rồi mục câu tự
   * thêm. Số thứ tự đánh liên tục qua mọi mục — người học nói "câu 7" là một
   * câu duy nhất trong bộ đang nghe, không phải câu thứ 7 của một cấp.
   */
  const sections = useMemo<Section[]>(() => {
    const storedIds = new Set(stored.map((sentence) => sentence.id));
    const numbered = visible.map((sentence, index) => ({ sentence, number: index + 1 }));
    const result: Section[] = SENTENCE_LEVELS.map((level) => ({
      key: `level-${level.level}`,
      title: level.title,
      note: level.note,
      items: numbered.filter(
        ({ sentence }) => !storedIds.has(sentence.id) && sentence.level === level.level,
      ),
    }));
    result.push({
      key: 'stored',
      title: 'Câu bạn tự thêm',
      note: 'Nằm trên máy này, không mất khi đặt lại tiến độ.',
      items: numbered.filter(({ sentence }) => storedIds.has(sentence.id)),
    });
    return result.filter((section) => section.items.length > 0);
  }, [stored, visible]);

  const canReload = !searching && size !== 'all';

  return (
    <div
      ref={top}
      className="scroll-mt-[4.5rem] xsm:scroll-mt-[8.5rem]"
    >
      <div
        className="mb-4 border border-line rounded-[0.375rem] bg-surface px-3 py-2.5"
      >
        <div
          className="flex flex-wrap items-end"
        >
          <span
            className="mr-4 mb-2"
          >
            <Segmented
              legend="Mặc định hiện"
              options={REVEAL_MODES}
              value={mode}
              onChange={changeMode}
            />
          </span>
          <span
            className="mr-4 mb-2"
          >
            <Segmented
              legend="Số câu mỗi bộ"
              options={BATCH_SIZES}
              value={size}
              onChange={changeSize}
            />
          </span>
          <span
            className="mb-2"
          >
            <Button
              variant="secondary"
              icon="refresh"
              disabled={!canReload}
              onClick={reload}
            >
              Đổi câu khác
            </Button>
          </span>
        </div>
        <p
          className="text-[0.8125rem] text-ink-faint"
        >
          {searching
            ? `Đang tìm — hiện mọi câu khớp trong ${pool.length} câu.`
            : size === 'all'
              ? `Hiện cả ${pool.length} câu.`
              : `Bộ ${visible.length} câu rút ngẫu nhiên từ ${pool.length} câu.`}{' '}
          ↓ câu sau · ↑ câu trước · Enter phát câu đang chọn. Bấm vào một câu để chọn.
        </p>
      </div>

      {visible.length === 0 ? (
        <p
          className="text-[0.9375rem] text-ink-soft"
        >
          Không có câu nào khớp.
        </p>
      ) : null}

      {sections.map((section) => (
        <section
          key={section.key}
          className="mb-8"
        >
          <h2
            className="mb-1 text-[1rem] font-semibold tracking-tight text-ink"
          >
            {section.title}
            <span
              className="ml-2 text-[0.8125rem] font-normal text-ink-faint"
            >
              {section.items.length} câu
            </span>
          </h2>
          <p
            className="mb-2.5 text-[0.8125rem] text-ink-faint"
          >
            {section.note}
          </p>
          <ul
            className="space-y-2"
          >
            {section.items.map(({ sentence, number }) => (
              <li key={sentence.id}>
                <SentenceCard
                  sentence={sentence}
                  number={number}
                  mode={mode}
                  override={overrides[sentence.id]}
                  current={currentId === sentence.id}
                  speakerSupported={supported}
                  onSelect={() => setCurrentId(sentence.id)}
                  onPlay={() => play(sentence.hanzi)}
                  onToggleField={toggleField}
                  onRegister={register}
                  onRemove={
                    section.key === 'stored' ? () => onRemoveStored(sentence.id) : undefined
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {/* Nghe xong bộ thì tay đang ở cuối trang; nút đổi bộ phải có ngay đó. */}
      {canReload && visible.length > 0 ? (
        <div
          className="flex justify-center border-t border-line pt-5"
        >
          <Button
            variant="primary"
            size="lg"
            icon="refresh"
            onClick={reload}
          >
            Đổi {size} câu khác
          </Button>
        </div>
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
          lang="zh-CN"
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
