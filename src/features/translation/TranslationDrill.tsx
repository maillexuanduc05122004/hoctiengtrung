/**
 * Dịch câu Việt → Trung.
 *
 * Mỗi lần một câu, lúc đầu CHỈ có câu tiếng Việt: người học tự suy ra câu tiếng
 * Trung rồi viết ra — bằng bộ gõ chữ Hán hay bằng pinyin đều được. Cần thì mở
 * dần gợi ý: trước là từ mới của bài có trong câu, sau là cả câu pinyin.
 *
 * Chấm hai lớp. Máy so ngay với đáp án mẫu (trùng là đúng, khỏi chờ). Lệch thì
 * nhờ AI xét lại, vì một câu tiếng Việt có nhiều cách dịch đúng mà đáp án mẫu
 * chỉ là một: AI nói câu của người học đúng hay sai, sửa sát theo câu đó và chỉ
 * ra từng lỗi. Máy chủ không có AI thì người học xem đáp án mẫu rồi tự chấm
 * bằng nút "Tôi dịch đúng".
 */
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { Button } from '../../components/ui/Button.tsx';
import { Notice, ProgressBar } from '../../components/ui/Feedback.tsx';
import { describeApiError } from '../../lib/api/client.ts';
import { checkTranslation } from '../../lib/api/endpoints.ts';
import type { TranslationCheckResponse } from '../../lib/api/types.ts';
import type { AnswerVerdict } from '../../types/study.ts';
import { DiffText } from '../shared/DiffText.tsx';
import { SpeakerButton } from '../shared/SpeakerButton.tsx';
import { VerdictBanner } from '../shared/VerdictBanner.tsx';
import type { PracticeSentence } from '../sentence-practice/pool.ts';
import type { TutorStatus } from '../sentence-practice/useTutorStatus.ts';
import { checkTranslationLocally, type LocalTranslationCheck } from './check.ts';

/** Tốc độ đọc đáp án mẫu, bằng tốc độ của các bài nghe cố định. */
const READ_RATE = 0.75;

type Outcome = AnswerVerdict | 'skipped';

type AiState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; result: TranslationCheckResponse }
  | { status: 'error'; message: string };

export interface TranslationDrillProps {
  sentences: readonly PracticeSentence[];
  tutor: TutorStatus;
  /** Bắt đầu lượt mới với những câu khác. */
  onNewRound: () => void;
}

export function TranslationDrill({ sentences, tutor, onNewRound }: TranslationDrillProps) {
  const inputId = useId();
  const hintId = `${inputId}-goi-y`;

  const [queue, setQueue] = useState<number[]>(() => sentences.map((_, i) => i));
  const [position, setPosition] = useState(0);
  const [input, setInput] = useState('');
  const [hints, setHints] = useState(0);
  const [local, setLocal] = useState<LocalTranslationCheck | null>(null);
  const [skipped, setSkipped] = useState(false);
  const [ai, setAi] = useState<AiState>({ status: 'idle' });
  const [selfCorrect, setSelfCorrect] = useState(false);
  const [outcomes, setOutcomes] = useState<ReadonlyMap<number, Outcome>>(() => new Map());
  const [hinted, setHinted] = useState<ReadonlySet<number>>(() => new Set());
  // Tăng mỗi lần viết lại một câu, để ô viết dựng lại và nhận lại tiêu điểm.
  const [attempt, setAttempt] = useState(0);
  const request = useRef<AbortController | null>(null);

  // Rời trang giữa lúc AI đang chấm thì huỷ luôn lượt gọi.
  useEffect(() => () => request.current?.abort(), []);

  const index = position < queue.length ? queue[position] : -1;
  const sentence = index >= 0 ? sentences[index] : undefined;
  const checked = local !== null || skipped;
  const aiAllowed = tutor.state !== 'off';

  const record = (outcome: Outcome): void => {
    setOutcomes((previous) => new Map(previous).set(index, outcome));
  };

  const askAi = (answer: string, target: PracticeSentence, fallback: AnswerVerdict): void => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setAi({ status: 'loading' });
    checkTranslation(
      { vi: target.vi, expectedHanzi: target.hanzi, expectedPinyin: target.pinyin, answer },
      controller.signal,
    )
      .then((result) => {
        if (controller.signal.aborted) return;
        setAi({ status: 'done', result });
        record(result.verdict);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setAi({ status: 'error', message: describeApiError(cause) });
        record(fallback);
      });
  };

  const grade = (): void => {
    const answer = input.trim();
    if (sentence === undefined || answer === '') return;
    const result = checkTranslationLocally(answer, sentence);
    setLocal(result);
    record(result.verdict);
    if (hints > 0) setHinted((previous) => new Set(previous).add(index));
    if (result.verdict !== 'correct' && aiAllowed) askAi(answer, sentence, result.verdict);
  };

  const reset = (): void => {
    request.current?.abort();
    setInput('');
    setHints(0);
    setLocal(null);
    setSkipped(false);
    setAi({ status: 'idle' });
    setSelfCorrect(false);
  };

  const next = (): void => {
    reset();
    setPosition((value) => value + 1);
  };

  const retry = (): void => {
    reset();
    setAttempt((value) => value + 1);
  };

  const skip = (): void => {
    request.current?.abort();
    setSkipped(true);
    record('skipped');
  };

  const markCorrect = (): void => {
    setSelfCorrect(true);
    record('correct');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (checked) next();
    else grade();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    // Đang chọn chữ trong bộ gõ tiếng Trung thì Enter là của bộ gõ.
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (!checked) grade();
  };

  const restart = (onlyMissed: boolean): void => {
    const missed = queue.filter((i) => outcomes.get(i) !== 'correct');
    reset();
    setQueue(onlyMissed && missed.length > 0 ? missed : sentences.map((_, i) => i));
    setPosition(0);
    setOutcomes(new Map());
    setHinted(new Set());
  };

  const tally = { correct: 0, close: 0, wrong: 0 };
  for (const outcome of outcomes.values()) {
    if (outcome === 'correct') tally.correct += 1;
    else if (outcome === 'close') tally.close += 1;
    else tally.wrong += 1;
  }

  const progress = (
    <div
      className="mb-4 w-[14rem] xsm:w-full"
    >
      <ProgressBar
        label="Đã làm"
        value={outcomes.size}
        max={queue.length}
        hint={`${outcomes.size}/${queue.length} câu · ${tally.correct} đúng`}
      />
    </div>
  );

  if (sentence === undefined) {
    const missed = queue.length - tally.correct;
    return (
      <div
        className="min-w-0"
      >
        {progress}
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
                  {`Dịch lại ${missed} câu chưa đúng`}
                </Button>
              </span>
            ) : null}
            <span
              className="mb-2"
            >
              <Button
                variant={missed > 0 ? 'secondary' : 'primary'}
                icon="arrow-right"
                autoFocus={missed === 0}
                onClick={onNewRound}
              >
                Lượt mới với câu khác
              </Button>
            </span>
          </div>
        </section>
      </div>
    );
  }

  const verdict: AnswerVerdict | null = skipped
    ? 'wrong'
    : selfCorrect
      ? 'correct'
      : ai.status === 'done'
        ? ai.result.verdict
        : (local?.verdict ?? null);
  const explanation = skipped
    ? 'Đã bỏ qua câu này. Đọc kỹ đáp án mẫu rồi dịch lại ở lượt sau.'
    : selfCorrect
      ? 'Bạn tự chấm là đúng.'
      : ai.status === 'done'
        ? ai.result.explanation
        : ai.status === 'loading'
          ? `${local?.explanation ?? ''} AI đang xem lại câu của bạn…`
          : (local?.explanation ?? '');
  const last = position === queue.length - 1;
  const aiResult = ai.status === 'done' ? ai.result : null;
  const showCorrection =
    aiResult !== null &&
    aiResult.verdict !== 'correct' &&
    aiResult.corrected.trim() !== '' &&
    aiResult.corrected.trim() !== input.trim();

  return (
    <div
      className="min-w-0"
    >
      {progress}

      <article
        className="rounded-[0.375rem] border border-line bg-surface px-4 py-3"
      >
        <p
          className="text-[0.75rem] tabular-nums text-ink-faint"
        >
          {`Câu ${String(position + 1).padStart(2, '0')} / ${queue.length} · Bài ${sentence.lessonNumber}`}
        </p>
        <p
          lang="vi"
          className="mt-1.5 break-words text-[1.375rem] leading-snug font-medium text-ink"
        >
          {sentence.vi}
        </p>

        {hints >= 1 && !checked ? (
          <p
            className="mt-2 text-[0.8125rem] text-ink-faint"
          >
            {sentence.newWords.length > 0 ? 'Từ mới trong câu: ' : 'Câu này không có từ mới của bài.'}
            {sentence.newWords.length > 0 ? (
              <span
                lang="zh-CN"
                className="han text-[1rem] text-ink"
              >
                {sentence.newWords.join(' · ')}
              </span>
            ) : null}
          </p>
        ) : null}
        {hints >= 2 && !checked ? (
          <p
            className="mt-1.5 break-words text-[1rem] text-ink-soft"
          >
            {sentence.pinyin}
          </p>
        ) : null}

        {!checked && hints < 2 ? (
          <div
            className="mt-2"
          >
            <Button
              variant="ghost"
              icon="lightbulb"
              onClick={() => setHints((value) => value + 1)}
            >
              {hints === 0 ? 'Gợi ý: từ mới trong câu' : 'Gợi ý thêm: xem pinyin'}
            </Button>
          </div>
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
          Viết câu tiếng Trung
        </label>
        <textarea
          key={`${position}-${index}-${attempt}`}
          id={inputId}
          value={input}
          rows={2}
          lang="zh-CN"
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          readOnly={checked}
          aria-describedby={hintId}
          placeholder="Gõ chữ Hán (bộ gõ tiếng Trung) hoặc pinyin"
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          className="han block w-full resize-y rounded-[0.375rem] border border-line-strong bg-surface px-3 py-2 text-[1.375rem] leading-relaxed text-ink read-only:bg-sunken"
        />
        <p
          id={hintId}
          className="mt-1 text-[0.8125rem] text-ink-faint"
        >
          Chữ Hán hay pinyin đều chấm được; Enter để chấm. Dịch khác đáp án mẫu mà vẫn đúng nghĩa thì
          AI vẫn tính là đúng.
        </p>

        {checked && verdict !== null ? (
          <div
            className="mt-4 space-y-3"
          >
            <VerdictBanner
              verdict={verdict}
              explanation={explanation}
              usedHint={hinted.has(index)}
            >
              {local !== null && local.diff.length > 0 && local.verdict !== 'correct' && !showCorrection ? (
                <div
                  className="min-w-0"
                >
                  <p
                    className="mb-1 text-[0.8125rem] text-ink-faint"
                  >
                    So với đáp án mẫu, bạn viết:
                  </p>
                  <DiffText diff={local.diff} />
                </div>
              ) : null}
              {showCorrection && aiResult !== null ? (
                <div
                  className="min-w-0"
                >
                  <p
                    className="mb-1 text-[0.8125rem] text-ink-faint"
                  >
                    AI sửa câu của bạn thành:
                  </p>
                  <p
                    lang="zh-CN"
                    className="han break-words text-[1.5rem] leading-snug text-ink"
                  >
                    {aiResult.corrected}
                  </p>
                  {aiResult.correctedPinyin.trim() !== '' ? (
                    <p
                      className="mt-0.5 break-words text-[0.9375rem] text-ink-soft"
                    >
                      {aiResult.correctedPinyin}
                    </p>
                  ) : null}
                </div>
              ) : null}
              {aiResult !== null && aiResult.mistakes.length > 0 && !selfCorrect ? (
                <ul
                  className="m-0 mt-3 list-none space-y-1.5 p-0"
                >
                  {aiResult.mistakes.map((mistake) => (
                    <li
                      key={`${mistake.wrong}-${mistake.right}`}
                      className="min-w-0 text-[0.875rem] leading-relaxed text-ink-soft"
                    >
                      <span
                        lang="zh-CN"
                        className="han text-wrong line-through"
                      >
                        {mistake.wrong}
                      </span>
                      <span
                        aria-hidden="true"
                        className="mx-1.5 text-ink-faint"
                      >
                        →
                      </span>
                      <span
                        lang="zh-CN"
                        className="han font-semibold text-teal-ink"
                      >
                        {mistake.right}
                      </span>
                      {mistake.note.trim() !== '' ? `: ${mistake.note}` : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </VerdictBanner>

            {ai.status === 'error' ? (
              <Notice
                tone="warn"
                title="AI chưa chấm được câu này"
              >
                <p>{ai.message}</p>
                {local !== null ? (
                  <div
                    className="mt-2"
                  >
                    <Button
                      variant="secondary"
                      icon="refresh"
                      onClick={() => askAi(input.trim(), sentence, local.verdict)}
                    >
                      Nhờ AI chấm lại
                    </Button>
                  </div>
                ) : null}
              </Notice>
            ) : null}

            <section
              aria-label="Đáp án mẫu"
              className="rounded-[0.375rem] border border-line bg-surface px-4 py-3"
            >
              <div
                className="flex items-start justify-between"
              >
                <p
                  className="pt-2 text-[0.8125rem] font-medium text-ink-faint"
                >
                  Đáp án mẫu
                </p>
                <span
                  className="flex shrink-0"
                >
                  <SpeakerButton
                    text={sentence.hanzi}
                    rate={READ_RATE}
                    label="Nghe đáp án mẫu"
                  />
                  <SpeakerButton
                    text={sentence.hanzi}
                    rate={READ_RATE}
                    slow
                    label="Nghe chậm hơn"
                  />
                </span>
              </div>
              <p
                lang="zh-CN"
                className="han break-words text-[1.625rem] leading-snug text-ink"
              >
                {sentence.hanzi}
              </p>
              <p
                className="mt-1 break-words text-[0.9375rem] text-ink-soft"
              >
                {sentence.pinyin}
              </p>
            </section>
          </div>
        ) : null}

        <div
          className="mt-4 flex flex-wrap"
        >
          {!checked ? (
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
              {verdict !== 'correct' ? (
                <span
                  className="mr-2 mb-2"
                >
                  <Button
                    variant="secondary"
                    icon="refresh"
                    onClick={retry}
                  >
                    Dịch lại câu này
                  </Button>
                </span>
              ) : null}
              {verdict !== 'correct' && !skipped && ai.status !== 'loading' ? (
                <span
                  className="mb-2"
                >
                  <Button
                    variant="ghost"
                    icon="check"
                    onClick={markCorrect}
                  >
                    Tôi dịch đúng, chỉ khác cách nói
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
