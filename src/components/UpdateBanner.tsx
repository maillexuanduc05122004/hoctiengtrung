/**
 * Thanh báo "có bản mới" của ứng dụng cài đặt được (PWA).
 *
 * Service worker chạy ở chế độ `prompt` (xem `vite.config.ts`): bản mới tải
 * về xong thì CHỜ, không tự chiếm quyền giữa lúc người học đang làm bài. Cái
 * giá của chế độ đó là phải có ai đó bấm "Tải lại" — mà trước đây không nơi
 * nào gọi `onServiceWorkerUpdate`, nên tab hay ứng dụng đang mở cứ chạy bản cũ
 * mãi, sửa lỗi ở máy chủ xong người học vẫn thấy lỗi cũ trên điện thoại.
 * Thanh này là chỗ bấm đó.
 *
 * Vị trí: cố định ở góc dưới bên phải trên máy tính; trên điện thoại nằm NGAY
 * TRÊN thanh điều hướng dưới cùng (cao 3,5rem cộng vùng an toàn, xem
 * `AppShell`), nếu không nó che mất sáu nút điều hướng. Đóng chỉ ẩn tạm trong
 * phiên này; bản mới vẫn nằm chờ và sẽ được kích hoạt ở lần mở sau, hay khi
 * có bản mới nữa thì thanh lại hiện.
 */
import { useEffect, useState } from 'react';
import { onServiceWorkerUpdate } from '../lib/pwa/register.ts';
import { Button, IconButton } from './ui/Button.tsx';

export function UpdateBanner() {
  // Hàm kích hoạt bản mới do `register.ts` đưa sang; `null` là chưa có bản mới.
  const [apply, setApply] = useState<(() => void) | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(
    () =>
      onServiceWorkerUpdate((applyUpdate) => {
        // Bọc trong hàm vì `setState` nhận hàm là "hàm cập nhật", không phải giá trị.
        setApply(() => applyUpdate);
        // Bản mới nữa tới sau khi người học đã đóng thanh: hiện lại, vì đây là
        // bản khác chứ không phải nhắc lại chuyện cũ.
        setDismissed(false);
      }),
    [],
  );

  if (apply === null || dismissed) return null;

  return (
    <div
      role="status"
      className="fixed right-4 bottom-4 z-40 flex max-w-[26rem] items-center border border-line bg-surface px-3.5 py-2.5 rounded-[0.375rem] shadow-[0_0.25rem_1.5rem_rgba(32,29,24,0.14)] xsm:right-3 xsm:bottom-[calc(3.5rem+env(safe-area-inset-bottom)+0.75rem)] xsm:left-3 xsm:max-w-none"
    >
      <p
        className="min-w-0 flex-1 text-[0.9375rem] text-ink"
      >
        Có bản mới của ứng dụng
      </p>
      <span
        className="ml-3 shrink-0"
      >
        <Button
          variant="primary"
          icon="refresh"
          onClick={apply}
        >
          Tải lại
        </Button>
      </span>
      <span
        className="ml-1 shrink-0"
      >
        <IconButton
          icon="close"
          label="Đóng thông báo bản mới"
          iconSize={1}
          onClick={() => setDismissed(true)}
        />
      </span>
    </div>
  );
}
