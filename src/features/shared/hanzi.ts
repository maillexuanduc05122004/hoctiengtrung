/** Khoảng mã của chữ Hán thông dụng, đủ cho toàn bộ từ vựng HSK 1-3. */
const HANZI_PATTERN = /[\u4e00-\u9fff\u3400-\u4dbf]/;

/**
 * Cho biết một đoạn văn bản có chứa chữ Hán hay không.
 *
 * Dùng để quyết định có gắn phông chữ Hán vào một đoạn hay không, vì cùng một
 * chỗ (đáp án đúng, phần chấm lỗi) khi thì hiện chữ Hán khi thì hiện tiếng Việt
 * hoặc pinyin, mà phông Hán làm chữ Latinh trông nặng nề.
 */
export function containsHanzi(text: string): boolean {
  return HANZI_PATTERN.test(text);
}
