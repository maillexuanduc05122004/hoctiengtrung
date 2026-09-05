/**
 * Phần nhận dạng giọng nói của Web Speech API chưa có trong lib.dom của TypeScript,
 * nên khai báo tại đây theo chuẩn W3C. Chỉ khai báo đúng phần mà module này dùng,
 * để viết đối tượng giả trong kiểm thử không phải dựng lại cả DOM.
 */

export interface SpeechRecognitionAlternativeLike {
  readonly transcript: string;
  /** Trình duyệt có thể trả 0 khi không tự tin, giá trị này không phải điểm phát âm. */
  readonly confidence: number;
}

export interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  readonly length: number;
  readonly [index: number]: SpeechRecognitionAlternativeLike;
}

export interface SpeechRecognitionResultListLike {
  readonly length: number;
  readonly [index: number]: SpeechRecognitionResultLike;
}

export interface SpeechRecognitionEventLike {
  /** Vị trí kết quả mới đầu tiên trong `results`. */
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultListLike;
}

export interface SpeechRecognitionErrorEventLike {
  /** Mã lỗi chuẩn: 'no-speech', 'audio-capture', 'not-allowed', 'network', 'aborted'... */
  readonly error: string;
  /** Safari và một số bản WebKit không gửi trường này. */
  readonly message?: string;
}

export interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

export interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike;
}

declare global {
  interface Window {
    /** Bản chuẩn W3C, hiện mới có trên một số trình duyệt. */
    SpeechRecognition?: SpeechRecognitionConstructor;
    /** Bản tiền tố của Chrome, Edge và Safari. */
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}
