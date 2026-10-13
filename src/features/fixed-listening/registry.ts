/**
 * Danh sách bài nghe cố định.
 *
 * Mọi tệp `lessons/bai-NN.ts` tự vào danh sách, xếp theo số bài: thêm bài mới
 * chỉ cần thả thêm một tệp (thường là bằng `npm run data:nghe -- tệp.html`),
 * không phải đăng ký tay ở đâu nữa. Dữ liệu nhỏ (vài chục kB một bài) nên nạp
 * thẳng cùng gói của trang thay vì tải riêng từng bài.
 */
import type { FixedListeningEntry, FixedListeningItem, FixedListeningLesson } from './types.ts';

const modules = import.meta.glob<FixedListeningLesson>('./lessons/bai-*.ts', {
  eager: true,
  import: 'default',
});

/** Dựng danh sách từ một bảng "đường dẫn tệp → dữ liệu bài"; tách riêng để kiểm thử. */
export function buildRegistry(
  files: Readonly<Record<string, FixedListeningLesson>>,
): FixedListeningEntry[] {
  return Object.entries(files)
    .map(([file, lesson]) => {
      const id = file.slice(file.lastIndexOf('/') + 1).replace(/\.ts$/, '');
      const number = Number(/^bai-(\d+)$/.exec(id)?.[1] ?? Number.NaN);
      return { ...lesson, id, number };
    })
    .filter((entry) => Number.isInteger(entry.number))
    .sort((a, b) => a.number - b.number);
}

export const FIXED_LISTENING_LESSONS: readonly FixedListeningEntry[] = buildRegistry(modules);

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
