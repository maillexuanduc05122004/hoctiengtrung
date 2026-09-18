/**
 * Phần A của thẻ "Thêm từ & câu": thêm từ mới vào danh sách đã học.
 *
 * Ba bước, và bước giữa là bước quan trọng: dán → máy chủ đối chiếu từ điển →
 * người học duyệt từng dòng → thêm. Không có bước duyệt thì một pinyin sai
 * thanh điệu hay một chữ Hán gõ nhầm sẽ nằm trong vốn từ mãi, và AI sẽ viết
 * câu bằng đúng cái lỗi đó.
 *
 * Bước đầu có hai cửa. "Kiểm tra" đọc từng dòng theo dạng `chữ Hán pinyin nghĩa`
 * rồi hỏi từ điển. "Điền bằng AI" nhận bất cứ gì — chỉ tiếng Việt, chỉ pinyin
 * không dấu, hay một câu "gợi ý 10 từ về đồ ăn" — máy chủ nhờ AI điền đủ bốn
 * phần rồi đưa qua ĐÚNG bước đối chiếu từ điển ấy. AI chỉ gõ hộ; bảng duyệt
 * vẫn là nơi quyết định, nên AI bịa chữ hay sai thanh điệu thì người học thấy.
 *
 * Bảng duyệt sửa được tại chỗ. Bấm "Thêm" thì đối chiếu lại một lần nữa bằng
 * đúng nội dung đã sửa rồi mới ghi — nên chữ Hán hay pinyin sửa sau khi kiểm
 * tra không bao giờ đi vào kho mà chưa qua từ điển, và người học không phải
 * nhớ bấm "Kiểm tra lại" trước khi thêm.
 */
import { useId, useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button.tsx';
import { Chip, Segmented, type SegmentedOption } from '../../components/ui/Controls.tsx';
import { Notice, Spinner } from '../../components/ui/Feedback.tsx';
import { describeApiError } from '../../lib/api/client.ts';
import { completeImportWithAi, confirmImport, previewImport } from '../../lib/api/endpoints.ts';
import type {
  AiStatus,
  ImportAction,
  ImportCandidate,
  ImportConfirmResponse,
  ImportConfirmRow,
  ImportPreviewRow,
  ImportPreviewSummary,
  ImportRowInput,
  ImportRowStatus,
} from '../../lib/api/types.ts';
import { MAX_WORD_ROWS, parseWordLines } from './parse-words.ts';

type HskChoice = '1' | '2' | '3' | '4' | '5' | '6';

const HSK_OPTIONS: readonly SegmentedOption<HskChoice>[] = [
  { value: '1', label: '1', srLabel: 'HSK 1' },
  { value: '2', label: '2', srLabel: 'HSK 2' },
  { value: '3', label: '3', srLabel: 'HSK 3' },
  { value: '4', label: '4', srLabel: 'HSK 4' },
  { value: '5', label: '5', srLabel: 'HSK 5' },
  { value: '6', label: '6', srLabel: 'HSK 6' },
];

const STATUS_CHIP: Record<ImportRowStatus, { label: string; tone: 'teal' | 'neutral' | 'warn' | 'cinnabar' }> =
  {
    OK: { label: 'OK', tone: 'teal' },
    EXISTS: { label: 'Đã có', tone: 'neutral' },
    WARNING: { label: 'Cần xem', tone: 'warn' },
    ERROR: { label: 'Lỗi', tone: 'cinnabar' },
  };

const ACTION_LABELS: Record<ImportAction, string> = {
  CREATE: 'Tạo mới',
  UPDATE: 'Cập nhật',
  LINK: 'Liên kết',
  SKIP: 'Bỏ qua',
  NEEDS_INPUT: 'Chờ chọn chữ Hán',
};

/** Những hành động đưa một từ vào danh sách đã học. */
const ADDING_ACTIONS: ReadonlySet<ImportAction> = new Set(['CREATE', 'UPDATE', 'LINK']);

type Phase = 'idle' | 'checking' | 'ai' | 'review' | 'confirming';

/** Máy chủ từ chối nội dung dài hơn mức này khi nhờ AI điền. */
export const MAX_AI_TEXT = 4000;

/** Một dòng trong bảng duyệt: kết quả đối chiếu cộng phần người học đã sửa. */
interface ReviewRow {
  /** Ổn định qua các lần đối chiếu lại, dùng làm khoá React và mã ô nhập. */
  key: number;
  preview: ImportPreviewRow;
  simplified: string;
  traditional: string;
  pinyin: string;
  meaningVi: string;
  meaningEn: string;
  action: ImportAction;
  /** Người học đã tự chọn hành động; đối chiếu lại không được ghi đè. */
  actionTouched: boolean;
}

function fromPreview(row: ImportPreviewRow, key: number, previous?: ReviewRow): ReviewRow {
  const keepAction =
    previous !== undefined && previous.actionTouched && previous.preview.status === row.status;
  return {
    key,
    preview: row,
    simplified: row.simplified ?? row.input.simplified ?? '',
    traditional: row.traditional ?? '',
    pinyin: row.pinyin ?? row.input.pinyin ?? '',
    meaningVi: row.meaningVi ?? row.input.meaningVi ?? '',
    meaningEn: row.meaningEn ?? row.input.meaningEn ?? '',
    action: keepAction ? previous.action : row.suggestedAction,
    actionTouched: keepAction,
  };
}

function toInput(row: ReviewRow): ImportRowInput {
  const input: ImportRowInput = {};
  if (row.simplified.trim() !== '') input.simplified = row.simplified.trim();
  if (row.pinyin.trim() !== '') input.pinyin = row.pinyin.trim();
  if (row.meaningVi.trim() !== '') input.meaningVi = row.meaningVi.trim();
  if (row.meaningEn.trim() !== '') input.meaningEn = row.meaningEn.trim();
  return input;
}

function toConfirmRow(row: ReviewRow, hskLevel: number): ImportConfirmRow {
  const out: ImportConfirmRow = { action: row.action, hskLevel };
  if (row.preview.existingWord) out.existingWordId = row.preview.existingWord.id;
  if (row.simplified.trim() !== '') out.simplified = row.simplified.trim();
  if (row.traditional.trim() !== '') out.traditional = row.traditional.trim();
  if (row.pinyin.trim() !== '') out.pinyin = row.pinyin.trim();
  if (row.preview.pinyinNumbered) out.pinyinNumbered = row.preview.pinyinNumbered;
  if (row.meaningVi.trim() !== '') out.meaningVi = row.meaningVi.trim();
  if (row.meaningEn.trim() !== '') out.meaningEn = row.meaningEn.trim();
  return out;
}

/** Số từ sẽ vào danh sách đã học với lựa chọn hiện tại. */
function countAdding(rows: readonly ReviewRow[]): number {
  return rows.filter((row) => ADDING_ACTIONS.has(row.action)).length;
}

function summaryLine(summary: ImportPreviewSummary): string {
  return `${summary.total} từ · tạo mới ${summary.willCreate} · đã có ${summary.existing} · cần xem ${summary.needsAttention} · lỗi ${summary.errors}`;
}

function resultLine(result: ImportConfirmResponse): string {
  const parts: string[] = [];
  if (result.created > 0) parts.push(`tạo mới ${result.created}`);
  if (result.updated > 0) parts.push(`cập nhật ${result.updated}`);
  if (result.linked > 0) parts.push(`liên kết ${result.linked}`);
  if (result.skipped > 0) parts.push(`bỏ qua ${result.skipped}`);
  const head = parts.length === 0 ? 'Không có từ nào được thêm' : `Đã ${parts.join(', ')}`;
  return `${head}; ${result.markedLearned} từ được đánh dấu là đã học.`;
}

export interface WordImportProps {
  /** Trạng thái AI trên máy chủ; `null` khi chưa hỏi xong. Tắt thì nút AI ẩn, đường "Kiểm tra" vẫn còn. */
  ai: AiStatus | null;
  /** Gọi sau khi máy chủ đã ghi xong, để bảng từ nạp lại. */
  onImported: (result: ImportConfirmResponse) => void;
}

export function WordImport({ ai, onImported }: WordImportProps) {
  const textareaId = useId();
  const [draft, setDraft] = useState('');
  const [hsk, setHsk] = useState<HskChoice>('1');
  const [phase, setPhase] = useState<Phase>('idle');
  const [rows, setRows] = useState<ReviewRow[] | null>(null);
  const [summary, setSummary] = useState<ImportPreviewSummary | null>(null);
  /** Dòng "AI (model) đọc được N từ" — chỉ có sau lần điền bằng AI gần nhất. */
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportConfirmResponse | null>(null);

  const parsed = useMemo(() => parseWordLines(draft), [draft]);
  const busy = phase === 'checking' || phase === 'ai' || phase === 'confirming';
  const hskLevel = Number(hsk);
  const aiEnabled = ai?.enabled === true;
  const draftText = draft.trim();
  // Toàn dòng chỉ có nghĩa (gõ tiếng Việt suông): "Kiểm tra" sẽ chỉ trả về lỗi
  // thiếu chữ Hán — đây đúng là việc của nút AI, nên nói thẳng.
  const onlyMeanings =
    parsed.length > 0 && parsed.every((row) => row.simplified === undefined && row.pinyin === undefined);

  /** Đối chiếu một danh sách dòng, giữ lại lựa chọn hành động người học đã đổi. */
  const runPreview = async (
    inputs: readonly ImportRowInput[],
    previous: readonly ReviewRow[] | null,
  ): Promise<ReviewRow[]> => {
    const response = await previewImport({ defaultHskLevel: hskLevel, rows: [...inputs] });
    const next = response.rows.map((row, i) => fromPreview(row, previous?.[i]?.key ?? i, previous?.[i]));
    setRows(next);
    setSummary(response.summary);
    return next;
  };

  const check = async (): Promise<void> => {
    if (parsed.length === 0 || busy) return;
    setPhase('checking');
    setError(null);
    setResult(null);
    setAiNote(null);
    try {
      await runPreview(parsed, null);
      setPhase('review');
    } catch (cause: unknown) {
      setError(describeApiError(cause));
      setPhase(rows === null ? 'idle' : 'review');
    }
  };

  /**
   * Nhờ AI điền phần thiếu rồi nhận luôn bảng duyệt. Không đi qua `parseWordLines`:
   * chính những dòng bộ đọc ấy không hiểu (chỉ tiếng Việt, câu yêu cầu) là lý do có nút này.
   */
  const fillWithAi = async (): Promise<void> => {
    if (draftText === '' || busy || !aiEnabled) return;
    setPhase('ai');
    setError(null);
    setResult(null);
    setAiNote(null);
    try {
      const response = await completeImportWithAi({
        text: draftText.slice(0, MAX_AI_TEXT),
        defaultHskLevel: hskLevel,
      });
      const next = response.preview.rows.map((row, i) => fromPreview(row, i));
      setRows(next);
      setSummary(response.preview.summary);
      setAiNote(`AI (${response.model}) đọc được ${response.aiWords} từ — duyệt lại từng dòng rồi mới thêm.`);
      setPhase('review');
    } catch (cause: unknown) {
      setError(describeApiError(cause));
      setPhase(rows === null ? 'idle' : 'review');
    }
  };

  const recheck = async (current: readonly ReviewRow[]): Promise<ReviewRow[] | null> => {
    setPhase('checking');
    setError(null);
    try {
      const next = await runPreview(current.map(toInput), current);
      setPhase('review');
      return next;
    } catch (cause: unknown) {
      setError(describeApiError(cause));
      setPhase('review');
      return null;
    }
  };

  const updateRow = (key: number, patch: Partial<ReviewRow>): void => {
    setRows((current) =>
      current === null ? current : current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  };

  /** Chọn một gợi ý chữ Hán rồi đối chiếu lại cả bảng, vì trạng thái dòng đã đổi. */
  const pickCandidate = (key: number, candidate: ImportCandidate): void => {
    if (rows === null || busy) return;
    const next = rows.map((row) =>
      row.key === key
        ? {
            ...row,
            simplified: candidate.simplified,
            traditional: candidate.traditional,
            pinyin: row.pinyin.trim() === '' ? candidate.pinyinMarked : row.pinyin,
            meaningEn: row.meaningEn.trim() === '' ? (candidate.meaningEn ?? '') : row.meaningEn,
          }
        : row,
    );
    setRows(next);
    void recheck(next);
  };

  /** Lấy pinyin của từ điển thay cho pinyin người học gõ, rồi đối chiếu lại. */
  const applyDictionaryPinyin = (key: number): void => {
    if (rows === null || busy) return;
    const next = rows.map((row) =>
      row.key === key && row.preview.dictionaryPinyin
        ? { ...row, pinyin: row.preview.dictionaryPinyin }
        : row,
    );
    setRows(next);
    void recheck(next);
  };

  const confirm = async (): Promise<void> => {
    if (rows === null || busy) return;
    // Đối chiếu lại bằng đúng nội dung đã sửa: pinyin đổi thì pinyinNumbered
    // và kết quả trùng hệ thống cũng đổi theo, không thể dùng bản cũ.
    const fresh = await recheck(rows);
    if (fresh === null) return;
    if (fresh.some((row) => row.preview.status === 'ERROR')) {
      setError('Còn dòng lỗi sau khi đối chiếu lại — sửa rồi bấm Thêm lần nữa.');
      return;
    }
    if (countAdding(fresh) === 0) return;

    setPhase('confirming');
    setError(null);
    try {
      const response = await confirmImport({
        markAsLearned: true,
        rows: fresh.map((row) => toConfirmRow(row, hskLevel)),
      });
      setResult(response);
      onImported(response);

      // Dòng lỗi giữ lại trong bảng để sửa; các dòng khác đã vào kho thì bỏ đi.
      const failed = new Map(response.errors.map((item) => [item.index, item.message]));
      const remaining = fresh.flatMap((row, i) => {
        const message = failed.get(i);
        if (message === undefined) return [];
        return [{ ...row, preview: { ...row.preview, status: 'ERROR' as const, messages: [message] } }];
      });
      setRows(remaining.length === 0 ? null : remaining);
      setSummary(null);
      setAiNote(null);
      setDraft('');
      setPhase(remaining.length === 0 ? 'idle' : 'review');
    } catch (cause: unknown) {
      setError(describeApiError(cause));
      setPhase('review');
    }
  };

  const adding = rows === null ? 0 : countAdding(rows);
  const hasError = rows !== null && rows.some((row) => row.preview.status === 'ERROR');

  return (
    <section
      className="mb-8"
    >
      <h2
        className="mb-1 text-[1rem] font-semibold tracking-tight text-ink"
      >
        Thêm từ mới
      </h2>
      <p
        className="mb-3 text-[0.9375rem] leading-relaxed text-ink-soft"
      >
        Mỗi dòng một từ: chữ Hán, pinyin, nghĩa — cách nhau bằng khoảng trắng, tab hoặc |. Không có
        chữ Hán cũng được, hệ thống sẽ gợi ý.
        {aiEnabled ? (
          <>
            {' '}
            Hoặc gõ đại — chỉ tiếng Việt, chỉ pinyin không dấu, hay <em>gợi ý 10 từ về đồ ăn</em> — rồi
            bấm <strong>Điền bằng AI</strong>: AI điền chữ Hán, pinyin, nghĩa; bạn vẫn duyệt từng dòng
            trước khi thêm.
          </>
        ) : null}
      </p>

      <label
        htmlFor={textareaId}
        className="sr-only"
      >
        Dán từ mới
      </label>
      <textarea
        id={textareaId}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        rows={6}
        placeholder={aiEnabled ? 'học\nxin chào\n吃饭\ngợi ý 5 từ về gia đình' : '学习 xuéxí học'}
        spellCheck={false}
        disabled={busy}
        className="w-full border border-line rounded-[0.375rem] bg-surface p-2.5 font-mono text-[0.875rem] leading-relaxed text-ink placeholder:text-ink-faint"
      />

      <div
        className="mt-2 flex flex-wrap items-end"
      >
        <span
          className="mr-4 mb-2"
        >
          <Segmented
            legend="Cấp HSK mặc định"
            options={HSK_OPTIONS}
            value={hsk}
            onChange={setHsk}
          />
        </span>
        {aiEnabled ? (
          <span
            className="mr-3 mb-2"
          >
            <Button
              variant="primary"
              icon="lightbulb"
              disabled={busy || draftText === ''}
              onClick={() => void fillWithAi()}
            >
              Điền bằng AI
            </Button>
          </span>
        ) : null}
        <span
          className="mr-3 mb-2"
        >
          <Button
            variant={aiEnabled ? 'secondary' : 'primary'}
            icon="check"
            disabled={busy || parsed.length === 0}
            onClick={() => void check()}
          >
            Kiểm tra
          </Button>
        </span>
        <span
          className="mb-2 text-[0.875rem] text-ink-soft"
        >
          {draftText === ''
            ? ''
            : parsed.length === 0
              ? aiEnabled
                ? 'Chưa đọc được dòng nào theo dạng chữ Hán · pinyin · nghĩa — bấm Điền bằng AI.'
                : 'Chưa đọc được dòng nào.'
              : parsed.length >= MAX_WORD_ROWS
                ? `Chỉ lấy ${MAX_WORD_ROWS} dòng đầu.`
                : aiEnabled && onlyMeanings
                  ? `Đọc được ${parsed.length} dòng, chưa có chữ Hán hay pinyin — bấm Điền bằng AI.`
                  : `Đọc được ${parsed.length} dòng.`}
        </span>
      </div>

      {phase === 'checking' ? <Spinner label="Đang đối chiếu với từ điển…" /> : null}
      {phase === 'ai' ? <Spinner label="AI đang điền chữ Hán, pinyin và nghĩa…" /> : null}
      {phase === 'confirming' ? <Spinner label="Đang thêm vào danh sách đã học…" /> : null}

      {error !== null ? (
        <div
          className="mt-3"
        >
          <Notice tone="error">{error}</Notice>
        </div>
      ) : null}

      {rows !== null ? (
        <div
          className="mt-4"
        >
          {aiNote !== null ? (
            <p
              className="mb-1 text-[0.875rem] text-teal"
            >
              {aiNote}
            </p>
          ) : null}
          {summary !== null ? (
            <p
              role="status"
              className="mb-2 text-[0.875rem] font-medium text-ink-soft"
            >
              {summaryLine(summary)}
            </p>
          ) : null}

          <ul
            className="space-y-2"
          >
            {rows.map((row) => (
              <li key={row.key}>
                <ReviewCard
                  row={row}
                  busy={busy}
                  onChange={(patch) => updateRow(row.key, patch)}
                  onPickCandidate={(candidate) => pickCandidate(row.key, candidate)}
                  onApplyDictionaryPinyin={() => applyDictionaryPinyin(row.key)}
                />
              </li>
            ))}
          </ul>

          <div
            className="mt-3 flex flex-wrap items-center"
          >
            <span
              className="mr-2 mb-1.5"
            >
              <Button
                variant="primary"
                icon="plus"
                disabled={busy || hasError || adding === 0}
                onClick={() => void confirm()}
              >
                Thêm {adding} từ vào danh sách đã học
              </Button>
            </span>
            <span
              className="mr-2 mb-1.5"
            >
              <Button
                variant="secondary"
                icon="refresh"
                disabled={busy}
                onClick={() => void recheck(rows)}
              >
                Kiểm tra lại
              </Button>
            </span>
            {hasError ? (
              <span
                className="mb-1.5 text-[0.875rem] text-wrong"
              >
                Sửa các dòng lỗi rồi bấm Kiểm tra lại.
              </span>
            ) : null}
          </div>
          <p
            className="mt-1 text-[0.8125rem] text-ink-faint"
          >
            Sau khi thêm từ, sang thẻ Nghe câu và bấm <em>Tạo câu mới bằng AI</em> để có câu dùng
            từ vừa học.
          </p>
        </div>
      ) : null}

      {result !== null ? (
        <div
          className="mt-3"
        >
          <Notice
            tone={result.errors.length > 0 ? 'warn' : 'info'}
            title={resultLine(result)}
          >
            {result.errors.length > 0 ? (
              <ul
                className="list-disc pl-5"
              >
                {result.errors.map((item) => (
                  <li key={`${item.index}-${item.message}`}>
                    Dòng {item.index + 1}: {item.message}
                  </li>
                ))}
              </ul>
            ) : (
              'Sang thẻ Nghe câu và bấm Tạo câu mới bằng AI để có câu dùng từ vừa học.'
            )}
          </Notice>
        </div>
      ) : null}
    </section>
  );
}

interface ReviewCardProps {
  row: ReviewRow;
  busy: boolean;
  onChange: (patch: Partial<ReviewRow>) => void;
  onPickCandidate: (candidate: ImportCandidate) => void;
  onApplyDictionaryPinyin: () => void;
}

const FIELD_CLASS =
  'tap w-full min-w-0 rounded-[0.375rem] border border-line-strong px-3 py-2 text-[0.9375rem] text-ink placeholder:text-ink-faint';

function ReviewCard({
  row,
  busy,
  onChange,
  onPickCandidate,
  onApplyDictionaryPinyin,
}: ReviewCardProps) {
  const id = useId();
  const { preview } = row;
  const chip = STATUS_CHIP[preview.status];
  const pinyinOff = preview.pinyinMatchesDictionary === false && Boolean(preview.dictionaryPinyin);
  const needsHanzi = preview.suggestedAction === 'NEEDS_INPUT' && row.simplified.trim() === '';

  const actions: ImportAction[] = needsHanzi
    ? ['NEEDS_INPUT', 'SKIP']
    : preview.existingWord
      ? ['LINK', 'CREATE', 'SKIP']
      : ['CREATE', 'SKIP'];
  if (!actions.includes(row.action)) actions.unshift(row.action);

  return (
    <article
      className="border border-line rounded-[0.375rem] bg-surface px-3 py-2.5"
    >
      <div
        className="flex flex-wrap items-start justify-between"
      >
        <div
          className="mb-1.5 flex min-w-0 flex-wrap items-baseline"
        >
          <span
            lang="zh-CN"
            className="han mr-2 text-[1.5rem] leading-snug text-ink"
          >
            {row.simplified.trim() === '' ? '—' : row.simplified}
          </span>
          {row.traditional !== '' && row.traditional !== row.simplified ? (
            <span
              lang="zh-TW"
              className="han mr-2 text-[0.9375rem] text-ink-faint"
            >
              {row.traditional}
            </span>
          ) : null}
          <Chip tone={chip.tone}>{chip.label}</Chip>
          {preview.existingWord?.alreadyLearned ? (
            <Chip
              className="ml-1.5"
            >
              Đã học
            </Chip>
          ) : null}
        </div>

        <label
          className="mb-1.5 flex items-center text-[0.8125rem] text-ink-soft"
        >
          <span
            className="mr-2"
          >
            Hành động
          </span>
          <select
            value={row.action}
            disabled={busy}
            onChange={(event) =>
              onChange({ action: event.target.value as ImportAction, actionTouched: true })
            }
            className="tap rounded-[0.375rem] border border-line-strong bg-surface px-2.5 py-1.5 text-[0.875rem] text-ink"
          >
            {actions.map((action) => (
              <option
                key={action}
                value={action}
              >
                {ACTION_LABELS[action]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div
        className="grid grid-cols-3 gap-2 xsm:grid-cols-1"
      >
        <div
          className="min-w-0"
        >
          <label
            htmlFor={`${id}-pinyin`}
            className="mb-0.5 block text-[0.75rem] font-medium text-ink-faint"
          >
            Pinyin
          </label>
          <input
            id={`${id}-pinyin`}
            type="text"
            value={row.pinyin}
            disabled={busy}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            onChange={(event) => onChange({ pinyin: event.target.value })}
            className={`${FIELD_CLASS} ${pinyinOff ? 'bg-partial-soft' : 'bg-surface'}`}
          />
          {pinyinOff ? (
            <button
              type="button"
              disabled={busy}
              onClick={onApplyDictionaryPinyin}
              className="tap mt-0.5 text-left text-[0.8125rem] font-medium text-partial underline-offset-2 hover:underline"
            >
              Từ điển: {preview.dictionaryPinyin} — bấm để dùng
            </button>
          ) : null}
        </div>
        <div
          className="min-w-0"
        >
          <label
            htmlFor={`${id}-vi`}
            className="mb-0.5 block text-[0.75rem] font-medium text-ink-faint"
          >
            Nghĩa tiếng Việt
          </label>
          <input
            id={`${id}-vi`}
            type="text"
            value={row.meaningVi}
            disabled={busy}
            autoComplete="off"
            onChange={(event) => onChange({ meaningVi: event.target.value })}
            className={`${FIELD_CLASS} bg-surface`}
          />
        </div>
        <div
          className="min-w-0"
        >
          <label
            htmlFor={`${id}-en`}
            className="mb-0.5 block text-[0.75rem] font-medium text-ink-faint"
          >
            Nghĩa tiếng Anh
          </label>
          <input
            id={`${id}-en`}
            type="text"
            value={row.meaningEn}
            disabled={busy}
            autoComplete="off"
            placeholder="Tự điền từ từ điển"
            onChange={(event) => onChange({ meaningEn: event.target.value })}
            className={`${FIELD_CLASS} bg-surface`}
          />
        </div>
      </div>

      {preview.messages.length > 0 ? (
        <ul
          className="mt-2 space-y-0.5"
        >
          {preview.messages.map((message) => (
            <li
              key={message}
              className={`text-[0.8125rem] ${preview.status === 'ERROR' ? 'text-wrong' : 'text-ink-soft'}`}
            >
              {message}
            </li>
          ))}
        </ul>
      ) : null}

      {preview.candidates.length > 0 ? (
        <div
          className="mt-2"
        >
          <p
            className="mb-1 text-[0.8125rem] text-ink-soft"
          >
            Chọn chữ Hán đúng:
          </p>
          <div
            className="flex flex-wrap"
          >
            {preview.candidates.map((candidate) => (
              <button
                key={`${candidate.simplified}-${candidate.pinyinMarked}`}
                type="button"
                disabled={busy}
                onClick={() => onPickCandidate(candidate)}
                className="tap mr-1.5 mb-1.5 inline-flex items-center rounded-[0.375rem] border border-line bg-sunken px-2.5 py-1 text-left text-[0.8125rem] text-ink-soft transition-colors duration-150 hover:border-line-strong"
              >
                <span
                  lang="zh-CN"
                  className="han mr-1.5 text-[1.125rem] text-ink"
                >
                  {candidate.simplified}
                </span>
                <span
                  className="mr-1.5"
                >
                  {candidate.pinyinMarked}
                </span>
                {candidate.meaningEn ? (
                  <span
                    className="max-w-[12rem] truncate text-ink-faint"
                  >
                    {candidate.meaningEn}
                  </span>
                ) : null}
                {candidate.inSystem ? (
                  <Chip
                    className="ml-1.5"
                  >
                    đã có
                  </Chip>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}
