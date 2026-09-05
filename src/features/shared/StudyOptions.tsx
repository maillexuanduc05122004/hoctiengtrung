import { Segmented, type SegmentedOption } from '../../components/ui/Controls.tsx';
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
}

const LEVELS: readonly HskLevel[] = [1, 2, 3];

// 'lesson' không có trong danh sách này vì nó do trang buổi học đặt sẵn, người
// học không tự chọn được.
const POOL_OPTIONS: readonly SegmentedOption<PoolKind>[] = [
  { value: 'due', label: 'Cần ôn' },
  { value: 'new', label: 'Từ mới' },
  { value: 'starred', label: 'Đã đánh dấu', srLabel: 'Từ đã đánh dấu' },
  // Nhánh 'mixed' trong useStudySession chỉ gộp từ cần ôn với từ mới, không lấy
  // từ đã đánh dấu, nên nhãn đọc màn hình phải nói đúng phạm vi đó.
  { value: 'mixed', label: 'Trộn', srLabel: 'Trộn từ cần ôn và từ mới' },
];

/**
 * Bảng chọn nguồn từ cho một phiên học.
 *
 * Chọn được nhiều cấp cùng lúc để trộn, nhưng luôn phải còn ít nhất một cấp:
 * bỏ hết cấp thì hàng đợi rỗng và người học không hiểu vì sao không có từ nào.
 */
export function StudyOptions({ value, onChange, lessonLabel }: StudyOptionsProps) {
  const byLesson = lessonLabel !== undefined && lessonLabel !== '';

  const toggleLevel = (level: HskLevel): void => {
    const selected = value.levels.includes(level);
    if (selected && value.levels.length === 1) return;
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
              return (
                <button
                  key={level}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleLevel(level)}
                  className={[
                    'tap border px-4 py-1.5 text-[0.875rem] font-medium rounded-[0.375rem] transition-colors duration-150',
                    selected
                      ? 'border-ink bg-ink text-paper'
                      : 'border-line-strong bg-surface text-ink-soft hover:border-ink-faint',
                  ].join(' ')}
                >
                  {`HSK ${level}`}
                </button>
              );
            })}
          </div>
          <p
            className="mt-1.5 text-[0.75rem] text-ink-faint"
          >
            Chọn nhiều cấp để trộn từ của các cấp với nhau.
          </p>
        </fieldset>
      )}

      {value.pool === 'lesson' ? null : (
        <Segmented
          legend="Nguồn từ"
          options={POOL_OPTIONS}
          value={value.pool}
          onChange={(pool) => onChange({ ...value, pool })}
        />
      )}
    </div>
  );
}
