/**
 * Hai tài khoản dựng sẵn trên máy chủ.
 *
 * Máy chủ chỉ có đúng hai người dùng: chủ trang (giữ danh sách từ đã học, có
 * quyền quản trị) và một tài khoản khách, cũng được nạp sẵn cùng 89 từ / 90
 * câu. Mật khẩu nằm ngay đây và hiện luôn trên ô đăng nhập: đây là ứng dụng
 * học cá nhân, không có gì để giấu.
 *
 * Bình thường không ai phải đăng nhập: trang "Câu của tôi" gọi máy chủ không
 * kèm token và máy chủ tự dùng tài khoản chủ trang. Ô đăng nhập chỉ còn ở Cài
 * đặt, cho lúc muốn dùng tài khoản khác; phiên khách còn sót từ bản cũ (bản
 * từng tự vào bằng 1111) được trang "Câu của tôi" tự bỏ.
 */
export const ACCOUNTS = {
  owner: { username: '2222', password: '2222', label: 'Của tôi' },
  guest: { username: '1111', password: '1111', label: 'Khách' },
} as const;

export type AccountKey = keyof typeof ACCOUNTS;
export type Account = (typeof ACCOUNTS)[AccountKey];
