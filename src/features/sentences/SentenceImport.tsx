/**
 * Thêm câu do một trợ lý AI ngoài web tạo ra.
 *
 * Ứng dụng không gọi API nào: không có backend, và nhúng khoá API vào một trang
 * tĩnh thì ai mở trang cũng lấy được. Nên vòng làm việc là ba bước thủ công —
 * chép câu lệnh, dán sang chỗ có AI, dán kết quả về đây. Bù lại nó chạy với bất
 * kỳ trợ lý nào và không tốn của người học đồng nào.
 *
 * Ô dán không kén định dạng (xem `parse.ts`), nhưng câu lệnh vẫn tả rõ dạng ba
 * cột, vì chỉ dạng đó mới có đủ cả pinyin lẫn nghĩa để mở ra sau khi nghe.
 */
import { useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button.tsx';
import { MY_WORDS } from './corpus.ts';
import type { MySentence } from './corpus.ts';
import { parseSentences } from './parse.ts';
import type { ParsedSentence } from './parse.ts';
import { buildExistingList, buildPrompt } from './prompt.ts';

/** Số câu hay xin nhất; người học nhắc tới 30, 40, 50 và 90 trong yêu cầu. */
const COUNTS = [30, 50, 90] as const;

export interface SentenceImportProps {
  /** Mọi câu đang có, dùng để dựng danh sách "đừng tạo lại". */
  existing: readonly MySentence[];
  onAdd: (sentences: readonly ParsedSentence[]) => void;
  onClearStored: () => void;
  storedCount: number;
}

type CopyState = 'idle' | 'done' | 'failed';

export function SentenceImport({
  existing,
  onAdd,
  onClearStored,
  storedCount,
}: SentenceImportProps) {
  const [count, setCount] = useState<number>(50);
  const [draft, setDraft] = useState('');
  const [copied, setCopied] = useState<CopyState>('idle');

  const prompt = useMemo(() => buildPrompt({ count }), [count]);
  const preview = useMemo(() => parseSentences(draft), [draft]);

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

  const handleAdd = (): void => {
    if (preview.sentences.length === 0) return;
    onAdd(preview.sentences);
    setDraft('');
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
          Bước 1 — chép câu lệnh gửi cho AI
        </h2>
        <p
          className="mb-3 text-[0.9375rem] leading-relaxed text-ink-soft"
        >
          Câu lệnh đã kèm sẵn cả {MY_WORDS.length} từ của bạn và yêu cầu trả về đúng định dạng
          mà ô dán bên dưới đọc được.
        </p>

        <div
          className="mb-3 flex flex-wrap items-center"
        >
          <span
            className="mr-2 mb-1.5 text-[0.875rem] text-ink-soft"
          >
            Xin bao nhiêu câu:
          </span>
          {COUNTS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={count === option}
              onClick={() => setCount(option)}
              className={[
                'tap mr-1.5 mb-1.5 rounded-[0.375rem] border px-3 py-1 text-[0.875rem] font-medium tabular-nums transition-colors duration-150',
                count === option
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
          rows={8}
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
              variant="primary"
              onClick={() => void copy(prompt)}
            >
              Chép câu lệnh
            </Button>
          </span>
          {existing.length > 0 ? (
            <span
              className="mr-1.5 mb-1.5"
            >
              <Button
                variant="secondary"
                onClick={() => void copy(buildExistingList(existing))}
              >
                Chép {existing.length} câu đã có
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
      </section>

      <section>
        <h2
          className="mb-1 text-[1rem] font-semibold tracking-tight text-ink"
        >
          Bước 2 — dán kết quả về đây
        </h2>
        <p
          className="mb-3 text-[0.9375rem] leading-relaxed text-ink-soft"
        >
          Mỗi dòng một câu:{' '}
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
          rows={8}
          placeholder="现在几点？ | Xiànzài jǐ diǎn? | Bây giờ mấy giờ?"
          aria-label="Dán câu do AI tạo"
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
              disabled={preview.sentences.length === 0}
              onClick={handleAdd}
            >
              Thêm {preview.sentences.length > 0 ? `${preview.sentences.length} câu` : 'câu'}
            </Button>
          </span>
          {draft.trim() !== '' && preview.sentences.length === 0 ? (
            <span
              className="mb-1.5 text-[0.875rem] text-wrong"
            >
              Chưa đọc được dòng nào có chữ Hán kèm dấu ngăn.
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

      {storedCount > 0 ? (
        <section
          className="mt-6 border-t border-line pt-4"
        >
          <p
            className="mb-2 text-[0.875rem] text-ink-soft"
          >
            Bạn đang có {storedCount} câu tự thêm.
          </p>
          <Button
            variant="danger"
            onClick={onClearStored}
          >
            Xoá hết câu tự thêm
          </Button>
        </section>
      ) : null}
    </div>
  );
}
