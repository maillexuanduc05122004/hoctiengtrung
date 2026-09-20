/**
 * Dựng riêng phần nghe để kiểm ba lời hứa mới, khó thấy khi đi qua cả trang:
 *
 * - Câu AI KHÔNG BAO GIỜ nằm trong bộ rút ngẫu nhiên mà luôn hiện đủ trong
 *   một mục đặt đầu tiên — ngay sau khi dựng, không cần `freshIds`. Với cơ
 *   chế thay bộ, kho AI chỉ còn bộ gần nhất; hiện đủ thì sau F5 người học
 *   vẫn thấy nguyên bộ vừa tạo chứ không phải vài câu lẻ.
 * - Bộ đang xem luôn khớp kho: máy chủ trả mã thật thay bộ dự phòng mã âm thì
 *   rút lại (trước đây bộ thành rỗng, "Không có câu nào khớp."); xoá một câu
 *   thì chỉ bỏ câu đó, không rút bù.
 * - Bộ AI mới về (`freshIds` đổi sang mảng mới không rỗng) thì đóng mọi phần
 *   đã mở và cuộn lên đầu.
 *
 * Câu có sẵn lấy từ `corpus.ts` / `fallback.ts` để bộ ngẫu nhiên có cỡ như
 * thật; câu AI dựng bằng chuỗi thường vì nội dung không quan trọng, chỉ cần
 * mã và nguồn. jsdom không có `speechSynthesis` lẫn `scrollIntoView`, nên nút
 * nghe vô hiệu và cuộn được thay bằng hàm giả — đúng thứ cần đếm.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FALLBACK_SENTENCES } from './fallback.ts';
import { SentenceDrill, type SentenceDrillProps } from './SentenceDrill.tsx';
import type { Sentence } from '../../lib/api/types.ts';

/** Bộ có sẵn với mã thật (dương), cùng nội dung bộ dự phòng mã âm. */
const SERVER_SENTENCES: Sentence[] = FALLBACK_SENTENCES.map((sentence, i) => ({
  ...sentence,
  id: i + 1,
}));

function aiSentence(id: number): Sentence {
  return {
    id,
    hanzi: `ai-${id}`,
    pinyin: `ai ${id}`,
    meaningVi: `câu AI ${id}`,
    level: 1,
    source: 'AI',
    createdAt: '2026-02-01T00:00:00Z',
  };
}

function aiBatch(from: number, count: number): Sentence[] {
  return Array.from({ length: count }, (_, i) => aiSentence(from + i));
}

function props(overrides: Partial<SentenceDrillProps> = {}): SentenceDrillProps {
  return {
    sentences: SERVER_SENTENCES,
    rate: 0.75,
    query: '',
    onRemove: vi.fn(),
    aiEnabled: true,
    onGenerate: vi.fn(),
    generating: false,
    ...overrides,
  };
}

/** Chữ Hán của những câu đang mở, đọc đúng từng phần tử. */
function shownHanzi(): Set<string> {
  const nodes = document.querySelectorAll('article p[lang="zh-CN"]');
  return new Set([...nodes].map((node) => node.textContent ?? ''));
}

function headings(): string[] {
  return screen.getAllByRole('heading', { level: 2 }).map((node) => node.textContent ?? '');
}

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

describe('SentenceDrill — câu AI luôn hiện đủ, ngoài bộ ngẫu nhiên', () => {
  it('ngay sau khi dựng, mọi câu AI nằm trong mục "Câu AI tạo" ở đầu, bộ 20 câu rút từ phần còn lại', () => {
    render(<SentenceDrill {...props({ sentences: [...SERVER_SENTENCES, ...aiBatch(501, 25)] })} />);

    // 20 câu rút + 25 câu AI: câu AI không chiếm chỗ trong bộ 20.
    expect(screen.getAllByRole('article')).toHaveLength(45);
    expect(screen.getAllByText('AI')).toHaveLength(25);
    expect(headings()[0]).toContain('Câu AI tạo');
    expect(headings()[0]).toContain('25 câu');
    expect(
      screen.getByText(/Bộ 20 câu rút ngẫu nhiên từ 90 câu có sẵn, cộng 25 câu AI luôn hiện đủ\./),
    ).toBeInTheDocument();
  });

  it('đổi cỡ bộ và "Đổi câu khác" chỉ đụng phần rút; câu AI vẫn hiện đủ', async () => {
    const user = userEvent.setup();
    render(<SentenceDrill {...props({ sentences: [...SERVER_SENTENCES, ...aiBatch(501, 25)] })} />);

    await user.click(screen.getByRole('radio', { name: '10' }));
    expect(screen.getAllByRole('article')).toHaveLength(35);
    expect(screen.getAllByText('AI')).toHaveLength(25);

    await user.click(screen.getByRole('button', { name: 'Đổi câu khác' }));
    expect(screen.getAllByRole('article')).toHaveLength(35);
    expect(screen.getAllByText('AI')).toHaveLength(25);
  });

  it('không có câu AI thì dòng mô tả không nhắc tới AI', () => {
    render(<SentenceDrill {...props()} />);
    expect(screen.getByText(/Bộ 20 câu rút ngẫu nhiên từ 90 câu có sẵn\./)).toBeInTheDocument();
    expect(screen.queryByText(/câu AI luôn hiện đủ/)).not.toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(20);
  });
});

describe('SentenceDrill — bộ đang xem khớp kho', () => {
  it('máy chủ trả mã thật thay bộ dự phòng mã âm thì rút lại bộ, không để trống', () => {
    const view = render(<SentenceDrill {...props({ sentences: FALLBACK_SENTENCES })} />);
    expect(screen.getAllByRole('article')).toHaveLength(20);

    // Mọi mã đổi hết (âm → dương): bộ cũ không còn mã nào trong kho.
    view.rerender(<SentenceDrill {...props({ sentences: SERVER_SENTENCES })} />);
    expect(screen.getAllByRole('article')).toHaveLength(20);
    expect(screen.queryByText('Không có câu nào khớp.')).not.toBeInTheDocument();
  });

  it('xoá một câu trong bộ thì bộ chỉ hụt câu đó, không rút bù', async () => {
    const user = userEvent.setup();
    const view = render(<SentenceDrill {...props()} />);
    await user.click(screen.getByRole('radio', { name: 'Hiện hết' }));
    const before = shownHanzi();
    expect(before.size).toBe(20);

    const removed = SERVER_SENTENCES.find((sentence) => before.has(sentence.hanzi));
    if (!removed) throw new Error('Không tìm được câu đang hiện trong kho.');
    view.rerender(
      <SentenceDrill
        {...props({ sentences: SERVER_SENTENCES.filter((sentence) => sentence.id !== removed.id) })}
      />,
    );

    const after = shownHanzi();
    expect(after.size).toBe(19);
    expect(after.has(removed.hanzi)).toBe(false);
    for (const hanzi of after) expect(before.has(hanzi)).toBe(true);
  });
});

describe('SentenceDrill — bộ AI mới về', () => {
  it('freshIds mới không rỗng: mục đầu thành "Câu AI vừa tạo", đóng phần đã mở, cuộn lên đầu', async () => {
    const user = userEvent.setup();
    const oldAi = aiBatch(501, 3);
    const view = render(<SentenceDrill {...props({ sentences: [...SERVER_SENTENCES, ...oldAi] })} />);
    expect(headings()[0]).toContain('Câu AI tạo');

    await user.click(screen.getAllByRole('button', { name: 'Hiện Chữ Hán' })[0]);
    expect(shownHanzi().size).toBe(1);
    vi.mocked(Element.prototype.scrollIntoView).mockClear();

    // Máy chủ đã thay bộ: kho chỉ còn bộ mới, và trang báo mã bộ mới.
    const newAi = aiBatch(601, 20);
    const freshIds = newAi.map((sentence) => sentence.id);
    view.rerender(
      <SentenceDrill {...props({ sentences: [...SERVER_SENTENCES, ...newAi], freshIds })} />,
    );

    expect(headings()[0]).toContain('Câu AI vừa tạo');
    expect(headings()[0]).toContain('20 câu');
    expect(screen.getAllByText('AI')).toHaveLength(20);
    expect(shownHanzi().size).toBe(0);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);

    // Đổi bộ thì bộ AI hết "vừa tạo" nhưng vẫn hiện đủ.
    await user.click(screen.getByRole('button', { name: 'Đổi câu khác' }));
    expect(headings()[0]).toContain('Câu AI tạo');
    expect(screen.getAllByText('AI')).toHaveLength(20);
  });

  it('freshIds rỗng (tạo không ra câu nào) thì đứng yên', async () => {
    const user = userEvent.setup();
    const view = render(<SentenceDrill {...props({ sentences: [...SERVER_SENTENCES, ...aiBatch(501, 2)] })} />);
    await user.click(screen.getAllByRole('button', { name: 'Hiện Chữ Hán' })[0]);
    vi.mocked(Element.prototype.scrollIntoView).mockClear();

    view.rerender(
      <SentenceDrill {...props({ sentences: [...SERVER_SENTENCES, ...aiBatch(501, 2)], freshIds: [] })} />,
    );

    expect(shownHanzi().size).toBe(1);
    expect(headings()[0]).toContain('Câu AI tạo');
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });
});
