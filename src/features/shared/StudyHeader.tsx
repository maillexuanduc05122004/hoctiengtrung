import type { ReactNode } from 'react';
import { ProgressBar } from '../../components/ui/Feedback.tsx';

export interface StudyHeaderProps {
  title: string;
  done: number;
  total: number;
  subtitle?: string;
  /** Các nút phụ của phiên học, ví dụ đánh dấu từ hay mở hộp tra từ. */
  right?: ReactNode;
}

/** Tiêu đề phiên học kèm thanh tiến độ, luôn cho biết còn bao nhiêu từ nữa. */
export function StudyHeader({ title, done, total, subtitle, right }: StudyHeaderProps) {
  return (
    <header
      className="min-w-0 border-b border-line pb-4"
    >
      <div
        className="flex min-w-0 items-start justify-between"
      >
        <div
          className="min-w-0"
        >
          <h1
            className="text-[1.125rem] font-semibold tracking-tight break-words text-ink"
          >
            {title}
          </h1>
          {subtitle !== undefined && subtitle !== '' ? (
            <p
              className="mt-0.5 break-words text-[0.8125rem] text-ink-faint"
            >
              {subtitle}
            </p>
          ) : null}
        </div>
        {right !== undefined && right !== null ? (
          <div
            className="ml-3 flex shrink-0 items-center space-x-1"
          >
            {right}
          </div>
        ) : null}
      </div>

      <div
        className="mt-3"
      >
        <ProgressBar
          value={done}
          max={total}
          label="Tiến độ phiên"
          hint={`${done}/${total}`}
          tone="teal"
        />
      </div>
    </header>
  );
}
