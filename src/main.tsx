import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './App.tsx';
import { wakeServer } from './lib/api/wake.ts';
import { registerServiceWorker } from './lib/pwa/register.ts';
import './styles/index.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Không tìm thấy phần tử #root trong index.html.');
}

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);

registerServiceWorker();
// Máy chủ miễn phí dậy chậm: gọi một phát ngay từ đây để lúc mở "Câu của tôi" đã sẵn sàng.
wakeServer();
