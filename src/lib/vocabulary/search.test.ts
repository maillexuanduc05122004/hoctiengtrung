import { describe, expect, it } from 'vitest';
import { buildSearchIndex, searchWords } from './search.ts';
import type { VocabularyWord } from '../../types/vocabulary.ts';

function word(partial: Partial<VocabularyWord> & Pick<VocabularyWord, 'id' | 'simplified'>): VocabularyWord {
  return {
    pinyin: 'nǐ hǎo',
    pinyinPlain: 'ni hao',
    hskLevel: 1,
    meanings: { vi: [], en: [] },
    aliases: { vi: [], en: [], pinyin: [] },
    examples: [],
    source: 'kiểm thử',
    datasetVersion: '1.0.0',
    translationStatus: 'machine',
    ...partial,
  };
}

const WORDS: VocabularyWord[] = [
  word({
    id: 'L1-0001',
    simplified: '你好',
    traditional: '你好',
    pinyin: 'nǐ hǎo',
    pinyinPlain: 'ni hao',
    meanings: { vi: ['xin chào'], en: ['hello', 'hi'] },
    aliases: { vi: ['chào'], en: [], pinyin: [] },
  }),
  word({
    id: 'L1-0002',
    simplified: '爱',
    traditional: '愛',
    pinyin: 'ài',
    pinyinPlain: 'ai',
    meanings: { vi: ['yêu', 'thích'], en: ['to love'] },
    aliases: { vi: ['thương'], en: [], pinyin: [] },
  }),
  word({
    id: 'L1-0003',
    simplified: '爸爸',
    pinyin: 'bà ba',
    pinyinPlain: 'ba ba',
    meanings: { vi: ['bố', 'cha'], en: ['father', 'dad'] },
    aliases: { vi: ['ba'], en: [], pinyin: ['bà'] },
    writtenVariants: ['爸'],
  }),
  word({
    id: 'L2-0004',
    simplified: '绿',
    pinyin: 'lǜ',
    pinyinPlain: 'lu',
    hskLevel: 2,
    meanings: { vi: ['xanh lá'], en: ['green'] },
    aliases: { vi: [], en: [], pinyin: [] },
  }),
];

const index = buildSearchIndex(WORDS);
const ids = (query: string): string[] => searchWords(index, query).map((hit) => hit.word.id);

describe('searchWords', () => {
  it('truy vấn rỗng không trả kết quả nào', () => {
    expect(searchWords(index, '')).toEqual([]);
    expect(searchWords(index, '   ')).toEqual([]);
  });

  it('tìm theo chữ Hán giản thể', () => {
    expect(ids('你好')[0]).toBe('L1-0001');
    expect(ids('爱')[0]).toBe('L1-0002');
  });

  it('tìm theo chữ phồn thể', () => {
    expect(ids('愛')).toContain('L1-0002');
  });

  it('tìm theo cách viết thay thế', () => {
    expect(ids('爸')).toContain('L1-0003');
  });

  it('tìm theo pinyin có dấu thanh', () => {
    expect(ids('nǐ hǎo')[0]).toBe('L1-0001');
  });

  it('tìm theo pinyin không dấu và viết liền', () => {
    expect(ids('nihao')[0]).toBe('L1-0001');
    expect(ids('ni hao')[0]).toBe('L1-0001');
    expect(ids('baba')[0]).toBe('L1-0003');
  });

  it('tìm theo pinyin dạng số', () => {
    expect(ids('ni3hao3')[0]).toBe('L1-0001');
  });

  it('tìm được ü qua cách viết v', () => {
    expect(ids('lv')).toContain('L2-0004');
  });

  it('tìm theo tiếng Việt có dấu', () => {
    expect(ids('yêu')[0]).toBe('L1-0002');
    expect(ids('xin chào')[0]).toBe('L1-0001');
  });

  it('tìm theo tiếng Việt không dấu', () => {
    expect(ids('yeu')).toContain('L1-0002');
    expect(ids('xin chao')).toContain('L1-0001');
    expect(ids('bo')).toContain('L1-0003');
  });

  it('tìm theo cách nói đồng nghĩa tiếng Việt', () => {
    expect(ids('thương')).toContain('L1-0002');
  });

  it('tìm theo tiếng Anh', () => {
    expect(ids('hello')[0]).toBe('L1-0001');
    expect(ids('father')).toContain('L1-0003');
  });

  it('ghi rõ trường đã khớp', () => {
    expect(searchWords(index, '你好')[0].field).toBe('hanzi');
    expect(searchWords(index, 'nihao')[0].field).toBe('pinyin');
    expect(searchWords(index, 'yêu')[0].field).toBe('vi');
    expect(searchWords(index, 'green')[0].field).toBe('en');
  });

  it('khớp chính xác được xếp trên khớp một phần', () => {
    const hits = searchWords(index, 'ba');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].score).toBeGreaterThanOrEqual(hits[hits.length - 1].score);
  });

  it('tôn trọng giới hạn số kết quả', () => {
    expect(searchWords(index, 'a', { limit: 2 }).length).toBeLessThanOrEqual(2);
  });

  it('truy vấn không khớp gì thì trả mảng rỗng', () => {
    expect(searchWords(index, 'zzzzzz')).toEqual([]);
  });
});
