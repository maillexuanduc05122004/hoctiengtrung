/** Đọc và tra cứu CC-CEDICT (giấy phép CC BY-SA 4.0). */

export interface CedictEntry {
  readonly traditional: string;
  readonly simplified: string;
  /** Pinyin dạng số như trong tệp gốc, ví dụ "ni3 hao3". */
  readonly pinyinNumbered: string;
  /** Khoá tra cứu chuẩn của CC-CEDICT: "傳統|简体[pin1 yin1]". */
  readonly key: string;
  readonly definitions: readonly string[];
}

const LINE = /^(\S+)\s+(\S+)\s+\[([^\]]*)\]\s+\/(.*)\/\s*$/;

/** Phân tích toàn bộ tệp CC-CEDICT thành danh sách mục từ. */
export function parseCedict(text: string): CedictEntry[] {
  const entries: CedictEntry[] = [];
  for (const line of text.split('\n')) {
    if (line === '' || line.startsWith('#')) continue;
    const match = LINE.exec(line);
    if (!match) continue;
    const [, traditional, simplified, pinyinNumbered, body] = match;
    entries.push({
      traditional,
      simplified,
      pinyinNumbered,
      key: `${traditional}|${simplified}[${pinyinNumbered}]`,
      definitions: body.split('/').filter((d) => d.trim() !== ''),
    });
  }
  return entries;
}

export interface CedictIndex {
  /** Tra theo khoá đầy đủ "傳統|简体[pin1 yin1]" như cột CEDICT của hsk30. */
  readonly byKey: ReadonlyMap<string, CedictEntry>;
  /** Tra theo chữ giản thể, có thể có nhiều mục từ (đa âm, đa nghĩa). */
  readonly bySimplified: ReadonlyMap<string, CedictEntry[]>;
}

export function indexCedict(entries: readonly CedictEntry[]): CedictIndex {
  const byKey = new Map<string, CedictEntry>();
  const bySimplified = new Map<string, CedictEntry[]>();
  for (const entry of entries) {
    if (!byKey.has(entry.key)) byKey.set(entry.key, entry);
    const bucket = bySimplified.get(entry.simplified);
    if (bucket) bucket.push(entry);
    else bySimplified.set(entry.simplified, [entry]);
  }
  return { byKey, bySimplified };
}

/**
 * Dọn một định nghĩa CC-CEDICT cho phù hợp với người học:
 * bỏ chú thích chữ Hán trong ngoặc, bỏ tham chiếu chéo, cắt khoảng trắng thừa.
 */
export function cleanDefinition(definition: string): string {
  return definition
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\|/g, '/')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Định nghĩa chỉ trỏ sang mục từ khác thì không dùng làm nghĩa hiển thị. */
export function isCrossReference(definition: string): boolean {
  return /^(see|see also|variant of|old variant of|abbr\. for|used in|erhua variant of)\b/i.test(
    definition.trim(),
  );
}

/** Chọn các nghĩa tiếng Anh đáng hiển thị nhất từ một mục CC-CEDICT. */
export function pickEnglishMeanings(
  entries: readonly CedictEntry[],
  limit = 4,
): { meanings: string[]; aliases: string[] } {
  const all: string[] = [];
  for (const entry of entries) {
    for (const raw of entry.definitions) {
      const cleaned = cleanDefinition(raw);
      if (cleaned === '') continue;
      all.push(cleaned);
    }
  }
  const primary = all.filter((d) => !isCrossReference(d));
  const pool = primary.length > 0 ? primary : all;
  const unique: string[] = [];
  for (const definition of pool) {
    if (!unique.some((u) => u.toLowerCase() === definition.toLowerCase())) unique.push(definition);
  }
  return { meanings: unique.slice(0, limit), aliases: unique.slice(limit) };
}
