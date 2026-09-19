/**
 * Vòng thử lại phải phân biệt được "máy chủ đang dậy" với "máy chủ trả lời
 * không" — nhầm chiều nào cũng hại: thử lại lỗi 403 là dội máy chủ vô ích và
 * giấu lỗi thật; không thử lại lỗi mạng là bắt người học bấm tay mỗi lần mở.
 */
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from './client.ts';
import { isTransientError, RETRY_DELAYS_MS, sleep, withRetry } from './retry.ts';

/** Lịch chờ 0 ms để test không phải đợi thật; số lượt vẫn đúng như lịch thật. */
const INSTANT = RETRY_DELAYS_MS.map(() => 0);

describe('isTransientError', () => {
  it('lỗi mạng và 502/503/504 là tạm thời', () => {
    expect(isTransientError(new ApiError(0))).toBe(true);
    expect(isTransientError(new ApiError(502))).toBe(true);
    expect(isTransientError(new ApiError(503))).toBe(true);
    expect(isTransientError(new ApiError(504))).toBe(true);
    expect(isTransientError(new TypeError('fetch failed'))).toBe(true);
  });

  it('lỗi nghiệp vụ và lỗi lạ thì không', () => {
    expect(isTransientError(new ApiError(400))).toBe(false);
    expect(isTransientError(new ApiError(403))).toBe(false);
    expect(isTransientError(new ApiError(404))).toBe(false);
    expect(isTransientError(new ApiError(500))).toBe(false);
    expect(isTransientError(new Error('x'))).toBe(false);
    expect(isTransientError('x')).toBe(false);
  });
});

describe('withRetry', () => {
  it('thành công ngay thì không chờ, không gọi onRetry', async () => {
    const onRetry = vi.fn();
    const task = vi.fn().mockResolvedValue('ok');
    await expect(withRetry(task, { delays: INSTANT, onRetry })).resolves.toBe('ok');
    expect(task).toHaveBeenCalledTimes(1);
    expect(onRetry).not.toHaveBeenCalled();
  });

  it('lỗi tạm thời thì gọi lại cho tới khi được, báo từng lần qua onRetry', async () => {
    const onRetry = vi.fn();
    const task = vi
      .fn()
      .mockRejectedValueOnce(new ApiError(0))
      .mockRejectedValueOnce(new ApiError(503))
      .mockResolvedValue('ok');
    await expect(withRetry(task, { delays: INSTANT, onRetry })).resolves.toBe('ok');
    expect(task).toHaveBeenCalledTimes(3);
    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenNthCalledWith(1, 1, expect.any(ApiError));
    expect(onRetry).toHaveBeenNthCalledWith(2, 2, expect.any(ApiError));
  });

  it('hết lượt thì ném lỗi cuối cùng; số lần gọi = số khoảng chờ + 1', async () => {
    const task = vi.fn().mockRejectedValue(new ApiError(0));
    await expect(withRetry(task, { delays: [0, 0, 0] })).rejects.toBeInstanceOf(ApiError);
    expect(task).toHaveBeenCalledTimes(4);
  });

  it('lỗi không tạm thời thì ném ngay, không gọi lại', async () => {
    const task = vi.fn().mockRejectedValue(new ApiError(403));
    await expect(withRetry(task, { delays: INSTANT })).rejects.toMatchObject({ status: 403 });
    expect(task).toHaveBeenCalledTimes(1);
  });

  it('huỷ trong lúc chờ thì dừng ngay và ném AbortError', async () => {
    vi.useFakeTimers();
    try {
      const controller = new AbortController();
      const task = vi.fn().mockRejectedValue(new ApiError(0));
      const run = withRetry(task, { delays: [60_000], signal: controller.signal });
      const outcome = run.then(
        () => 'resolved',
        (error: unknown) => (error as Error).name,
      );
      await vi.advanceTimersByTimeAsync(0);
      controller.abort();
      await expect(outcome).resolves.toBe('AbortError');
      expect(task).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('task nhận đúng signal để huỷ cả request đang bay', async () => {
    const controller = new AbortController();
    const task = vi.fn().mockResolvedValue('ok');
    await withRetry(task, { delays: INSTANT, signal: controller.signal });
    expect(task).toHaveBeenCalledWith(controller.signal);
  });

  it('lịch chờ mặc định kéo dài khoảng hai phút', () => {
    const total = RETRY_DELAYS_MS.reduce((sum, ms) => sum + ms, 0);
    expect(total).toBeGreaterThanOrEqual(110_000);
    expect(total).toBeLessThanOrEqual(130_000);
  });
});

describe('sleep', () => {
  it('đã huỷ sẵn thì từ chối ngay', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(sleep(1_000, controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
  });
});
