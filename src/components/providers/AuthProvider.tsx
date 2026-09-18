import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  AUTH_STORAGE_KEY,
  hasAdminRole,
  loadAuth,
  login as loginRequest,
  logout as logoutRequest,
  subscribeAuth,
  type AuthUser,
} from '../../lib/api/auth.ts';
import { AuthContext, type AuthContextValue } from '../../hooks/useAuth.ts';

/**
 * Hai bản ghi người dùng có cùng nội dung thì giữ nguyên tham chiếu cũ, để mỗi
 * lần làm mới token (một giờ một lần) không kéo cả cây bên dưới vẽ lại.
 */
function sameUser(a: AuthUser | null, b: AuthUser | null): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  return (
    a.id === b.id &&
    a.email === b.email &&
    a.username === b.username &&
    a.displayName === b.displayName &&
    a.currentHskLevel === b.currentHskLevel &&
    a.roles.length === b.roles.length &&
    a.roles.every((role, index) => role === b.roles[index])
  );
}

/**
 * Cung cấp phiên đăng nhập cho toàn bộ cây React.
 *
 * Phiên được đọc đồng bộ từ kho ngay lần dựng đầu, nên trang "Câu của tôi"
 * không nháy qua màn đăng nhập rồi mới hiện nội dung. Sau đó provider chỉ
 * lắng nghe: `client.ts` xoá token khi làm mới thất bại, hoặc thẻ trình duyệt
 * khác đăng nhập / đăng xuất, đều được phản ánh qua `subscribeAuth` và sự kiện
 * `storage`.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => loadAuth()?.user ?? null);

  const syncFromStore = useCallback((): void => {
    const next = loadAuth()?.user ?? null;
    setUser((current) => (sameUser(current, next) ? current : next));
  }, []);

  useEffect(() => subscribeAuth(syncFromStore), [syncFromStore]);

  useEffect(() => {
    const onStorage = (event: StorageEvent): void => {
      if (event.key === null || event.key === AUTH_STORAGE_KEY) syncFromStore();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [syncFromStore]);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    const next = await loginRequest(email, password);
    setUser((current) => (sameUser(current, next) ? current : next));
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await logoutRequest();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status: user === null ? 'anonymous' : 'authenticated',
      login,
      logout,
      isAdmin: hasAdminRole(user),
    }),
    [user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
