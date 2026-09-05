import type { IconName } from './ui/Icon.tsx';

export interface NavItem {
  to: string;
  label: string;
  /** Nhãn ngắn dùng cho thanh dưới cùng trên điện thoại. */
  shortLabel?: string;
  icon: IconName;
  description?: string;
}

/** Bốn chức năng luyện tập chính, hiển thị ở thanh điều hướng dưới cùng. */
export const STUDY_NAV: readonly NavItem[] = [
  {
    to: '/the',
    label: 'Lật thẻ',
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

/** Các mục còn lại, hiển thị ở sidebar trên máy tính và ở đầu trang trên điện thoại. */
export const GENERAL_NAV: readonly NavItem[] = [
  { to: '/', label: 'Hôm nay', icon: 'home' },
  { to: '/buoi-hoc', label: 'Buổi học', icon: 'book' },
  { to: '/tra-tu', label: 'Tra từ', icon: 'search' },
  { to: '/tien-do', label: 'Tiến độ', icon: 'chart' },
  { to: '/cai-dat', label: 'Cài đặt', icon: 'settings' },
];
