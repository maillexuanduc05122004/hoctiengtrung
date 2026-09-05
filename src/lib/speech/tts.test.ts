import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTtsAdapter } from './tts.ts';

/** Utterance giả: chỉ cần giữ nội dung và phát được sự kiện 'end' / 'error'. */
class FakeUtterance extends EventTarget {
  text: string;
  lang = '';
  rate = 1;
  pitch = 1;
  volume = 1;
  voice: SpeechSynthesisVoice | null = null;

  constructor(text: string) {
    super();
    this.text = text;
  }
}

/** 'silent' giả lập trình duyệt nuốt mất sự kiện kết thúc. */
type SpeakBehavior = 'end' | 'error' | 'silent';

class FakeSynth extends EventTarget implements SpeechSynthesis {
  paused = false;
  pending = false;
  speaking = false;
  onvoiceschanged: ((this: SpeechSynthesis, ev: Event) => void) | null = null;

  voices: SpeechSynthesisVoice[] = [];
  cancelCount = 0;
  spoken: SpeechSynthesisUtterance[] = [];
  behavior: SpeakBehavior = 'end';

  getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  cancel(): void {
    this.cancelCount += 1;
  }

  pause(): void {}

  resume(): void {}

  speak(utterance: SpeechSynthesisUtterance): void {
    this.spoken.push(utterance);
    if (this.behavior === 'silent') return;
    // Trình duyệt thật bắn sự kiện bất đồng bộ, giữ đúng thứ tự đó để test sát thực tế.
    queueMicrotask(() => {
      utterance.dispatchEvent(new Event(this.behavior));
    });
  }
}

function makeVoice(
  lang: string,
  name: string,
  extra: { voiceURI?: string; isDefault?: boolean } = {},
): SpeechSynthesisVoice {
  return {
    lang,
    name,
    voiceURI: extra.voiceURI ?? name,
    default: extra.isDefault ?? false,
    localService: true,
  };
}

beforeEach(() => {
  // Adapter dựng utterance từ hàm dựng toàn cục, jsdom không có sẵn nên phải gắn tạm.
  globalThis.SpeechSynthesisUtterance = FakeUtterance as unknown as typeof SpeechSynthesisUtterance;
});

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'SpeechSynthesisUtterance');
  vi.useRealTimers();
});

describe('createTtsAdapter khi trình duyệt không hỗ trợ', () => {
  it('trả isSupported() false và speak() vẫn resolve, không ném lỗi', async () => {
    const adapter = createTtsAdapter(null);

    expect(adapter.isSupported()).toBe(false);
    await expect(adapter.speak('你好', { lang: 'zh-CN' })).resolves.toBeUndefined();
    expect(adapter.listVoices()).toEqual([]);
    expect(adapter.pickVoice('zh-CN')).toBeNull();
    expect(() => {
      adapter.cancel();
    }).not.toThrow();
  });

  it('onVoicesChanged trả về hàm huỷ đăng ký vô hại', () => {
    const adapter = createTtsAdapter(null);
    const unsubscribe = adapter.onVoicesChanged(() => undefined);
    expect(() => {
      unsubscribe();
    }).not.toThrow();
  });

  it('coi là không hỗ trợ khi thiếu hàm dựng SpeechSynthesisUtterance', () => {
    Reflect.deleteProperty(globalThis, 'SpeechSynthesisUtterance');
    const synth = new FakeSynth();

    expect(createTtsAdapter(synth).isSupported()).toBe(false);
  });
});

describe('pickVoice', () => {
  it('chọn giọng zh-CN và không chọn giọng zh-HK', () => {
    const synth = new FakeSynth();
    synth.voices = [
      makeVoice('zh-HK', 'Sin-ji'),
      makeVoice('yue-Hant-HK', 'Aasing'),
      makeVoice('zh-CN', 'Ting-Ting'),
      makeVoice('en-US', 'Samantha'),
    ];
    const adapter = createTtsAdapter(synth);

    expect(adapter.pickVoice('zh-CN')?.name).toBe('Ting-Ting');
  });

  it('không bao giờ trả giọng Quảng Đông kể cả khi đó là giọng zh duy nhất', () => {
    const synth = new FakeSynth();
    synth.voices = [makeVoice('zh-HK', 'Sin-ji'), makeVoice('yue-Hant-HK', 'Aasing')];

    expect(createTtsAdapter(synth).pickVoice('zh-CN')).toBeNull();
  });

  it('coi zh-Hant-HK là giọng Quảng Đông chứ không phải giọng phổ thông', () => {
    // Nhiều máy gắn nhãn giọng Hồng Kông là 'zh-Hant-HK'; so tiền tố 'zh-hk' sẽ bỏ lọt.
    const synth = new FakeSynth();
    synth.voices = [makeVoice('zh-Hant-HK', 'Sin-ji'), makeVoice('zh-Hant-MO', 'Sinji-MO')];

    expect(createTtsAdapter(synth).pickVoice('zh-CN')).toBeNull();
  });

  it('nhận giọng gắn nhãn cmn (espeak, vài máy Android) là tiếng phổ thông', () => {
    const synth = new FakeSynth();
    synth.voices = [makeVoice('cmn-Hans-CN', 'Mandarin'), makeVoice('en-US', 'Samantha')];

    expect(createTtsAdapter(synth).pickVoice('zh-CN')?.name).toBe('Mandarin');
  });

  it('chấp nhận zh_CN và zh-Hans như giọng tiếng phổ thông', () => {
    const underscore = new FakeSynth();
    underscore.voices = [makeVoice('zh_CN', 'Huihui')];
    expect(createTtsAdapter(underscore).pickVoice('zh-CN')?.name).toBe('Huihui');

    const hans = new FakeSynth();
    hans.voices = [makeVoice('zh-Hans-CN', 'Xiaoxiao')];
    expect(createTtsAdapter(hans).pickVoice('zh-CN')?.name).toBe('Xiaoxiao');
  });

  it('ưu tiên voiceUri người dùng đã chọn', () => {
    const synth = new FakeSynth();
    synth.voices = [
      makeVoice('zh-CN', 'Ting-Ting', { voiceURI: 'zh-a', isDefault: true }),
      makeVoice('zh-CN', 'Li-Mu', { voiceURI: 'zh-b' }),
    ];
    const adapter = createTtsAdapter(synth);

    expect(adapter.pickVoice('zh-CN', 'zh-b')?.name).toBe('Li-Mu');
    expect(adapter.pickVoice('zh-CN')?.name).toBe('Ting-Ting');
  });

  it('bỏ qua voiceUri đã lưu khi giọng đó khác ngôn ngữ đang cần đọc', () => {
    const synth = new FakeSynth();
    synth.voices = [makeVoice('vi-VN', 'Linh', { voiceURI: 'vi-a' }), makeVoice('zh-CN', 'Ting-Ting')];

    expect(createTtsAdapter(synth).pickVoice('zh-CN', 'vi-a')?.name).toBe('Ting-Ting');
  });

  it('chọn được giọng tiếng Việt và tiếng Anh theo cùng mã ngôn ngữ', () => {
    const synth = new FakeSynth();
    synth.voices = [makeVoice('vi-VN', 'Linh'), makeVoice('en-GB', 'Daniel')];
    const adapter = createTtsAdapter(synth);

    expect(adapter.pickVoice('vi-VN')?.name).toBe('Linh');
    expect(adapter.pickVoice('en-US')?.name).toBe('Daniel');
  });

  it('bỏ qua voiceUri đã lưu khi nó trỏ vào giọng Quảng Đông', () => {
    // voiceURI lưu từ máy khác có thể trùng với một giọng Quảng Đông trên máy này.
    const synth = new FakeSynth();
    synth.voices = [
      makeVoice('zh-HK', 'Sin-ji', { voiceURI: 'yue-a' }),
      makeVoice('zh-CN', 'Ting-Ting'),
    ];

    expect(createTtsAdapter(synth).pickVoice('zh-CN', 'yue-a')?.name).toBe('Ting-Ting');
  });
});

describe('listVoices', () => {
  it('trả bản sao, người gọi sắp xếp lại cũng không hỏng danh sách của bộ đọc', () => {
    const synth = new FakeSynth();
    synth.voices = [makeVoice('zh-CN', 'A'), makeVoice('zh-CN', 'B')];
    const adapter = createTtsAdapter(synth);

    adapter.listVoices().length = 0;

    expect(adapter.listVoices()).toHaveLength(2);
    expect(synth.voices).toHaveLength(2);
  });
});

describe('speak', () => {
  it('huỷ lượt đọc đang chạy trước khi phát và resolve khi sự kiện end bắn ra', async () => {
    const synth = new FakeSynth();
    synth.voices = [makeVoice('zh-CN', 'Ting-Ting')];
    const adapter = createTtsAdapter(synth);

    await adapter.speak('你好', { lang: 'zh-CN', rate: 0.85 });

    expect(synth.cancelCount).toBe(1);
    expect(synth.spoken).toHaveLength(1);
    const utterance = synth.spoken[0];
    expect(utterance.text).toBe('你好');
    expect(utterance.lang).toBe('zh-CN');
    expect(utterance.rate).toBe(0.85);
    expect(utterance.voice?.name).toBe('Ting-Ting');
  });

  it('vẫn resolve khi bộ đọc bắn sự kiện error', async () => {
    const synth = new FakeSynth();
    synth.behavior = 'error';

    await expect(
      createTtsAdapter(synth).speak('你好', { lang: 'zh-CN' }),
    ).resolves.toBeUndefined();
  });

  it('không treo khi trình duyệt không bắn sự kiện nào', async () => {
    vi.useFakeTimers();
    const synth = new FakeSynth();
    synth.behavior = 'silent';

    const pending = createTtsAdapter(synth).speak('你好', { lang: 'zh-CN' });
    await vi.advanceTimersByTimeAsync(60_000);

    await expect(pending).resolves.toBeUndefined();
  });

  it('bỏ qua chuỗi rỗng, không gọi tới bộ đọc', async () => {
    const synth = new FakeSynth();

    await createTtsAdapter(synth).speak('   ', { lang: 'zh-CN' });

    expect(synth.spoken).toHaveLength(0);
    expect(synth.cancelCount).toBe(0);
  });

  it('giới hạn tốc độ đọc trong khoảng Web Speech API chấp nhận', async () => {
    const synth = new FakeSynth();
    const adapter = createTtsAdapter(synth);

    await adapter.speak('你好', { lang: 'zh-CN', rate: 9 });
    await adapter.speak('你好', { lang: 'zh-CN', rate: 0 });

    expect(synth.spoken[0].rate).toBe(2);
    expect(synth.spoken[1].rate).toBe(0.5);
  });

  it('quay về tốc độ 1 khi nhận tốc độ không phải số hữu hạn', async () => {
    const synth = new FakeSynth();

    await createTtsAdapter(synth).speak('你好', { lang: 'zh-CN', rate: Number.NaN });

    expect(synth.spoken[0].rate).toBe(1);
  });

  it('vẫn resolve khi hàm dựng utterance của trình duyệt ném lỗi', async () => {
    // speak() không bao giờ được reject: nơi gọi chỉ await để tắt trạng thái "đang đọc".
    globalThis.SpeechSynthesisUtterance = function BrokenUtterance(): never {
      throw new Error('bộ đọc hỏng');
    } as unknown as typeof SpeechSynthesisUtterance;

    await expect(
      createTtsAdapter(new FakeSynth()).speak('你好', { lang: 'zh-CN' }),
    ).resolves.toBeUndefined();
  });
});

describe('speakSequence', () => {
  it('đọc đúng số lần theo số phần tử', async () => {
    const synth = new FakeSynth();

    await createTtsAdapter(synth).speakSequence(['你', '好', '吗'], { lang: 'zh-CN' }, 0);

    expect(synth.spoken).toHaveLength(3);
    expect(synth.spoken.map((utterance) => utterance.text)).toEqual(['你', '好', '吗']);
  });

  it('nghỉ giữa hai phần đúng số mili giây được yêu cầu', async () => {
    vi.useFakeTimers();
    const synth = new FakeSynth();

    const pending = createTtsAdapter(synth).speakSequence(['你', '好'], { lang: 'zh-CN' }, 300);
    await vi.advanceTimersByTimeAsync(0);
    expect(synth.spoken).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(300);
    await pending;
    expect(synth.spoken).toHaveLength(2);
  });

  it('không đọc nốt các phần còn lại sau khi người học bấm dừng', async () => {
    const synth = new FakeSynth();
    const adapter = createTtsAdapter(synth);

    const pending = adapter.speakSequence(['你', '好', '吗'], { lang: 'zh-CN' }, 0);
    adapter.cancel();
    await pending;

    expect(synth.spoken.map((utterance) => utterance.text)).toEqual(['你']);
  });

  it('nhường chỗ cho lệnh đọc cả từ phát ra giữa chừng', async () => {
    const synth = new FakeSynth();
    const adapter = createTtsAdapter(synth);

    const pending = adapter.speakSequence(['你', '好', '吗'], { lang: 'zh-CN' }, 0);
    await adapter.speak('你好吗', { lang: 'zh-CN' });
    await pending;

    expect(synth.spoken.map((utterance) => utterance.text)).toEqual(['你', '你好吗']);
  });

  it('lượt nghe từng âm tiết mới thay thế hẳn lượt cũ', async () => {
    const synth = new FakeSynth();
    const adapter = createTtsAdapter(synth);

    const first = adapter.speakSequence(['你', '好', '吗'], { lang: 'zh-CN' }, 0);
    const second = adapter.speakSequence(['再', '见'], { lang: 'zh-CN' }, 0);
    await Promise.all([first, second]);

    expect(synth.spoken.map((utterance) => utterance.text)).toEqual(['你', '再', '见']);
  });

  it('dừng cả khi lệnh huỷ rơi đúng lúc đang nghỉ giữa hai phần', async () => {
    vi.useFakeTimers();
    const synth = new FakeSynth();
    const adapter = createTtsAdapter(synth);

    const pending = adapter.speakSequence(['你', '好', '吗'], { lang: 'zh-CN' }, 300);
    await vi.advanceTimersByTimeAsync(0);
    adapter.cancel();
    await vi.advanceTimersByTimeAsync(300);
    await pending;

    expect(synth.spoken).toHaveLength(1);
  });

  it('kết thúc ngay khi bấm dừng giữa khoảng nghỉ, không chờ hết khoảng nghỉ', async () => {
    // Chờ nốt khoảng nghỉ thì nút "đang đọc" còn sáng thêm gần nửa giây sau khi đã bấm dừng.
    vi.useFakeTimers();
    const synth = new FakeSynth();
    const adapter = createTtsAdapter(synth);
    const settled = vi.fn();

    const pending = adapter.speakSequence(['你', '好'], { lang: 'zh-CN' }, 5000);
    void pending.then(settled);
    await vi.advanceTimersByTimeAsync(0);
    adapter.cancel();
    await vi.advanceTimersByTimeAsync(0);

    expect(settled).toHaveBeenCalledTimes(1);
    await pending;
  });

  it('không nghỉ giữa các phần khi máy không có bộ đọc', async () => {
    // Không có tiếng nào phát ra mà vẫn nghỉ thì giao diện đứng im vài giây rồi mới hết "đang đọc".
    vi.useFakeTimers();
    const settled = vi.fn();

    const pending = createTtsAdapter(null).speakSequence(['你', '好', '吗'], { lang: 'zh-CN' }, 5000);
    void pending.then(settled);
    await vi.advanceTimersByTimeAsync(0);

    expect(settled).toHaveBeenCalledTimes(1);
    await pending;
  });
});

describe('onVoicesChanged', () => {
  it('gọi listener khi danh sách giọng đổi và ngừng sau khi huỷ đăng ký', () => {
    const synth = new FakeSynth();
    const listener = vi.fn();
    const unsubscribe = createTtsAdapter(synth).onVoicesChanged(listener);

    synth.dispatchEvent(new Event('voiceschanged'));
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    synth.dispatchEvent(new Event('voiceschanged'));
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
