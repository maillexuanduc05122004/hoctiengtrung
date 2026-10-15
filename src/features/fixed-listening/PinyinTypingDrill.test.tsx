/**
 * Phần tập gõ pinyin đi đúng một vòng: gõ → Enter chấm → Câu tiếp, bỏ qua
 * vẫn cho xem đáp án, hết lượt thì gõ lại riêng câu chưa đúng.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PinyinTypingDrill } from './PinyinTypingDrill.tsx';
import type { FixedListeningEntry } from './types.ts';

const LESSON: FixedListeningEntry = {
  id: 'bai-99',
  number: 99,
  title: 'Bài thử',
  notes: [],
  rate: 0.75,
  sections: [
    {
      title: '2 từ mới',
      itemLabel: 'Từ mới',
      items: [
        { hanzi: '饭馆', pinyin: 'fànguǎn', vi: 'quán ăn' },
        { hanzi: '跟', pinyin: 'gēn', vi: 'cùng' },
      ],
    },
  ],
  typing: [
    { hanzi: '我跟朋友去饭馆。', pinyin: 'Wǒ gēn péngyou qù fànguǎn.', vi: 'Tôi cùng bạn đi quán ăn.' },
    { hanzi: '饭馆很好。', pinyin: 'Fànguǎn hěn hǎo.', vi: 'Quán ăn rất tốt.' },
  ],
};

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

function box(): HTMLElement {
  return screen.getByRole('textbox', { name: 'Gõ pinyin của cả câu' });
}

describe('PinyinTypingDrill', () => {
  it('hiện câu, nghĩa, từ mới có trong câu và đếm âm tiết đang gõ', async () => {
    const user = userEvent.setup();
    render(<PinyinTypingDrill lesson={LESSON} />);

    expect(screen.getByText('我跟朋友去饭馆。')).toBeInTheDocument();
    expect(screen.getByText('Tôi cùng bạn đi quán ăn.')).toBeInTheDocument();
    expect(screen.getByText('跟 · 饭馆')).toBeInTheDocument();
    expect(screen.getByText('0/7 âm tiết')).toBeInTheDocument();

    await user.type(box(), 'wo3 gen1 peng2');
    expect(screen.getByText('3/7 âm tiết')).toBeInTheDocument();
  });

  it('Enter chấm câu; đúng thì sang câu tiếp, hết bài thì tổng kết', async () => {
    const user = userEvent.setup();
    render(<PinyinTypingDrill lesson={LESSON} />);

    await user.type(box(), 'wo3 gen1 peng2you qu4 fan4guan3{Enter}');
    expect(screen.getByText('Đúng')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Câu tiếp' }));

    expect(screen.getByText('饭馆很好。')).toBeInTheDocument();
    expect(box()).toHaveValue('');
    await user.type(box(), 'fan4guan3 hen3 hao3{Enter}');
    await user.click(screen.getByRole('button', { name: 'Xem kết quả' }));

    expect(screen.getByRole('heading', { name: 'Xong 2 câu' })).toBeInTheDocument();
    expect(screen.getByText('2 đúng · 0 gần đúng · 0 chưa đúng hoặc bỏ qua.')).toBeInTheDocument();
  });

  it('sai thanh thì báo gần đúng kèm đáp án; bỏ qua thì vẫn cho xem đáp án', async () => {
    const user = userEvent.setup();
    render(<PinyinTypingDrill lesson={LESSON} />);

    await user.type(box(), 'wo3 gen1 peng2you qu4 fan2guan3{Enter}');
    expect(screen.getByText('Gần đúng')).toBeInTheDocument();
    expect(screen.getByText('Sai thanh điệu ở âm tiết thứ 6.')).toBeInTheDocument();
    expect(screen.getByText('Wǒ gēn péngyou qù fànguǎn.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Câu tiếp' }));
    await user.click(screen.getByRole('button', { name: 'Bỏ qua, xem đáp án' }));
    expect(screen.getByText('Fànguǎn hěn hǎo.')).toBeInTheDocument();
  });

  it('hết lượt thì gõ lại được riêng những câu chưa đúng', async () => {
    const user = userEvent.setup();
    render(<PinyinTypingDrill lesson={LESSON} />);

    await user.click(screen.getByRole('button', { name: 'Bỏ qua, xem đáp án' }));
    await user.click(screen.getByRole('button', { name: 'Câu tiếp' }));
    await user.type(box(), 'fan4guan3 hen3 hao3{Enter}');
    await user.click(screen.getByRole('button', { name: 'Xem kết quả' }));

    await user.click(screen.getByRole('button', { name: 'Gõ lại 1 câu chưa đúng' }));
    expect(screen.getByText('Câu 01 / 1')).toBeInTheDocument();
    expect(screen.getByText('我跟朋友去饭馆。')).toBeInTheDocument();
  });
});
