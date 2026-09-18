/**
 * Đổi câu dán tay thành dữ liệu gửi máy chủ.
 *
 * Máy chủ bắt buộc mỗi câu đủ cả ba phần (chữ Hán, pinyin, nghĩa) — một câu
 * thiếu pinyin thì sau này mở ra không có gì để đối chiếu cách đọc. Bộ đọc
 * `parseSentences` dễ dãi hơn thế, nên ở đây tách riêng phần đủ và đếm phần
 * thiếu để nói với người học, thay vì gửi lên rồi nhận về lỗi 400 chung chung.
 */
import type { SentenceInput, SentenceLevel } from '../../lib/api/types.ts';
import type { ParsedSentence } from './parse.ts';

const HAN = /[㐀-䶿一-鿿]/u;

/**
 * Suy cấp từ số chữ Hán, theo đúng cách chia ba cấp của bộ câu có sẵn:
 * tới 5 chữ là cấp 1, tới 7 chữ là cấp 2, dài hơn là cấp 3.
 */
export function inferLevel(hanzi: string): SentenceLevel {
  let count = 0;
  for (const char of hanzi) if (HAN.test(char)) count += 1;
  if (count <= 5) return 1;
  if (count <= 7) return 2;
  return 3;
}

export interface ManualBatch {
  inputs: SentenceInput[];
  /** Số câu bị bỏ vì thiếu pinyin hoặc nghĩa. */
  incomplete: number;
}

export function toSentenceInputs(parsed: readonly ParsedSentence[]): ManualBatch {
  const inputs: SentenceInput[] = [];
  let incomplete = 0;
  for (const item of parsed) {
    if (item.pinyin.trim() === '' || item.vi.trim() === '') {
      incomplete += 1;
      continue;
    }
    inputs.push({
      hanzi: item.hanzi,
      pinyin: item.pinyin,
      meaningVi: item.vi,
      level: inferLevel(item.hanzi),
    });
  }
  return { inputs, incomplete };
}
