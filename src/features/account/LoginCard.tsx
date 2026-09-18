/**
 * Ô đăng nhập nhỏ, nhúng được vào bất kỳ trang nào cần máy chủ.
 *
 * Không có trang đăng nhập riêng: người học chỉ gặp ô này ngay tại chỗ họ cần
 * (trang "Câu của tôi" và mục Tài khoản trong Cài đặt), đăng nhập xong thì nội
 * dung hiện ra tại chỗ, không chuyển trang. Máy chủ báo lỗi bằng tiếng Việt
 * không dấu nên các lỗi hay gặp được dịch lại ở đây thay vì hiện nguyên văn.
 */
import { useId, useState, type FormEvent } from 'react';
import { Button, IconButton } from '../../components/ui/Button.tsx';
import { Notice } from '../../components/ui/Feedback.tsx';
import { useAuth } from '../../hooks/useAuth.ts';
import { describeLoginError } from './login-error.ts';

export interface LoginCardProps {
  title?: string;
  description?: string;
}

/** Tài khoản có sẵn khi chạy máy chủ ở máy; chỉ nhắc trong bản phát triển. */
const DEV_ACCOUNT = { email: 'admin@hoctiengtrung.vn', password: 'Admin@123' };

export function LoginCard({ title = 'Đăng nhập', description }: LoginCardProps) {
  const { login } = useAuth();
  const id = useId();
  const titleId = `${id}-tieu-de`;
  const emailId = `${id}-email`;
  const passwordId = `${id}-mat-khau`;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (pending) return;
    const trimmedEmail = email.trim();
    if (trimmedEmail === '' || password === '') {
      setError('Nhập email và mật khẩu.');
      return;
    }
    setPending(true);
    setError(null);
    try {
      await login(trimmedEmail, password);
      setPassword('');
    } catch (err: unknown) {
      setError(describeLoginError(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <section
      aria-labelledby={titleId}
      className="w-full max-w-[26rem] min-w-0 border border-line rounded-[0.375rem] bg-surface p-4"
    >
      <h2
        id={titleId}
        className="text-[1rem] font-semibold tracking-tight text-ink"
      >
        {title}
      </h2>
      {description ? (
        <p
          className="mt-1 text-[0.875rem] leading-relaxed text-ink-faint"
        >
          {description}
        </p>
      ) : null}

      <form
        noValidate
        onSubmit={(event) => void handleSubmit(event)}
        className="mt-4 min-w-0"
      >
        <div
          className="mb-3"
        >
          <label
            htmlFor={emailId}
            className="mb-1.5 block text-[0.8125rem] font-medium text-ink-soft"
          >
            Email
          </label>
          <input
            id={emailId}
            type="email"
            name="email"
            value={email}
            autoComplete="email"
            inputMode="email"
            autoCapitalize="off"
            spellCheck={false}
            disabled={pending}
            onChange={(event) => setEmail(event.target.value)}
            className="tap w-full min-w-0 rounded-[0.375rem] border border-line-strong bg-surface px-3 py-2.5 text-ink placeholder:text-ink-faint disabled:opacity-45"
          />
        </div>

        <div
          className="mb-4"
        >
          <label
            htmlFor={passwordId}
            className="mb-1.5 block text-[0.8125rem] font-medium text-ink-soft"
          >
            Mật khẩu
          </label>
          <div
            className="relative min-w-0"
          >
            <input
              id={passwordId}
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={password}
              autoComplete="current-password"
              disabled={pending}
              onChange={(event) => setPassword(event.target.value)}
              className="tap w-full min-w-0 rounded-[0.375rem] border border-line-strong bg-surface py-2.5 pr-12 pl-3 text-ink placeholder:text-ink-faint disabled:opacity-45"
            />
            <span
              className="absolute top-0 right-1 bottom-0 flex items-center"
            >
              <IconButton
                icon={showPassword ? 'eye-off' : 'eye'}
                label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                pressed={showPassword}
                iconSize={1.0625}
                onClick={() => setShowPassword((current) => !current)}
              />
            </span>
          </div>
        </div>

        <div
          aria-live="polite"
        >
          {error !== null ? (
            <div
              className="mb-3"
            >
              <Notice
                tone="error"
              >
                {error}
              </Notice>
            </div>
          ) : null}
        </div>

        <Button
          type="submit"
          variant="primary"
          block
          disabled={pending}
        >
          {pending ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </Button>

        {import.meta.env.DEV ? (
          <p
            className="mt-3 text-[0.8125rem] text-ink-faint"
          >
            Tài khoản có sẵn khi chạy máy chủ ở máy:{' '}
            <code
              className="font-mono"
            >
              {DEV_ACCOUNT.email}
            </code>{' '}
            /{' '}
            <code
              className="font-mono"
            >
              {DEV_ACCOUNT.password}
            </code>
          </p>
        ) : null}
      </form>
    </section>
  );
}
