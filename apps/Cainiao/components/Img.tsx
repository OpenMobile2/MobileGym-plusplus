import React from 'react';

const FALLBACK =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" rx="10" fill="%23E8EDF4"/><path d="M24 50l10-12 8 9 6-6 8 9H24z" fill="%23B9C4D3"/><circle cx="30" cy="30" r="5" fill="%23B9C4D3"/></svg>';

/** 带 onError 兜底的图片 */
export default function Img({ src, alt = '', className }: { src: string; alt?: string; className?: string }) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        (e.target as HTMLImageElement).src = FALLBACK;
      }}
    />
  );
}
