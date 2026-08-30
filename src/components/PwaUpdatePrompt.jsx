import { RefreshCw, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export const PWA_UPDATE_EVENT = 'gallery:pwa-update-available';

export default function PwaUpdatePrompt() {
  const [updateWorker, setUpdateWorker] = useState(null);
  const [visible, setVisible] = useState(false);
  const reloadingRef = useRef(false);

  useEffect(() => {
    function handleUpdate(event) {
      setUpdateWorker(event.detail?.worker || null);
      setVisible(true);
    }

    function handleControllerChange() {
      if (!reloadingRef.current) {
        return;
      }
      window.location.reload();
    }

    window.addEventListener(PWA_UPDATE_EVENT, handleUpdate);
    navigator.serviceWorker?.addEventListener('controllerchange', handleControllerChange);

    return () => {
      window.removeEventListener(PWA_UPDATE_EVENT, handleUpdate);
      navigator.serviceWorker?.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  function applyUpdate() {
    reloadingRef.current = true;

    if (updateWorker && updateWorker.state !== 'activated') {
      updateWorker.postMessage({ type: 'SKIP_WAITING' });
      window.setTimeout(() => window.location.reload(), 2500);
      return;
    }

    window.location.reload();
  }

  if (!visible) {
    return null;
  }

  return (
    <aside className="pwa-update-prompt" role="status" aria-live="polite">
      <div className="pwa-update-icon" aria-hidden="true">
        <RefreshCw size={20} />
      </div>
      <div className="pwa-update-copy">
        <strong>새 버전이 준비됐습니다</strong>
        <p>업데이트하면 최신 기능과 수정 사항이 바로 적용됩니다.</p>
      </div>
      <button type="button" className="pwa-update-button" onClick={applyUpdate}>
        지금 업데이트
      </button>
      <button
        type="button"
        className="pwa-update-close"
        onClick={() => setVisible(false)}
        aria-label="업데이트 안내 닫기"
      >
        <X size={18} />
      </button>
    </aside>
  );
}
