/**
 * Đăng nhập, đăng xuất và làm mới phiên.
 *
 * Kho token nằm ở `token-store.ts` và được xuất lại từ đây, nên phần còn lại
 * của ứng dụng chỉ cần biết tới `auth.ts`. Chỉ có đúng một tài khoản (người
 * học đồng thời là quản trị viên) nên không có đăng ký hay quên mật khẩu.
 */
import { apiFetch, refreshSession, toAuthUser } from './client.ts';
import {
  clearAuth,
  getRefreshToken,
  notifyAuthChanged,
  saveAuth,
  type AuthTokens,
  type AuthUser,
} from './token-store.ts';
import type { AuthResponse, MessageResponse } from './types.ts';

export type { AuthTokens, AuthUser, StoredAuth } from './token-store.ts';
export {
  AUTH_STORAGE_KEY,
  clearAuth,
  getAccessToken,
  getRefreshToken,
  hasAdminRole,
  loadAuth,
  notifyAuthChanged,
  saveAuth,
  subscribeAuth,
} from './token-store.ts';

/** Đăng nhập bằng email và mật khẩu; lưu phiên rồi báo cho các bên đang nghe. */
export async function login(email: string, password: string): Promise<AuthUser> {
  const response = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim(), password }),
    auth: false,
  });
  const user = toAuthUser(response.user);
  saveAuth(user, { accessToken: response.accessToken, refreshToken: response.refreshToken });
  notifyAuthChanged();
  return user;
}

/**
 * Đăng xuất thiết bị này.
 *
 * Máy chủ thu hồi refresh token; không tới được máy chủ thì vẫn xoá phiên ở
 * máy, vì người dùng bấm "Đăng xuất" là muốn rời đi ngay chứ không muốn chờ.
 */
export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (refreshToken !== null) {
    try {
      await apiFetch<MessageResponse>('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Token đã hết hạn hay mất mạng đều không phải lý do để giữ người dùng lại.
    }
  }
  clearAuth();
  notifyAuthChanged();
}

/** Xin cặp token mới bằng refresh token đang giữ; `null` khi không làm mới được. */
export function refreshTokens(): Promise<AuthTokens | null> {
  return refreshSession();
}
