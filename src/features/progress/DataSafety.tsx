/**
 * Mức an toàn của dữ liệu học.
 *
 * Toàn bộ tiến độ nằm trong IndexedDB của chính máy này. Mặc định trình duyệt
 * xếp kho đó vào loại "xoá được khi cần chỗ": máy sắp đầy là nó dọn, không hỏi
 * ai. Với một ứng dụng không có backend thì đó là mất trắng nhiều tháng học.
 *
 * Phần này nói thẳng tình trạng thật và đưa ra đúng hai việc người học làm được:
 * xin trình duyệt ghim kho lại, và tải một tệp sao lưu về máy. Không hứa hẹn gì
 * hơn những gì trình duyệt thật sự trả lời.
 */
import { useCallback, useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button.tsx';
import { Notice } from '../../components/ui/Feedback.tsx';
import {
  formatBytes,
  readStorageState,
  requestPersistentStorage,
  UNSUPPORTED_STORAGE,
  type StorageState,
} from '../../lib/storage/persist.ts';

export interface DataSafetyProps {
  /** Lần tạo tệp sao lưu gần nhất, `null` khi chưa lần nào. */
  lastBackupAt: number | null;
  /** Có tiến độ đáng để mất hay không; người mới chưa cần nhắc gì. */
  hasProgress: boolean;
}

/** Quá số ngày này mà chưa sao lưu thì nhắc lại. Một tháng là một khối lượng học đáng kể. */
const BACKUP_STALE_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

function daysSince(at: number, now: number): number {
  return Math.floor((now - at) / DAY_MS);
}

export function DataSafety({ lastBackupAt, hasProgress }: DataSafetyProps) {
  const [storage, setStorage] = useState<StorageState>(UNSUPPORTED_STORAGE);
  const [asking, setAsking] = useState(false);
  const [asked, setAsked] = useState(false);
  // Chốt "hôm nay" một lần lúc đọc kho, không đọc đồng hồ giữa lúc vẽ.
  const [now, setNow] = useState(0);

  useEffect(() => {
    let active = true;
    void readStorageState().then((state) => {
      if (!active) return;
      setStorage(state);
      setNow(Date.now());
    });
    return () => {
      active = false;
    };
  }, []);

  const handleRequest = useCallback(async (): Promise<void> => {
    setAsking(true);
    try {
      // Chỉ gọi từ một cú bấm thật: vài trình duyệt bỏ qua lời xin không đến từ
      // thao tác người dùng, và Firefox hiện hộp thoại xin quyền.
      setStorage(await requestPersistentStorage());
      setAsked(true);
    } finally {
      setAsking(false);
    }
  }, []);

  const staleBackup =
    hasProgress &&
    (lastBackupAt === null || (now > 0 && daysSince(lastBackupAt, now) >= BACKUP_STALE_DAYS));

  return (
    <div
      className="min-w-0 space-y-4"
    >
      <div
        className="min-w-0"
      >
        <p
          className="text-[0.875rem] font-medium text-ink"
        >
          Kho dữ liệu trên máy này
        </p>

        {!storage.supported ? (
          <p
            className="mt-1 text-[0.8125rem] leading-relaxed text-ink-faint"
          >
            Trình duyệt này không cho biết kho dữ liệu có được ghim hay không. Hãy tải tệp sao lưu
            đều đặn.
          </p>
        ) : storage.persisted ? (
          <p
            className="mt-1 text-[0.8125rem] leading-relaxed text-ink-faint"
          >
            Đã ghim. Trình duyệt sẽ không tự xoá tiến độ của bạn để lấy chỗ trống nữa; chỉ bạn xoá
            được, bằng cách xoá dữ liệu trang trong cài đặt trình duyệt.
            {storage.usage !== null ? ` Đang dùng ${formatBytes(storage.usage)}.` : ''}
          </p>
        ) : (
          <>
            <p
              className="mt-1 text-[0.8125rem] leading-relaxed text-ink-faint"
            >
              Chưa ghim. Khi máy sắp hết chỗ, trình duyệt được phép xoá toàn bộ tiến độ của bạn mà
              không hỏi.
              {storage.usage !== null ? ` Đang dùng ${formatBytes(storage.usage)}.` : ''}
            </p>
            <div
              className="mt-2"
            >
              <Button
                variant="secondary"
                icon="check"
                disabled={asking}
                onClick={() => void handleRequest()}
              >
                Xin ghim kho dữ liệu
              </Button>
            </div>
            {asked ? (
              <p
                role="status"
                className="mt-2 text-[0.8125rem] leading-relaxed text-ink-soft"
              >
                Trình duyệt chưa đồng ý ghim. Chrome và Edge thường chỉ ghim khi bạn đã dùng trang
                một thời gian hoặc đã cài ứng dụng về máy; trong lúc chờ, tệp sao lưu là cách chắc
                chắn nhất.
              </p>
            ) : null}
          </>
        )}
      </div>

      {staleBackup ? (
        <Notice
          tone="warn"
          title={lastBackupAt === null ? 'Bạn chưa sao lưu lần nào' : 'Bản sao lưu đã cũ'}
        >
          {lastBackupAt === null
            ? 'Tiến độ chỉ nằm trên máy này. Tạo một tệp sao lưu để không mất khi đổi máy hoặc xoá dữ liệu trình duyệt.'
            : `Lần sao lưu gần nhất cách đây ${daysSince(lastBackupAt, now)} ngày. Nên tạo tệp mới.`}
        </Notice>
      ) : null}

      {lastBackupAt !== null && !staleBackup && now > 0 ? (
        <p
          className="text-[0.8125rem] text-ink-faint"
        >
          {daysSince(lastBackupAt, now) === 0
            ? 'Đã sao lưu hôm nay.'
            : `Sao lưu gần nhất: ${daysSince(lastBackupAt, now)} ngày trước.`}
        </p>
      ) : null}
    </div>
  );
}
