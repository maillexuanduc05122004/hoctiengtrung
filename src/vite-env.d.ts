/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /**
   * Địa chỉ gốc của máy chủ API, không kèm `/api/v1`, ví dụ
   * `https://ten-service.onrender.com`. Bỏ trống thì dùng `http://localhost:8080`.
   */
  readonly VITE_API_URL?: string;
}
