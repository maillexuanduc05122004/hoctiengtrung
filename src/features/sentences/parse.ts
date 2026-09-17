/**
 * Đọc danh sách câu người học dán vào từ một trợ lý AI ngoài web.
 *
 * Định dạng đề nghị là mỗi dòng một câu, ba phần ngăn bằng dấu `|`:
 *
 *     现在几点？ | Xiànzài jǐ diǎn? | Bây giờ mấy giờ?
 *
 * Nhưng bản dán thật hiếm khi sạch: mô hình hay đánh số đầu dòng, thay `|` bằng
 * tab hoặc gạch ngang, chèn dòng tiêu đề, bọc bảng Markdown. Bộ đọc này nhận hết
 * những biến thể đó, vì bắt người học sửa tay từng dòng thì thà không có tính
 * năng. Chỉ hai điều là bắt buộc: dòng phải có chữ Hán, và phải tách được ít
 * nhất hai phần.
 */

/** Một dòng đọc được. `pinyin` rỗng khi bản dán chỉ có chữ Hán và nghĩa. */
export interface ParsedSentence {
  hanzi: string;
  pinyin: string;
  vi: string;
}

export interface ParseResult {
  sentences: ParsedSentence[];
  /** Những dòng có chữ Hán nhưng không tách nổi thành các phần. */
  skipped: string[];
}

const HAN = /[一-鿿]/;

/** Dấu ngăn cột, xếp theo thứ tự ưu tiên: rõ ràng nhất trước. */
const SEPARATORS = ['|', '\t', ' — ', ' – ', ' -- ', ' - '];

/**
 * Dòng tiêu đề bảng và dòng kẻ ngang của Markdown. Không loại thì bảng ba cột
 * dán vào sẽ thành một "câu" tên là "Tiếng Trung".
 */
function isTableChrome(line: string): boolean {
  if (/^[\s|:-]+$/.test(line)) return true;
  return !HAN.test(line);
}

/** Bỏ số thứ tự, dấu đầu dòng và hai thanh `|` bao ngoài của bảng Markdown. */
function stripDecoration(line: string): string {
  let text = line.trim();
  if (text.startsWith('|')) text = text.slice(1);
  if (text.endsWith('|')) text = text.slice(0, -1);
  text = text.replace(/^\s*(?:\d+\s*[.)、]|[-*•])\s*/, '');
  return text.trim();
}

/** Tách một dòng theo dấu ngăn đầu tiên thật sự có mặt. */
function splitFields(text: string): string[] {
  for (const separator of SEPARATORS) {
    if (text.includes(separator)) {
      return text
        .split(separator)
        .map((part) => part.trim())
        .filter((part) => part !== '');
    }
  }
  return [text];
}

/**
 * Đoán xem một phần có phải pinyin không, để xếp đúng cột khi dòng chỉ có hai
 * phần.
 *
 * Không so dấu thanh chung chung được: dấu huyền và dấu sắc có ở CẢ HAI thứ
 * tiếng — `zì` và `chì` mang y hệt một dấu. Chỉ ba nhóm sau mới phân biệt được:
 *
 * - Dấu ngang (ā) và dấu ô (ǎ) thì chỉ pinyin mới có.
 * - Dấu nặng, dấu hỏi, dấu ngã thì chỉ tiếng Việt mới có.
 * - Các chữ cái ă â đ ê ô ơ ư cũng chỉ tiếng Việt mới có.
 */
function looksLikePinyin(text: string): boolean {
  if (text === '' || HAN.test(text)) return false;
  const marks = text.normalize('NFD');
  if (/[̄̌]/.test(marks)) return true;
  if (/[̣̉̃]/.test(marks)) return false;
  return !/[ăâđêôơưĂÂĐÊÔƠƯ]/.test(text.normalize('NFC'));
}

/** Chuẩn hoá để so trùng: bỏ khoảng trắng và dấu câu, giữ nguyên chữ Hán. */
export function sentenceKey(hanzi: string): string {
  return hanzi.replace(/[\s，。？！、,.?!]/g, '');
}

export function parseSentences(input: string): ParseResult {
  const sentences: ParsedSentence[] = [];
  const skipped: string[] = [];
  const seen = new Set<string>();

  for (const rawLine of input.split('\n')) {
    const line = rawLine.trim();
    if (line === '' || isTableChrome(line)) continue;

    const fields = splitFields(stripDecoration(line));
    const hanzi = fields[0] ?? '';
    if (!HAN.test(hanzi)) continue;

    if (fields.length < 2) {
      skipped.push(line);
      continue;
    }

    const [pinyin, vi] =
      fields.length >= 3
        ? [fields[1], fields.slice(2).join(' ')]
        : looksLikePinyin(fields[1])
          ? [fields[1], '']
          : ['', fields[1]];

    // Bản dán của chính người học cũng có thể tự lặp; trùng trong một lần dán
    // thì bỏ luôn ở đây, khỏi đẩy việc đó xuống kho.
    const key = sentenceKey(hanzi);
    if (seen.has(key)) continue;
    seen.add(key);

    sentences.push({ hanzi, pinyin, vi });
  }

  return { sentences, skipped };
}
