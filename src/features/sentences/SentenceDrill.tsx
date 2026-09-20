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
 * Câu AI KHÔNG BAO GIỜ nằm trong bộ rút ngẫu nhiên: chỉ câu có sẵn và câu tự
 * thêm mới được rút, còn MỌI câu AI luôn hiện đủ trong một mục riêng đặt đầu
 * tiên. Lý do nằm ở cơ chế thay bộ: "Tạo câu mới bằng AI" gửi `replaceAi`, máy
 * chủ bỏ bộ AI cũ rồi lưu bộ mới, nên kho AI chỉ còn đúng bộ gần nhất (~20
 * câu). Hiện đủ bộ đó thì sau F5 người học vẫn thấy nguyên bộ vừa tạo; nếu để
 * chúng lẫn vào bộ ngẫu nhiên thì chỉ vài câu lẻ lọt ra, người học tưởng "AI
 * không lưu" hay "câu mới giống câu cũ". Mục này mang tên "Câu AI vừa tạo" khi
 * bộ vừa về và người học chưa đổi bộ, còn lại là "Câu AI tạo"; khi bộ mới về
 * thì phần nghe tự cuộn lên đầu và đóng mọi phần đã mở, để người học thấy ngay
 * bộ mới ở trạng thái "chưa mở gì".
 *
 * Bộ đang xem luôn khớp kho: kho đổi (máy chủ trả mã thật thay bộ dự phòng mã
 * âm, hay người học xoá một câu) thì bỏ những mã không còn; trống hẳn mới rút
 * lại, hụt vài câu thì giữ nguyên chứ không rút bù, để bộ không đổi bất ngờ
 * giữa lúc đang nghe.
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
import { Chip, Segmented, type SegmentedOption } from '../../components/ui/Controls.tsx';
import { useSpeech } from '../../hooks/useSpeech.ts';
import type { Sentence, SentenceSource } from '../../lib/api/types.ts';
import { drawBatch, matchesQuery } from './batch.ts';

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

/** Ba cấp của bộ câu có sẵn, đúng cách chia người học đã yêu cầu. */
const LEVELS: readonly { level: 1 | 2 | 3; title: string; note: string }[] = [
  { level: 1, title: 'Cấp 1 — câu ngắn', note: '3–5 chữ, một chủ ngữ một hành động' },
  { level: 2, title: 'Cấp 2 — câu vừa', note: '5–7 chữ, thêm thời gian hoặc nơi chốn' },
  { level: 3, title: 'Cấp 3 — câu dài', note: '7–11 chữ, hai vế hoặc đủ giờ giấc' },
];

const SOURCE_CHIP: Record<SentenceSource, string | null> = {
  BUILTIN: null,
  AI: 'AI',
  MANUAL: 'Tự thêm',
};

const AI_DISABLED_HINT = 'Chưa cấu hình AI trên máy chủ';
/** Lời giải thích khi nút AI khoá vì máy chủ chưa trả lời, không phải vì thiếu AI. */
export const WAITING_HINT = 'Máy chủ đang thức dậy, chờ chút rồi thử lại';

const NO_IDS: readonly number[] = [];

export interface SentenceDrillProps {
  /** Mọi câu của người học: có sẵn, tự thêm và do AI viết. */
  sentences: readonly Sentence[];
  rate: number;
  /** Chuỗi trong ô tìm. Đang tìm thì hiện MỌI câu khớp, bỏ qua bộ ngẫu nhiên. */
  query: string;
  /** Xoá một câu tự thêm hoặc câu AI; câu có sẵn không xoá được. */
  onRemove: (id: number) => void;
  /** Máy chủ đã cấu hình AI chưa; chưa thì nút tạo câu bị khoá kèm lời giải thích. */
  aiEnabled: boolean;
  /**
   * Máy chủ chưa trả lời trong phiên này: câu đang hiện là bản chụp hay bộ dự
   * phòng, mã có thể là mã giả. Giấu nút xoá và khoá nút AI với lời giải thích
   * riêng, cho tới khi nơi gọi bỏ cờ này.
   */
  waiting?: boolean;
  onGenerate: () => void;
  generating: boolean;
  /**
   * Mã các câu AI vừa tạo ở lần bấm gần nhất. Mọi câu AI đằng nào cũng hiện đủ
   * ở mục đầu; mảng này chỉ quyết định mục đó mang tên "vừa tạo" (cho đến khi
   * người học đổi bộ hay đổi cỡ bộ) và, khi đổi sang một mảng MỚI không rỗng,
   * kéo phần nghe lên đầu ở trạng thái chưa mở gì. Nơi gọi phải giữ nguyên
   * tham chiếu mảng giữa hai lần tạo, vì cả "đã đổi bộ" lẫn "bộ mới về" đều
   * được nhận ra theo tham chiếu.
   */
  freshIds?: readonly number[];
}

/** Câu ở dạng bảng nghe dùng: mã chuỗi để dùng lại `drawBatch`, nghĩa ở trường `vi`. */
interface DrillSentence {
  key: string;
  id: number;
  hanzi: string;
  pinyin: string;
  vi: string;
  level: 1 | 2 | 3;
  source: SentenceSource;
}

interface Section {
  key: string;
  title: string;
  note: string;
  items: { sentence: DrillSentence; number: number }[];
}

export function SentenceDrill({
  sentences,
  rate,
  query,
  onRemove,
  aiEnabled,
  waiting = false,
  onGenerate,
  generating,
  freshIds = NO_IDS,
}: SentenceDrillProps) {
  const canGenerate = aiEnabled && !waiting;
  const generateHint = waiting ? WAITING_HINT : aiEnabled ? undefined : AI_DISABLED_HINT;
  const [mode, setMode] = useState<RevealMode>('audio');
  const [overrides, setOverrides] = useState<Record<string, Partial<Record<Field, boolean>>>>({});
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [size, setSize] = useState<BatchSize>(DEFAULT_SIZE);
  // Lô câu AI mà người học đã đổi bộ sau khi xem — so theo tham chiếu.
  const [dismissedFresh, setDismissedFresh] = useState<readonly number[] | null>(null);
  const nodes = useRef(new Map<string, HTMLElement>());
  const top = useRef<HTMLDivElement>(null);

  const pool = useMemo<DrillSentence[]>(
    () =>
      sentences.map((sentence) => ({
        key: String(sentence.id),
        id: sentence.id,
        hanzi: sentence.hanzi,
        pinyin: sentence.pinyin,
        vi: sentence.meaningVi,
        level: sentence.level,
        source: sentence.source,
      })),
    [sentences],
  );
  const poolIds = useMemo(() => pool.map((sentence) => sentence.key), [pool]);
  /**
   * Chỉ câu KHÔNG phải AI mới được rút vào bộ ngẫu nhiên. Câu AI luôn hiện đủ
   * ở mục riêng (xem đầu tệp), nên rút trúng chúng thì bộ hụt đi một câu mà
   * người học không hiểu vì sao — đây là nguồn duy nhất cho `drawBatch`.
   */
  const drawableIds = useMemo(
    () => pool.filter((sentence) => sentence.source !== 'AI').map((sentence) => sentence.key),
    [pool],
  );
  const aiCount = pool.length - drawableIds.length;

  // Bộ AI vừa về mà người học chưa đổi bộ: mục AI mang tên "vừa tạo".
  const showingFresh = dismissedFresh !== freshIds && freshIds.length > 0;

  // Rút bộ đầu tiên ngay lúc dựng, để lần vẽ đầu đã có câu chứ không nháy rỗng.
  const [batch, setBatch] = useState<Set<string>>(() =>
    drawBatch(drawableIds, Number(DEFAULT_SIZE)),
  );

  /*
    Giữ bộ đang xem khớp với kho. Kho đổi dưới chân bộ ở hai tình huống thật:
    máy chủ trả lời trong lúc đang hiện bộ dự phòng (mã âm bị thay bằng mã
    thật — không mã nào còn, nếu không rút lại thì bộ đang xem thành rỗng và
    màn hình nói "Không có câu nào khớp." dù kho có 90 câu), và người học xoá
    một câu (hụt đúng một mã). Trống hẳn thì rút lại; hụt vài câu thì chỉ bỏ
    mã đã mất, KHÔNG rút bù — rút bù là bộ đổi bất ngờ giữa lúc đang nghe.

    Làm ngay trong lúc vẽ chứ không trong effect: đây là "điều chỉnh state khi
    prop đổi" theo đúng mẫu React khuyên (dự án cũng cấm setState trong
    effect), và nhờ vậy không có một lần vẽ rỗng chớp lên trước khi bộ được
    rút lại. Chỉ đặt lại khi có mã thật sự mất, nên lần vẽ lại kế tiếp thấy
    mọi mã còn nguyên và dừng — không thành vòng lặp.
  */
  const poolIdSet = useMemo(() => new Set(poolIds), [poolIds]);
  if (size !== 'all') {
    const kept = [...batch].filter((id) => poolIdSet.has(id));
    if (kept.length !== batch.size) {
      setBatch(kept.length === 0 ? drawBatch(drawableIds, Number(size)) : new Set(kept));
    }
  }

  const searching = query.trim() !== '';

  const visible = useMemo(() => {
    if (searching) return pool.filter((sentence) => matchesQuery(sentence, query));
    if (size === 'all') return pool;
    return pool.filter((sentence) => sentence.source === 'AI' || batch.has(sentence.key));
  }, [batch, pool, query, searching, size]);

  /** Về trạng thái "chưa mở gì, chưa chọn gì" — dùng mỗi khi danh sách đổi hẳn. */
  const resetReveal = useCallback(() => {
    setOverrides({});
    setCurrentId(null);
  }, []);

  /*
    Bộ AI mới về (một mảng `freshIds` MỚI, không rỗng) thì người học phải thấy
    nó ngay: đóng mọi phần đã mở — câu mới cũng phải đoán trước rồi mới xem —
    và kéo lên đầu, nơi mục AI đứng. So theo tham chiếu mảng chứ không theo
    rỗng/không rỗng: hai lần tạo liên tiếp đều cho mảng không rỗng và vẫn phải
    làm cả hai lần. Mảng rỗng (tạo không ra câu nào) thì không có gì để xem
    nên đứng yên.

    Hai việc tách hai chỗ: đóng phần đã mở là đổi state nên làm ngay trong lúc
    vẽ (mẫu "điều chỉnh state khi prop đổi", nhớ mảng trước bằng state); cuộn
    là thao tác DOM nên phải chờ commit, tức là trong effect, nhớ mảng trước
    bằng ref. Lúc mới dựng thì cả hai đều đứng yên: không có "mảng trước" để
    so, và người học vừa mở thẻ nghe thì đang ở chỗ mình vừa bấm.
  */
  const [seenFresh, setSeenFresh] = useState(freshIds);
  if (seenFresh !== freshIds) {
    setSeenFresh(freshIds);
    if (freshIds.length > 0) resetReveal();
  }
  const scrolledFresh = useRef(freshIds);
  useEffect(() => {
    if (scrolledFresh.current === freshIds) return;
    scrolledFresh.current = freshIds;
    if (freshIds.length > 0) top.current?.scrollIntoView({ block: 'start' });
  }, [freshIds]);

  const reload = useCallback(() => {
    if (size === 'all') return;
    setBatch(drawBatch(drawableIds, Number(size), batch));
    setDismissedFresh(freshIds);
    resetReveal();
    // Bấm từ nút cuối danh sách thì phải đưa người học lên đầu bộ mới, nếu không
    // họ đứng ở cuối và tưởng nút không có tác dụng.
    top.current?.scrollIntoView({ block: 'start' });
  }, [batch, drawableIds, freshIds, resetReveal, size]);

  const changeSize = useCallback(
    (next: BatchSize) => {
      setSize(next);
      if (next !== 'all') setBatch(drawBatch(drawableIds, Number(next)));
      setDismissedFresh(freshIds);
      resetReveal();
    },
    [drawableIds, freshIds, resetReveal],
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

  /**
   * Chia câu đang hiện thành các mục: MỌI câu AI ở một mục đầu tiên (mang tên
   * "vừa tạo" khi bộ mới về và chưa đổi bộ), ba cấp của bộ có sẵn, rồi câu tự
   * thêm. Số thứ tự đánh liên tục qua mọi mục theo đúng thứ tự trên màn hình —
   * người học nói "câu 7" là một câu duy nhất trong bộ đang nghe, không phải
   * câu thứ 7 của một cấp.
   */
  const sections = useMemo<Section[]>(() => {
    const defs: { key: string; title: string; note: string; pick: (s: DrillSentence) => boolean }[] =
      [
        {
          key: 'ai',
          title: showingFresh ? 'Câu AI vừa tạo' : 'Câu AI tạo',
          note: showingFresh
            ? 'Vừa viết từ đúng những từ bạn đã học.'
            : 'Bộ AI gần nhất; bấm "Tạo câu mới bằng AI" là bộ khác thế chỗ.',
          pick: (s) => s.source === 'AI',
        },
        ...LEVELS.map((level) => ({
          key: `level-${level.level}`,
          title: level.title,
          note: level.note,
          pick: (s: DrillSentence) => s.source === 'BUILTIN' && s.level === level.level,
        })),
        {
          key: 'manual',
          title: 'Câu bạn tự thêm',
          note: 'Bạn dán vào từ một trợ lý khác.',
          pick: (s) => s.source === 'MANUAL',
        },
      ];
    let number = 0;
    return defs
      .map((def) => ({
        key: def.key,
        title: def.title,
        note: def.note,
        items: visible.filter(def.pick).map((sentence) => {
          number += 1;
          return { sentence, number };
        }),
      }))
      .filter((section) => section.items.length > 0);
  }, [showingFresh, visible]);

  /** Thứ tự phẳng dùng cho phím ↑ ↓, đúng thứ tự đang hiện trên màn hình. */
  const order = useMemo(
    () => sections.flatMap((section) => section.items.map((item) => item.sentence.key)),
    [sections],
  );

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
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) {
          return;
        }
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
        const sentence = visible.find((item) => item.key === currentId);
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

  const canReload = !searching && size !== 'all';

  // Nói đúng cách bộ được dựng: phần rút ngẫu nhiên chỉ lấy từ câu không phải
  // AI, còn câu AI thì hiện đủ — kẻo người học đếm 40 thẻ trong "bộ 20 câu"
  // rồi tưởng lỗi. Số câu rút = số đang hiện trừ câu AI (khi không tìm, mọi
  // câu AI đều đang hiện).
  const batchSummary =
    `Bộ ${visible.length - aiCount} câu rút ngẫu nhiên từ ${drawableIds.length} câu có sẵn` +
    (aiCount > 0 ? `, cộng ${aiCount} câu AI luôn hiện đủ.` : '.');

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
            className="mr-2 mb-2"
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
          {/*
            Nút AI nằm ngay cạnh "Đổi câu khác" vì đó là hai câu trả lời cho cùng
            một câu hỏi: "hết câu rồi, giờ nghe gì?". Lời giải thích đặt ở cả
            span bọc ngoài, vì nút bị khoá không nhận sự kiện chuột ở vài trình duyệt.
          */}
          <span
            title={generateHint}
            className="mb-2"
          >
            <Button
              variant="primary"
              icon="refresh"
              disabled={!canGenerate || generating}
              title={generateHint}
              onClick={onGenerate}
            >
              {generating ? 'AI đang viết câu…' : 'Tạo câu mới bằng AI'}
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
              : batchSummary}{' '}
          ↓ câu sau · ↑ câu trước · Enter phát câu đang chọn. Bấm vào một câu để chọn.
        </p>
      </div>

      {visible.length === 0 ? (
        <p
          className="text-[0.9375rem] text-ink-soft"
        >
          {pool.length === 0
            ? 'Chưa có câu nào. Bấm "Tạo câu mới bằng AI" hoặc sang thẻ Thêm từ & câu.'
            : 'Không có câu nào khớp.'}
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
              <li key={sentence.key}>
                <SentenceCard
                  sentence={sentence}
                  number={number}
                  mode={mode}
                  override={overrides[sentence.key]}
                  current={currentId === sentence.key}
                  speakerSupported={supported}
                  onSelect={() => setCurrentId(sentence.key)}
                  onPlay={() => play(sentence.hanzi)}
                  onToggleField={toggleField}
                  onRegister={register}
                  onRemove={
                    sentence.source === 'BUILTIN' || waiting
                      ? undefined
                      : () => onRemove(sentence.id)
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
  sentence: DrillSentence;
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
  const chip = SOURCE_CHIP[sentence.source];

  return (
    <article
      ref={(node) => onRegister(sentence.key, node)}
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
          {chip ? (
            <Chip
              tone={sentence.source === 'AI' ? 'teal' : 'neutral'}
              className="ml-2"
            >
              {chip}
            </Chip>
          ) : null}
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
            onClick={() => onToggleField(sentence.key, field, open(field))}
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
          {sentence.pinyin === '' ? '— câu này không có pinyin —' : sentence.pinyin}
        </p>
      ) : null}

      {open('vi') ? (
        <p
          className="mt-1 text-[0.9375rem] text-ink"
        >
          {sentence.vi === '' ? '— câu này không có nghĩa —' : sentence.vi}
        </p>
      ) : null}
    </article>
  );
}
