import { describe, expect, it } from 'vitest';
import { buildScanIndex, EMPTY_SCAN, scanText } from './scan.ts';
import type { HskLevel, VocabularyWord } from '../../types/vocabulary.ts';

function word(
  id: string,
  simplified: string,
  overrides: Partial<VocabularyWord> = {},
): VocabularyWord {
  return {
    id,
    simplified,
    pinyin: 'pīn yīn',
    pinyinPlain: 'pin yin',
    hskLevel: 1,
    meanings: { vi: ['nghĩa'], en: ['meaning'] },
    aliases: { vi: [], en: [], pinyin: [] },
    examples: [],
    source: 'test',
    datasetVersion: '1.0.0',
    translationStatus: 'reviewed',
    ...overrides,
  };
}

const WORDS: VocabularyWord[] = [
  word('L1-0001', '我'),
  word('L1-0002', '喜欢'),
  word('L1-0003', '中文'),
  word('L1-0004', '中', { traditional: '中' }),
  word('L2-0001', '学习', { hskLevel: 2 as HskLevel }),
  word('L2-0002', '汉语', { traditional: '漢語', hskLevel: 2 as HskLevel }),
  word('L3-0001', '爸', { writtenVariants: ['爸爸'], hskLevel: 3 as HskLevel }),
];

const INDEX = buildScanIndex(WORDS);

/** Ghép các mảnh lại phải ra đúng văn bản gốc, không thừa không thiếu một ký tự. */
function joined(text: string): string {
  return scanText(INDEX, text)
    .tokens.map((token) => token.text)
    .join('');
}

describe('buildScanIndex', () => {
  it('nhận cả phồn thể lẫn cách viết thay thế', () => {
    expect(INDEX.byHanzi.get('漢語')?.id).toBe('L2-0002');
    expect(INDEX.byHanzi.get('爸爸')?.id).toBe('L3-0001');
  });

  it('lấy độ dài của mục dài nhất', () => {
    expect(INDEX.maxLength).toBe(2);
  });

  it('giữ mục ở cấp thấp hơn khi hai từ trùng cách viết', () => {
    const both = buildScanIndex([
      word('L3-9999', '天', { hskLevel: 3 as HskLevel }),
      word('L1-9999', '天'),
    ]);
    expect(both.byHanzi.get('天')?.id).toBe('L1-9999');
  });
});

describe('scanText', () => {
  it('trả kết quả rỗng cho chuỗi rỗng', () => {
    expect(scanText(INDEX, '')).toBe(EMPTY_SCAN);
  });

  it('khớp cụm dài nhất trước', () => {
    const result = scanText(INDEX, '中文');
    expect(result.tokens.map((t) => t.text)).toEqual(['中文']);
    expect(result.found.map((w) => w.id)).toEqual(['L1-0003']);
  });

  it('tách được cả câu và giữ nguyên dấu câu', () => {
    const result = scanText(INDEX, '我喜欢学习中文。');
    expect(result.tokens.map((t) => t.text)).toEqual(['我', '喜欢', '学习', '中文', '。']);
    expect(result.found.map((w) => w.id)).toEqual(['L1-0001', 'L1-0002', 'L2-0001', 'L1-0003']);
    expect(result.hanziCount).toBe(7);
    expect(result.unknown).toEqual([]);
  });

  it('gom các chữ không tra được thành một cụm', () => {
    const result = scanText(INDEX, '我看书法');
    expect(result.tokens.map((t) => t.text)).toEqual(['我', '看书法']);
    expect(result.unknown).toEqual(['看书法']);
  });

  it('cắt cụm chưa tra được ngay tại chỗ có từ tra được', () => {
    const result = scanText(INDEX, '看书我');
    expect(result.tokens.map((t) => t.text)).toEqual(['看书', '我']);
    expect(result.unknown).toEqual(['看书']);
  });

  it('đếm số lần xuất hiện nhưng chỉ liệt kê mỗi từ một lần', () => {
    const result = scanText(INDEX, '我喜欢我，我喜欢中文');
    expect(result.counts.get('L1-0001')).toBe(3);
    expect(result.counts.get('L1-0002')).toBe(2);
    expect(result.found.map((w) => w.id)).toEqual(['L1-0001', 'L1-0002', 'L1-0003']);
  });

  it('không liệt kê trùng cụm chưa tra được', () => {
    const result = scanText(INDEX, '看书。看书');
    expect(result.unknown).toEqual(['看书']);
  });

  it('tra được cả chữ phồn thể', () => {
    const result = scanText(INDEX, '漢語');
    expect(result.found.map((w) => w.id)).toEqual(['L2-0002']);
  });

  it('bỏ qua phần không phải chữ Hán nhưng vẫn giữ lại để ghép về nguyên văn', () => {
    const result = scanText(INDEX, 'HSK 1: 我 (wǒ) 😀');
    expect(result.found.map((w) => w.id)).toEqual(['L1-0001']);
    expect(result.hanziCount).toBe(1);
    expect(result.tokens.filter((t) => t.hanzi).map((t) => t.text)).toEqual(['我']);
  });

  it('ghép các mảnh lại đúng bằng văn bản gốc', () => {
    for (const text of ['我喜欢学习中文。', '看书法', 'HSK 1: 我 (wǒ) 😀', '汉语\n漢語  ', '。。。']) {
      expect(joined(text)).toBe(text);
    }
  });
});
