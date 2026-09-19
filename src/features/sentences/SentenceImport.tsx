/**
 * Phần B của thẻ "Thêm từ & câu": thêm câu luyện nghe.
 *
 * Đường chính: máy chủ gọi AI viết câu từ đúng vốn từ đã học, lọc bỏ mọi câu
 * dùng chữ lạ — và mọi câu chỉ là câu cũ đổi chỗ chữ — rồi mới lưu; người học
 * bấm một nút là có câu mới. Mặc định AI được dặn ưu tiên nhóm từ mới nhất
 * (`newestWords`), vì người học vừa thêm từ thì muốn nghe ngay câu ghép từ đó
 * với vốn từ cũ; chọn "Mọi từ" thì AI trộn đều cả vốn từ. Mặc định bộ mới THAY
 * bộ AI cũ (máy chủ xoá câu AI cũ ngay khi lưu bộ mới): người học muốn phần nghe
 * là bộ vừa tạo, không phải một kho cứ phình ra toàn câu đã nghe; chọn "Giữ"
 * khi muốn gom nhiều đợt. Đường phụ giữ lại từ
 * bản cũ: chép câu lệnh sang một trợ lý khác rồi dán kết quả về, cho lúc máy
 * chủ chưa cấu hình khoá AI hoặc người học muốn dùng trợ lý quen.
 *
 * Thành phần này không tự gọi API: nó dựng yêu cầu và giao cho trang, vì kết
 * quả (thông báo, chuyển sang thẻ nghe, mục "câu vừa tạo") thuộc về trang chứ
 * không thuộc về thẻ này — thẻ này bị gỡ ngay khi trang chuyển thẻ.
 */
import { useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button.tsx';
import { Segmented, type SegmentedOption } from '../../components/ui/Controls.tsx';
import { Notice, Spinner } from '../../components/ui/Feedback.tsx';
import type {
  AiStatus,
  GenerateSentencesRequest,
  Sentence,
  SentenceInput,
  SentenceSource,
  UserWord,
} from '../../lib/api/types.ts';
import { toSentenceInputs } from './manual.ts';
import { parseSentences } from './parse.ts';
import { buildExistingList, buildPrompt } from './prompt.ts';
import { newestWords } from './words.ts';

type CountChoice = '10' | '20' | '30' | '50';
type LevelChoice = 'mix' | '1' | '2' | '3';
type FocusChoice = 'newest' | 'all';
type OldAiChoice = 'replace' | 'keep';

const COUNT_OPTIONS: readonly SegmentedOption<CountChoice>[] = [
  { value: '10', label: '10' },
  { value: '20', label: '20' },
  { value: '30', label: '30' },
  { value: '50', label: '50' },
];

const LEVEL_OPTIONS: readonly SegmentedOption<LevelChoice>[] = [
  { value: 'mix', label: 'Trộn' },
  { value: '1', label: '1', srLabel: 'Cấp 1' },
  { value: '2', label: '2', srLabel: 'Cấp 2' },
  { value: '3', label: '3', srLabel: 'Cấp 3' },
];

const FOCUS_OPTIONS: readonly SegmentedOption<FocusChoice>[] = [
  { value: 'newest', label: 'Ưu tiên từ mới' },
  { value: 'all', label: 'Mọi từ' },
];

const OLD_AI_OPTIONS: readonly SegmentedOption<OldAiChoice>[] = [
  { value: 'replace', label: 'Thay' },
  { value: 'keep', label: 'Giữ' },
];

/** Số câu hay xin ở trợ lý ngoài; người học nhắc tới 30, 50 và 90. */
const PROMPT_COUNTS = [30, 50, 90] as const;

/** Máy chủ từ chối viết câu khi vốn từ ít hơn mức này. */
export const MIN_WORDS_FOR_AI = 5;

export interface SentenceImportProps {
  /** Vốn từ đã học, để ghi vào câu lệnh và để biết có đủ từ cho AI chưa. */
  words: readonly UserWord[];
  /** Mọi câu đang có, để dựng danh sách "đừng tạo lại" và đếm theo nguồn. */
  sentences: readonly Sentence[];
  /** `null` khi chưa hỏi xong máy chủ. */
  ai: AiStatus | null;
  generating: boolean;
  onGenerate: (request: GenerateSentencesRequest) => Promise<void>;
  /** Trả `true` khi máy chủ đã nhận; chỉ khi đó ô dán mới được xoá. */
  onAdd: (inputs: SentenceInput[]) => Promise<boolean>;
  onRemoveBySource: (source: SentenceSource) => Promise<void>;
}

type CopyState = 'idle' | 'done' | 'failed';

export function SentenceImport({
  words,
  sentences,
  ai,
  generating,
  onGenerate,
  onAdd,
  onRemoveBySource,
}: SentenceImportProps) {
  const [count, setCount] = useState<CountChoice>('20');
  const [level, setLevel] = useState<LevelChoice>('mix');
  const [focus, setFocus] = useState<FocusChoice>('newest');
  const [oldAi, setOldAi] = useState<OldAiChoice>('replace');
  const [promptCount, setPromptCount] = useState<number>(50);
  const [draft, setDraft] = useState('');
  const [copied, setCopied] = useState<CopyState>('idle');
  const [busy, setBusy] = useState(false);

  const promptWords = useMemo(
    () => words.map((word) => ({ hanzi: word.simplified, pinyin: word.pinyin, vi: word.meaningVi })),
    [words],
  );
  const prompt = useMemo(
    () => buildPrompt({ count: promptCount, words: promptWords }),
    [promptCount, promptWords],
  );
  const preview = useMemo(() => parseSentences(draft), [draft]);
  const batch = useMemo(() => toSentenceInputs(preview.sentences), [preview]);
  const newest = useMemo(() => newestWords(words), [words]);

  const aiCount = sentences.filter((sentence) => sentence.source === 'AI').length;
  const manualCount = sentences.filter((sentence) => sentence.source === 'MANUAL').length;
  const enoughWords = words.length >= MIN_WORDS_FOR_AI;

  const copy = async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied('done');
    } catch {
      // Trình duyệt chặn clipboard (hay gặp khi mở trang qua http) thì nói thật
      // để người học tự bôi đen, chứ đừng báo đã chép xong.
      setCopied('failed');
    }
  };

  const generate = (): void => {
    const request: GenerateSentencesRequest = { count: Number(count) };
    if (level !== 'mix') request.level = Number(level) as 1 | 2 | 3;
    if (focus === 'newest' && newest.length > 0) {
      request.focusWords = newest.map((word) => word.simplified);
    }
    if (oldAi === 'replace') request.replaceAi = true;
    void onGenerate(request);
  };

  const add = async (): Promise<void> => {
    if (batch.inputs.length === 0 || busy) return;
    setBusy(true);
    try {
      const accepted = await onAdd(batch.inputs);
      if (accepted) setDraft('');
    } finally {
      setBusy(false);
    }
  };

  const clear = async (source: SentenceSource): Promise<void> => {
    if (busy) return;
    setBusy(true);
    try {
      await onRemoveBySource(source);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="max-w-[46rem]"
    >
      <section
        className="mb-6"
      >
        <h2
          className="mb-1 text-[1rem] font-semibold tracking-tight text-ink"
        >
          Thêm câu
        </h2>

        {ai === null ? (
          <p
            className="mb-3 text-[0.9375rem] text-ink-soft"
          >
            Đang hỏi máy chủ về AI…
          </p>
        ) : ai.enabled ? (
          <>
            <p
              className="mb-3 text-[0.9375rem] leading-relaxed text-ink-soft"
            >
              AI trên máy chủ ({ai.model}) ghép {words.length} từ bạn đã học thành câu mới — mỗi câu
              là một cách ghép khác, không phải câu cũ đổi chỗ. Câu dùng chữ chưa học, hay chỉ đổi chỗ
              câu đã có, bị loại trước khi lưu. Bộ mới <strong>thay</strong> {aiCount > 0 ? `${aiCount} câu AI đang có` : 'câu AI cũ'} để
              phần nghe luôn là câu mới; chọn <strong>Giữ</strong> nếu muốn gom thêm.
            </p>
            <div
              className="mb-2 flex flex-wrap items-end"
            >
              <span
                className="mr-4 mb-2"
              >
                <Segmented
                  legend="Số câu"
                  options={COUNT_OPTIONS}
                  value={count}
                  onChange={setCount}
                />
              </span>
              <span
                className="mr-4 mb-2"
              >
                <Segmented
                  legend="Cấp"
                  options={LEVEL_OPTIONS}
                  value={level}
                  onChange={setLevel}
                />
              </span>
              {newest.length > 0 ? (
                <span
                  className="mr-4 mb-2"
                >
                  <Segmented
                    legend="Từ"
                    options={FOCUS_OPTIONS}
                    value={focus}
                    onChange={setFocus}
                  />
                </span>
              ) : null}
              <span
                className="mr-4 mb-2"
              >
                <Segmented
                  legend="Câu AI cũ"
                  options={OLD_AI_OPTIONS}
                  value={oldAi}
                  onChange={setOldAi}
                />
              </span>
              <span
                className="mb-2"
              >
                <Button
                  variant="primary"
                  icon="refresh"
                  disabled={generating || !enoughWords}
                  onClick={generate}
                >
                  {generating ? 'AI đang viết câu…' : 'Tạo bằng AI'}
                </Button>
              </span>
            </div>
            {focus === 'newest' && newest.length > 0 ? (
              <p
                className="mb-2 text-[0.875rem] leading-relaxed text-ink-soft"
              >
                Mỗi câu sẽ có ít nhất một trong {newest.length} từ mới nhất:{' '}
                <span
                  lang="zh-CN"
                  className="han text-ink"
                >
                  {newest.map((word) => word.simplified).join('、')}
                </span>
                .
              </p>
            ) : null}
            {enoughWords ? null : (
              <p
                className="mb-2 text-[0.875rem] text-partial"
              >
                Cần ít nhất {MIN_WORDS_FOR_AI} từ đã học để AI có gì mà viết — thêm từ ở phần trên
                trước.
              </p>
            )}
            {generating ? (
              <Spinner label={`AI đang viết ${count} câu từ ${words.length} từ bạn đã học…`} />
            ) : null}
          </>
        ) : (
          <div
            className="mb-3"
          >
            <Notice
              tone="info"
              title="Máy chủ chưa bật AI"
            >
              {ai.reason ? `${ai.reason} ` : ''}
              Đặt biến môi trường{' '}
              <code
                className="font-mono text-[0.8125rem]"
              >
                ANTHROPIC_API_KEY
              </code>{' '}
              trên máy chủ rồi khởi động lại để dùng nút tạo câu. Trong lúc chờ, bạn vẫn dán câu
              từ một trợ lý khác ở phần dưới.
            </Notice>
          </div>
        )}
      </section>

      <section
        className="mb-6 border-t border-line pt-4"
      >
        <h2
          className="mb-1 text-[1rem] font-semibold tracking-tight text-ink"
        >
          Hoặc dán câu từ trợ lý khác
        </h2>
        <p
          className="mb-3 text-[0.9375rem] leading-relaxed text-ink-soft"
        >
          Câu lệnh đã kèm sẵn cả {words.length} từ của bạn và yêu cầu trả về đúng định dạng mà ô
          dán bên dưới đọc được.
        </p>

        <div
          className="mb-3 flex flex-wrap items-center"
        >
          <span
            className="mr-2 mb-1.5 text-[0.875rem] text-ink-soft"
          >
            Xin bao nhiêu câu:
          </span>
          {PROMPT_COUNTS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={promptCount === option}
              onClick={() => setPromptCount(option)}
              className={[
                'tap mr-1.5 mb-1.5 rounded-[0.375rem] border px-3 py-1 text-[0.875rem] font-medium tabular-nums transition-colors duration-150',
                promptCount === option
                  ? 'border-ink bg-ink text-paper'
                  : 'border-line bg-surface text-ink-soft hover:border-line-strong',
              ].join(' ')}
            >
              {option}
            </button>
          ))}
        </div>

        <textarea
          readOnly
          value={prompt}
          rows={6}
          aria-label="Câu lệnh gửi cho AI"
          className="w-full border border-line rounded-[0.375rem] bg-sunken p-2.5 font-mono text-[0.8125rem] leading-relaxed text-ink-soft"
        />

        <div
          className="mt-2 flex flex-wrap items-center"
        >
          <span
            className="mr-1.5 mb-1.5"
          >
            <Button
              variant="secondary"
              onClick={() => void copy(prompt)}
            >
              Chép câu lệnh
            </Button>
          </span>
          {sentences.length > 0 ? (
            <span
              className="mr-1.5 mb-1.5"
            >
              <Button
                variant="secondary"
                onClick={() => void copy(buildExistingList(sentences))}
              >
                Chép {sentences.length} câu đã có
              </Button>
            </span>
          ) : null}
          {copied === 'done' ? (
            <span
              className="mb-1.5 text-[0.875rem] text-teal"
            >
              Đã chép.
            </span>
          ) : null}
          {copied === 'failed' ? (
            <span
              className="mb-1.5 text-[0.875rem] text-wrong"
            >
              Trình duyệt không cho chép tự động — bôi đen ô trên rồi chép tay.
            </span>
          ) : null}
        </div>

        <p
          className="mt-4 mb-2 text-[0.9375rem] leading-relaxed text-ink-soft"
        >
          Dán kết quả về đây, mỗi dòng một câu:{' '}
          <span
            className="font-mono text-[0.8125rem] text-ink"
          >
            汉字 | pinyin | nghĩa
          </span>
          . Đánh số đầu dòng hay bảng Markdown cũng đọc được.
        </p>

        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={6}
          placeholder="现在几点？ | Xiànzài jǐ diǎn? | Bây giờ mấy giờ?"
          aria-label="Dán câu do AI tạo"
          disabled={busy}
          className="w-full border border-line rounded-[0.375rem] bg-surface p-2.5 font-mono text-[0.8125rem] leading-relaxed text-ink"
        />

        <div
          className="mt-2 flex flex-wrap items-center"
        >
          <span
            className="mr-2 mb-1.5"
          >
            <Button
              variant="primary"
              icon="plus"
              disabled={busy || batch.inputs.length === 0}
              onClick={() => void add()}
            >
              Thêm {batch.inputs.length > 0 ? `${batch.inputs.length} câu` : 'câu'}
            </Button>
          </span>
          {draft.trim() !== '' && preview.sentences.length === 0 ? (
            <span
              className="mb-1.5 text-[0.875rem] text-wrong"
            >
              Chưa đọc được dòng nào có chữ Hán kèm dấu ngăn.
            </span>
          ) : null}
          {batch.incomplete > 0 ? (
            <span
              className="mb-1.5 text-[0.875rem] text-partial"
            >
              {batch.incomplete} câu thiếu pinyin hoặc nghĩa — máy chủ cần đủ ba phần, sẽ bỏ qua.
            </span>
          ) : null}
          {preview.skipped.length > 0 ? (
            <span
              className="mb-1.5 text-[0.875rem] text-partial"
            >
              {preview.skipped.length} dòng chỉ có chữ Hán, thiếu pinyin và nghĩa — sẽ bỏ qua.
            </span>
          ) : null}
        </div>
      </section>

      {aiCount > 0 || manualCount > 0 ? (
        <section
          className="border-t border-line pt-4"
        >
          <p
            className="mb-2 text-[0.875rem] text-ink-soft"
          >
            Bạn đang có {aiCount} câu AI tạo và {manualCount} câu tự thêm. Câu có sẵn không xoá
            được.
          </p>
          <div
            className="flex flex-wrap"
          >
            {aiCount > 0 ? (
              <span
                className="mr-2 mb-1.5"
              >
                <Button
                  variant="danger"
                  disabled={busy}
                  onClick={() => void clear('AI')}
                >
                  Xoá hết câu AI
                </Button>
              </span>
            ) : null}
            {manualCount > 0 ? (
              <span
                className="mr-2 mb-1.5"
              >
                <Button
                  variant="danger"
                  disabled={busy}
                  onClick={() => void clear('MANUAL')}
                >
                  Xoá hết câu tự thêm
                </Button>
              </span>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
