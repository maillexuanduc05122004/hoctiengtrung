import type { DailyStat } from '../../types/study.ts';

export interface WeeklyChartProps {
  /** Bảy ngày gần nhất, cũ trước mới sau. */
  days: readonly DailyStat[];
  /** Mục tiêu mỗi ngày, vẽ thành một đường kẻ đứt ngang để so sánh. */
  goal?: number;
  className?: string;
}

/** Nhãn thứ ngắn, chỉ số theo Date.getDay() nên bắt đầu từ Chủ Nhật. */
const WEEKDAYS: readonly string[] = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Dựng lại Date theo giờ địa phương. Không dùng `new Date('2026-09-05')` vì
 * chuỗi ISO chỉ có ngày được hiểu là UTC, ở Việt Nam sẽ lùi mất một ngày.
 */
function parseDay(day: string): Date | null {
  const parts = DAY_PATTERN.exec(day);
  if (!parts) return null;
  return new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]));
}

function shortLabel(day: string): string {
  const date = parseDay(day);
  return date ? WEEKDAYS[date.getDay()] : '?';
}

function spokenLabel(day: string): string {
  const date = parseDay(day);
  return date ? `ngày ${date.getDate()} tháng ${date.getMonth() + 1}` : day;
}

/**
 * Lịch sử bảy ngày, vẽ bằng div chứ không kéo theo thư viện biểu đồ nào.
 *
 * Mỗi cột là một ngày: phần đậm là số câu trả lời đúng, phần nhạt là số lượt
 * còn lại. Ngày không học vẫn có mặt dưới dạng một vạch mảnh — nhìn thấy khoảng
 * trống thật còn hơn là giấu ngày đó đi.
 */
export function WeeklyChart({ days, goal, className = '' }: WeeklyChartProps) {
  const goalValue = goal ?? 0;
  const peak = days.reduce((max, day) => Math.max(max, day.reviews), 0);
  const ceiling = Math.max(peak, goalValue, 1);
  const totalReviews = days.reduce((sum, day) => sum + day.reviews, 0);
  const totalCorrect = days.reduce((sum, day) => sum + day.correct, 0);
  const showGoalLine = goalValue > 0 && goalValue <= ceiling;

  return (
    <figure
      className={['m-0 min-w-0', className].filter(Boolean).join(' ')}
    >
      <div
        className="relative h-[7rem] xsm:h-[5.5rem]"
      >
        <div
          className="grid h-full grid-cols-7 gap-x-1.5"
        >
          {days.map((day, position) => {
            const isToday = position === days.length - 1;
            const height = day.reviews > 0 ? Math.max(6, (day.reviews / ceiling) * 100) : 0;
            const correctPart = day.reviews > 0 ? (day.correct / day.reviews) * 100 : 0;
            return (
              <div
                key={day.day}
                className="flex h-full min-w-0 flex-col justify-end"
              >
                <span
                  className="sr-only"
                >
                  {`${spokenLabel(day.day)}${isToday ? ' (hôm nay)' : ''}: ${day.reviews} lượt ôn, ${day.correct} câu đúng`}
                </span>
                {day.reviews > 0 ? (
                  <div
                    aria-hidden="true"
                    style={{ height: `${height}%` }}
                    className="flex w-full flex-col justify-end overflow-hidden bg-teal/25 rounded-t-[0.1875rem]"
                  >
                    <div
                      style={{ height: `${correctPart}%` }}
                      className="w-full bg-teal"
                    />
                  </div>
                ) : (
                  <div
                    aria-hidden="true"
                    className="h-[0.125rem] w-full bg-line"
                  />
                )}
              </div>
            );
          })}
        </div>

        {showGoalLine ? (
          <div
            aria-hidden="true"
            style={{ bottom: `${(goalValue / ceiling) * 100}%` }}
            className="pointer-events-none absolute right-0 left-0 border-t border-dashed border-line-strong"
          />
        ) : null}
      </div>

      <div
        className="mt-1.5 grid grid-cols-7 gap-x-1.5 border-t border-line pt-1.5"
      >
        {days.map((day, position) => {
          const isToday = position === days.length - 1;
          return (
            <div
              key={day.day}
              aria-hidden="true"
              className="min-w-0 text-center"
            >
              <span
                className={[
                  'block text-[0.6875rem]',
                  isToday ? 'font-semibold text-ink' : 'text-ink-faint',
                ].join(' ')}
              >
                {shortLabel(day.day)}
              </span>
              <span
                className={[
                  'block text-[0.75rem] tabular-nums',
                  day.reviews > 0 ? 'text-ink-soft' : 'text-ink-faint',
                ].join(' ')}
              >
                {day.reviews}
              </span>
            </div>
          );
        })}
      </div>

      <figcaption
        className="mt-2 text-[0.75rem] leading-relaxed text-ink-faint"
      >
        {totalReviews === 0
          ? 'Chưa có lượt ôn nào trong bảy ngày qua.'
          : `Tổng bảy ngày: ${totalReviews} lượt, ${totalCorrect} câu đúng. Phần đậm của mỗi cột là số câu đúng.`}
        {showGoalLine ? ` Đường kẻ đứt là mục tiêu ${goalValue} lượt mỗi ngày.` : ''}
      </figcaption>
    </figure>
  );
}
