/**
 * Trang không tìm thấy.
 *
 * Ngắn gọn và chỉ có một lối ra rõ ràng: người lạc đường không cần đọc thêm gì,
 * chỉ cần một đường về trang chủ đủ to để bấm bằng ngón cái.
 */
import { Link } from 'react-router';
import { EmptyState } from '../components/ui/Feedback.tsx';

export function NotFoundPage() {
  return (
    <div
      className="mx-auto w-full max-w-[34rem] min-w-0"
    >
      <EmptyState
        icon="search"
        title="Không tìm thấy trang này"
        description="Đường dẫn có thể đã cũ hoặc bị gõ sai."
        action={
          <Link
            to="/"
            className="tap inline-flex items-center justify-center rounded-[0.375rem] border border-cinnabar bg-cinnabar px-5 py-3 font-medium text-paper no-underline transition-colors duration-150 hover:bg-cinnabar-ink"
          >
            Về trang chủ
          </Link>
        }
      />
    </div>
  );
}

export default NotFoundPage;
