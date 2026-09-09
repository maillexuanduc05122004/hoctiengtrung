import type { ReactNode } from 'react';
import { Button } from '../../components/ui/Button.tsx';
import type { SessionStats } from '../../hooks/useStudySession.ts';

export interface SessionSummaryProps {
  stats: SessionStats;
  /** Phát lại đúng những từ vừa học. */
  onReplay: () => void;
  /** Dựng một phiên mới từ cùng nguồn từ. */
  onRestart: () => void;
  /** Phát lại riêng những từ chưa trả lời đúng. */
  onReplayMissed?: () => void;
  /** Số từ chưa trả lời đúng trong phiên này. */
  missedCount?: number;
  /** Nút phụ do từng chế độ thêm vào, ví dụ "Sang buổi kế tiếp". */
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
 *
 * Phần hành động được xếp theo việc đáng làm nhất. Nút nổi bật trước đây là
 * "Học lại phiên này" nhưng nó dựng lại hàng đợi từ kho, mà đúng những từ vừa
 * học thì đã có thẻ và đã bị đẩy hạn ôn sang tương lai — nên gần như lần nào nó
 * cũng dẫn thẳng vào một màn hình trống. Nay "học lại" là phát lại thật, còn
 * việc dựng phiên mới là một nút riêng, gọi đúng tên.
 */
export function SessionSummary({
  stats,
  onReplay,
  onRestart,
  onReplayMissed,
  missedCount = 0,
  extra,
}: SessionSummaryProps) {
  const cells: SummaryCell[] = [
    { label: 'Đúng', value: stats.correct, tone: 'text-correct' },
    { label: 'Gần đúng', value: stats.close, tone: 'text-partial' },
    { label: 'Chưa đúng', value: stats.wrong, tone: 'text-wrong' },
    { label: 'Đã dùng gợi ý', value: stats.hinted, tone: 'text-ink-soft' },
  ];

  const canReplayMissed = onReplayMissed !== undefined && missedCount > 0;

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
        {stats.skipped > 0 ? ` Bỏ qua ${stats.skipped} từ.` : ''}
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
        {canReplayMissed ? (
          <Button
            variant="primary"
            size="lg"
            icon="refresh"
            block
            onClick={onReplayMissed}
          >
            {`Học lại ${missedCount} từ chưa chắc`}
          </Button>
        ) : null}
        <Button
          variant={canReplayMissed ? 'secondary' : 'primary'}
          size="lg"
          icon="refresh"
          block
          onClick={onReplay}
        >
          Học lại cả phiên này
        </Button>
        <Button
          variant="secondary"
          size="lg"
          icon="arrow-right"
          block
          onClick={onRestart}
        >
          Phiên mới cùng nguồn từ
        </Button>
        {extra !== undefined && extra !== null ? extra : null}
      </div>
    </section>
  );
}
