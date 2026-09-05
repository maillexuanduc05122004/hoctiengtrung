import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSpeechRecognizer } from './recognition.ts';
import type {
  SpeechRecognitionConstructor,
  SpeechRecognitionEventLike,
  SpeechRecognitionLike,
} from './types.ts';

/** Mọi đối tượng nhận dạng được tạo ra trong một bài test, để đếm số lần khởi tạo. */
const created: FakeRecognition[] = [];

class FakeRecognition implements SpeechRecognitionLike {
  lang = '';
  continuous = false;
  interimResults = false;
  maxAlternatives = 0;
  onstart: (() => void) | null = null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null = null;
  onerror: ((event: { error: string; message?: string }) => void) | null = null;
  onend: (() => void) | null = null;

  startCalls = 0;
  stopCalls = 0;
  abortCalls = 0;

  constructor() {
    created.push(this);
  }

  start(): void {
    this.startCalls += 1;
    this.onstart?.();
  }

  stop(): void {
    this.stopCalls += 1;
  }

  abort(): void {
    this.abortCalls += 1;
  }

  emitResult(transcript: string, confidence: number, isFinal: boolean): void {
    this.onresult?.({
      resultIndex: 0,
      results: { 0: { 0: { transcript, confidence }, length: 1, isFinal }, length: 1 },
    });
  }

  emitError(code: string, message?: string): void {
    this.onerror?.({ error: code, message });
  }

  emitEnd(): void {
    this.onend?.();
  }
}

class ThrowingRecognition extends FakeRecognition {
  override start(): void {
    throw new Error('micro đang bận');
  }
}

/** Adapter chỉ đọc hai thuộc tính này của window nên không cần dựng cả DOM thật. */
function fakeWindow(ctor?: SpeechRecognitionConstructor): Window {
  const scope: Partial<Window> = {};
  if (ctor) scope.webkitSpeechRecognition = ctor;
  return scope as Window;
}

function makeHandlers() {
  return {
    onResult: vi.fn(),
    onError: vi.fn(),
    onEnd: vi.fn(),
    onStart: vi.fn(),
  };
}

beforeEach(() => {
  created.length = 0;
});

afterEach(() => {
  vi.useRealTimers();
});

describe('createSpeechRecognizer khi trình duyệt không hỗ trợ', () => {
  it('trả isSupported() false và start() báo lỗi not-supported rồi kết thúc', () => {
    const recognizer = createSpeechRecognizer(fakeWindow());
    const handlers = makeHandlers();

    expect(recognizer.isSupported()).toBe(false);
    expect(() => {
      recognizer.start('zh-CN', handlers);
    }).not.toThrow();

    expect(handlers.onError).toHaveBeenCalledTimes(1);
    const [code, message] = handlers.onError.mock.calls[0];
    expect(code).toBe('not-supported');
    expect(message).toContain('không hỗ trợ nhận dạng giọng nói');
    expect(handlers.onEnd).toHaveBeenCalledTimes(1);
    expect(recognizer.isListening()).toBe(false);
  });

  it('stop() và abort() không ném lỗi khi chưa từng nghe', () => {
    const recognizer = createSpeechRecognizer(null);

    expect(() => {
      recognizer.stop();
      recognizer.abort();
    }).not.toThrow();
  });
});

describe('createSpeechRecognizer khi trình duyệt hỗ trợ', () => {
  it('không khởi tạo đối tượng nhận dạng trước khi start() được gọi', () => {
    const recognizer = createSpeechRecognizer(fakeWindow(FakeRecognition));
    expect(recognizer.isSupported()).toBe(true);
    expect(created).toHaveLength(0);

    recognizer.start('zh-CN', makeHandlers());
    expect(created).toHaveLength(1);
  });

  it('đặt đúng ngôn ngữ và bật kết quả nháp', () => {
    const recognizer = createSpeechRecognizer(fakeWindow(FakeRecognition));
    const handlers = makeHandlers();

    recognizer.start('zh-CN', handlers);

    const instance = created[0];
    expect(instance.lang).toBe('zh-CN');
    expect(instance.interimResults).toBe(true);
    expect(instance.continuous).toBe(false);
    expect(instance.startCalls).toBe(1);
    expect(handlers.onStart).toHaveBeenCalledTimes(1);
    expect(recognizer.isListening()).toBe(true);
  });

  it('chuyển kết quả nhận dạng ra ngoài rồi kết thúc lượt nghe', () => {
    const recognizer = createSpeechRecognizer(fakeWindow(FakeRecognition));
    const handlers = makeHandlers();
    recognizer.start('zh-CN', handlers);

    created[0].emitResult('  你好  ', 0.82, true);
    created[0].emitEnd();

    expect(handlers.onResult).toHaveBeenCalledWith({
      transcript: '你好',
      confidence: 0.82,
      isFinal: true,
    });
    expect(handlers.onEnd).toHaveBeenCalledTimes(1);
    expect(recognizer.isListening()).toBe(false);
  });

  it('dịch mã lỗi của trình duyệt sang thông báo tiếng Việt', () => {
    const recognizer = createSpeechRecognizer(fakeWindow(FakeRecognition));
    const handlers = makeHandlers();
    recognizer.start('zh-CN', handlers);

    created[0].emitError('not-allowed');

    const [code, message] = handlers.onError.mock.calls[0];
    expect(code).toBe('not-allowed');
    expect(message).toContain('micro');
    created[0].emitEnd();
  });

  it('giữ nguyên mã lạ và kèm mô tả của trình duyệt', () => {
    const recognizer = createSpeechRecognizer(fakeWindow(FakeRecognition));
    const handlers = makeHandlers();
    recognizer.start('zh-CN', handlers);

    created[0].emitError('unknown-code', 'engine crashed');

    const [code, message] = handlers.onError.mock.calls[0];
    expect(code).toBe('unknown-code');
    expect(message).toContain('engine crashed');
    created[0].emitEnd();
  });

  it('không tạo lượt nghe thứ hai để trình duyệt không ném InvalidStateError', () => {
    const recognizer = createSpeechRecognizer(fakeWindow(FakeRecognition));
    recognizer.start('zh-CN', makeHandlers());
    recognizer.start('zh-CN', makeHandlers());

    expect(created).toHaveLength(1);
    created[0].emitEnd();
  });

  it('vẫn trả lời người gọi khi lượt trước còn đang nghe', () => {
    // Bỏ qua hoàn toàn thì màn hình gọi start() sẽ chờ mãi một sự kiện không bao giờ tới.
    const recognizer = createSpeechRecognizer(fakeWindow(FakeRecognition));
    recognizer.start('zh-CN', makeHandlers());
    const second = makeHandlers();

    recognizer.start('zh-CN', second);

    expect(second.onError.mock.calls[0][0]).toBe('busy');
    expect(second.onEnd).toHaveBeenCalledTimes(1);
    // Lượt đang chạy không bị cắt ngang.
    expect(recognizer.isListening()).toBe(true);
    created[0].emitEnd();
  });

  it('chuyển tiếp stop() và abort() tới đối tượng đang nghe', () => {
    const recognizer = createSpeechRecognizer(fakeWindow(FakeRecognition));
    recognizer.start('zh-CN', makeHandlers());

    recognizer.stop();
    recognizer.abort();

    expect(created[0].stopCalls).toBe(1);
    expect(created[0].abortCalls).toBe(1);
    created[0].emitEnd();
  });

  it('không kẹt khi người học bấm dừng mà trình duyệt không bắn end', () => {
    vi.useFakeTimers();
    const recognizer = createSpeechRecognizer(fakeWindow(FakeRecognition));
    const handlers = makeHandlers();
    recognizer.start('zh-CN', handlers);

    recognizer.stop();
    expect(recognizer.isListening()).toBe(true);
    vi.advanceTimersByTime(10_000);

    expect(handlers.onEnd).toHaveBeenCalledTimes(1);
    expect(recognizer.isListening()).toBe(false);
    // Micro phải được trả lại cho hệ thống chứ không bỏ mặc.
    expect(created[0].abortCalls).toBe(1);
  });

  it('không tự chốt sớm khi end tới đúng lúc sau stop()', () => {
    vi.useFakeTimers();
    const recognizer = createSpeechRecognizer(fakeWindow(FakeRecognition));
    const handlers = makeHandlers();
    recognizer.start('zh-CN', handlers);

    recognizer.stop();
    created[0].emitEnd();
    vi.advanceTimersByTime(10_000);

    expect(handlers.onEnd).toHaveBeenCalledTimes(1);
    expect(created[0].abortCalls).toBe(0);
  });

  it('báo lỗi tử tế khi trình duyệt không mở được micro', () => {
    const recognizer = createSpeechRecognizer(fakeWindow(ThrowingRecognition));
    const handlers = makeHandlers();

    expect(() => {
      recognizer.start('zh-CN', handlers);
    }).not.toThrow();

    expect(handlers.onError.mock.calls[0][0]).toBe('start-failed');
    expect(handlers.onEnd).toHaveBeenCalledTimes(1);
    expect(recognizer.isListening()).toBe(false);
  });

  it('vẫn trả thông báo dạng chuỗi khi mã lỗi trùng tên thuộc tính của Object', () => {
    const recognizer = createSpeechRecognizer(fakeWindow(FakeRecognition));
    const handlers = makeHandlers();
    recognizer.start('zh-CN', handlers);

    created[0].emitError('toString');

    const [code, message] = handlers.onError.mock.calls[0];
    expect(code).toBe('toString');
    expect(typeof message).toBe('string');
    created[0].emitEnd();
  });

  it('tự thoát kẹt khi trình duyệt báo lỗi nhưng không bắn end', () => {
    vi.useFakeTimers();
    const recognizer = createSpeechRecognizer(fakeWindow(FakeRecognition));
    const handlers = makeHandlers();
    recognizer.start('zh-CN', handlers);

    created[0].emitError('network');
    vi.advanceTimersByTime(5000);

    expect(handlers.onEnd).toHaveBeenCalledTimes(1);
    expect(recognizer.isListening()).toBe(false);
    // Không tự thoát kẹt thì nút micro chết hẳn cho tới khi tải lại trang.
    recognizer.start('zh-CN', makeHandlers());
    expect(created).toHaveLength(2);
  });

  it('chỉ gọi onEnd một lần khi end đến ngay sau error', () => {
    vi.useFakeTimers();
    const recognizer = createSpeechRecognizer(fakeWindow(FakeRecognition));
    const handlers = makeHandlers();
    recognizer.start('zh-CN', handlers);

    created[0].emitError('no-speech');
    created[0].emitEnd();
    vi.advanceTimersByTime(5000);

    expect(handlers.onEnd).toHaveBeenCalledTimes(1);
  });

  it('cho phép nghe lại sau khi lượt trước kết thúc', () => {
    const recognizer = createSpeechRecognizer(fakeWindow(FakeRecognition));
    recognizer.start('zh-CN', makeHandlers());
    created[0].emitEnd();

    recognizer.start('zh-CN', makeHandlers());

    expect(created).toHaveLength(2);
    expect(recognizer.isListening()).toBe(true);
  });
});
