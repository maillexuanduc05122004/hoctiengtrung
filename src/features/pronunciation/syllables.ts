/**
 * Ghép từng chữ Hán của câu với âm tiết pinyin của nó.
 *
 * AI chấm phát âm theo từng âm tiết, nên phải gửi đi danh sách "chữ — cách đọc"
 * đã thẳng hàng; giao diện cũng tô màu đúng từng chữ theo danh sách này. Câu
 * nào pinyin không thẳng hàng với chữ (nhi hoá "zhèr" cho 这儿…) thì bỏ khỏi
 * phần luyện phát âm, thay vì đoán bừa chữ nào đọc âm nào.
 */
import { applyTone, parsePinyin } from '../../lib/pinyin/index.ts';
import type { ExpectedSyllable } from '../../lib/api/types.ts';
import { alignSequences } from '../../lib/answer-matcher/index.ts';

const HAN = /\p{Script=Han}/u;

export function expectedSyllables(hanzi: string, pinyin: string): ExpectedSyllable[] | null {
  const chars = [...hanzi].filter((char) => HAN.test(char));
  const syllables = parsePinyin(pinyin);
  if (syllables === null || chars.length === 0 || syllables.length !== chars.length) return null;
  if (syllables.some((syllable) => syllable.erhua)) return null;
  return chars.map((char, i) => {
    const { base, tone } = syllables[i];
    return {
      hanzi: char,
      pinyin: tone === null || tone === 5 ? base : applyTone(base, tone),
    };
  });
}

export type BrowserMark = 'ok' | 'wrong' | 'missing';

export interface BrowserComparison {
  /** Cùng độ dài với danh sách âm tiết: chữ đó máy có nghe ra đúng không. */
  marks: BrowserMark[];
  /** Phần trăm chữ máy nghe ra đúng. */
  percent: number;
}

/**
 * So chữ máy nhận dạng giọng nói của trình duyệt nghe được với câu mẫu.
 *
 * Chỉ nói được "máy nghe ra chữ này hay không": đọc sai thanh mà máy vẫn đoán
 * đúng chữ nhờ ngữ cảnh thì ở đây vẫn tính là đúng. Chấm thanh điệu kỹ là việc
 * của AI.
 */
export function compareTranscript(
  expected: readonly ExpectedSyllable[],
  transcript: string,
): BrowserComparison {
  const heard = [...transcript].filter((char) => HAN.test(char));
  const marks: BrowserMark[] = expected.map(() => 'missing');
  for (const op of alignSequences(
    expected.map((syllable) => syllable.hanzi),
    heard,
  )) {
    if (op.expectedIndex < 0) continue;
    if (op.kind === 'equal') marks[op.expectedIndex] = 'ok';
    else if (op.kind === 'substitute') marks[op.expectedIndex] = 'wrong';
  }
  const ok = marks.filter((mark) => mark === 'ok').length;
  return { marks, percent: expected.length === 0 ? 0 : Math.round((ok / expected.length) * 100) };
}
