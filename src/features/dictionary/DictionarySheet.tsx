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
import { useSettings } from '../../hooks/settings-context.ts';
import { SearchField } from './SearchField.tsx';
import { useDictionarySearch, useSuggestedWords } from './useDictionarySearch.ts';

/** Danh sách ngắn để tấm trượt không phải cuộn dài giữa lúc đang làm bài. */
const SHEET_LIMIT = 12;

export interface DictionarySheetProps {
  open: boolean;
  onClose: () => void;
  onInsert?: (text: string) => void;
  initialQuery?: string;
}

export function DictionarySheet({ open, onClose, onInsert, initialQuery }: DictionarySheetProps) {
  const { settings } = useSettings();
  const inputRef = useRef<HTMLInputElement>(null);
  const { query, setQuery, hits, pending, loading, error } = useDictionarySearch({
    initialQuery,
    limit: SHEET_LIMIT,
  });
  const suggestions = useSuggestedWords(5);

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
    body =
      suggestions.length > 0 ? (
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
                  onInsert={insertHandler}
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
              onInsert={insertHandler}
              showLevel
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
        <div
          className="min-w-0 pb-2"
        >
          {body}
        </div>
      </div>
    </BottomSheet>
  );
}
