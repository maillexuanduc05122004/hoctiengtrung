import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react';
import { Button, IconButton } from '../../components/ui/Button.tsx';
import { isBlankAnswer, type MatchResult } from '../../lib/answer-matcher/index.ts';
import { useSettings } from '../../hooks/settings-context.ts';
import type { StudySession } from '../../hooks/useStudySession.ts';
import type { VocabularyWord } from '../../types/vocabulary.ts';
import { DiffText } from '../shared/DiffText.tsx';
import { ExampleBlock } from '../shared/ExampleBlock.tsx';
import { MeaningList } from '../shared/MeaningList.tsx';
import { PinyinLine } from '../shared/PinyinLine.tsx';
import { SpeakerButton } from '../shared/SpeakerButton.tsx';
import { StudyHeader } from '../shared/StudyHeader.tsx';
import { VerdictBanner } from '../shared/VerdictBanner.tsx';
import { WordFace } from '../shared/WordFace.tsx';
import { HintBar } from './HintBar.tsx';
import { buildChallenge, gradeChallenge, seededRandom } from './prompt.ts';

export interface TypingRoundProps {
  session: StudySession;
  /** Từ đang hỏi; nơi gọi đã bảo đảm hàng đợi còn từ. */
  word: VocabularyWord;
  title: string;
  subtitle?: string;
}

/** Kết quả đã chấm của câu hiện tại, giữ lại để hiện nhận xét trước khi sang từ mới. */
interface GradedAnswer {
  result: MatchResult;
  elapsedMs: number;
}

/**
 * Một câu của chế độ gõ đáp án.
 *
 * Vòng đời một câu có hai nhịp: nhịp một chấm bài và hiện nhận xét, nhịp hai mới
 * ghi kết quả vào lịch ôn rồi sang từ kế tiếp. Phải tách làm hai vì
 * `session.submit` nhảy sang từ tiếp theo ngay lập tức, trong khi người học cần
 * đọc phần giải thích trước đã. Cả hai nhịp đều nằm trên phím Enter nên gõ xong
 * là đi tiếp được mà không phải rời bàn phím.
 */
export function TypingRound({ session, word, title, subtitle }: TypingRoundProps) {
  const { settings } = useSettings();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const [input, setInput] = useState('');
  const [graded, setGraded] = useState<GradedAnswer | null>(null);
  const [usedHint, setUsedHint] = useState(false);
  const [shownWordId, setShownWordId] = useState(word.id);

  // Sang từ khác thì dọn sạch câu cũ ngay trong lượt vẽ này. Làm bằng effect thì
  // người học kịp thấy nhận xét của từ trước nhấp nháy trên đề bài của từ sau.
  if (shownWordId !== word.id) {
    setShownWordId(word.id);
    setInput('');
    setGraded(null);
    setUsedHint(false);
  }

  // Đồng hồ đo thời gian trả lời. Đọc giờ là việc không thuần khiết nên phải đặt
  // trong effect, không được gọi thẳng lúc vẽ.
  const startedAtRef = useRef(0);
  useEffect(() => {
    startedAtRef.current = Date.now();
  }, [word.id]);

  // Gieo hạt theo mã từ và vị trí trong hàng đợi: dạng đề đứng yên suốt câu hỏi,
  // nhưng phiên sau hàng đợi xáo lại nên cùng một từ sẽ được hỏi theo kiểu khác.
  const challenge = useMemo(
    () => buildChallenge(word, seededRandom(`${word.id}|${String(session.index)}`)),
    [word, session.index],
  );

  const starred = session.starred.has(word.id);
  const answered = graded !== null;
  const example = word.examples[0];
  const expectedAnswer = challenge.expected[0] ?? '';

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (graded === null) {
      // Enter khi ô còn trống không bị tính là trả lời sai; muốn bỏ qua thì có nút riêng.
      if (isBlankAnswer(input)) return;
      const startedAt = startedAtRef.current;
      setGraded({
        result: gradeChallenge(challenge, input, usedHint),
        elapsedMs: startedAt === 0 ? 0 : Date.now() - startedAt,
      });
      return;
    }

    void session.submit({
      verdict: graded.result.verdict,
      usedHint,
      given: input.trim(),
      expected: expectedAnswer,
      elapsedMs: graded.elapsedMs,
    });
    // Bấm nút "Tiếp tục" bằng chuột thì tiêu điểm đang ở nút, trả nó về ô nhập
    // để gõ tiếp được ngay. Đây là hành động do người dùng bắt đầu nên không phải
    // là cướp tiêu điểm.
    inputRef.current?.focus();
  };

  const handleInsert = (text: string): void => {
    setInput((previous) => previous + text);
    inputRef.current?.focus();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex min-h-[calc(100dvh-10rem)] w-full max-w-[38rem] min-w-0 flex-col xsm:min-h-[calc(100dvh-13rem)]"
    >
      <StudyHeader
        title={title}
        done={session.stats.done}
        total={session.stats.total}
        subtitle={subtitle}
        right={
          // Nhãn không nhắc chữ Hán: `IconButton` gán nhãn vào cả `title`, mà những
          // dạng đề hỏi chữ Hán lấy chính chữ đó làm đáp án — rê chuột là lộ bài.
          <IconButton
            icon={starred ? 'star-filled' : 'star'}
            label={starred ? 'Bỏ đánh dấu từ này' : 'Đánh dấu từ này'}
            pressed={starred}
            onClick={() => void session.toggleStar(word.id)}
          />
        }
      />

      <div
        className="min-w-0 flex-1 pt-5"
      >
        <section
          aria-label="Đề bài"
          className="min-w-0 border border-line bg-surface px-5 py-7 text-center rounded-[0.375rem] xsm:px-4 xsm:py-6"
        >
          <p
            className="text-[0.6875rem] font-semibold tracking-wide text-ink-faint uppercase"
          >
            {challenge.questionLabel}
          </p>

          <div
            className="mt-3 flex min-w-0 justify-center"
          >
            {challenge.questionKind === 'hanzi' ? (
              <WordFace
                word={word}
                size="xl"
                showTraditional={settings.showTraditional}
              />
            ) : (
              <p
                lang={challenge.questionKind === 'pinyin' ? 'zh-Latn-pinyin' : challenge.questionKind}
                className={[
                  'min-w-0 leading-snug break-words text-ink',
                  challenge.questionKind === 'pinyin'
                    ? 'text-[2rem] tracking-wide xsm:text-[1.75rem]'
                    : 'text-[1.75rem] xsm:text-[1.5rem]',
                ].join(' ')}
              >
                {challenge.question}
              </p>
            )}
          </div>

          <p
            className="mt-5 text-[0.8125rem] text-ink-soft"
          >
            {challenge.instruction}
          </p>
        </section>

        {graded !== null ? (
          <div
            className="mt-5 min-w-0"
          >
            <VerdictBanner
              verdict={graded.result.verdict}
              usedHint={usedHint}
              explanation={graded.result.explanation}
              expected={expectedAnswer}
            >
              {graded.result.verdict !== 'correct' && graded.result.diff.length > 0 ? (
                <div
                  className="min-w-0"
                >
                  <p
                    className="mb-1 text-[0.6875rem] tracking-wide text-ink-faint uppercase"
                  >
                    Bạn đã gõ
                  </p>
                  <DiffText
                    diff={graded.result.diff}
                  />
                </div>
              ) : null}
            </VerdictBanner>

            <div
              className="mt-5 min-w-0 border-t border-line pt-5"
            >
              <div
                className="flex min-w-0 items-start justify-between"
              >
                <div
                  className="min-w-0"
                >
                  {/* Bảng lộ đáp án cũng theo cài đặt "Hiện thêm chữ phồn thể" như đề bài. */}
                  <WordFace
                    word={word}
                    size="lg"
                    showTraditional={settings.showTraditional}
                  />
                  <PinyinLine
                    pinyin={word.pinyin}
                    className="mt-2"
                  />
                </div>
                <div
                  className="ml-2 flex shrink-0 items-center space-x-1"
                >
                  <SpeakerButton
                    text={word.simplified}
                    label={`Nghe lại từ ${word.simplified}`}
                  />
                  <SpeakerButton
                    text={word.simplified}
                    label={`Nghe chậm từ ${word.simplified}`}
                    slow
                  />
                </div>
              </div>

              <div
                className="mt-4 min-w-0 border-t border-line pt-4"
              >
                <MeaningList
                  word={word}
                  displayMode={settings.displayMode}
                />
              </div>

              {example ? (
                <div
                  className="mt-4 min-w-0 border-t border-line pt-4"
                >
                  <p
                    className="mb-1.5 text-[0.6875rem] font-semibold tracking-wide text-ink-faint uppercase"
                  >
                    Ví dụ
                  </p>
                  <ExampleBlock
                    example={example}
                    displayMode={settings.displayMode}
                  />
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {/*
        Ô nhập dính đáy vùng cuộn của trang chứ không dùng `fixed`: bàn phím ảo
        trên điện thoại đẩy vùng nhìn thấy lên, khối `sticky` đi theo nội dung nên
        vẫn nằm ngay trên bàn phím.

        Trên điện thoại, cạnh dưới của khối được nâng lên đúng bằng phần đệm dưới
        của khung ứng dụng (4.75rem, chỗ dành cho thanh điều hướng): nút "Kiểm
        tra" không bị thanh đó che, mà cuộn tới đáy trang khối cũng không nhảy vì
        vị trí dính trùng luôn với vị trí tự nhiên. Vệt đổ bóng màu nền lấp nốt
        khoảng hở giữa cạnh dưới của khối và mép trên thanh điều hướng.
      */}
      <div
        className="sticky bottom-0 z-20 mt-6 min-w-0 border-t border-line bg-paper pt-3 pb-3 xsm:bottom-[calc(4.75rem+env(safe-area-inset-bottom))] xsm:shadow-[0_1.25rem_0_0_var(--color-paper)]"
      >
        {answered ? null : (
          <HintBar
            key={word.id}
            word={word}
            challenge={challenge}
            onUseHint={() => setUsedHint(true)}
            onInsert={handleInsert}
          />
        )}

        <label
          htmlFor={inputId}
          className="sr-only"
        >
          {challenge.instruction}
        </label>
        <input
          id={inputId}
          ref={inputRef}
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          readOnly={answered}
          aria-readonly={answered}
          placeholder="Câu trả lời của bạn"
          inputMode="text"
          enterKeyHint={answered ? 'next' : 'go'}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className={[
            'mt-2 w-full min-w-0 border bg-surface px-3.5 py-3 text-ink rounded-[0.375rem]',
            'placeholder:text-[1rem] placeholder:text-ink-faint',
            answered ? 'border-line text-ink-soft' : 'border-line-strong',
            challenge.answerKind === 'hanzi' ? 'han text-[1.375rem]' : 'text-[1.0625rem]',
          ].join(' ')}
        />

        <div
          className="mt-2 flex min-w-0 items-center space-x-2"
        >
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="min-w-0 flex-1"
            disabled={!answered && isBlankAnswer(input)}
          >
            {answered ? 'Tiếp tục' : 'Kiểm tra'}
          </Button>
          {answered ? null : (
            <Button
              variant="ghost"
              size="lg"
              className="shrink-0"
              onClick={() => session.skip()}
            >
              Bỏ qua
            </Button>
          )}
        </div>

        <p
          className="mt-2 text-[0.75rem] text-ink-faint xsm:hidden"
        >
          Nhấn Enter để kiểm tra, nhấn Enter lần nữa để sang từ tiếp theo.
        </p>
      </div>
    </form>
  );
}
