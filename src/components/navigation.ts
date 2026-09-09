import type { IconName } from './ui/Icon.tsx';

export interface NavItem {
  to: string;
  label: string;
  /** Nhãn ngắn dùng cho thanh dưới cùng trên điện thoại. */
  shortLabel?: string;
  icon: IconName;
  description?: string;
}

/**
 * Bốn cách luyện tập.
 *
 * Đây là CÔNG CỤ chứ không phải ĐÍCH ĐẾN: vào thẳng "/go" mà không kèm buổi học
 * hay nguồn từ thì người học rơi vào một hàng đợi họ không chọn. Vì vậy chúng
 * không còn chiếm thanh điều hướng chính; chúng xuất hiện ở nơi đã biết mình
 * đang luyện tập từ nào — trang buổi học, sổ tay, và hàng đổi chế độ trong phiên.
 */
export const STUDY_NAV: readonly NavItem[] = [
  {
    to: '/the',
    label: 'Lật thẻ',
    shortLabel: 'Thẻ',
    icon: 'card',
    description: 'Xem mặt chữ rồi tự kiểm tra trí nhớ',
  },
  {
    to: '/go',
    label: 'Gõ đáp án',
    shortLabel: 'Gõ',
    icon: 'keyboard',
    description: 'Gõ chữ Hán, pinyin hoặc nghĩa',
  },
  {
    to: '/nghe',
    label: 'Nghe chép',
    shortLabel: 'Nghe',
    icon: 'ear',
    description: 'Nghe phát âm rồi viết lại',
  },
  {
    to: '/noi',
    label: 'Luyện nói',
    shortLabel: 'Nói',
    icon: 'mic',
    description: 'Đọc theo mẫu và kiểm tra bằng nhận dạng giọng nói',
  },
];

/**
 * Năm đích đến chính, đủ để làm thanh điều hướng dưới cùng trên điện thoại.
 *
 * Thứ tự theo đúng nhịp một ngày học: mở app xem hôm nay cần gì, vào buổi học,
 * ghé sổ tay, tra một từ lạ, rồi thỉnh thoảng ngó lại tiến độ.
 */
export const MAIN_NAV: readonly NavItem[] = [
  { to: '/', label: 'Hôm nay', icon: 'home' },
  { to: '/buoi-hoc', label: 'Buổi học', shortLabel: 'Buổi học', icon: 'book' },
  { to: '/da-luu', label: 'Sổ tay', icon: 'star' },
  { to: '/tra-tu', label: 'Tra từ', icon: 'search' },
  { to: '/tien-do', label: 'Tiến độ', icon: 'chart' },
];

/** Các mục phụ, chỉ có ở cột bên trái trên máy tính và ở đầu trang trên điện thoại. */
export const SECONDARY_NAV: readonly NavItem[] = [
  { to: '/cai-dat', label: 'Cài đặt', icon: 'settings' },
];
