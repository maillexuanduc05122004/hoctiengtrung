/**
 * Hai tài khoản dựng sẵn trên máy chủ.
 *
 * Máy chủ chỉ có đúng hai người dùng: chủ trang (giữ danh sách từ đã học, có
 * quyền quản trị) và một tài khoản khách cho mọi người còn lại, cũng được nạp
 * sẵn cùng 89 từ / 90 câu. Mật khẩu nằm ngay đây và hiện luôn trên ô đăng
 * nhập: đây là ứng dụng học cá nhân, không có gì để giấu, và người học không
 * phải nhớ hay gõ gì cả — trang "Câu của tôi" tự vào bằng tài khoản khách.
 */
export const ACCOUNTS = {
  owner: { username: '2222', password: '2222', label: 'Của tôi' },
  guest: { username: '1111', password: '1111', label: 'Khách' },
} as const;

export type AccountKey = keyof typeof ACCOUNTS;
export type Account = (typeof ACCOUNTS)[AccountKey];
