/**
 * Tra từ theo chữ Hán, pinyin (có hoặc không dấu), tiếng Việt (có hoặc không
 * dấu) và tiếng Anh.
 *
 * Chỉ mục được dựng một lần cho mỗi bộ từ rồi dùng lại, vì hộp tra từ được mở
 * ngay giữa lúc làm bài nên không được khựng.
 */
import type { VocabularyWord } from '../../types/vocabulary.ts';
import { pinyinSearchKey, toAsciiPinyin } from '../pinyin/index.ts';
import { searchKey, normalizeLoose } from '../text/vietnamese.ts';

/** Trường đã khớp, dùng để giải thích vì sao kết quả xuất hiện. */
export type SearchField = 'hanzi' | 'pinyin' | 'vi' | 'en';

export interface SearchHit {
  word: VocabularyWord;
  field: SearchField;
  /** Điểm càng cao càng khớp sát. */
  score: number;
}

interface IndexedWord {
  word: VocabularyWord;
  hanzi: string[];
  /** Pinyin đã bỏ dấu thanh và bỏ khoảng trắng, ví dụ "nihao". */
  pinyinKeys: string[];
  /** Pinyin đã bỏ dấu thanh nhưng giữ khoảng trắng, ví dụ "ni hao". */
  pinyinSpaced: string[];
  viKeys: string[];
  viRaw: string[];
  enKeys: string[];
}

export interface SearchIndex {
  entries: IndexedWord[];
}

export function buildSearchIndex(words: readonly VocabularyWord[]): SearchIndex {
  const entries = words.map<IndexedWord>((word) => {
    const hanzi = [word.simplified, word.traditional, ...(word.writtenVariants ?? [])].filter(
      (value): value is string => typeof value === 'string' && value !== '',
    );
    const pinyinForms = [word.pinyin, word.pinyinPlain, ...word.aliases.pinyin];
    return {
      word,
      hanzi,
      pinyinKeys: unique(pinyinForms.map(pinyinSearchKey)),
      pinyinSpaced: unique(pinyinForms.map((p) => toAsciiPinyin(p).replace(/\s+/g, ' ').trim())),
      viKeys: unique([...word.meanings.vi, ...word.aliases.vi].map(searchKey)),
      viRaw: unique([...word.meanings.vi, ...word.aliases.vi].map(normalizeLoose)),
      enKeys: unique([...word.meanings.en, ...word.aliases.en].map(searchKey)),
    };
  });
  return { entries };
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values.filter((v) => v !== ''))];
}

/** Điểm khớp của một truy vấn với một danh sách giá trị. */
function scoreAgainst(values: readonly string[], query: string): number {
  let best = 0;
  for (const value of values) {
    if (value === query) return 100;
    if (value.startsWith(query)) best = Math.max(best, 70 - Math.min(value.length - query.length, 20));
    else if (value.includes(query)) best = Math.max(best, 40 - Math.min(value.length - query.length, 20));
    else {
      // Khớp theo từng từ giúp tìm "yêu" trong "yêu thích, mến".
      for (const token of value.split(/[\s,;/]+/)) {
        if (token === query) best = Math.max(best, 85);
        else if (token.startsWith(query) && query.length >= 2) best = Math.max(best, 55);
      }
    }
  }
  return best;
}

const HAS_HAN = /[㐀-鿿豈-﫿〇]/;

export interface SearchOptions {
  limit?: number;
}

/** Tìm từ theo mọi trường. Truy vấn rỗng trả về mảng rỗng. */
export function searchWords(
  index: SearchIndex,
  rawQuery: string,
  options: SearchOptions = {},
): SearchHit[] {
  const limit = options.limit ?? 20;
  const trimmed = rawQuery.trim();
  if (trimmed === '') return [];

  const hits: SearchHit[] = [];

  if (HAS_HAN.test(trimmed)) {
    for (const entry of index.entries) {
      const score = scoreAgainst(entry.hanzi, trimmed);
      if (score > 0) hits.push({ word: entry.word, field: 'hanzi', score: score + 10 });
    }
  } else {
    const loose = normalizeLoose(trimmed);
    const folded = searchKey(trimmed);
    const asPinyin = pinyinSearchKey(trimmed);
    const asPinyinSpaced = toAsciiPinyin(trimmed).replace(/\s+/g, ' ').trim();

    for (const entry of index.entries) {
      let best: { field: SearchField; score: number } | null = null;

      const pinyinScore = Math.max(
        scoreAgainst(entry.pinyinKeys, asPinyin),
        scoreAgainst(entry.pinyinSpaced, asPinyinSpaced),
      );
      if (pinyinScore > 0) best = { field: 'pinyin', score: pinyinScore + 5 };

      const viScore = Math.max(scoreAgainst(entry.viRaw, loose), scoreAgainst(entry.viKeys, folded));
      if (viScore > 0 && (!best || viScore + 6 > best.score)) best = { field: 'vi', score: viScore + 6 };

      const enScore = scoreAgainst(entry.enKeys, folded);
      if (enScore > 0 && (!best || enScore > best.score)) best = { field: 'en', score: enScore };

      if (best) hits.push({ word: entry.word, field: best.field, score: best.score });
    }
  }

  hits.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.word.hskLevel !== b.word.hskLevel) return a.word.hskLevel - b.word.hskLevel;
    return a.word.id.localeCompare(b.word.id);
  });
  return hits.slice(0, limit);
}
