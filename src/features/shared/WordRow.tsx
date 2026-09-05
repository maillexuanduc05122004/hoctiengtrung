import { useState } from 'react';
import { Button } from '../../components/ui/Button.tsx';
import { Chip } from '../../components/ui/Controls.tsx';
import type { DisplayMode } from '../../types/settings.ts';
import type { VocabularyWord } from '../../types/vocabulary.ts';
import { MeaningList } from './MeaningList.tsx';
import { SpeakerButton } from './SpeakerButton.tsx';

export interface WordRowProps {
  word: VocabularyWord;
  displayMode: DisplayMode;
  /** Ẩn pinyin cho tới khi người học bấm vào, theo cài đặt "Ẩn pinyin". */
  hidePinyin?: boolean;
  /** Đưa chữ Hán vào ô nhập đang mở, dùng khi tra từ giữa lúc làm bài. */
  onInsert?: (text: string) => void;
  onSelect?: (word: VocabularyWord) => void;
  showLevel?: boolean;
  /** Hiện thêm chữ phồn thể nhỏ bên cạnh chữ giản thể khi hai cách viết khác nhau. */
  showTraditional?: boolean;
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
export function WordRow({
  word,
  displayMode,
  hidePinyin = false,
  onInsert,
  onSelect,
  showLevel = false,
  showTraditional = false,
}: WordRowProps) {
  const [pinyinRevealed, setPinyinRevealed] = useState(false);

  // Giống mặt chữ của thẻ học: rất nhiều từ HSK 1-3 có phồn thể trùng giản thể,
  // lặp lại y hệt chỉ làm rối dòng nên chỉ hiện khi hai cách viết thật sự khác.
  const traditional =
    showTraditional && word.traditional !== undefined && word.traditional !== word.simplified
      ? word.traditional
      : null;

  // Mỗi âm tiết bị ẩn thành một gạch ngắn, đủ để đoán từ này đọc mấy tiếng.
  const syllables = word.pinyin.trim().split(/\s+/).filter((syllable) => syllable !== '');
  const pinyinVisible = !hidePinyin || pinyinRevealed || syllables.length === 0;

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
          {traditional !== null ? (
            <>
              {/* Nhãn chỉ dành cho bộ đọc màn hình: một dòng danh sách không đủ
                  chỗ cho chữ "phồn thể" hiện ra như ở mặt trước thẻ học. */}
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
          {pinyinVisible ? (
            <span
              lang="zh-Latn-pinyin"
              className="min-w-0 break-words text-[0.875rem] tracking-wide text-ink-faint"
            >
              {word.pinyin}
            </span>
          ) : (
            // Nút phải nổi lên trên vùng bấm phủ cả dòng thì mới bấm riêng được.
            <button
              type="button"
              aria-label={`Hiện pinyin của từ ${word.simplified}`}
              onClick={() => setPinyinRevealed(true)}
              className="tap relative z-10 inline-flex shrink-0 items-center self-center space-x-1.5 rounded-[0.375rem] px-1"
            >
              {syllables.map((syllable, index) => (
                <span
                  key={`${index}-${syllable}`}
                  aria-hidden="true"
                  className="block h-[0.1875rem] w-[1.25rem] rounded-full bg-line-strong"
                />
              ))}
            </button>
          )}
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
