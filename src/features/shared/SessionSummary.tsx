import type { ReactNode } from 'react';
import { Button } from '../../components/ui/Button.tsx';
import type { SessionStats } from '../../hooks/useStudySession.ts';

export interface SessionSummaryProps {
  stats: SessionStats;
  onRestart: () => void;
  /** Nút phụ do từng chế độ thêm vào, ví dụ "Sang chế độ gõ". */
  extra?: ReactNode;
}

interface SummaryCell {
  label: string;
  value: number;
  tone: string;
}

/**
 * Bảng tổng kết cuối phiên.
 *
 * Chỉ hiện đúng những con số phiên học vừa ghi lại. Không có phần trăm, không có
 * huy hiệu, không có lời khen chung chung: người học tự nhìn ra mình cần ôn gì.
 */
export function SessionSummary({ stats, onRestart, extra }: SessionSummaryProps) {
  const cells: SummaryCell[] = [
    { label: 'Đúng', value: stats.correct, tone: 'text-correct' },
    { label: 'Gần đúng', value: stats.close, tone: 'text-partial' },
    { label: 'Chưa đúng', value: stats.wrong, tone: 'text-wrong' },
    { label: 'Đã dùng gợi ý', value: stats.hinted, tone: 'text-ink-soft' },
  ];

  return (
    <section
      className="mx-auto w-full max-w-[30rem] min-w-0"
      aria-label="Tổng kết phiên học"
    >
      <h2
        className="text-[1.25rem] font-semibold tracking-tight text-ink"
      >
        Xong phiên học
      </h2>
      <p
        className="mt-1 text-[0.9375rem] text-ink-soft"
      >
        {`Bạn đã trả lời ${stats.done} trên ${stats.total} từ.`}
      </p>

      <dl
        className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 border-t border-line pt-5"
      >
        {cells.map((cell) => (
          <div
            key={cell.label}
            className="min-w-0"
          >
            <dt
              className="text-[0.8125rem] text-ink-faint"
            >
              {cell.label}
            </dt>
            <dd
              className={`mt-0.5 text-[1.75rem] leading-none font-semibold tabular-nums ${cell.tone}`}
            >
              {cell.value}
            </dd>
          </div>
        ))}
      </dl>

      <div
        className="mt-7 space-y-2"
      >
        <Button
          variant="primary"
          size="lg"
          icon="refresh"
          block
          onClick={onRestart}
        >
          Học lại phiên này
        </Button>
        {extra !== undefined && extra !== null ? extra : null}
      </div>
    </section>
  );
}
