/**
 * Sinh kho âm tiết pinyin dùng cho việc tách chuỗi pinyin viết liền.
 *
 * Cách làm: lấy toàn bộ âm tiết xuất hiện trong CC-CEDICT, lọc lại bằng
 * cấu trúc âm tiết Hán ngữ chuẩn (thanh mẫu + vận mẫu) để loại các chuỗi
 * phiên âm tiếng nước ngoài, rồi giữ những âm tiết đủ phổ biến cộng thêm
 * một danh sách âm tiết hiếm nhưng hợp lệ.
 *
 * Chạy: npm run data:syllables
 */
import { writeFileSync } from 'node:fs';
import { CACHE_DIR, PROJECT_ROOT, readCachedText } from './lib/sources.ts';
import { parseCedict } from './lib/cedict.ts';
import path from 'node:path';

const INITIALS = [
  'zh', 'ch', 'sh', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l',
  'g', 'k', 'h', 'j', 'q', 'x', 'r', 'z', 'c', 's', 'y', 'w', '',
] as const;

const PALATAL = new Set(['j', 'q', 'x', 'y']);

/** Vận mẫu chuẩn; "u:" là cách CC-CEDICT viết "ü". */
const FINALS = [
  'a', 'o', 'e', 'ai', 'ei', 'ao', 'ou', 'an', 'en', 'ang', 'eng', 'ong', 'er',
  'i', 'ia', 'ie', 'iao', 'iu', 'ian', 'in', 'iang', 'ing', 'iong',
  'u', 'ua', 'uo', 'uai', 'ui', 'uan', 'un', 'uang', 'ueng',
  'u:', 'u:e', 'u:an', 'u:n', 'io',
];

/** Sau j/q/x/y thì "u" trong chính tả chính là "ü": xue, yuan, jun... */
const PALATAL_FINALS = ['ue', 'uan', 'un', 'u'];

/** Âm tiết đứng một mình, gồm cả thán từ. */
const STANDALONE = new Set([
  'm', 'n', 'ng', 'hm', 'hng', 'a', 'o', 'e', 'ai', 'ei', 'ao', 'ou',
  'an', 'en', 'ang', 'er', 'r',
]);

/** Âm tiết hợp lệ nhưng tần suất thấp trong từ điển, phải giữ lại bằng tay. */
const RARE_KEEP = new Set([
  'nin', 'den', 'dia', 'lo', 'nou', 'kei', 'sei', 'zhei', 'tei', 'nun',
  'cei', 'me', 'yo', 'n', 'm', 'ng', 'r',
]);

const MIN_FREQUENCY = 5;

function isStructurallyValid(syllable: string): boolean {
  if (STANDALONE.has(syllable)) return true;
  for (const initial of INITIALS) {
    if (initial !== '' && !syllable.startsWith(initial)) continue;
    const final = syllable.slice(initial.length);
    if (FINALS.includes(final)) return true;
    if (PALATAL.has(initial) && PALATAL_FINALS.includes(final)) return true;
  }
  return false;
}

function main(): void {
  const cedictText = readCachedText('cedict.txt');
  const entries = parseCedict(cedictText);

  const frequency = new Map<string, number>();
  for (const entry of entries) {
    for (const raw of entry.pinyinNumbered.split(/\s+/)) {
      const syllable = raw.toLowerCase().replace(/[0-5]$/, '');
      if (!/^[a-z:]+$/.test(syllable)) continue;
      frequency.set(syllable, (frequency.get(syllable) ?? 0) + 1);
    }
  }

  const kept = new Set<string>();
  for (const [syllable, count] of frequency) {
    if (!isStructurallyValid(syllable)) continue;
    if (count >= MIN_FREQUENCY || RARE_KEEP.has(syllable)) kept.add(syllable);
  }
  for (const syllable of RARE_KEEP) {
    if (isStructurallyValid(syllable)) kept.add(syllable);
  }

  const sorted = [...kept].sort();
  const maxLength = Math.max(...sorted.map((s) => s.length));

  const file = `// Sinh tự động bởi scripts/generate-syllables.ts — không sửa tay.
// Nguồn: âm tiết pinyin trong CC-CEDICT, lọc theo cấu trúc âm tiết Hán ngữ chuẩn.

/** ${sorted.length} âm tiết pinyin hợp lệ, viết không dấu thanh, dùng "u:" cho "ü". */
export const PINYIN_SYLLABLES: readonly string[] = [
${sorted.map((s) => `  '${s}',`).join('\n')}
];

/** Tập tra cứu nhanh cho ${sorted.length} âm tiết. */
export const PINYIN_SYLLABLE_SET: ReadonlySet<string> = new Set(PINYIN_SYLLABLES);

/** Độ dài âm tiết dài nhất, dùng cho thuật toán khớp dài nhất. */
export const MAX_SYLLABLE_LENGTH = ${maxLength};
`;

  const target = path.join(PROJECT_ROOT, 'src/lib/pinyin/syllables.ts');
  writeFileSync(target, file, 'utf8');
  console.log(`Đã ghi ${sorted.length} âm tiết vào ${path.relative(PROJECT_ROOT, target)}`);
  console.log(`Thư mục cache: ${CACHE_DIR}`);
}

main();
