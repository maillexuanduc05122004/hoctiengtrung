/**
 * Chuẩn hoá danh sách HSK 3.0 (cấp 1-3) từ kho ivankra/hsk30 và ghép nghĩa
 * tiếng Anh từ CC-CEDICT.
 *
 * Vài chỗ trong danh sách gốc không phải chữ Hán thuần, ví dụ "爸爸|爸" (hai
 * cách viết), "第（第二）" (tiền tố kèm ví dụ), "面1"/"面2" (đồng tự khác
 * nghĩa), "…极了" (khuôn mẫu). Cột `Variants` của nguồn đã tách sẵn các trường
 * hợp này nên ta dựa vào đó thay vì tự đoán bằng biểu thức chính quy.
 */
import { formatPinyin, formatPinyinPlain, parsePinyin } from '../../src/lib/pinyin/index.ts';
import { parseCsvRecords } from './csv.ts';
import { indexCedict, pickEnglishMeanings, type CedictEntry, type CedictIndex } from './cedict.ts';

export type HskLevel = 1 | 2 | 3;

interface RawVariant {
  Simplified: string;
  Traditional?: string;
  Pinyin?: string;
  POS?: string;
  CEDICT?: string;
  /** Bằng "1" khi mục chỉ là ví dụ minh hoạ cho tiền tố/hậu tố. */
  Example?: string;
}

export interface BaseWord {
  id: string;
  simplified: string;
  traditional?: string;
  /** Cách viết thay thế được chấp nhận, ví dụ "爸" cho "爸爸". */
  writtenVariants: string[];
  pinyin: string;
  pinyinPlain: string;
  /** Các cách đọc khác được nguồn ghi nhận, ví dụ "shuí" của 谁. */
  pinyinAliases: string[];
  hskLevel: HskLevel;
  partOfSpeech: string[];
  meaningsEn: string[];
  aliasesEn: string[];
  /** Từ minh hoạ mà nguồn gợi ý cho tiền tố/hậu tố, ví dụ "桌子" cho "子". */
  affixExample?: string;
  /** Khoá CC-CEDICT đã dùng, để trang nguồn dữ liệu kiểm chứng được. */
  cedictKeys: string[];
  /** `true` khi nghĩa tiếng Anh không lấy được từ CC-CEDICT. */
  englishFromCedict: boolean;
}

function splitList(value: string, separator = '|'): string[] {
  return value
    .split(separator)
    .map((s) => s.trim())
    .filter((s) => s !== '');
}

function readVariants(record: Record<string, string>): RawVariant[] {
  const raw = record.Variants?.trim();
  if (raw) {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as RawVariant[];
  }
  return [
    {
      Simplified: record.Simplified,
      Traditional: record.Traditional,
      Pinyin: record.Pinyin,
      POS: record.POS,
      CEDICT: record.CEDICT,
    },
  ];
}

/** Đưa pinyin bất kỳ về dạng "có dấu thanh, cách nhau bởi khoảng trắng". */
function toDisplayPinyin(raw: string): { pinyin: string; plain: string } | null {
  const parsed = parsePinyin(raw);
  if (!parsed || parsed.length === 0) return null;
  return { pinyin: formatPinyin(parsed), plain: formatPinyinPlain(parsed) };
}

function collectCedictEntries(
  keys: readonly string[],
  simplified: string,
  index: CedictIndex,
): CedictEntry[] {
  const found: CedictEntry[] = [];
  for (const key of keys) {
    const entry = index.byKey.get(key);
    if (entry) found.push(entry);
  }
  if (found.length > 0) return found;
  return index.bySimplified.get(simplified) ?? [];
}

export interface NormalizeResult {
  words: BaseWord[];
  warnings: string[];
}

/** Đọc hsk30.csv và trả về danh sách từ cấp 1-3 đã chuẩn hoá. */
export function normalizeHsk(
  hskCsv: string,
  cedictEntries: readonly CedictEntry[],
): NormalizeResult {
  const index = indexCedict(cedictEntries);
  const records = parseCsvRecords(hskCsv);
  const warnings: string[] = [];
  const words: BaseWord[] = [];

  for (const record of records) {
    const level = Number(record.Level);
    if (level !== 1 && level !== 2 && level !== 3) continue;

    const variants = readVariants(record);
    const real = variants.filter((v) => v.Example !== '1');
    const examples = variants.filter((v) => v.Example === '1');
    const primary = real[0];
    if (!primary?.Simplified) {
      warnings.push(`${record.ID}: không xác định được chữ giản thể`);
      continue;
    }

    const simplified = primary.Simplified.trim();
    const traditional = splitList(primary.Traditional ?? '')[0];

    // Cách viết thay thế: các biến thể còn lại có chữ giản thể khác từ chính.
    const writtenVariants = [
      ...new Set(
        real
          .slice(1)
          .map((v) => v.Simplified?.trim())
          .filter((s): s is string => !!s && s !== simplified),
      ),
    ];

    const cedictKeys = [
      ...new Set(real.flatMap((v) => splitList(v.CEDICT ?? '', '/').length > 0 ? (v.CEDICT ?? '').split('/').map((s) => s.trim()).filter(Boolean) : [])),
    ];
    const primaryKeys = (primary.CEDICT ?? '')
      .split('/')
      .map((s) => s.trim())
      .filter(Boolean);

    const entries = collectCedictEntries(primaryKeys, simplified, index);

    // Pinyin: ưu tiên dạng số của CC-CEDICT vì đã tách sẵn âm tiết.
    let display = entries[0] ? toDisplayPinyin(entries[0].pinyinNumbered) : null;
    const officialRaw = splitList(primary.Pinyin ?? '', '/')[0] ?? '';
    const official = toDisplayPinyin(officialRaw);
    if (!display) display = official;
    if (!display) {
      warnings.push(`${record.ID} (${simplified}): không đọc được pinyin "${officialRaw}"`);
      continue;
    }

    const pinyinAliases = new Set<string>();
    if (official && official.pinyin !== display.pinyin) pinyinAliases.add(official.pinyin);
    for (const variant of real.slice(1)) {
      const alt = toDisplayPinyin(splitList(variant.Pinyin ?? '', '/')[0] ?? '');
      if (alt && alt.pinyin !== display.pinyin) pinyinAliases.add(alt.pinyin);
    }
    for (const extra of splitList(primary.Pinyin ?? '', '/').slice(1)) {
      const alt = toDisplayPinyin(extra);
      if (alt && alt.pinyin !== display.pinyin) pinyinAliases.add(alt.pinyin);
    }

    const english = pickEnglishMeanings(entries);
    if (english.meanings.length === 0) {
      warnings.push(`${record.ID} (${simplified}): CC-CEDICT không có nghĩa tiếng Anh`);
    }

    const partOfSpeech = splitList(primary.POS ?? record.POS ?? '', '/');

    words.push({
      id: record.ID,
      simplified,
      traditional: traditional && traditional !== simplified ? traditional : undefined,
      writtenVariants,
      pinyin: display.pinyin,
      pinyinPlain: display.plain,
      pinyinAliases: [...pinyinAliases],
      hskLevel: level as HskLevel,
      partOfSpeech,
      meaningsEn: english.meanings,
      aliasesEn: english.aliases,
      affixExample: examples[0]?.Simplified?.trim(),
      cedictKeys: cedictKeys.length > 0 ? cedictKeys : primaryKeys,
      englishFromCedict: english.meanings.length > 0,
    });
  }

  return { words, warnings };
}

/**
 * Chia danh sách từ của một cấp thành các buổi học khoảng 10 từ.
 * Số từ được chia đều nhất có thể để không có buổi cuối chỉ còn 1-2 từ.
 */
export function splitIntoLessons<T>(items: readonly T[], targetSize = 10): T[][] {
  if (items.length === 0) return [];
  const count = Math.max(1, Math.round(items.length / targetSize));
  const base = Math.floor(items.length / count);
  const remainder = items.length % count;
  const lessons: T[][] = [];
  let cursor = 0;
  for (let i = 0; i < count; i++) {
    const size = base + (i < remainder ? 1 : 0);
    lessons.push(items.slice(cursor, cursor + size));
    cursor += size;
  }
  return lessons;
}
