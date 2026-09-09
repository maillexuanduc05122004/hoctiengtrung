import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ProgressBar } from '../../components/ui/Feedback.tsx';
import { LiveMessage } from '../../components/ui/LiveMessage.tsx';
import { Icon } from '../../components/ui/Icon.tsx';
import type { StudyMode } from '../../types/study.ts';
import { ModeSwitch } from './ModeSwitch.tsx';

export interface StudyHeaderProps {
  title: string;
  done: number;
  total: number;
  /** Chế độ đang mở, để vẽ hàng đổi cách luyện. */
  mode: StudyMode;
  /**
   * Nguồn từ của phiên, viết cho người đọc hiểu ngay: "Từ đã lưu · 20 trong 63".
   * Bấm vào là mở bảng tuỳ chọn — trước đây lối vào duy nhất là một nút bánh
   * răng không nhãn, nên gần như không ai tìm ra.
   */
  source: string;
  onEditSource?: () => void;
  /** Có giá trị khi đang luyện theo một buổi: tên buổi trở thành đường về buổi đó. */
  lessonId?: string;
  /** Chuỗi truy vấn của phiên, để hàng đổi cách luyện mang theo đúng tập từ này. */
  sessionQuery: string;
  /** Các nút phụ của phiên học, ví dụ nút lưu từ. */
  right?: ReactNode;
  /** Câu báo ngắn cho vùng aria-live, ví dụ "Đã lưu 好 vào sổ tay". */
  message?: string;
  /** Tăng sau mỗi lần báo, để câu giống câu trước vẫn được đọc lại. */
  messageToken?: number;
}

/** Tiêu đề phiên học kèm thanh tiến độ, luôn cho biết còn bao nhiêu từ nữa. */
export function StudyHeader({
  title,
  done,
  total,
  mode,
  source,
  onEditSource,
  lessonId,
  sessionQuery,
  right,
  message,
  messageToken = 0,
}: StudyHeaderProps) {
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
          <div
            className="mt-1 flex min-w-0 flex-wrap items-center"
          >
            {onEditSource !== undefined ? (
              <button
                type="button"
                onClick={onEditSource}
                className="tap -ml-1.5 inline-flex min-w-0 items-center rounded-[0.375rem] px-1.5 text-left text-[0.8125rem] font-medium text-ink-soft transition-colors duration-150 hover:bg-sunken hover:text-ink"
              >
                <span
                  className="min-w-0 break-words"
                >
                  {source}
                </span>
                <span
                  aria-hidden="true"
                  className="ml-1 shrink-0"
                >
                  <Icon name="chevron-down" size={0.875} />
                </span>
                <span
                  className="sr-only"
                >
                  Đổi nguồn từ của phiên học
                </span>
              </button>
            ) : (
              <span
                className="min-w-0 break-words text-[0.8125rem] text-ink-faint"
              >
                {source}
              </span>
            )}
            {lessonId !== undefined && lessonId !== '' ? (
              <Link
                to={`/buoi-hoc/${encodeURIComponent(lessonId)}`}
                className="tap ml-1 inline-flex items-center px-1.5 text-[0.8125rem] text-ink-soft underline underline-offset-2 hover:text-ink"
              >
                Mở buổi học
              </Link>
            ) : null}
          </div>
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
        <ModeSwitch current={mode} sessionQuery={sessionQuery} />
      </div>

      <div
        className="mt-3"
      >
        {/*
          Tiến độ tính theo số thẻ đã đi qua, kể cả thẻ bỏ qua, nên thanh này
          luôn khớp với vị trí thẻ đang hiện thay vì đứng im mỗi lần bỏ qua.
        */}
        <ProgressBar
          value={done}
          max={total}
          label="Tiến độ phiên"
          hint={`${done}/${total} thẻ`}
          tone="teal"
        />
      </div>

      {message !== undefined ? (
        <div
          className="mt-2"
        >
          <LiveMessage message={message} token={messageToken} />
        </div>
      ) : null}
    </header>
  );
}
