// apps/Keep/res/images.ts —— 图片 id → URL 映射 + 统一 <Img> 组件。
// defaults.json 的 cover/avatar/images 字段存图片 id(如 "course_bigweight"),
// PNG 由 assets/gen_images.py 生成落在 assets/img/<id>.png;缺图自动降级为渐变占位。
import React from 'react';

const modules = import.meta.glob('../assets/img/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const ID_TO_URL: Record<string, string> = {};
for (const [path, url] of Object.entries(modules)) {
  const m = path.match(/\/([^/]+)\.png$/);
  if (m) ID_TO_URL[m[1]] = url;
}

/** 图片 id → 打包后 URL;缺图返回 null(调用方走占位)。 */
export function imgUrl(id: string): string | null {
  return ID_TO_URL[id] ?? null;
}

/* ---------- 缺图占位:渐变色块 + 首字 ---------- */

const GRADIENTS = [
  'linear-gradient(135deg, #34d399, #059669)',
  'linear-gradient(135deg, #a78bfa, #6d28d9)',
  'linear-gradient(135deg, #fbbf24, #d97706)',
  'linear-gradient(135deg, #60a5fa, #1d4ed8)',
  'linear-gradient(135deg, #f472b6, #be185d)',
  'linear-gradient(135deg, #2dd4bf, #0f766e)',
  'linear-gradient(135deg, #fb923c, #c2410c)',
  'linear-gradient(135deg, #94a3b8, #475569)',
] as const;

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

export interface ImgProps {
  /** 图片 id(defaults.json 中 cover/avatar/images 存的值) */
  id: string;
  className?: string;
  alt?: string;
}

/**
 * 统一图片组件:有 PNG 用 PNG;缺图渲染「渐变色块 + 首字」占位。
 * 占位渐变按 id 哈希确定,同一 id 视觉稳定。
 */
export function Img({ id, className, alt }: ImgProps): React.ReactElement {
  const url = imgUrl(id);
  const label = alt ?? id;
  if (url) {
    return React.createElement('img', {
      src: url,
      className,
      alt: label,
      draggable: false,
    });
  }
  const gradient = GRADIENTS[hashId(id) % GRADIENTS.length];
  const firstChar = label.trim().charAt(0).toUpperCase() || '·';
  return React.createElement(
    'div',
    {
      className,
      role: 'img',
      'aria-label': label,
      style: {
        background: gradient,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        color: 'rgba(255,255,255,0.9)',
        userSelect: 'none',
      },
    },
    React.createElement('span', { style: { fontSize: '1em', fontWeight: 600, lineHeight: 1 } }, firstChar),
  );
}
