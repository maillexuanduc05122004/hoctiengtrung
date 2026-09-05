import type { VocabularyWord } from '../../types/vocabulary.ts';

/** Bốn cỡ chữ Hán, từ dòng danh sách nhỏ đến mặt trước thẻ học. */
export type WordFaceSize = 'sm' | 'md' | 'lg' | 'xl';

export interface WordFaceProps {
  word: VocabularyWord;
  size?: WordFaceSize;
  showTraditional?: boolean;
  className?: string;
}

// Chữ Hán luôn nhỏ lại một bậc trên điện thoại: một từ bốn chữ ở cỡ máy tính sẽ
// tràn ra ngoài bề ngang 20rem của máy nhỏ nhất mà dự án phải chạy đúng.
const HANZI_SIZES: Record<WordFaceSize, string> = {
  'sm': 'text-[1.375rem] xsm:text-[1.25rem]',
  'md': 'text-[2rem] xsm:text-[1.75rem]',
  'lg': 'text-[3rem] xsm:text-[2.5rem]',
  'xl': 'text-[4.25rem] xsm:text-[3.25rem]',
};

const TRADITIONAL_SIZES: Record<WordFaceSize, string> = {
  'sm': 'text-[1rem]',
  'md': 'text-[1.25rem]',
  'lg': 'text-[1.5rem]',
  'xl': 'text-[1.875rem]',
};

/**
 * Mặt chữ Hán của một từ.
 *
 * Đây là phần người học nhìn lâu nhất nên chữ được để rất lớn, giãn dòng chặt và
 * không bị bọc trong khung nào cả: khoảng trắng quanh nó đã đủ làm nổi bật.
 */
export function WordFace({ word, size = 'lg', showTraditional = false, className = '' }: WordFaceProps) {
  // Rất nhiều từ HSK 1-3 có chữ phồn thể trùng chữ giản thể; lặp lại y hệt chỉ
  // làm rối mắt nên chỉ hiện khi hai cách viết thật sự khác nhau.
  const traditional =
    showTraditional && word.traditional !== undefined && word.traditional !== word.simplified
      ? word.traditional
      : null;

  return (
    <div
      className={['min-w-0', className].filter(Boolean).join(' ')}
    >
      <p
        lang="zh-Hans"
        className={`han leading-tight break-words text-ink ${HANZI_SIZES[size]}`}
      >
        {word.simplified}
      </p>
      {traditional !== null ? (
        <p
          className="mt-2 flex min-w-0 flex-wrap items-baseline"
        >
          <span
            className="mr-2 shrink-0 text-[0.6875rem] tracking-wide text-ink-faint"
          >
            phồn thể
          </span>
          <span
            lang="zh-Hant"
            className={`han min-w-0 break-words text-ink-soft ${TRADITIONAL_SIZES[size]}`}
          >
            {traditional}
          </span>
        </p>
      ) : null}
    </div>
  );
}
