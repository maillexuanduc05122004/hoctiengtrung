/**
 * Danh sách bài nghe đoạn văn: tự nhận tệp `bai-NN.ts`, xếp theo số bài, và
 * mọi bài đang có đều đủ dữ liệu để trang hiện được — bài soạn sót pinyin,
 * sót nghĩa, hay liệt kê một từ không hề có trong bài phải hỏng ở đây.
 *
 * Bài 2 phải dùng ĐỦ mọi từ đã học: sót dù một từ là hỏng.
 */
import { describe, expect, it } from 'vitest';
import { LEARNED_WORDS } from './learned-words.ts';
import { buildPassageRegistry, coverageOf, findPassage, PASSAGES } from './registry.ts';
import type { Passage } from './types.ts';

const TINY: Passage = {
  title: '好',
  titlePinyin: 'Hǎo',
  titleVi: 'Tốt',
  level: 'HSK 1',
  pauseSeconds: 20,
  paragraphs: [{ sentences: [{ hanzi: '好。', pinyin: 'Hǎo.', vi: 'Tốt.' }] }],
  words: [],
};

describe('buildPassageRegistry', () => {
  it('lấy mã từ tên tệp, xếp theo số bài chứ không theo thứ tự chữ, bỏ tệp sai dạng', () => {
    const entries = buildPassageRegistry({
      './passages/bai-10.ts': TINY,
      './passages/bai-02.ts': TINY,
      './passages/bai-x.ts': TINY,
    });
    expect(entries.map((entry) => [entry.id, entry.number])).toEqual([
      ['bai-02', 2],
      ['bai-10', 10],
    ]);
  });
});

describe('các bài đang có', () => {
  it('bài 1 có 5 đoạn, nghỉ 20 giây sau mỗi đoạn', () => {
    const passage = findPassage('bai-01');
    expect(passage).not.toBeNull();
    expect(passage?.paragraphs).toHaveLength(5);
    expect(passage?.pauseSeconds).toBe(20);
  });

  it('bài 2 dài, dùng đủ toàn bộ từ đã học, mỗi từ đứng riêng ít nhất một lần', () => {
    const passage = findPassage('bai-02');
    expect(passage).not.toBeNull();
    if (passage === null) return;
    expect(passage.paragraphs.length).toBeGreaterThanOrEqual(20);
    const coverage = coverageOf(passage);
    expect(coverage.missing.map((word) => word.hanzi)).toEqual([]);
    expect(coverage.used).toBe(LEARNED_WORDS.length);
  });

  it('không kèm mã thì mở bài mới nhất', () => {
    expect(findPassage(undefined)?.id).toBe(PASSAGES.at(-1)?.id);
    expect(findPassage('khong-co')).toBeNull();
  });

  it('mọi câu đều đủ chữ Hán, pinyin và nghĩa', () => {
    for (const passage of PASSAGES) {
      expect(passage.title.trim(), passage.id).not.toBe('');
      expect(passage.titlePinyin.trim(), passage.id).not.toBe('');
      expect(passage.titleVi.trim(), passage.id).not.toBe('');
      expect(passage.pauseSeconds, passage.id).toBeGreaterThan(0);
      expect(passage.paragraphs.length, passage.id).toBeGreaterThan(0);
      for (const paragraph of passage.paragraphs) {
        expect(paragraph.sentences.length, passage.id).toBeGreaterThan(0);
        for (const sentence of paragraph.sentences) {
          expect(sentence.hanzi.trim(), passage.id).not.toBe('');
          expect(sentence.pinyin.trim(), sentence.hanzi).not.toBe('');
          expect(sentence.vi.trim(), sentence.hanzi).not.toBe('');
        }
      }
    }
  });

  it('mọi từ trong danh sách ôn lại đều thật sự xuất hiện trong bài', () => {
    for (const passage of PASSAGES) {
      const missing = coverageOf(passage, passage.words).missing.map((word) => word.hanzi);
      expect(missing, passage.id).toEqual([]);
      for (const word of passage.words) {
        expect(word.pinyin.trim(), word.hanzi).not.toBe('');
        expect(word.vi.trim(), word.hanzi).not.toBe('');
      }
    }
  });
});

describe('danh sách từ đã học', () => {
  it('có 319 từ, không trùng: 259 từ của lộ trình 300 từ (bỏ từ lặp) và 60 từ của ba bài nghe', () => {
    const hanzi = LEARNED_WORDS.map((word) => word.hanzi);
    expect(new Set(hanzi).size).toBe(hanzi.length);
    expect(hanzi).toHaveLength(319);
    for (const word of LEARNED_WORDS) {
      expect(word.pinyin.trim(), word.hanzi).not.toBe('');
      expect(word.vi.trim(), word.hanzi).not.toBe('');
    }
  });
});

describe('coverageOf', () => {
  const words = [
    { hanzi: '好', pinyin: 'hǎo', vi: 'tốt' },
    { hanzi: '好吃', pinyin: 'hǎochī', vi: 'ngon' },
    { hanzi: '回', pinyin: 'huí', vi: 'về' },
  ];
  const withText = (hanzi: string): Passage => ({
    ...TINY,
    paragraphs: [{ sentences: [{ hanzi, pinyin: '-', vi: '-' }] }],
  });

  it('từ ngắn chỉ nằm lọt trong một từ dài hơn của danh sách thì chưa tính là có', () => {
    const coverage = coverageOf(withText('这个菜很好吃。'), words);
    expect(coverage.missing.map((word) => word.hanzi)).toEqual(['好', '回']);
    expect(coverage.used).toBe(1);
  });

  it('từ ngắn đứng riêng ở chỗ khác thì tính', () => {
    const coverage = coverageOf(withText('这个菜很好吃，我很好。我回家了。'), words);
    expect(coverage.missing).toEqual([]);
    expect(coverage.used).toBe(3);
  });
});
