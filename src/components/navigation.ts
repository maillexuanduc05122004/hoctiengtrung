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
 * Ba cách luyện tập.
 *
 * Đây là CÔNG CỤ chứ không phải ĐÍCH ĐẾN: vào thẳng "/go" mà không kèm buổi học
 * hay nguồn từ thì người học rơi vào một hàng đợi họ không chọn. Vì vậy chúng
 * không chiếm thanh điều hướng chính; chúng xuất hiện ở nơi đã biết mình đang
 * luyện tập từ nào — trang buổi học và hàng đổi chế độ trong phiên.
 *
 * Lật thẻ đã bỏ vì người học ít dùng; đường dẫn cũ `/the` được chuyển sang
 * `/go` (xem App.tsx).
 */
export const STUDY_NAV: readonly NavItem[] = [
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
 * Các đích đến chính, cũng là thanh điều hướng dưới cùng trên điện thoại.
 *
 * Thứ tự theo đúng nhịp một ngày học: mở app xem hôm nay cần gì, vào buổi học,
 * nghe lại vốn từ của riêng mình, nghe bài cố định, tự dịch câu Việt → Trung,
 * đọc to câu dài cho AI chấm phát âm, rồi nghe một đoạn văn dài hơn để luyện
 * tai. "Sổ tay" và "Tra từ" đã bỏ vì người học ít dùng.
 *
 * "Dịch câu" và "Luyện phát âm" là đích đến vì chạy trên kho câu của các bài
 * nghe cố định, không trên bộ HSK chia buổi hay vốn từ riêng.
 *
 * "Câu của tôi" là đích đến chứ không phải một cách luyện: nó chạy trên danh
 * sách từ người học tự khai, không phải trên bộ HSK chia buổi, nên không có chỗ
 * nào khác dẫn vào nó được.
 *
 * "Nghe cố định" là đích đến vì cùng lý do: nó chạy trên những bài nghe soạn
 * sẵn, không đổi, chứ không trên bộ HSK hay vốn từ riêng. "Nghe đoạn văn" cũng
 * vậy: những câu chuyện ngắn soạn sẵn từ vốn từ đã học.
 *
 * "Tiến độ" nhường chỗ trên thanh này cho "Nghe đoạn văn": xem tiến độ là việc
 * thỉnh thoảng mới làm, nên nó xuống các mục phụ và vẫn mở được từ thẻ tiến độ
 * ở trang Hôm nay.
 */
export const MAIN_NAV: readonly NavItem[] = [
  { to: '/', label: 'Hôm nay', icon: 'home' },
  { to: '/buoi-hoc', label: 'Buổi học', shortLabel: 'Buổi học', icon: 'book' },
  { to: '/cau-cua-toi', label: 'Câu của tôi', shortLabel: 'Câu', icon: 'lightbulb' },
  { to: '/nghe-co-dinh', label: 'Nghe cố định', shortLabel: 'Nghe', icon: 'headphones' },
  { to: '/dich-cau', label: 'Dịch câu', shortLabel: 'Dịch', icon: 'translate' },
  { to: '/phat-am', label: 'Luyện phát âm', shortLabel: 'Phát âm', icon: 'waveform' },
  { to: '/nghe-doan-van', label: 'Nghe đoạn văn', shortLabel: 'Đoạn văn', icon: 'text' },
];

/** Các mục phụ, chỉ có ở cột bên trái trên máy tính và ở đầu trang trên điện thoại. */
export const SECONDARY_NAV: readonly NavItem[] = [
  { to: '/tien-do', label: 'Tiến độ', icon: 'chart' },
  { to: '/cai-dat', label: 'Cài đặt', icon: 'settings' },
];
