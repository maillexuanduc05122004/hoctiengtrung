import { useState } from 'react';
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
  showLevel?: boolean;
  /** Hiện thêm chữ phồn thể nhỏ bên cạnh chữ giản thể khi hai cách viết khác nhau. */
  showTraditional?: boolean;
}

/**
 * Một dòng từ trong danh sách.
 *
 * Các dòng phân tách nhau bằng đường kẻ mảnh ở khối cha chứ không tự bọc mình
 * trong thẻ, để một danh sách dài đọc như một trang từ điển thay vì một chồng ô.
 */
export function WordRow({
  word,
  displayMode,
  hidePinyin = false,
  showLevel = false,
  showTraditional = false,
}: WordRowProps) {
  const [pinyinRevealed, setPinyinRevealed] = useState(false);

  // Giống mặt chữ của thẻ học: rất nhiều từ HSK 1-4 có phồn thể trùng giản thể,
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
      className="flex min-w-0 items-start py-3"
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
            <button
              type="button"
              aria-label={`Hiện pinyin của từ ${word.simplified}`}
              onClick={() => setPinyinRevealed(true)}
              className="tap inline-flex shrink-0 items-center self-center space-x-1.5 rounded-[0.375rem] px-1"
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
        className="ml-2 flex shrink-0 items-center"
      >
        <SpeakerButton
          text={word.simplified}
          label={`Nghe phát âm từ ${word.simplified}`}
          size={1.0625}
        />
      </div>
    </div>
  );
}
