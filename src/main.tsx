import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { WalletProvider } from './context/WalletContext';
import './index.scss';

// Кошельки подключаются через EIP-6963, поэтому хак с подменой Object.defineProperty
// для window.ethereum больше не нужен (он ломал глобальный объект для всего приложения).
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WalletProvider>
      <App />
    </WalletProvider>
  </StrictMode>
);
