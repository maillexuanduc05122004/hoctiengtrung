/**
 * Kho phiên đăng nhập: người dùng hiện tại và cặp token.
 *
 * Tách riêng khỏi `auth.ts` để `client.ts` đọc được token một cách đồng bộ mà
 * không kéo theo React hay các hàm gọi mạng, và để không tạo vòng import giữa
 * `client.ts` (cần token) và `auth.ts` (cần `apiFetch`).
 *
 * localStorage là nguồn sự thật khi trình duyệt cho dùng: hai thẻ trình duyệt
 * cùng thấy một phiên, đăng xuất ở thẻ này thì thẻ kia cũng mất token ngay lần
 * gọi API kế tiếp. Khi trình duyệt chặn lưu trữ (chế độ riêng tư, quota) thì
 * lùi về bản sao trong bộ nhớ, để phiên vẫn sống tới khi đóng thẻ.
 */

export interface AuthUser {
  id: number;
  email: string;
  username: string;
  displayName: string;
  roles: string[];
  currentHskLevel: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface StoredAuth {
  user: AuthUser;
  tokens: AuthTokens;
}

export const AUTH_STORAGE_KEY = 'moingay.auth.v1';

/** Bản sao trong bộ nhớ, dùng khi localStorage không đọc ghi được. */
let memory: StoredAuth | null = null;

const listeners = new Set<() => void>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

/** Đọc lại dữ liệu đã lưu, bỏ qua bản ghi thiếu trường thay vì tin bừa. */
function parseStored(raw: string): StoredAuth | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !isRecord(parsed.user) || !isRecord(parsed.tokens)) return null;
    const { user, tokens } = parsed;
    if (
      typeof user.id !== 'number' ||
      typeof user.email !== 'string' ||
      typeof tokens.accessToken !== 'string' ||
      typeof tokens.refreshToken !== 'string' ||
      tokens.accessToken === '' ||
      tokens.refreshToken === ''
    ) {
      return null;
    }
    return {
      user: {
        id: user.id,
        email: user.email,
        username: typeof user.username === 'string' ? user.username : '',
        displayName: typeof user.displayName === 'string' ? user.displayName : user.email,
        roles: isStringArray(user.roles) ? user.roles : [],
        currentHskLevel: typeof user.currentHskLevel === 'number' ? user.currentHskLevel : 1,
      },
      tokens: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
    };
  } catch {
    return null;
  }
}

export function loadAuth(): StoredAuth | null {
  let raw: string | null;
  try {
    raw = localStorage.getItem(AUTH_STORAGE_KEY);
  } catch {
    return memory;
  }
  memory = raw === null ? null : parseStored(raw);
  return memory;
}

export function saveAuth(user: AuthUser, tokens: AuthTokens): void {
  memory = { user, tokens };
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(memory));
  } catch {
    // Không ghi được thì phiên chỉ sống trong bộ nhớ; vẫn dùng được tới khi đóng thẻ.
  }
}

export function clearAuth(): void {
  memory = null;
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // Không xoá được cũng không sao: bản trong bộ nhớ đã trống.
  }
}

export function getAccessToken(): string | null {
  return loadAuth()?.tokens.accessToken ?? null;
}

export function getRefreshToken(): string | null {
  return loadAuth()?.tokens.refreshToken ?? null;
}

/** Đăng ký nghe mọi thay đổi phiên (đăng nhập, đăng xuất, bị thu hồi token). */
export function subscribeAuth(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyAuthChanged(): void {
  for (const listener of [...listeners]) {
    try {
      listener();
    } catch (error: unknown) {
      // Một người nghe hỏng không được chặn những người nghe còn lại.
      console.error('Lỗi khi báo thay đổi phiên đăng nhập.', error);
    }
  }
}

/** Tài khoản có vai trò quản trị hay không; máy chủ ghi vai trò dạng `ROLE_ADMIN`. */
export function hasAdminRole(user: AuthUser | null): boolean {
  return user !== null && user.roles.some((role) => role === 'ROLE_ADMIN' || role === 'ADMIN');
}
