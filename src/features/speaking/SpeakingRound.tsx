/**
 * Một lượt luyện nói cho một từ.
 *
 * Luồng: nghe mẫu → bấm nút nói → hiện lại đúng những chữ máy nghe được → đối chiếu
 * với đáp án. Kết quả ở đây chỉ trả lời được một câu hỏi duy nhất là "máy có nghe ra
 * đúng từ hay không", nên giao diện phải nói thẳng điều đó và tuyệt đối không hiện bất
 * kỳ con số điểm phát âm hay điểm thanh điệu nào.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../../components/ui/Button.tsx';
import { Segmented, type SegmentedOption } from '../../components/ui/Controls.tsx';
import { Notice } from '../../components/ui/Feedback.tsx';
import { useSpeech } from '../../hooks/useSpeech.ts';
import type { SubmitInput } from '../../hooks/useStudySession.ts';
import {
  createSpeechRecognizer,
  createWebSpeechProvider,
  type PronunciationAssessment,
} from '../../lib/speech/index.ts';
import type { DisplayMode } from '../../types/settings.ts';
import type { AnswerVerdict } from '../../types/study.ts';
import type { VocabularyWord, WordExample } from '../../types/vocabulary.ts';
import { ExampleBlock } from '../shared/ExampleBlock.tsx';
import { MeaningList } from '../shared/MeaningList.tsx';
import { PinyinLine } from '../shared/PinyinLine.tsx';
import { VerdictBanner } from '../shared/VerdictBanner.tsx';
import { WordFace } from '../shared/WordFace.tsx';

export interface SpeakingRoundProps {
  word: VocabularyWord;
  displayMode: DisplayMode;
  /** Ẩn pinyin cho tới khi người học tự bấm hiện. */
  hidePinyin?: boolean;
  showTraditional?: boolean;
  /** Ghi nhận kết quả của từ này; nơi gọi sẽ chuyển sang từ tiếp theo. */
  onSubmit: (input: SubmitInput) => void;
  /** Bỏ qua từ này mà không ghi nhận kết quả nào. */
  onSkip: () => void;
}

/** Người học đọc từ đơn hay đọc cả câu ví dụ. */
type SpeakingTarget = 'word' | 'example';

const TARGET_OPTIONS: readonly SegmentedOption<SpeakingTarget>[] = [
  { value: 'word', label: 'Từ', srLabel: 'Đọc từ đơn' },
  { value: 'example', label: 'Câu ví dụ', srLabel: 'Đọc câu ví dụ' },
];

/** Câu dài hơn mức này khó đọc trọn một hơi nên không đưa vào phần luyện nói. */
const MAX_EXAMPLE_LENGTH = 16;

/** Tốc độ đọc mẫu chậm, khớp với mức chậm nhất trong cài đặt. */
const SLOW_RATE = 0.7;

const HONEST_NOTE =
  'Đây chỉ là kiểm tra xem hệ thống có nghe ra đúng từ hay không, không phải điểm phát âm hay điểm thanh điệu. Máy vẫn có thể nghe nhầm dù bạn đọc đúng, và ngược lại.';

/** Lượt nghe kết thúc mà không có chữ nào, và trình duyệt cũng chẳng báo lỗi gì. */
const NO_TRANSCRIPT_MESSAGE =
  'Chưa nghe được chữ nào. Hãy bấm nút nói rồi đọc to và rõ hơn một chút.';

/** Câu ví dụ đầu tiên đủ ngắn để đọc thành tiếng, hoặc null nếu không có câu nào. */
function pickExample(word: VocabularyWord): WordExample | null {
  const usable = word.examples.find(
    (example) => example.zh.trim() !== '' && example.zh.trim().length <= MAX_EXAMPLE_LENGTH,
  );
  return usable ?? null;
}

export function SpeakingRound({
  word,
  displayMode,
  hidePinyin = false,
  showTraditional = false,
  onSubmit,
  onSkip,
}: SpeakingRoundProps) {
  const { supported: ttsSupported, speaking, speak, cancel } = useSpeech();

  // Chỉ tạo lớp bọc, KHÔNG khởi tạo đối tượng nhận dạng: khởi tạo sớm sẽ khiến trình
  // duyệt xin quyền micro trước khi người học bấm nút.
  const recognizer = useMemo(() => createSpeechRecognizer(), []);
  const provider = useMemo(() => createWebSpeechProvider(), []);

  const [target, setTarget] = useState<SpeakingTarget>('word');
  const [pinyinRevealed, setPinyinRevealed] = useState(false);
  const [listening, setListening] = useState(false);
  const [assessing, setAssessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [assessment, setAssessment] = useState<PronunciationAssessment | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [problem, setProblem] = useState<{ code: string; message: string } | null>(null);

  // Các hàm gọi lại của bộ nhận dạng sống lâu hơn một lượt render, nên mọi thứ chúng đọc
  // đều phải lấy qua ref; đọc thẳng biến state sẽ ra giá trị của lượt render cũ.
  const aliveRef = useRef(true);
  const transcriptRef = useRef('');
  const submittedRef = useRef(false);
  // Chính người học bỏ lượt nghe giữa chừng thì không phải nhắc gì; chỉ lượt tự kết thúc
  // mới cần lời nhắc khi không nghe ra chữ nào.
  const cancelledRef = useRef(false);
  // Mốc thời gian đặt trong effect chứ không đặt lúc render: render có thể chạy lại
  // nhiều lần, còn effect gắn kết chỉ chạy đúng một lần cho mỗi từ.
  const startedAtRef = useRef(0);

  const example = useMemo(() => pickExample(word), [word]);
  const usingExample = target === 'example' && example !== null;

  const expected = useMemo(
    () =>
      usingExample && example !== null
        ? { hanzi: example.zh.trim(), pinyin: example.pinyin.trim() }
        : { hanzi: word.simplified, pinyin: word.pinyin },
    [usingExample, example, word],
  );
  const expectedRef = useRef(expected);

  const supported = recognizer.isSupported();
  const permissionDenied = problem?.code === 'not-allowed';
  // Hết đường nhận dạng thì chuyển sang tự đánh giá, trang vẫn dùng được bình thường.
  const canRecognize = supported && !permissionDenied;
  const pinyinVisible = !hidePinyin || pinyinRevealed;
  const usedHint = hidePinyin && pinyinRevealed;

  useEffect(() => {
    aliveRef.current = true;
    startedAtRef.current = Date.now();
    return () => {
      // Rời trang hay sang từ khác là phải trả micro lại cho hệ thống ngay.
      aliveRef.current = false;
      recognizer.abort();
    };
  }, [recognizer]);

  // Các hàm gọi lại của bộ nhận dạng đọc đáp án qua ref nên phải cập nhật ref mỗi khi
  // người học đổi giữa đọc từ và đọc câu ví dụ.
  useEffect(() => {
    expectedRef.current = expected;
  }, [expected]);

  const resetAttempt = useCallback(() => {
    transcriptRef.current = '';
    setTranscript('');
    setAssessment(null);
    setProblem(null);
  }, []);

  const playSample = useCallback(
    (rate?: number) => {
      // `speak` không bao giờ reject nên chỉ cần thả trôi lời hứa.
      void speak(expected.hanzi, 'zh-CN', rate);
    },
    [speak, expected.hanzi],
  );

  const handleStart = useCallback(() => {
    if (recognizer.isListening()) return;
    // Tiếng của bộ đọc mẫu sẽ lọt thẳng vào micro nếu còn đang phát.
    cancel();
    resetAttempt();
    cancelledRef.current = false;
    setListening(true);
    setAttempts((count) => count + 1);

    // start() chỉ chạy trong đúng hàm xử lý cú bấm này, không có đường nào gọi sớm hơn.
    recognizer.start('zh-CN', {
      onStart: () => {
        if (aliveRef.current) setListening(true);
      },
      onResult: (update) => {
        // Giữ cả kết quả tạm thời để người học thấy chữ hiện dần ngay trong lúc nói.
        if (update.transcript === '') return;
        transcriptRef.current = update.transcript;
        if (aliveRef.current) setTranscript(update.transcript);
      },
      onError: (code, message) => {
        if (!aliveRef.current) return;
        setProblem({ code, message });
      },
      onEnd: () => {
        if (!aliveRef.current) return;
        setListening(false);
        const heard = transcriptRef.current.trim();
        if (heard === '') {
          // Không có gì để chấm. Trình duyệt thường bắn 'error' kèm theo, nhưng không phải
          // lúc nào cũng vậy: hạn thoát kẹt sau stop() chốt lượt nghe mà không kèm lỗi nào.
          // Im lặng ở đây thì màn hình chẳng còn dòng nào, người học không biết đã xảy ra gì.
          if (!cancelledRef.current) {
            setProblem(
              (current) => current ?? { code: 'no-transcript', message: NO_TRANSCRIPT_MESSAGE },
            );
          }
          return;
        }
        setAssessing(true);
        provider
          .assess({
            expectedHanzi: expectedRef.current.hanzi,
            expectedPinyin: expectedRef.current.pinyin,
            transcript: heard,
          })
          .then((result) => {
            if (aliveRef.current) setAssessment(result);
          })
          .catch((cause: unknown) => {
            if (!aliveRef.current) return;
            setProblem({
              code: 'assess-failed',
              message:
                cause instanceof Error ? cause.message : 'Không đối chiếu được kết quả vừa nghe.',
            });
          })
          .finally(() => {
            if (aliveRef.current) setAssessing(false);
          });
      },
    });
  }, [recognizer, provider, cancel, resetAttempt]);

  const handleStop = useCallback(() => {
    recognizer.stop();
  }, [recognizer]);

  const handleTargetChange = useCallback(
    (next: SpeakingTarget) => {
      cancelledRef.current = true;
      recognizer.abort();
      cancel();
      setTarget(next);
      setListening(false);
      setAttempts(0);
      resetAttempt();
    },
    [recognizer, cancel, resetAttempt],
  );

  const finish = useCallback(
    (verdict: AnswerVerdict) => {
      // Chạm hai lần thật nhanh trên điện thoại có thể ghi hai lượt cho cùng một từ.
      if (submittedRef.current) return;
      submittedRef.current = true;
      cancelledRef.current = true;
      recognizer.abort();
      cancel();
      const startedAt = startedAtRef.current;
      onSubmit({
        verdict,
        usedHint,
        given: transcriptRef.current.trim(),
        expected: expected.hanzi,
        // startedAt bằng 0 nghĩa là effect gắn kết chưa chạy, khi đó chưa có gì để đo.
        elapsedMs: startedAt === 0 ? 0 : Date.now() - startedAt,
      });
    },
    [recognizer, cancel, onSubmit, usedHint, expected.hanzi],
  );

  const handleSkip = useCallback(() => {
    cancelledRef.current = true;
    recognizer.abort();
    cancel();
    onSkip();
  }, [recognizer, cancel, onSkip]);

  const listenDisabled = !ttsSupported || listening;

  return (
    <div
      className="min-w-0"
    >
      {example !== null ? (
        <div
          className="mb-4"
        >
          <Segmented
            legend="Nội dung đọc"
            options={TARGET_OPTIONS}
            value={target}
            onChange={handleTargetChange}
          />
        </div>
      ) : null}

      {/* Tấm thẻ đọc mẫu: chữ lớn, viền mảnh, không lồng thêm khung nào bên trong. */}
      <section
        aria-label="Nội dung cần đọc"
        className="min-w-0 border border-line bg-surface px-5 py-6 rounded-[0.375rem] xsm:px-4 xsm:py-5"
      >
        {usingExample && example !== null ? (
          <div
            className="min-w-0"
          >
            <ExampleBlock
              example={example}
              displayMode={displayMode}
              showPinyin={pinyinVisible}
            />
            {pinyinVisible ? null : (
              <div
                className="mt-2"
              >
                <PinyinLine
                  pinyin={example.pinyin}
                  hidden
                  onReveal={() => setPinyinRevealed(true)}
                />
              </div>
            )}
          </div>
        ) : (
          <div
            className="flex min-w-0 flex-col items-center"
          >
            <WordFace
              word={word}
              size="xl"
              showTraditional={showTraditional}
              className="text-center"
            />
            <div
              className="mt-3"
            >
              {pinyinVisible ? (
                <PinyinLine
                  pinyin={word.pinyin}
                />
              ) : (
                <PinyinLine
                  pinyin={word.pinyin}
                  hidden
                  onReveal={() => setPinyinRevealed(true)}
                />
              )}
            </div>
            <div
              className="mt-4 w-full min-w-0 border-t border-line pt-4"
            >
              <MeaningList
                word={word}
                displayMode={displayMode}
                compact
              />
            </div>
          </div>
        )}

        <div
          className="mt-5 flex items-center justify-center space-x-2 border-t border-line pt-4"
        >
          <Button
            variant="secondary"
            icon="volume"
            disabled={listenDisabled}
            onClick={() => playSample()}
          >
            {speaking ? 'Đang đọc mẫu' : 'Nghe mẫu'}
          </Button>
          <Button
            variant="ghost"
            icon="volume-slow"
            disabled={listenDisabled}
            onClick={() => playSample(SLOW_RATE)}
          >
            Chậm
          </Button>
        </div>
        {ttsSupported ? null : (
          <p
            className="mt-2 text-center text-[0.8125rem] text-ink-faint"
          >
            Thiết bị này không có phần đọc tiếng Trung nên chưa nghe được mẫu.
          </p>
        )}
      </section>

      <div
        className="mt-4 min-w-0 space-y-3"
      >
        <Notice
          tone="info"
          title="Chế độ này chấm bằng cách nào"
        >
          {HONEST_NOTE}
        </Notice>

        {supported ? null : (
          <Notice
            tone="warn"
            title="Trình duyệt này không nhận dạng được giọng nói"
          >
            Bạn vẫn nghe mẫu và đọc theo được. Đọc xong, hãy tự chọn một trong hai mức bên
            dưới; ứng dụng ghi lại đúng lựa chọn đó chứ không chấm thêm gì.
          </Notice>
        )}

        {permissionDenied ? (
          <Notice
            tone="error"
            title="Trang chưa được dùng micro"
          >
            <p
              className="min-w-0"
            >
              Bật lại quyền micro rồi bấm nút nói lần nữa:
            </p>
            <ol
              className="mt-1.5 list-decimal space-y-1 pl-5"
            >
              <li>Bấm biểu tượng ổ khoá hoặc chữ “Aa” ở đầu thanh địa chỉ.</li>
              <li>Mở phần “Cài đặt trang” hay “Quyền”, bật lại mục “Micro”.</li>
              <li>Tải lại trang rồi bấm nút nói.</li>
            </ol>
            <p
              className="mt-1.5 min-w-0"
            >
              Chưa bật lại được thì vẫn dùng được hai nút tự đánh giá bên dưới.
            </p>
          </Notice>
        ) : null}

        {problem !== null && !permissionDenied ? (
          <Notice
            tone="warn"
            title="Lượt nghe chưa xong"
          >
            {problem.message}
          </Notice>
        ) : null}

        <div
          role="status"
          aria-live="polite"
          className="min-w-0"
        >
          {listening ? (
            <p
              className="flex min-w-0 items-center text-[0.875rem] font-medium text-cinnabar"
            >
              <span
                aria-hidden="true"
                className="mr-2 block h-2 w-2 shrink-0 animate-pulse rounded-full bg-cinnabar"
              />
              Đang nghe, hãy đọc to và rõ.
            </p>
          ) : null}

          {transcript === '' ? null : (
            <p
              className="mt-1.5 flex min-w-0 flex-wrap items-baseline"
            >
              <span
                className="mr-2 shrink-0 text-[0.8125rem] text-ink-faint"
              >
                Hệ thống nghe được:
              </span>
              <span
                lang="zh-Hans"
                className="han min-w-0 text-[1.375rem] break-words text-ink"
              >
                {transcript}
              </span>
            </p>
          )}

          {assessing ? (
            <p
              className="mt-1.5 text-[0.875rem] text-ink-faint"
            >
              Đang đối chiếu với đáp án…
            </p>
          ) : null}
        </div>

        {assessment !== null ? (
          <VerdictBanner
            verdict={assessment.verdict}
            usedHint={usedHint}
            explanation={assessment.detail}
            expected={`${expected.hanzi} — ${expected.pinyin}`}
          >
            <p
              className="text-[0.8125rem] text-ink-soft"
            >
              Nghe mẫu và đọc lại bao nhiêu lần cũng được. Kết quả chỉ vào tiến độ khi bạn bấm
              “Ghi nhận kết quả”.
            </p>
          </VerdictBanner>
        ) : null}

        {attempts > 0 ? (
          <p
            className="text-[0.8125rem] text-ink-faint"
          >
            {`Đã ghi âm ${attempts} lần cho từ này.`}
          </p>
        ) : null}
      </div>

      {/* Khu vực hành động bám đáy vùng cuộn trên điện thoại, nằm ngay trên thanh điều hướng. */}
      <div
        className="mt-5 border-t border-line bg-paper pt-3 xsm:sticky xsm:bottom-[calc(4.75rem_+_env(safe-area-inset-bottom))] xsm:z-20 xsm:-mx-4 xsm:px-4 xsm:pb-3"
      >
        {canRecognize ? (
          <>
            <Button
              variant={listening ? 'danger' : 'primary'}
              size="lg"
              icon={listening ? 'stop' : 'mic'}
              block
              disabled={assessing}
              onClick={listening ? handleStop : handleStart}
            >
              {listening ? 'Dừng ghi âm' : attempts === 0 ? 'Bấm để nói' : 'Nói lại'}
            </Button>
            <div
              className="mt-2 flex items-center space-x-2"
            >
              <Button
                variant="ghost"
                block
                onClick={handleSkip}
              >
                Bỏ qua từ này
              </Button>
              <Button
                variant="secondary"
                block
                disabled={assessment === null || listening || assessing}
                onClick={() => finish(assessment?.verdict ?? 'wrong')}
              >
                Ghi nhận kết quả
              </Button>
            </div>
          </>
        ) : (
          <>
            <p
              className="mb-2 text-[0.8125rem] text-ink-soft"
            >
              Đọc theo mẫu rồi tự đánh giá:
            </p>
            <div
              className="flex items-center space-x-2"
            >
              <Button
                variant="secondary"
                size="lg"
                block
                onClick={() => finish('close')}
              >
                Cần luyện thêm
              </Button>
              <Button
                variant="primary"
                size="lg"
                block
                onClick={() => finish('correct')}
              >
                Đã ổn
              </Button>
            </div>
            <div
              className="mt-2"
            >
              <Button
                variant="ghost"
                block
                onClick={handleSkip}
              >
                Bỏ qua từ này
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
