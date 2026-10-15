/**
 * Danh sách bài nghe đoạn văn.
 *
 * Giống "Nghe cố định": mọi tệp `passages/bai-NN.ts` tự vào danh sách, xếp theo
 * số bài, nên thêm bài mới chỉ cần thả thêm một tệp. Mỗi bài chỉ vài kB nên nạp
 * thẳng cùng gói của trang.
 */
import type { Passage, PassageEntry, PassageParagraph } from './types.ts';

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

/** Cả đoạn ghép lại thành một dòng chữ Hán, dùng cho nhãn và bản xem trước. */
export function paragraphText(paragraph: PassageParagraph): string {
  return paragraph.sentences.map((sentence) => sentence.hanzi).join('');
}
