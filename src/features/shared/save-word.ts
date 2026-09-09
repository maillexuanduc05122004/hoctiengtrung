/**
 * Câu báo sau khi lưu hay bỏ lưu một từ.
 *
 * Dùng chung để năm màn hình có nút sao đều nói giống hệt nhau — và để chỗ nào
 * cũng dùng đúng chữ "lưu" thay vì "đánh dấu", vì người học nghĩ về việc này
 * như cất một từ vào sổ tay chứ không như bật một lá cờ.
 */
export function saveWordMessage(word: string, saved: boolean): string {
  return saved ? `Đã lưu ${word} vào sổ tay` : `Đã bỏ ${word} khỏi sổ tay`;
}
