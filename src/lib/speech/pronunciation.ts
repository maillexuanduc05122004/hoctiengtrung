import type { AnswerVerdict } from '../../types/study.ts';
import { createSpeechRecognizer } from './recognition.ts';

/**
 * Chấm phần luyện nói. Tách thành "provider" để sau này cắm thêm dịch vụ chấm phát âm
 * thật mà không phải sửa màn hình luyện nói.
 */

export interface PronunciationInput {
  expectedHanzi: string;
  expectedPinyin: string;
  transcript: string;
}

export interface PronunciationAssessment {
  providerId: string;
  transcript: string;
  verdict: AnswerVerdict;
  /** Giải thích trung thực bằng tiếng Việt. */
  detail: string;
  /** Web Speech API không cho điểm phát âm, nên luôn null với provider mặc định. */
  scores: { accuracy: number; fluency: number; completeness: number } | null;
}

export interface PronunciationProvider {
  id: string;
  displayName: string;
  /** Provider có dùng được trên thiết bị hiện tại không. */
  isAvailable(): boolean;
  /** Provider có trả điểm phát âm chi tiết không. */
  providesScores(): boolean;
  assess(input: PronunciationInput): Promise<PronunciationAssessment>;
}

export const WEB_SPEECH_PROVIDER_ID = 'web-speech';
export const REMOTE_PROVIDER_ID = 'remote-scoring';

/**
 * Không đặt hạn chờ thì một máy chủ treo sẽ giữ lời hứa mãi mãi và màn hình luyện nói
 * kẹt ở trạng thái "đang chấm" cho tới khi người học tải lại trang.
 */
const REQUEST_TIMEOUT_MS = 15000;

const TIMEOUT_MESSAGE = 'Dịch vụ chấm phát âm không phản hồi kịp, hãy thử lại.';

/**
 * Câu này phải có trong mọi nhận xét: người học cần biết đây chỉ là kết quả "máy nghe ra
 * chữ gì", không phải điểm phát âm hay điểm thanh điệu.
 */
const HONESTY_NOTE =
  'Đây chỉ là kiểm tra xem hệ thống có nghe ra đúng từ hay không, không phải điểm phát âm hay điểm thanh điệu.';

/** Dấu câu tiếng Trung lẫn tiếng Latinh đều bị bỏ trước khi so, kể cả khoảng trắng. */
const PUNCTUATION_PATTERN =
  /[\s。，、；：？！…—～·「」『』（）〈〉《》【】“”‘’.,;:?!()[\]{}"'\-_]/g;

/** Chuẩn hoá để so chữ: bỏ dấu câu, bỏ khoảng trắng, hạ chữ thường phần chữ Latinh. */
function normalizeHanzi(text: string): string {
  return text.normalize('NFKC').replace(PUNCTUATION_PATTERN, '').toLowerCase();
}

/** Khoảng cách Levenshtein theo ký tự, để phân biệt "lệch ít" với "sai hẳn". */
function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let previous = Array.from({ length: b.length + 1 }, (_unused, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost);
    }
    previous = current;
  }
  return previous[b.length];
}

/**
 * Bao hàm chỉ đáng tính là "gần đúng" khi hai chuỗi xấp xỉ bằng nhau. Nếu không,
 * một từ một chữ như 的 sẽ "gần đúng" với bất kỳ câu dài nào có chứa chữ đó.
 */
function isNearLength(expected: string, heard: string): boolean {
  const shorter = Math.min(expected.length, heard.length);
  const longer = Math.max(expected.length, heard.length);
  return longer - shorter <= 2 && shorter * 2 >= longer;
}

function judge(expected: string, heard: string): AnswerVerdict {
  if (heard === '' || expected === '') return 'wrong';
  if (heard === expected) return 'correct';
  // Máy hay nghe dư một hai chữ đệm, nên bao hàm ở mức đó vẫn tính là gần đúng.
  if ((heard.includes(expected) || expected.includes(heard)) && isNearLength(expected, heard)) {
    return 'close';
  }
  // Với từ một chữ, lệch một ký tự đã là từ khác; chỉ nới tay cho từ từ hai chữ trở lên.
  if (expected.length >= 2 && editDistance(expected, heard) <= 1) return 'close';
  return 'wrong';
}

function describe(verdict: AnswerVerdict, input: PronunciationInput): string {
  const heard = input.transcript.trim();
  const expected = `${input.expectedHanzi} (${input.expectedPinyin})`;
  if (heard === '') {
    return `Chưa nghe được nội dung nào. Từ cần đọc là ${expected}. ${HONESTY_NOTE}`;
  }
  if (verdict === 'correct') {
    return `Hệ thống nghe được “${heard}”, đúng với ${expected}. ${HONESTY_NOTE}`;
  }
  if (verdict === 'close') {
    return `Hệ thống nghe được “${heard}”, gần đúng với ${expected}. ${HONESTY_NOTE}`;
  }
  return `Hệ thống nghe được “${heard}”, khác với ${expected}. ${HONESTY_NOTE}`;
}

export function createWebSpeechProvider(): PronunciationProvider {
  return {
    id: WEB_SPEECH_PROVIDER_ID,
    displayName: 'Nhận dạng của trình duyệt',
    isAvailable(): boolean {
      return createSpeechRecognizer().isSupported();
    },
    providesScores(): boolean {
      return false;
    },
    assess(input: PronunciationInput): Promise<PronunciationAssessment> {
      const verdict = judge(normalizeHanzi(input.expectedHanzi), normalizeHanzi(input.transcript));
      return Promise.resolve({
        providerId: WEB_SPEECH_PROVIDER_ID,
        transcript: input.transcript.trim(),
        verdict,
        detail: describe(verdict, input),
        // Không bịa điểm: Web Speech API không trả về bất kỳ chỉ số phát âm nào.
        scores: null,
      });
    },
  };
}

interface RemoteScores {
  accuracy: number;
  fluency: number;
  completeness: number;
}

function isVerdict(value: unknown): value is AnswerVerdict {
  return value === 'correct' || value === 'close' || value === 'wrong';
}

/** JSON.parse('1e999') cho ra Infinity nên `typeof === 'number'` chưa đủ để tin. */
function isScore(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function parseScores(value: unknown): RemoteScores | null {
  if (typeof value !== 'object' || value === null) return null;
  const raw: Record<string, unknown> = { ...value };
  const { accuracy, fluency, completeness } = raw;
  if (!isScore(accuracy) || !isScore(fluency) || !isScore(completeness)) return null;
  return { accuracy, fluency, completeness };
}

/** Không tin dữ liệu từ máy chủ ngoài: thiếu trường bắt buộc thì coi như lỗi. */
function parseRemoteAssessment(
  payload: unknown,
  fallbackTranscript: string,
): PronunciationAssessment {
  if (typeof payload !== 'object' || payload === null) {
    throw new Error('Dịch vụ chấm phát âm trả về dữ liệu không đọc được.');
  }
  const raw: Record<string, unknown> = { ...payload };
  if (!isVerdict(raw.verdict)) {
    throw new Error('Dịch vụ chấm phát âm trả về kết quả không hợp lệ.');
  }
  return {
    providerId: REMOTE_PROVIDER_ID,
    transcript: typeof raw.transcript === 'string' ? raw.transcript : fallbackTranscript,
    verdict: raw.verdict,
    detail: typeof raw.detail === 'string' ? raw.detail : 'Kết quả do dịch vụ chấm phát âm trả về.',
    scores: parseScores(raw.scores),
  };
}

/**
 * Chỗ cắm sẵn cho dịch vụ chấm phát âm chạy qua backend riêng.
 *
 * QUY TẮC BẢO MẬT: mã nguồn frontend TUYỆT ĐỐI không chứa và không nhận khoá API.
 * `endpoint` phải trỏ tới máy chủ trung gian do người vận hành tự dựng và tự giữ khoá;
 * ở đây chỉ gửi đi văn bản (và về sau là dữ liệu âm thanh) cần chấm.
 */
export function createRemotePronunciationProvider(
  endpoint: string,
  fetchImpl?: typeof fetch,
): PronunciationProvider {
  const url = endpoint.trim();
  // `fetch` mất ngữ cảnh khi bị tách khỏi window nên phải buộc lại.
  const send: typeof fetch | null =
    fetchImpl ?? (typeof fetch === 'function' ? fetch.bind(globalThis) : null);

  function isAvailable(): boolean {
    return url !== '' && send !== null;
  }

  return {
    id: REMOTE_PROVIDER_ID,
    displayName: 'Dịch vụ chấm phát âm ngoài',
    isAvailable,
    providesScores(): boolean {
      return true;
    },
    async assess(input: PronunciationInput): Promise<PronunciationAssessment> {
      if (send === null || !isAvailable()) {
        throw new Error('Chưa cấu hình dịch vụ chấm phát âm ngoài.');
      }
      const controller = new AbortController();
      const timer = setTimeout(() => {
        controller.abort();
      }, REQUEST_TIMEOUT_MS);
      try {
        const response = await send(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            expectedHanzi: input.expectedHanzi,
            expectedPinyin: input.expectedPinyin,
            transcript: input.transcript,
          }),
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Dịch vụ chấm phát âm trả về lỗi ${response.status}.`);
        }
        const payload: unknown = await response.json();
        return parseRemoteAssessment(payload, input.transcript.trim());
      } catch (error) {
        // Lỗi do hết hạn chờ được dịch sang tiếng Việt; các lỗi khác giữ nguyên để dễ soi.
        if (controller.signal.aborted) throw new Error(TIMEOUT_MESSAGE, { cause: error });
        throw error;
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
