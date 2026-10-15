/**
 * Danh sách bài nghe đoạn văn: tự nhận tệp `bai-NN.ts`, xếp theo số bài, và
 * mọi bài đang có đều đủ dữ liệu để trang hiện được — bài soạn sót pinyin,
 * sót nghĩa, hay liệt kê một từ không hề có trong bài phải hỏng ở đây.
 */
import { describe, expect, it } from 'vitest';
import { buildPassageRegistry, findPassage, paragraphText, PASSAGES } from './registry.ts';
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
      const text = passage.paragraphs.map(paragraphText).join('');
      for (const word of passage.words) {
        expect(text.includes(word.hanzi), `${passage.id}: ${word.hanzi}`).toBe(true);
        expect(word.pinyin.trim(), word.hanzi).not.toBe('');
        expect(word.vi.trim(), word.hanzi).not.toBe('');
      }
    }
  });
});
