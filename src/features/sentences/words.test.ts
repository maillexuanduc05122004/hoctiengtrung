import { describe, expect, it } from 'vitest';
import type { UserWord } from '../../lib/api/types.ts';
import { inferLevel, toSentenceInputs } from './manual.ts';
import { groupWords, matchesWord, NEWEST_GROUP_SIZE } from './words.ts';

function word(id: number, simplified: string, pinyin: string, vi: string, hskLevel = 1): UserWord {
  return {
    id,
    wordId: 100 + id,
    simplified,
    pinyin,
    meaningVi: vi,
    hskLevel,
    status: 'LEARNED',
    // Mã càng lớn học càng muộn.
    learnedAt: new Date(Date.UTC(2026, 0, 1, 0, id)).toISOString(),
  };
}

describe('groupWords', () => {
  it('nhóm mới nhất đứng đầu, không lặp lại ở nhóm cấp, cấp xếp tăng dần', () => {
    const words = [
      ...Array.from({ length: 12 }, (_, i) => word(i + 1, `字${i + 1}`, 'zì', `nghĩa ${i + 1}`, 1)),
      word(20, '學', 'xué', 'học', 3),
      word(21, '校', 'xiào', 'trường', 2),
    ];
    const groups = groupWords(words);

    expect(groups.map((group) => group.key)).toEqual(['newest', 'hsk-1']);
    expect(groups[0].title).toBe(`${NEWEST_GROUP_SIZE} từ mới nhất`);
    // Hai từ cấp 2 và 3 học muộn nhất nên nằm trong nhóm mới nhất…
    expect(groups[0].words.map((item) => item.id)).toEqual([21, 20, 12, 11, 10, 9, 8, 7, 6, 5]);
    // …và vì thế nhóm cấp 2 và cấp 3 phải rỗng (bị lược), chỉ còn cấp 1 với 4 từ cũ.
    expect(groups.find((group) => group.key === 'hsk-1')?.words.map((item) => item.id)).toEqual([
      1, 2, 3, 4,
    ]);
    expect(groups.map((group) => group.key)).not.toContain('hsk-4');
    const total = groups.reduce((sum, group) => sum + group.words.length, 0);
    expect(total).toBe(words.length);
  });

  it('các nhóm cấp xếp tăng dần theo cấp HSK', () => {
    const words = [
      word(1, '一', 'yī', 'một', 3),
      word(2, '二', 'èr', 'hai', 1),
      word(3, '三', 'sān', 'ba', 2),
      ...Array.from({ length: 10 }, (_, i) => word(10 + i, `字${i}`, 'zì', `nghĩa ${i}`, 1)),
    ];
    expect(groupWords(words).map((group) => group.key)).toEqual([
      'newest',
      'hsk-1',
      'hsk-2',
      'hsk-3',
    ]);
  });

  it('ít hơn mười từ thì chỉ có nhóm mới nhất', () => {
    const groups = groupWords([word(1, '我', 'wǒ', 'tôi'), word(2, '你', 'nǐ', 'bạn')]);
    expect(groups).toHaveLength(1);
    expect(groups[0].title).toBe('2 từ mới nhất');
  });

  it('không có từ thì không có nhóm', () => {
    expect(groupWords([])).toEqual([]);
  });
});

describe('matchesWord', () => {
  const item = word(1, '现在', 'xiànzài', 'bây giờ');

  it('ô trống thì khớp tất cả', () => {
    expect(matchesWord(item, '')).toBe(true);
    expect(matchesWord(item, '  ')).toBe(true);
  });

  it('khớp chữ Hán, pinyin có hoặc không dấu, có hoặc không khoảng trắng', () => {
    expect(matchesWord(item, '现')).toBe(true);
    expect(matchesWord(item, 'xiànzài')).toBe(true);
    expect(matchesWord(item, 'xianzai')).toBe(true);
    expect(matchesWord(item, 'xian zai')).toBe(true);
    expect(matchesWord(item, 'XIAN')).toBe(true);
  });

  it('khớp nghĩa tiếng Việt có hoặc không dấu', () => {
    expect(matchesWord(item, 'bây giờ')).toBe(true);
    expect(matchesWord(item, 'bay gio')).toBe(true);
    expect(matchesWord(item, 'mua')).toBe(false);
  });

  it('khớp phồn thể và nghĩa tiếng Anh khi có', () => {
    const rich: UserWord = { ...item, traditional: '現在', meaningEn: 'now' };
    expect(matchesWord(rich, '現')).toBe(true);
    expect(matchesWord(rich, 'now')).toBe(true);
  });
});

describe('inferLevel', () => {
  it('đếm chữ Hán, bỏ dấu câu', () => {
    expect(inferLevel('现在几点？')).toBe(1);
    expect(inferLevel('妈妈在打电话。')).toBe(2);
    expect(inferLevel('昨天太热了，我在家睡觉。')).toBe(3);
  });
});

describe('toSentenceInputs', () => {
  it('chỉ gửi câu đủ ba phần, đếm câu thiếu', () => {
    const { inputs, incomplete } = toSentenceInputs([
      { hanzi: '他很忙。', pinyin: 'Tā hěn máng.', vi: 'Anh ấy rất bận.' },
      { hanzi: '我回家。', pinyin: 'Wǒ huí jiā.', vi: '' },
      { hanzi: '我写字。', pinyin: '', vi: 'Tôi viết chữ.' },
    ]);
    expect(inputs).toEqual([
      { hanzi: '他很忙。', pinyin: 'Tā hěn máng.', meaningVi: 'Anh ấy rất bận.', level: 1 },
    ]);
    expect(incomplete).toBe(2);
  });
});
