/**
 * Dựng sẵn câu lệnh để người học dán sang một trợ lý AI ngoài web.
 *
 * Ứng dụng không gọi API nào cả — không có backend, và cũng không nên chôn khoá
 * API vào một trang tĩnh. Cách dùng là: chép câu lệnh này, dán sang chỗ có AI,
 * lấy kết quả dán ngược lại vào ô nhập của trang.
 *
 * Câu lệnh phải tự đứng được một mình, nên nó mang theo cả 89 từ. Điều quan
 * trọng nhất là đoạn tả định dạng: `parseSentences` đọc được nhiều biến thể,
 * nhưng chỉ dạng ba cột ngăn bằng `|` mới có đủ pinyin lẫn nghĩa.
 */
import { MY_WORDS } from './corpus.ts';
import type { MySentence } from './corpus.ts';

function wordList(): string {
  return MY_WORDS.map((word) => `${word.hanzi} (${word.pinyin}) ${word.vi}`).join('; ');
}

export interface PromptOptions {
  /** Số câu muốn xin. */
  count: number;
}

export function buildPrompt({ count }: PromptOptions): string {
  return [
    'Bạn là giáo viên tiếng Trung HSK1 của tôi. Tôi là người mới học, đang luyện nghe.',
    '',
    `Đây là toàn bộ vốn từ tôi đã học (${MY_WORDS.length} từ):`,
    wordList(),
    '',
    `Hãy tạo cho tôi ${count} câu luyện nghe. Yêu cầu:`,
    '- Chỉ dùng những từ trong danh sách trên. Nếu bắt buộc phải thêm từ mới, ghi rõ ở cuối.',
    '- Câu tự nhiên, đúng ngữ pháp, đúng trình độ HSK1, dài 3–10 chữ Hán.',
    '- Đổi chủ ngữ, thời gian, hành động, địa điểm. Không lặp lại một cấu trúc.',
    '- Lặp nhiều hơn các từ: 现在、几、多少、什么、哪、这、那、买、钱、东西',
    '  và 点、分钟、早上、中午、晚上、爸爸、妈妈、来、回、看、电视、工作、会',
    '- Xếp từ dễ đến khó.',
    '',
    'Trả về đúng định dạng sau, mỗi dòng một câu, ba cột ngăn bằng dấu |,',
    'không đánh số, không thêm tiêu đề, không giải thích gì thêm:',
    '',
    '汉字 | pinyin có dấu thanh | nghĩa tiếng Việt',
    '',
    'Ví dụ:',
    '现在几点？ | Xiànzài jǐ diǎn? | Bây giờ mấy giờ?',
    '妈妈在打电话。 | Māma zài dǎ diànhuà. | Mẹ đang gọi điện thoại.',
  ].join('\n');
}

/**
 * Danh sách câu đã có, để dán kèm khi muốn AI không tạo trùng.
 *
 * Tách khỏi `buildPrompt` vì đây là thứ dài ra theo thời gian: xin câu lần đầu
 * thì không cần, xin lần thứ năm thì rất cần.
 */
export function buildExistingList(sentences: readonly MySentence[]): string {
  return [
    `Tôi đã luyện ${sentences.length} câu sau rồi, đừng tạo lại bất kỳ câu nào trong số này:`,
    sentences.map((sentence) => sentence.hanzi).join(' '),
  ].join('\n');
}
