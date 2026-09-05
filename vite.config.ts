import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: null,
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable.png'],
      manifest: {
        name: 'Mỗi Ngày 中文',
        short_name: 'Mỗi Ngày',
        description: 'Học từ vựng HSK 3.0 cấp 1-3 mỗi ngày, dùng được khi ngoại tuyến.',
        lang: 'vi',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f6f1e7',
        theme_color: '#f6f1e7',
        categories: ['education'],
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Dữ liệu từ vựng phải dùng được ngoại tuyến ngay sau lần tải đầu tiên.
        globIgnores: ['**/node_modules/**'],
        navigateFallback: '/index.html',
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/data/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'du-lieu-tu-vung',
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        // Vite 8 dùng Rolldown nên tách gói qua `advancedChunks`,
        // không còn `manualChunks` như thời Rollup.
        advancedChunks: {
          groups: [
            { name: 'vendor', test: /[\\/]node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/ },
            { name: 'storage', test: /[\\/]node_modules[\\/]dexie[\\/]/ },
          ],
        },
      },
    },
  },
});
