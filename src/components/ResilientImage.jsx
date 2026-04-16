import { useEffect, useMemo, useState } from 'react';

function buildFallbackImageDataUrl(label) {
  return (
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
        <defs>
          <linearGradient id="fallback-gradient" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stop-color="#1a2430" />
            <stop offset="100%" stop-color="#5c4a3d" />
          </linearGradient>
        </defs>
        <rect width="1200" height="900" fill="url(#fallback-gradient)" />
        <g fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="24">
          <rect x="168" y="170" width="864" height="560" rx="42" />
          <path d="M272 620l190-196 140 138 132-104 194 162" />
          <circle cx="406" cy="330" r="52" fill="rgba(255,255,255,0.16)" stroke="none" />
        </g>
        <text x="600" y="790" fill="rgba(255,255,255,0.88)" font-size="46" text-anchor="middle" font-family="Arial, sans-serif">
          ${label}
        </text>
      </svg>
    `)
  );
}

export default function ResilientImage({
  alt,
  className,
  sources,
  fallbackLabel = '이미지를 불러오지 못했습니다.',
  ...imgProps
}) {
  const resolvedSources = useMemo(
    () => [...new Set((sources || []).filter(Boolean))],
    [sources],
  );
  const sourcesKey = useMemo(() => resolvedSources.join('\n'), [resolvedSources]);
  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => {
    setSourceIndex(0);
  }, [sourcesKey]);

  const activeSource = resolvedSources[sourceIndex] || buildFallbackImageDataUrl(fallbackLabel);
  const exhausted = sourceIndex >= resolvedSources.length;

  return (
    <img
      {...imgProps}
      src={activeSource}
      alt={alt}
      className={`${className}${exhausted ? ' image-fallback' : ''}`}
      data-fallback={exhausted ? 'true' : 'false'}
      onError={() => {
        setSourceIndex((currentIndex) => currentIndex + 1);
      }}
    />
  );
}
