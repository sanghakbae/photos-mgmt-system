import { describe, expect, it } from 'vitest';
import {
  createDefaultPhotoTitle,
  extractGoogleMapsUrl,
  formatCoordinates,
  getDisplayPhotoTitle,
  getGoogleMapsUrl,
  getSeasonLabel,
  normalizeLocationFields,
} from './photoUtils';

describe('photoUtils', () => {
  it('formats coordinates and map URLs', () => {
    expect(formatCoordinates(37.1672, 126.6206)).toBe('37.1672, 126.6206');
    expect(getGoogleMapsUrl(37.1672, 126.6206)).toBe(
      'https://www.google.com/maps?q=37.1672,126.6206',
    );
  });

  it('accepts Google Maps links and rejects unrelated links', () => {
    expect(extractGoogleMapsUrl('https://maps.app.goo.gl/example')).toBe(
      'https://maps.app.goo.gl/example',
    );
    expect(extractGoogleMapsUrl('https://example.com/maps')).toBe('');
  });

  it('normalizes a map URL entered in the location field', () => {
    expect(normalizeLocationFields('https://www.google.com/maps?q=37,126')).toEqual({
      locationText: 'Google Maps 위치',
      mapsUrl: 'https://www.google.com/maps?q=37,126',
    });
  });

  it('derives stable seasonal labels and fallback titles', () => {
    expect(getSeasonLabel(new Date('2026-04-01T00:00:00Z'))).toBe('봄 여행');
    expect(createDefaultPhotoTitle({ fileName: 'IMG_1234.jpg' })).toBe('IMG_1234');
    expect(getDisplayPhotoTitle({ title: '', capturedAt: '2026-08-01T00:00:00Z' }))
      .toBe('8월의 여름 여행');
  });
});
