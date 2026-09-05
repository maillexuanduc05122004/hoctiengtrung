import { ProgressBar } from '../../components/ui/Feedback.tsx';
import type { ProgressSummary } from '../../types/study.ts';

export interface ProgressOverviewProps {
  summary: ProgressSummary;
  /** Thêm dòng tổng cộng bên dưới các thanh tiến độ. */
  showTotal?: boolean;
}

/**
 * Tiến độ từng cấp HSK.
 *
 * Chỉ là mấy thanh tiến độ xếp chồng, phân tách bằng khoảng trắng chứ không bọc
 * mỗi cấp vào một thẻ riêng: ba dòng thẳng hàng dễ so sánh hơn ba cái hộp.
 */
export function ProgressOverview({ summary, showTotal = false }: ProgressOverviewProps) {
  if (summary.perLevel.length === 0) {
    return (
      <p
        className="text-[0.875rem] text-ink-faint"
      >
        Chưa nạp được danh sách từ nên chưa tính được tiến độ theo cấp.
      </p>
    );
  }

  const totalWords = summary.perLevel.reduce((sum, item) => sum + item.total, 0);

  return (
    <div
      className="min-w-0"
    >
      <ul
        className="m-0 list-none space-y-4 p-0"
      >
        {summary.perLevel.map((item) => (
          <li
            key={item.level}
            className="min-w-0"
          >
            <ProgressBar
              value={item.learned}
              max={item.total}
              label={`HSK ${item.level}`}
              hint={`${item.learned}/${item.total} từ`}
              tone="teal"
            />
          </li>
        ))}
      </ul>

      {showTotal ? (
        <p
          className="mt-4 border-t border-line pt-3 text-[0.8125rem] text-ink-faint"
        >
          {`Đã học ${summary.learnedTotal} trên ${totalWords} từ của HSK 1 đến 3.`}
        </p>
      ) : null}
    </div>
  );
}
