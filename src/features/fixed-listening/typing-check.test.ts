/**
 * Chấm câu pinyin dài: đúng là đúng dù gõ số hay dấu, liền hay cách; 一 / 不
 * thanh gốc cũng đúng; âm tiết thanh nhẹ gõ thanh nào cũng được; sai thanh thì
 * nói đúng âm tiết thứ mấy.
 */
import { describe, expect, it } from 'vitest';
import { checkTyping, sandhiFreePinyin, syllableCount } from './typing-check.ts';
import type { FixedTypingSentence } from './types.ts';

const SENTENCE: FixedTypingSentence = {
  hanzi: '我们一起去饭馆，但是我不太饿。',
  pinyin: 'Wǒmen yìqǐ qù fànguǎn, dànshì wǒ bú tài è.',
  vi: 'Chúng ta cùng đi quán ăn, nhưng tôi không đói lắm.',
};

const TONES = { tones: true };

describe('checkTyping', () => {
  it('gõ đúng bằng số, bằng dấu, viết liền hay cách, có hay không dấu câu đều đúng', () => {
    for (const input of [
      'wo3men yi4qi3 qu4 fan4guan3 dan4shi4 wo3 bu2 tai4 e4',
      'Wǒmen yìqǐ qù fànguǎn, dànshì wǒ bú tài è.',
      'wǒmenyìqǐqùfànguǎndànshìwǒbútàiè',
    ]) {
      expect(checkTyping(input, SENTENCE, TONES).verdict).toBe('correct');
    }
  });

  it('一 và 不 gõ thanh gốc (yi1qi3, bu4 tai4) cũng đúng', () => {
    const input = 'wo3men yi1qi3 qu4 fan4guan3 dan4shi4 wo3 bu4 tai4 e4';
    expect(checkTyping(input, SENTENCE, TONES).verdict).toBe('correct');
  });

  it('âm tiết thanh nhẹ trong đáp án gõ thanh nào cũng được', () => {
    const input = 'wo3men2 yi4qi3 qu4 fan4guan3 dan4shi4 wo3 bu2 tai4 e4';
    expect(checkTyping(input, SENTENCE, TONES).verdict).toBe('correct');
  });

  it('sai thanh thì gần đúng, nói đúng âm tiết thứ mấy và đánh dấu đúng âm đó', () => {
    const result = checkTyping('wo3men yi4qi3 qu4 fan2guan3 dan4shi4 wo3 bu2 tai4 e4', SENTENCE, TONES);
    expect(result.verdict).toBe('close');
    expect(result.explanation).toBe('Sai thanh điệu ở âm tiết thứ 6.');
    expect(result.diff.filter((part) => part.status === 'wrong').map((part) => part.text)).toEqual([
      'fán',
    ]);
  });

  it('không gõ thanh nào: gần đúng khi đang chấm thanh, đúng khi chỉ chấm âm', () => {
    const input = 'women yiqi qu fanguan danshi wo bu tai e';
    const strict = checkTyping(input, SENTENCE, TONES);
    expect(strict.verdict).toBe('close');
    expect(strict.explanation).toBe('Đúng âm nhưng thiếu dấu thanh.');
    expect(checkTyping(input, SENTENCE, { tones: false }).verdict).toBe('correct');
  });

  it('sai âm thì không nhờ "chỉ chấm âm" mà thành đúng', () => {
    const input = 'women yiqi qu fanguan danshi ni bu tai e';
    expect(checkTyping(input, SENTENCE, { tones: false }).verdict).not.toBe('correct');
  });
});

describe('sandhiFreePinyin và syllableCount', () => {
  it('trả 一 / 不 về thanh gốc, câu không có chỗ biến điệu thì không có bản nào khác', () => {
    expect(sandhiFreePinyin(SENTENCE)).toBe('wǒ men yī qǐ qù fàn guǎn dàn shì wǒ bù tài è');
    expect(sandhiFreePinyin({ hanzi: '我很好。', pinyin: 'Wǒ hěn hǎo.', vi: '' })).toBeNull();
  });

  it('đếm mỗi chữ Hán một âm tiết, bỏ dấu câu', () => {
    expect(syllableCount(SENTENCE)).toBe(13);
  });
});
