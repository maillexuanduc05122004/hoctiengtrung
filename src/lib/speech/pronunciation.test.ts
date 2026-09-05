import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createRemotePronunciationProvider,
  createWebSpeechProvider,
  type PronunciationInput,
} from './pronunciation.ts';
import type { SpeechRecognitionEventLike, SpeechRecognitionLike } from './types.ts';

/** Đủ để `isSupported()` thấy trình duyệt có hỗ trợ, không cần chạy thật. */
class StubRecognition implements SpeechRecognitionLike {
  lang = '';
  continuous = false;
  interimResults = false;
  maxAlternatives = 0;
  onstart: (() => void) | null = null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null = null;
  onerror: ((event: { error: string; message?: string }) => void) | null = null;
  onend: (() => void) | null = null;
  start(): void {}
  stop(): void {}
  abort(): void {}
}

function input(overrides: Partial<PronunciationInput> = {}): PronunciationInput {
  return {
    expectedHanzi: '你好',
    expectedPinyin: 'nǐ hǎo',
    transcript: '你好',
    ...overrides,
  };
}

/** Response giả: chỉ dùng ba thành phần mà provider thực sự đọc. */
function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

afterEach(() => {
  Reflect.deleteProperty(window, 'webkitSpeechRecognition');
});

describe('createWebSpeechProvider', () => {
  it('không bao giờ trả điểm phát âm', async () => {
    const provider = createWebSpeechProvider();

    expect(provider.providesScores()).toBe(false);
    const correct = await provider.assess(input());
    const wrong = await provider.assess(input({ transcript: '再见' }));
    const close = await provider.assess(input({ transcript: '你好吗' }));

    expect(correct.scores).toBeNull();
    expect(wrong.scores).toBeNull();
    expect(close.scores).toBeNull();
  });

  it('trả correct khi transcript trùng đáp án', async () => {
    const result = await createWebSpeechProvider().assess(input());

    expect(result.verdict).toBe('correct');
    expect(result.transcript).toBe('你好');
    expect(result.providerId).toBe('web-speech');
  });

  it('bỏ dấu câu tiếng Trung trước khi so', async () => {
    const result = await createWebSpeechProvider().assess(input({ transcript: '你好。' }));

    expect(result.verdict).toBe('correct');
  });

  it('trả wrong khi transcript khác hẳn', async () => {
    const result = await createWebSpeechProvider().assess(input({ transcript: '再见' }));

    expect(result.verdict).toBe('wrong');
  });

  it('trả close khi máy nghe dư chữ', async () => {
    const result = await createWebSpeechProvider().assess(input({ transcript: '你好吗' }));

    expect(result.verdict).toBe('close');
  });

  it('không coi là gần đúng khi từ chỉ lọt vào giữa một câu dài', async () => {
    // Nếu chỉ xét bao hàm thì mọi câu có chữ 的 đều thành "gần đúng", nói dối người học.
    const result = await createWebSpeechProvider().assess(
      input({
        expectedHanzi: '的',
        expectedPinyin: 'de',
        transcript: '我不知道你在说什么的东西',
      }),
    );

    expect(result.verdict).toBe('wrong');
  });

  it('không coi là gần đúng khi người học chỉ đọc được một phần rất nhỏ', async () => {
    const result = await createWebSpeechProvider().assess(
      input({ expectedHanzi: '谢谢你', expectedPinyin: 'xiè xie nǐ', transcript: '你' }),
    );

    expect(result.verdict).toBe('wrong');
  });

  it('trả wrong khi không nghe được gì', async () => {
    const result = await createWebSpeechProvider().assess(input({ transcript: '   ' }));

    expect(result.verdict).toBe('wrong');
    expect(result.detail).toContain('Chưa nghe được nội dung nào');
  });

  it('nói rõ đây không phải điểm phát âm hay điểm thanh điệu', async () => {
    const provider = createWebSpeechProvider();

    for (const transcript of ['你好', '你好吗', '再见']) {
      const result = await provider.assess(input({ transcript }));
      expect(result.detail).toContain('không phải điểm phát âm hay điểm thanh điệu');
      // Không được bịa ra con số điểm nào trong lời nhận xét.
      expect(result.detail).not.toMatch(/\d+\s*(điểm|%)/);
    }
  });

  it('isAvailable() theo đúng khả năng của trình duyệt hiện tại', () => {
    const provider = createWebSpeechProvider();
    expect(provider.isAvailable()).toBe(false);

    window.webkitSpeechRecognition = StubRecognition;
    expect(provider.isAvailable()).toBe(true);
  });
});

describe('createRemotePronunciationProvider', () => {
  it('isAvailable() false khi endpoint rỗng', () => {
    expect(createRemotePronunciationProvider('').isAvailable()).toBe(false);
    expect(createRemotePronunciationProvider('   ').isAvailable()).toBe(false);
  });

  it('từ chối chấm khi chưa cấu hình endpoint', async () => {
    await expect(createRemotePronunciationProvider('').assess(input())).rejects.toThrow(
      'Chưa cấu hình',
    );
  });

  it('khả dụng và khai báo có chấm điểm khi đã có endpoint', () => {
    const provider = createRemotePronunciationProvider('https://vi-du.test/cham', vi.fn());

    expect(provider.isAvailable()).toBe(true);
    expect(provider.providesScores()).toBe(true);
  });

  it('chỉ gửi văn bản cần chấm, không kèm khoá API', async () => {
    const fetchImpl = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        jsonResponse({
          verdict: 'close',
          detail: 'Thanh điệu chữ thứ hai chưa xuống thấp.',
          scores: { accuracy: 72, fluency: 80, completeness: 100 },
        }),
      ),
    );
    const provider = createRemotePronunciationProvider('https://vi-du.test/cham', fetchImpl);

    const result = await provider.assess(input({ transcript: '你号' }));

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://vi-du.test/cham');
    expect(init?.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.stringify(init?.headers)).not.toMatch(/authorization|api[-_]?key/i);
    expect(JSON.parse(String(init?.body))).toEqual({
      expectedHanzi: '你好',
      expectedPinyin: 'nǐ hǎo',
      transcript: '你号',
    });
    expect(result.verdict).toBe('close');
    expect(result.scores).toEqual({ accuracy: 72, fluency: 80, completeness: 100 });
  });

  it('báo lỗi khi máy chủ trả về mã lỗi', async () => {
    const fetchImpl = vi.fn<typeof fetch>(() => Promise.resolve(jsonResponse({}, 503)));

    await expect(
      createRemotePronunciationProvider('https://vi-du.test/cham', fetchImpl).assess(input()),
    ).rejects.toThrow('503');
  });

  it('báo lỗi khi máy chủ trả về kết quả không hợp lệ', async () => {
    const fetchImpl = vi.fn<typeof fetch>(() =>
      Promise.resolve(jsonResponse({ verdict: 'tuyệt vời' })),
    );

    await expect(
      createRemotePronunciationProvider('https://vi-du.test/cham', fetchImpl).assess(input()),
    ).rejects.toThrow('không hợp lệ');
  });

  it('bỏ qua điểm số vô hạn hoặc NaN thay vì hiện ra màn hình', async () => {
    // JSON.parse('1e999') cho ra Infinity nên máy chủ hỏng vẫn lọt qua `typeof`.
    const fetchImpl = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        jsonResponse({
          verdict: 'correct',
          scores: { accuracy: Number.POSITIVE_INFINITY, fluency: 80, completeness: 100 },
        }),
      ),
    );

    const result = await createRemotePronunciationProvider(
      'https://vi-du.test/cham',
      fetchImpl,
    ).assess(input());

    expect(result.scores).toBeNull();
  });

  it('bỏ cuộc khi máy chủ treo, không để màn hình chờ mãi', async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn<typeof fetch>(
      (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new Error('AbortError'));
          });
        }),
    );

    const pending = createRemotePronunciationProvider(
      'https://vi-du.test/cham',
      fetchImpl,
    ).assess(input());
    const assertion = expect(pending).rejects.toThrow('không phản hồi kịp');
    await vi.advanceTimersByTimeAsync(20_000);
    await assertion;
    vi.useRealTimers();
  });

  it('bỏ qua điểm số sai kiểu thay vì tin theo máy chủ', async () => {
    const fetchImpl = vi.fn<typeof fetch>(() =>
      Promise.resolve(jsonResponse({ verdict: 'correct', detail: 'Tốt', scores: { accuracy: 90 } })),
    );

    const result = await createRemotePronunciationProvider(
      'https://vi-du.test/cham',
      fetchImpl,
    ).assess(input());

    expect(result.scores).toBeNull();
  });
});
