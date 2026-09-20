/**
 * Thanh "có bản mới" là mắt xích duy nhất giữa service worker chế độ `prompt`
 * và người học: không có nó thì bản FE mới không bao giờ được kích hoạt khi
 * tab cũ còn mở. Bốn điều phải đúng: đăng ký nghe lúc dựng và huỷ lúc tháo;
 * có bản mới thì hiện và "Tải lại" gọi đúng hàm kích hoạt; bản mới đã tới
 * TRƯỚC khi thanh dựng (register.ts gọi listener ngay) vẫn hiện; đóng chỉ ẩn
 * tạm, bản mới nữa tới thì hiện lại.
 *
 * `register.ts` được giả lập nguyên tệp: test chỉ cần nắm listener mà thanh
 * đăng ký rồi gọi nó, không cần service worker thật.
 */
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpdateBanner } from './UpdateBanner.tsx';
import { onServiceWorkerUpdate } from '../lib/pwa/register.ts';

vi.mock('../lib/pwa/register.ts', () => ({ onServiceWorkerUpdate: vi.fn() }));

const mockedOnUpdate = vi.mocked(onServiceWorkerUpdate);

/** Listener mà thanh đã đăng ký ở lần gọi gần nhất. */
function registeredListener(): (apply: () => void) => void {
  const calls = mockedOnUpdate.mock.calls;
  return calls[calls.length - 1][0];
}

beforeEach(() => {
  mockedOnUpdate.mockReset();
  mockedOnUpdate.mockReturnValue(() => undefined);
});

describe('UpdateBanner', () => {
  it('chưa có bản mới thì không hiện gì; đăng ký lúc dựng và huỷ lúc tháo', () => {
    const unsubscribe = vi.fn();
    mockedOnUpdate.mockReturnValue(unsubscribe);

    const { unmount } = render(<UpdateBanner />);
    expect(mockedOnUpdate).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('có bản mới thì hiện thanh, bấm "Tải lại" gọi hàm kích hoạt', async () => {
    const apply = vi.fn();
    const user = userEvent.setup();
    render(<UpdateBanner />);

    act(() => registeredListener()(apply));
    expect(screen.getByRole('status')).toHaveTextContent('Có bản mới của ứng dụng');
    expect(apply).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Tải lại' }));
    expect(apply).toHaveBeenCalledTimes(1);
  });

  it('bản mới đã tới trước khi thanh dựng (listener được gọi ngay) vẫn hiện', () => {
    const apply = vi.fn();
    mockedOnUpdate.mockImplementation((listener) => {
      listener(apply);
      return () => undefined;
    });

    render(<UpdateBanner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('đóng thì ẩn tạm; bản mới nữa tới thì hiện lại', async () => {
    const user = userEvent.setup();
    render(<UpdateBanner />);

    act(() => registeredListener()(vi.fn()));
    await user.click(screen.getByRole('button', { name: 'Đóng thông báo bản mới' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    const applyNext = vi.fn();
    act(() => registeredListener()(applyNext));
    expect(screen.getByRole('status')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tải lại' }));
    expect(applyNext).toHaveBeenCalledTimes(1);
  });
});
