/**
 * Chuyển một trang HTML bài nghe (kiểu `HSK_20_tu_moi_50_cau_ghep_audio_bai_moi.html`)
 * thành dữ liệu bài cho phần "Nghe cố định".
 *
 * Trang gốc có dạng: một `<h1>` tên bài, một khối `.note` giới thiệu, rồi các
 * `<h2>` mở từng mục, mỗi mục là chuỗi `.card` gồm `.num`, `.zh`, `.py`, `.vi`
 * và thuộc tính `data-text` là chuỗi đem đi đọc. Hàm ở đây chỉ nhận một
 * `Document` đã dựng sẵn, nên chạy được cả trong kiểm thử (jsdom của Vitest)
 * lẫn trong lệnh nhập (jsdom gọi trực tiếp).
 */
import type {
  FixedListeningItem,
  FixedListeningLesson,
} from '../../src/features/fixed-listening/types.ts';

/** Mục đang dựng dở: nhãn chỉ biết được khi gặp thẻ đầu tiên. */
interface DraftSection {
  title: string;
  itemLabel: string;
  items: FixedListeningItem[];
}

/** Tốc độ của trang gốc khi không tìm thấy dòng `rate=` trong script. */
export const DEFAULT_RATE = 0.75;

/** Gộp khoảng trắng và xuống dòng của HTML thành một dấu cách. */
function clean(text: string | null | undefined): string {
  return (text ?? '').replace(/\s+/g, ' ').trim();
}

/** Bỏ biểu tượng cảm xúc đứng đầu tiêu đề ("🎧 50 câu ghép" thành "50 câu ghép"). */
function stripLeadingSymbols(text: string): string {
  return text.replace(/^[^\p{L}\p{N}]+/u, '').trim();
}

/**
 * Tách khối giới thiệu theo `<br>` thành từng dòng chữ thường.
 *
 * Dòng mở bằng 🔊 là hướng dẫn dùng trình phát của trang gốc (phím tắt, tốc
 * độ); trang trong ứng dụng có hướng dẫn riêng nên bỏ đi.
 */
function noteLines(note: Element | null): string[] {
  if (note === null) return [];
  const lines: string[] = [];
  let buffer = '';
  for (const node of Array.from(note.childNodes)) {
    if (node.nodeName === 'BR') {
      lines.push(buffer);
      buffer = '';
    } else {
      buffer += node.textContent ?? '';
    }
  }
  lines.push(buffer);
  return lines.map(clean).filter((line) => line !== '' && !line.startsWith('🔊'));
}

/** Đọc tốc độ `u.rate=.75` trong script của trang gốc. */
function readRate(document: Document): number {
  for (const script of Array.from(document.querySelectorAll('script'))) {
    const match = /\.rate\s*=\s*(\d*\.?\d+)/.exec(script.textContent ?? '');
    if (match) {
      const rate = Number(match[1]);
      if (Number.isFinite(rate) && rate > 0) return rate;
    }
  }
  return DEFAULT_RATE;
}

/** "Từ mới 01" thành "Từ mới": bỏ số thứ tự, vì trang tự đánh số lại. */
function labelOf(card: Element): string {
  return clean(card.querySelector('.num')?.textContent).replace(/\s*\d+\s*$/, '');
}

export function parseLessonDocument(document: Document): FixedListeningLesson {
  const sections: DraftSection[] = [];

  for (const node of Array.from(document.querySelectorAll('h2, .card'))) {
    if (node.tagName === 'H2') {
      sections.push({ title: stripLeadingSymbols(clean(node.textContent)), itemLabel: '', items: [] });
      continue;
    }
    // Thẻ đứng trước mọi `<h2>` vẫn phải có chỗ, nếu không sẽ mất lặng lẽ.
    if (sections.length === 0) sections.push({ title: 'Bài nghe', itemLabel: '', items: [] });
    const section = sections[sections.length - 1];

    const hanzi = clean(node.querySelector('.zh')?.textContent);
    const speak = clean(node.getAttribute('data-text'));
    if (hanzi === '' && speak === '') {
      throw new Error(`Thẻ thứ ${section.items.length + 1} của mục "${section.title}" không có chữ Hán.`);
    }

    if (section.itemLabel === '') section.itemLabel = labelOf(node);
    section.items.push({
      hanzi: hanzi === '' ? speak : hanzi,
      pinyin: clean(node.querySelector('.py')?.textContent),
      vi: clean(node.querySelector('.vi')?.textContent),
      ...(speak !== '' && speak !== hanzi && hanzi !== '' ? { speak } : {}),
    });
  }

  const filled = sections
    .filter((section) => section.items.length > 0)
    .map((section) => ({ ...section, itemLabel: section.itemLabel === '' ? 'Mục' : section.itemLabel }));
  if (filled.length === 0) throw new Error('Không tìm thấy thẻ `.card` nào trong tệp.');

  return {
    title: stripLeadingSymbols(clean(document.querySelector('h1')?.textContent)) || 'Bài nghe',
    notes: noteLines(document.querySelector('.note')),
    rate: readRate(document),
    sections: filled,
  };
}

/** Chuỗi TypeScript nháy đơn, đúng kiểu viết của cả dự án. */
function quote(text: string): string {
  return `'${text.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

/** Viết dữ liệu bài thành một tệp `.ts` đọc được và sửa tay được. */
export function renderLessonModule(lesson: FixedListeningLesson, sourceName: string): string {
  const lines: string[] = [
    '/**',
    ` * Bài nghe cố định, sinh từ \`${sourceName}\` bằng \`npm run data:nghe\`.`,
    ' * Sửa tay được; chạy lại lệnh với cùng `--id` sẽ ghi đè tệp này.',
    ' */',
    "import type { FixedListeningLesson } from '../types.ts';",
    '',
    'const lesson: FixedListeningLesson = {',
    `  title: ${quote(lesson.title)},`,
    '  notes: [',
    ...lesson.notes.map((note) => `    ${quote(note)},`),
    '  ],',
    `  rate: ${lesson.rate},`,
    '  sections: [',
  ];

  for (const section of lesson.sections) {
    lines.push(
      '    {',
      `      title: ${quote(section.title)},`,
      `      itemLabel: ${quote(section.itemLabel)},`,
      '      items: [',
    );
    for (const item of section.items) {
      const speak = item.speak !== undefined ? `, speak: ${quote(item.speak)}` : '';
      lines.push(
        `        { hanzi: ${quote(item.hanzi)}, pinyin: ${quote(item.pinyin)}, vi: ${quote(item.vi)}${speak} },`,
      );
    }
    lines.push('      ],', '    },');
  }

  lines.push('  ],', '};', '', 'export default lesson;', '');
  return lines.join('\n');
}

/** Mã bài kế tiếp theo những tệp `bai-NN.ts` đã có: `bai-01`, `bai-02`, … */
export function nextLessonId(existing: readonly string[]): string {
  const numbers = existing
    .map((name) => /^bai-(\d+)\.ts$/.exec(name))
    .filter((match): match is RegExpExecArray => match !== null)
    .map((match) => Number(match[1]));
  const next = numbers.length === 0 ? 1 : Math.max(...numbers) + 1;
  return `bai-${String(next).padStart(2, '0')}`;
}
