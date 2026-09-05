import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon.tsx';

export interface ProgressBarProps {
  value: number;
  max: number;
  label: string;
  /** Hiện số liệu bên phải nhãn. */
  hint?: string;
  tone?: 'teal' | 'cinnabar' | 'ink';
}

const BAR_TONES: Record<NonNullable<ProgressBarProps['tone']>, string> = {
  teal: 'bg-teal',
  cinnabar: 'bg-cinnabar',
  ink: 'bg-ink',
};

export function ProgressBar({ value, max, label, hint, tone = 'teal' }: ProgressBarProps) {
  const safeMax = max > 0 ? max : 1;
  const percent = Math.min(100, Math.max(0, (value / safeMax) * 100));
  return (
    <div
      className="min-w-0"
    >
      <div
        className="mb-1 flex items-baseline justify-between text-[0.8125rem]"
      >
        <span
          className="font-medium text-ink-soft"
        >
          {label}
        </span>
        {hint ? (
          <span
            className="tabular-nums text-ink-faint"
          >
            {hint}
          </span>
        ) : null}
      </div>
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-label={label}
        className="h-1.5 w-full overflow-hidden rounded-full bg-sunken"
      >
        <div
          style={{ width: `${percent}%` }}
          className={`h-full rounded-full transition-[width] duration-300 ${BAR_TONES[tone]}`}
        />
      </div>
    </div>
  );
}

export interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon = 'info', title, description, action }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center px-6 py-12 text-center"
    >
      <span
        className="mb-3 text-ink-faint"
      >
        <Icon name={icon} size={1.75} />
      </span>
      <p
        className="text-[0.9375rem] font-medium text-ink"
      >
        {title}
      </p>
      {description ? (
        <p
          className="mt-1.5 max-w-[26rem] text-[0.875rem] text-ink-faint"
        >
          {description}
        </p>
      ) : null}
      {action ? (
        <div
          className="mt-5"
        >
          {action}
        </div>
      ) : null}
    </div>
  );
}

export interface NoticeProps {
  tone?: 'info' | 'warn' | 'error';
  title?: string;
  children: ReactNode;
}

const NOTICE_TONES: Record<NonNullable<NoticeProps['tone']>, string> = {
  info: 'border-teal/35 bg-teal-soft text-teal-ink',
  warn: 'border-partial/40 bg-partial-soft text-partial',
  error: 'border-cinnabar/40 bg-cinnabar-soft text-cinnabar-ink',
};

/** Khung thông báo dùng cho các giới hạn thật của trình duyệt, không phải quảng cáo. */
export function Notice({ tone = 'info', title, children }: NoticeProps) {
  return (
    <div
      role="status"
      className={`border px-3.5 py-3 text-[0.875rem] rounded-[0.375rem] ${NOTICE_TONES[tone]}`}
    >
      {title ? (
        <p
          className="mb-1 font-semibold"
        >
          {title}
        </p>
      ) : null}
      <div
        className="leading-relaxed"
      >
        {children}
      </div>
    </div>
  );
}

/** Vòng quay chờ, chỉ hiện khi thực sự đang tải dữ liệu. */
export function Spinner({ label = 'Đang tải' }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center py-10 text-ink-faint"
    >
      <span
        className="mr-2.5 h-4 w-4 animate-spin rounded-full border-2 border-line-strong border-t-cinnabar"
      />
      <span
        className="text-[0.875rem]"
      >
        {label}
      </span>
    </div>
  );
}
