/**
 * Dữ liệu câu gõ pinyin: pinyin viết tay nên phải khớp chữ Hán từng âm tiết —
 * lệch một âm là cả câu chấm sai mãi mãi mà người học không biết vì sao. Mỗi
 * câu còn phải là câu DÀI và dùng từ mới của chính bài đó, và mọi từ mới của
 * bài đều phải có mặt ít nhất một lần.
 */
import { describe, expect, it } from 'vitest';
import { parsePinyin } from '../../lib/pinyin/index.ts';
import { FIXED_LISTENING_LESSONS, newWordsOf } from './registry.ts';
import { checkTyping, syllableCount } from './typing-check.ts';

const WITH_TYPING = FIXED_LISTENING_LESSONS.filter((lesson) => lesson.typing.length > 0);

describe('câu gõ pinyin của các bài', () => {
  it('năm bài đầu đều có 20 câu', () => {
    expect(WITH_TYPING.map((lesson) => [lesson.id, lesson.typing.length])).toEqual([
      ['bai-01', 20],
      ['bai-02', 20],
      ['bai-03', 20],
      ['bai-04', 20],
      ['bai-05', 20],
    ]);
  });

  for (const lesson of WITH_TYPING) {
    describe(lesson.id, () => {
      it('mỗi câu: pinyin tách được và đủ một âm tiết cho mỗi chữ Hán', () => {
        for (const sentence of lesson.typing) {
          const syllables = parsePinyin(sentence.pinyin);
          expect(syllables, sentence.pinyin).not.toBeNull();
          expect(syllables?.length, sentence.pinyin).toBe(syllableCount(sentence));
          expect(sentence.vi).not.toBe('');
        }
      });

      it('mỗi câu dài ít nhất 12 chữ và có ít nhất một từ mới của bài', () => {
        const words = newWordsOf(lesson);
        for (const sentence of lesson.typing) {
          expect(syllableCount(sentence), sentence.pinyin).toBeGreaterThanOrEqual(12);
          expect(words.some((word) => sentence.hanzi.includes(word)), sentence.pinyin).toBe(true);
        }
      });

      it('mọi từ mới của bài đều được tập ít nhất một lần', () => {
        const unused = newWordsOf(lesson).filter(
          (word) => !lesson.typing.some((sentence) => sentence.hanzi.includes(word)),
        );
        expect(unused).toEqual([]);
      });

      it('gõ y nguyên đáp án thì được chấm đúng', () => {
        for (const sentence of lesson.typing) {
          expect(checkTyping(sentence.pinyin, sentence, { tones: true }).verdict).toBe('correct');
        }
      });
    });
  }
});
