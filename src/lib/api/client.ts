/**
 * Lớp gọi máy chủ mỏng trên `fetch`.
 *
 * Mọi request đi qua `apiFetch`: JSON vào, JSON ra, gắn Bearer token từ kho
 * phiên, và đổi mọi lỗi thành `ApiError` để giao diện chỉ phải xử lý một kiểu.
 *
 * Access token hết hạn sau một giờ, còn refresh token sống nhiều ngày. Khi máy
 * chủ trả 401, lớp này tự làm mới token đúng MỘT lần rồi phát lại request; nhiều
 * request cùng dính 401 một lúc chỉ tạo ra một lần làm mới, nhờ dùng chung một
 * promise. Làm mới thất bại vì token đã bị thu hồi thì xoá phiên và báo cho
 * `AuthProvider` qua `notifyAuthChanged()`.
 *
 * Không phụ thuộc React: các hook, trang và cả kiểm thử thuần đều gọi được.
 */
import {
  clearAuth,
  getAccessToken,
  getRefreshToken,
  loadAuth,
  notifyAuthChanged,
  saveAuth,
  type AuthTokens,
  type AuthUser,
} from './token-store.ts';
import type { AuthResponse, UserResponse } from './types.ts';

const DEFAULT_ORIGIN = 'http://localhost:8080';
const API_PREFIX = '/api/v1';

/** Câu báo lỗi mạng dùng chung, để mọi màn hình nói cùng một giọng. */
export const NETWORK_ERROR_MESSAGE = 'Không kết nối được máy chủ';

function resolveBase(): string {
  const raw = import.meta.env.VITE_API_URL;
  const origin = typeof raw === 'string' && raw.trim() !== '' ? raw.trim() : DEFAULT_ORIGIN;
  // Chấp nhận cả dạng có sẵn `/api/v1` hoặc dấu gạch cuối, để cấu hình sai nhẹ không thành lỗi khó tìm.
  const trimmed = origin.replace(/\/+$/, '');
  return trimmed.endsWith(API_PREFIX) ? trimmed : `${trimmed}${API_PREFIX}`;
}

/** Địa chỉ gốc của API, ví dụ `http://localhost:8080/api/v1`. */
export const API_BASE: string = resolveBase();

/** Thân lỗi theo RFC 7807 mà máy chủ trả về, kèm các trường mở rộng của dự án. */
export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  code?: string;
  errors?: Record<string, string>;
  path?: string;
}

export class ApiError extends Error {
  /** Mã HTTP; `0` khi không tới được máy chủ. */
  readonly status: number;
  readonly problem?: ProblemDetail;

  constructor(status: number, problem?: ProblemDetail, message?: string) {
    super(message ?? problem?.detail ?? problem?.title ?? `HTTP ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.problem = problem;
  }

  /** Mã lỗi nghiệp vụ của máy chủ, ví dụ `AI_DISABLED`, nếu có. */
  get code(): string | undefined {
    return this.problem?.code;
  }

  get isNetworkError(): boolean {
    return this.status === 0;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function pickString(source: Record<string, unknown>, key: string): string | undefined {
  const value = source[key];
  return typeof value === 'string' ? value : undefined;
}

/** Lọc thân lỗi về đúng các trường đã biết, bỏ qua mọi thứ lạ. */
function toProblemDetail(raw: unknown): ProblemDetail | undefined {
  if (!isRecord(raw)) return undefined;
  const problem: ProblemDetail = {
    type: pickString(raw, 'type'),
    title: pickString(raw, 'title'),
    status: typeof raw.status === 'number' ? raw.status : undefined,
    detail: pickString(raw, 'detail'),
    code: pickString(raw, 'code'),
    path: pickString(raw, 'path'),
  };
  if (isRecord(raw.errors)) {
    const errors: Record<string, string> = {};
    for (const [field, message] of Object.entries(raw.errors)) {
      if (typeof message === 'string') errors[field] = message;
    }
    problem.errors = errors;
  }
  return problem;
}

/**
 * Đổi một lỗi bất kỳ thành câu tiếng Việt để hiện lên màn hình.
 *
 * Thứ tự ưu tiên: bảng lỗi theo trường (ghép "trường: câu; …"), rồi `detail`,
 * rồi `title`, rồi `message` của lỗi. Lỗi mạng luôn thành một câu cố định.
 */
export function describeApiError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.isNetworkError) return NETWORK_ERROR_MESSAGE;
    const errors = err.problem?.errors;
    if (errors) {
      const parts = Object.entries(errors)
        .filter(([, message]) => message !== '')
        .map(([field, message]) => `${field}: ${message}`);
      if (parts.length > 0) return parts.join('; ');
    }
    return err.problem?.detail || err.problem?.title || err.message || `HTTP ${err.status}`;
  }
  if (err instanceof TypeError && /fetch|network/i.test(err.message)) {
    return NETWORK_ERROR_MESSAGE;
  }
  if (err instanceof Error && err.message !== '') return err.message;
  return 'Đã xảy ra lỗi không rõ';
}

export interface ApiOptions {
  /** Gắn Bearer token và tự làm mới khi 401. Mặc định `true`. */
  auth?: boolean;
  signal?: AbortSignal;
}

export type ApiInit = RequestInit & ApiOptions;

/** Các đường dẫn xác thực không bao giờ kích hoạt làm mới token, kẻo lặp vô hạn. */
function isAuthPath(path: string): boolean {
  return /(^|\/)auth\//.test(path);
}

function resolveUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

/** Nhận diện theo tên, vì `DOMException` không phải lúc nào cũng là `instanceof Error`. */
function isAbortError(error: unknown): boolean {
  return isRecord(error) && error.name === 'AbortError';
}

/** Gửi một request thô; chỉ đổi lỗi mạng thành `ApiError`, không đọc thân phản hồi. */
async function send(path: string, init: RequestInit, token: string | null): Promise<Response> {
  const headers = new Headers(init.headers);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  if (typeof init.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token !== null) headers.set('Authorization', `Bearer ${token}`);
  try {
    return await fetch(resolveUrl(path), { ...init, headers });
  } catch (error: unknown) {
    if (isAbortError(error)) throw error;
    throw new ApiError(0, undefined, NETWORK_ERROR_MESSAGE);
  }
}

async function toError(response: Response): Promise<ApiError> {
  let problem: ProblemDetail | undefined;
  try {
    const text = await response.text();
    if (text !== '') problem = toProblemDetail(JSON.parse(text));
  } catch {
    // Thân lỗi không phải JSON (trang HTML của proxy chẳng hạn): chỉ còn mã HTTP.
  }
  return new ApiError(response.status, problem);
}

async function parse<T>(response: Response): Promise<T> {
  if (!response.ok) throw await toError(response);
  if (response.status === 204 || response.status === 205) return undefined as T;
  const text = await response.text();
  if (text === '') return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError(response.status, undefined, 'Máy chủ trả về dữ liệu không đọc được');
  }
}

/** Rút gọn thông tin người dùng máy chủ trả về thành phần giao diện cần. */
export function toAuthUser(user: UserResponse): AuthUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username ?? '',
    displayName: user.displayName ?? user.username ?? user.email,
    roles: Array.isArray(user.roles) ? user.roles : [],
    currentHskLevel: typeof user.currentHskLevel === 'number' ? user.currentHskLevel : 1,
  };
}

let refreshInFlight: Promise<AuthTokens | null> | null = null;

async function performRefresh(): Promise<AuthTokens | null> {
  const refreshToken = getRefreshToken();
  if (refreshToken === null) return null;

  let response: Response;
  try {
    response = await send(
      '/auth/refresh',
      { method: 'POST', body: JSON.stringify({ refreshToken }) },
      null,
    );
  } catch {
    // Lỗi mạng giữa chừng không nói lên gì về token, nên giữ phiên để thử lại sau.
    return null;
  }

  if (!response.ok) {
    // Máy chủ chủ động từ chối (4xx) nghĩa là token đã bị thu hồi hoặc hết hạn:
    // phiên này chết thật. Lỗi 5xx là chuyện của máy chủ, không xoá phiên.
    if (response.status >= 400 && response.status < 500) {
      clearAuth();
      notifyAuthChanged();
    }
    return null;
  }

  let payload: AuthResponse;
  try {
    payload = await parse<AuthResponse>(response);
  } catch {
    return null;
  }
  if (typeof payload?.accessToken !== 'string' || typeof payload.refreshToken !== 'string') {
    return null;
  }

  const tokens: AuthTokens = {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
  };
  const previous = loadAuth()?.user ?? null;
  const user = isRecord(payload.user) ? toAuthUser(payload.user) : previous;
  if (user === null) return null;
  saveAuth(user, tokens);
  notifyAuthChanged();
  return tokens;
}

/**
 * Làm mới cặp token, dùng chung một promise cho mọi bên gọi cùng lúc.
 *
 * Trả `null` khi không có refresh token, khi máy chủ từ chối, hay khi không tới
 * được máy chủ. Chỉ trường hợp bị từ chối mới xoá phiên.
 */
export function refreshSession(): Promise<AuthTokens | null> {
  if (refreshInFlight === null) {
    refreshInFlight = performRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

/**
 * Gọi API và trả về thân JSON đã đọc. `204` trả `undefined`.
 *
 * `path` tính từ `API_BASE`, ví dụ `/me/words?size=500`. Thân request truyền
 * qua `body` dạng chuỗi JSON, header `Content-Type` được đặt sẵn.
 */
export async function apiFetch<T>(path: string, init: ApiInit = {}): Promise<T> {
  const { auth = true, ...request } = init;
  const tokenUsed = auth ? getAccessToken() : null;
  const first = await send(path, request, tokenUsed);

  if (first.status !== 401 || !auth || isAuthPath(path)) return parse<T>(first);

  // Token lúc gửi đã khác token hiện có nghĩa là một request khác vừa làm mới
  // xong trong lúc request này đang bay: chỉ cần phát lại, không làm mới nữa.
  const current = getAccessToken();
  let nextToken: string | null = current !== null && current !== tokenUsed ? current : null;
  if (nextToken === null) {
    const refreshed = await refreshSession();
    if (refreshed === null) throw await toError(first);
    nextToken = refreshed.accessToken;
  }

  const second = await send(path, request, nextToken);
  return parse<T>(second);
}
