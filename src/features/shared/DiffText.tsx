import type { MatchDiffPart } from '../../lib/answer-matcher/index.ts';
import { containsHanzi } from './hanzi.ts';

export interface DiffTextProps {
  diff: readonly MatchDiffPart[];
  className?: string;
}

type DiffStatus = MatchDiffPart['status'];

const PART_STYLES: Record<DiffStatus, string> = {
  ok: 'text-ink',
  wrong: 'text-wrong underline decoration-wavy underline-offset-[0.25rem]',
  missing: 'bg-partial-soft text-partial rounded-[0.25rem] px-[0.125rem]',
  extra: 'text-ink-faint line-through',
};

/** Lời chú cho trình đọc màn hình; phần đúng không cần chú gì thêm. */
const PART_NOTES: Record<DiffStatus, string> = {
  ok: '',
  wrong: 'sai',
  missing: 'thiếu',
  extra: 'thừa',
};

/**
 * Đối chiếu câu trả lời với đáp án theo từng phần.
 *
 * Màu sắc là cách nhanh nhất để thấy lỗi, nhưng chỉ có màu thì người dùng trình
 * đọc màn hình mất hết thông tin, nên mỗi phần sai đều kèm một lời chú ẩn.
 */
export function DiffText({ diff, className = '' }: DiffTextProps) {
  if (diff.length === 0) return null;

  const hanzi = diff.some((part) => containsHanzi(part.text));

  return (
    <p
      className={[
        'min-w-0 leading-relaxed break-words',
        hanzi ? 'han text-[1.5rem]' : 'text-[1.125rem]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {diff.map((part, index) => {
        const note = PART_NOTES[part.status];
        return (
          <span
            key={`${index}-${part.text}`}
            className={PART_STYLES[part.status]}
          >
            {note !== '' ? (
              <span
                className="sr-only"
              >
                {` (${note}: `}
              </span>
            ) : null}
            {part.text}
            {note !== '' ? (
              <span
                className="sr-only"
              >
                {') '}
              </span>
            ) : null}
          </span>
        );
      })}
    </p>
  );
}
