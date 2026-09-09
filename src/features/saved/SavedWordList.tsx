import type { ReactNode } from 'react';
import { EmptyState } from '../../components/ui/Feedback.tsx';
import { useSettings } from '../../hooks/settings-context.ts';
import { SaveWordButton } from '../shared/SaveWordButton.tsx';
import { WordRow } from '../shared/WordRow.tsx';
import { WordStatusChip } from '../shared/WordStatusChip.tsx';
import { wordStatus } from '../shared/word-status.ts';
import type { SavedWord } from './useSavedWords.ts';
import type { VocabularyWord } from '../../types/vocabulary.ts';

export interface SavedWordListProps {
  words: readonly SavedWord[];
  /** Mốc "bây giờ" để so hạn ôn, chốt một lần ở nơi đọc kho. */
  readAt: number;
  onRemove: (word: VocabularyWord) => void;
  onSelect?: (word: VocabularyWord) => void;
  /** Nội dung hiện khi danh sách rỗng. */
  empty?: ReactNode;
}

/**
 * Danh sách từ trong sổ tay.
 *
 * Các dòng phân tách bằng đường kẻ mảnh như mọi danh sách từ khác trong ứng
 * dụng, để sổ tay đọc như một trang từ điển riêng của người học chứ không phải
 * một màn hình lạ. Nút sao ở đây luôn ở trạng thái bật: bấm là bỏ khỏi sổ tay.
 */
export function SavedWordList({ words, readAt, onRemove, onSelect, empty }: SavedWordListProps) {
  const { settings } = useSettings();

  if (words.length === 0) {
    return (
      empty ?? (
        <EmptyState
          icon="star"
          title="Chưa có từ nào ở đây"
          description="Bấm ngôi sao khi gặp một từ khó, từ đó sẽ nằm lại trong sổ tay."
        />
      )
    );
  }

  return (
    <ul
      aria-label="Các từ đã lưu"
      className="min-w-0"
    >
      {words.map(({ word, card }) => (
        <li
          key={word.id}
          className="min-w-0 border-b border-line"
        >
          <div
            className="flex min-w-0 items-center"
          >
            <div
              className="min-w-0 flex-1"
            >
              <WordRow
                word={word}
                displayMode={settings.displayMode}
                hidePinyin={settings.hidePinyin}
                showTraditional={settings.showTraditional}
                showLevel
                onSelect={onSelect}
              />
            </div>
            <div
              className="relative z-10 ml-2 flex shrink-0 flex-col items-end space-y-1.5"
            >
              <SaveWordButton
                word={word.simplified}
                saved
                onToggle={() => onRemove(word)}
              />
              <WordStatusChip status={wordStatus(card, readAt)} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
