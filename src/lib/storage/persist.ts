/**
 * Giữ dữ liệu học khỏi bị trình duyệt dọn.
 *
 * Toàn bộ tiến độ nằm trong IndexedDB của máy. Mặc định kho đó là "best effort":
 * khi máy sắp hết chỗ, trình duyệt được phép xoá sạch dữ liệu của một trang mà
 * không hỏi ai. Với một ứng dụng không có backend thì đó là mất trắng.
 *
 * `navigator.storage.persist()` xin đổi kho sang chế độ "persistent", lúc đó chỉ
 * chính người dùng mới xoá được. Chrome và Edge tự quyết định dựa trên mức độ
 * gắn bó với trang (đã cài PWA, hay ghé thăm, đã cho phép thông báo); Firefox
 * hỏi người dùng; Safari cấp theo cách riêng. Không hứa được là sẽ có, nên phần
 * giao diện phải nói thật kết quả thay vì trấn an suông.
 *
 * Không tự động gọi lúc mở ứng dụng: ở Firefox việc đó bật một hộp thoại xin
 * quyền ngay khi người học vừa vào trang, trong khi họ chưa có gì để mất.
 */

export interface StorageState {
  /** Trình duyệt có Storage API để hỏi hay không. */
  supported: boolean;
  /** Kho đã ở chế độ được ghim, trình duyệt không tự xoá nữa. */
  persisted: boolean;
  /** Số byte đang dùng, `null` khi trình duyệt không cho biết. */
  usage: number | null;
  /** Hạn mức ước lượng, `null` khi trình duyệt không cho biết. */
  quota: number | null;
}

export const UNSUPPORTED_STORAGE: StorageState = {
  supported: false,
  persisted: false,
  usage: null,
  quota: null,
};

function storageManager(): StorageManager | null {
  if (typeof navigator === 'undefined') return null;
  const manager = navigator.storage;
  return manager !== undefined && typeof manager.persisted === 'function' ? manager : null;
}

/** Đọc trạng thái kho. Mọi lỗi đều quy về "không hỏi được" chứ không ném ra. */
export async function readStorageState(): Promise<StorageState> {
  const manager = storageManager();
  if (manager === null) return UNSUPPORTED_STORAGE;

  let persisted: boolean;
  try {
    persisted = await manager.persisted();
  } catch {
    return UNSUPPORTED_STORAGE;
  }

  let usage: number | null = null;
  let quota: number | null = null;
  if (typeof manager.estimate === 'function') {
    try {
      const estimate = await manager.estimate();
      usage = typeof estimate.usage === 'number' ? estimate.usage : null;
      quota = typeof estimate.quota === 'number' ? estimate.quota : null;
    } catch {
      // Ước lượng dung lượng là phần phụ; không có thì thôi.
    }
  }

  return { supported: true, persisted, usage, quota };
}

/**
 * Xin ghim kho dữ liệu. Trả về trạng thái sau khi xin.
 *
 * Chỉ gọi từ một thao tác thật của người dùng: vài trình duyệt bỏ qua lời xin
 * không đến từ cử chỉ người dùng, và Firefox hiện hộp thoại xin quyền.
 */
export async function requestPersistentStorage(): Promise<StorageState> {
  const manager = storageManager();
  if (manager === null || typeof manager.persist !== 'function') return UNSUPPORTED_STORAGE;
  try {
    await manager.persist();
  } catch {
    // Bị từ chối cũng là một câu trả lời; đọc lại trạng thái thật ở dưới.
  }
  return readStorageState();
}

const UNITS: readonly string[] = ['B', 'KB', 'MB', 'GB'];

/**
 * Đổi số byte sang chuỗi ngắn kiểu "12,4 MB".
 *
 * Dùng dấu phẩy thập phân theo cách viết tiếng Việt. Từ 10 đơn vị trở lên thì bỏ
 * phần lẻ: "512 MB" dễ đọc hơn "512,3 MB" mà không mất thông tin nào đáng kể.
 */
export function formatBytes(bytes: number | null): string {
  if (bytes === null || !Number.isFinite(bytes) || bytes < 0) return 'không rõ';
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const rounded = unit === 0 || value >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${String(rounded).replace('.', ',')} ${UNITS[unit]}`;
}
