/**
 * Thử lại một lượt gọi máy chủ trong lúc máy chủ đang thức dậy.
 *
 * Máy chủ miễn phí (Render) ngủ sau ít phút không ai gọi. Lúc dậy, request đầu
 * tiên có thể treo tới cả phút, hoặc bị proxy trả 502/503/504, hoặc rớt hẳn
 * (lỗi mạng). Cả ba đều là chuyện tạm thời: vài giây sau gọi lại là được. Nếu
 * mỗi lần như vậy đều hiện lỗi và bắt người học bấm "Thử lại" thì họ lại than
 * "lâu lắm". Ở đây gọi lại tự động, thưa dần, tổng cộng khoảng hai phút — quá
 * thời gian Render cần để dậy — rồi mới chịu thua.
 *
 * Chỉ thử lại lỗi TẠM THỜI. Lỗi nghiệp vụ (400, 403, 404, 500…) là câu trả lời
 * thật của máy chủ, ném ra ngay để giao diện nói với người học.
 *
 * Không phụ thuộc React; hook và kiểm thử thuần đều dùng được.
 */
import { ApiError } from './client.ts';

/**
 * Khoảng chờ (ms) trước mỗi lần thử lại. Dày lúc đầu vì máy chủ hay dậy trong
 * vài giây đầu; sau đó cứ 15 giây một lần để không dội máy chủ. Tổng ≈ 2 phút.
 */
export const RETRY_DELAYS_MS: readonly number[] = [
  2_000, 3_000, 5_000, 8_000, 12_000, 15_000, 15_000, 15_000, 15_000, 15_000, 15_000,
];

/** Lỗi tạm thời — máy chủ đang dậy hoặc mạng chập chờn — đáng thử lại. */
export function isTransientError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return (
      error.isNetworkError || error.status === 502 || error.status === 503 || error.status === 504
    );
  }
  // `fetch` thô ném TypeError khi không tới được máy chủ; giữ nhánh này cho
  // những chỗ chưa đi qua `apiFetch`.
  return error instanceof TypeError;
}

function isAbortError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { name?: unknown }).name === 'AbortError';
}

function abortError(): Error {
  return new DOMException('Đã huỷ', 'AbortError');
}

/** Chờ `ms` mili giây; huỷ giữa chừng thì từ chối bằng `AbortError` để vòng thử lại dừng ngay. */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }
    const onAbort = (): void => {
      clearTimeout(timer);
      reject(abortError());
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export interface RetryOptions {
  /** Huỷ thì dừng ngay cả khi đang chờ giữa hai lần thử. */
  signal?: AbortSignal;
  /** Gọi trước mỗi lần thử lại: `attempt` là số lần đã thất bại (từ 1). */
  onRetry?: (attempt: number, error: unknown) => void;
  /** Lịch chờ riêng; kiểm thử dùng để không phải đợi thật. */
  delays?: readonly number[];
}

/**
 * Chạy `task`; thất bại vì lỗi tạm thời thì chờ rồi chạy lại theo `delays`.
 *
 * Ném ra lỗi cuối cùng khi hết lượt, gặp lỗi không tạm thời, hoặc bị huỷ.
 * `task` nhận lại `signal` để chính request đang bay cũng bị huỷ theo.
 */
export async function withRetry<T>(
  task: (signal?: AbortSignal) => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const delays = options.delays ?? RETRY_DELAYS_MS;
  for (let failures = 0; ; failures += 1) {
    try {
      return await task(options.signal);
    } catch (error: unknown) {
      if (
        isAbortError(error) ||
        options.signal?.aborted ||
        !isTransientError(error) ||
        failures >= delays.length
      ) {
        throw error;
      }
      options.onRetry?.(failures + 1, error);
      await sleep(delays[failures], options.signal);
    }
  }
}
