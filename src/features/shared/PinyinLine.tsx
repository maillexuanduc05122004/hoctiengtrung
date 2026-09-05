export interface PinyinLineProps {
  pinyin: string;
  hidden?: boolean;
  onReveal?: () => void;
  className?: string;
}

/**
 * Dòng pinyin dưới chữ Hán.
 *
 * Khi bị ẩn, mỗi âm tiết được thay bằng một gạch ngắn để người học vẫn đoán được
 * từ này có mấy âm tiết — một gợi ý vừa đủ mà không lộ đáp án.
 */
export function PinyinLine({ pinyin, hidden = false, onReveal, className = '' }: PinyinLineProps) {
  const text = pinyin.trim();
  const syllables = text === '' ? [] : text.split(/\s+/);

  const base = 'min-w-0 break-words text-[1rem] tracking-wide text-ink-soft';

  if (!hidden) {
    return (
      <p
        lang="zh-Latn-pinyin"
        className={[base, className].filter(Boolean).join(' ')}
      >
        {text}
      </p>
    );
  }

  const dashes = (
    <span
      aria-hidden="true"
      className="flex items-center space-x-1.5"
    >
      {syllables.map((syllable, index) => (
        <span
          key={`${index}-${syllable}`}
          className="block h-[0.1875rem] w-[1.5rem] rounded-full bg-line-strong"
        />
      ))}
    </span>
  );

  // Không có onReveal nghĩa là chỗ này chỉ báo "đang ẩn", không phải nút bấm.
  if (onReveal === undefined) {
    return (
      <p
        className={['min-w-0', className].filter(Boolean).join(' ')}
      >
        <span
          className="sr-only"
        >
          Pinyin đang được ẩn
        </span>
        {dashes}
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={onReveal}
      className={[
        'tap inline-flex items-center rounded-[0.375rem] px-2 text-ink-faint transition-colors duration-150 hover:text-ink-soft',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {dashes}
      <span
        className="ml-2.5 text-[0.8125rem] font-medium"
      >
        Hiện pinyin
      </span>
    </button>
  );
}
