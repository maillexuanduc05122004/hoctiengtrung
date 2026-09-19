/**
 * Đánh thức máy chủ ngay khi mở ứng dụng.
 *
 * Máy chủ miễn phí (Render) ngủ sau vài phút không ai gọi và cần chừng nửa phút
 * tới một phút để dậy. Người học thường mở trang chủ, học vài thẻ, rồi mới sang
 * "Câu của tôi" — nếu chỉ tới lúc đó mới gọi máy chủ lần đầu thì phải chờ trọn
 * khoảng ấy. Gửi một request ngay từ lúc mở ứng dụng để tới khi cần, máy chủ
 * đã (gần) tỉnh.
 *
 * Gọi `/actuator/health` ở gốc máy chủ (đường công khai, xem `SecurityConfig`
 * phía backend) với `mode: 'no-cors'`: không cần đọc phản hồi, chỉ cần request
 * chạm tới máy chủ, và như thế không phụ thuộc cấu hình CORS của đường đó. Lỗi
 * gì cũng nuốt — đây là việc phụ, không được làm ứng dụng hỏng.
 */
import { API_BASE } from './client.ts';

/** Địa chỉ kiểm tra sức khoẻ, suy từ `API_BASE` bằng cách bỏ `/api/v1`. */
export function healthUrl(base: string = API_BASE): string {
  return `${base.replace(/\/api\/v1$/, '')}/actuator/health`;
}

export function wakeServer(): void {
  if (typeof fetch !== 'function') return;
  try {
    void fetch(healthUrl(), { mode: 'no-cors', cache: 'no-store' }).catch(() => undefined);
  } catch {
    // `fetch` ném đồng bộ khi địa chỉ không hợp lệ; cũng bỏ qua.
  }
}
