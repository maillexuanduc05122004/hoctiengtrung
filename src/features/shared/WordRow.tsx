import { Button } from '../../components/ui/Button.tsx';
import { Chip } from '../../components/ui/Controls.tsx';
import type { DisplayMode } from '../../types/settings.ts';
import type { VocabularyWord } from '../../types/vocabulary.ts';
import { MeaningList } from './MeaningList.tsx';
import { SpeakerButton } from './SpeakerButton.tsx';

export interface WordRowProps {
  word: VocabularyWord;
  displayMode: DisplayMode;
  /** Đưa chữ Hán vào ô nhập đang mở, dùng khi tra từ giữa lúc làm bài. */
  onInsert?: (text: string) => void;
  onSelect?: (word: VocabularyWord) => void;
  showLevel?: boolean;
}

/**
 * Một dòng từ trong danh sách.
 *
 * Các dòng phân tách nhau bằng đường kẻ mảnh ở khối cha chứ không tự bọc mình
 * trong thẻ, để một danh sách dài đọc như một trang từ điển thay vì một chồng ô.
 *
 * Khi có onSelect, vùng bấm là một nút phủ lên cả dòng thay vì bọc phần chữ vào
 * trong thẻ button: như vậy cả dòng đều bấm được mà vẫn không lồng khối vào nút,
 * còn nút nghe và nút chèn được nâng lên trên nên vẫn bấm riêng được.
 */
export function WordRow({ word, displayMode, onInsert, onSelect, showLevel = false }: WordRowProps) {
  return (
    <div
      className="relative flex min-w-0 items-start py-3"
    >
      {onSelect !== undefined ? (
        <button
          type="button"
          aria-label={`Xem chi tiết từ ${word.simplified}`}
          onClick={() => onSelect(word)}
          className="absolute top-0 right-0 bottom-0 left-0 rounded-[0.375rem]"
        />
      ) : null}

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
            {word.simplified}
          </span>
          <span
            lang="zh-Latn-pinyin"
            className="min-w-0 break-words text-[0.875rem] tracking-wide text-ink-faint"
          >
            {word.pinyin}
          </span>
          {showLevel ? (
            <span
              className="ml-2"
            >
              <Chip>{`HSK ${word.hskLevel}`}</Chip>
            </span>
          ) : null}
        </div>
        <div
          className="mt-1"
        >
          <MeaningList
            word={word}
            displayMode={displayMode}
            compact
          />
        </div>
      </div>

      <div
        className="relative z-10 ml-2 flex shrink-0 items-center space-x-1"
      >
        <SpeakerButton
          text={word.simplified}
          label={`Nghe phát âm từ ${word.simplified}`}
          size={1.0625}
        />
        {onInsert !== undefined ? (
          <Button
            variant="quiet"
            icon="plus"
            onClick={() => onInsert(word.simplified)}
            aria-label={`Chèn ${word.simplified} vào ô nhập`}
          >
            Chèn
          </Button>
        ) : null}
      </div>
    </div>
  );
}
