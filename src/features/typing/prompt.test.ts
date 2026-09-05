import { describe, expect, it } from 'vitest';
import {
  buildChallenge,
  gradeChallenge,
  hintUnits,
  makeChallenge,
  seededRandom,
  type TypingPromptKind,
} from './prompt.ts';
import type { VocabularyWord } from '../../types/vocabulary.ts';

function word(partial: Partial<VocabularyWord> = {}): VocabularyWord {
  return {
    id: 'L1-0001',
    simplified: '爱',
    traditional: '愛',
    pinyin: 'ài',
    pinyinPlain: 'ai',
    hskLevel: 1,
    meanings: { vi: ['yêu', 'thích'], en: ['to love', 'to be fond of'] },
    aliases: { vi: ['thương'], en: [], pinyin: [] },
    examples: [],
    source: 'kiểm thử',
    datasetVersion: '1.0.0',
    translationStatus: 'machine',
    ...partial,
  };
}

/** Bốn số ngẫu nhiên rơi vào bốn ô của danh sách bốn dạng đề. */
const ROLLS = [0, 0.3, 0.6, 0.9];

describe('buildChallenge', () => {
  it('sinh đủ bốn dạng đề khi từ có đủ dữ liệu', () => {
    const kinds = ROLLS.map((roll) => buildChallenge(word(), () => roll).kind);
    expect(kinds).toEqual<TypingPromptKind[]>([
      'vi-to-zh',
      'en-to-zh',
      'zh-to-pinyin',
      'pinyin-to-meaning',
    ]);
  });

  it('mô tả đúng đề bài của từng dạng', () => {
    const vi = makeChallenge(word(), 'vi-to-zh');
    expect(vi.question).toBe('yêu; thích');
    expect(vi.answerKind).toBe('hanzi');
    expect(vi.instruction).toContain('pinyin');

    const en = makeChallenge(word(), 'en-to-zh');
    expect(en.question).toBe('to love; to be fond of');
    expect(en.questionKind).toBe('en');

    const zh = makeChallenge(word(), 'zh-to-pinyin');
    expect(zh.question).toBe('爱');
    expect(zh.answerKind).toBe('pinyin');
    expect(zh.alternate).toBeNull();

    const meaning = makeChallenge(word(), 'pinyin-to-meaning');
    expect(meaning.question).toBe('ài');
    expect(meaning.answerKind).toBe('vi');
    expect(meaning.alternate?.answerKind).toBe('en');
  });

  it('bỏ những dạng đề mà từ không có dữ liệu', () => {
    const thin = word({ meanings: { vi: [], en: [] }, aliases: { vi: [], en: [], pinyin: [] } });
    const kinds = new Set(ROLLS.map((roll) => buildChallenge(thin, () => roll).kind));
    expect([...kinds]).toEqual(['zh-to-pinyin']);
  });

  it('ra đề chấm được khi từ chỉ còn chữ Hán', () => {
    const bare = word({
      pinyin: '',
      meanings: { vi: [], en: [] },
      aliases: { vi: [], en: [], pinyin: [] },
    });
    const challenge = buildChallenge(bare, () => 0);
    // Chữ Hán là thứ duy nhất chắc chắn có, nên phải lấy nó làm đáp án thì người
    // học mới gõ đúng được và nút gợi ý mới mở ra được thứ gì.
    expect(challenge.answerKind).toBe('hanzi');
    expect(gradeChallenge(challenge, '爱', false).verdict).toBe('correct');
    expect(hintUnits(challenge)).toEqual(['爱']);
  });

  it('không vượt mảng khi bộ sinh trả về giá trị ở biên', () => {
    expect(buildChallenge(word(), () => 1).kind).toBe('pinyin-to-meaning');
    expect(buildChallenge(word(), () => Number.NaN).kind).toBe('vi-to-zh');
  });
});

describe('gradeChallenge', () => {
  it('chấp nhận cả đáp án chữ Hán lẫn đáp án pinyin cho dạng vi-to-zh', () => {
    const challenge = makeChallenge(word(), 'vi-to-zh');
    expect(gradeChallenge(challenge, '爱', false).verdict).toBe('correct');
    expect(gradeChallenge(challenge, 'ài', false).verdict).toBe('correct');
    // Chữ phồn thể cũng là một cách viết đúng của cùng một từ.
    expect(gradeChallenge(challenge, '愛', false).verdict).toBe('correct');
    expect(gradeChallenge(challenge, '我', false).verdict).toBe('wrong');
  });

  it('coi thiếu dấu thanh là gần đúng chứ không phải sai', () => {
    const challenge = makeChallenge(word(), 'vi-to-zh');
    const result = gradeChallenge(challenge, 'ai', false);
    expect(result.verdict).toBe('close');
    expect(result.reason).toBe('tone-missing');
  });

  it('chấp nhận nghĩa tiếng Việt hoặc tiếng Anh cho dạng pinyin-to-meaning', () => {
    const challenge = makeChallenge(word(), 'pinyin-to-meaning');
    expect(gradeChallenge(challenge, 'yêu', false).verdict).toBe('correct');
    expect(gradeChallenge(challenge, 'love', false).verdict).toBe('correct');
    // Nghĩa phụ đã duyệt cũng được tính đúng.
    expect(gradeChallenge(challenge, 'thương', false).verdict).toBe('correct');
  });

  it('giữ nguyên cờ usedHint trong kết quả', () => {
    const challenge = makeChallenge(word(), 'zh-to-pinyin');
    expect(gradeChallenge(challenge, 'ài', true).usedHint).toBe(true);
    expect(gradeChallenge(challenge, 'ài', false).usedHint).toBe(false);
    // Cả khi trả lời sai và cả khi bỏ trống, cờ gợi ý vẫn phải theo đúng đầu vào.
    expect(gradeChallenge(challenge, 'wǒ', true).usedHint).toBe(true);
    expect(gradeChallenge(challenge, '', true).usedHint).toBe(true);
  });
});

describe('hintUnits', () => {
  it('mở dần theo từng chữ Hán', () => {
    const challenge = makeChallenge(word({ simplified: '爱好', pinyin: 'ài hào' }), 'vi-to-zh');
    expect(hintUnits(challenge)).toEqual(['爱', '好']);
  });

  it('mở dần theo từng âm tiết với đáp án pinyin', () => {
    const challenge = makeChallenge(word({ simplified: '爱好', pinyin: 'ài hào' }), 'zh-to-pinyin');
    expect(hintUnits(challenge)).toEqual(['ài', 'hào']);
  });
});

describe('seededRandom', () => {
  it('cùng một hạt cho cùng một dãy số', () => {
    const a = seededRandom('L1-0001|2');
    const b = seededRandom('L1-0001|2');
    expect(a()).toBe(b());
  });

  it('hạt khác nhau thì dãy số khác nhau', () => {
    expect(seededRandom('L1-0001|2')()).not.toBe(seededRandom('L1-0002|2')());
  });

  it('luôn nằm trong nửa khoảng [0, 1)', () => {
    const next = seededRandom('L1-0003|0');
    for (let i = 0; i < 200; i++) {
      const value = next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});
