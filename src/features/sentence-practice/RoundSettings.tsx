/**
 * Hàng lựa chọn đầu trang của "Dịch câu" và "Luyện phát âm": lấy câu từ bài
 * nào, câu ngắn hay dài, mỗi lượt bao nhiêu câu. Đổi lựa chọn nào là bắt đầu
 * lượt mới ngay, vì lượt đang làm không còn khớp với lựa chọn nữa.
 */
import { useId } from 'react';
import { Segmented, type SegmentedOption } from '../../components/ui/Controls.tsx';
import type { LengthFilter, RoundOptions } from './round.ts';

const LENGTHS: readonly SegmentedOption<LengthFilter>[] = [
  { value: 'all', label: 'Trộn' },
  { value: 'short', label: 'Câu ngắn' },
  { value: 'long', label: 'Câu dài' },
];

export interface RoundSettingsProps {
  lessons: readonly { id: string; number: number; count: number }[];
  /** Tổng số câu khi chọn "Tất cả bài". */
  total: number;
  value: RoundOptions;
  onChange: (value: RoundOptions) => void;
  sizes: readonly number[];
  /** Ẩn lựa chọn độ dài khi trang chỉ dùng một loại câu. */
  showLength?: boolean;
}

export function RoundSettings({
  lessons,
  total,
  value,
  onChange,
  sizes,
  showLength = true,
}: RoundSettingsProps) {
  const lessonId = useId();
  const sizeOptions: readonly SegmentedOption<string>[] = sizes.map((size) => ({
    value: String(size),
    label: `${size} câu`,
  }));

  return (
    <div
      className="flex flex-wrap items-end"
    >
      <span
        className="mr-4 mb-3 min-w-0"
      >
        <label
          htmlFor={lessonId}
          className="mb-1.5 block text-[0.8125rem] font-medium text-ink-soft"
        >
          Lấy câu từ
        </label>
        <select
          id={lessonId}
          value={value.lesson}
          onChange={(event) => onChange({ ...value, lesson: event.target.value })}
          className="tap min-w-[11rem] rounded-[0.375rem] border border-line-strong bg-surface px-3 py-1.5 text-[0.9375rem] text-ink"
        >
          <option value="all">{`Tất cả bài (${total} câu)`}</option>
          {lessons.map((lesson) => (
            <option
              key={lesson.id}
              value={lesson.id}
            >
              {`Bài ${lesson.number} (${lesson.count} câu)`}
            </option>
          ))}
        </select>
      </span>
      {showLength ? (
        <span
          className="mr-4 mb-3"
        >
          <Segmented
            legend="Độ dài"
            options={LENGTHS}
            value={value.length}
            onChange={(length) => onChange({ ...value, length })}
          />
        </span>
      ) : null}
      <span
        className="mb-3"
      >
        <Segmented
          legend="Mỗi lượt"
          options={sizeOptions}
          value={String(value.size)}
          onChange={(size) => onChange({ ...value, size: Number(size) })}
        />
      </span>
    </div>
  );
}
