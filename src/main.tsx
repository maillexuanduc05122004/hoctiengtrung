import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './App.tsx';
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
