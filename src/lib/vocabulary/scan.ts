/**
 * Quét một đoạn văn bản tiếng Trung rồi đối chiếu từng cụm với bộ từ HSK.
 *
 * Dùng phép khớp dài nhất trên chính bộ từ của ứng dụng thay vì một bộ tách từ
 * đa dụng: người học dán đoạn văn vào đây để biết mình đã có sẵn những từ nào,
 * nên ranh giới từ phải trùng với ranh giới của bộ HSK. Tách bằng bộ khác thì
 * "中文" có khi ra hai chữ rời, còn "喜欢" lại dính vào chữ đứng sau.
 *
 * Toàn bộ việc quét chạy trong máy, không gửi văn bản đi đâu.
 */
import type { VocabularyWord } from '../../types/vocabulary.ts';

/** Khoảng mã chữ Hán thông dụng, đủ cho bộ từ HSK 1-3. Đều nằm trong BMP nên cắt chuỗi theo mã đơn vị là an toàn. */
const HANZI = /[一-鿿㐀-䶿]/;

export interface ScanIndex {
  /** Mọi cách viết tra được, kể cả phồn thể và cách viết thay thế. */
  byHanzi: Map<string, VocabularyWord>;
  /** Số chữ của mục dài nhất, để phép khớp dài nhất biết bắt đầu lùi từ đâu. */
  maxLength: number;
}

export interface ScanToken {
  text: string;
  /** Từ HSK khớp với đoạn này, `null` khi không tra được. */
  word: VocabularyWord | null;
  /** Đoạn này gồm chữ Hán; phần dấu câu và chữ Latinh thì không. */
  hanzi: boolean;
}

export interface ScanResult {
  /** Toàn bộ đoạn văn đã cắt thành mảnh, ghép lại đúng bằng văn bản gốc. */
  tokens: ScanToken[];
  /** Các từ tra được, không trùng, theo thứ tự xuất hiện. */
  found: VocabularyWord[];
  /** Số lần xuất hiện của mỗi từ, tra theo mã từ. */
  counts: ReadonlyMap<string, number>;
  /** Các cụm chữ Hán không có trong bộ từ, không trùng, theo thứ tự xuất hiện. */
  unknown: string[];
  /** Tổng số chữ Hán trong đoạn. */
  hanziCount: number;
}

export const EMPTY_SCAN: ScanResult = {
  tokens: [],
  found: [],
  counts: new Map(),
  unknown: [],
  hanziCount: 0,
};

function isHanzi(char: string): boolean {
  return HANZI.test(char);
}

export function buildScanIndex(words: readonly VocabularyWord[]): ScanIndex {
  const byHanzi = new Map<string, VocabularyWord>();
  let maxLength = 1;

  for (const word of words) {
    const forms = [word.simplified, word.traditional, ...(word.writtenVariants ?? [])];
    for (const form of forms) {
      if (typeof form !== 'string' || form === '') continue;
      const current = byHanzi.get(form);
      // Một cách viết có thể thuộc hai mục từ (chữ phồn thể dùng chung, từ đồng
      // âm khác cấp). Giữ mục ở cấp thấp hơn vì người học gặp nó trước.
      if (current === undefined || word.hskLevel < current.hskLevel) byHanzi.set(form, word);
      if (form.length > maxLength) maxLength = form.length;
    }
  }

  return { byHanzi, maxLength };
}

/** Vị trí kết thúc dãy chữ Hán liền nhau bắt đầu từ `start`. */
function runEnd(text: string, start: number): number {
  let end = start;
  while (end < text.length && isHanzi(text[end])) end += 1;
  return end;
}

/** Cụm dài nhất tra được bắt đầu đúng tại `at`, không vượt quá `limit`. */
function matchAt(
  index: ScanIndex,
  text: string,
  at: number,
  limit: number,
): { word: VocabularyWord; length: number } | null {
  const longest = Math.min(index.maxLength, limit - at);
  for (let length = longest; length >= 1; length -= 1) {
    const word = index.byHanzi.get(text.slice(at, at + length));
    if (word !== undefined) return { word, length };
  }
  return null;
}

export function scanText(index: ScanIndex, text: string): ScanResult {
  if (text === '') return EMPTY_SCAN;

  const tokens: ScanToken[] = [];
  const found: VocabularyWord[] = [];
  const counts = new Map<string, number>();
  const unknown: string[] = [];
  const seenUnknown = new Set<string>();
  let hanziCount = 0;

  /** Gom các chữ không tra được thành một cụm: "书法" dễ hiểu hơn hai chữ đứng rời. */
  const flushUnknown = (from: number, to: number): void => {
    if (from < 0 || to <= from) return;
    const chunk = text.slice(from, to);
    tokens.push({ text: chunk, word: null, hanzi: true });
    if (!seenUnknown.has(chunk)) {
      seenUnknown.add(chunk);
      unknown.push(chunk);
    }
  };

  let cursor = 0;
  while (cursor < text.length) {
    if (!isHanzi(text[cursor])) {
      // Dấu câu, chữ Latinh, emoji: giữ nguyên cả mảng để ghép lại không sai một ký tự.
      let end = cursor + 1;
      while (end < text.length && !isHanzi(text[end])) end += 1;
      tokens.push({ text: text.slice(cursor, end), word: null, hanzi: false });
      cursor = end;
      continue;
    }

    const end = runEnd(text, cursor);
    hanziCount += end - cursor;
    let unmatchedFrom = -1;

    while (cursor < end) {
      const hit = matchAt(index, text, cursor, end);
      if (hit === null) {
        if (unmatchedFrom < 0) unmatchedFrom = cursor;
        cursor += 1;
        continue;
      }

      flushUnknown(unmatchedFrom, cursor);
      unmatchedFrom = -1;

      tokens.push({ text: text.slice(cursor, cursor + hit.length), word: hit.word, hanzi: true });
      const seen = counts.get(hit.word.id) ?? 0;
      counts.set(hit.word.id, seen + 1);
      if (seen === 0) found.push(hit.word);
      cursor += hit.length;
    }

    flushUnknown(unmatchedFrom, end);
  }

  return { tokens, found, counts, unknown, hanziCount };
}
