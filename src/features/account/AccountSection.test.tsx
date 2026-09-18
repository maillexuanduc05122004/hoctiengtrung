/**
 * Kiểm thử dựng thật mục Tài khoản bên trong `AuthProvider`.
 *
 * Mục đích là bắt đường đi người dùng thật sự đi: mở trang khi chưa đăng nhập,
 * bấm nút một-bấm của tài khoản có sẵn, gõ sai rồi gõ đúng, đăng xuất, và mở
 * lại trang khi phiên còn trong máy — chứ không soi từng lớp Tailwind.
 */
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountSection } from './AccountSection.tsx';
import { ACCOUNTS } from './accounts.ts';
import { describeLoginError } from './login-error.ts';
import { AuthProvider } from '../../components/providers/AuthProvider.tsx';
import { API_BASE, ApiError } from '../../lib/api/client.ts';
import { clearAuth, notifyAuthChanged, saveAuth, type AuthUser } from '../../lib/api/auth.ts';

const OWNER: AuthUser = {
  id: 1,
  email: '2222@hoctiengtrung.vn',
  username: '2222',
  displayName: 'Tôi',
  roles: ['ROLE_ADMIN'],
  currentHskLevel: 1,
};

const GUEST: AuthUser = {
  id: 2,
  email: '1111@hoctiengtrung.vn',
  username: '1111',
  displayName: 'Khách',
  roles: ['ROLE_USER'],
  currentHskLevel: 1,
};

function jsonResponse(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
  });
}

function authBody(user: AuthUser): unknown {
  return {
    accessToken: 'acc',
    refreshToken: 'ref',
    tokenType: 'Bearer',
    expiresIn: 3600,
    user,
  };
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  localStorage.clear();
  clearAuth();
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderSection() {
  return render(
    <AuthProvider>
      <AccountSection />
    </AuthProvider>,
  );
}

/** Thân yêu cầu đăng nhập gửi lên máy chủ ở lần gọi thứ `index`. */
function loginBodyAt(index: number): string {
  const [url, init] = fetchMock.mock.calls[index] as [string, RequestInit];
  expect(url).toBe(`${API_BASE}/auth/login`);
  expect(init.method).toBe('POST');
  return String(init.body);
}

describe('mục Tài khoản', () => {
  it('chưa đăng nhập thì hiện ô đăng nhập và chặn gửi biểu mẫu trống', async () => {
    const user = userEvent.setup();
    renderSection();

    expect(screen.getByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument();
    expect(screen.getByLabelText('Tài khoản')).toHaveAttribute('placeholder', '2222');
    expect(screen.getByText('email hoặc tên đăng nhập')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    expect(await screen.findByText('Nhập tài khoản và mật khẩu.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('liệt kê hai tài khoản có sẵn kèm mật khẩu nhìn thấy được', () => {
    renderSection();

    expect(screen.getByText('Tài khoản có sẵn')).toBeInTheDocument();
    expect(screen.getByText(ACCOUNTS.owner.label)).toBeInTheDocument();
    expect(screen.getByText(ACCOUNTS.guest.label)).toBeInTheDocument();
    // Mỗi dòng hiện cả tên đăng nhập lẫn mật khẩu, không che.
    expect(screen.getAllByText('2222')).toHaveLength(2);
    expect(screen.getAllByText('1111')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Đăng nhập 2222' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Đăng nhập 1111' })).toBeEnabled();
  });

  it('bấm "Đăng nhập 1111" là vào ngay bằng tài khoản khách, không phải gõ gì', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(jsonResponse(200, authBody(GUEST)));
    renderSection();

    await user.click(screen.getByRole('button', { name: 'Đăng nhập 1111' }));

    // Chờ nút đăng xuất chứ không chờ chữ "Khách": chữ đó đã có sẵn trong danh
    // sách tài khoản của ô đăng nhập.
    expect(await screen.findByRole('button', { name: 'Đăng xuất' })).toBeInTheDocument();
    expect(screen.getByText('Khách')).toBeInTheDocument();
    expect(screen.getByText('1111')).toBeInTheDocument();
    expect(screen.queryByText('Quản trị viên')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Đăng nhập' })).not.toBeInTheDocument();
    expect(loginBodyAt(0)).toBe('{"email":"1111","password":"1111"}');
  });

  it('bấm "Đăng nhập 2222" là vào bằng tài khoản chủ trang, có nhãn quản trị', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(jsonResponse(200, authBody(OWNER)));
    renderSection();

    await user.click(screen.getByRole('button', { name: 'Đăng nhập 2222' }));

    expect(await screen.findByRole('button', { name: 'Đăng xuất' })).toBeInTheDocument();
    expect(screen.getByText('Tôi')).toBeInTheDocument();
    expect(screen.getByText('2222')).toBeInTheDocument();
    expect(screen.getByText('Quản trị viên')).toBeInTheDocument();
    expect(loginBodyAt(0)).toBe('{"email":"2222","password":"2222"}');
  });

  it('nút một-bấm bị từ chối thì báo lỗi tại chỗ và vẫn còn ô đăng nhập', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(
      jsonResponse(401, { status: 401, detail: 'Email hoac mat khau khong dung' }),
    );
    renderSection();

    await user.click(screen.getByRole('button', { name: 'Đăng nhập 2222' }));

    expect(await screen.findByText('Tài khoản hoặc mật khẩu không đúng.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Đăng nhập 2222' })).toBeEnabled();
  });

  it('mật khẩu dưới 4 ký tự bị chặn ngay ở máy, không gửi lên máy chủ', async () => {
    const user = userEvent.setup();
    renderSection();

    await user.type(screen.getByLabelText('Tài khoản'), '2222');
    await user.type(screen.getByLabelText('Mật khẩu'), '222');
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    expect(await screen.findByText('Mật khẩu phải có ít nhất 4 ký tự.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('gõ sai mật khẩu thì báo bằng câu có dấu, không hiện nguyên văn máy chủ', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(
      jsonResponse(401, { status: 401, detail: 'Email hoac mat khau khong dung' }),
    );
    renderSection();

    await user.type(screen.getByLabelText('Tài khoản'), '2222');
    await user.type(screen.getByLabelText('Mật khẩu'), 'sai-roi');
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    expect(await screen.findByText('Tài khoản hoặc mật khẩu không đúng.')).toBeInTheDocument();
    expect(screen.queryByText(/khong dung/)).not.toBeInTheDocument();
  });

  it('gõ tài khoản đúng thì hiện tài khoản tại chỗ, đăng xuất thì về ô đăng nhập', async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, authBody(OWNER)))
      .mockResolvedValueOnce(jsonResponse(200, { message: 'Đã đăng xuất' }));
    renderSection();

    await user.type(screen.getByLabelText('Tài khoản'), '2222');
    await user.type(screen.getByLabelText('Mật khẩu'), '2222');
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    expect(await screen.findByRole('button', { name: 'Đăng xuất' })).toBeInTheDocument();
    expect(screen.getByText('Tôi')).toBeInTheDocument();
    expect(screen.getByText('2222')).toBeInTheDocument();
    expect(screen.getByText('Quản trị viên')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Đăng nhập' })).not.toBeInTheDocument();
    expect(loginBodyAt(0)).toBe('{"email":"2222","password":"2222"}');

    await user.click(screen.getByRole('button', { name: 'Đăng xuất' }));

    expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument();
    const [logoutUrl, logoutInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(logoutUrl).toBe(`${API_BASE}/auth/logout`);
    expect(logoutInit.body).toBe('{"refreshToken":"ref"}');
    expect(localStorage.getItem('moingay.auth.v1')).toBeNull();
  });

  it('phiên còn trong máy thì hiện tài khoản ngay từ lần vẽ đầu', () => {
    saveAuth(OWNER, { accessToken: 'acc', refreshToken: 'ref' });

    renderSection();

    expect(screen.getByText('Tôi')).toBeInTheDocument();
    expect(screen.getByText('2222')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Đăng nhập' })).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('lớp gọi máy chủ xoá phiên thì giao diện tự về trạng thái chưa đăng nhập', async () => {
    saveAuth(OWNER, { accessToken: 'acc', refreshToken: 'ref' });
    renderSection();
    expect(screen.getByText('Tôi')).toBeInTheDocument();

    act(() => {
      clearAuth();
      notifyAuthChanged();
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument();
    });
  });

  it('nút hiện mật khẩu đổi kiểu ô nhập và có nhãn cho trình đọc màn hình', async () => {
    const user = userEvent.setup();
    renderSection();

    const field = screen.getByLabelText('Mật khẩu');
    expect(field).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Hiện mật khẩu' }));
    expect(field).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Ẩn mật khẩu' })).toBeInTheDocument();
  });
});

describe('describeLoginError', () => {
  it('dịch các lỗi hay gặp và rơi về mô tả chung cho phần còn lại', () => {
    expect(describeLoginError(new ApiError(401, { detail: 'Email hoac mat khau khong dung' }))).toBe(
      'Tài khoản hoặc mật khẩu không đúng.',
    );
    expect(describeLoginError(new ApiError(403, { detail: 'Tai khoan da bi khoa' }))).toBe(
      'Tài khoản này đã bị khoá.',
    );
    expect(
      describeLoginError(
        new ApiError(400, { errors: { password: 'Mat khau tu 4 den 72 ky tu' } }),
      ),
    ).toBe('Mật khẩu phải từ 4 đến 72 ký tự.');
    expect(describeLoginError(new ApiError(0))).toBe('Không kết nối được máy chủ');
    expect(describeLoginError(new ApiError(503, { detail: 'Bảo trì' }))).toBe('Bảo trì');
  });
});
