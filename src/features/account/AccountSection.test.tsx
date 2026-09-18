/**
 * Kiểm thử dựng thật mục Tài khoản bên trong `AuthProvider`.
 *
 * Mục đích là bắt đường đi người dùng thật sự đi: mở trang khi chưa đăng nhập,
 * gõ sai rồi gõ đúng, đăng xuất, và mở lại trang khi phiên còn trong máy —
 * chứ không soi từng lớp Tailwind.
 */
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountSection } from './AccountSection.tsx';
import { describeLoginError } from './login-error.ts';
import { AuthProvider } from '../../components/providers/AuthProvider.tsx';
import { API_BASE, ApiError } from '../../lib/api/client.ts';
import { clearAuth, notifyAuthChanged, saveAuth, type AuthUser } from '../../lib/api/auth.ts';

const USER: AuthUser = {
  id: 1,
  email: 'admin@hoctiengtrung.vn',
  username: 'admin',
  displayName: 'Lê Đức',
  roles: ['ROLE_ADMIN'],
  currentHskLevel: 1,
};

function jsonResponse(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
  });
}

function authBody(): unknown {
  return {
    accessToken: 'acc',
    refreshToken: 'ref',
    tokenType: 'Bearer',
    expiresIn: 3600,
    user: USER,
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

describe('mục Tài khoản', () => {
  it('chưa đăng nhập thì hiện ô đăng nhập và chặn gửi biểu mẫu trống', async () => {
    const user = userEvent.setup();
    renderSection();

    expect(screen.getByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    expect(await screen.findByText('Nhập email và mật khẩu.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('gõ sai mật khẩu thì báo bằng câu có dấu, không hiện nguyên văn máy chủ', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(
      jsonResponse(401, { status: 401, detail: 'Email hoac mat khau khong dung' }),
    );
    renderSection();

    await user.type(screen.getByLabelText('Email'), 'admin@hoctiengtrung.vn');
    await user.type(screen.getByLabelText('Mật khẩu'), 'sai-roi');
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    expect(await screen.findByText('Email hoặc mật khẩu không đúng.')).toBeInTheDocument();
    expect(screen.queryByText(/khong dung/)).not.toBeInTheDocument();
  });

  it('đăng nhập đúng thì hiện tài khoản tại chỗ, đăng xuất thì về ô đăng nhập', async () => {
    const user = userEvent.setup();
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, authBody()))
      .mockResolvedValueOnce(jsonResponse(200, { message: 'Đã đăng xuất' }));
    renderSection();

    await user.type(screen.getByLabelText('Email'), 'admin@hoctiengtrung.vn');
    await user.type(screen.getByLabelText('Mật khẩu'), 'Admin@123');
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    expect(await screen.findByText('admin@hoctiengtrung.vn')).toBeInTheDocument();
    expect(screen.getByText('Lê Đức')).toBeInTheDocument();
    expect(screen.getByText('Quản trị viên')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Đăng nhập' })).not.toBeInTheDocument();

    const [loginUrl, loginInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(loginUrl).toBe(`${API_BASE}/auth/login`);
    expect(loginInit.method).toBe('POST');

    await user.click(screen.getByRole('button', { name: 'Đăng xuất' }));

    expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument();
    const [logoutUrl, logoutInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(logoutUrl).toBe(`${API_BASE}/auth/logout`);
    expect(logoutInit.body).toBe('{"refreshToken":"ref"}');
    expect(localStorage.getItem('moingay.auth.v1')).toBeNull();
  });

  it('phiên còn trong máy thì hiện tài khoản ngay từ lần vẽ đầu', () => {
    saveAuth(USER, { accessToken: 'acc', refreshToken: 'ref' });

    renderSection();

    expect(screen.getByText('admin@hoctiengtrung.vn')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Đăng nhập' })).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('lớp gọi máy chủ xoá phiên thì giao diện tự về trạng thái chưa đăng nhập', async () => {
    saveAuth(USER, { accessToken: 'acc', refreshToken: 'ref' });
    renderSection();
    expect(screen.getByText('admin@hoctiengtrung.vn')).toBeInTheDocument();

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
      'Email hoặc mật khẩu không đúng.',
    );
    expect(describeLoginError(new ApiError(403, { detail: 'Tai khoan da bi khoa' }))).toBe(
      'Tài khoản này đã bị khoá.',
    );
    expect(
      describeLoginError(
        new ApiError(400, { errors: { password: 'Mat khau tu 8 den 72 ky tu' } }),
      ),
    ).toBe('Mật khẩu phải từ 8 đến 72 ký tự.');
    expect(describeLoginError(new ApiError(0))).toBe('Không kết nối được máy chủ');
    expect(describeLoginError(new ApiError(503, { detail: 'Bảo trì' }))).toBe('Bảo trì');
  });
});
