// Defensive interceptor to handle multiple wallet injected scripts / browser extension conflicts
try {
  const originalDefineProperty = Object.defineProperty;
  Object.defineProperty = function <T>(obj: T, prop: PropertyKey, descriptor: PropertyDescriptor & ThisType<any>): T {
    if (obj === window && prop === 'ethereum') {
      try {
        return originalDefineProperty(obj, prop, descriptor);
      } catch (e) {
        console.warn("Intercepted and resolved 'window.ethereum' definition collision gracefully:", e);
        return obj;
      }
    }
    return originalDefineProperty(obj, prop, descriptor);
  };
} catch (e) {
  console.warn("Could not patch Object.defineProperty:", e);
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.scss';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
