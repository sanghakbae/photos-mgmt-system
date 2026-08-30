import { Download, Share, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const DISMISSED_AT_KEY = 'gallery-pwa-install-dismissed-at';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
}

function isIosDevice() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function wasRecentlyDismissed() {
  const dismissedAt = Number(localStorage.getItem(DISMISSED_AT_KEY) || 0);
  return dismissedAt > 0 && Date.now() - dismissedAt < DISMISS_DURATION_MS;
}

export default function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState(null);
  const [visible, setVisible] = useState(false);
  const [ios] = useState(() => isIosDevice());

  useEffect(() => {
    if (isStandalone() || wasRecentlyDismissed()) {
      return undefined;
    }

    const showTimer = window.setTimeout(() => setVisible(true), 1400);

    function handleBeforeInstallPrompt(event) {
      event.preventDefault();
      setInstallEvent(event);
      setVisible(true);
    }

    function handleInstalled() {
      setVisible(false);
      setInstallEvent(null);
      localStorage.removeItem(DISMISSED_AT_KEY);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.clearTimeout(showTimer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_AT_KEY, String(Date.now()));
    setVisible(false);
  }

  async function install() {
    if (!installEvent) {
      return;
    }

    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    setInstallEvent(null);
    if (choice.outcome === 'accepted') {
      setVisible(false);
    }
  }

  if (!visible || (!ios && !installEvent)) {
    return null;
  }

  return (
    <aside className="pwa-install-prompt" aria-label="앱 설치 안내">
      <img className="pwa-install-icon" src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt="" />
      <div className="pwa-install-copy">
        <strong>홈 화면에서 더 빠르게 만나보세요</strong>
        {ios ? (
          <p>
            Safari 하단의 <Share size={15} aria-hidden="true" /> 공유 버튼을 누른 뒤
            <b> 홈 화면에 추가</b>를 선택하세요.
          </p>
        ) : (
          <p>앱으로 설치하면 브라우저 없이 바로 갤러리를 열 수 있습니다.</p>
        )}
      </div>
      {!ios ? (
        <button type="button" className="pwa-install-button" onClick={install}>
          <Download size={17} aria-hidden="true" /> 설치
        </button>
      ) : null}
      <button type="button" className="pwa-install-close" onClick={dismiss} aria-label="설치 안내 닫기">
        <X size={18} />
      </button>
    </aside>
  );
}
