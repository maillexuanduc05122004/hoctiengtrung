import { useEffect, useId, useRef, type ReactNode } from 'react';
import { IconButton } from './Button.tsx';

export interface BottomSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Mô tả phụ dưới tiêu đề. */
  description?: string;
}

/**
 * Tấm trượt lên từ đáy màn hình, dùng cho hộp tra từ.
 *
 * Trên máy tính nó hiện ra như một hộp thoại giữa màn hình. Bẫy tiêu điểm bàn
 * phím trong tấm này để người dùng bàn phím không lạc ra nền phía sau.
 */
export function BottomSheet({ open, title, description, onClose, children }: BottomSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusable = panelRef.current?.querySelector<HTMLElement>(
      'input, button, [href], select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    focusable?.focus();

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = panelRef.current?.querySelectorAll<HTMLElement>(
        'input:not([disabled]), button:not([disabled]), [href], select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!items || items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      previouslyFocused.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed top-0 right-0 bottom-0 left-0 z-50 flex items-end justify-center xsm:items-end"
    >
      <button
        type="button"
        aria-label="Đóng"
        onClick={onClose}
        className="absolute top-0 right-0 bottom-0 left-0 w-full cursor-default bg-ink/35"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="relative flex max-h-[85dvh] w-full max-w-[34rem] flex-col border-t border-line bg-surface shadow-[0_-0.25rem_1.5rem_rgba(32,29,24,0.14)] xsm:rounded-t-[0.75rem]"
      >
        <div
          className="flex shrink-0 items-start justify-between border-b border-line px-4 py-3"
        >
          <div
            className="min-w-0 pr-3"
          >
            <h2
              id={titleId}
              className="text-base font-semibold text-ink"
            >
              {title}
            </h2>
            {description ? (
              <p
                id={descriptionId}
                className="mt-0.5 text-[0.8125rem] text-ink-faint"
              >
                {description}
              </p>
            ) : null}
          </div>
          <IconButton
            icon="close"
            label="Đóng"
            onClick={onClose}
          />
        </div>
        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
