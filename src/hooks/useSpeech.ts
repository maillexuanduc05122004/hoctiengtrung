import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createTtsAdapter, type SpeechLang, type TtsAdapter } from '../lib/speech/index.ts';
import { useSettings } from './settings-context.ts';

/** Một bộ đọc dùng chung cho cả ứng dụng, tránh tạo lại và tránh chồng tiếng. */
let sharedAdapter: TtsAdapter | null = null;

/**
 * Chỗ dùng hook nào đang chiếm bộ đọc dùng chung.
 *
 * Bộ đọc chỉ có một, nên lúc tháo chỉ chỗ đang phát mới được dừng nó. Không phân biệt
 * thì tháo một nút loa bất kỳ (thanh gợi ý biến mất sau khi chấm bài, đóng hộp tra từ,
 * đổi từ...) sẽ cắt ngang tiếng mà chỗ khác đang đọc dở.
 */
let speakingOwner: object | null = null;

function getAdapter(): TtsAdapter {
  sharedAdapter ??= createTtsAdapter();
  return sharedAdapter;
}

export interface UseSpeechResult {
  supported: boolean;
  /** Danh sách giọng tiếng Trung có trên thiết bị. */
  chineseVoices: SpeechSynthesisVoice[];
  /** Đang phát hay không, để nút đổi thành nút dừng. */
  speaking: boolean;
  /** Đọc một đoạn. Chỉ được gọi từ hành động của người dùng. */
  speak: (text: string, lang?: SpeechLang, rateOverride?: number) => Promise<void>;
  /** Đọc lần lượt từng phần, dùng cho chế độ nghe từng âm tiết. */
  speakParts: (parts: readonly string[], lang?: SpeechLang, rateOverride?: number) => Promise<void>;
  cancel: () => void;
}

/**
 * Bọc bộ đọc của trình duyệt và ghép với cài đặt người dùng.
 *
 * Không tự phát bất cứ âm thanh nào: mọi lần phát đều bắt nguồn từ một thao tác
 * của người dùng, đúng yêu cầu về trải nghiệm và cũng là điều kiện các trình
 * duyệt di động bắt buộc.
 */
export function useSpeech(): UseSpeechResult {
  const { settings } = useSettings();
  const adapter = useMemo(() => getAdapter(), []);
  // Thẻ nhận dạng riêng của mỗi chỗ dùng hook, để biết ai đang chiếm bộ đọc.
  const ownerRef = useRef<object>({});
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() => adapter.listVoices());
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    // Danh sách giọng trên một số trình duyệt chỉ có sau vài trăm mili giây, và
    // Safari không phải lúc nào cũng bắn 'voiceschanged', nên đọc lại một lần ở
    // lượt sự kiện kế tiếp thay vì đọc đồng bộ ngay trong thân effect.
    const sync = (): void => setVoices(adapter.listVoices());
    const timer = setTimeout(sync, 0);
    const unsubscribe = adapter.onVoicesChanged(sync);
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [adapter]);

  const chineseVoices = useMemo(
    () => voices.filter((voice) => voice.lang.toLowerCase().startsWith('zh')),
    [voices],
  );

  const speak = useCallback(
    async (text: string, lang: SpeechLang = 'zh-CN', rateOverride?: number) => {
      if (text.trim() === '') return;
      const owner = ownerRef.current;
      speakingOwner = owner;
      setSpeaking(true);
      try {
        await adapter.speak(text, {
          lang,
          rate: rateOverride ?? settings.speechRate,
          voiceUri: lang === 'zh-CN' ? settings.preferredVoiceUri : null,
        });
      } finally {
        // Chỗ khác đã giành bộ đọc trong lúc chờ thì đừng xoá dấu của họ.
        if (speakingOwner === owner) speakingOwner = null;
        setSpeaking(false);
      }
    },
    [adapter, settings.speechRate, settings.preferredVoiceUri],
  );

  const speakParts = useCallback(
    async (parts: readonly string[], lang: SpeechLang = 'zh-CN', rateOverride?: number) => {
      const usable = parts.filter((p) => p.trim() !== '');
      if (usable.length === 0) return;
      const owner = ownerRef.current;
      speakingOwner = owner;
      setSpeaking(true);
      try {
        await adapter.speakSequence(
          usable,
          {
            lang,
            rate: rateOverride ?? settings.speechRate,
            voiceUri: lang === 'zh-CN' ? settings.preferredVoiceUri : null,
          },
          260,
        );
      } finally {
        if (speakingOwner === owner) speakingOwner = null;
        setSpeaking(false);
      }
    },
    [adapter, settings.speechRate, settings.preferredVoiceUri],
  );

  const cancel = useCallback(() => {
    // Người học bấm dừng thì bộ đọc im hẳn, không còn ai chiếm nữa.
    adapter.cancel();
    speakingOwner = null;
    setSpeaking(false);
  }, [adapter]);

  useEffect(
    () => () => {
      // Chỉ dừng đúng tiếng do chính chỗ này phát: bộ đọc là của chung, tháo một nút loa
      // không được cắt ngang tiếng chỗ khác đang đọc.
      if (speakingOwner !== ownerRef.current) return;
      speakingOwner = null;
      adapter.cancel();
    },
    [adapter],
  );

  return {
    supported: adapter.isSupported(),
    chineseVoices,
    speaking,
    speak,
    speakParts,
    cancel,
  };
}
