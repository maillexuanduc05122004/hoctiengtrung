export interface LiveMessageProps {
  message: string;
  /** Tăng sau mỗi lần báo, để câu giống hệt câu trước vẫn được đọc lại. */
  token: number;
}

/**
 * Vùng đọc thông báo ngắn.
 *
 * Phần tử luôn nằm trong cây DOM kể cả lúc không có câu nào: trình đọc màn hình
 * chỉ theo dõi những vùng `aria-live` đã có sẵn từ trước, thêm vùng mới cùng
 * lúc với nội dung thì câu đầu tiên thường bị bỏ qua. Vì vậy ở đây giữ chỗ bằng
 * chiều cao một dòng thay vì gỡ hẳn, và trang không bị giật khi câu hiện ra.
 */
export function LiveMessage({ message, token }: LiveMessageProps) {
  return (
    <p
      role="status"
      aria-live="polite"
      className="min-h-[1.375rem] text-[0.8125rem] text-ink-soft"
    >
      {/* Khoá theo token để React thay nút mới, nhờ đó câu lặp lại vẫn được đọc. */}
      <span key={token}>{message}</span>
    </p>
  );
}
