/**
 * Hộp tra từ trượt lên từ đáy màn hình.
 *
 * Hộp này được mở ngay giữa lúc người học đang làm bài nên phải nhẹ: chỉ có ô
 * tìm kiếm và danh sách kết quả ngắn, không lọc cấp, không thống kê.
 *
 * Khi đã đăng nhập, dưới kết quả cục bộ có thêm mục "Từ điển lớn (CC-CEDICT)"
 * tra trên máy chủ — cho những chữ ngoài bộ HSK và cho tra ngược từ tiếng Anh.
 */
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { BottomSheet } from '../../components/ui/BottomSheet.tsx';
import { Button, IconButton } from '../../components/ui/Button.tsx';
import { Chip } from '../../components/ui/Controls.tsx';
import { EmptyState, Notice, Spinner } from '../../components/ui/Feedback.tsx';
import { WordRow } from '../shared/WordRow.tsx';
import { SpeakerButton } from '../shared/SpeakerButton.tsx';
import { saveWordMessage } from '../shared/save-word.ts';
import { useSavedIds } from '../saved/useSavedIds.ts';
import { LiveMessage } from '../../components/ui/LiveMessage.tsx';
import { recordLookup } from '../../db/index.ts';
import { useAuth } from '../../hooks/useAuth.ts';
import { useLiveMessage } from '../../hooks/useLiveMessage.ts';
import { useSettings } from '../../hooks/settings-context.ts';
import { describeApiError } from '../../lib/api/client.ts';
import { confirmImport, previewImport } from '../../lib/api/endpoints.ts';
import { LookupHistory } from './LookupHistory.tsx';
import { SearchField } from './SearchField.tsx';
import { CEDICT_MIN_QUERY, useCedictSearch } from './useCedictSearch.ts';
import { useDictionarySearch, useSuggestedWords } from './useDictionarySearch.ts';
import type { DictionaryEntry, ImportConfirmRow, ImportPreviewRow } from '../../lib/api/types.ts';
import type { VocabularyWord } from '../../types/vocabulary.ts';

/** Danh sách ngắn để tấm trượt không phải cuộn dài giữa lúc đang làm bài. */
const SHEET_LIMIT = 12;

/** Chỉ vài từ gần nhất: tấm trượt mở ra giữa bài, không phải chỗ để ngồi xem lại lịch sử. */
const SHEET_HISTORY_LIMIT = 4;

export interface DictionarySheetProps {
  open: boolean;
  onClose: () => void;
  onInsert?: (text: string) => void;
  initialQuery?: string;
}

/**
 * Vỏ ngoài chỉ quyết định có mở hay không.
 *
 * Phần thân mới là nơi gọi hook, và nó chỉ được gắn vào cây khi tấm trượt mở.
 * Nếu để hook chạy cả lúc đóng thì mỗi bộ thẻ học luôn giữ một liveQuery quét
 * toàn bảng thẻ, chạy lại sau MỖI lần chấm bài — trả giá cho một tấm trượt
 * hầu như không ai mở.
 */
export function DictionarySheet(props: DictionarySheetProps) {
  if (!props.open) return null;
  return <DictionarySheetBody {...props} />;
}

function DictionarySheetBody({ open, onClose, onInsert, initialQuery }: DictionarySheetProps) {
  const { settings } = useSettings();
  const inputRef = useRef<HTMLInputElement>(null);
  const { query, setQuery, hits, pending, loading, error } = useDictionarySearch({
    initialQuery,
    limit: SHEET_LIMIT,
  });
  const suggestions = useSuggestedWords(5);
  const { ids: savedIds, toggle: toggleSaved } = useSavedIds();
  const { message, token, announce } = useLiveMessage();

  // Từ điển lớn nằm trên máy chủ nên chỉ hỏi khi đã đăng nhập; chưa đăng nhập
  // thì truyền chuỗi rỗng để hook không gửi gì và phần này không hiện ra.
  const { status: authStatus, user } = useAuth();
  const authenticated = authStatus === 'authenticated';
  const cedict = useCedictSearch(authenticated ? query : '');

  useEffect(() => {
    if (!open) return;
    // Mở lại là tra chữ khác, nên bắt đầu từ truy vấn mà nơi gọi đưa sang.
    setQuery(initialQuery ?? '');
  }, [open, initialQuery, setQuery]);

  useEffect(() => {
    if (!open) return;
    // Tấm trượt tự đưa tiêu điểm vào nút đóng khi mở; đẩy sang cuối hàng đợi để
    // ô tìm kiếm giành lại tiêu điểm, người học gõ được ngay không phải bấm.
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [open]);

  const handleInsert = useCallback(
    (text: string) => {
      onInsert?.(text);
      // Chèn xong thì đóng lại: tấm này che mất ô trả lời, giữ mở chỉ thêm vướng.
      onClose();
    },
    [onInsert, onClose],
  );

  // Chỉ hiện nút "Chèn" khi nơi gọi thật sự có ô nhập để chèn vào.
  const insertHandler = onInsert ? handleInsert : undefined;

  /**
   * Lưu một từ ngay tại danh sách, và tính luôn là một lượt tra.
   *
   * Trước đây hộp này hiện được lịch sử tra từ nhưng không góp gì vào lịch sử
   * đó, vì recordLookup chỉ được gọi ở trang Tra từ. Bấm sao là bằng chứng rõ
   * ràng nhất rằng từ này thật sự được dùng, nên ghi ngay tại đây.
   */
  const handleToggleSave = useCallback(
    (word: VocabularyWord): void => {
      void toggleSaved(word.id).then(
        (saved) => {
          announce(saveWordMessage(word.simplified, saved));
          if (saved) void recordLookup(word.id, { source: 'search' });
        },
        () => announce('Không lưu được vào máy này.'),
      );
    },
    [toggleSaved, announce],
  );

  const trimmed = query.trim();
  let body: ReactNode;

  if (error !== null) {
    body = (
      <Notice
        tone="error"
        title="Chưa tải được bộ từ"
      >
        <p
          className="break-words"
        >
          {error}
        </p>
      </Notice>
    );
  } else if (loading) {
    body = <Spinner label="Đang tải bộ từ" />;
  } else if (trimmed === '') {
    // Giữa giờ học, thứ hay cần lại nhất là từ vừa tra lúc nãy, nên nó đứng trước
    // danh sách gợi ý. Dạng gọn: không có nút xoá để bấm nhầm giữa lúc làm bài.
    body = (
      <div
        className="min-w-0 space-y-4"
      >
        <LookupHistory
          limit={SHEET_HISTORY_LIMIT}
          onInsert={insertHandler}
          compact
        />
        {suggestions.length > 0 ? (
          <div
            className="min-w-0"
          >
            <p
              className="mb-1 text-[0.8125rem] text-ink-faint"
            >
              Chưa gõ gì thì xem tạm vài từ trong cấp bạn đang học.
            </p>
            <ul
              className="min-w-0 border-t border-line"
            >
              {suggestions.map((word) => (
                <li
                  key={word.id}
                  className="min-w-0 border-b border-line"
                >
                  <WordRow
                    word={word}
                    displayMode={settings.displayMode}
                    hidePinyin={settings.hidePinyin}
                    onInsert={insertHandler}
                    showTraditional={settings.showTraditional}
                    saved={savedIds.has(word.id)}
                    onToggleSave={handleToggleSave}
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <EmptyState
            icon="search"
            title="Gõ để tra từ"
            description="Tìm theo chữ Hán, pinyin, tiếng Việt hoặc tiếng Anh."
          />
        )}
      </div>
    );
  } else if (hits.length === 0) {
    body = pending ? (
      <p
        role="status"
        className="px-2 py-8 text-center text-[0.875rem] text-ink-faint"
      >
        Đang tìm…
      </p>
    ) : (
      <EmptyState
        icon="search"
        title="Không tìm thấy từ nào"
        description="Thử bỏ dấu hoặc gõ ít chữ hơn."
      />
    );
  } else {
    body = (
      <ul
        className="min-w-0 border-t border-line"
      >
        {hits.map((hit) => (
          <li
            key={hit.word.id}
            className="min-w-0 border-b border-line"
          >
            <WordRow
              word={hit.word}
              displayMode={settings.displayMode}
              hidePinyin={settings.hidePinyin}
              onInsert={insertHandler}
              showLevel
              showTraditional={settings.showTraditional}
              saved={savedIds.has(hit.word.id)}
              onToggleSave={handleToggleSave}
            />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Tra từ"
      description="Tìm nhanh một chữ rồi quay lại bài đang làm."
    >
      <div
        className="min-w-0"
      >
        {/* Ô tìm kiếm dính trên đầu vùng cuộn để cuộn kết quả vẫn gõ tiếp được. */}
        <div
          className="sticky top-0 z-10 -mt-3 bg-surface pt-3 pb-2"
        >
          <SearchField
            value={query}
            onChange={setQuery}
            label="Tìm từ trong bộ HSK"
            inputRef={inputRef}
          />
        </div>
        <LiveMessage message={message} token={token} />
        <div
          className="min-w-0 pb-2"
        >
          {body}
          {/*
            Từ điển lớn đứng DƯỚI kết quả cục bộ, kể cả khi cục bộ không có gì:
            đó chính là lúc nó có ích nhất. Mất mạng thì lặng lẽ ẩn đi, không
            được che kết quả cục bộ bằng một khung lỗi.
          */}
          {authenticated && trimmed.length >= CEDICT_MIN_QUERY && !cedict.failed ? (
            <CedictSection
              entries={cedict.entries}
              loading={cedict.loading}
              hskLevel={defaultHskLevel(user?.currentHskLevel)}
              announce={announce}
            />
          ) : null}
        </div>
      </div>
    </BottomSheet>
  );
}

/* ------------------------------------------------------------------------ */
/* Từ điển lớn (CC-CEDICT)                                                   */
/* ------------------------------------------------------------------------ */

/** Cấp HSK gán cho từ mới tạo: lấy cấp đang học trong hồ sơ, không hợp lệ thì HSK 1. */
function defaultHskLevel(level: number | undefined): number {
  return level !== undefined && Number.isInteger(level) && level >= 1 && level <= 9 ? level : 1;
}

/**
 * Một hai nghĩa tiếng Anh ngắn cho một mục CC-CEDICT.
 *
 * Bỏ các dòng "CL:…" (lượng từ) vì đó là chú thích ngữ pháp chứ không phải
 * nghĩa; nếu mục chỉ toàn chú thích thì đành hiện nguyên.
 */
function briefDefinitions(definitions: readonly string[]): string {
  const meanings = definitions.filter((definition) => !definition.startsWith('CL:'));
  return (meanings.length > 0 ? meanings : definitions).slice(0, 2).join('; ');
}

/**
 * Đổi dòng đã duyệt thành dòng để xác nhận.
 *
 * Từ đã có trong hệ thống thì chỉ liên kết vào danh sách đã học, không tạo
 * thêm bản sao; từ mới thì tạo với đúng dữ liệu máy chủ đã chuẩn hoá (phồn thể,
 * pinyin số) — nghĩa tiếng Việt vẫn là câu người học vừa gõ.
 */
function toConfirmRow(row: ImportPreviewRow, meaningVi: string): ImportConfirmRow | null {
  if (row.status === 'ERROR' || row.suggestedAction === 'NEEDS_INPUT') return null;
  if (row.existingWord != null && (row.status === 'EXISTS' || row.suggestedAction === 'LINK')) {
    return { action: 'LINK', existingWordId: row.existingWord.id };
  }
  return {
    action: 'CREATE',
    simplified: row.simplified ?? row.input.simplified,
    traditional: row.traditional,
    pinyin: row.pinyin ?? row.input.pinyin,
    pinyinNumbered: row.pinyinNumbered,
    meaningVi,
    meaningEn: row.meaningEn,
    hskLevel: row.hskLevel,
  };
}

interface CedictSectionProps {
  entries: DictionaryEntry[];
  loading: boolean;
  /** Cấp HSK gán cho từ mới tạo, lấy từ hồ sơ người dùng. */
  hskLevel: number;
  /** Đẩy một câu vào vùng đọc của tấm trượt sau khi lưu xong. */
  announce: (message: string) => void;
}

function CedictSection({ entries, loading, hskLevel, announce }: CedictSectionProps) {
  const headingId = useId();
  let content: ReactNode;

  if (loading) {
    content = (
      <p
        role="status"
        className="py-4 text-[0.875rem] text-ink-faint"
      >
        Đang tìm trong từ điển lớn…
      </p>
    );
  } else if (entries.length === 0) {
    content = (
      <p
        role="status"
        className="py-4 text-[0.875rem] text-ink-faint"
      >
        Từ điển lớn cũng không có mục nào khớp.
      </p>
    );
  } else {
    content = (
      <ul
        className="mt-2 min-w-0 border-t border-line"
      >
        {/*
          Cùng chữ, cùng cách đọc vẫn có thể là hai mục khác nhau trong
          CC-CEDICT, nên ghép thêm thứ tự để khoá không trùng.
        */}
        {entries.map((entry, index) => (
          <li
            key={`${index}-${entry.traditional}-${entry.simplified}-${entry.pinyinNumbered}`}
            className="min-w-0 border-b border-line"
          >
            <CedictEntryRow
              entry={entry}
              hskLevel={hskLevel}
              announce={announce}
            />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section
      aria-labelledby={headingId}
      className="mt-5 min-w-0 border-t border-line pt-3"
    >
      <h3
        id={headingId}
        className="text-[0.6875rem] font-semibold tracking-wide text-ink-faint uppercase"
      >
        Từ điển lớn (CC-CEDICT)
      </h3>
      <p
        className="mt-0.5 text-[0.8125rem] text-ink-faint"
      >
        Tra trên máy chủ theo chữ Hán hoặc tiếng Anh. Lưu một mục là nó vào danh sách từ đã
        học ở phần Câu của tôi.
      </p>
      {content}
    </section>
  );
}

type SaveState =
  | { kind: 'idle' }
  | { kind: 'editing' }
  | { kind: 'saving' }
  | { kind: 'saved' }
  | { kind: 'error'; message: string };

interface CedictEntryRowProps {
  entry: DictionaryEntry;
  hskLevel: number;
  announce: (message: string) => void;
}

/**
 * Một mục CC-CEDICT, kèm nút nghe và nút lưu vào danh sách từ đã học.
 *
 * Máy chủ bắt buộc phải có nghĩa tiếng Việt, mà CC-CEDICT chỉ có tiếng Anh,
 * nên bấm "Lưu" mở ra một ô nhập nhỏ rồi mới lưu. Không dùng thẻ `<form>`:
 * tấm trượt này có khi được mở ngay bên trong form gõ đáp án, lồng form là HTML
 * không hợp lệ và Enter sẽ chấm nhầm câu đang làm.
 */
function CedictEntryRow({ entry, hskLevel, announce }: CedictEntryRowProps) {
  const inputId = useId();
  const [meaning, setMeaning] = useState('');
  const [state, setState] = useState<SaveState>({ kind: 'idle' });

  // Nhiều từ có phồn thể trùng giản thể; lặp lại chỉ làm rối dòng.
  const traditional = entry.traditional !== entry.simplified ? entry.traditional : null;
  const definitions = briefDefinitions(entry.definitions);
  const busy = state.kind === 'saving';

  const save = async (): Promise<void> => {
    const meaningVi = meaning.trim();
    if (meaningVi === '' || busy) return;
    setState({ kind: 'saving' });
    try {
      const preview = await previewImport({
        defaultHskLevel: hskLevel,
        rows: [
          {
            simplified: entry.simplified,
            pinyin: entry.pinyinMarked,
            meaningVi,
            meaningEn: definitions,
          },
        ],
      });
      const row = preview.rows.length > 0 ? preview.rows[0] : null;
      const confirmRow = row === null ? null : toConfirmRow(row, meaningVi);
      if (row === null || confirmRow === null) {
        const reason = row?.messages.join(' ') ?? '';
        setState({ kind: 'error', message: reason !== '' ? reason : 'Máy chủ không nhận mục này.' });
        return;
      }
      const outcome = await confirmImport({ markAsLearned: true, rows: [confirmRow] });
      if (outcome.errors.length > 0) {
        setState({ kind: 'error', message: outcome.errors[0].message });
        return;
      }
      setState({ kind: 'saved' });
      announce(`Đã thêm ${entry.simplified} vào từ đã học.`);
    } catch (err) {
      setState({ kind: 'error', message: describeApiError(err) });
    }
  };

  return (
    <div
      className="min-w-0 py-3"
    >
      <div
        className="flex min-w-0 items-start"
      >
        <div
          className="min-w-0 flex-1"
        >
          <div
            className="flex min-w-0 flex-wrap items-baseline"
          >
            <span
              lang="zh-Hans"
              className="han mr-2.5 min-w-0 text-[1.375rem] break-words text-ink"
            >
              {entry.simplified}
            </span>
            {traditional !== null ? (
              <>
                <span
                  className="sr-only"
                >
                  phồn thể
                </span>
                <span
                  lang="zh-Hant"
                  className="han mr-2.5 min-w-0 text-[1rem] break-words text-ink-soft"
                >
                  {traditional}
                </span>
              </>
            ) : null}
            <span
              lang="zh-Latn-pinyin"
              className="min-w-0 break-words text-[0.875rem] tracking-wide text-ink-faint"
            >
              {entry.pinyinMarked}
            </span>
          </div>
          {definitions !== '' ? (
            <p
              lang="en"
              className="mt-1 text-[0.875rem] leading-snug break-words text-ink-soft"
            >
              {definitions}
            </p>
          ) : null}
        </div>

        <div
          className="ml-2 flex shrink-0 items-center space-x-1"
        >
          <SpeakerButton
            text={entry.simplified}
            label={`Nghe phát âm ${entry.simplified}`}
            size={1.0625}
          />
          {state.kind === 'saved' ? (
            <Chip tone="teal">Đã thêm</Chip>
          ) : state.kind === 'idle' || state.kind === 'error' ? (
            <Button
              variant="quiet"
              icon="plus"
              aria-label={`Lưu ${entry.simplified} vào từ đã học`}
              onClick={() => setState({ kind: 'editing' })}
            >
              Lưu
            </Button>
          ) : null}
        </div>
      </div>

      {state.kind === 'editing' || state.kind === 'saving' ? (
        <div
          className="mt-2 flex min-w-0 items-center space-x-2"
        >
          <label
            htmlFor={inputId}
            className="sr-only"
          >
            {`Nghĩa tiếng Việt của ${entry.simplified}`}
          </label>
          <input
            id={inputId}
            type="text"
            value={meaning}
            autoFocus
            autoComplete="off"
            placeholder="Nghĩa tiếng Việt"
            disabled={busy}
            onChange={(event) => setMeaning(event.target.value)}
            onKeyDown={(event) => {
              // Enter lưu luôn, nhưng đang gõ dở bằng bộ gõ thì Enter là để chốt chữ.
              if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                event.preventDefault();
                void save();
              }
            }}
            className="tap w-full min-w-0 rounded-[0.375rem] border border-line-strong bg-surface px-3 py-2 text-ink placeholder:text-ink-faint"
          />
          <Button
            variant="primary"
            disabled={meaning.trim() === '' || busy}
            onClick={() => void save()}
          >
            {busy ? 'Đang lưu…' : 'Lưu'}
          </Button>
          <IconButton
            icon="close"
            label="Huỷ lưu"
            disabled={busy}
            onClick={() => setState({ kind: 'idle' })}
          />
        </div>
      ) : null}

      {state.kind === 'error' ? (
        <p
          role="status"
          className="mt-1.5 text-[0.8125rem] text-wrong"
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
