/**
 * Đăng ký service worker để ứng dụng chạy được khi ngoại tuyến.
 *
 * Dùng chế độ `prompt` của vite-plugin-pwa: bản mới không tự chiếm quyền giữa
 * lúc người học đang làm bài, mà chờ người dùng bấm "Tải bản mới".
 */

type UpdateListener = (apply: () => void) => void;

let applyUpdate: (() => void) | null = null;
let pendingListener: UpdateListener | null = null;

/** Đăng ký nơi nhận thông báo có bản mới. Trả về hàm huỷ đăng ký. */
export function onServiceWorkerUpdate(listener: UpdateListener): () => void {
  pendingListener = listener;
  if (applyUpdate) listener(applyUpdate);
  return () => {
    if (pendingListener === listener) pendingListener = null;
  };
}

export function registerServiceWorker(): void {
  if (import.meta.env.DEV) return;
  if (!('serviceWorker' in navigator)) return;

  void import('virtual:pwa-register')
    .then(({ registerSW }) => {
      const update = registerSW({
        immediate: true,
        onNeedRefresh() {
          applyUpdate = () => update(true);
          pendingListener?.(applyUpdate);
        },
      });
    })
    .catch((error: unknown) => {
      console.warn('Không đăng ký được service worker.', error);
    });
}
