/**
 * Danh sách bài nghe đoạn văn.
 *
 * Giống "Nghe cố định": mọi tệp `passages/bai-NN.ts` tự vào danh sách, xếp theo
 * số bài, nên thêm bài mới chỉ cần thả thêm một tệp. Mỗi bài chỉ vài kB nên nạp
 * thẳng cùng gói của trang.
 */
import { LEARNED_WORDS } from './learned-words.ts';
import type { Passage, PassageEntry, PassageParagraph, PassageWord } from './types.ts';

const modules = import.meta.glob<Passage>('./passages/bai-*.ts', {
  eager: true,
  import: 'default',
});

/** Dựng danh sách từ một bảng "đường dẫn tệp → dữ liệu bài"; tách riêng để kiểm thử. */
export function buildPassageRegistry(files: Readonly<Record<string, Passage>>): PassageEntry[] {
  return Object.entries(files)
    .map(([file, passage]) => {
      const id = file.slice(file.lastIndexOf('/') + 1).replace(/\.ts$/, '');
      const number = Number(/^bai-(\d+)$/.exec(id)?.[1] ?? Number.NaN);
      return { ...passage, id, number };
    })
    .filter((entry) => Number.isInteger(entry.number))
    .sort((a, b) => a.number - b.number);
}

export const PASSAGES: readonly PassageEntry[] = buildPassageRegistry(modules);

/** Tìm bài theo mã; không có mã thì lấy bài mới nhất, vì đó thường là bài người học đang nghe. */
export function findPassage(id: string | undefined): PassageEntry | null {
  if (id === undefined) return PASSAGES.at(-1) ?? null;
  return PASSAGES.find((passage) => passage.id === id) ?? null;
}

/** Cả đoạn ghép lại thành một dòng chữ Hán. */
export function paragraphText(paragraph: PassageParagraph): string {
  return paragraph.sentences.map((sentence) => sentence.hanzi).join('');
}

/**
 * Từ `word` có đứng riêng ở đâu đó trong `text` không.
 *
 * Chỗ nó chỉ nằm lọt trong một từ dài hơn của cùng danh sách thì không tính: 好 trong
 * 好吃, 回 trong 回来, 什么 trong 为什么 — ở đó người học nghe thấy từ dài kia, chưa
 * hẳn đã nghe từ ngắn được dùng theo nghĩa của nó.
 */
function standsAlone(text: string, word: string, vocabulary: readonly string[]): boolean {
  const longer = vocabulary
    .filter((other) => other.length > word.length && other.includes(word))
    .sort((a, b) => b.length - a.length);
  let rest = text;
  for (const other of longer) rest = rest.split(other).join('|');
  return rest.includes(word);
}

export interface Coverage {
  /** Số từ trong danh sách mà bài có dùng. */
  used: number;
  total: number;
  missing: readonly PassageWord[];
}

/** Bài dùng bao nhiêu từ trong `words` (mặc định là toàn bộ từ đã học), sót những từ nào. */
export function coverageOf(passage: Passage, words: readonly PassageWord[] = LEARNED_WORDS): Coverage {
  const text = passage.paragraphs.map(paragraphText).join('|');
  const vocabulary = [...new Set(words.map((word) => word.hanzi))];
  const missing = words.filter((word) => !standsAlone(text, word.hanzi, vocabulary));
  return { used: words.length - missing.length, total: words.length, missing };
}
