import { useCallback, useId, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { BottomSheet } from '../components/ui/BottomSheet.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Notice, ProgressBar, Spinner } from '../components/ui/Feedback.tsx';
import { dayKey, exportProgress, importProgress, resetDatabase } from '../db/index.ts';
import {
  ProgressOverview,
  TroubleWords,
  WeeklyChart,
  useModeBreakdown,
  useProgressSummary,
} from '../features/progress/index.ts';
import { useSettings } from '../hooks/settings-context.ts';
import type { StudyMode } from '../types/study.ts';

const MODE_LABELS: Record<StudyMode, string> = {
  flashcards: 'Lật thẻ',
  typing: 'Gõ đáp án',
  listening: 'Nghe chép',
  speaking: 'Luyện nói',
};

interface BlockProps {
  id: string;
  title: string;
  /** Câu giải thích ngắn dưới tiêu đề, chỉ dùng khi con số dễ bị hiểu sai. */
  note?: string;
  children: ReactNode;
}

/** Một mục của trang, phân tách bằng đường kẻ mảnh thay vì lồng thẻ vào thẻ. */
function Block({ id, title, note, children }: BlockProps) {
  return (
    <section
      aria-labelledby={id}
      className="min-w-0 border-t border-line pt-6"
    >
      <h2
        id={id}
        className="min-w-0 text-[1rem] font-semibold tracking-tight break-words text-ink"
      >
        {title}
      </h2>
      {note !== undefined ? (
        <p
          className="mt-1 max-w-[38rem] text-[0.8125rem] leading-relaxed text-ink-faint"
        >
          {note}
        </p>
      ) : null}
      <div
        className="mt-3"
      >
        {children}
      </div>
    </section>
  );
}

interface StatCellProps {
  label: string;
  value: number;
  suffix?: string;
  tone?: 'ink' | 'cinnabar' | 'teal';
}

const STAT_TONES: Record<NonNullable<StatCellProps['tone']>, string> = {
  ink: 'text-ink',
  cinnabar: 'text-cinnabar',
  teal: 'text-teal',
};

function StatCell({ label, value, suffix, tone = 'ink' }: StatCellProps) {
  return (
    <div
      className="min-w-0"
    >
      <p
        className="text-[0.8125rem] break-words text-ink-faint"
      >
        {label}
      </p>
      <p
        className="mt-0.5 flex items-baseline"
      >
        <span
          className={`text-[1.75rem] leading-none font-semibold tabular-nums ${STAT_TONES[tone]}`}
        >
          {value}
        </span>
        {suffix !== undefined ? (
          <span
            className="ml-1.5 text-[0.8125rem] text-ink-faint"
          >
            {suffix}
          </span>
        ) : null}
      </p>
    </div>
  );
}

type Feedback = { tone: 'info' | 'error'; text: string } | null;

export function ProgressPage() {
  const { settings, update } = useSettings();
  const { summary, loading, reload } = useProgressSummary();
  // Thẻ và nhật ký được đọc bởi nhiều thành phần con, nên sau khi nạp lại hoặc
  // xoá tiến độ phải báo cho tất cả cùng đọc lại chứ không riêng phần tổng hợp.
  const [refreshToken, setRefreshToken] = useState(0);
  const { stats, total: troubledWords, loading: modeLoading } = useModeBreakdown(refreshToken);

  const [backup, setBackup] = useState<{ url: string; name: string } | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const fileInputId = useId();
  // Giữ địa chỉ blob đang cấp phát để thu hồi khi tạo tệp mới. Không thu hồi
  // trong dọn dẹp của useEffect vì StrictMode gắn effect hai lần, làm liên kết
  // tải về chết ngay khi vừa hiện ra.
  const backupUrl = useRef<string | null>(null);

  const refreshAll = useCallback(() => {
    reload();
    setRefreshToken((n) => n + 1);
  }, [reload]);

  const handleExport = useCallback(async () => {
    setBusy(true);
    try {
      const json = await exportProgress();
      const blob = new Blob([json], { type: 'application/json' });
      if (backupUrl.current !== null) {
        URL.revokeObjectURL(backupUrl.current);
      }
      const url = URL.createObjectURL(blob);
      backupUrl.current = url;
      setBackup({ url, name: `moi-ngay-tien-do-${dayKey(Date.now())}.json` });
      setFeedback(null);
    } catch (cause: unknown) {
      setFeedback({
        tone: 'error',
        text: cause instanceof Error ? cause.message : 'Không tạo được tệp sao lưu.',
      });
    } finally {
      setBusy(false);
    }
  }, []);

  const handleImport = useCallback(
    async (file: File) => {
      setBusy(true);
      try {
        const result = await importProgress(await file.text());
        // Tệp sao lưu có thể mang theo cài đặt; patch rỗng buộc đọc lại bản vừa nạp.
        await update({});
        refreshAll();
        setFeedback({
          tone: 'info',
          text: `Đã nạp ${result.cards} thẻ, ${result.reviews} lượt ôn và ${result.days} ngày học.`,
        });
      } catch (cause: unknown) {
        setFeedback({
          tone: 'error',
          text: cause instanceof Error ? cause.message : 'Không nạp được tệp sao lưu.',
        });
      } finally {
        setBusy(false);
      }
    },
    [refreshAll, update],
  );

  const onFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    // Xoá giá trị để chọn lại đúng tệp đó lần nữa vẫn kích hoạt sự kiện.
    event.target.value = '';
    if (file) void handleImport(file);
  };

  const handleReset = useCallback(async () => {
    setBusy(true);
    try {
      await resetDatabase();
      // resetDatabase xoá cả bảng cài đặt, ghi lại lựa chọn hiện tại để người
      // dùng không mất luôn chủ đề, mục tiêu và các cấp đang chọn.
      await update({ ...settings });
      refreshAll();
      setConfirmOpen(false);
      setFeedback({ tone: 'info', text: 'Đã xoá toàn bộ tiến độ.' });
    } catch (cause: unknown) {
      setFeedback({
        tone: 'error',
        text: cause instanceof Error ? cause.message : 'Không xoá được tiến độ.',
      });
    } finally {
      setBusy(false);
    }
  }, [refreshAll, settings, update]);

  return (
    <div
      className="mx-auto w-full max-w-[52rem] min-w-0 space-y-6"
    >
      <header
        className="min-w-0"
      >
        <h1
          className="text-[1.5rem] font-semibold tracking-tight text-ink"
        >
          Tiến độ
        </h1>
        <p
          className="mt-1 max-w-[38rem] text-[0.875rem] leading-relaxed text-ink-soft"
        >
          Mọi con số dưới đây lấy từ chính lịch sử học của bạn, lưu ngay trong máy.
        </p>
      </header>

      {feedback !== null ? (
        <Notice
          tone={feedback.tone === 'error' ? 'error' : 'info'}
          title={feedback.tone === 'error' ? 'Có lỗi' : 'Đã xong'}
        >
          {feedback.text}
        </Notice>
      ) : null}

      {loading ? (
        <Spinner label="Đang đọc tiến độ" />
      ) : summary === null ? (
        <Notice
          tone="error"
          title="Không đọc được tiến độ"
        >
          Trình duyệt đang chặn bộ nhớ cục bộ hoặc dữ liệu chưa sẵn sàng. Thử tải lại trang.
        </Notice>
      ) : (
        <>
          <section
            aria-label="Số liệu tổng quan"
            className="min-w-0 border-t border-line pt-6"
          >
            <div
              className="grid grid-cols-4 gap-x-4 gap-y-5 xsm:grid-cols-2"
            >
              <StatCell
                label="Từ đã học"
                value={summary.learnedTotal}
                suffix="từ"
              />
              <StatCell
                label="Chuỗi ngày học"
                value={summary.streak}
                suffix="ngày"
                tone="teal"
              />
              <StatCell
                label="Cần ôn hôm nay"
                value={summary.dueToday}
                suffix="từ"
                tone="cinnabar"
              />
              <StatCell
                label="Lượt ôn hôm nay"
                value={summary.todayReviews}
                suffix={settings.dailyGoal > 0 ? `/ ${settings.dailyGoal}` : 'lượt'}
              />
            </div>
            {summary.learnedTotal === 0 && summary.streak === 0 ? (
              <p
                className="mt-4 text-[0.875rem] leading-relaxed text-ink-soft"
              >
                Bạn chưa học từ nào nên tất cả đều bằng 0. Học xong buổi đầu tiên, trang này sẽ có
                số liệu thật.
              </p>
            ) : null}
          </section>

          <Block
            id="tien-do-cap"
            title="Tiến độ từng cấp"
          >
            <ProgressOverview
              summary={summary}
              showTotal
            />
          </Block>

          <Block
            id="bay-ngay"
            title="Bảy ngày gần nhất"
          >
            <WeeklyChart
              days={summary.lastSevenDays}
              goal={settings.dailyGoal}
            />
          </Block>

          <Block
            id="theo-che-do"
            title="Theo chế độ luyện tập"
            note="Mỗi từ được xếp vào chế độ khiến bạn trả lời sai gần đây nhất, nên đây là số từ đang vướng ở mỗi chế độ chứ không phải số lượt ôn."
          >
            {modeLoading ? (
              <p
                aria-live="polite"
                className="text-[0.875rem] text-ink-faint"
              >
                Đang đọc số liệu…
              </p>
            ) : troubledWords === 0 ? (
              <p
                className="text-[0.875rem] text-ink-faint"
              >
                Chưa có từ nào bị trả lời sai.
              </p>
            ) : (
              <ul
                className="m-0 list-none space-y-4 p-0"
              >
                {stats.map((stat) => (
                  <li
                    key={stat.mode}
                    className="min-w-0"
                  >
                    <ProgressBar
                      value={stat.words}
                      max={troubledWords}
                      label={MODE_LABELS[stat.mode]}
                      hint={`${stat.words} từ`}
                      tone="cinnabar"
                    />
                  </li>
                ))}
              </ul>
            )}
          </Block>

          <Block
            id="tu-hay-sai"
            title="Từ hay sai"
            note="Sắp theo số lần trả lời sai, kèm lỗi gần nhất để bạn biết mình nhầm ở đâu."
          >
            <TroubleWords
              limit={20}
              showLastMistake
              refreshToken={refreshToken}
              emptyMessage="Chưa có từ nào bị trả lời sai."
            />
          </Block>
        </>
      )}

      <Block
        id="sao-luu"
        title="Sao lưu và đặt lại"
        note="Tiến độ chỉ nằm trong máy này. Xoá dữ liệu trình duyệt là mất, nên hãy tải tệp sao lưu trước khi đổi máy."
      >
        <div
          className="min-w-0 space-y-5"
        >
          <div
            className="min-w-0"
          >
            <p
              className="text-[0.875rem] font-medium text-ink"
            >
              Xuất tiến độ
            </p>
            <div
              className="mt-2 flex flex-wrap items-center space-x-3"
            >
              <Button
                variant="secondary"
                icon="chart"
                disabled={busy}
                onClick={() => void handleExport()}
              >
                Tạo tệp sao lưu
              </Button>
              {backup !== null ? (
                <a
                  href={backup.url}
                  download={backup.name}
                  className="tap inline-flex items-center justify-center border border-teal/40 bg-teal-soft px-4 py-2.5 text-[0.9375rem] font-medium text-teal-ink no-underline rounded-[0.375rem]"
                >
                  {`Tải ${backup.name}`}
                </a>
              ) : null}
            </div>
          </div>

          <div
            className="min-w-0 border-t border-line pt-5"
          >
            <label
              htmlFor={fileInputId}
              className="block text-[0.875rem] font-medium text-ink"
            >
              Nạp lại từ tệp
            </label>
            <p
              className="mt-1 text-[0.8125rem] leading-relaxed text-ink-faint"
            >
              Nạp tệp .json đã xuất trước đó. Toàn bộ tiến độ hiện tại sẽ được thay bằng nội dung
              trong tệp.
            </p>
            <input
              id={fileInputId}
              type="file"
              accept="application/json,.json"
              disabled={busy}
              onChange={onFileChange}
              className="mt-2 block w-full max-w-[26rem] text-[0.875rem] text-ink-soft file:mr-3 file:border file:border-line-strong file:bg-surface file:px-4 file:py-3 file:text-[0.875rem] file:font-medium file:text-ink file:rounded-[0.375rem]"
            />
          </div>

          <div
            className="min-w-0 border-t border-line pt-5"
          >
            <p
              className="text-[0.875rem] font-medium text-ink"
            >
              Đặt lại tiến độ
            </p>
            <p
              className="mt-1 text-[0.8125rem] leading-relaxed text-ink-faint"
            >
              Xoá hết thẻ, lịch sử ôn và thống kê ngày. Cài đặt của bạn được giữ lại.
            </p>
            <div
              className="mt-2"
            >
              <Button
                variant="danger"
                disabled={busy}
                onClick={() => setConfirmOpen(true)}
              >
                Đặt lại tiến độ
              </Button>
            </div>
          </div>
        </div>
      </Block>

      <BottomSheet
        open={confirmOpen}
        title="Xoá toàn bộ tiến độ?"
        description="Không thể hoàn tác."
        onClose={() => setConfirmOpen(false)}
      >
        <p
          className="text-[0.875rem] leading-relaxed text-ink-soft"
        >
          Toàn bộ thẻ ghi nhớ, lịch sử ôn và thống kê ngày sẽ bị xoá. Nếu còn muốn giữ, hãy đóng hộp
          này và tạo tệp sao lưu trước.
        </p>
        <div
          className="mt-5 space-y-2"
        >
          <Button
            variant="danger"
            size="lg"
            block
            disabled={busy}
            onClick={() => void handleReset()}
          >
            Xoá toàn bộ tiến độ
          </Button>
          <Button
            variant="ghost"
            size="lg"
            block
            onClick={() => setConfirmOpen(false)}
          >
            Huỷ
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}

export default ProgressPage;
