import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { PWA_UPDATE_EVENT } from './components/PwaUpdatePrompt';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).then((registration) => {
      function announceUpdate(worker) {
        window.dispatchEvent(new CustomEvent(PWA_UPDATE_EVENT, {
          detail: { worker },
        }));
      }

      if (registration.waiting && navigator.serviceWorker.controller) {
        announceUpdate(registration.waiting);
      }

      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (!worker) {
          return;
        }

        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            announceUpdate(worker);
          }
        });
      });

      const checkForUpdate = () => registration.update().catch(() => {});
      window.addEventListener('focus', checkForUpdate);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          checkForUpdate();
        }
      });
      window.setInterval(checkForUpdate, 15 * 60 * 1000);
      checkForUpdate();
    }).catch((error) => {
      console.error('Service worker registration failed.', error);
    });
  });
}
