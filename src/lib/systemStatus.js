function getStorageBackendLabel(storageBackend) {
  return storageBackend === 'r2' ? 'Cloudflare' : 'Local';
}

export function createInitialSystemStatus() {
  return {
    loading: true,
    renderOk: false,
    storageOk: false,
    storageBackend: '',
    message: '상태 확인 중',
    level: 'pending',
    issueStreak: 0,
  };
}

export function buildSystemStatusFromResponse(previousStatus, status) {
  const renderOk = Boolean(status?.render?.ok);
  const storageOk = Boolean(status?.storage?.ok);
  const storageBackend = status?.storage?.backend || previousStatus.storageBackend || '';
  const issueStreak = renderOk && storageOk ? 0 : (previousStatus.issueStreak || 0) + 1;
  const level = renderOk && storageOk ? 'connected' : 'degraded';

  return {
    loading: false,
    renderOk,
    storageOk,
    storageBackend,
    message: status?.storage?.message || status?.render?.message || '상태 확인 완료',
    level,
    issueStreak,
  };
}

export function buildSystemStatusFromError(previousStatus, error) {
  const issueStreak = (previousStatus.issueStreak || 0) + 1;

  return {
    ...previousStatus,
    loading: false,
    level: issueStreak >= 3 ? 'disconnected' : 'degraded',
    issueStreak,
    message: error instanceof Error ? error.message : '상태를 불러오지 못했습니다.',
  };
}

export function getSystemStatusPresentation(systemStatus) {
  if (systemStatus.loading) {
    return {
      className: 'status-pill status-pill-pending',
      label: '신호 확인 중',
    };
  }

  if (systemStatus.level === 'connected') {
    return {
      className: 'status-pill status-pill-connected',
      label: `정상 연결 · ${getStorageBackendLabel(systemStatus.storageBackend)}`,
    };
  }

  if (systemStatus.level === 'degraded') {
    return {
      className: 'status-pill status-pill-warning',
      label: systemStatus.renderOk ? '일시 지연' : '재연결 시도 중',
    };
  }

  return {
    className: 'status-pill status-pill-disconnected',
    label: '연결 이상',
  };
}
