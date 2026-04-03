import { loadAdminSession } from './googleAuth';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

function toApiUrl(path) {
  if (!apiBaseUrl) {
    return path;
  }

  return `${apiBaseUrl}${path}`;
}

function withAssetUrl(photo) {
  if (!photo?.imageUrl || /^https?:\/\//.test(photo.imageUrl) || !apiBaseUrl) {
    return photo;
  }

  return {
    ...photo,
    imageUrl: `${apiBaseUrl}${photo.imageUrl}`,
  };
}

async function request(path, options = {}) {
  const headers = { ...(options.headers ?? {}) };
  if (!('Content-Type' in headers) && !('content-type' in headers) && options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(toApiUrl(path), {
    ...options,
    headers,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.error || `Request failed: ${response.status}`);
  }

  return data;
}

function getAdminToken() {
  return loadAdminSession()?.credential ?? '';
}

export function getPublicPhotos() {
  return request('/api/public/photos').then((data) => (data?.photos ?? []).map(withAssetUrl));
}

export function getAdminPhotos() {
  return request('/api/admin/photos', {
    headers: {
      Authorization: `Bearer ${getAdminToken()}`,
    },
  }).then((data) => (data?.photos ?? []).map(withAssetUrl));
}

export function uploadAdminPhoto(payload) {
  const meta = typeof window !== 'undefined' ? window.btoa(unescape(encodeURIComponent(JSON.stringify(payload.meta)))) : '';

  return request('/api/admin/photos', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getAdminToken()}`,
      'Content-Type': payload.file.type || 'application/octet-stream',
      'X-Photo-Meta': meta,
    },
    body: payload.file,
  });
}

export function updateAdminPhoto(photoId, payload) {
  return request(`/api/admin/photos/${photoId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${getAdminToken()}`,
    },
    body: JSON.stringify(payload),
  });
}

export function deleteAdminPhoto(photoId) {
  return request(`/api/admin/photos/${photoId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${getAdminToken()}`,
    },
  });
}

export function getPhotoDownloadUrl(photo) {
  if (!photo?.id) {
    return '';
  }

  return toApiUrl(`/api/public/photos/${photo.id}/download`);
}
