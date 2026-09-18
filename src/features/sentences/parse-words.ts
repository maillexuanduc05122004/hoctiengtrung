/**
 * Đọc danh sách từ người học dán vào ô "Thêm từ mới".
 *
 * Mỗi dòng một từ: chữ Hán, pinyin, nghĩa — cách nhau bằng khoảng trắng, tab
 * hoặc `|`. Không bắt người học tuân định dạng chặt, vì phần lớn bản dán đến từ
 * bảng Excel, ghi chú điện thoại hay tin nhắn: có dòng thiếu chữ Hán (máy chủ
 * sẽ gợi ý từ pinyin), có dòng đánh số đầu, có dòng tiêu đề bảng.
 *
 * Bộ đọc này chỉ xếp cột — không kiểm tra từ điển, không biết từ đã có hay chưa.
 * Việc đó là của máy chủ (`previewImport`), nơi có CC-CEDICT và bảng từ.
 */
import type { ImportRowInput } from '../../lib/api/types.ts';
import { parsePinyin } from '../../lib/pinyin/index.ts';
import { stripVietnameseDiacritics } from '../../lib/text/vietnamese.ts';

/** Chặn trên của máy chủ cho một lần duyệt. */
export const MAX_WORD_ROWS = 500;

const HAN = /[㐀-䶿一-鿿]/;
const ONLY_HAN = /^[㐀-䶿一-鿿]+$/;

/**
 * Ký tự được phép trong một cụm pinyin: chữ latin, nguyên âm mang dấu thanh
 * pinyin, "ü" (hoặc "v", "u:"), số thanh 1–5, dấu nháy tách âm tiết.
 *
 * Dấu huyền và dấu sắc (à á) có ở cả tiếng Việt, nên chỉ kiểm ký tự là chưa đủ;
 * cụm còn phải tách được thành âm tiết pinyin hợp lệ (`parsePinyin`) — "tôi",
 * "học" rớt ngay ở bước ký tự, còn "toi", "hoc" rớt ở bước âm tiết.
 */
const PINYIN_CHARS =
  /^[a-zA-ZüÜāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙǕǗǙǛ1-5':]+$/;

/** Ngoặc và dấu nháy bao quanh một cụm — "(xuéxiào)" vẫn là pinyin. */
const WRAPPING = /^[[("'«“‘]+|[\])"'»”’]+$/g;

/**
 * Những chữ hay gặp trên dòng tiêu đề bảng, đã bỏ dấu và thường hoá. Một dòng
 * mà mọi chữ đều nằm trong danh sách này là tiêu đề, không phải từ — nếu không
 * "Chữ Hán | Pinyin | Nghĩa" sẽ thành một từ có pinyin là "Pinyin".
 */
const HEADER_WORDS = new Set([
  'stt',
  'so',
  'thu',
  'tu',
  'chu',
  'han',
  'hanzi',
  'tieng',
  'trung',
  'viet',
  'anh',
  'pinyin',
  'phien',
  'am',
  'nghia',
  'y',
  'giai',
  'thich',
  'meaning',
  'word',
  'chinese',
  'vietnamese',
  'english',
  'simplified',
  'traditional',
  'gian',
  'phon',
  'the',
  'hsk',
  'cap',
  'level',
  'no',
  'vd',
  'vi',
  'du',
  'example',
  'ghi',
  'note',
]);

/** Một cụm có phải pinyin không: đúng bộ ký tự VÀ tách được thành âm tiết. */
export function looksLikePinyin(token: string): boolean {
  if (token === '' || !PINYIN_CHARS.test(token)) return false;
  // Phải có ít nhất một chữ cái; "3" hay "'" một mình không phải pinyin.
  if (!/[a-zA-ZüÜÀ-ɏ]/.test(token)) return false;
  const parsed = parsePinyin(token);
  return parsed !== null && parsed.length > 0;
}

/** Bỏ số thứ tự, dấu đầu dòng và hai thanh `|` bao ngoài của bảng Markdown. */
function stripDecoration(line: string): string {
  let text = line.trim();
  if (text.startsWith('|')) text = text.slice(1);
  if (text.endsWith('|')) text = text.slice(0, -1);
  text = text.replace(/^\s*(?:\d+\s*[.)、:]|[-*•+])\s+/, '');
  return text.trim();
}

/** Dòng kẻ ngang của bảng Markdown, hoặc dòng chỉ toàn dấu. */
function isRule(line: string): boolean {
  return /^[\s|:\-=_—–]+$/.test(line);
}

/** Dòng tiêu đề: không có chữ Hán và mọi chữ đều là tên cột quen thuộc. */
function isHeader(text: string): boolean {
  if (HAN.test(text)) return false;
  const words = stripVietnameseDiacritics(text)
    .toLowerCase()
    .split(/[\s|\t/,.:;()#-]+/)
    .filter((word) => word !== '');
  if (words.length === 0) return true;
  return words.every((word) => HEADER_WORDS.has(word));
}

/**
 * Xếp một danh sách cụm vào ba cột theo nội dung, không theo vị trí.
 *
 * Cụm chữ Hán ⇒ `simplified` (nhiều cụm Hán liền nhau thì ghép lại). Cụm pinyin
 * đứng trước phần nghĩa ⇒ `pinyin` (nhiều âm tiết cách nhau khoảng trắng đơn).
 * Gặp cụm đầu tiên không phải hai loại trên thì từ đó trở đi là nghĩa — kể cả
 * khi một chữ tiếng Việt không dấu trông giống pinyin.
 */
function classify(tokens: readonly string[]): ImportRowInput {
  let simplified = '';
  const pinyin: string[] = [];
  const meaning: string[] = [];

  for (const token of tokens) {
    const bare = token.replace(WRAPPING, '');
    if (meaning.length === 0 && ONLY_HAN.test(bare)) {
      simplified += bare;
      continue;
    }
    if (meaning.length === 0 && looksLikePinyin(bare)) {
      pinyin.push(bare);
      continue;
    }
    meaning.push(token);
  }

  const row: ImportRowInput = {};
  if (simplified !== '') row.simplified = simplified;
  if (pinyin.length > 0) row.pinyin = pinyin.join(' ');
  if (meaning.length > 0) row.meaningVi = meaning.join(' ');
  return row;
}

/**
 * Dòng có dấu ngăn cột rõ ràng (`|` hoặc tab): mỗi ô xếp theo nội dung như
 * dòng thường; ô thứ hai không phải chữ Hán hay pinyin, đến sau nghĩa Việt, là
 * nghĩa tiếng Anh.
 */
function classifyColumns(columns: readonly string[]): ImportRowInput {
  const row: ImportRowInput = {};
  for (const column of columns) {
    const cell = column.trim().replace(/\s+/g, ' ');
    if (cell === '') continue;
    const bare = cell.replace(WRAPPING, '');
    if (row.simplified === undefined && ONLY_HAN.test(bare.replace(/\s+/g, ''))) {
      row.simplified = bare.replace(/\s+/g, '');
      continue;
    }
    if (row.pinyin === undefined && row.meaningVi === undefined && looksLikePinyin(bare)) {
      row.pinyin = bare;
      continue;
    }
    if (row.meaningVi === undefined) {
      row.meaningVi = cell;
      continue;
    }
    if (row.meaningEn === undefined) row.meaningEn = cell;
  }
  return row;
}

/** Khoá chống trùng ngay trong một lần dán: chữ Hán + pinyin không dấu. */
function rowKey(row: ImportRowInput): string {
  const parsed = parsePinyin(row.pinyin ?? '');
  const plain = parsed ? parsed.map((s) => s.base).join('') : (row.pinyin ?? '').toLowerCase();
  const meaning = row.simplified === undefined ? (row.meaningVi ?? '').toLowerCase() : '';
  return `${row.simplified ?? ''}|${plain}|${meaning}`;
}

/**
 * Đọc cả ô dán thành các dòng nhập. Dòng trống, dòng kẻ và dòng tiêu đề bị bỏ;
 * dòng trùng hệt (cùng chữ Hán và pinyin) chỉ giữ lần đầu. Không quá
 * `MAX_WORD_ROWS` dòng — phần dư bị cắt, nơi gọi báo cho người học.
 */
export function parseWordLines(input: string): ImportRowInput[] {
  const rows: ImportRowInput[] = [];
  const seen = new Set<string>();

  for (const rawLine of input.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === '' || isRule(line)) continue;
    const body = stripDecoration(line);
    if (body === '' || isHeader(body)) continue;

    const row =
      body.includes('|') || body.includes('\t')
        ? classifyColumns(body.split(/[|\t]/))
        : classify(body.split(/\s+/));

    if (row.simplified === undefined && row.pinyin === undefined && row.meaningVi === undefined) {
      continue;
    }

    const key = rowKey(row);
    if (seen.has(key)) continue;
    seen.add(key);

    rows.push(row);
    if (rows.length >= MAX_WORD_ROWS) break;
  }

  return rows;
}
