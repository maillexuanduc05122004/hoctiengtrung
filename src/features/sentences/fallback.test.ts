import { describe, expect, it } from 'vitest';
import { MY_SENTENCES, MY_WORDS } from './corpus.ts';
import { FALLBACK_SENTENCES, FALLBACK_WORDS, isFallbackId } from './fallback.ts';
import { groupWords, newestWords } from './words.ts';

describe('bộ dự phòng đóng gói sẵn', () => {
  it('có đúng 89 từ và 90 câu như corpus, giữ nguyên chữ, pinyin, nghĩa và cấp', () => {
    expect(FALLBACK_WORDS).toHaveLength(MY_WORDS.length);
    expect(FALLBACK_SENTENCES).toHaveLength(MY_SENTENCES.length);
    for (const [i, word] of MY_WORDS.entries()) {
      expect(FALLBACK_WORDS[i]).toMatchObject({
        simplified: word.hanzi,
        pinyin: word.pinyin,
        meaningVi: word.vi,
        status: 'LEARNED',
      });
    }
    for (const [i, sentence] of MY_SENTENCES.entries()) {
      expect(FALLBACK_SENTENCES[i]).toMatchObject({
        hanzi: sentence.hanzi,
        pinyin: sentence.pinyin,
        meaningVi: sentence.vi,
        level: sentence.level,
        source: 'BUILTIN',
      });
    }
  });

  it('mọi mã đều âm và không trùng nhau, để không lẫn với mã máy chủ', () => {
    const wordIds = FALLBACK_WORDS.map((word) => word.id);
    const sentenceIds = FALLBACK_SENTENCES.map((sentence) => sentence.id);
    expect(wordIds.every(isFallbackId)).toBe(true);
    expect(sentenceIds.every(isFallbackId)).toBe(true);
    expect(FALLBACK_WORDS.every((word) => isFallbackId(word.wordId))).toBe(true);
    expect(new Set(wordIds).size).toBe(wordIds.length);
    expect(new Set(sentenceIds).size).toBe(sentenceIds.length);
    expect(isFallbackId(1)).toBe(false);
  });

  it('nhóm "10 từ mới gần nhất" của corpus đứng đầu bảng từ', () => {
    const expected = MY_WORDS.filter((word) => word.group === 'moi').map((word) => word.hanzi);
    const newest = newestWords(FALLBACK_WORDS).map((word) => word.simplified);
    expect(new Set(newest)).toEqual(new Set(expected));
    expect(groupWords(FALLBACK_WORDS)[0]?.title).toBe('10 từ mới nhất');
  });
});
