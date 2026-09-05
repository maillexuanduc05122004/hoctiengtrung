import { useId, type ReactNode } from 'react';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  /** Nhãn dài hơn cho trình đọc màn hình khi nhãn hiển thị bị rút gọn. */
  srLabel?: string;
}

export interface SegmentedProps<T extends string> {
  legend: string;
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Ẩn nhãn nhóm khỏi giao diện nhưng vẫn giữ cho trình đọc màn hình. */
  hideLegend?: boolean;
}

/** Nhóm nút chọn một trong nhiều, điều hướng được bằng phím mũi tên. */
export function Segmented<T extends string>({
  legend,
  options,
  value,
  onChange,
  hideLegend = false,
}: SegmentedProps<T>) {
  return (
    <fieldset
      className="min-w-0"
    >
      <legend
        className={hideLegend ? 'sr-only' : 'mb-1.5 text-[0.8125rem] font-medium text-ink-soft'}
      >
        {legend}
      </legend>
      <div
        role="radiogroup"
        aria-label={legend}
        className="inline-flex flex-wrap border border-line-strong rounded-[0.375rem] bg-surface p-0.5"
      >
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.value)}
              className={[
                'tap px-3 py-1.5 text-[0.875rem] font-medium transition-colors duration-150 rounded-[0.25rem]',
                selected ? 'bg-ink text-paper' : 'text-ink-soft hover:bg-sunken',
              ].join(' ')}
            >
              {option.srLabel ? <span className="sr-only">{option.srLabel}</span> : null}
              <span
                aria-hidden={option.srLabel ? true : undefined}
              >
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** Công tắc bật tắt dạng hàng, dùng trong trang cài đặt. */
export function Toggle({ label, description, checked, onChange }: ToggleProps) {
  const id = useId();
  return (
    <div
      className="flex items-center justify-between py-3"
    >
      <div
        className="min-w-0 pr-4"
      >
        <label
          htmlFor={id}
          className="block text-[0.9375rem] font-medium text-ink"
        >
          {label}
        </label>
        {description ? (
          <p
            className="mt-0.5 text-[0.8125rem] text-ink-faint"
          >
            {description}
          </p>
        ) : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={[
          'relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-150',
          checked ? 'border-teal bg-teal' : 'border-line-strong bg-sunken',
        ].join(' ')}
      >
        <span
          className={[
            'block h-4.5 w-4.5 rounded-full bg-surface shadow-sm transition-transform duration-150',
            checked ? 'translate-x-[1.4rem]' : 'translate-x-[0.15rem]',
          ].join(' ')}
        />
      </button>
    </div>
  );
}

export interface ChipProps {
  children: ReactNode;
  tone?: 'neutral' | 'teal' | 'cinnabar' | 'warn';
  className?: string;
}

const CHIP_TONES: Record<NonNullable<ChipProps['tone']>, string> = {
  neutral: 'border-line text-ink-soft bg-surface',
  teal: 'border-teal/40 text-teal-ink bg-teal-soft',
  cinnabar: 'border-cinnabar/40 text-cinnabar-ink bg-cinnabar-soft',
  warn: 'border-partial/40 text-partial bg-partial-soft',
};

/** Nhãn nhỏ dùng cho cấp HSK, từ loại, trạng thái dịch. */
export function Chip({ children, tone = 'neutral', className = '' }: ChipProps) {
  return (
    <span
      className={[
        'inline-flex items-center border px-2 py-0.5 text-[0.75rem] font-medium rounded-[0.25rem] whitespace-nowrap',
        CHIP_TONES[tone],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  );
}
