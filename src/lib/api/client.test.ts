/**
 * Kiểm thử lớp gọi máy chủ với `fetch` giả.
 *
 * Trọng tâm là đường đi 401: làm mới token đúng một lần, phát lại request, và
 * xoá phiên khi refresh token đã chết. Đây là chỗ dễ lặp vô hạn hoặc đăng xuất
 * oan nhất, nên được canh kỹ hơn phần đọc JSON thông thường.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  API_BASE,
  ApiError,
  NETWORK_ERROR_MESSAGE,
  apiFetch,
  describeApiError,
  refreshSession,
} from './client.ts';
import {
  clearAuth,
  getAccessToken,
  getRefreshToken,
  loadAuth,
  saveAuth,
  subscribeAuth,
  type AuthUser,
} from './token-store.ts';

const USER: AuthUser = {
  id: 1,
  email: 'admin@hoctiengtrung.vn',
  username: 'admin',
  displayName: 'Quản trị viên',
  roles: ['ROLE_ADMIN'],
  currentHskLevel: 2,
};

function jsonResponse(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
  });
}

function authResponse(accessToken: string, refreshToken: string): unknown {
  return {
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: 3600,
    user: { ...USER },
  };
}

interface SentCall {
  url: string;
  method: string;
  headers: Headers;
  body: string | null;
}

/** Đọc lại các lần gọi `fetch` dưới dạng dễ so sánh. */
function sentCalls(mock: ReturnType<typeof vi.fn>): SentCall[] {
  return mock.mock.calls.map((call) => {
    const [url, init] = call as [string, RequestInit | undefined];
    return {
      url,
      method: init?.method ?? 'GET',
      headers: new Headers(init?.headers),
      body: typeof init?.body === 'string' ? init.body : null,
    };
  });
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

describe('apiFetch', () => {
  it('gắn Bearer token, header JSON và đọc thân phản hồi', async () => {
    saveAuth(USER, { accessToken: 'acc-1', refreshToken: 'ref-1' });
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { content: [], totalElements: 0 }));

    const result = await apiFetch<{ content: unknown[]; totalElements: number }>(
      '/me/words?size=500',
    );

    expect(result).toEqual({ content: [], totalElements: 0 });
    const [call] = sentCalls(fetchMock);
    expect(call.url).toBe(`${API_BASE}/me/words?size=500`);
    expect(call.headers.get('Authorization')).toBe('Bearer acc-1');
    expect(call.headers.get('Accept')).toBe('application/json');
    // GET không có thân thì không cần khai Content-Type.
    expect(call.headers.get('Content-Type')).toBeNull();
  });

  it('đặt Content-Type JSON khi có thân request dạng chuỗi', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { ok: true }));

    await apiFetch('/me/sentences/bulk', {
      method: 'POST',
      body: JSON.stringify({ sentences: [] }),
    });

    const [call] = sentCalls(fetchMock);
    expect(call.method).toBe('POST');
    expect(call.headers.get('Content-Type')).toBe('application/json');
    expect(call.body).toBe('{"sentences":[]}');
  });

  it('không gắn Authorization khi auth: false dù đang có phiên', async () => {
    saveAuth(USER, { accessToken: 'acc-1', refreshToken: 'ref-1' });
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { enabled: false }));

    await apiFetch('/ai/status', { auth: false });

    expect(sentCalls(fetchMock)[0].headers.get('Authorization')).toBeNull();
  });

  it('trả undefined với 204', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(204));

    await expect(apiFetch<void>('/me/words/9', { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('ném ApiError kèm ProblemDetail khi máy chủ báo lỗi', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(400, {
        type: 'about:blank',
        title: 'Dữ liệu không hợp lệ',
        status: 400,
        detail: 'Dữ liệu gửi lên không hợp lệ.',
        code: 'VALIDATION_ERROR',
        errors: { email: 'Email không hợp lệ', password: 'Mật khẩu từ 8 đến 72 ký tự' },
        path: '/api/v1/auth/login',
        timestamp: '2026-09-18T00:00:00Z',
      }),
    );

    const error = await apiFetch('/auth/login', { method: 'POST', body: '{}', auth: false }).catch(
      (err: unknown) => err,
    );

    expect(error).toBeInstanceOf(ApiError);
    const apiError = error as ApiError;
    expect(apiError.status).toBe(400);
    expect(apiError.code).toBe('VALIDATION_ERROR');
    expect(apiError.problem?.errors).toEqual({
      email: 'Email không hợp lệ',
      password: 'Mật khẩu từ 8 đến 72 ký tự',
    });
    expect(describeApiError(apiError)).toBe(
      'email: Email không hợp lệ; password: Mật khẩu từ 8 đến 72 ký tự',
    );
  });

  it('vẫn ném ApiError đúng mã khi thân lỗi không phải JSON', async () => {
    fetchMock.mockResolvedValueOnce(new Response('<html>Bad Gateway</html>', { status: 502 }));

    const error = await apiFetch('/ai/status').catch((err: unknown) => err);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(502);
    expect((error as ApiError).problem).toBeUndefined();
    expect(describeApiError(error)).toBe('HTTP 502');
  });

  it('đổi lỗi mạng thành ApiError status 0 và câu báo cố định', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const error = await apiFetch('/ai/status').catch((err: unknown) => err);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(0);
    expect((error as ApiError).isNetworkError).toBe(true);
    expect(describeApiError(error)).toBe(NETWORK_ERROR_MESSAGE);
  });

  it('để nguyên AbortError cho nơi gọi tự nhận biết', async () => {
    const abort = new DOMException('The operation was aborted.', 'AbortError');
    fetchMock.mockRejectedValueOnce(abort);

    await expect(apiFetch('/dictionary/search?q=go')).rejects.toBe(abort);
  });
});

describe('apiFetch khi gặp 401', () => {
  it('làm mới token một lần rồi phát lại request với token mới', async () => {
    saveAuth(USER, { accessToken: 'acc-old', refreshToken: 'ref-old' });
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { title: 'Chưa xác thực', status: 401 }))
      .mockResolvedValueOnce(jsonResponse(200, authResponse('acc-new', 'ref-new')))
      .mockResolvedValueOnce(jsonResponse(200, [{ id: 1 }]));

    const result = await apiFetch<{ id: number }[]>('/me/sentences');

    expect(result).toEqual([{ id: 1 }]);
    const calls = sentCalls(fetchMock);
    expect(calls).toHaveLength(3);
    expect(calls[0].headers.get('Authorization')).toBe('Bearer acc-old');
    expect(calls[1].url).toBe(`${API_BASE}/auth/refresh`);
    expect(calls[1].method).toBe('POST');
    expect(calls[1].body).toBe('{"refreshToken":"ref-old"}');
    // Refresh không được mang token cũ, vì chính token đó vừa bị từ chối.
    expect(calls[1].headers.get('Authorization')).toBeNull();
    expect(calls[2].url).toBe(`${API_BASE}/me/sentences`);
    expect(calls[2].headers.get('Authorization')).toBe('Bearer acc-new');
    expect(getAccessToken()).toBe('acc-new');
    expect(getRefreshToken()).toBe('ref-new');
  });

  it('nhiều request 401 cùng lúc chỉ làm mới một lần', async () => {
    saveAuth(USER, { accessToken: 'acc-old', refreshToken: 'ref-old' });
    fetchMock.mockImplementation((input: string, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (input.endsWith('/auth/refresh')) {
        return Promise.resolve(jsonResponse(200, authResponse('acc-new', 'ref-new')));
      }
      if (headers.get('Authorization') === 'Bearer acc-new') {
        return Promise.resolve(jsonResponse(200, { url: input }));
      }
      return Promise.resolve(jsonResponse(401, { status: 401 }));
    });

    const [words, sentences] = await Promise.all([
      apiFetch<{ url: string }>('/me/words'),
      apiFetch<{ url: string }>('/me/sentences'),
    ]);

    expect(words.url).toBe(`${API_BASE}/me/words`);
    expect(sentences.url).toBe(`${API_BASE}/me/sentences`);
    const refreshCalls = sentCalls(fetchMock).filter((call) => call.url.endsWith('/auth/refresh'));
    expect(refreshCalls).toHaveLength(1);
  });

  it('refresh thất bại thì xoá phiên, báo cho người nghe và ném 401', async () => {
    saveAuth(USER, { accessToken: 'acc-old', refreshToken: 'ref-dead' });
    const listener = vi.fn();
    const unsubscribe = subscribeAuth(listener);
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { status: 401, detail: 'Hết hạn' }))
      .mockResolvedValueOnce(jsonResponse(401, { status: 401, detail: 'Refresh token da het han' }));

    const error = await apiFetch('/me/sentences').catch((err: unknown) => err);
    unsubscribe();

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(401);
    expect(loadAuth()).toBeNull();
    expect(localStorage.getItem('moingay.auth.v1')).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
    // Không phát lại request gốc khi đã hết đường làm mới.
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('không làm mới khi 401 đến từ đường dẫn /auth/', async () => {
    saveAuth(USER, { accessToken: 'acc-old', refreshToken: 'ref-old' });
    fetchMock.mockResolvedValueOnce(jsonResponse(401, { detail: 'Email hoac mat khau khong dung' }));

    const error = await apiFetch('/auth/login', { method: 'POST', body: '{}', auth: false }).catch(
      (err: unknown) => err,
    );

    expect((error as ApiError).status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    // Phiên đang có không bị vạ lây vì một lần gõ sai mật khẩu.
    expect(getAccessToken()).toBe('acc-old');
  });

  it('không làm mới khi chưa có phiên nào', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(401, { status: 401 }));

    const error = await apiFetch('/me/sentences').catch((err: unknown) => err);

    expect((error as ApiError).status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('máy chủ lỗi 5xx lúc làm mới thì giữ phiên để thử lại sau', async () => {
    saveAuth(USER, { accessToken: 'acc-old', refreshToken: 'ref-old' });
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { status: 401 }))
      .mockResolvedValueOnce(new Response('Service Unavailable', { status: 503 }));

    const error = await apiFetch('/me/sentences').catch((err: unknown) => err);

    expect((error as ApiError).status).toBe(401);
    expect(getRefreshToken()).toBe('ref-old');
  });

  it('request đang bay lúc token vừa được làm mới thì chỉ phát lại, không làm mới nữa', async () => {
    saveAuth(USER, { accessToken: 'acc-old', refreshToken: 'ref-old' });
    fetchMock
      .mockImplementationOnce(() => {
        // Trong lúc request này chờ, một nơi khác đã lưu token mới.
        saveAuth(USER, { accessToken: 'acc-new', refreshToken: 'ref-new' });
        return Promise.resolve(jsonResponse(401, { status: 401 }));
      })
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));

    await expect(apiFetch('/me/sentences')).resolves.toEqual({ ok: true });

    const calls = sentCalls(fetchMock);
    expect(calls).toHaveLength(2);
    expect(calls[1].headers.get('Authorization')).toBe('Bearer acc-new');
  });
});

describe('refreshSession', () => {
  it('trả null khi không có refresh token và không gọi mạng', async () => {
    await expect(refreshSession()).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('lưu cả người dùng mới lẫn cặp token mới', async () => {
    saveAuth({ ...USER, displayName: 'Tên cũ' }, { accessToken: 'a', refreshToken: 'r' });
    fetchMock.mockResolvedValueOnce(jsonResponse(200, authResponse('a2', 'r2')));

    await expect(refreshSession()).resolves.toEqual({ accessToken: 'a2', refreshToken: 'r2' });
    expect(loadAuth()?.user.displayName).toBe('Quản trị viên');
  });
});

describe('describeApiError', () => {
  it('ưu tiên detail, rồi title, rồi message', () => {
    expect(describeApiError(new ApiError(404, { detail: 'Không tìm thấy', title: 'Lỗi' }))).toBe(
      'Không tìm thấy',
    );
    expect(describeApiError(new ApiError(404, { title: 'Không tìm thấy' }))).toBe('Không tìm thấy');
    expect(describeApiError(new ApiError(500, undefined, 'Hỏng rồi'))).toBe('Hỏng rồi');
    expect(describeApiError(new ApiError(500))).toBe('HTTP 500');
  });

  it('bỏ qua bảng lỗi rỗng để rơi về detail', () => {
    expect(describeApiError(new ApiError(400, { errors: {}, detail: 'Thiếu dữ liệu' }))).toBe(
      'Thiếu dữ liệu',
    );
  });

  it('nói được cả lỗi thường và giá trị lạ', () => {
    expect(describeApiError(new Error('Lỗi thường'))).toBe('Lỗi thường');
    expect(describeApiError(new TypeError('Failed to fetch'))).toBe(NETWORK_ERROR_MESSAGE);
    expect(describeApiError('gì đó')).toBe('Đã xảy ra lỗi không rõ');
    expect(describeApiError(undefined)).toBe('Đã xảy ra lỗi không rõ');
  });
});
