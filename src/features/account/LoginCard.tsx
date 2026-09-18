/**
 * Ô đăng nhập nhỏ, nhúng được vào bất kỳ trang nào cần máy chủ.
 *
 * Không có trang đăng nhập riêng: người học chỉ gặp ô này ngay tại chỗ họ cần
 * (trang "Câu của tôi" và mục Tài khoản trong Cài đặt), đăng nhập xong thì nội
 * dung hiện ra tại chỗ, không chuyển trang. Máy chủ báo lỗi bằng tiếng Việt
 * không dấu nên các lỗi hay gặp được dịch lại ở đây thay vì hiện nguyên văn.
 *
 * Máy chủ chỉ có hai tài khoản dựng sẵn (`accounts.ts`), nên bên dưới biểu mẫu
 * liệt kê luôn cả hai kèm mật khẩu và một nút vào bằng một cú bấm. Biểu mẫu
 * chỉ còn cho trường hợp gõ tài khoản khác; ô đầu nhận cả email lẫn tên đăng
 * nhập vì máy chủ chấp nhận cả hai.
 */
import { useId, useState, type FormEvent } from 'react';
import { Button, IconButton } from '../../components/ui/Button.tsx';
import { Notice } from '../../components/ui/Feedback.tsx';
import { useAuth } from '../../hooks/useAuth.ts';
import { ACCOUNTS, type Account } from './accounts.ts';
import { describeLoginError } from './login-error.ts';

export interface LoginCardProps {
  title?: string;
  description?: string;
}

/** Mật khẩu ngắn nhất máy chủ chấp nhận; chặn ở máy để khỏi gửi vô ích. */
const MIN_PASSWORD_LENGTH = 4;

/** Thứ tự hiện: tài khoản của chủ trang trước, khách sau. */
const QUICK_ACCOUNTS: readonly Account[] = [ACCOUNTS.owner, ACCOUNTS.guest];

/** Yêu cầu nào đang chạy: biểu mẫu, hay nút một-bấm của tài khoản nào. */
type Pending = 'form' | Account['username'];

export function LoginCard({ title = 'Đăng nhập', description }: LoginCardProps) {
  const { login } = useAuth();
  const id = useId();
  const titleId = `${id}-tieu-de`;
  const accountId = `${id}-tai-khoan`;
  const accountHintId = `${id}-tai-khoan-goi-y`;
  const passwordId = `${id}-mat-khau`;
  const quickTitleId = `${id}-co-san`;

  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = pending !== null;

  const signIn = async (who: Pending, username: string, secret: string): Promise<void> => {
    if (busy) return;
    setPending(who);
    setError(null);
    try {
      await login(username, secret);
      setPassword('');
    } catch (err: unknown) {
      setError(describeLoginError(err));
    } finally {
      setPending(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (busy) return;
    const trimmedAccount = account.trim();
    if (trimmedAccount === '' || password === '') {
      setError('Nhập tài khoản và mật khẩu.');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`);
      return;
    }
    await signIn('form', trimmedAccount, password);
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
            htmlFor={accountId}
            className="mb-1.5 block text-[0.8125rem] font-medium text-ink-soft"
          >
            Tài khoản
          </label>
          <input
            id={accountId}
            type="text"
            name="username"
            value={account}
            placeholder="2222"
            autoComplete="username"
            autoCapitalize="off"
            spellCheck={false}
            aria-describedby={accountHintId}
            disabled={busy}
            onChange={(event) => setAccount(event.target.value)}
            className="tap w-full min-w-0 rounded-[0.375rem] border border-line-strong bg-surface px-3 py-2.5 text-ink placeholder:text-ink-faint disabled:opacity-45"
          />
          <p
            id={accountHintId}
            className="mt-1 text-[0.75rem] text-ink-faint"
          >
            email hoặc tên đăng nhập
          </p>
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
              disabled={busy}
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

        <Button
          type="submit"
          variant="primary"
          block
          disabled={busy}
        >
          {pending === 'form' ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </Button>
      </form>

      {/* Một vùng báo lỗi chung cho cả biểu mẫu lẫn các nút một-bấm bên dưới. */}
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

      <div
        role="group"
        aria-labelledby={quickTitleId}
        className="mt-5 border-t border-line pt-4"
      >
        <h3
          id={quickTitleId}
          className="text-[0.875rem] font-semibold text-ink"
        >
          Tài khoản có sẵn
        </h3>
        <ul
          className="mt-1 min-w-0"
        >
          {QUICK_ACCOUNTS.map((item) => (
            <li
              key={item.username}
              className="flex min-w-0 flex-wrap items-center justify-between py-2"
            >
              <div
                className="min-w-0 pr-3"
              >
                <p
                  className="text-[0.875rem] font-medium text-ink"
                >
                  {item.label}
                </p>
                <p
                  className="mt-0.5 text-[0.8125rem] text-ink-faint"
                >
                  tài khoản{' '}
                  <code
                    className="font-mono text-ink-soft"
                  >
                    {item.username}
                  </code>{' '}
                  · mật khẩu{' '}
                  <code
                    className="font-mono text-ink-soft"
                  >
                    {item.password}
                  </code>
                </p>
              </div>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => void signIn(item.username, item.username, item.password)}
                className="my-1"
              >
                {pending === item.username ? 'Đang đăng nhập…' : `Đăng nhập ${item.username}`}
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
