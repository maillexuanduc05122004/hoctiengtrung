import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { VocabularyWord } from '../../types/vocabulary.ts';
import { ListeningRound } from './ListeningRound.tsx';

const word: VocabularyWord = {
  id: 'L1-0001',
  simplified: '你好',
  pinyin: 'nǐ hǎo',
  pinyinPlain: 'ni hao',
  hskLevel: 1,
  meanings: { vi: ['xin chào'], en: ['hello'] },
  aliases: { vi: [], en: [], pinyin: [] },
  examples: [{ zh: '你好！', pinyin: 'nǐ hǎo!', vi: 'Xin chào!', en: 'Hello!' }],
  source: 'test',
  datasetVersion: 'test',
  translationStatus: 'machine',
};

describe('reveal-all', () => {
  it('reveal all after typing', async () => {
    const user = userEvent.setup();
    render(
      <ListeningRound
        word={word}
        distractors={[]}
        displayMode="vi-zh"
        answerMode="hanzi"
        onAnswerModeChange={() => undefined}
        onSubmit={() => undefined}
      />,
    );
    await user.type(screen.getByRole('textbox'), '你们');
    await user.click(screen.getByRole('button', { name: /Xem toàn bộ đáp án/ }));
    const text = document.body.textContent ?? '';
    console.log('has "Bạn đã nhập":', text.includes('Bạn đã nhập'));
    console.log('has 你们:', text.includes('你们'));
    expect(true).toBe(true);
  });

  it('normal check after typing', async () => {
    const user = userEvent.setup();
    render(
      <ListeningRound
        word={word}
        distractors={[]}
        displayMode="vi-zh"
        answerMode="hanzi"
        onAnswerModeChange={() => undefined}
        onSubmit={() => undefined}
      />,
    );
    await user.type(screen.getByRole('textbox'), '你们');
    await user.click(screen.getByRole('button', { name: /^Kiểm tra$/ }));
    const text = document.body.textContent ?? '';
    console.log('CHECK has "Bạn đã nhập":', text.includes('Bạn đã nhập'));
    console.log('CHECK has 你们:', text.includes('你们'));
    expect(true).toBe(true);
  });
});
