/**
 * Chuẩn hoá chuỗi tiếng Việt.
 *
 * Dùng chung cho việc tìm kiếm trong từ điển và cho việc chấm đáp án, để hai
 * nơi luôn hiểu "bỏ dấu" theo cùng một cách.
 */

/** Bỏ toàn bộ dấu thanh, dấu mũ, dấu móc và đổi "đ" thành "d". */
export function stripVietnameseDiacritics(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .normalize('NFC');
}

/**
 * Chuẩn hoá nhẹ: NFC, thường hoá, gộp khoảng trắng, bỏ dấu câu ở hai đầu.
 * Giữ nguyên dấu tiếng Việt.
 */
export function normalizeLoose(text: string): string {
  return text
    .normalize('NFC')
    .toLowerCase()
    .replace(/[\s\u00a0\u3000]+/g, ' ')
    .replace(/^[\s.,;:!?'"()[\]{}‘’“”…-]+/, '')
    .replace(/[\s.,;:!?'"()[\]{}‘’“”…-]+$/, '')
    .trim();
}

/** Khoá tìm kiếm: chuẩn hoá nhẹ rồi bỏ dấu, dùng để so khớp không dấu. */
export function searchKey(text: string): string {
  return stripVietnameseDiacritics(normalizeLoose(text));
}
