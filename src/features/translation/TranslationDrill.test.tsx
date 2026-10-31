/**
 * Dịch câu đi đúng một vòng: lúc đầu chỉ có tiếng Việt; viết trùng đáp án mẫu
 * thì đúng ngay, không gọi AI; viết khác thì AI xét lại và sửa; máy chủ không
 * có AI thì người học tự chấm được.
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { checkTranslation } from '../../lib/api/endpoints.ts';
import type { PracticeSentence } from '../sentence-practice/pool.ts';
import { checkTranslationLocally } from './check.ts';
import { TranslationDrill } from './TranslationDrill.tsx';

vi.mock('../../lib/api/endpoints.ts', () => ({ checkTranslation: vi.fn() }));

const SENTENCES: PracticeSentence[] = [
  {
    id: 'bai-06:ghep:1',
    lessonId: 'bai-06',
    lessonNumber: 6,
    source: 'ghep',
    hanzi: '这里的水果很便宜。',
    pinyin: 'Zhèlǐ de shuǐguǒ hěn piányi.',
    vi: 'Hoa quả ở đây rất rẻ.',
    newWords: ['便宜'],
  },
  {
    id: 'bai-06:ghep:2',
    lessonId: 'bai-06',
    lessonNumber: 6,
    source: 'ghep',
    hanzi: '我妹妹很怕狗。',
    pinyin: 'Wǒ mèimei hěn pà gǒu.',
    vi: 'Em gái tôi rất sợ chó.',
    newWords: ['怕'],
  },
];

const mocked = vi.mocked(checkTranslation);

beforeEach(() => {
  mocked.mockReset();
});

function box(): HTMLElement {
  return screen.getByRole('textbox', { name: 'Viết câu tiếng Trung' });
}

describe('checkTranslationLocally', () => {
  it('chữ Hán trùng đáp án (bỏ qua dấu câu) là đúng', () => {
    expect(checkTranslationLocally('这里的水果很便宜', SENTENCES[0]).verdict).toBe('correct');
  });

  it('không có chữ Hán thì so pinyin', () => {
    const result = checkTranslationLocally('zhe4li3 de shui3guo3 hen3 pian2yi', SENTENCES[0]);
    expect(result.script).toBe('pinyin');
    expect(result.verdict).toBe('correct');
  });

  it('lệch chữ thì không đúng và có chỗ sai', () => {
    const result = checkTranslationLocally('这里的苹果很便宜', SENTENCES[0]);
    expect(result.verdict).not.toBe('correct');
    expect(result.diff.some((part) => part.status !== 'ok')).toBe(true);
  });
});

describe('TranslationDrill', () => {
  it('lúc đầu chỉ hiện tiếng Việt; gợi ý mở dần từ mới rồi pinyin', async () => {
    const user = userEvent.setup();
    render(
      <TranslationDrill
        sentences={SENTENCES}
        tutor={{ state: 'ready' }}
        onNewRound={vi.fn()}
      />,
    );

    expect(screen.getByText('Hoa quả ở đây rất rẻ.')).toBeInTheDocument();
    expect(screen.queryByText('这里的水果很便宜。')).not.toBeInTheDocument();
    expect(screen.queryByText('Zhèlǐ de shuǐguǒ hěn piányi.')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Gợi ý: từ mới trong câu' }));
    expect(screen.getByText('便宜')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Gợi ý thêm: xem pinyin' }));
    expect(screen.getByText('Zhèlǐ de shuǐguǒ hěn piányi.')).toBeInTheDocument();
  });

  it('viết trùng đáp án mẫu thì đúng ngay, không gọi AI', async () => {
    const user = userEvent.setup();
    render(
      <TranslationDrill
        sentences={SENTENCES}
        tutor={{ state: 'ready' }}
        onNewRound={vi.fn()}
      />,
    );

    await user.type(box(), '这里的水果很便宜。{Enter}');
    expect(screen.getByText('Đúng')).toBeInTheDocument();
    const reference = screen.getByRole('region', { name: 'Đáp án mẫu' });
    expect(within(reference).getByText('这里的水果很便宜。')).toBeInTheDocument();
    expect(within(reference).getByText('Zhèlǐ de shuǐguǒ hěn piányi.')).toBeInTheDocument();
    expect(mocked).not.toHaveBeenCalled();
  });

  it('viết khác đáp án thì AI xét lại: nhận cách dịch khác mà vẫn đúng', async () => {
    mocked.mockResolvedValue({
      verdict: 'correct',
      corrected: '这儿的水果很便宜。',
      correctedPinyin: 'Zhèr de shuǐguǒ hěn piányi.',
      explanation: 'Dùng 这儿 thay 这里 cũng đúng.',
      mistakes: [],
      model: 'thu',
    });
    const user = userEvent.setup();
    render(
      <TranslationDrill
        sentences={SENTENCES}
        tutor={{ state: 'ready' }}
        onNewRound={vi.fn()}
      />,
    );

    await user.type(box(), '这儿的水果很便宜{Enter}');
    expect(await screen.findByText('Dùng 这儿 thay 这里 cũng đúng.')).toBeInTheDocument();
    expect(screen.getByText('Đúng')).toBeInTheDocument();
    expect(mocked).toHaveBeenCalledWith(
      {
        vi: 'Hoa quả ở đây rất rẻ.',
        expectedHanzi: '这里的水果很便宜。',
        expectedPinyin: 'Zhèlǐ de shuǐguǒ hěn piányi.',
        answer: '这儿的水果很便宜',
      },
      expect.any(AbortSignal),
    );
  });

  it('AI chỉ ra lỗi và câu sửa', async () => {
    mocked.mockResolvedValue({
      verdict: 'wrong',
      corrected: '我妹妹很怕狗。',
      correctedPinyin: 'Wǒ mèimei hěn pà gǒu.',
      explanation: 'Sai từ "sợ".',
      mistakes: [{ wrong: '爱', right: '怕', note: '怕 là sợ, 爱 là yêu.' }],
      model: 'thu',
    });
    const user = userEvent.setup();
    render(
      <TranslationDrill
        sentences={[SENTENCES[1]]}
        tutor={{ state: 'ready' }}
        onNewRound={vi.fn()}
      />,
    );

    await user.type(box(), '我妹妹很爱狗{Enter}');
    expect(await screen.findByText('Sai từ "sợ".')).toBeInTheDocument();
    expect(screen.getByText('Chưa đúng')).toBeInTheDocument();
    expect(screen.getByText('AI sửa câu của bạn thành:')).toBeInTheDocument();
    expect(screen.getByText(/怕 là sợ/)).toBeInTheDocument();
  });

  it('máy chủ không có AI: không gọi AI, người học tự chấm được rồi xem kết quả', async () => {
    const onNewRound = vi.fn();
    const user = userEvent.setup();
    render(
      <TranslationDrill
        sentences={[SENTENCES[1]]}
        tutor={{ state: 'off', reason: 'Chưa cấu hình' }}
        onNewRound={onNewRound}
      />,
    );

    await user.type(box(), '我的妹妹很怕狗{Enter}');
    expect(mocked).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Tôi dịch đúng, chỉ khác cách nói' }));
    expect(screen.getByText('Đúng')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Xem kết quả' }));
    expect(screen.getByText('1 đúng · 0 gần đúng · 0 chưa đúng hoặc bỏ qua.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Lượt mới với câu khác' }));
    expect(onNewRound).toHaveBeenCalled();
  });
});
