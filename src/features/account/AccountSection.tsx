/**
 * Mục "Tài khoản" trong trang Cài đặt.
 *
 * Đang đăng nhập thì hiện tên, email và nút đăng xuất; chưa thì nhúng thẳng ô
 * đăng nhập. Không có gì khác: hồ sơ, đổi mật khẩu đều không cần cho một người
 * dùng duy nhất.
 */
import { useState } from 'react';
import { Button } from '../../components/ui/Button.tsx';
import { Chip } from '../../components/ui/Controls.tsx';
import { Notice } from '../../components/ui/Feedback.tsx';
import { useAuth } from '../../hooks/useAuth.ts';
import { describeApiError } from '../../lib/api/client.ts';
import { LoginCard } from './LoginCard.tsx';

const LOGIN_DESCRIPTION =
  'Đăng nhập để dùng phần Câu của tôi: từ đã học và câu luyện nghe được lưu trên máy chủ. ' +
  'Mọi phần khác vẫn chạy ngoại tuyến, không cần tài khoản.';

export function AccountSection() {
  const { user, status, logout, isAdmin } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === 'anonymous' || user === null) {
    return (
      <LoginCard
        description={LOGIN_DESCRIPTION}
      />
    );
  }

  const handleLogout = async (): Promise<void> => {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      await logout();
    } catch (err: unknown) {
      setError(describeApiError(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <div
      className="min-w-0"
    >
      <div
        className="flex min-w-0 flex-wrap items-center justify-between border border-line rounded-[0.375rem] bg-surface px-4 py-3"
      >
        <div
          className="min-w-0 pr-4"
        >
          <p
            className="flex min-w-0 flex-wrap items-center text-[0.9375rem] font-medium text-ink"
          >
            <span
              className="mr-2 break-words"
            >
              {user.displayName}
            </span>
            {isAdmin ? (
              <Chip
                tone="teal"
              >
                Quản trị viên
              </Chip>
            ) : null}
          </p>
          <p
            className="mt-0.5 break-words text-[0.8125rem] text-ink-faint"
          >
            {user.email}
          </p>
        </div>
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() => void handleLogout()}
          className="my-1"
        >
          {pending ? 'Đang đăng xuất…' : 'Đăng xuất'}
        </Button>
      </div>
      <div
        aria-live="polite"
      >
        {error !== null ? (
          <div
            className="mt-3"
          >
            <Notice
              tone="error"
            >
              {error}
            </Notice>
          </div>
        ) : null}
      </div>
    </div>
  );
}
