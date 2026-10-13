/**
 * Danh sách bài nghe cố định: tự nhận tệp `bai-NN.ts`, xếp theo số bài, và
 * mọi bài đang có đều đủ dữ liệu để trang hiện được — bài nhập sai (thiếu
 * pinyin, thiếu nghĩa, tốc độ lạ) phải hỏng ở đây chứ không lộ ra trên trang.
 */
import { describe, expect, it } from 'vitest';
import { buildRegistry, findFixedLesson, FIXED_LISTENING_LESSONS, itemCount } from './registry.ts';
import type { FixedListeningLesson } from './types.ts';

const TINY: FixedListeningLesson = {
  title: 'Bài thử',
  notes: [],
  rate: 0.75,
  sections: [{ title: 'Mục', itemLabel: 'Từ', items: [{ hanzi: '好', pinyin: 'hǎo', vi: 'tốt' }] }],
};

describe('buildRegistry', () => {
  it('lấy mã từ tên tệp, xếp theo số bài chứ không theo thứ tự chữ, bỏ tệp sai dạng', () => {
    const entries = buildRegistry({
      './lessons/bai-10.ts': TINY,
      './lessons/bai-02.ts': TINY,
      './lessons/bai-x.ts': TINY,
    });
    expect(entries.map((entry) => [entry.id, entry.number])).toEqual([
      ['bai-02', 2],
      ['bai-10', 10],
    ]);
  });
});

describe('các bài đang có', () => {
  it('có bài 1 với 20 từ mới và 50 câu ghép', () => {
    const lesson = findFixedLesson('bai-01');
    expect(lesson).not.toBeNull();
    expect(lesson?.sections.map((section) => section.items.length)).toEqual([20, 50]);
    expect(lesson?.rate).toBe(0.75);
    expect(lesson ? itemCount(lesson) : 0).toBe(70);
  });

  it('mọi bài đều đủ chữ Hán, pinyin, nghĩa và có tốc độ bộ đọc nhận được', () => {
    const numbers = new Set<number>();
    for (const lesson of FIXED_LISTENING_LESSONS) {
      expect(numbers.has(lesson.number)).toBe(false);
      numbers.add(lesson.number);

      expect(lesson.title).not.toBe('');
      expect(lesson.rate).toBeGreaterThanOrEqual(0.5);
      expect(lesson.rate).toBeLessThanOrEqual(2);
      expect(lesson.sections.length).toBeGreaterThan(0);
      for (const section of lesson.sections) {
        expect(section.itemLabel).not.toBe('');
        expect(section.items.length).toBeGreaterThan(0);
        for (const item of section.items) {
          expect(item.hanzi).not.toBe('');
          expect(item.pinyin).not.toBe('');
          expect(item.vi).not.toBe('');
        }
      }
    }
  });

  it('mã lạ hay thiếu mã thì không tìm thấy bài', () => {
    expect(findFixedLesson('bai-999')).toBeNull();
    expect(findFixedLesson(undefined)).toBeNull();
  });
});
