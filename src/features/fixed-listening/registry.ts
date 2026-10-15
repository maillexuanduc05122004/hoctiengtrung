/**
 * Danh sách bài nghe cố định.
 *
 * Mọi tệp `lessons/bai-NN.ts` tự vào danh sách, xếp theo số bài: thêm bài mới
 * chỉ cần thả thêm một tệp (thường là bằng `npm run data:nghe -- tệp.html`),
 * không phải đăng ký tay ở đâu nữa. Dữ liệu nhỏ (vài chục kB một bài) nên nạp
 * thẳng cùng gói của trang thay vì tải riêng từng bài.
 *
 * Câu dài tập gõ pinyin nằm riêng ở `typing/bai-NN.ts`, cùng tên tệp với bài:
 * tách ra để chạy lại `data:nghe` (ghi đè tệp bài) không xoá mất chúng.
 */
import type {
  FixedListeningEntry,
  FixedListeningItem,
  FixedListeningLesson,
  FixedTypingSentence,
} from './types.ts';

const modules = import.meta.glob<FixedListeningLesson>('./lessons/bai-*.ts', {
  eager: true,
  import: 'default',
});

const typingModules = import.meta.glob<readonly FixedTypingSentence[]>('./typing/bai-*.ts', {
  eager: true,
  import: 'default',
});

/** "./lessons/bai-02.ts" thành "bai-02". */
function idOf(file: string): string {
  return file.slice(file.lastIndexOf('/') + 1).replace(/\.ts$/, '');
}

/**
 * Dựng danh sách từ hai bảng "đường dẫn tệp → dữ liệu": bài nghe và câu gõ
 * pinyin, ghép với nhau theo tên tệp. Tách riêng để kiểm thử.
 */
export function buildRegistry(
  files: Readonly<Record<string, FixedListeningLesson>>,
  typingFiles: Readonly<Record<string, readonly FixedTypingSentence[]>> = {},
): FixedListeningEntry[] {
  const typing = new Map(Object.entries(typingFiles).map(([file, list]) => [idOf(file), list]));
  return Object.entries(files)
    .map(([file, lesson]) => {
      const id = idOf(file);
      const number = Number(/^bai-(\d+)$/.exec(id)?.[1] ?? Number.NaN);
      return { ...lesson, id, number, typing: typing.get(id) ?? [] };
    })
    .filter((entry) => Number.isInteger(entry.number))
    .sort((a, b) => a.number - b.number);
}

export const FIXED_LISTENING_LESSONS: readonly FixedListeningEntry[] = buildRegistry(
  modules,
  typingModules,
);

export function findFixedLesson(id: string | undefined): FixedListeningEntry | null {
  if (id === undefined) return null;
  return FIXED_LISTENING_LESSONS.find((lesson) => lesson.id === id) ?? null;
}

/** Tổng số mục của một bài, cộng mọi phần. */
export function itemCount(lesson: FixedListeningLesson): number {
  return lesson.sections.reduce((sum, section) => sum + section.items.length, 0);
}

/** Chuỗi đem đi đọc của một mục. */
export function speechOf(item: FixedListeningItem): string {
  return item.speak ?? item.hanzi;
}

/** Từ mới của bài: phần đầu tiên, như mọi tệp bài gốc. */
export function newWordsOf(lesson: FixedListeningLesson): string[] {
  return lesson.sections.length > 0 ? lesson.sections[0].items.map((item) => item.hanzi) : [];
}
