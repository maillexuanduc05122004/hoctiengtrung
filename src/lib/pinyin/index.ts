import { MAX_SYLLABLE_LENGTH, PINYIN_SYLLABLE_SET } from './syllables.ts';

export { PINYIN_SYLLABLES, PINYIN_SYLLABLE_SET } from './syllables.ts';

/** Thanh điệu: 1-4 là bốn thanh, 5 là thanh nhẹ, `null` là không xác định. */
export type Tone = 1 | 2 | 3 | 4 | 5 | null;

export interface PinyinSyllable {
  /** Âm tiết đã bỏ dấu thanh, luôn dùng ký tự "ü" (không dùng "v" hay "u:"). */
  base: string;
  /** Thanh điệu đọc được từ dữ liệu đầu vào. */
  tone: Tone;
  /** Âm tiết có đuôi nhi hoá dính liền hay không, ví dụ "diǎnr". */
  erhua: boolean;
}

const TONE_ROWS: Record<string, string> = {
  a: '\u0101\u00e1\u01ce\u00e0',
  e: '\u0113\u00e9\u011b\u00e8',
  i: '\u012b\u00ed\u01d0\u00ec',
  o: '\u014d\u00f3\u01d2\u00f2',
  u: '\u016b\u00fa\u01d4\u00f9',
  '\u00fc': '\u01d6\u01d8\u01da\u01dc',
  n: '\u0144\u0144\u0148\u01f9',
  m: '\u1e3f\u1e3f\u1e3f\u1e3f',
};

const MARK_TO_PLAIN = new Map<string, { plain: string; tone: 1 | 2 | 3 | 4 }>();
for (const [plain, marks] of Object.entries(TONE_ROWS)) {
  [...marks].forEach((mark, i) => {
    if (!MARK_TO_PLAIN.has(mark)) {
      MARK_TO_PLAIN.set(mark, { plain, tone: (i + 1) as 1 | 2 | 3 | 4 });
    }
  });
}

/** Thứ tự ưu tiên đặt dấu thanh theo quy tắc chính tả pinyin. */
function toneMarkIndex(base: string): number {
  const a = base.indexOf('a');
  if (a >= 0) return a;
  const o = base.indexOf('o');
  if (o >= 0) return o;
  const e = base.indexOf('e');
  if (e >= 0) return e;
  for (let i = base.length - 1; i >= 0; i--) {
    if ('iu\u00fc'.includes(base[i])) return i;
  }
  for (let i = base.length - 1; i >= 0; i--) {
    if ('nm'.includes(base[i])) return i;
  }
  return -1;
}

/** Đổi "u:" và "v" thành "ü" để chỉ còn một cách viết duy nhất. */
export function normalizeUmlaut(text: string): string {
  return text.replace(/u:/g, '\u00fc').replace(/v/g, '\u00fc');
}

/** Bỏ mọi dấu thanh khỏi chuỗi pinyin, giữ nguyên "ü". */
export function stripToneMarks(text: string): string {
  let out = '';
  for (const ch of text.normalize('NFC')) {
    const hit = MARK_TO_PLAIN.get(ch);
    out += hit ? hit.plain : ch;
  }
  return out;
}

/** Đưa "ü" về ASCII "u" để làm khoá tìm kiếm không dấu. */
export function toAsciiPinyin(text: string): string {
  return stripToneMarks(normalizeUmlaut(text)).replace(/\u00fc/g, 'u');
}

/** Ghép dấu thanh vào một âm tiết đã bỏ dấu, ví dụ ("hao", 3) thành "hǎo". */
export function applyTone(base: string, tone: Tone): string {
  if (tone === null || tone === 5) return base;
  const idx = toneMarkIndex(base);
  if (idx < 0) return base;
  const row = TONE_ROWS[base[idx]];
  if (!row) return base;
  return base.slice(0, idx) + row[tone - 1] + base.slice(idx + 1);
}

function isSyllable(candidate: string): boolean {
  return PINYIN_SYLLABLE_SET.has(candidate.replace(/\u00fc/g, 'u:'));
}

function canSegment(text: string): boolean {
  if (text === '') return true;
  const max = Math.min(MAX_SYLLABLE_LENGTH, text.length);
  for (let len = max; len > 0; len--) {
    if (isSyllable(text.slice(0, len)) && canSegment(text.slice(len))) return true;
  }
  return false;
}

/**
 * Tách chuỗi pinyin viết liền thành các âm tiết bằng thuật toán khớp dài nhất
 * có kiểm tra phần còn lại, nên "xian" không bị cắt nhầm thành "xi" + "an".
 * Trả về `null` khi không tách được.
 */
export function segmentPinyin(plain: string): string[] | null {
  const text = plain.replace(/[\s'-]+/g, '');
  if (text === '') return [];
  const parts: string[] = [];
  let i = 0;
  while (i < text.length) {
    let matched = '';
    let fallback = '';
    const max = Math.min(MAX_SYLLABLE_LENGTH, text.length - i);
    for (let len = max; len > 0; len--) {
      const candidate = text.slice(i, i + len);
      if (!isSyllable(candidate)) continue;
      if (fallback === '') fallback = candidate;
      if (canSegment(text.slice(i + len))) {
        matched = candidate;
        break;
      }
    }
    const chosen = matched || fallback;
    if (chosen === '') return null;
    parts.push(chosen);
    i += chosen.length;
  }
  return parts;
}

const TRAILING_TONE = /^([a-z\u00fc]+)([1-5])$/;

/** Đọc một cụm rời rạc (đã tách theo khoảng trắng) thành các âm tiết chuẩn hoá. */
function parseToken(token: string): PinyinSyllable[] | null {
  const lowered = normalizeUmlaut(token.toLowerCase());

  const push = (out: PinyinSyllable[], base: string, tone: Tone): boolean => {
    const pieces = segmentPinyin(base);
    if (!pieces || pieces.length === 0) return false;
    pieces.forEach((piece, i) => {
      out.push({ base: piece, tone: i === pieces.length - 1 ? tone : null, erhua: false });
    });
    return true;
  };

  // Dạng có số thanh điệu: "hao3", "ni3hao3", "lv4".
  if (/[1-5]/.test(lowered)) {
    const chunks = lowered.match(/[a-z\u00fc]+[1-5]?/g);
    if (!chunks) return null;
    const out: PinyinSyllable[] = [];
    for (const chunk of chunks) {
      const m = TRAILING_TONE.exec(chunk);
      const base = m ? m[1] : chunk;
      const tone = m ? (Number(m[2]) as 1 | 2 | 3 | 4 | 5) : null;
      if (!push(out, base, tone)) return null;
    }
    return out;
  }

  // Dạng có dấu thanh hoặc hoàn toàn không dấu: "hǎo", "nǐhǎo", "nihao".
  // Dấu thanh nằm giữa âm tiết nên không thể cắt ngay tại chỗ gặp dấu. Cách làm:
  // bỏ dấu để lấy chuỗi thuần, tách âm tiết, rồi gán mỗi dấu thanh về đúng âm
  // tiết chứa vị trí ký tự mang dấu.
  let plain = '';
  const toneAt = new Map<number, 1 | 2 | 3 | 4>();
  for (const ch of lowered.normalize('NFC')) {
    const hit = MARK_TO_PLAIN.get(ch);
    if (hit) {
      toneAt.set(plain.length, hit.tone);
      plain += hit.plain;
    } else if (/[a-zü]/.test(ch)) {
      plain += ch;
    }
  }
  if (plain === '') return [];

  const pieces = segmentPinyin(plain);
  if (!pieces || pieces.length === 0) return null;

  const out: PinyinSyllable[] = [];
  let offset = 0;
  for (const piece of pieces) {
    let tone: Tone = null;
    for (let i = offset; i < offset + piece.length; i++) {
      const found = toneAt.get(i);
      if (found !== undefined) {
        tone = found;
        break;
      }
    }
    out.push({ base: piece, tone, erhua: false });
    offset += piece.length;
  }
  return out;
}

/**
 * Chuẩn hoá mọi cách viết pinyin về cùng một danh sách âm tiết.
 * Chấp nhận "nǐ hǎo", "ni3 hao3", "ni hao", "nihao", "lü" / "lv" / "lu:".
 * Trả về `null` khi chuỗi không tách được thành âm tiết hợp lệ.
 */
export function parsePinyin(raw: string): PinyinSyllable[] | null {
  const cleaned = raw
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^0-9a-z:\u00c0-\u024f\u1e00-\u1eff\s]/g, ' ')
    .trim();
  if (cleaned === '') return [];

  const out: PinyinSyllable[] = [];
  for (const token of cleaned.split(/\s+/)) {
    const parsed = parseToken(token);
    if (!parsed) return null;
    out.push(...parsed);
  }

  // Gộp đuôi nhi hoá vào âm tiết đứng trước.
  const merged: PinyinSyllable[] = [];
  for (const syllable of out) {
    const prev = merged[merged.length - 1];
    if (syllable.base === 'r' && prev && !prev.erhua) {
      prev.erhua = true;
      continue;
    }
    merged.push(syllable);
  }
  return merged;
}

/** Ghi danh sách âm tiết thành pinyin có dấu thanh, ngăn cách bởi khoảng trắng. */
export function formatPinyin(syllables: readonly PinyinSyllable[]): string {
  return syllables.map((s) => applyTone(s.base, s.tone) + (s.erhua ? 'r' : '')).join(' ');
}

/** Ghi danh sách âm tiết thành pinyin ASCII không dấu thanh. */
export function formatPinyinPlain(syllables: readonly PinyinSyllable[]): string {
  return syllables.map((s) => (s.base + (s.erhua ? 'r' : '')).replace(/\u00fc/g, 'u')).join(' ');
}

/** Chuyển pinyin dạng số của CC-CEDICT ("ni3 hao3") sang dạng dấu thanh ("nǐ hǎo"). */
export function numberedToToneMarks(numbered: string): string {
  const parsed = parsePinyin(numbered);
  return parsed ? formatPinyin(parsed) : numbered;
}

/** Chuyển pinyin bất kỳ sang dạng ASCII không dấu, dùng làm khoá tìm kiếm. */
export function pinyinSearchKey(raw: string): string {
  const parsed = parsePinyin(raw);
  return parsed ? formatPinyinPlain(parsed).replace(/\s+/g, '') : toAsciiPinyin(raw).replace(/\s+/g, '');
}
