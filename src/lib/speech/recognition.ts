import type { SpeechRecognitionConstructor, SpeechRecognitionLike } from './types.ts';

/**
 * Lớp bọc phần nhận dạng giọng nói của Web Speech API.
 * Không phụ thuộc React; mọi kết quả trả về qua các hàm gọi lại.
 */

export interface RecognitionUpdate {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface RecognitionHandlers {
  onResult(update: RecognitionUpdate): void;
  onError(code: string, message: string): void;
  onEnd(): void;
  onStart?(): void;
}

export interface SpeechRecognizer {
  isSupported(): boolean;
  /** Bắt đầu nghe. Chỉ được gọi sau khi người dùng bấm nút. */
  start(lang: string, handlers: RecognitionHandlers): void;
  stop(): void;
  abort(): void;
  isListening(): boolean;
}

const NOT_SUPPORTED_CODE = 'not-supported';

const NOT_SUPPORTED_MESSAGE =
  'Trình duyệt này không hỗ trợ nhận dạng giọng nói. Hãy dùng Chrome hoặc Edge trên máy tính, hoặc Safari trên iPhone.';

const START_FAILED_CODE = 'start-failed';

const START_FAILED_MESSAGE = 'Không khởi động được micro. Hãy thử bấm nút lại sau vài giây.';

const BUSY_CODE = 'busy';

const BUSY_MESSAGE = 'Đang nghe lượt trước, hãy chờ lượt này kết thúc rồi bấm lại.';

/** Chờ tối đa từng này sau 'error' rồi tự coi lượt nghe đã kết thúc. */
const END_AFTER_ERROR_MS = 1500;

/**
 * Sau khi người học bấm dừng, trình duyệt còn cần chút thời gian để chốt kết quả cuối,
 * nên hạn chờ ở đây rộng hơn hạn sau lỗi.
 */
const END_AFTER_STOP_MS = 5000;

/** abort() là bỏ hẳn lượt nghe, không phải chờ kết quả, nên chốt nhanh. */
const END_AFTER_ABORT_MS = 1500;

/** Thông báo tiếng Việt cho các mã lỗi chuẩn của Web Speech API. */
const ERROR_MESSAGES: Readonly<Record<string, string>> = {
  'no-speech': 'Không nghe thấy tiếng nói nào. Hãy bấm nút rồi đọc to hơn một chút.',
  'audio-capture': 'Không tìm thấy micro. Hãy kiểm tra lại thiết bị thu âm.',
  'not-allowed': 'Trang chưa được cấp quyền dùng micro. Hãy bật quyền trong cài đặt trình duyệt.',
  'service-not-allowed': 'Dịch vụ nhận dạng giọng nói đang bị chặn trên thiết bị này.',
  network: 'Nhận dạng giọng nói cần mạng, hiện chưa kết nối được.',
  aborted: 'Lượt nghe đã dừng giữa chừng.',
  'language-not-supported': 'Trình duyệt chưa hỗ trợ nhận dạng ngôn ngữ này.',
  'bad-grammar': 'Cấu hình nhận dạng không hợp lệ.',
};

function messageForCode(code: string, browserMessage?: string): string {
  // Tra bằng hasOwn: `ERROR_MESSAGES['toString']` sẽ lấy nhầm hàm của Object.prototype
  // và trả ra một giá trị không phải chuỗi cho giao diện.
  const known = Object.hasOwn(ERROR_MESSAGES, code) ? ERROR_MESSAGES[code] : undefined;
  if (known) return known;
  const extra = browserMessage?.trim();
  return extra ? `Nhận dạng giọng nói gặp lỗi: ${extra}` : 'Nhận dạng giọng nói gặp lỗi không rõ nguyên nhân.';
}

function resolveWindow(win?: Window | null): Window | null {
  // Truyền thẳng `null` nghĩa là "coi như không hỗ trợ", khác với không truyền gì.
  if (win !== undefined) return win;
  return typeof window === 'undefined' ? null : window;
}

function resolveConstructor(win: Window | null): SpeechRecognitionConstructor | null {
  if (win === null) return null;
  return win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null;
}

/** Một lượt nghe đang chạy. Gom vào một chỗ để stop()/abort() cũng hẹn được giờ thoát kẹt. */
interface Session {
  readonly recognition: SpeechRecognitionLike;
  readonly handlers: RecognitionHandlers;
  ended: boolean;
  guard: ReturnType<typeof setTimeout> | null;
  guardWaitMs: number;
}

export function createSpeechRecognizer(win?: Window | null): SpeechRecognizer {
  const target = resolveWindow(win);
  // Chỉ giữ tham chiếu tới hàm dựng, KHÔNG khởi tạo ở đây: khởi tạo sớm khiến trình duyệt
  // xin quyền micro trước khi người học bấm nút.
  let session: Session | null = null;

  function isSupported(): boolean {
    return resolveConstructor(target) !== null;
  }

  function finish(active: Session): void {
    if (active.ended) return;
    active.ended = true;
    if (active.guard !== null) {
      clearTimeout(active.guard);
      active.guard = null;
    }
    // Lượt cũ kết thúc muộn không được xoá lượt mới đang nghe.
    if (session === active) session = null;
    active.handlers.onEnd();
  }

  /**
   * Hẹn giờ thoát kẹt cho lượt nghe: nếu trình duyệt không bắn 'end' thì tự chốt.
   * Chỉ đặt lại khi hạn mới sớm hơn hạn đang chờ, để stop() không đẩy lùi hạn của lỗi.
   */
  function armEndGuard(active: Session, waitMs: number): void {
    if (active.ended) return;
    if (active.guard !== null) {
      if (waitMs >= active.guardWaitMs) return;
      clearTimeout(active.guard);
    }
    active.guardWaitMs = waitMs;
    active.guard = setTimeout(() => {
      active.guard = null;
      try {
        // Trả micro lại cho hệ thống trước khi coi như lượt nghe đã xong.
        active.recognition.abort();
      } catch {
        // Huỷ một lượt nghe đã chết là vô hại.
      }
      finish(active);
    }, waitMs);
  }

  function start(lang: string, handlers: RecognitionHandlers): void {
    // Gọi start() hai lần liên tiếp làm trình duyệt ném InvalidStateError. Vẫn phải trả lời
    // người gọi: im lặng bỏ qua thì giao diện chờ mãi một sự kiện không bao giờ tới.
    if (session !== null) {
      handlers.onError(BUSY_CODE, BUSY_MESSAGE);
      handlers.onEnd();
      return;
    }

    const Recognition = resolveConstructor(target);
    if (Recognition === null) {
      handlers.onError(NOT_SUPPORTED_CODE, NOT_SUPPORTED_MESSAGE);
      handlers.onEnd();
      return;
    }

    const recognition = new Recognition();
    const active: Session = {
      recognition,
      handlers,
      ended: false,
      guard: null,
      guardWaitMs: Number.POSITIVE_INFINITY,
    };
    recognition.lang = lang;
    // Một lượt nghe ứng với một câu trả lời; bản nháp giúp hiện chữ ngay khi người học nói.
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      handlers.onStart?.();
    };

    recognition.onresult = (event) => {
      const { results } = event;
      for (let i = event.resultIndex; i < results.length; i += 1) {
        const result = results[i];
        if (!result || result.length === 0) continue;
        const alternative = result[0];
        if (!alternative) continue;
        handlers.onResult({
          transcript: alternative.transcript.trim(),
          confidence: alternative.confidence,
          isFinal: result.isFinal,
        });
      }
    };

    recognition.onerror = (event) => {
      handlers.onError(event.error, messageForCode(event.error, event.message));
      // Đa số trình duyệt bắn 'end' ngay sau 'error', nhưng không phải máy nào cũng vậy;
      // thiếu 'end' thì lượt nghe kẹt lại và nút micro chết hẳn tới khi tải lại trang.
      armEndGuard(active, END_AFTER_ERROR_MS);
    };

    // Đường kết thúc bình thường: dọn dẹp một lần duy nhất ở đây.
    recognition.onend = () => {
      finish(active);
    };

    session = active;
    try {
      recognition.start();
    } catch {
      handlers.onError(START_FAILED_CODE, START_FAILED_MESSAGE);
      finish(active);
    }
  }

  function stop(): void {
    const active = session;
    if (active === null) return;
    try {
      active.recognition.stop();
    } catch {
      // Dừng khi đã dừng rồi không phải lỗi đáng báo.
    }
    // Một số WebView trên Android không bắn 'end' sau stop(); không hẹn giờ thì nút micro
    // kẹt ở trạng thái đang nghe vĩnh viễn.
    armEndGuard(active, END_AFTER_STOP_MS);
  }

  function abort(): void {
    const active = session;
    if (active === null) return;
    try {
      active.recognition.abort();
    } catch {
      // Như trên: huỷ một lượt nghe đã kết thúc là vô hại.
    }
    armEndGuard(active, END_AFTER_ABORT_MS);
  }

  function isListening(): boolean {
    return session !== null;
  }

  return { isSupported, start, stop, abort, isListening };
}
