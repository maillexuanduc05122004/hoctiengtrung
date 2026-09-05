import type { PinyinSyllable, Tone } from '../pinyin/index.ts';
import { formatPinyin, parsePinyin, toAsciiPinyin } from '../pinyin/index.ts';

// Dấu nháy bị xoá hẳn để "it's" và "its" về cùng một dạng; các dấu câu khác đổi
// thành khoảng trắng để "sao,cũng" không dính thành một từ.
const APOSTROPHES = /['\u2018\u2019\u02bc\u00b4`]/g;
const PUNCTUATION = /[\p{P}\p{S}]/gu;
const COMBINING_MARKS = /[\u0300-\u036f]/g;

/** Chuẩn hoá chung: NFC, thường hoá, bỏ dấu câu, gộp khoảng trắng. */
export function normalizeBasic(text: string): string {
  return text
    .normalize('NFC')
    .toLowerCase()
    .replace(APOSTROPHES, '')
    .replace(PUNCTUATION, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Người học chưa nhập gì đáng kể (rỗng, khoảng trắng, hoặc chỉ toàn dấu câu). */
export function isBlankAnswer(text: string): boolean {
  return normalizeBasic(text) === '';
}

/**
 * Bỏ dấu tiếng Việt: tách tổ hợp NFD rồi xoá mọi dấu thanh, dấu mũ và dấu móc,
 * sau đó xử lý riêng "đ" vì ký tự này không tách được bằng Unicode.
 */
export function stripVietnameseDiacritics(text: string): string {
  return text
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .normalize('NFC');
}

/** Dạng so sánh của tiếng Việt, giữ nguyên dấu. */
export function normalizeVi(text: string): string {
  return normalizeBasic(text);
}

/** Dạng so sánh của tiếng Việt sau khi bỏ dấu. */
export function normalizeViPlain(text: string): string {
  return stripVietnameseDiacritics(normalizeBasic(text));
}

// Mạo từ và "to" của động từ nguyên thể là tuỳ chọn với người học nên bỏ đi
// trước khi so sánh, ví dụ "to love" và "love" phải cho cùng kết quả.
const OPTIONAL_LEAD = /^(?:a|an|the|to)\s+/;

/** Dạng so sánh của tiếng Anh. */
export function normalizeEn(text: string): string {
  const base = normalizeBasic(text);
  let out = base;
  for (;;) {
    const next = out.replace(OPTIONAL_LEAD, '');
    if (next === out || next === '') break;
    out = next;
  }
  // Giữ lại bản gốc khi việc cắt làm mất sạch nội dung, ví dụ đáp án đúng là "the".
  return out === '' ? base : out;
}

/**
 * Các dạng chấp nhận được của một đáp án tiếng Anh. Phần tử đầu luôn là cả chuỗi;
 * các phần tử sau là từng vế của chuỗi nhiều nghĩa ngăn bởi dấu ";".
 */
export function englishForms(text: string): string[] {
  const forms: string[] = [];
  const push = (value: string): void => {
    if (value !== '' && !forms.includes(value)) forms.push(value);
  };
  push(normalizeEn(text));
  if (text.includes(';')) {
    for (const part of text.split(';')) push(normalizeEn(part));
  }
  return forms;
}

/** Dạng so sánh của chữ Hán: bỏ mọi khoảng trắng và dấu câu, không tách từ. */
export function normalizeHanzi(text: string): string {
  return text
    .normalize('NFC')
    .toLowerCase()
    .replace(APOSTROPHES, '')
    .replace(PUNCTUATION, '')
    .replace(/\s+/g, '');
}

/** Tách chữ Hán thành từng chữ, an toàn với ký tự ngoài mặt phẳng cơ bản. */
export function hanziChars(text: string): string[] {
  return [...normalizeHanzi(text)];
}

export interface NormalizedPinyin {
  syllables: PinyinSyllable[];
  /** Từng âm tiết kèm dấu thanh, dùng để dựng diff hiển thị. */
  display: string[];
  /**
   * Từng âm tiết đã bỏ dấu thanh, dùng so sánh dãy âm. Phải giữ nguyên "ü" vì
   * "lü" và "lu" là hai âm tiết khác nhau (绿 lǜ không phải 路 lù); mọi cách gõ
   * "ü", "v", "u:" đều đã được `parsePinyin` đưa về cùng một ký tự "ü".
   */
  bases: string[];
  /** Toàn bộ âm tiết đã bỏ dấu thanh viết liền, dùng cho so khớp mờ. */
  plainKey: string;
  /** Người học có nhập ít nhất một dấu thanh hay không. */
  hasTone: boolean;
}

/** Chuẩn hoá pinyin về danh sách âm tiết; `null` khi không tách được âm tiết hợp lệ. */
export function normalizePinyin(raw: string): NormalizedPinyin | null {
  const syllables = parsePinyin(raw);
  if (!syllables || syllables.length === 0) return null;
  const bases = syllables.map((syllable) => syllable.base + (syllable.erhua ? 'r' : ''));
  return {
    syllables,
    display: syllables.map((syllable) => formatPinyin([syllable])),
    bases,
    plainKey: bases.join(''),
    hasTone: syllables.some((syllable) => syllable.tone !== null),
  };
}

/** Khoá dự phòng khi chuỗi không tách được âm tiết: chỉ giữ chữ cái ASCII. */
export function pinyinFallbackKey(raw: string): string {
  return toAsciiPinyin(raw.normalize('NFC').toLowerCase()).replace(/[^a-z]/g, '');
}

/** Thanh nhẹ có thể ghi là "5" hoặc không ghi gì, nên hai cách đó phải bằng nhau. */
export function tonesEqual(a: Tone, b: Tone): boolean {
  const plain = (tone: Tone): Tone => (tone === 5 ? null : tone);
  return plain(a) === plain(b);
}
