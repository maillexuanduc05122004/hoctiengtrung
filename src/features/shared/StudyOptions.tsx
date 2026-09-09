import { useId } from 'react';
import { usePoolCounts } from './usePoolCounts.ts';
import type { PoolKind } from '../../hooks/useStudySession.ts';
import type { HskLevel } from '../../types/vocabulary.ts';

export interface StudyOptionsValue {
  levels: HskLevel[];
  pool: PoolKind;
}

export interface StudyOptionsProps {
  value: StudyOptionsValue;
  onChange: (next: StudyOptionsValue) => void;
  /** Có giá trị khi đang học theo một buổi cụ thể. */
  lessonLabel?: string;
  lessonId?: string;
}

const LEVELS: readonly HskLevel[] = [1, 2, 3];

interface PoolOption {
  value: Exclude<PoolKind, 'lesson'>;
  label: string;
  /** Một câu nói rõ nguồn này gồm những từ nào. */
  hint: string;
}

// 'lesson' không có trong danh sách này vì nó do trang buổi học đặt sẵn, người
// học không tự chọn được.
const POOL_OPTIONS: readonly PoolOption[] = [
  { value: 'due', label: 'Cần ôn', hint: 'Từ đã học, tới hẹn ôn lại hôm nay' },
  { value: 'new', label: 'Từ mới', hint: 'Từ chưa gặp lần nào' },
  { value: 'starred', label: 'Từ đã lưu', hint: 'Những từ bạn bấm sao, mọi cấp' },
  { value: 'mixed', label: 'Trộn', hint: 'Ôn trước, hết mới lấy thêm từ mới' },
];

/**
 * Bảng chọn nguồn từ cho một phiên học.
 *
 * Trước đây đây là một dãy nút gọn không lời giải thích, nên "Trộn" hay "Cần ôn"
 * nghĩa là gì thì người học phải tự đoán, và nguồn nào rỗng thì chọn xong mới
 * biết. Nay mỗi nguồn là một dòng có mô tả và số từ còn lại, nguồn rỗng bị khoá
 * ngay tại chỗ.
 *
 * Chọn được nhiều cấp cùng lúc để trộn, nhưng luôn phải còn ít nhất một cấp:
 * bỏ hết cấp thì hàng đợi rỗng và người học không hiểu vì sao không có từ nào.
 */
export function StudyOptions({ value, onChange, lessonLabel, lessonId }: StudyOptionsProps) {
  const groupName = useId();
  const byLesson = lessonLabel !== undefined && lessonLabel !== '';
  const { counts } = usePoolCounts(value.levels, lessonId);

  const onlyLevel = value.levels.length === 1;

  const toggleLevel = (level: HskLevel): void => {
    const selected = value.levels.includes(level);
    if (selected && onlyLevel) return;
    const next = selected
      ? value.levels.filter((item) => item !== level)
      : [...value.levels, level];
    onChange({ ...value, levels: [...next].sort((a, b) => a - b) });
  };

  return (
    <div
      className="min-w-0 space-y-4"
    >
      {byLesson ? (
        <div
          className="flex min-w-0 flex-wrap items-baseline border-b border-line pb-3"
        >
          <span
            className="mr-2 shrink-0 text-[0.8125rem] font-medium text-ink-soft"
          >
            Buổi học
          </span>
          <span
            className="min-w-0 break-words text-[0.9375rem] font-semibold text-ink"
          >
            {lessonLabel}
          </span>
        </div>
      ) : (
        <fieldset
          className="min-w-0"
        >
          <legend
            className="mb-1.5 text-[0.8125rem] font-medium text-ink-soft"
          >
            Cấp HSK
          </legend>
          <div
            className="flex flex-wrap items-center space-x-2"
          >
            {LEVELS.map((level) => {
              const selected = value.levels.includes(level);
              // Cấp cuối cùng còn lại bị khoá hẳn thay vì im lặng không phản
              // ứng: một nút bấm không làm gì và không nói gì là một nút hỏng.
              const locked = selected && onlyLevel;
              return (
                <button
                  key={level}
                  type="button"
                  aria-pressed={selected}
                  aria-disabled={locked}
                  title={locked ? 'Phải giữ lại ít nhất một cấp' : undefined}
                  onClick={() => toggleLevel(level)}
                  className={[
                    'tap border px-4 py-1.5 text-[0.875rem] font-medium rounded-[0.375rem] transition-colors duration-150',
                    selected
                      ? 'border-ink bg-ink text-paper'
                      : 'border-line-strong bg-surface text-ink-soft hover:border-ink-faint',
                    locked ? 'cursor-not-allowed opacity-70' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {`HSK ${level}`}
                </button>
              );
            })}
          </div>
          <p
            className="mt-1.5 text-[0.75rem] text-ink-faint"
          >
            Chọn nhiều cấp để trộn từ của các cấp với nhau. Phải giữ lại ít nhất một cấp.
          </p>
        </fieldset>
      )}

      {value.pool === 'lesson' ? null : (
        <fieldset
          className="min-w-0"
        >
          <legend
            className="mb-1.5 text-[0.8125rem] font-medium text-ink-soft"
          >
            Nguồn từ
          </legend>
          <div
            className="min-w-0 border border-line-strong rounded-[0.375rem]"
          >
            {POOL_OPTIONS.map((option, position) => {
              const selected = option.value === value.pool;
              const count = counts?.[option.value];
              const empty = count === 0;
              return (
                <label
                  key={option.value}
                  className={[
                    'tap flex min-w-0 cursor-pointer items-center px-3 py-2.5',
                    position === 0 ? '' : 'border-t border-line',
                    selected ? 'bg-sunken' : '',
                    empty ? 'cursor-not-allowed opacity-60' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <input
                    type="radio"
                    name={groupName}
                    checked={selected}
                    disabled={empty}
                    onChange={() => onChange({ ...value, pool: option.value })}
                    className="mr-3 h-4 w-4 shrink-0 accent-cinnabar"
                  />
                  <span
                    className="min-w-0 flex-1"
                  >
                    <span
                      className="block text-[0.9375rem] font-medium text-ink"
                    >
                      {option.label}
                    </span>
                    <span
                      className="mt-0.5 block text-[0.75rem] leading-snug text-ink-faint"
                    >
                      {option.hint}
                    </span>
                  </span>
                  <span
                    className="ml-3 shrink-0 text-[0.8125rem] tabular-nums text-ink-soft"
                  >
                    {count === undefined ? '' : `${count} từ`}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}
    </div>
  );
}
