import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon, type IconName } from './Icon.tsx';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'quiet';
export type ButtonSize = 'md' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-cinnabar text-paper border-cinnabar hover:bg-cinnabar-ink active:bg-cinnabar-ink',
  secondary: 'bg-surface text-ink border-line-strong hover:border-ink-faint active:bg-sunken',
  ghost: 'bg-transparent text-ink-soft border-transparent hover:bg-sunken active:bg-sunken',
  danger: 'bg-transparent text-wrong border-wrong hover:bg-cinnabar-soft',
  quiet: 'bg-sunken text-ink border-transparent hover:border-line-strong',
};

const SIZES: Record<ButtonSize, string> = {
  md: 'px-3.5 py-2 text-[0.9375rem]',
  lg: 'px-5 py-3 text-base',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  /** Đặt nút chiếm hết chiều ngang, dùng nhiều trên điện thoại. */
  block?: boolean;
  children?: ReactNode;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  block = false,
  className = '',
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        'tap inline-flex items-center justify-center border font-medium transition-colors duration-150',
        'rounded-[0.375rem] disabled:opacity-45 disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        block ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {icon ? (
        <span
          className={children ? 'mr-2 shrink-0' : 'shrink-0'}
        >
          <Icon name={icon} size={1.125} />
        </span>
      ) : null}
      {children}
    </button>
  );
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  /** Bắt buộc: nút chỉ có biểu tượng phải có nhãn cho trình đọc màn hình. */
  label: string;
  variant?: ButtonVariant;
  iconSize?: number;
  /** Hiện trạng bật/tắt cho các nút chuyển trạng thái. */
  pressed?: boolean;
}

export function IconButton({
  icon,
  label,
  variant = 'ghost',
  iconSize = 1.25,
  pressed,
  className = '',
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      className={[
        'tap inline-flex items-center justify-center border transition-colors duration-150',
        'rounded-[0.375rem] disabled:opacity-45 disabled:cursor-not-allowed',
        pressed ? VARIANTS.quiet : VARIANTS[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      <Icon name={icon} size={iconSize} />
    </button>
  );
}
