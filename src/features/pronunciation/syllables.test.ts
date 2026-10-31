/**
 * Ghép chữ với âm tiết để AI chấm và để tô màu từng chữ; so chữ máy nghe được
 * với câu mẫu cho cách chấm bằng nhận dạng của trình duyệt.
 */
import { describe, expect, it } from 'vitest';
import { PRACTICE_SENTENCES, hanziLength } from '../sentence-practice/pool.ts';
import { compareTranscript, expectedSyllables } from './syllables.ts';

describe('expectedSyllables', () => {
  it('ghép từng chữ với âm tiết, giữ dấu thanh và thanh nhẹ', () => {
    expect(expectedSyllables('我们去吧。', 'Wǒmen qù ba.')).toEqual([
      { hanzi: '我', pinyin: 'wǒ' },
      { hanzi: '们', pinyin: 'men' },
      { hanzi: '去', pinyin: 'qù' },
      { hanzi: '吧', pinyin: 'ba' },
    ]);
  });

  it('dấu cách âm và chữ viết hoa không làm lệch hàng', () => {
    expect(expectedSyllables('祝你平安！', "Zhù nǐ píng'ān!")?.map((s) => s.pinyin)).toEqual([
      'zhù',
      'nǐ',
      'píng',
      'ān',
    ]);
  });

  it('nhi hoá hay lệch số âm tiết thì trả null thay vì đoán', () => {
    expect(expectedSyllables('我在这儿。', 'Wǒ zài zhèr.')).toBeNull();
    expect(expectedSyllables('我很好。', 'Wǒ hǎo.')).toBeNull();
  });

  it('mọi câu dài tập gõ pinyin đều ghép được, nên luyện phát âm có đủ câu dài', () => {
    const long = PRACTICE_SENTENCES.filter((s) => s.source === 'dai');
    expect(long.length).toBeGreaterThanOrEqual(120);
    for (const s of long) {
      expect(expectedSyllables(s.hanzi, s.pinyin), s.hanzi).not.toBeNull();
      expect(hanziLength(s.hanzi)).toBeGreaterThanOrEqual(10);
    }
  });
});

describe('compareTranscript', () => {
  const expected = expectedSyllables('我们明天去北京。', 'Wǒmen míngtiān qù Běijīng.') ?? [];

  it('nghe đúng cả câu thì 100%', () => {
    expect(compareTranscript(expected, '我们明天去北京').percent).toBe(100);
  });

  it('đánh dấu chữ nghe thành chữ khác và chữ bị bỏ sót', () => {
    const result = compareTranscript(expected, '我们名天北京');
    expect(result.marks).toEqual(['ok', 'ok', 'wrong', 'ok', 'missing', 'ok', 'ok']);
    expect(result.percent).toBe(71);
  });
});
