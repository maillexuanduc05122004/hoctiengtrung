import type { DisplayMode } from '../../types/settings.ts';
import type { VocabularyWord } from '../../types/vocabulary.ts';
import { SpeakerButton } from './SpeakerButton.tsx';

export interface MeaningListProps {
  word: VocabularyWord;
  displayMode: DisplayMode;
  /** Dạng gọn một dòng, dùng cho hàng danh sách và kết quả tra từ. */
  compact?: boolean;
}

interface MeaningBlock {
  code: 'VI' | 'EN';
  /** Ngôn ngữ dùng cho bộ đọc. */
  lang: 'vi-VN' | 'en-US';
  /** Ngôn ngữ khai báo trên thẻ, để trình đọc màn hình đọc đúng giọng. */
  textLang: 'vi' | 'en';
  speakLabel: string;
  items: string[];
}

/**
 * Danh sách nghĩa của một từ.
 *
 * Nhãn "VI" và "EN" được để mảnh ở lề trái thay vì bọc mỗi ngôn ngữ trong một
 * thẻ riêng: mắt vẫn phân biệt được hai khối mà trang không bị chia vụn.
 */
export function MeaningList({ word, displayMode, compact = false }: MeaningListProps) {
  const blocks: MeaningBlock[] = [];
  const vi = word.meanings.vi.filter((meaning) => meaning.trim() !== '');
  const en = word.meanings.en.filter((meaning) => meaning.trim() !== '');

  if (displayMode !== 'en-zh' && vi.length > 0) {
    blocks.push({
      code: 'VI',
      lang: 'vi-VN',
      textLang: 'vi',
      speakLabel: 'Nghe nghĩa tiếng Việt',
      items: vi,
    });
  }
  if (displayMode !== 'vi-zh' && en.length > 0) {
    blocks.push({
      code: 'EN',
      lang: 'en-US',
      textLang: 'en',
      speakLabel: 'Nghe nghĩa tiếng Anh',
      items: en,
    });
  }

  if (blocks.length === 0) return null;

  // Dạng gọn bỏ nút loa: hàng danh sách vốn đã có nút nghe chữ Hán, thêm hai nút
  // nữa sẽ chiếm gần hết bề ngang màn hình điện thoại.
  if (compact) {
    return (
      <div
        className="min-w-0 space-y-0.5"
      >
        {blocks.map((block) => (
          <p
            key={block.code}
            className="flex min-w-0 items-baseline text-[0.875rem]"
          >
            <span
              aria-hidden="true"
              className="mr-1.5 shrink-0 text-[0.625rem] font-semibold tracking-wide text-ink-faint"
            >
              {block.code}
            </span>
            <span
              lang={block.textLang}
              className="min-w-0 break-words text-ink-soft"
            >
              {block.items.join('; ')}
            </span>
          </p>
        ))}
      </div>
    );
  }

  return (
    <dl
      className="min-w-0"
    >
      {blocks.map((block, blockIndex) => (
        <div
          key={block.code}
          className={[
            'flex min-w-0 items-start',
            blockIndex > 0 ? 'mt-3 border-t border-line pt-3' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <dt
            className="mt-[0.1875rem] w-[1.75rem] shrink-0 text-[0.6875rem] font-semibold tracking-wide text-ink-faint"
          >
            {block.code}
          </dt>
          <dd
            lang={block.textLang}
            className="min-w-0 flex-1"
          >
            {block.items.length === 1 ? (
              <p
                className="min-w-0 break-words text-[1rem] text-ink"
              >
                {block.items[0]}
              </p>
            ) : (
              <ol
                className="list-none space-y-1 p-0"
              >
                {block.items.map((item, itemIndex) => (
                  <li
                    key={`${itemIndex}-${item}`}
                    className="flex min-w-0 items-baseline text-[1rem] text-ink"
                  >
                    <span
                      aria-hidden="true"
                      className="mr-2 shrink-0 text-[0.75rem] tabular-nums text-ink-faint"
                    >
                      {itemIndex + 1}
                    </span>
                    <span
                      className="min-w-0 break-words"
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </dd>
          <div
            className="ml-2 shrink-0"
          >
            <SpeakerButton
              text={block.items.join(', ')}
              lang={block.lang}
              label={block.speakLabel}
              size={1}
            />
          </div>
        </div>
      ))}
    </dl>
  );
}
