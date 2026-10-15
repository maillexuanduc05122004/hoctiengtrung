/**
 * Tập gõ pinyin cho cả câu dài của một bài nghe cố định.
 *
 * Mỗi lần một câu: chữ Hán, nghĩa, những từ mới của bài có trong câu, và nút
 * nghe (đúng tốc độ của bài). Người học gõ pinyin của CẢ câu — dấu thanh bằng
 * số hay bằng dấu, viết liền hay cách đều được — rồi Enter để chấm. Kết quả
 * chỉ ra đúng âm tiết nào sai thanh hay sai âm, kèm đáp án đầy đủ.
 *
 * Câu dài dễ lạc giữa chừng nên dưới ô gõ luôn có số âm tiết đã gõ trên tổng
 * số. Hết lượt thì có nút gõ lại riêng những câu chưa đúng, để lượt sau chỉ
 * dồn vào chỗ còn vấp.
 */
import { useId, useMemo, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Button } from '../../components/ui/Button.tsx';
import { Segmented, type SegmentedOption } from '../../components/ui/Controls.tsx';
import { ProgressBar } from '../../components/ui/Feedback.tsx';
import { parsePinyin } from '../../lib/pinyin/index.ts';
import type { AnswerVerdict } from '../../types/study.ts';
import { DiffText } from '../shared/DiffText.tsx';
import { SpeakerButton } from '../shared/SpeakerButton.tsx';
import { VerdictBanner } from '../shared/VerdictBanner.tsx';
import { newWordsOf } from './registry.ts';
import { checkTyping, syllableCount, type TypingCheck } from './typing-check.ts';
import type { FixedListeningEntry } from './types.ts';

type ToneMode = 'co' | 'khong';

const TONE_MODES: readonly SegmentedOption<ToneMode>[] = [
  { value: 'co', label: 'Chấm cả thanh điệu' },
  { value: 'khong', label: 'Chỉ chấm âm' },
];

/** Kết quả một câu trong lượt: đã chấm, hoặc bỏ qua (tính là chưa đúng). */
type Outcome = AnswerVerdict | 'skipped';

const SKIPPED: TypingCheck = {
  verdict: 'wrong',
  diff: [],
  explanation: 'Đã bỏ qua câu này. Đọc kỹ đáp án rồi gõ lại ở lượt sau.',
};

export interface PinyinTypingDrillProps {
  lesson: FixedListeningEntry;
}

export function PinyinTypingDrill({ lesson }: PinyinTypingDrillProps) {
  const sentences = lesson.typing;
  const words = useMemo(() => newWordsOf(lesson), [lesson]);
  const inputId = useId();
  const hintId = `${inputId}-goi-y`;

  const [toneMode, setToneMode] = useState<ToneMode>('co');
  // Thứ tự câu của lượt đang làm: lượt đầu là cả bài, lượt sau có thể chỉ là câu chưa đúng.
  const [queue, setQueue] = useState<number[]>(() => sentences.map((_, i) => i));
  const [position, setPosition] = useState(0);
  const [input, setInput] = useState('');
  const [check, setCheck] = useState<TypingCheck | null>(null);
  const [outcomes, setOutcomes] = useState<ReadonlyMap<number, Outcome>>(() => new Map());
  // Tăng mỗi lần gõ lại một câu, để ô gõ dựng lại và nhận lại tiêu điểm.
  const [attempt, setAttempt] = useState(0);

  const finished = position >= queue.length;
  const index = finished ? -1 : queue[position];
  const sentence = index >= 0 ? sentences[index] : undefined;
  const tones = toneMode === 'co';

  const record = (outcome: Outcome): void => {
    setOutcomes((previous) => new Map(previous).set(index, outcome));
  };

  const grade = (): void => {
    if (sentence === undefined || input.trim() === '') return;
    const result = checkTyping(input, sentence, { tones });
    setCheck(result);
    record(result.verdict);
  };

  const next = (): void => {
    setPosition((value) => value + 1);
    setInput('');
    setCheck(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (check === null) grade();
    else next();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    // Enter là chấm; đang gõ dở trong bộ gõ (Telex, bộ gõ tiếng Trung) thì để Enter cho bộ gõ.
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (check === null) grade();
  };

  const skip = (): void => {
    setCheck(SKIPPED);
    record('skipped');
  };

  const retry = (): void => {
    setCheck(null);
    setInput('');
    setAttempt((value) => value + 1);
  };

  const changeToneMode = (value: ToneMode): void => {
    setToneMode(value);
    // Đang xem kết quả mà đổi cách chấm thì chấm lại ngay câu vừa gõ.
    if (sentence !== undefined && check !== null && check !== SKIPPED) {
      const result = checkTyping(input, sentence, { tones: value === 'co' });
      setCheck(result);
      record(result.verdict);
    }
  };

  const restart = (onlyMissed: boolean): void => {
    const missed = queue.filter((i) => outcomes.get(i) !== 'correct');
    setQueue(onlyMissed && missed.length > 0 ? missed : sentences.map((_, i) => i));
    setPosition(0);
    setInput('');
    setCheck(null);
    setOutcomes(new Map());
  };

  const tally = { correct: 0, close: 0, wrong: 0 };
  for (const outcome of outcomes.values()) {
    if (outcome === 'correct') tally.correct += 1;
    else if (outcome === 'close') tally.close += 1;
    else tally.wrong += 1;
  }

  const toolbar = (
    <div
      className="mb-4 flex flex-wrap items-end justify-between"
    >
      <span
        className="mr-4 mb-2"
      >
        <Segmented
          legend="Cách chấm"
          options={TONE_MODES}
          value={toneMode}
          onChange={changeToneMode}
        />
      </span>
      <span
        className="mb-2 w-[12rem] xsm:w-full"
      >
        <ProgressBar
          label="Đã làm"
          value={outcomes.size}
          max={queue.length}
          hint={`${outcomes.size}/${queue.length} câu · ${tally.correct} đúng`}
        />
      </span>
    </div>
  );

  if (sentence === undefined) {
    const missed = queue.length - tally.correct;
    return (
      <div
        className="min-w-0"
      >
        {toolbar}
        <section
          className="rounded-[0.375rem] border border-line bg-surface px-4 py-4"
        >
          <h2
            className="text-[1.0625rem] font-semibold tracking-tight text-ink"
          >
            {`Xong ${queue.length} câu`}
          </h2>
          <p
            className="mt-1 text-[0.9375rem] text-ink-soft"
          >
            {`${tally.correct} đúng · ${tally.close} gần đúng · ${tally.wrong} chưa đúng hoặc bỏ qua.`}
          </p>
          <div
            className="mt-4 flex flex-wrap"
          >
            {missed > 0 ? (
              <span
                className="mr-2 mb-2"
              >
                <Button
                  variant="primary"
                  icon="refresh"
                  autoFocus
                  onClick={() => restart(true)}
                >
                  {`Gõ lại ${missed} câu chưa đúng`}
                </Button>
              </span>
            ) : null}
            <span
              className="mb-2"
            >
              <Button
                variant={missed > 0 ? 'secondary' : 'primary'}
                icon="refresh"
                autoFocus={missed === 0}
                onClick={() => restart(false)}
              >
                Làm lại cả bài
              </Button>
            </span>
          </div>
        </section>
      </div>
    );
  }

  const total = syllableCount(sentence);
  const typed = input.trim() === '' ? 0 : (parsePinyin(input)?.length ?? null);
  // Theo thứ tự xuất hiện trong câu, để đối chiếu được ngay với dòng chữ Hán bên trên.
  const used = words
    .filter((word) => sentence.hanzi.includes(word))
    .sort((a, b) => sentence.hanzi.indexOf(a) - sentence.hanzi.indexOf(b));
  const last = position === queue.length - 1;

  return (
    <div
      className="min-w-0"
    >
      {toolbar}

      <article
        className="rounded-[0.375rem] border border-line bg-surface px-4 py-3"
      >
        <div
          className="flex items-start justify-between"
        >
          <p
            className="pt-2.5 text-[0.75rem] tabular-nums text-ink-faint"
          >
            {`Câu ${String(position + 1).padStart(2, '0')} / ${queue.length}`}
          </p>
          <span
            className="flex shrink-0"
          >
            <SpeakerButton
              text={sentence.hanzi}
              rate={lesson.rate}
              label="Nghe câu"
            />
            <SpeakerButton
              text={sentence.hanzi}
              rate={lesson.rate}
              slow
              label="Nghe chậm hơn"
            />
          </span>
        </div>
        <p
          lang="zh-CN"
          className="han mt-1 break-words text-[1.75rem] leading-snug text-ink"
        >
          {sentence.hanzi}
        </p>
        <p
          className="mt-1.5 text-[0.9375rem] text-ink-soft"
        >
          {sentence.vi}
        </p>
        {used.length > 0 ? (
          <p
            className="mt-1.5 text-[0.8125rem] text-ink-faint"
          >
            {'Từ mới trong câu: '}
            <span
              lang="zh-CN"
              className="han text-[0.9375rem] text-ink"
            >
              {used.join(' · ')}
            </span>
          </p>
        ) : null}
      </article>

      <form
        className="mt-4"
        onSubmit={handleSubmit}
      >
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-[0.875rem] font-medium text-ink"
        >
          Gõ pinyin của cả câu
        </label>
        <textarea
          // Mỗi câu một ô mới: tự nhận tiêu điểm, và không mang chữ của câu trước sang.
          key={`${position}-${index}-${attempt}`}
          id={inputId}
          value={input}
          rows={3}
          lang="zh-Latn-pinyin"
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          readOnly={check !== null}
          aria-describedby={hintId}
          placeholder="ví dụ: wo3 de shen1ti3 hen3 hao3 — hoặc wǒ de shēntǐ hěn hǎo"
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          className="block w-full resize-y rounded-[0.375rem] border border-line-strong bg-surface px-3 py-2 text-[1.0625rem] leading-relaxed text-ink read-only:bg-sunken"
        />
        <p
          id={hintId}
          className="mt-1 text-[0.8125rem] text-ink-faint"
        >
          <span
            className="tabular-nums"
          >
            {`${typed ?? '…'}/${total} âm tiết`}
          </span>
          {' · Thanh điệu gõ bằng số (hao3) hay dấu (hǎo) đều được; Enter để chấm.'}
        </p>

        {check !== null ? (
          <div
            className="mt-4"
          >
            <VerdictBanner
              verdict={check.verdict}
              explanation={check.explanation}
              expected={sentence.pinyin}
            >
              {check.diff.length > 0 && check.verdict !== 'correct' ? (
                <div
                  className="min-w-0"
                >
                  <p
                    className="mb-1 text-[0.8125rem] text-ink-faint"
                  >
                    Bạn gõ:
                  </p>
                  <DiffText diff={check.diff} />
                </div>
              ) : null}
            </VerdictBanner>
          </div>
        ) : null}

        <div
          className="mt-4 flex flex-wrap"
        >
          {check === null ? (
            <>
              <span
                className="mr-2 mb-2"
              >
                <Button
                  type="submit"
                  variant="primary"
                  icon="check"
                  disabled={input.trim() === ''}
                >
                  Chấm câu này
                </Button>
              </span>
              <span
                className="mb-2"
              >
                <Button
                  variant="ghost"
                  onClick={skip}
                >
                  Bỏ qua, xem đáp án
                </Button>
              </span>
            </>
          ) : (
            <>
              <span
                className="mr-2 mb-2"
              >
                <Button
                  type="submit"
                  variant="primary"
                  icon="arrow-right"
                  autoFocus
                >
                  {last ? 'Xem kết quả' : 'Câu tiếp'}
                </Button>
              </span>
              {check.verdict !== 'correct' ? (
                <span
                  className="mb-2"
                >
                  <Button
                    variant="secondary"
                    icon="refresh"
                    onClick={retry}
                  >
                    Gõ lại câu này
                  </Button>
                </span>
              ) : null}
            </>
          )}
        </div>
      </form>
    </div>
  );
}
