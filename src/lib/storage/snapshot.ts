/**
 * Bản chụp dữ liệu máy chủ để trang hiện ngay trong lúc chờ máy chủ.
 *
 * Phần "Câu của tôi" là phần duy nhất phụ thuộc máy chủ, mà máy chủ miễn phí
 * (Render) ngủ sau ít phút không ai gọi và mất vài chục giây để thức dậy. Mỗi
 * lần mở trang lại nhìn vòng chờ là điều người học than "lâu lắm". Thay vì
 * thế, kết quả nạp gần nhất được ghi lại đây và lần mở sau hiện ra tức thì;
 * lượt nạp thật vẫn chạy nền và ghi đè khi về tới.
 *
 * Chỉ là bản chụp, không phải nguồn sự thật: mọi thao tác ghi vẫn đi thẳng lên
 * máy chủ, và mỗi lần nạp thành công lại ghi đè. Khoá kèm mã người dùng đang
 * đăng nhập (hoặc `default` khi không đăng nhập — máy chủ dùng tài khoản chủ
 * trang), để đổi tài khoản không thấy thoáng qua dữ liệu của người khác.
 *
 * localStorage có thể bị chặn (chế độ riêng tư, hết chỗ); khi đó mọi hàm ở
 * đây lặng lẽ không làm gì và trang chạy như không có bản chụp — lúc đó tới
 * lượt bộ dự phòng đóng gói sẵn (`features/sentences/fallback.ts`). Ba nguồn
 * xếp theo độ tin cậy tăng dần: dự phòng → bản chụp → máy chủ; `DataOrigin`
 * cho hook nói với trang dữ liệu đang hiện đến từ đâu.
 */
import { loadAuth } from '../api/token-store.ts';

const PREFIX = 'moingay.snapshot.v1';

/**
 * Nguồn của dữ liệu đang hiện trên trang.
 *
 * - `builtin`: bộ dự phòng đóng gói sẵn — chưa từng nói chuyện với máy chủ trên máy này.
 * - `snapshot`: bản chụp lần nạp trước — mã thật nhưng có thể đã cũ.
 * - `server`: máy chủ vừa trả lời trong phiên này — nguồn sự thật.
 */
export type DataOrigin = 'builtin' | 'snapshot' | 'server';

/** Khoá đầy đủ cho một loại dữ liệu, theo người dùng hiện tại. */
export function snapshotKey(name: string): string {
  const userId = loadAuth()?.user.id;
  return `${PREFIX}.${name}.${userId === undefined ? 'default' : String(userId)}`;
}

export function readSnapshot<T>(name: string): T | null {
  try {
    const raw = localStorage.getItem(snapshotKey(name));
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeSnapshot<T>(name: string, value: T): void {
  try {
    localStorage.setItem(snapshotKey(name), JSON.stringify(value));
  } catch {
    // Không ghi được thì lần sau lại chờ máy chủ như thường.
  }
}
