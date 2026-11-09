import React, { useEffect, useMemo, useState } from 'react';
import { YOUKU_CONFIG } from '../data';

const AVATAR_FALLBACKS = (YOUKU_CONFIG as { commentAvatars?: string[] }).commentAvatars ?? [];

function stableIndex(seed: string, length: number): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % length;
}

/**
 * 带 SVG 占位兜底的图片(深色基准)。
 * 图片字段统一 asset key 约定:"/@app-assets/Youku/posters/<id>.png" 等;
 * 素材未生成时 onError 回落为深灰渐变 + 标题文字的 SVG 占位(不出现裂图)。
 */
function placeholderSvg(label: string, ratio: 'poster' | 'landscape' | 'square'): string {
  const [w, h] = ratio === 'poster' ? [120, 180] : ratio === 'landscape' ? [160, 90] : [96, 96];
  const text = (label || '优酷').slice(0, 6);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="#23262E"/><stop offset="1" stop-color="#15171C"/>` +
    `</linearGradient></defs>` +
    `<rect width="${w}" height="${h}" fill="url(#g)"/>` +
    `<circle cx="${w / 2}" cy="${h / 2 - 10}" r="14" fill="none" stroke="#3D8BFF" stroke-width="3" stroke-dasharray="70 18"/>` +
    `<path d="M${w / 2 - 4} ${h / 2 - 16}l10 6-10 6z" fill="#3D8BFF"/>` +
    `<text x="${w / 2}" y="${h / 2 + 18}" font-size="10" fill="#8A8A8A" text-anchor="middle">${text}</text>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export default function Img({
  src,
  alt = '',
  label = '',
  ratio = 'poster',
  className,
}: {
  src?: string;
  alt?: string;
  /** 占位图上显示的短文案(通常传片名) */
  label?: string;
  ratio?: 'poster' | 'landscape' | 'square';
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const fallback = useMemo(() => {
    if (ratio === 'square' && AVATAR_FALLBACKS.length > 0) {
      return AVATAR_FALLBACKS[stableIndex(label || alt || 'youku-user', AVATAR_FALLBACKS.length)];
    }
    return placeholderSvg(label || alt, ratio);
  }, [label, alt, ratio]);
  useEffect(() => {
    setFailed(false);
  }, [src]);
  return (
    <img
      src={failed || !src ? fallback : src}
      alt={alt}
      className={className}
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}
