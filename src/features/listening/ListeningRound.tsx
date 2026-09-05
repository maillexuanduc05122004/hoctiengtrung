/**
 * Một lượt của chế độ Nghe và chép.
 *
 * Chữ Hán bị giấu cho tới khi trả lời xong: người học chỉ còn tiếng để dựa vào,
 * nên mọi thứ mở thêm (phát chậm, tách âm tiết, hé pinyin, xem nghĩa, xem đáp
 * án) đều bị ghi là đã dùng gợi ý — trừ nút nghe lại, vì nghe đi nghe lại vẫn là
 * đang nghe chứ không phải đang nhìn trộm.
 *
 * Thành phần này được gắn `key` theo từ ở trang gọi nên mỗi từ là một lần gắn
 * mới, nhờ vậy toàn bộ trạng thái bên trong tự quay về vạch xuất phát.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '../../components/ui/Button.tsx';
import { Chip, Segmented, type SegmentedOption } from '../../components/ui/Controls.tsx';
import { Notice } from '../../components/ui/Feedback.tsx';
import { Icon } from '../../components/ui/Icon.tsx';
import { useSettings } from '../../hooks/settings-context.ts';
import { useSpeech } from '../../hooks/useSpeech.ts';
import type { SubmitInput } from '../../hooks/useStudySession.ts';
import {
  hanziChars,
  matchAnswer,
  type MatchDiffPart,
  type MatchResult,
} from '../../lib/answer-matcher/index.ts';
import { SPEECH_RATES, type DisplayMode, type SpeechRate } from '../../types/settings.ts';
import type { AnswerVerdict } from '../../types/study.ts';
import type { VocabularyWord } from '../../types/vocabulary.ts';
import { DiffText } from '../shared/DiffText.tsx';
import { ExampleBlock } from '../shared/ExampleBlock.tsx';
import { MeaningList } from '../shared/MeaningList.tsx';
import { PinyinLine } from '../shared/PinyinLine.tsx';
import { SpeakerButton } from '../shared/SpeakerButton.tsx';
import { VerdictBanner } from '../shared/VerdictBanner.tsx';
import { WordFace } from '../shared/WordFace.tsx';

/** Ba cách trả lời của chế độ nghe. */
export type ListeningAnswerMode = 'hanzi' | 'pinyin' | 'choice';

export interface ListeningRoundProps {
  word: VocabularyWord;
  /** Kho từ để rút đáp án nhiễu cho dạng chọn nghĩa. */
  distractors: readonly VocabularyWord[];
  displayMode: DisplayMode;
  answerMode: ListeningAnswerMode;
  onAnswerModeChange: (mode: ListeningAnswerMode) => void;
  showTraditional?: boolean;
  /** Ghi lại kết quả rồi chuyển sang từ kế tiếp. */
  onSubmit: (input: SubmitInput) => void;
  onSkip?: () => void;
}

/** Kết quả một lượt, giữ lại để bảng đối chiếu không đổi khi trạng thái khác thay đổi. */
interface RoundOutcome {
  verdict: AnswerVerdict;
  usedHint: boolean;
  given: string;
  expected: string;
  explanation: string;
  diff: readonly MatchDiffPart[];
  elapsedMs: number;
}

interface ChoiceLabel {
  primary: string;
  secondary: string | null;
}

/** Tốc độ của nút phát chậm, khớp với mức chậm nhất trong cài đặt. */
const SLOW_RATE = 0.7;

/** Số đáp án nhiễu cần có để thành một câu bốn lựa chọn. */
const DISTRACTOR_COUNT = 3;

const ANSWER_MODE_OPTIONS: readonly SegmentedOption<ListeningAnswerMode>[] = [
  { value: 'hanzi', label: 'Chữ Hán', srLabel: 'Trả lời bằng cách gõ chữ Hán' },
  { value: 'pinyin', label: 'Pinyin', srLabel: 'Trả lời bằng cách gõ pinyin' },
  { value: 'choice', label: 'Chọn nghĩa', srLabel: 'Trả lời bằng cách chọn nghĩa đúng' },
];

/** Nhãn tốc độ viết theo lối Việt: dấu phẩy thập phân. */
const RATE_OPTIONS: readonly SegmentedOption<string>[] = SPEECH_RATES.map((rate) => ({
  value: String(rate),
  label: `${String(rate).replace('.', ',')}×`,
  srLabel: `Tốc độ đọc ${String(rate).replace('.', ',')} lần`,
}));

function parseRate(value: string): SpeechRate {
  return SPEECH_RATES.find((rate) => String(rate) === value) ?? 0.85;
}

/** Nghĩa dùng làm nhãn lựa chọn, chọn theo đúng ngôn ngữ người học đang xem. */
function meaningOf(word: VocabularyWord, displayMode: DisplayMode): ChoiceLabel {
  const vi = word.meanings.vi.find((item) => item.trim() !== '') ?? '';
  const en = word.meanings.en.find((item) => item.trim() !== '') ?? '';
  if (displayMode === 'en-zh') {
    return { primary: en !== '' ? en : vi, secondary: null };
  }
  if (displayMode === 'vi-en-zh') {
    return { primary: vi !== '' ? vi : en, secondary: vi !== '' && en !== '' ? en : null };
  }
  return { primary: vi !== '' ? vi : en, secondary: null };
}

/** Trộn theo Fisher-Yates để thứ tự lựa chọn không đoán được. */
function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Dựng bốn lựa chọn nghĩa.
 *
 * Ưu tiên từ cùng cấp HSK vì nhiễu cùng cấp mới thật sự khó; loại những từ trùng
 * nghĩa với đáp án hoặc trùng nghĩa nhau, nếu không sẽ có hai lựa chọn cùng đúng.
 */
function buildChoices(
  word: VocabularyWord,
  pool: readonly VocabularyWord[],
  displayMode: DisplayMode,
): VocabularyWord[] {
  const answer = meaningOf(word, displayMode).primary;
  const usable = pool.filter((other) => other.id !== word.id);
  const sameLevel = usable.filter((other) => other.hskLevel === word.hskLevel);
  const source = sameLevel.length >= DISTRACTOR_COUNT ? sameLevel : usable;

  const picked: VocabularyWord[] = [];
  const seen = new Set<string>([answer]);
  for (const candidate of shuffle(source)) {
    const label = meaningOf(candidate, displayMode).primary;
    if (label === '' || seen.has(label)) continue;
    seen.add(label);
    picked.push(candidate);
    if (picked.length === DISTRACTOR_COUNT) break;
  }
  return shuffle([word, ...picked]);
}

export function ListeningRound({
  word,
  distractors,
  displayMode,
  answerMode,
  onAnswerModeChange,
  showTraditional = false,
  onSubmit,
  onSkip,
}: ListeningRoundProps) {
  const { settings, update } = useSettings();
  const { supported, speaking, speak, speakParts, cancel } = useSpeech();
  const inputId = useId();
  // Đồng hồ của lượt chỉ chạy sau khi thành phần đã gắn xong, để lúc vẽ không
  // phải gọi hàm phụ thuộc thời gian.
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const [input, setInput] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [played, setPlayed] = useState(false);
  const [usedHint, setUsedHint] = useState(false);
  const [revealedSyllables, setRevealedSyllables] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [outcome, setOutcome] = useState<RoundOutcome | null>(null);
  // Bốn lựa chọn dựng đúng một lần cho mỗi lượt, không trộn lại mỗi lần vẽ.
  const [choices] = useState<VocabularyWord[]>(() => buildChoices(word, distractors, displayMode));

  const answered = outcome !== null;
  const syllables = word.pinyin.trim() === '' ? [] : word.pinyin.trim().split(/\s+/);
  const chars = hanziChars(word.simplified);
  const example = word.examples.find((item) => item.zh.trim() !== '');
  const answerLabel = meaningOf(word, displayMode);
  const expectedText =
    answerMode === 'hanzi'
      ? word.simplified
      : answerMode === 'pinyin'
        ? word.pinyin
        : answerLabel.primary;

  // Không nghe được thì phải cho nhìn, nếu không người học kẹt cứng ở lượt này.
  const faceVisible = answered || !supported;

  const handlePlay = (): void => {
    if (speaking) {
      cancel();
      return;
    }
    setPlayed(true);
    void speak(word.simplified);
  };

  const handleSlow = (): void => {
    setUsedHint(true);
    setPlayed(true);
    void speak(word.simplified, 'zh-CN', SLOW_RATE);
  };

  const handleSyllables = (): void => {
    setUsedHint(true);
    setPlayed(true);
    void speakParts(chars);
  };

  const handleRevealSyllable = (): void => {
    setUsedHint(true);
    setRevealedSyllables((count) => Math.min(count + 1, syllables.length));
  };

  const handleShowMeaning = (): void => {
    setUsedHint(true);
    setShowMeaning(true);
  };

  const finish = (result: Omit<RoundOutcome, 'elapsedMs'>): void => {
    // Chưa kịp chạy đồng hồ thì ghi 0 còn hơn ghi một khoảng thời gian bịa.
    const elapsedMs = startedAt.current === 0 ? 0 : Date.now() - startedAt.current;
    setOutcome({ ...result, elapsedMs });
  };

  /** Chấm phần đã gõ; chỉ gọi ở hai dạng gõ chữ Hán và pinyin. */
  const gradeTyped = (kind: 'hanzi' | 'pinyin', text: string): MatchResult =>
    matchAnswer(text, {
      kind,
      expected: [kind === 'hanzi' ? word.simplified : word.pinyin],
      aliases: kind === 'hanzi' ? (word.writtenVariants ?? []) : word.aliases.pinyin,
      usedHint,
    });

  const handleRevealAll = (): void => {
    setUsedHint(true);
    setRevealedSyllables(syllables.length);
    setShowMeaning(true);
    const given = answerMode === 'choice' ? '' : input.trim();
    // Bỏ dở giữa chừng vẫn phải cho thấy phần đã gõ sai ở bảng kết quả, nên vẫn
    // chấm để lấy bảng đối chiếu. Ô nhập còn trống thì diff rỗng, bảng tự ẩn.
    const diff = answerMode === 'choice' ? [] : gradeTyped(answerMode, given).diff;
    finish({
      verdict: 'wrong',
      usedHint: true,
      given,
      expected: expectedText,
      explanation: 'Bạn đã xem đáp án nên lượt này tính là chưa thuộc.',
      diff,
    });
  };

  const handleCheck = (): void => {
    if (answered) return;

    if (answerMode === 'choice') {
      if (selectedId === null) return;
      const chosen = choices.find((item) => item.id === selectedId);
      const correct = selectedId === word.id;
      finish({
        verdict: correct ? 'correct' : 'wrong',
        usedHint,
        given: chosen ? meaningOf(chosen, displayMode).primary : '',
        expected: answerLabel.primary,
        explanation: correct ? 'Đúng rồi.' : 'Nghĩa bạn chọn là của một từ khác.',
        diff: [],
      });
      return;
    }

    if (input.trim() === '') return;
    const result = gradeTyped(answerMode, input);
    finish({
      verdict: result.verdict,
      usedHint,
      given: input.trim(),
      expected: expectedText,
      explanation: result.explanation,
      diff: result.diff,
    });
  };

  const handleNext = (): void => {
    if (outcome === null) return;
    // Dừng tiếng đang đọc dở, tránh nghe chồng lên từ kế tiếp.
    cancel();
    onSubmit({
      verdict: outcome.verdict,
      usedHint: outcome.usedHint,
      given: outcome.given,
      expected: outcome.expected,
      elapsedMs: outcome.elapsedMs,
    });
  };

  const handleModeChange = (next: ListeningAnswerMode): void => {
    // Đổi cách trả lời giữa chừng thì phần đã nhập không còn dùng được nữa.
    setInput('');
    setSelectedId(null);
    onAnswerModeChange(next);
  };

  const partialPinyin = syllables
    .map((syllable, i) => (i < revealedSyllables ? syllable : '—'))
    .join(' ');

  const showDiff = outcome !== null && outcome.verdict !== 'correct' && outcome.diff.length > 0;
  const checkDisabled = answerMode === 'choice' ? selectedId === null : input.trim() === '';
  const inputClass = [
    'tap w-full min-w-0 rounded-[0.375rem] border border-line-strong bg-surface px-3 py-2.5',
    'text-ink placeholder:text-ink-faint',
    answerMode === 'hanzi' ? 'han text-[1.5rem]' : 'text-[1.0625rem] tracking-wide',
  ].join(' ');

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
            <p
              className="min-w-0 break-words"
            >
              Trình duyệt không có bộ đọc văn bản, hoặc chưa cài giọng tiếng Trung nào, nên phần
              nghe sẽ im lặng. Chữ Hán được hiện sẵn để bạn vẫn luyện được; muốn nghe thì thử mở
              bằng Chrome hoặc Safari bản mới, hoặc cài thêm giọng tiếng Trung trong cài đặt máy.
            </p>
          </Notice>
        </div>
      ) : null}

      {/* Phần nghe. Chữ chỉ hiện ra sau khi đã trả lời. */}
      <section
        aria-label="Phần nghe"
        className="min-w-0 border-b border-line pb-5"
      >
        <div
          className="flex min-w-0 flex-col items-center py-2 text-center"
        >
          {faceVisible ? (
            <WordFace
              word={word}
              size="xl"
              showTraditional={showTraditional}
              className="text-center"
            />
          ) : (
            <>
              <span
                aria-hidden="true"
                className="text-ink-faint"
              >
                <Icon
                  name="ear"
                  size={2.25}
                />
              </span>
              <p
                className="mt-2 max-w-[22rem] text-[0.875rem] text-ink-faint"
              >
                Chữ Hán đang được giấu. Bấm nghe rồi viết lại những gì bạn nghe được.
              </p>
            </>
          )}
        </div>

        <div
          className="mt-3"
        >
          <Button
            variant="primary"
            size="lg"
            icon={speaking ? 'stop' : 'volume'}
            block
            disabled={!supported}
            onClick={handlePlay}
          >
            {speaking ? 'Dừng đọc' : played ? 'Nghe lại' : 'Nghe phát âm'}
          </Button>
        </div>

        <div
          className="mt-2 grid grid-cols-2 gap-2"
        >
          <Button
            icon="volume-slow"
            disabled={!supported}
            onClick={handleSlow}
          >
            Phát chậm
          </Button>
          <Button
            icon="volume"
            disabled={!supported || chars.length === 0}
            onClick={handleSyllables}
          >
            Nghe từng âm tiết
          </Button>
        </div>

        <div
          className="mt-4"
        >
          <Segmented
            legend="Tốc độ đọc"
            options={RATE_OPTIONS}
            value={String(settings.speechRate)}
            onChange={(value) => {
              void update({ speechRate: parseRate(value) });
            }}
          />
        </div>
      </section>

      {/* Phần gợi ý. Bấm bất cứ nút nào ở đây là lượt này không còn tính tự trả lời. */}
      <section
        aria-label="Gợi ý"
        className="mt-5 min-w-0 border-b border-line pb-5"
      >
        <div
          className="flex min-w-0 items-center justify-between"
        >
          <p
            className="text-[0.8125rem] font-medium text-ink-soft"
          >
            Cần gợi ý?
          </p>
          {usedHint ? <Chip tone="warn">Đã dùng gợi ý</Chip> : null}
        </div>

        <div
          className="mt-2 grid grid-cols-2 gap-2 xsm:grid-cols-1"
        >
          <Button
            icon="eye"
            disabled={answered || syllables.length === 0 || revealedSyllables >= syllables.length}
            onClick={handleRevealSyllable}
          >
            Hiện một phần pinyin
          </Button>
          <Button
            icon="lightbulb"
            disabled={answered || showMeaning}
            onClick={handleShowMeaning}
          >
            Hiện nghĩa
          </Button>
          <Button
            icon="eye-off"
            disabled={answered}
            className="col-span-2 xsm:col-span-1"
            onClick={handleRevealAll}
          >
            Xem toàn bộ đáp án
          </Button>
        </div>

        {revealedSyllables > 0 && !answered ? (
          <p
            lang="zh-Latn-pinyin"
            className="mt-3 min-w-0 break-words text-[1.125rem] tracking-wide text-ink-soft"
          >
            {partialPinyin}
          </p>
        ) : null}

        {showMeaning && !answered ? (
          <div
            className="mt-3 min-w-0 border-l-2 border-line-strong pl-3"
          >
            <MeaningList
              word={word}
              displayMode={displayMode}
              compact
            />
          </div>
        ) : null}
      </section>

      {/* Cách trả lời. */}
      <div
        className="mt-5"
      >
        <Segmented
          legend="Cách trả lời"
          options={ANSWER_MODE_OPTIONS}
          value={answerMode}
          onChange={handleModeChange}
        />
      </div>

      {answerMode === 'choice' ? (
        choices.length < 2 ? (
          <div
            className="mt-4"
          >
            <Notice tone="warn">
              <p
                className="min-w-0 break-words"
              >
                Chưa đủ từ khác để dựng bốn lựa chọn. Hãy chọn thêm cấp HSK, hoặc đổi sang gõ chữ
                Hán hay pinyin.
              </p>
            </Notice>
          </div>
        ) : (
          <fieldset
            className="mt-4 min-w-0"
          >
            <legend
              className="mb-2 text-[0.8125rem] font-medium text-ink-soft"
            >
              Từ vừa nghe có nghĩa là gì?
            </legend>
            <div
              role="radiogroup"
              aria-label="Chọn nghĩa đúng"
              className="grid grid-cols-1 gap-2"
            >
              {choices.map((choice) => {
                const label = meaningOf(choice, displayMode);
                const selected = choice.id === selectedId;
                const isAnswer = choice.id === word.id;
                const tone = answered
                  ? isAnswer
                    ? 'border-teal bg-teal-soft'
                    : selected
                      ? 'border-cinnabar bg-cinnabar-soft'
                      : 'border-line bg-surface'
                  : selected
                    ? 'border-ink bg-sunken'
                    : 'border-line-strong bg-surface hover:border-ink-faint';
                return (
                  <button
                    key={choice.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={answered}
                    onClick={() => setSelectedId(choice.id)}
                    className={`tap flex w-full min-w-0 flex-col items-start border px-3 py-2.5 text-left rounded-[0.375rem] transition-colors duration-150 disabled:cursor-not-allowed ${tone}`}
                  >
                    <span
                      className="min-w-0 break-words text-[0.9375rem] text-ink"
                    >
                      {label.primary}
                    </span>
                    {label.secondary !== null ? (
                      <span
                        lang="en"
                        className="mt-0.5 min-w-0 break-words text-[0.8125rem] text-ink-faint italic"
                      >
                        {label.secondary}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )
      ) : null}

      {/* Bảng đối chiếu sau khi trả lời. */}
      {outcome !== null ? (
        <section
          aria-label="Kết quả"
          className="mt-5 min-w-0"
        >
          <VerdictBanner
            verdict={outcome.verdict}
            usedHint={outcome.usedHint}
            explanation={outcome.explanation}
            expected={outcome.expected}
          />

          <div
            className="mt-4 flex min-w-0 items-start justify-between border-b border-line pb-4"
          >
            <div
              className="min-w-0"
            >
              <WordFace
                word={word}
                size="lg"
                showTraditional={showTraditional}
              />
              <div
                className="mt-2"
              >
                <PinyinLine pinyin={word.pinyin} />
              </div>
            </div>
            <div
              className="ml-3 flex shrink-0 items-center space-x-1"
            >
              <SpeakerButton
                text={word.simplified}
                label={`Nghe lại từ ${word.simplified}`}
              />
              <SpeakerButton
                text={word.simplified}
                slow
                label={`Nghe chậm lại từ ${word.simplified}`}
              />
            </div>
          </div>

          <div
            className="mt-4 min-w-0"
          >
            {/* Theo đúng cách hiển thị người học đã chọn, như câu ví dụ bên dưới. */}
            <MeaningList
              word={word}
              displayMode={displayMode}
            />
          </div>

          {showDiff ? (
            <div
              className="mt-4 min-w-0 border-t border-line pt-4"
            >
              <p
                className="mb-1 text-[0.8125rem] text-ink-faint"
              >
                Bạn đã nhập
              </p>
              <DiffText diff={outcome.diff} />
            </div>
          ) : null}

          {example !== undefined ? (
            <div
              className="mt-4 min-w-0 border-t border-line pt-4"
            >
              <p
                className="mb-2 text-[0.8125rem] text-ink-faint"
              >
                Câu ví dụ
              </p>
              <ExampleBlock
                example={example}
                displayMode={displayMode}
              />
            </div>
          ) : null}
        </section>
      ) : null}

      {/*
        Khu nhập liệu dính ở đáy vùng cuộn chứ không dùng fixed: trên điện thoại
        bàn phím đẩy khung nhìn lên, sticky đi theo nội dung nên ô nhập và nút
        Kiểm tra không bị bàn phím nuốt mất. Lề dưới chừa đúng chiều cao thanh
        điều hướng để hai thứ không chồng lên nhau.
      */}
      <div
        className="sticky bottom-0 z-20 mt-6 min-w-0 border-t border-line bg-paper pt-3 pb-3 xsm:bottom-[calc(4.75rem+env(safe-area-inset-bottom))]"
      >
        {outcome !== null ? (
          <Button
            variant="primary"
            size="lg"
            icon="arrow-right"
            block
            autoFocus
            onClick={handleNext}
          >
            Từ tiếp theo
          </Button>
        ) : (
          <>
            {answerMode === 'choice' ? null : (
              <>
                <label
                  htmlFor={inputId}
                  className="sr-only"
                >
                  {answerMode === 'hanzi' ? 'Gõ chữ Hán bạn nghe được' : 'Gõ pinyin bạn nghe được'}
                </label>
                <input
                  id={inputId}
                  type="text"
                  value={input}
                  lang={answerMode === 'hanzi' ? 'zh-Hans' : 'zh-Latn-pinyin'}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  enterKeyHint="done"
                  placeholder={
                    answerMode === 'hanzi' ? 'Chữ Hán bạn nghe được' : 'ni3 hao3 hoặc nǐ hǎo'
                  }
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') handleCheck();
                  }}
                  className={inputClass}
                />
              </>
            )}
            <div
              className={answerMode === 'choice' ? 'flex items-center' : 'mt-2 flex items-center'}
            >
              <Button
                variant="primary"
                size="lg"
                icon="check"
                disabled={checkDisabled}
                className="flex-1"
                onClick={handleCheck}
              >
                Kiểm tra
              </Button>
              {onSkip !== undefined ? (
                <Button
                  variant="ghost"
                  size="lg"
                  className="ml-2 shrink-0"
                  onClick={onSkip}
                >
                  Bỏ qua
                </Button>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
