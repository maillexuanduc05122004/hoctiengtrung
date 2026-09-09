import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  formatBytes,
  readStorageState,
  requestPersistentStorage,
  UNSUPPORTED_STORAGE,
} from './persist.ts';

/**
 * `navigator.storage` chỉ đọc được, nên thay bằng defineProperty. Mỗi bài tự
 * dựng cái mình cần rồi trả lại nguyên trạng để bài sau không thấy đồ thừa.
 */
function stubStorage(value: unknown): void {
  Object.defineProperty(navigator, 'storage', {
    value,
    configurable: true,
    writable: true,
  });
}

const original = Object.getOwnPropertyDescriptor(navigator, 'storage');

afterEach(() => {
  if (original) Object.defineProperty(navigator, 'storage', original);
  else stubStorage(undefined);
});

describe('readStorageState', () => {
  it('trình duyệt không có Storage API thì báo là không hỏi được', async () => {
    stubStorage(undefined);

    expect(await readStorageState()).toEqual(UNSUPPORTED_STORAGE);
  });

  it('đọc được trạng thái ghim và dung lượng', async () => {
    stubStorage({
      persisted: () => Promise.resolve(true),
      estimate: () => Promise.resolve({ usage: 1_048_576, quota: 104_857_600 }),
    });

    expect(await readStorageState()).toEqual({
      supported: true,
      persisted: true,
      usage: 1_048_576,
      quota: 104_857_600,
    });
  });

  it('thiếu phần ước lượng dung lượng vẫn đọc được trạng thái ghim', async () => {
    stubStorage({ persisted: () => Promise.resolve(false) });

    expect(await readStorageState()).toEqual({
      supported: true,
      persisted: false,
      usage: null,
      quota: null,
    });
  });

  it('ước lượng dung lượng lỗi thì bỏ qua phần đó chứ không hỏng cả lời gọi', async () => {
    stubStorage({
      persisted: () => Promise.resolve(true),
      estimate: () => Promise.reject(new Error('không cho biết')),
    });

    expect(await readStorageState()).toMatchObject({ supported: true, persisted: true });
  });

  it('hỏi trạng thái mà lỗi thì coi như không hỏi được', async () => {
    stubStorage({ persisted: () => Promise.reject(new Error('bị chặn')) });

    expect(await readStorageState()).toEqual(UNSUPPORTED_STORAGE);
  });
});

describe('requestPersistentStorage', () => {
  it('xin xong thì đọc lại trạng thái thật chứ không tin giá trị trả về', async () => {
    // Vài trình duyệt trả về true rồi vẫn không ghim; trạng thái thật mới tính.
    const persist = vi.fn(() => Promise.resolve(true));
    stubStorage({ persist, persisted: () => Promise.resolve(false) });

    expect(await requestPersistentStorage()).toMatchObject({ supported: true, persisted: false });
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it('bị từ chối cũng trả về trạng thái chứ không ném lỗi', async () => {
    stubStorage({
      persist: () => Promise.reject(new Error('người dùng từ chối')),
      persisted: () => Promise.resolve(false),
    });

    expect(await requestPersistentStorage()).toMatchObject({ persisted: false });
  });

  it('trình duyệt không hỗ trợ thì trả về trạng thái không hỏi được', async () => {
    stubStorage({ persisted: () => Promise.resolve(false) });

    expect(await requestPersistentStorage()).toEqual(UNSUPPORTED_STORAGE);
  });
});

describe('formatBytes', () => {
  it('đổi sang đơn vị đọc được, dùng dấu phẩy thập phân', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1536)).toBe('1,5 KB');
    expect(formatBytes(1_048_576)).toBe('1 MB');
    expect(formatBytes(12_582_912)).toBe('12 MB');
    expect(formatBytes(1_073_741_824)).toBe('1 GB');
  });

  it('không có số liệu thì nói thẳng là không rõ', () => {
    expect(formatBytes(null)).toBe('không rõ');
    expect(formatBytes(Number.NaN)).toBe('không rõ');
    expect(formatBytes(-1)).toBe('không rõ');
  });
});
