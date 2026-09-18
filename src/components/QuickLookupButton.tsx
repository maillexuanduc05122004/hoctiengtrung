/**
 * Nút "Tra từ nhanh" trên thanh điều hướng, mở hộp tra từ từ bất kỳ trang nào.
 *
 * Cùng một nút có hai hình thức, vì nó đứng ở hai chỗ khác nhau của khung ứng
 * dụng: một biểu tượng trần trong thanh tiêu đề điện thoại, và một dòng có nhãn
 * trong cột trái máy tính. Cả hai dùng đúng lớp của các NavLink bên cạnh để
 * trông như một mục điều hướng chứ không phải một nút lạc vào.
 *
 * Phím tắt Ctrl/⌘ + K mở hộp từ mọi nơi, nhưng KHÔNG bắt khi đang gõ trong ô
 * nhập: người học đang gõ đáp án mà bị bật hộp lên là mất chữ đang gõ.
 *
 * Hộp được vẽ qua portal vào `document.body`. Lý do: hai nơi đặt nút đều bị
 * CSS ẩn ở kích thước màn hình kia (cột trái `xsm:hidden`, thanh tiêu đề
 * `hidden xsm:flex`), mà một phần tử `fixed` nằm trong tổ tiên `display: none`
 * thì cũng không hiện. Vẽ ra ngoài thì nút nào mở cũng thấy hộp.
 */
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './ui/Icon.tsx';

/**
 * Hộp tra từ chỉ được tải khi mở lần đầu: nút này nằm trong khung ứng dụng nên
 * có mặt ở mọi trang, kéo cả hộp vào gói khởi động là bắt mọi lần mở app tải
 * thứ chỉ vài lần bấm mới cần.
 */
const DictionarySheet = lazy(() =>
  import('../features/dictionary/DictionarySheet.tsx').then((module) => ({
    default: module.DictionarySheet,
  })),
);

export interface QuickLookupButtonProps {
  /** `header`: biểu tượng trần trên điện thoại. `sidebar`: dòng có nhãn trong cột trái. */
  variant: 'header' | 'sidebar';
}

/** Nhãn đọc màn hình của nút. */
export const QUICK_LOOKUP_LABEL = 'Tra từ nhanh';

/** Chú thích khi rê chuột, nói rõ hộp tra được cả hai chiều. */
export const QUICK_LOOKUP_TITLE = 'Tra từ Anh ↔ Trung';

/**
 * Phím tắt không được cướp phím của người đang gõ.
 *
 * Kiểm tra cả `contentEditable` vì một số bộ gõ và ô soạn thảo không phải là
 * `<input>`; và bỏ qua khi tiêu điểm đang nằm trong một hộp thoại khác — mở
 * chồng hai hộp lên nhau chỉ làm bẫy tiêu điểm của cả hai rối tung.
 */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target instanceof HTMLElement && target.isContentEditable) return true;
  return target.closest('[contenteditable=""], [contenteditable="true"], [role="dialog"]') !== null;
}

/** Ctrl + K trên Windows/Linux, ⌘ + K trên máy Apple; không kèm Alt hay Shift. */
function isQuickLookupShortcut(event: KeyboardEvent): boolean {
  if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) return false;
  return event.key === 'k' || event.key === 'K';
}

/** Gợi ý phím tắt hiện cạnh nhãn trong cột trái, theo bàn phím của máy đang dùng. */
function shortcutHint(): string {
  if (typeof navigator === 'undefined') return 'Ctrl K';
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform) ? '⌘ K' : 'Ctrl K';
}

export function QuickLookupButton({ variant }: QuickLookupButtonProps) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      /*
        Khung ứng dụng đặt hai bản của nút này (điện thoại và máy tính) nên cùng
        lúc có hai bộ nghe phím. Bản nào bắt được trước thì đánh dấu
        `preventDefault`, bản còn lại thấy cờ đó và đứng yên — nhờ vậy chỉ mở
        đúng một hộp.
      */
      if (event.defaultPrevented) return;
      if (!isQuickLookupShortcut(event)) return;
      if (isTypingTarget(event.target)) return;
      event.preventDefault();
      setOpen(true);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  // Đóng là gỡ hẳn khỏi cây, để hộp không giữ liveQuery nào chạy ngầm khi không ai nhìn.
  const sheet = open
    ? createPortal(
        <Suspense fallback={null}>
          <DictionarySheet
            open
            onClose={close}
          />
        </Suspense>,
        document.body,
      )
    : null;

  if (variant === 'sidebar') {
    return (
      <>
        <button
          type="button"
          aria-label={QUICK_LOOKUP_LABEL}
          aria-haspopup="dialog"
          aria-expanded={open}
          title={QUICK_LOOKUP_TITLE}
          onClick={() => setOpen(true)}
          className={[
            'tap mt-0.5 flex w-full items-center rounded-[0.375rem] px-2 py-2 text-left text-[0.9375rem] no-underline transition-colors duration-150',
            open
              ? 'bg-sunken font-semibold text-ink'
              : 'font-medium text-ink-soft hover:bg-sunken hover:text-ink',
          ].join(' ')}
        >
          <span
            className="mr-2.5 shrink-0"
          >
            <Icon name="search" size={1.125} />
          </span>
          {QUICK_LOOKUP_LABEL}
          <kbd
            aria-hidden="true"
            className="ml-auto pl-2 font-sans text-[0.6875rem] font-medium tracking-wide text-ink-faint"
          >
            {shortcutHint()}
          </kbd>
        </button>
        {sheet}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        aria-label={QUICK_LOOKUP_LABEL}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={QUICK_LOOKUP_TITLE}
        onClick={() => setOpen(true)}
        className={[
          'tap inline-flex items-center justify-center rounded-[0.375rem] transition-colors duration-150',
          open ? 'text-cinnabar' : 'text-ink-faint hover:text-ink-soft',
        ].join(' ')}
      >
        <Icon name="search" size={1.1875} />
      </button>
      {sheet}
    </>
  );
}
