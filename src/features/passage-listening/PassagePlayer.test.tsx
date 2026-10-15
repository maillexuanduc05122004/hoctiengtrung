/**
 * Trình phát nghe đoạn văn chạy như một bài nghe bình thường: đọc lần lượt
 * từng câu của một đoạn, đọc xong thì nghỉ đúng số giây của bài rồi tự sang
 * đoạn sau; "Bỏ qua" sang ngay đoạn sau dù đang đọc hay đang nghỉ; "Tạm dừng"
 * lúc nghỉ thì giữ nguyên số giây còn lại.
 *
 * jsdom không có bộ đọc, nên dựng một bộ đọc giả TRƯỚC lần dựng đầu tiên (bộ
 * đọc dùng chung được tạo lúc đó). Bộ đọc giả có hai chế độ: tự đọc xong ngay
 * (`autoEnd`), hoặc treo ở câu đang đọc cho tới khi bị huỷ — để thử được thao
 * tác giữa lúc đang đọc. Đồng hồ là đồng hồ giả để không phải chờ 20 giây thật.
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PassagePlayer } from './PassagePlayer.tsx';
import type { Passage } from './types.ts';

class FakeUtterance extends EventTarget {
  text: string;
  lang = '';
  rate = 1;
  voice: SpeechSynthesisVoice | null = null;

  constructor(text: string) {
    super();
    this.text = text;
  }
}

const spoken: FakeUtterance[] = [];
let autoEnd = true;
let pending: FakeUtterance | null = null;

const fakeSynth = Object.assign(new EventTarget(), {
  getVoices: (): SpeechSynthesisVoice[] => [],
  cancel: (): void => {
    const utterance = pending;
    pending = null;
    utterance?.dispatchEvent(new Event('end'));
  },
  speak: (utterance: FakeUtterance): void => {
    spoken.push(utterance);
    if (autoEnd) queueMicrotask(() => utterance.dispatchEvent(new Event('end')));
    else pending = utterance;
  },
});

const PASSAGE: Passage = {
  title: '我的一天',
  titlePinyin: 'Wǒ de yì tiān',
  titleVi: 'Một ngày của tôi',
  level: 'HSK 1',
  pauseSeconds: 20,
  paragraphs: [
    {
      sentences: [
        { hanzi: '我起床了。', pinyin: 'Wǒ qǐchuáng le.', vi: 'Tôi dậy rồi.' },
        { hanzi: '我吃早饭。', pinyin: 'Wǒ chī zǎofàn.', vi: 'Tôi ăn sáng.' },
      ],
    },
    {
      sentences: [{ hanzi: '我去学校。', pinyin: 'Wǒ qù xuéxiào.', vi: 'Tôi đến trường.' }],
    },
    {
      sentences: [{ hanzi: '我回家了。', pinyin: 'Wǒ huí jiā le.', vi: 'Tôi về nhà rồi.' }],
    },
  ],
  words: [],
};

/** Cho đồng hồ giả chạy `ms` mili giây, xả hết lời hứa xen giữa, trong act. */
async function advance(ms: number): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

function texts(): string[] {
  return spoken.map((utterance) => utterance.text);
}

function status(): string {
  return screen.getByRole('status').textContent ?? '';
}

async function click(name: string): Promise<void> {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name }));
  });
}

beforeAll(() => {
  vi.stubGlobal('speechSynthesis', fakeSynth);
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

beforeEach(() => {
  vi.useFakeTimers();
  spoken.length = 0;
  autoEnd = true;
  pending = null;
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('PassagePlayer', () => {
  it('đọc từng câu của đoạn 1 ở 0,75×, nghỉ 20 giây rồi tự sang đoạn 2', async () => {
    render(<PassagePlayer passage={PASSAGE} />);

    await click('Bắt đầu');
    await advance(1000);
    expect(spoken.map((u) => [u.text, u.rate, u.lang])).toEqual([
      ['我起床了。', 0.75, 'zh-CN'],
      ['我吃早饭。', 0.75, 'zh-CN'],
    ]);
    expect(status()).toContain('Nghỉ trước đoạn 2/3');
    expect(screen.getByText('20 giây')).toBeInTheDocument();

    await advance(10_000);
    expect(screen.getByText('10 giây')).toBeInTheDocument();
    expect(texts()).toHaveLength(2);

    await advance(10_000);
    expect(texts()).toEqual(['我起床了。', '我吃早饭。', '我去学校。']);
  });

  it('"Bỏ qua" lúc đang nghỉ thì sang ngay đoạn sau, không chờ hết 20 giây', async () => {
    render(<PassagePlayer passage={PASSAGE} />);

    await click('Bắt đầu');
    await advance(1000);
    await click('Bỏ qua');
    await advance(0);
    expect(texts()).toEqual(['我起床了。', '我吃早饭。', '我去学校。']);
  });

  it('"Bỏ qua" giữa lúc đang đọc thì cắt câu đang đọc và sang đoạn sau', async () => {
    autoEnd = false;
    render(<PassagePlayer passage={PASSAGE} />);

    await click('Bắt đầu');
    expect(texts()).toEqual(['我起床了。']);
    expect(status()).toBe('Đoạn 1/3 · câu 1/2');

    await click('Bỏ qua');
    await advance(5000);
    // Câu thứ hai của đoạn 1 không bao giờ được đọc.
    expect(texts()).toEqual(['我起床了。', '我去学校。']);
    expect(status()).toBe('Đoạn 2/3 · câu 1/1');
  });

  it('"Tạm dừng" lúc nghỉ giữ nguyên số giây còn lại, "Tiếp tục" đếm tiếp từ đó', async () => {
    render(<PassagePlayer passage={PASSAGE} />);

    await click('Bắt đầu');
    await advance(1000);
    await advance(5000);
    await click('Tạm dừng');
    expect(status()).toContain('Đã tạm dừng');

    await advance(60_000);
    expect(texts()).toHaveLength(2);

    await click('Tiếp tục');
    await advance(14_000);
    expect(texts()).toHaveLength(2);
    await advance(1500);
    expect(texts()).toEqual(['我起床了。', '我吃早饭。', '我去学校。']);
  });

  it('nghe hết đoạn cuối thì dừng hẳn, không nghỉ thêm', async () => {
    render(<PassagePlayer passage={PASSAGE} />);

    await click('Bắt đầu');
    await advance(1000);
    await click('Bỏ qua');
    await advance(1000);
    await click('Bỏ qua');
    await advance(1000);
    expect(texts()).toEqual(['我起床了。', '我吃早饭。', '我去学校。', '我回家了。']);
    expect(status()).toBe('Đã nghe hết 3 đoạn');
    expect(screen.getByRole('button', { name: 'Nghe lại từ đầu' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bỏ qua' })).toBeDisabled();
  });

  it('mặc định ẩn lời; bật "Chữ Hán", "Pinyin", "Nghĩa" thì hiện từng phần', async () => {
    render(<PassagePlayer passage={PASSAGE} />);

    expect(screen.queryByText('我起床了。')).not.toBeInTheDocument();

    await click('Chữ Hán');
    expect(screen.getByText('我起床了。')).toBeInTheDocument();
    expect(screen.queryByText('Wǒ qǐchuáng le.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Chữ Hán' })).toHaveAttribute('aria-pressed', 'true');

    await click('Pinyin');
    await click('Nghĩa');
    expect(screen.getByText('Wǒ qǐchuáng le.')).toBeInTheDocument();
    expect(screen.getByText('Tôi dậy rồi.')).toBeInTheDocument();
  });

  it('đổi tốc độ thì câu đọc sau dùng tốc độ mới', async () => {
    render(<PassagePlayer passage={PASSAGE} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('radio', { name: 'Chậm, 0,6 lần' }));
    });
    await click('Bắt đầu');
    await advance(1000);
    expect(spoken.map((u) => u.rate)).toEqual([0.6, 0.6]);
  });

  it('có khoá lưu thì nhớ đoạn đang nghe, lần sau mở lại có nút nghe tiếp từ đoạn đó', async () => {
    window.localStorage.clear();
    const first = render(
      <PassagePlayer
        passage={PASSAGE}
        storageKey="thu"
      />,
    );
    await click('Bắt đầu');
    await advance(1000);
    await click('Bỏ qua');
    await advance(1000);
    expect(window.localStorage.getItem('thu')).toBe('1');
    first.unmount();

    render(
      <PassagePlayer
        passage={PASSAGE}
        storageKey="thu"
      />,
    );
    expect(status()).toBe('Lần trước nghe tới đoạn 2/3');
    expect(screen.getByRole('button', { name: 'Từ đầu' })).toBeEnabled();
    spoken.length = 0;
    await click('Tiếp đoạn 2');
    await advance(1000);
    expect(texts()).toEqual(['我去学校。']);
  });

  it('nghe hết bài thì quên chỗ nghe dở, lần sau nghe từ đầu', async () => {
    window.localStorage.setItem('thu', '2');
    render(
      <PassagePlayer
        passage={PASSAGE}
        storageKey="thu"
      />,
    );
    await click('Tiếp đoạn 3');
    await advance(1000);
    expect(texts()).toEqual(['我回家了。']);
    expect(status()).toBe('Đã nghe hết 3 đoạn');
    expect(window.localStorage.getItem('thu')).toBeNull();
  });

  it('rời trang lúc đang nghỉ thì không tự đọc đoạn sau nữa', async () => {
    const { unmount } = render(<PassagePlayer passage={PASSAGE} />);

    await click('Bắt đầu');
    await advance(1000);
    unmount();
    await advance(60_000);
    expect(texts()).toHaveLength(2);
  });
});
