/**
 * Trình phát bài nghe cố định giữ đúng thói quen của trang HTML gốc: luôn có
 * một mục đang chọn, ↓ ↑ đổi mục và cuộn tới nó, Enter phát mục đang chọn ở
 * tốc độ của bài, bấm "Nghe" ở mục nào thì chọn và phát mục đó.
 *
 * jsdom không có bộ đọc, nên dựng một bộ đọc giả TRƯỚC lần dựng đầu tiên (bộ
 * đọc dùng chung được tạo lúc đó) để đếm đúng chuỗi và tốc độ đem đi đọc.
 */
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { FixedListeningPlayer } from './FixedListeningPlayer.tsx';
import type { FixedListeningLesson } from './types.ts';

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

const fakeSynth = Object.assign(new EventTarget(), {
  getVoices: (): SpeechSynthesisVoice[] => [],
  cancel: (): void => undefined,
  speak: (utterance: FakeUtterance): void => {
    spoken.push(utterance);
    queueMicrotask(() => utterance.dispatchEvent(new Event('end')));
  },
});

const LESSON: FixedListeningLesson = {
  title: 'Bài thử',
  notes: [],
  rate: 0.75,
  sections: [
    {
      title: '2 từ mới',
      itemLabel: 'Từ mới',
      items: [
        { hanzi: '药', pinyin: 'yào', vi: 'thuốc' },
        { hanzi: '花', pinyin: 'huā', vi: 'hoa' },
      ],
    },
    {
      title: '1 câu ghép',
      itemLabel: 'Câu ghép',
      items: [{ hanzi: '我喜欢花。', pinyin: 'Wǒ xǐhuan huā.', vi: 'Tôi thích hoa.', speak: '我喜欢花' }],
    },
  ],
};

/** Nhãn của mục đang chọn, đọc từ thẻ mang `aria-current`. */
function currentLabel(): string | null {
  const node = document.querySelector('article[aria-current="true"]');
  return node?.querySelector('p')?.textContent ?? null;
}

/** Chờ sự kiện 'end' giả về để trạng thái "đang đọc" tắt trong act. */
async function settle(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
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
  spoken.length = 0;
  Element.prototype.scrollIntoView = vi.fn();
});

describe('FixedListeningPlayer', () => {
  it('hiện đủ mọi mục kèm pinyin và nghĩa, mở ra là đã chọn mục đầu', () => {
    render(<FixedListeningPlayer lesson={LESSON} />);

    expect(screen.getAllByRole('article')).toHaveLength(3);
    expect(screen.getByText('thuốc')).toBeInTheDocument();
    expect(screen.getByText('Wǒ xǐhuan huā.')).toBeInTheDocument();
    expect(currentLabel()).toBe('Từ mới 01');
    expect(screen.getByRole('heading', { level: 2, name: '1 câu ghép' })).toBeInTheDocument();
  });

  it('↓ và ↑ đổi mục qua cả ranh giới hai phần, cuộn tới mục mới, dừng ở hai đầu', async () => {
    const user = userEvent.setup();
    render(<FixedListeningPlayer lesson={LESSON} />);

    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(currentLabel()).toBe('Câu ghép 01');
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();

    await user.keyboard('{ArrowDown}');
    expect(currentLabel()).toBe('Câu ghép 01');

    await user.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}');
    expect(currentLabel()).toBe('Từ mới 01');
  });

  it('Enter phát mục đang chọn ở tốc độ của bài, đọc chuỗi đọc riêng nếu có', async () => {
    const user = userEvent.setup();
    render(<FixedListeningPlayer lesson={LESSON} />);

    await user.keyboard('{Enter}');
    await settle();
    expect(spoken.map((u) => [u.text, u.rate, u.lang])).toEqual([['药', 0.75, 'zh-CN']]);

    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    await settle();
    expect(spoken[spoken.length - 1].text).toBe('我喜欢花');
  });

  it('bấm "Nghe" ở một mục thì chọn mục đó và phát nó', async () => {
    const user = userEvent.setup();
    render(<FixedListeningPlayer lesson={LESSON} />);

    await user.click(screen.getByRole('button', { name: 'Nghe Từ mới 02' }));
    await settle();
    expect(currentLabel()).toBe('Từ mới 02');
    expect(spoken.map((u) => u.text)).toEqual(['花']);
  });

  it('đang gõ trong một ô nhập thì phím mũi tên và Enter thuộc về ô đó', async () => {
    const user = userEvent.setup();
    render(
      <>
        <input aria-label="Ô khác" />
        <FixedListeningPlayer lesson={LESSON} />
      </>,
    );

    await user.click(screen.getByRole('textbox', { name: 'Ô khác' }));
    await user.keyboard('{ArrowDown}{Enter}');
    expect(currentLabel()).toBe('Từ mới 01');
    expect(spoken).toHaveLength(0);
  });
});
