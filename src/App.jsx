import { useEffect, useState } from 'react';
import GalleryPage from './pages/GalleryPage';
import AdminPage from './pages/AdminPage';
import MobileGalleryPage from './pages/MobileGalleryPage';
import PwaInstallPrompt from './components/PwaInstallPrompt';
import PwaUpdatePrompt from './components/PwaUpdatePrompt';

function detectMobileClient() {
  if (typeof window === 'undefined') {
    return false;
  }

  const params = new URLSearchParams(window.location.search);
  const forcedMode = params.get('mobile');
  if (forcedMode === '1') {
    return true;
  }
  if (forcedMode === '0') {
    return false;
  }

  const userAgent = navigator.userAgent || '';
  const agentMobile = /Android|iPhone|iPad|iPod|Mobile|CriOS|FxiOS|SamsungBrowser/i.test(userAgent);
  const coarsePointer =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(hover: none) and (pointer: coarse)').matches
      : false;

  return agentMobile || coarsePointer;
}

function App() {
  const [isMobileClient, setIsMobileClient] = useState(() => detectMobileClient());
  const [route, setRoute] = useState(() => window.location.hash.replace(/^#/, '') || '/');

  useEffect(() => {
    function syncClientType() {
      setIsMobileClient(detectMobileClient());
    }

    syncClientType();
    window.addEventListener('resize', syncClientType);
    window.addEventListener('orientationchange', syncClientType);
    const syncRoute = () => setRoute(window.location.hash.replace(/^#/, '') || '/');
    window.addEventListener('hashchange', syncRoute);

    return () => {
      window.removeEventListener('resize', syncClientType);
      window.removeEventListener('orientationchange', syncClientType);
      window.removeEventListener('hashchange', syncRoute);
    };
  }, []);

  return (
    <>
      {route === '/admin'
        ? <AdminPage />
        : isMobileClient ? <MobileGalleryPage /> : <GalleryPage />}
      {route !== '/admin' ? <PwaInstallPrompt /> : null}
      <PwaUpdatePrompt />
    </>
  );
}

export default App;
