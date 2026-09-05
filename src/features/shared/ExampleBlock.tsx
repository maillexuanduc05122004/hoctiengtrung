import type { DisplayMode } from '../../types/settings.ts';
import type { WordExample } from '../../types/vocabulary.ts';
import { SpeakerButton } from './SpeakerButton.tsx';

export interface ExampleBlockProps {
  example: WordExample;
  displayMode: DisplayMode;
  showPinyin?: boolean;
}

/**
 * Một câu ví dụ.
 *
 * Câu chữ Hán đứng trước, các dòng phụ lùi dần về màu nhạt hơn để mắt đọc theo
 * đúng thứ tự: nhìn chữ, nhẩm pinyin, rồi mới đối chiếu nghĩa.
 */
export function ExampleBlock({ example, displayMode, showPinyin = true }: ExampleBlockProps) {
  const showVi = displayMode !== 'en-zh' && example.vi.trim() !== '';
  const showEn = displayMode !== 'vi-zh' && example.en.trim() !== '';

  return (
    <div
      className="min-w-0"
    >
      <div
        className="flex min-w-0 items-start justify-between"
      >
        <p
          lang="zh-Hans"
          className="han min-w-0 text-[1.25rem] leading-relaxed break-words text-ink xsm:text-[1.1875rem]"
        >
          {example.zh}
        </p>
        <div
          className="ml-2 shrink-0"
        >
          <SpeakerButton
            text={example.zh}
            label="Nghe câu ví dụ"
            size={1}
          />
        </div>
      </div>

      {showPinyin && example.pinyin.trim() !== '' ? (
        <p
          lang="zh-Latn-pinyin"
          className="mt-1 min-w-0 break-words text-[0.8125rem] tracking-wide text-ink-faint"
        >
          {example.pinyin}
        </p>
      ) : null}

      {showVi ? (
        <p
          lang="vi"
          className="mt-1.5 min-w-0 break-words text-[0.9375rem] text-ink-soft"
        >
          {example.vi}
        </p>
      ) : null}

      {showEn ? (
        <p
          lang="en"
          className="mt-1 min-w-0 break-words text-[0.875rem] text-ink-faint italic"
        >
          {example.en}
        </p>
      ) : null}
    </div>
  );
}
