/**
 * Dựng sẵn câu lệnh để người học dán sang một trợ lý AI ngoài web.
 *
 * Đường chính của trang nay là nút "Tạo câu mới bằng AI" gọi thẳng máy chủ.
 * Câu lệnh này là đường phụ, giữ lại cho hai trường hợp thật: máy chủ chưa cấu
 * hình khoá AI, hoặc người học muốn dùng một trợ lý khác mà họ đã quen. Cách
 * dùng là: chép câu lệnh này, dán sang chỗ có AI, lấy kết quả dán ngược lại
 * vào ô nhập của trang.
 *
 * Câu lệnh phải tự đứng được một mình, nên nó mang theo toàn bộ vốn từ đã học
 * — lấy từ máy chủ, không còn viết cứng. Điều quan trọng nhất là đoạn tả định
 * dạng: `parseSentences` đọc được nhiều biến thể, nhưng chỉ dạng ba cột ngăn
 * bằng `|` mới có đủ pinyin lẫn nghĩa.
 */

/** Một từ đã học, đủ ba phần để ghi vào câu lệnh. */
export interface PromptWord {
  hanzi: string;
  pinyin: string;
  vi: string;
}

export interface PromptOptions {
  /** Số câu muốn xin. */
  count: number;
  /** Vốn từ đã học, theo thứ tự muốn liệt kê. */
  words: readonly PromptWord[];
}

function wordList(words: readonly PromptWord[]): string {
  return words.map((word) => `${word.hanzi} (${word.pinyin}) ${word.vi}`).join('; ');
}

export function buildPrompt({ count, words }: PromptOptions): string {
  return [
    'Bạn là giáo viên tiếng Trung HSK1 của tôi. Tôi là người mới học, đang luyện nghe.',
    '',
    `Đây là toàn bộ vốn từ tôi đã học (${words.length} từ):`,
    wordList(words),
    '',
    `Hãy tạo cho tôi ${count} câu luyện nghe. Yêu cầu:`,
    '- Chỉ dùng những chữ Hán có trong danh sách trên. Nếu bắt buộc phải thêm chữ mới, ghi rõ ở cuối.',
    '- Câu tự nhiên, đúng ngữ pháp, đúng trình độ HSK1, dài 3–10 chữ Hán.',
    '- Đổi chủ ngữ, thời gian, hành động, địa điểm. Không lặp lại một cấu trúc.',
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
export function buildExistingList(sentences: readonly { hanzi: string }[]): string {
  return [
    `Tôi đã luyện ${sentences.length} câu sau rồi, đừng tạo lại bất kỳ câu nào trong số này:`,
    sentences.map((sentence) => sentence.hanzi).join(' '),
  ].join('\n');
}
