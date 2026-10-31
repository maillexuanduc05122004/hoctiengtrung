/**
 * Hỏi máy chủ một lần xem AI chấm bài (dịch câu, phát âm) có bật không.
 *
 * Gọi ngay lúc mở trang cũng là cách đánh thức máy chủ miễn phí đang ngủ: tới
 * lúc người học dịch xong câu đầu hay đọc xong một câu thì máy chủ đã tỉnh.
 * Máy chủ bản cũ không trả `tutorEnabled` thì trạng thái là `unknown` — vẫn
 * gọi thử, lỗi thì báo đúng lỗi.
 */
import { useEffect, useState } from 'react';
import { describeApiError } from '../../lib/api/client.ts';
import { aiStatus } from '../../lib/api/endpoints.ts';
import { withRetry } from '../../lib/api/retry.ts';

export type TutorStatus =
  | { state: 'checking' }
  | { state: 'ready' }
  | { state: 'unknown' }
  | { state: 'off'; reason: string };

export function useTutorStatus(): TutorStatus {
  const [status, setStatus] = useState<TutorStatus>({ state: 'checking' });

  useEffect(() => {
    const controller = new AbortController();
    withRetry((signal) => aiStatus(signal), { signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return;
        if (result.tutorEnabled === true) setStatus({ state: 'ready' });
        else if (result.tutorEnabled === false || !result.enabled) {
          setStatus({
            state: 'off',
            reason: result.reason ?? 'Máy chủ chưa bật AI chấm bài (cần GEMINI_API_KEY).',
          });
        } else setStatus({ state: 'unknown' });
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setStatus({ state: 'off', reason: describeApiError(cause) });
      });
    return () => controller.abort();
  }, []);

  return status;
}
