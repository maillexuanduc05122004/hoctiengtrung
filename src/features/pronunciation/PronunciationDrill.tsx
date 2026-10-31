/**
 * Luyện phát âm cả câu dài.
 *
 * Mỗi lần một câu (thường 12–25 chữ): chữ Hán kèm pinyin từng chữ, nghĩa, và
 * nút nghe mẫu. Người học bấm ghi âm, đọc to cả câu, bấm "Xong".
 *
 * Hai cách chấm:
 * - **AI nghe và chấm** (mặc định khi máy chủ có AI): gửi bản ghi cho AI, AI
 *   chấm TỪNG âm tiết — đúng, sai thanh, sai phụ âm đầu, sai vần, bỏ sót — kèm
 *   âm nó nghe được và mẹo sửa cho người Việt. Người học nghe lại được giọng mình.
 * - **Nhận dạng của trình duyệt**: máy nghe ra chữ gì thì so với câu mẫu. Chỉ
 *   biết chữ nào máy nghe ra hay không, không chấm được thanh điệu — giao diện
 *   nói thẳng điều đó.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../../components/ui/Button.tsx';
import { Segmented, Toggle, type SegmentedOption } from '../../components/ui/Controls.tsx';
import { Notice, ProgressBar } from '../../components/ui/Feedback.tsx';
import { describeApiError } from '../../lib/api/client.ts';
import { assessPronunciation } from '../../lib/api/endpoints.ts';
import { withRetry } from '../../lib/api/retry.ts';
import type { ExpectedSyllable, PronunciationResponse } from '../../lib/api/types.ts';
import {
  createVoiceRecorder,
  describeMicError,
  isRecordingSupported,
  recordingToWav,
  type VoiceRecorder,
} from '../../lib/audio/recorder.ts';
import { createSpeechRecognizer } from '../../lib/speech/index.ts';
import { SpeakerButton } from '../shared/SpeakerButton.tsx';
import type { PracticeSentence } from '../sentence-practice/pool.ts';
import type { TutorStatus } from '../sentence-practice/useTutorStatus.ts';
import { compareTranscript, type BrowserComparison } from './syllables.ts';
import { ISSUE_LABEL, SyllableGrid, type GridSyllable } from './SyllableGrid.tsx';

/** Câu đã có danh sách âm tiết thẳng hàng với chữ. */
export interface PronounceSentence extends PracticeSentence {
  syllables: ExpectedSyllable[];
}

type Mode = 'ai' | 'may';

const MODES: readonly SegmentedOption<Mode>[] = [
  { value: 'ai', label: 'AI nghe và chấm' },
  { value: 'may', label: 'Nhận dạng của trình duyệt' },
];

const READ_RATE = 0.75;
/** Ghi quá lâu thì tự dừng: câu dài nhất cũng chỉ cần chừng 15 giây. */
const MAX_RECORD_SECONDS = 45;
/** Dưới mức này là bản ghi gần như im lặng, gửi đi chỉ phí lượt AI. */
const SILENCE_LEVEL = 0.004;
/** Điểm từ mức này trở lên thì coi như đã đọc tốt câu đó. */
const GOOD_SCORE = 80;

type Phase = 'idle' | 'recording' | 'processing' | 'done' | 'error';

interface Result {
  score: number;
  ai: PronunciationResponse | null;
  browser: (BrowserComparison & { transcript: string }) | null;
}

export interface PronunciationDrillProps {
  sentences: readonly PronounceSentence[];
  tutor: TutorStatus;
  onNewRound: () => void;
}

function formatSeconds(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

export function PronunciationDrill({ sentences, tutor, onNewRound }: PronunciationDrillProps) {
  const recognizer = useMemo(() => createSpeechRecognizer(), []);
  const canRecord = isRecordingSupported();
  const canRecognize = recognizer.isSupported();

  const [mode, setMode] = useState<Mode>(() =>
    canRecord && tutor.state !== 'off' ? 'ai' : canRecognize ? 'may' : 'ai',
  );
  const [queue, setQueue] = useState<number[]>(() => sentences.map((_, i) => i));
  const [position, setPosition] = useState(0);
  const [showPinyin, setShowPinyin] = useState(true);
  const [phase, setPhase] = useState<Phase>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [heardSoFar, setHeardSoFar] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [scores, setScores] = useState<ReadonlyMap<number, number>>(() => new Map());

  const recorder = useRef<VoiceRecorder | null>(null);
  const request = useRef<AbortController | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const segments = useRef<Map<number, string>>(new Map());
  const alive = useRef(true);
  /**
   * Tăng mỗi lần bỏ lượt đang làm (huỷ, sang câu, đổi cách chấm). Kết quả về
   * muộn của lượt cũ so số này để biết mình đã lỗi thời và không vẽ đè lên câu mới.
   */
  const generation = useRef(0);

  const index = position < queue.length ? queue[position] : -1;
  const sentence = index >= 0 ? sentences[index] : undefined;

  const setRecordingUrl = (url: string | null): void => {
    if (audioUrlRef.current !== null) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = url;
    setAudioUrl(url);
  };

  // Rời trang: trả micro, huỷ lượt chấm đang bay, giải phóng bản ghi.
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      recorder.current?.cancel();
      request.current?.abort();
      recognizer.abort();
      if (audioUrlRef.current !== null) URL.revokeObjectURL(audioUrlRef.current);
    };
  }, [recognizer]);

  const fail = (message: string): void => {
    if (!alive.current) return;
    setPhase('error');
    setError(message);
  };

  const record = (score: number): void => {
    setScores((previous) => new Map(previous).set(index, score));
  };

  const finishRecording = useCallback(async (): Promise<void> => {
    const active = recorder.current;
    if (active === null || sentence === undefined) return;
    recorder.current = null;
    const turn = generation.current;
    const stale = (): boolean => !alive.current || generation.current !== turn;
    setPhase('processing');
    const blob = await active.stop();
    if (stale()) return;
    setRecordingUrl(blob.size > 0 ? URL.createObjectURL(blob) : null);
    try {
      const wav = await recordingToWav(blob);
      if (stale()) return;
      if (wav.seconds < 0.6 || wav.level < SILENCE_LEVEL) {
        fail('Bản ghi gần như không có tiếng. Hãy đọc to và rõ hơn, để điện thoại gần miệng rồi thử lại.');
        return;
      }
      const controller = new AbortController();
      request.current = controller;
      const response = await withRetry(
        (signal) =>
          assessPronunciation(
            {
              hanzi: sentence.hanzi,
              syllables: sentence.syllables,
              audioBase64: wav.base64,
              mimeType: wav.mimeType,
            },
            signal,
          ),
        { signal: controller.signal },
      );
      if (stale() || controller.signal.aborted) return;
      setResult({ score: response.score, ai: response, browser: null });
      setPhase('done');
      setScores((previous) => new Map(previous).set(index, response.score));
    } catch (cause: unknown) {
      if (stale()) return;
      fail(describeApiError(cause));
    }
  }, [sentence, index]);

  // Tự dừng khi ghi quá lâu, và đếm giây cho người học thấy máy đang ghi.
  useEffect(() => {
    if (phase !== 'recording') return undefined;
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const seconds = (Date.now() - startedAt) / 1000;
      setElapsed(seconds);
      if (seconds >= MAX_RECORD_SECONDS) {
        if (mode === 'ai') void finishRecording();
        else recognizer.stop();
      }
    }, 250);
    return () => clearInterval(timer);
  }, [phase, mode, finishRecording, recognizer]);

  const startAi = async (): Promise<void> => {
    const next = createVoiceRecorder();
    recorder.current = next;
    try {
      await next.start();
    } catch (cause: unknown) {
      recorder.current = null;
      fail(describeMicError(cause));
      return;
    }
    if (!alive.current) {
      next.cancel();
      return;
    }
    setElapsed(0);
    setPhase('recording');
  };

  const startBrowser = (): void => {
    if (sentence === undefined) return;
    const target = sentence;
    const turn = generation.current;
    segments.current = new Map();
    setHeardSoFar('');
    let failed = false;
    recognizer.start(
      'zh-CN',
      {
        onStart: () => {
          setElapsed(0);
          setPhase('recording');
        },
        onResult: (update) => {
          segments.current.set(update.index, update.transcript);
          const text = [...segments.current.entries()]
            .sort((a, b) => a[0] - b[0])
            .map(([, part]) => part)
            .join('');
          setHeardSoFar(text);
        },
        onError: (code, message) => {
          // Người học bấm "Xong" khi chưa nói gì thì 'no-speech'; báo như mọi lỗi khác.
          if (code === 'aborted') return;
          failed = true;
          fail(message);
        },
        onEnd: () => {
          if (!alive.current || failed || generation.current !== turn) return;
          const transcript = [...segments.current.entries()]
            .sort((a, b) => a[0] - b[0])
            .map(([, part]) => part)
            .join('');
          if (transcript.trim() === '') {
            fail('Máy chưa nghe được gì. Bấm ghi âm rồi đọc to cả câu nhé.');
            return;
          }
          const comparison = compareTranscript(target.syllables, transcript);
          setResult({ score: comparison.percent, ai: null, browser: { ...comparison, transcript } });
          setPhase('done');
          setScores((previous) => new Map(previous).set(index, comparison.percent));
        },
      },
      { continuous: true },
    );
  };

  const start = (): void => {
    generation.current += 1;
    setError(null);
    setResult(null);
    setRecordingUrl(null);
    if (mode === 'ai') void startAi();
    else startBrowser();
  };

  const stop = (): void => {
    if (mode === 'ai') void finishRecording();
    else recognizer.stop();
  };

  const cancel = (): void => {
    generation.current += 1;
    recorder.current?.cancel();
    recorder.current = null;
    recognizer.abort();
    setPhase('idle');
  };

  const reset = (): void => {
    generation.current += 1;
    recorder.current?.cancel();
    recorder.current = null;
    request.current?.abort();
    recognizer.abort();
    setPhase('idle');
    setError(null);
    setResult(null);
    setHeardSoFar('');
    setRecordingUrl(null);
  };

  const next = (): void => {
    reset();
    setPosition((value) => value + 1);
  };

  const changeMode = (value: Mode): void => {
    reset();
    setMode(value);
  };

  const restart = (onlyWeak: boolean): void => {
    const weak = queue.filter((i) => (scores.get(i) ?? 0) < GOOD_SCORE);
    reset();
    setQueue(onlyWeak && weak.length > 0 ? weak : sentences.map((_, i) => i));
    setPosition(0);
    setScores(new Map());
  };

  const done = [...scores.values()];
  const average = done.length === 0 ? 0 : Math.round(done.reduce((sum, v) => sum + v, 0) / done.length);

  const toolbar = (
    <div
      className="mb-4 flex flex-wrap items-end justify-between"
    >
      <span
        className="mr-4 mb-2"
      >
        <Segmented
          legend="Cách chấm"
          options={MODES}
          value={mode}
          onChange={changeMode}
        />
      </span>
      <span
        className="mb-2 w-[14rem] xsm:w-full"
      >
        <ProgressBar
          label="Đã đọc"
          value={scores.size}
          max={queue.length}
          hint={`${scores.size}/${queue.length} câu${done.length > 0 ? ` · trung bình ${average} điểm` : ''}`}
        />
      </span>
    </div>
  );

  const unsupported =
    mode === 'ai' && !canRecord
      ? 'Trình duyệt này không ghi âm được. Hãy mở bằng Chrome, Edge hoặc Safari bản mới.'
      : mode === 'may' && !canRecognize
        ? 'Trình duyệt này không có nhận dạng giọng nói. Hãy chọn "AI nghe và chấm" hoặc mở bằng Chrome.'
        : null;

  if (sentence === undefined) {
    const weak = queue.filter((i) => (scores.get(i) ?? 0) < GOOD_SCORE).length;
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
            {`Xong ${queue.length} câu · trung bình ${average} điểm`}
          </h2>
          <p
            className="mt-1 text-[0.9375rem] text-ink-soft"
          >
            {weak > 0
              ? `Còn ${weak} câu dưới ${GOOD_SCORE} điểm — đọc lại riêng những câu đó cho quen miệng.`
              : 'Câu nào cũng từ 80 điểm trở lên. Tốt lắm!'}
          </p>
          <div
            className="mt-4 flex flex-wrap"
          >
            {weak > 0 ? (
              <span
                className="mr-2 mb-2"
              >
                <Button
                  variant="primary"
                  icon="refresh"
                  autoFocus
                  onClick={() => restart(true)}
                >
                  {`Đọc lại ${weak} câu chưa tốt`}
                </Button>
              </span>
            ) : null}
            <span
              className="mb-2"
            >
              <Button
                variant={weak > 0 ? 'secondary' : 'primary'}
                icon="arrow-right"
                autoFocus={weak === 0}
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

  const grid: GridSyllable[] = sentence.syllables.map((syllable, i) => {
    if (result?.ai) {
      const assessed = result.ai.syllables[i];
      return {
        ...syllable,
        status: assessed === undefined ? 'unclear' : assessed.ok ? 'none' : assessed.issue,
        heard: assessed?.heard,
      };
    }
    if (result?.browser) {
      const mark = result.browser.marks[i];
      return { ...syllable, status: mark === 'ok' ? 'none' : mark };
    }
    return { ...syllable, status: 'pending' };
  });
  const mistakes = (result?.ai?.syllables ?? [])
    .map((assessed, i) => ({ ...assessed, position: i }))
    .filter((assessed) => !assessed.ok);
  const last = position === queue.length - 1;
  const recording = phase === 'recording';
  const busy = phase === 'processing';

  return (
    <div
      className="min-w-0"
    >
      {toolbar}

      {mode === 'may' ? (
        <div
          className="mb-4"
        >
          <Notice tone="info">
            Cách này chỉ kiểm tra máy có nghe ra đúng chữ hay không. Đọc sai thanh mà máy vẫn đoán đúng chữ
            nhờ ngữ cảnh thì vẫn tính là đúng — muốn chấm kỹ thanh điệu, chọn &quot;AI nghe và chấm&quot;.
          </Notice>
        </div>
      ) : null}

      <article
        className="rounded-[0.375rem] border border-line bg-surface px-4 py-3"
      >
        <div
          className="flex items-start justify-between"
        >
          <p
            className="pt-2.5 text-[0.75rem] tabular-nums text-ink-faint"
          >
            {`Câu ${String(position + 1).padStart(2, '0')} / ${queue.length} · Bài ${sentence.lessonNumber} · ${sentence.syllables.length} chữ`}
          </p>
          <span
            className="flex shrink-0"
          >
            <SpeakerButton
              text={sentence.hanzi}
              rate={READ_RATE}
              label="Nghe mẫu"
            />
            <SpeakerButton
              text={sentence.hanzi}
              rate={READ_RATE}
              slow
              label="Nghe mẫu chậm hơn"
            />
          </span>
        </div>
        <div
          className="mt-1"
        >
          <SyllableGrid
            syllables={grid}
            showPinyin={showPinyin}
          />
        </div>
        <p
          className="mt-1.5 text-[0.9375rem] text-ink-soft"
        >
          {sentence.vi}
        </p>
        <div
          className="mt-3 border-t border-line pt-2"
        >
          <Toggle
            label="Hiện pinyin trên từng chữ"
            checked={showPinyin}
            onChange={setShowPinyin}
          />
        </div>
      </article>

      {unsupported !== null ? (
        <div
          className="mt-4"
        >
          <Notice tone="warn">{unsupported}</Notice>
        </div>
      ) : null}

      {mode === 'ai' && tutor.state === 'off' ? (
        <div
          className="mt-4"
        >
          <Notice
            tone="warn"
            title="AI chấm phát âm chưa dùng được"
          >
            {`${tutor.reason} Tạm thời chọn "Nhận dạng của trình duyệt".`}
          </Notice>
        </div>
      ) : null}

      <div
        className="mt-4"
      >
        {recording ? (
          <div
            role="status"
            aria-live="polite"
            className="rounded-[0.375rem] border border-cinnabar/40 bg-cinnabar-soft px-4 py-3"
          >
            <p
              className="flex items-center text-[0.9375rem] font-medium text-cinnabar-ink"
            >
              <span
                aria-hidden="true"
                className="mr-2 h-2.5 w-2.5 animate-pulse rounded-full bg-cinnabar"
              />
              {`Đang nghe… ${formatSeconds(elapsed)} — đọc to cả câu rồi bấm "Xong".`}
            </p>
            {mode === 'may' && heardSoFar !== '' ? (
              <p
                lang="zh-CN"
                className="han mt-1.5 break-words text-[1.25rem] text-ink"
              >
                {heardSoFar}
              </p>
            ) : null}
            <div
              className="mt-3 flex flex-wrap"
            >
              <span
                className="mr-2 mb-1"
              >
                <Button
                  variant="primary"
                  icon="stop"
                  autoFocus
                  onClick={stop}
                >
                  Xong, chấm đi
                </Button>
              </span>
              <span
                className="mb-1"
              >
                <Button
                  variant="ghost"
                  onClick={cancel}
                >
                  Huỷ
                </Button>
              </span>
            </div>
          </div>
        ) : busy ? (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center rounded-[0.375rem] border border-line bg-surface px-4 py-3 text-[0.9375rem] text-ink-soft"
          >
            <span
              className="mr-2.5 h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-line-strong border-t-cinnabar"
            />
            AI đang nghe giọng bạn và chấm từng âm tiết… (máy chủ vừa thức dậy thì có thể mất nửa phút)
          </div>
        ) : (
          <Button
            variant={phase === 'done' ? 'secondary' : 'primary'}
            size="lg"
            icon="mic"
            disabled={unsupported !== null}
            onClick={start}
          >
            {phase === 'done' || phase === 'error' ? 'Đọc lại câu này' : 'Bấm rồi đọc to cả câu'}
          </Button>
        )}
      </div>

      {phase === 'error' && error !== null ? (
        <div
          className="mt-4"
        >
          <Notice
            tone="error"
            title="Chưa chấm được"
          >
            {error}
          </Notice>
        </div>
      ) : null}

      {audioUrl !== null && !recording ? (
        <div
          className="mt-4"
        >
          <p
            className="mb-1 text-[0.8125rem] font-medium text-ink-soft"
          >
            Giọng bạn vừa đọc — nghe lại rồi so với giọng mẫu:
          </p>
          <audio
            controls
            src={audioUrl}
            className="w-full max-w-[28rem]"
          />
        </div>
      ) : null}

      {phase === 'done' && result !== null ? (
        <section
          aria-label="Kết quả chấm"
          className="mt-4 rounded-[0.375rem] border border-line bg-surface px-4 py-3"
        >
          <p
            className="flex items-baseline"
          >
            <span
              className={[
                'text-[2rem] font-semibold tabular-nums',
                result.score >= GOOD_SCORE ? 'text-teal-ink' : result.score >= 50 ? 'text-partial' : 'text-cinnabar-ink',
              ].join(' ')}
            >
              {result.score}
            </span>
            <span
              className="ml-1 text-[0.9375rem] text-ink-faint"
            >
              {result.ai ? '/ 100 điểm' : '% chữ máy nghe ra đúng'}
            </span>
          </p>

          {result.ai ? (
            <>
              {result.ai.summary.trim() !== '' ? (
                <p
                  className="mt-1 text-[0.9375rem] leading-relaxed text-ink"
                >
                  {result.ai.summary}
                </p>
              ) : null}
              {result.ai.heardHanzi.trim() !== '' ? (
                <p
                  className="mt-2 text-[0.8125rem] text-ink-faint"
                >
                  {'AI nghe được: '}
                  <span
                    lang="zh-CN"
                    className="han text-[1rem] text-ink"
                  >
                    {result.ai.heardHanzi}
                  </span>
                  {result.ai.heardPinyin.trim() !== '' ? ` (${result.ai.heardPinyin})` : null}
                </p>
              ) : null}
              {mistakes.length > 0 ? (
                <ul
                  className="m-0 mt-3 list-none space-y-2 border-t border-line p-0 pt-3"
                >
                  {mistakes.map((mistake) => (
                    <li
                      key={mistake.position}
                      className="min-w-0 text-[0.875rem] leading-relaxed text-ink-soft"
                    >
                      <span
                        lang="zh-CN"
                        className="han mr-1 text-[1.125rem] text-ink"
                      >
                        {mistake.hanzi}
                      </span>
                      <span
                        className="font-semibold text-ink"
                      >
                        {mistake.expected}
                      </span>
                      {mistake.heard.trim() !== '' && mistake.heard !== mistake.expected
                        ? ` — bạn đọc thành ${mistake.heard}`
                        : null}
                      {` · ${ISSUE_LABEL[mistake.issue] || 'chưa chuẩn'}`}
                      {mistake.tip.trim() !== '' ? (
                        <span
                          className="block text-ink"
                        >
                          {mistake.tip}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p
                  className="mt-2 text-[0.875rem] text-teal-ink"
                >
                  AI không thấy âm tiết nào sai.
                </p>
              )}
              <p
                className="mt-3 text-[0.75rem] text-ink-faint"
              >
                AI cũng có lúc nghe nhầm — nghe lại giọng mình và giọng mẫu để tự so.
              </p>
            </>
          ) : null}

          {result.browser ? (
            <p
              className="mt-1 text-[0.875rem] text-ink-faint"
            >
              {'Máy nghe được: '}
              <span
                lang="zh-CN"
                className="han text-[1rem] text-ink"
              >
                {result.browser.transcript}
              </span>
            </p>
          ) : null}
        </section>
      ) : null}

      {phase === 'done' || phase === 'error' ? (
        <div
          className="mt-4 flex flex-wrap"
        >
          <span
            className="mr-2 mb-2"
          >
            <Button
              variant="primary"
              icon="arrow-right"
              onClick={next}
            >
              {last ? 'Xem kết quả' : 'Câu tiếp'}
            </Button>
          </span>
          {phase === 'error' ? (
            <span
              className="mb-2"
            >
              <Button
                variant="ghost"
                onClick={() => {
                  record(0);
                  next();
                }}
              >
                Bỏ qua câu này
              </Button>
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
