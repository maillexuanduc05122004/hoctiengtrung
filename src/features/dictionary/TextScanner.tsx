/**
 * Quét một đoạn văn bản tiếng Trung.
 *
 * Người học dán một đoạn vào đây rồi thấy ngay đoạn đó gồm những từ nào, từ nào
 * mình đã có trong bộ HSK, đọc thế nào và nghĩa là gì. Kết quả chạy lại ngay
 * trong lúc gõ, có hoãn một nhịp ngắn giống ô tra từ.
 *
 * Mọi thứ chạy trong máy: chỉ so đoạn văn với bộ từ đã tải sẵn, không gửi nội
 * dung người học dán vào đi đâu cả.
 */
import { useEffect, useId, useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button.tsx';
import { Chip } from '../../components/ui/Controls.tsx';
import { EmptyState, Notice } from '../../components/ui/Feedback.tsx';
import { recordLookups } from '../../db/index.ts';
import { useSettings } from '../../hooks/settings-context.ts';
import { useScanIndex, useVocabulary } from '../../hooks/vocabulary-context.ts';
import { scanText, type ScanToken } from '../../lib/vocabulary/scan.ts';
import { SpeakerButton } from '../shared/SpeakerButton.tsx';
import { WordRow } from '../shared/WordRow.tsx';
import type { VocabularyWord } from '../../types/vocabulary.ts';

/**
 * Đủ cho một bài đọc dài, và cũng là mức mà phần chú pinyin bên dưới còn vẽ kịp
 * trên điện thoại cũ.
 */
const MAX_LENGTH = 2000;

/** Bằng nhịp hoãn của ô tra từ: đủ bỏ qua các phím liên tiếp mà mắt chưa thấy chậm. */
const DEBOUNCE_MS = 150;

/** Trình duyệt có cho trang tự đọc bộ nhớ tạm hay không. Firefox thì không. */
function canReadClipboard(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.clipboard?.readText === 'function';
}

export interface TextScannerProps {
  onSelect?: (word: VocabularyWord) => void;
}

export function TextScanner({ onSelect }: TextScannerProps) {
  const { settings } = useSettings();
  const { loading } = useVocabulary();
  const scanIndex = useScanIndex();
  const textareaId = useId();

  const [text, setText] = useState('');
  const [applied, setApplied] = useState('');
  const [showPinyin, setShowPinyin] = useState(!settings.hidePinyin);
  const [note, setNote] = useState<{ tone: 'info' | 'warn'; text: string } | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setApplied(text), DEBOUNCE_MS);
    // Mỗi phím mới huỷ hẹn cũ, nên chỉ lần gõ cuối cùng mới chạy quét.
    return () => {
      window.clearTimeout(timer);
    };
  }, [text]);

  const result = useMemo(() => scanText(scanIndex, applied), [scanIndex, applied]);

  const handlePaste = async (): Promise<void> => {
    try {
      const clipboard = await navigator.clipboard.readText();
      setText(clipboard.slice(0, MAX_LENGTH));
      setNote(null);
    } catch {
      setNote({
        tone: 'warn',
        text: 'Trình duyệt không cho trang tự đọc bộ nhớ tạm. Hãy bấm vào ô rồi dán bằng Ctrl+V.',
      });
    }
  };

  const handleSave = async (): Promise<void> => {
    const saved = await recordLookups(
      result.found.map((word) => word.id),
      { source: 'scan' },
    );
    setNote({ tone: 'info', text: `Đã lưu ${saved.length} từ vào lịch sử tra từ.` });
  };

  const hasText = applied.trim() !== '';

  return (
    <section
      aria-label="Quét đoạn văn"
      className="min-w-0"
    >
      <label
        htmlFor={textareaId}
        className="block text-[0.875rem] font-medium text-ink"
      >
        Dán đoạn tiếng Trung vào đây
      </label>
      <p
        className="mt-1 text-[0.8125rem] leading-relaxed text-ink-faint"
      >
        Đoạn văn được tách thành từng từ rồi đối chiếu với bộ HSK 1-3 ngay trong máy. Không có gì
        được gửi lên mạng.
      </p>

      <textarea
        id={textareaId}
        value={text}
        rows={4}
        maxLength={MAX_LENGTH}
        placeholder="我喜欢学习中文。"
        spellCheck={false}
        onChange={(event) => setText(event.target.value)}
        className="mt-2 block w-full min-w-0 resize-y border border-line-strong bg-surface px-3 py-2.5 text-[1.0625rem] leading-relaxed text-ink rounded-[0.375rem] placeholder:text-ink-faint"
      />

      <div
        className="mt-1 flex min-w-0 flex-wrap items-center"
      >
        {canReadClipboard() ? (
          <span
            className="mt-1.5 mr-1.5"
          >
            <Button
              variant="secondary"
              icon="plus"
              onClick={() => void handlePaste()}
            >
              Dán
            </Button>
          </span>
        ) : null}
        <span
          className="mt-1.5 mr-1.5"
        >
          <Button
            variant="ghost"
            icon="close"
            disabled={text === ''}
            onClick={() => {
              setText('');
              setNote(null);
            }}
          >
            Xoá ô
          </Button>
        </span>
        {hasText && result.hanziCount > 0 ? (
          <span
            className="mt-1.5 mr-1.5"
          >
            <SpeakerButton
              text={applied}
              label="Nghe cả đoạn"
            />
          </span>
        ) : null}
        <span
          className="mt-1.5 mr-1.5 text-[0.75rem] tabular-nums text-ink-faint"
        >
          {text.length}/{MAX_LENGTH}
        </span>
      </div>

      {note !== null ? (
        <div
          className="mt-3"
        >
          <Notice tone={note.tone}>{note.text}</Notice>
        </div>
      ) : null}

      {!hasText ? (
        <EmptyState
          icon="book"
          title="Dán một đoạn để bắt đầu"
          description="Một câu trong sách, một tin nhắn, hay lời một bài hát. Mỗi từ tra được sẽ hiện kèm pinyin, nghĩa và nút nghe."
        />
      ) : result.hanziCount === 0 ? (
        <EmptyState
          icon="info"
          title="Chưa thấy chữ Hán nào"
          description="Phần này chỉ đọc được chữ Hán. Muốn tra theo pinyin hay nghĩa tiếng Việt thì dùng thẻ Tra từ."
        />
      ) : (
        <div
          className="mt-4 min-w-0"
        >
          <ScanSummary
            found={result.found.length}
            unknown={result.unknown.length}
            hanziCount={result.hanziCount}
            loading={loading}
          />

          <div
            className="mt-3 min-w-0 border border-line bg-surface p-4 rounded-[0.375rem]"
          >
            <div
              className="mb-2 flex min-w-0 items-center justify-between"
            >
              <p
                className="min-w-0 text-[0.8125rem] font-medium text-ink-soft"
              >
                Đoạn văn đã tách từ
              </p>
              <Button
                variant="ghost"
                icon={showPinyin ? 'eye-off' : 'eye'}
                onClick={() => setShowPinyin((current) => !current)}
              >
                {showPinyin ? 'Ẩn pinyin' : 'Hiện pinyin'}
              </Button>
            </div>
            <AnnotatedText
              tokens={result.tokens}
              showPinyin={showPinyin}
              onSelect={onSelect}
            />
          </div>

          {result.found.length > 0 ? (
            <div
              className="mt-5 min-w-0"
            >
              <div
                className="mb-1 flex min-w-0 flex-wrap items-center justify-between"
              >
                <p
                  className="mt-1.5 mr-1.5 min-w-0 text-[0.8125rem] font-medium text-ink-soft"
                >
                  {`${result.found.length} từ tra được`}
                </p>
                <span
                  className="mt-1.5"
                >
                  <Button
                    variant="secondary"
                    icon="check"
                    onClick={() => void handleSave()}
                  >
                    {`Lưu ${result.found.length} từ vào lịch sử`}
                  </Button>
                </span>
              </div>
              <ul
                className="min-w-0 border-t border-line"
              >
                {result.found.map((word) => (
                  <li
                    key={word.id}
                    className="min-w-0 border-b border-line"
                  >
                    <WordRow
                      word={word}
                      displayMode={settings.displayMode}
                      hidePinyin={settings.hidePinyin}
                      onSelect={onSelect}
                      showLevel
                      showTraditional={settings.showTraditional}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {result.unknown.length > 0 ? (
            <div
              className="mt-5 min-w-0"
            >
              <p
                className="text-[0.8125rem] font-medium text-ink-soft"
              >
                {`${result.unknown.length} cụm chưa có trong bộ HSK 1-3`}
              </p>
              <p
                className="mt-0.5 text-[0.8125rem] leading-relaxed text-ink-faint"
              >
                Bộ dữ liệu của ứng dụng dừng ở cấp 3, nên chữ ngoài phạm vi đó chỉ được hiện lại chứ
                chưa có nghĩa.
              </p>
              <ul
                className="mt-1 flex min-w-0 flex-wrap"
              >
                {result.unknown.map((chunk) => (
                  <li
                    key={chunk}
                    className="mt-1.5 mr-1.5 min-w-0"
                  >
                    <Chip>
                      <span
                        lang="zh-Hans"
                        className="han text-[0.9375rem]"
                      >
                        {chunk}
                      </span>
                    </Chip>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

interface ScanSummaryProps {
  found: number;
  unknown: number;
  hanziCount: number;
  loading: boolean;
}

function ScanSummary({ found, unknown, hanziCount, loading }: ScanSummaryProps) {
  if (loading) {
    return (
      <p
        role="status"
        className="text-[0.875rem] text-ink-faint"
      >
        Đang tải bộ từ, kết quả sẽ đầy đủ sau một lát.
      </p>
    );
  }

  return (
    <p
      role="status"
      className="text-[0.875rem] text-ink-soft"
    >
      <span
        className="font-semibold text-ink"
      >
        {found}
      </span>
      {' từ tra được'}
      {unknown > 0 ? ` · ${unknown} cụm chưa có` : ''}
      {` · ${hanziCount} chữ Hán`}
    </p>
  );
}

interface AnnotatedTextProps {
  tokens: readonly ScanToken[];
  showPinyin: boolean;
  onSelect?: (word: VocabularyWord) => void;
}

/**
 * Đoạn văn đã tách từ, mỗi từ tra được có pinyin chú nhỏ bên trên.
 *
 * Khối bao ngoài giữ nguyên khoảng trắng và xuống dòng của văn bản gốc, còn mỗi
 * từ là một khối nhỏ xếp theo dòng chữ: như vậy đoạn văn vẫn đọc như một đoạn
 * văn chứ không vỡ thành một rổ thẻ rời.
 */
function AnnotatedText({ tokens, showPinyin, onSelect }: AnnotatedTextProps) {
  return (
    <p
      lang="zh-Hans"
      className="min-w-0 leading-loose break-words whitespace-pre-wrap"
    >
      {tokens.map((token, position) => {
        const key = `${position}-${token.text}`;

        if (!token.hanzi) {
          return (
            <span
              key={key}
              className="text-[1.0625rem] text-ink-soft"
            >
              {token.text}
            </span>
          );
        }

        // Chữ Hán không tra được: gạch chân nét đứt để mắt lướt qua vẫn nhận ra
        // đây là chỗ ứng dụng chưa giúp được gì.
        if (token.word === null) {
          return (
            <span
              key={key}
              title="Chưa có trong bộ HSK 1-3"
              className="han border-b border-dashed border-line-strong text-[1.375rem] text-ink-faint"
            >
              {token.text}
            </span>
          );
        }

        const word = token.word;
        return (
          <button
            key={key}
            type="button"
            lang="zh-Hans"
            aria-label={`Xem chi tiết từ ${word.simplified}, đọc là ${word.pinyin}`}
            disabled={onSelect === undefined}
            onClick={() => onSelect?.(word)}
            className="mx-0.5 inline-block px-0.5 text-center align-baseline rounded-[0.25rem] hover:bg-teal-soft"
          >
            {showPinyin ? (
              <span
                lang="zh-Latn-pinyin"
                className="block text-[0.6875rem] leading-tight tracking-wide text-ink-faint"
              >
                {word.pinyin}
              </span>
            ) : null}
            <span
              className="han block text-[1.375rem] leading-tight text-ink"
            >
              {token.text}
            </span>
          </button>
        );
      })}
    </p>
  );
}
