/**
 * Ngữ cảnh phiên đăng nhập.
 *
 * Giá trị mặc định là "chưa đăng nhập" với hai hàm rỗng, nên một thành phần
 * dựng ngoài `AuthProvider` (như trong kiểm thử của trang khác) vẫn chạy được
 * mà không vỡ; chỉ khi bọc trong provider thì đăng nhập mới có tác dụng thật.
 */
import { createContext, useContext } from 'react';
import type { AuthUser } from '../lib/api/auth.ts';

export type AuthStatus = 'anonymous' | 'authenticated';

export interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Tài khoản mang vai trò quản trị; phần nhập từ trên máy chủ chỉ mở cho vai trò này. */
  isAdmin: boolean;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  status: 'anonymous',
  login: async () => undefined,
  logout: async () => undefined,
  isAdmin: false,
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
