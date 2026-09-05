/**
 * Lớp bọc phần đọc văn bản của Web Speech API.
 * Không phụ thuộc React và không đụng tới DOM ngoài đối tượng `speechSynthesis`.
 */

export type SpeechLang = 'zh-CN' | 'vi-VN' | 'en-US';

export interface SpeakOptions {
  lang: SpeechLang;
  rate?: number;
  voiceUri?: string | null;
}

export interface TtsAdapter {
  isSupported(): boolean;
  /** Danh sách giọng đã tải; có thể rỗng ở lần gọi đầu trên một số trình duyệt. */
  listVoices(): SpeechSynthesisVoice[];
  /** Chọn giọng hợp nhất cho ngôn ngữ, ưu tiên voiceUri người dùng đã chọn. */
  pickVoice(lang: SpeechLang, preferredUri?: string | null): SpeechSynthesisVoice | null;
  speak(text: string, options: SpeakOptions): Promise<void>;
  /** Đọc lần lượt từng phần, dùng cho chế độ nghe từng âm tiết. */
  speakSequence(parts: readonly string[], options: SpeakOptions, gapMs?: number): Promise<void>;
  cancel(): void;
  /** Đăng ký lắng nghe khi danh sách giọng thay đổi; trả về hàm huỷ đăng ký. */
  onVoicesChanged(listener: () => void): () => void;
}

/** Web Speech API chỉ nhận tốc độ trong khoảng này, ngoài khoảng trình duyệt sẽ bỏ qua. */
const MIN_RATE = 0.5;
const MAX_RATE = 2;
const DEFAULT_RATE = 1;

/** Khoảng nghỉ mặc định giữa hai âm tiết khi nghe tách phần. */
const DEFAULT_GAP_MS = 350;

/**
 * Chrome đôi khi nuốt luôn sự kiện 'end' (nhất là khi tab mất tiêu điểm), nên phải có
 * hạn chờ để Promise không treo vĩnh viễn và giao diện không kẹt ở trạng thái "đang đọc".
 */
const TIMEOUT_BASE_MS = 4000;
const TIMEOUT_PER_CHAR_MS = 400;
const TIMEOUT_MAX_MS = 30000;

function clampRate(rate: number | undefined): number {
  if (typeof rate !== 'number' || !Number.isFinite(rate)) return DEFAULT_RATE;
  return Math.min(MAX_RATE, Math.max(MIN_RATE, rate));
}

function normalizeLang(lang: string): string {
  return lang.trim().toLowerCase().replace(/_/g, '-');
}

function primarySubtag(lang: string): string {
  return normalizeLang(lang).split('-')[0];
}

/**
 * Giọng Quảng Đông đọc sai hoàn toàn tiếng phổ thông. Phải xét từng thẻ con chứ không so
 * tiền tố: giọng Hồng Kông thường được gắn nhãn 'zh-Hant-HK', không phải 'zh-HK'.
 */
function isCantonese(normalized: string): boolean {
  const parts = normalized.split('-').filter((part) => part !== '');
  return parts.some((part) => part === 'yue' || part === 'hk' || part === 'mo');
}

/**
 * Vài bộ đọc (espeak trên Linux, một số engine Android) gắn nhãn tiếng phổ thông theo
 * ISO 639-3 là 'cmn' thay vì 'zh'; không quy về một mối thì máy có giọng vẫn bị coi như không.
 */
function canonicalMandarin(normalized: string): string {
  if (normalized === 'cmn') return 'zh';
  return normalized.startsWith('cmn-') ? `zh-${normalized.slice(4)}` : normalized;
}

/** Điểm càng cao càng hợp; -1 nghĩa là không dùng được cho ngôn ngữ này. */
function scoreVoice(voice: SpeechSynthesisVoice, lang: SpeechLang): number {
  const voiceLang = canonicalMandarin(normalizeLang(voice.lang ?? ''));
  const target = normalizeLang(lang);
  // Ưu tiên nhẹ giọng mặc định của hệ thống khi cùng một bậc phù hợp.
  const bonus = (voice.default ? 3 : 0) + (voice.localService ? 1 : 0);

  if (target === 'zh-cn') {
    if (isCantonese(voiceLang)) return -1;
    if (voiceLang.startsWith('zh-cn') || voiceLang.startsWith('zh-hans')) return 100 + bonus;
    if (voiceLang === 'zh') return 80 + bonus;
    // zh-TW, zh-SG vẫn là tiếng phổ thông nên chấp nhận khi không còn lựa chọn nào khác.
    if (voiceLang.startsWith('zh-')) return 60 + bonus;
    return -1;
  }

  if (voiceLang === target) return 100 + bonus;
  if (primarySubtag(voiceLang) === primarySubtag(target)) return 60 + bonus;
  return -1;
}

/** Trả `null` khi trình duyệt không có phần đọc văn bản, thay vì ném lỗi. */
function resolveDefaultSynth(): SpeechSynthesis | null {
  return typeof speechSynthesis === 'undefined' ? null : speechSynthesis;
}

/** Hàm dựng utterance nằm ở phạm vi toàn cục, đọc muộn để kiểm thử thay được. */
function hasUtteranceCtor(): boolean {
  return typeof SpeechSynthesisUtterance === 'function';
}

export function createTtsAdapter(synth?: SpeechSynthesis | null): TtsAdapter {
  // Truyền thẳng `null` nghĩa là "coi như không hỗ trợ", khác với không truyền gì.
  const engine: SpeechSynthesis | null = synth === undefined ? resolveDefaultSynth() : synth;
  // Tăng mỗi lần người học bấm dừng, để lượt đọc nối tiếp biết mình đã bị huỷ.
  let sequenceToken = 0;
  // Khoảng nghỉ giữa hai âm tiết đang chờ; phải kết thúc được từ bên ngoài, nếu không
  // bấm dừng xong giao diện vẫn kẹt ở trạng thái "đang đọc" tới hết khoảng nghỉ.
  let pendingGap: { timer: ReturnType<typeof setTimeout>; resolve: () => void } | null = null;

  /** Kết thúc ngay khoảng nghỉ đang chờ (nếu có) và giải phóng lời hứa của nó. */
  function endGap(): void {
    const gap = pendingGap;
    if (gap === null) return;
    pendingGap = null;
    clearTimeout(gap.timer);
    gap.resolve();
  }

  function waitGap(ms: number): Promise<void> {
    return new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        pendingGap = null;
        resolve();
      }, ms);
      pendingGap = { timer, resolve };
    });
  }

  function isSupported(): boolean {
    return engine !== null && hasUtteranceCtor();
  }

  function listVoices(): SpeechSynthesisVoice[] {
    if (engine === null) return [];
    try {
      // Trả bản sao: màn hình cài đặt hay sắp xếp danh sách này, không được sửa mảng của bộ đọc.
      return [...(engine.getVoices() ?? [])];
    } catch {
      // Một số WebView ném lỗi khi gọi trước lúc bộ tổng hợp sẵn sàng.
      return [];
    }
  }

  function pickVoice(lang: SpeechLang, preferredUri?: string | null): SpeechSynthesisVoice | null {
    const voices = listVoices();
    if (voices.length === 0) return null;

    if (preferredUri) {
      const chosen = voices.find((voice) => voice.voiceURI === preferredUri);
      // Chỉ tôn trọng lựa chọn đã lưu khi giọng đó thật sự đọc được ngôn ngữ đang cần:
      // voiceURI lưu từ máy khác có thể trỏ vào giọng Quảng Đông hoặc giọng tiếng Việt.
      if (chosen && scoreVoice(chosen, lang) >= 0) return chosen;
    }

    let best: SpeechSynthesisVoice | null = null;
    let bestScore = 0;
    for (const voice of voices) {
      const score = scoreVoice(voice, lang);
      if (score > bestScore) {
        best = voice;
        bestScore = score;
      }
    }
    return best;
  }

  /** Dừng bộ đọc mà KHÔNG tính là người học bấm dừng (dùng khi nối tiếp câu mới). */
  function stopEngine(): void {
    if (engine === null) return;
    try {
      engine.cancel();
    } catch {
      // Huỷ khi hàng đợi rỗng không phải lỗi đáng báo cho người học.
    }
  }

  function cancel(): void {
    // Đổi mã lượt để speakSequence đang chạy tự dừng, nếu không thì bấm dừng xong
    // các âm tiết còn lại vẫn đọc tiếp.
    sequenceToken += 1;
    endGap();
    stopEngine();
  }

  /**
   * Đọc một đoạn mà không đụng tới mã lượt, dùng cho từng phần của speakSequence.
   * Trả về `false` khi không phát ra tiếng nào (máy không hỗ trợ, hoặc đoạn rỗng).
   */
  function speakOne(text: string, options: SpeakOptions): Promise<boolean> {
    const content = text.trim();
    if (engine === null || !hasUtteranceCtor() || content === '') return Promise.resolve(false);

    // Không huỷ trước thì câu mới bị xếp hàng sau câu cũ, người học phải chờ rất lâu.
    stopEngine();

    return new Promise<boolean>((resolve) => {
      let settled = false;
      let timer: ReturnType<typeof setTimeout> | null = null;
      const finish = (): void => {
        if (settled) return;
        settled = true;
        if (timer !== null) clearTimeout(timer);
        resolve(true);
      };

      // Cả việc dựng utterance lẫn speak() đều có thể ném; hàm này không bao giờ được
      // reject, vì nơi gọi chỉ `await` để tắt trạng thái "đang đọc".
      try {
        const rate = clampRate(options.rate);
        const utterance = new SpeechSynthesisUtterance(content);
        utterance.lang = options.lang;
        utterance.rate = rate;
        const voice = pickVoice(options.lang, options.voiceUri);
        if (voice) utterance.voice = voice;
        utterance.addEventListener('end', finish, { once: true });
        // Lỗi cũng phải resolve: người học không cần biết bộ đọc gặp trục trặc gì.
        utterance.addEventListener('error', finish, { once: true });

        const budget = Math.min(
          TIMEOUT_MAX_MS,
          TIMEOUT_BASE_MS + content.length * TIMEOUT_PER_CHAR_MS,
        );
        timer = setTimeout(finish, budget / rate);

        engine.speak(utterance);
      } catch {
        finish();
      }
    });
  }

  async function speak(text: string, options: SpeakOptions): Promise<void> {
    // Bấm "đọc cả từ" giữa lúc nghe từng âm tiết phải cắt hẳn lượt cũ, nếu không hai
    // lượt sẽ giành nhau bộ đọc và cắt ngang lẫn nhau.
    sequenceToken += 1;
    endGap();
    await speakOne(text, options);
  }

  async function speakSequence(
    parts: readonly string[],
    options: SpeakOptions,
    gapMs: number = DEFAULT_GAP_MS,
  ): Promise<void> {
    // Lượt nghe từng âm tiết mới cũng phải thay thế hẳn lượt cũ còn đang chạy.
    sequenceToken += 1;
    endGap();
    const token = sequenceToken;
    for (let i = 0; i < parts.length; i += 1) {
      if (token !== sequenceToken) return;
      const spoke = await speakOne(parts[i], options);
      // Người học có thể bấm dừng ngay giữa hai âm tiết.
      if (token !== sequenceToken) return;
      const isLast = i === parts.length - 1;
      // Không có tiếng nào phát ra thì nghỉ cũng vô nghĩa: trên máy không hỗ trợ bộ đọc,
      // chờ cho hết các khoảng nghỉ chỉ làm giao diện đứng im vài giây rồi mới hết "đang đọc".
      if (!isLast && spoke && gapMs > 0) await waitGap(gapMs);
    }
  }

  function onVoicesChanged(listener: () => void): () => void {
    if (engine === null) return () => undefined;
    engine.addEventListener('voiceschanged', listener);
    return () => {
      engine.removeEventListener('voiceschanged', listener);
    };
  }

  return {
    isSupported,
    listVoices,
    pickVoice,
    speak,
    speakSequence,
    cancel,
    onVoicesChanged,
  };
}
