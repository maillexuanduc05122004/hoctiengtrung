/**
 * Kiểm thử kho phiên và ba thao tác đăng nhập / đăng xuất / làm mới.
 *
 * Kho phải đọc được đồng bộ, nuốt mọi lỗi lưu trữ, và không tin dữ liệu hỏng
 * trong localStorage — vì đây là thứ `client.ts` gọi trước MỌI request.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AUTH_STORAGE_KEY,
  clearAuth,
  getAccessToken,
  getRefreshToken,
  hasAdminRole,
  loadAuth,
  login,
  logout,
  notifyAuthChanged,
  refreshTokens,
  saveAuth,
  subscribeAuth,
  type AuthUser,
} from './auth.ts';
import { API_BASE, ApiError } from './client.ts';

const USER: AuthUser = {
  id: 1,
  email: 'admin@hoctiengtrung.vn',
  username: 'admin',
  displayName: 'Quản trị viên',
  roles: ['ROLE_ADMIN'],
  currentHskLevel: 1,
};

const TOKENS = { accessToken: 'acc', refreshToken: 'ref' };

function jsonResponse(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
  });
}

function lastCall(mock: ReturnType<typeof vi.fn>): { url: string; init: RequestInit } {
  const call = mock.mock.calls.at(-1) as [string, RequestInit] | undefined;
  if (!call) throw new Error('fetch chưa được gọi');
  return { url: call[0], init: call[1] };
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
  vi.restoreAllMocks();
});

describe('kho phiên', () => {
  it('trống khi chưa đăng nhập', () => {
    expect(loadAuth()).toBeNull();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it('lưu rồi đọc lại đúng người dùng và token, dưới khoá moingay.auth.v1', () => {
    saveAuth(USER, TOKENS);

    expect(loadAuth()).toEqual({ user: USER, tokens: TOKENS });
    expect(getAccessToken()).toBe('acc');
    expect(getRefreshToken()).toBe('ref');
    expect(AUTH_STORAGE_KEY).toBe('moingay.auth.v1');
    expect(JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) ?? 'null')).toEqual({
      user: USER,
      tokens: TOKENS,
    });
  });

  it('xoá sạch cả localStorage lẫn bản trong bộ nhớ', () => {
    saveAuth(USER, TOKENS);
    clearAuth();

    expect(loadAuth()).toBeNull();
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it('bỏ qua dữ liệu hỏng thay vì ném lỗi', () => {
    localStorage.setItem(AUTH_STORAGE_KEY, '{không phải json');
    expect(loadAuth()).toBeNull();

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: USER, tokens: { accessToken: '' } }));
    expect(loadAuth()).toBeNull();

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ tokens: TOKENS }));
    expect(loadAuth()).toBeNull();
  });

  it('điền mặc định cho trường thiếu ở bản lưu cũ', () => {
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ user: { id: 7, email: 'a@b.vn' }, tokens: TOKENS }),
    );

    expect(loadAuth()?.user).toEqual({
      id: 7,
      email: 'a@b.vn',
      username: '',
      displayName: 'a@b.vn',
      roles: [],
      currentHskLevel: 1,
    });
  });

  it('vẫn giữ phiên trong bộ nhớ khi trình duyệt chặn localStorage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bị chặn');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bị chặn');
    });

    expect(() => saveAuth(USER, TOKENS)).not.toThrow();
    expect(getAccessToken()).toBe('acc');
    expect(() => clearAuth()).not.toThrow();
    expect(getAccessToken()).toBeNull();
  });

  it('báo cho người nghe và ngừng báo sau khi huỷ đăng ký', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeAuth(listener);

    notifyAuthChanged();
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    notifyAuthChanged();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('một người nghe hỏng không chặn người nghe khác', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const broken = vi.fn(() => {
      throw new Error('hỏng');
    });
    const healthy = vi.fn();
    const stopBroken = subscribeAuth(broken);
    const stopHealthy = subscribeAuth(healthy);

    expect(() => notifyAuthChanged()).not.toThrow();
    expect(healthy).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalled();

    stopBroken();
    stopHealthy();
  });

  it('nhận ra vai trò quản trị', () => {
    expect(hasAdminRole(USER)).toBe(true);
    expect(hasAdminRole({ ...USER, roles: ['ROLE_USER'] })).toBe(false);
    expect(hasAdminRole(null)).toBe(false);
  });
});

describe('login', () => {
  it('gửi POST /auth/login không kèm token, lưu phiên và báo thay đổi', async () => {
    saveAuth({ ...USER, id: 99 }, { accessToken: 'cũ', refreshToken: 'cũ' });
    const listener = vi.fn();
    const unsubscribe = subscribeAuth(listener);
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        accessToken: 'acc-2',
        refreshToken: 'ref-2',
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: { ...USER, avatarUrl: null, nativeLanguage: 'vi', status: 'ACTIVE' },
      }),
    );

    const user = await login('  admin@hoctiengtrung.vn ', 'Admin@123');
    unsubscribe();

    expect(user).toEqual(USER);
    const { url, init } = lastCall(fetchMock);
    expect(url).toBe(`${API_BASE}/auth/login`);
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{"email":"admin@hoctiengtrung.vn","password":"Admin@123"}');
    expect(new Headers(init.headers).get('Authorization')).toBeNull();
    expect(loadAuth()).toEqual({
      user: USER,
      tokens: { accessToken: 'acc-2', refreshToken: 'ref-2' },
    });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('sai mật khẩu thì ném ApiError 401 và không đụng tới phiên', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(401, { status: 401, detail: 'Email hoac mat khau khong dung' }),
    );

    await expect(login('admin@hoctiengtrung.vn', 'sai')).rejects.toBeInstanceOf(ApiError);
    expect(loadAuth()).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('logout', () => {
  it('thu hồi refresh token trên máy chủ rồi xoá phiên', async () => {
    saveAuth(USER, TOKENS);
    const listener = vi.fn();
    const unsubscribe = subscribeAuth(listener);
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { message: 'Đã đăng xuất' }));

    await logout();
    unsubscribe();

    const { url, init } = lastCall(fetchMock);
    expect(url).toBe(`${API_BASE}/auth/logout`);
    expect(init.body).toBe('{"refreshToken":"ref"}');
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer acc');
    expect(loadAuth()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('máy chủ không tới được thì vẫn đăng xuất ở máy', async () => {
    saveAuth(USER, TOKENS);
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(logout()).resolves.toBeUndefined();
    expect(loadAuth()).toBeNull();
  });

  it('chưa đăng nhập thì không gọi mạng', async () => {
    await logout();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('refreshTokens', () => {
  it('trả null khi không có phiên', async () => {
    await expect(refreshTokens()).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('gửi refresh token cũ và lưu cặp mới', async () => {
    saveAuth(USER, TOKENS);
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        accessToken: 'acc-2',
        refreshToken: 'ref-2',
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: USER,
      }),
    );

    await expect(refreshTokens()).resolves.toEqual({ accessToken: 'acc-2', refreshToken: 'ref-2' });
    const { url, init } = lastCall(fetchMock);
    expect(url).toBe(`${API_BASE}/auth/refresh`);
    expect(init.body).toBe('{"refreshToken":"ref"}');
    expect(getAccessToken()).toBe('acc-2');
  });

  it('bị từ chối thì xoá phiên và trả null', async () => {
    saveAuth(USER, TOKENS);
    fetchMock.mockResolvedValueOnce(jsonResponse(401, { detail: 'Refresh token da bi thu hoi' }));

    await expect(refreshTokens()).resolves.toBeNull();
    expect(loadAuth()).toBeNull();
  });
});
