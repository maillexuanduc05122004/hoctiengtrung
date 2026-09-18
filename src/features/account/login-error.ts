/**
 * Dịch lỗi đăng nhập thành câu tiếng Việt có dấu.
 *
 * Máy chủ trả thông điệp không dấu ("Email hoac mat khau khong dung") nên các
 * lỗi hay gặp được dịch lại ở đây; lỗi khác rơi về `describeApiError`.
 */
import { ApiError, describeApiError } from '../../lib/api/client.ts';

const FIELD_MESSAGES: Record<string, string> = {
  email: 'Email không hợp lệ.',
  password: 'Mật khẩu phải từ 8 đến 72 ký tự.',
};

export function describeLoginError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return 'Email hoặc mật khẩu không đúng.';
    if (err.status === 403) return 'Tài khoản này đã bị khoá.';
    if (err.status === 400 && err.problem?.errors) {
      const known = Object.keys(err.problem.errors)
        .map((field) => FIELD_MESSAGES[field])
        .filter((message): message is string => message !== undefined);
      if (known.length > 0) return known.join(' ');
    }
  }
  return describeApiError(err);
}
