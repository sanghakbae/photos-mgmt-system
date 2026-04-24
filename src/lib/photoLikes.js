const LIKED_PHOTO_IDS_KEY = 'liked-photo-ids';

export function loadLikedPhotoIds() {
  if (typeof window === 'undefined') {
    return new Set();
  }

  try {
    const raw = window.localStorage.getItem(LIKED_PHOTO_IDS_KEY);
    const values = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(values) ? values.filter(Boolean) : []);
  } catch {
    return new Set();
  }
}

export function saveLikedPhotoIds(likedPhotoIds) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(
    LIKED_PHOTO_IDS_KEY,
    JSON.stringify(Array.from(likedPhotoIds)),
  );
}
