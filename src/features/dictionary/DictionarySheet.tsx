/**
 * Hộp tra từ trượt lên từ đáy màn hình.
 *
 * Hộp này được mở ngay giữa lúc người học đang làm bài nên phải nhẹ: chỉ có ô
 * tìm kiếm và danh sách kết quả ngắn, không lọc cấp, không thống kê.
 */
import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { BottomSheet } from '../../components/ui/BottomSheet.tsx';
import { EmptyState, Notice, Spinner } from '../../components/ui/Feedback.tsx';
import { WordRow } from '../shared/WordRow.tsx';
import { saveWordMessage } from '../shared/save-word.ts';
import { useSavedIds } from '../saved/useSavedIds.ts';
import { LiveMessage } from '../../components/ui/LiveMessage.tsx';
import { recordLookup } from '../../db/index.ts';
import { useLiveMessage } from '../../hooks/useLiveMessage.ts';
import { useSettings } from '../../hooks/settings-context.ts';
import { LookupHistory } from './LookupHistory.tsx';
import { SearchField } from './SearchField.tsx';
import { useDictionarySearch, useSuggestedWords } from './useDictionarySearch.ts';
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
        </div>
      </div>
    </BottomSheet>
  );
}
