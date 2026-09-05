import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { STUDY_NAV } from '../components/navigation.ts';
import { Icon } from '../components/ui/Icon.tsx';
import { Notice, ProgressBar, Spinner } from '../components/ui/Feedback.tsx';
import {
  ProgressOverview,
  TroubleWords,
  WeeklyChart,
  useProgressSummary,
  useSuggestedLesson,
} from '../features/progress/index.ts';
import { useSettings } from '../hooks/settings-context.ts';
import type { PoolKind } from '../hooks/useStudySession.ts';
import type { HskLevel } from '../types/vocabulary.ts';

const WEEKDAYS: readonly string[] = [
  'Chủ Nhật',
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
];

const LINK_TONES = {
  primary: 'bg-cinnabar text-paper border-cinnabar hover:bg-cinnabar-ink active:bg-cinnabar-ink',
  secondary: 'bg-surface text-ink border-line-strong hover:border-ink-faint active:bg-sunken',
} as const;

interface ActionLinkProps {
  to: string;
  tone?: keyof typeof LINK_TONES;
  children: ReactNode;
}

/**
 * Nút dẫn sang trang khác.
 *
 * Là thẻ liên kết thật chứ không phải nút gọi navigate, để mở tab mới và menu
 * chuột phải vẫn hoạt động; phần hình thức mượn đúng lớp của <Button>.
 */
function ActionLink({ to, tone = 'primary', children }: ActionLinkProps) {
  return (
    <Link
      to={to}
      className={[
        'tap inline-flex items-center justify-center border px-5 py-3 text-[1rem] font-medium',
        'no-underline transition-colors duration-150 rounded-[0.375rem]',
        LINK_TONES[tone],
      ].join(' ')}
    >
      {children}
    </Link>
  );
}

interface SectionProps {
  id: string;
  title: string;
  /** Liên kết phụ đặt bên phải tiêu đề. */
  action?: ReactNode;
  children: ReactNode;
}

/** Một mục của trang chủ, phân tách bằng đường kẻ mảnh thay vì lồng thẻ. */
function Section({ id, title, action, children }: SectionProps) {
  return (
    <section
      aria-labelledby={id}
      className="min-w-0 border-t border-line pt-6"
    >
      <div
        className="flex min-w-0 items-baseline justify-between"
      >
        <h2
          id={id}
          className="min-w-0 text-[1rem] font-semibold tracking-tight break-words text-ink"
        >
          {title}
        </h2>
        {action !== undefined ? (
          <div
            className="ml-3 shrink-0"
          >
            {action}
          </div>
        ) : null}
      </div>
      <div
        className="mt-3"
      >
        {children}
      </div>
    </section>
  );
}

/**
 * Đường dẫn vào một phiên học kèm nguồn từ và các cấp đang chọn.
 *
 * Tên tham số phải khớp với cái các trang luyện tập đang đọc (`?level=1,2&pool=mixed`),
 * nhờ vậy nút "Học tiếp" không đưa người học vào một lựa chọn khác với trang chủ.
 * Dấu phẩy được giữ nguyên cho địa chỉ dễ đọc, trình duyệt tự mã hoá khi cần.
 */
function studyLink(path: string, pool: PoolKind, levels: readonly HskLevel[]): string {
  const level = [...levels].sort((a, b) => a - b).join(',');
  return `${path}?level=${level}&pool=${pool}`;
}

function todayLabel(now: Date): string {
  return `${WEEKDAYS[now.getDay()]}, ngày ${now.getDate()} tháng ${now.getMonth() + 1}`;
}

export function HomePage() {
  const { settings } = useSettings();
  const { summary, loading } = useProgressSummary();
  const { suggestion, loading: lessonLoading } = useSuggestedLesson(settings.activeLevels);

  const levels = settings.activeLevels;
  const noLevels = levels.length === 0;
  // Người mới: chưa học từ nào, chưa ôn lượt nào. Lúc này trang chủ mời bắt đầu
  // buổi đầu tiên chứ không bày ra một loạt số 0 vô nghĩa.
  const isNewLearner =
    summary !== null &&
    summary.learnedTotal === 0 &&
    summary.todayReviews === 0 &&
    summary.streak === 0;

  const goal = settings.dailyGoal;
  const remaining = summary === null ? 0 : Math.max(0, goal - summary.todayReviews);

  return (
    <div
      className="mx-auto w-full max-w-[52rem] min-w-0 space-y-6"
    >
      <header
        className="min-w-0"
      >
        <p
          className="text-[0.8125rem] text-ink-faint"
        >
          {todayLabel(new Date())}
        </p>
        <h1
          className="mt-0.5 text-[1.5rem] font-semibold tracking-tight text-ink"
        >
          Hôm nay
        </h1>
      </header>

      {noLevels ? (
        <Notice
          tone="warn"
          title="Chưa chọn cấp HSK nào"
        >
          <p
            className="m-0"
          >
            Hãy chọn ít nhất một cấp trong{' '}
            <Link
              to="/cai-dat"
              className="underline underline-offset-2"
            >
              Cài đặt
            </Link>{' '}
            để bắt đầu học.
          </p>
        </Notice>
      ) : null}

      {/* Phần mở đầu: cần ôn bao nhiêu từ và vào học bằng một lần bấm. */}
      <section
        aria-labelledby="hom-nay-can-on"
        className="min-w-0 border-t border-line pt-6"
      >
        <h2
          id="hom-nay-can-on"
          className="sr-only"
        >
          Việc cần làm hôm nay
        </h2>

        {loading ? (
          <Spinner label="Đang đọc tiến độ" />
        ) : summary === null ? (
          <Notice
            tone="error"
            title="Không đọc được tiến độ"
          >
            Trình duyệt đang chặn bộ nhớ cục bộ hoặc dữ liệu chưa sẵn sàng. Thử tải lại trang.
          </Notice>
        ) : isNewLearner ? (
          <div
            className="min-w-0"
          >
            <p
              className="text-[1.125rem] font-semibold tracking-tight text-ink"
            >
              Bắt đầu buổi học đầu tiên
            </p>
            <p
              className="mt-1.5 max-w-[34rem] text-[0.9375rem] leading-relaxed text-ink-soft"
            >
              Bạn chưa học từ nào. Mỗi buổi khoảng mười từ; học xong buổi đầu tiên, ứng dụng sẽ tự
              xếp lịch ôn cho từng từ.
            </p>
            <div
              className="mt-4"
            >
              <ActionLink
                to={
                  suggestion !== null
                    ? `/buoi-hoc/${suggestion.lesson.id}`
                    : studyLink('/the', 'new', levels)
                }
              >
                Học buổi đầu tiên
              </ActionLink>
            </div>
          </div>
        ) : (
          <div
            className="flex min-w-0 flex-wrap items-end justify-between"
          >
            <div
              className="min-w-0"
            >
              <p
                className="text-[0.8125rem] text-ink-faint"
              >
                Cần ôn hôm nay
              </p>
              <p
                className="mt-1 flex items-baseline"
              >
                <span
                  className="text-[2.75rem] leading-none font-semibold tabular-nums text-cinnabar"
                >
                  {summary.dueToday}
                </span>
                <span
                  className="ml-2 text-[0.9375rem] text-ink-soft"
                >
                  từ
                </span>
              </p>
              <p
                className="mt-1.5 max-w-[30rem] text-[0.875rem] leading-relaxed text-ink-soft"
              >
                {summary.dueToday === 0
                  ? `Không còn từ nào tới hạn. Còn ${summary.newAvailable} từ mới chưa học.`
                  : `Còn ${summary.newAvailable} từ mới chưa học trong các cấp đang chọn.`}
              </p>
            </div>
            <div
              className="mt-4 shrink-0 xsm:w-full"
            >
              <ActionLink to={studyLink('/the', 'mixed', levels)}>Học tiếp</ActionLink>
            </div>
          </div>
        )}
      </section>

      {summary !== null ? (
        <Section
          id="muc-tieu-hom-nay"
          title="Mục tiêu hằng ngày"
        >
          <ProgressBar
            value={summary.todayReviews}
            max={goal}
            label="Lượt ôn hôm nay"
            hint={goal > 0 ? `${summary.todayReviews}/${goal}` : `${summary.todayReviews}`}
            tone={summary.todayGoalReached ? 'teal' : 'cinnabar'}
          />
          <p
            className="mt-2 text-[0.8125rem] leading-relaxed text-ink-faint"
          >
            {goal <= 0
              ? 'Bạn chưa đặt mục tiêu hằng ngày trong Cài đặt.'
              : summary.todayGoalReached
                ? 'Đã đạt mục tiêu hôm nay.'
                : `Còn ${remaining} lượt nữa là đạt mục tiêu.`}
            {summary.streak > 0
              ? ` Chuỗi ngày học: ${summary.streak} ngày liên tiếp.`
              : ' Chưa có chuỗi ngày học nào.'}
          </p>
        </Section>
      ) : null}

      {isNewLearner ? null : (
        <Section
          id="buoi-hoc-goi-y"
          title="Buổi học gợi ý"
          action={
            <Link
              to="/buoi-hoc"
              className="tap inline-flex items-center justify-end text-[0.8125rem] text-ink-soft underline underline-offset-2"
            >
              Tất cả buổi học
            </Link>
          }
        >
          {lessonLoading ? (
            <p
              aria-live="polite"
              className="text-[0.875rem] text-ink-faint"
            >
              Đang tìm buổi học…
            </p>
          ) : suggestion === null ? (
            <p
              className="text-[0.875rem] text-ink-faint"
            >
              {noLevels
                ? 'Chọn một cấp HSK để xem buổi học gợi ý.'
                : 'Bạn đã học hết các buổi trong những cấp đang chọn.'}
            </p>
          ) : (
            <div
              className="flex min-w-0 flex-wrap items-end justify-between"
            >
              <div
                className="min-w-0 flex-1"
              >
                <p
                  className="text-[1rem] font-semibold text-ink"
                >
                  {`Buổi ${suggestion.lesson.index} · HSK ${suggestion.lesson.level}`}
                </p>
                <p
                  className="mt-0.5 min-w-0 text-[0.875rem] break-words text-ink-soft"
                >
                  <span
                    lang="zh-Hans"
                    className="han"
                  >
                    {suggestion.lesson.range.from}
                  </span>
                  <span
                    className="mx-1.5 text-ink-faint"
                  >
                    →
                  </span>
                  <span
                    lang="zh-Hans"
                    className="han"
                  >
                    {suggestion.lesson.range.to}
                  </span>
                </p>
                <div
                  className="mt-2.5 max-w-[24rem]"
                >
                  <ProgressBar
                    value={suggestion.learned}
                    max={suggestion.total}
                    label="Đã học trong buổi"
                    hint={`${suggestion.learned}/${suggestion.total} từ`}
                    tone="teal"
                  />
                </div>
              </div>
              <div
                className="mt-4 ml-4 shrink-0 xsm:ml-0 xsm:w-full"
              >
                <ActionLink
                  to={`/buoi-hoc/${suggestion.lesson.id}`}
                  tone="secondary"
                >
                  Vào học
                </ActionLink>
              </div>
            </div>
          )}
        </Section>
      )}

      <Section
        id="bon-che-do"
        title="Bốn chế độ luyện tập"
      >
        <ul
          className="m-0 grid list-none grid-cols-2 gap-x-6 p-0 xsm:grid-cols-1"
        >
          {STUDY_NAV.map((item) => (
            <li
              key={item.to}
              className="min-w-0 border-t border-line"
            >
              <Link
                to={item.to}
                className="tap flex min-w-0 items-center py-3 no-underline"
              >
                <span
                  className="mr-3 shrink-0 text-cinnabar"
                >
                  <Icon
                    name={item.icon}
                    size={1.25}
                  />
                </span>
                <span
                  className="min-w-0 flex-1"
                >
                  <span
                    className="block text-[0.9375rem] font-medium text-ink"
                  >
                    {item.label}
                  </span>
                  {item.description !== undefined ? (
                    <span
                      className="mt-0.5 block text-[0.8125rem] leading-snug break-words text-ink-faint"
                    >
                      {item.description}
                    </span>
                  ) : null}
                </span>
                <span
                  className="ml-2 shrink-0 text-ink-faint"
                >
                  <Icon
                    name="chevron-right"
                    size={1}
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {summary !== null ? (
        <Section
          id="tien-do-hsk"
          title="Tiến độ HSK"
          action={
            <Link
              to="/tien-do"
              className="tap inline-flex items-center justify-end text-[0.8125rem] text-ink-soft underline underline-offset-2"
            >
              Xem chi tiết
            </Link>
          }
        >
          <ProgressOverview
            summary={summary}
            showTotal
          />
        </Section>
      ) : null}

      {summary !== null ? (
        <Section
          id="bay-ngay-gan-nhat"
          title="Bảy ngày gần nhất"
        >
          <WeeklyChart
            days={summary.lastSevenDays}
            goal={goal}
          />
        </Section>
      ) : null}

      {isNewLearner ? null : (
        <Section
          id="tu-hay-sai"
          title="Từ thường trả lời sai"
          action={
            <Link
              to="/tien-do"
              className="tap inline-flex items-center justify-end text-[0.8125rem] text-ink-soft underline underline-offset-2"
            >
              Xem tất cả
            </Link>
          }
        >
          <TroubleWords
            limit={5}
            levels={levels}
            emptyMessage="Chưa có từ nào bị trả lời sai. Những từ hay nhầm sẽ xuất hiện ở đây."
          />
        </Section>
      )}
    </div>
  );
}

export default HomePage;
