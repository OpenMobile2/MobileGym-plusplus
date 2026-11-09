import React from 'react';

/**
 * 商品/头像占位图。当前无生图资产 —— 直接渲染确定性 SVG(分类色 + emoji),
 * 保证视觉多样且始终可见(阶段⑤ 若批量生图,改为真实 PNG + onError 回落本 SVG)。
 */
const CATEGORY_EMOJI: Record<string, string> = {
  数码: '📷', 手机: '📱', 二次元: '🎎', 运动鞋: '👟', 图书: '📚',
  家具: '🪑', 家电: '🔌', 潮流: '🧢', 收藏: '🪙', 生活: '🏠', 闲置: '📦',
};

const PALETTE = ['#FFE9A8', '#CDE7FF', '#FFD6D6', '#D6F5DE', '#E6DCFF', '#FFE0C2', '#D8F0F0'];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function svgDataUri(seed: string, category: string, label: string): string {
  const h = hashStr(seed);
  const c1 = PALETTE[h % PALETTE.length];
  const c2 = PALETTE[(h >> 3) % PALETTE.length];
  const emoji = CATEGORY_EMOJI[category] ?? '📦';
  const short = label.slice(0, 6);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'>
<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
<stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient></defs>
<rect width='300' height='300' fill='url(#g)'/>
<text x='150' y='150' font-size='96' text-anchor='middle' dominant-baseline='central'>${emoji}</text>
<text x='150' y='250' font-size='22' fill='#00000066' text-anchor='middle' font-family='sans-serif'>${short}</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

interface Props {
  seed: string;
  /** 真实图片路径(如 /@app-assets/Xianyu/items/i1.png);缺失或 404 时回落分类 SVG */
  src?: string;
  category?: string;
  label?: string;
  className?: string;
  rounded?: boolean;
}

export function ItemImage({ seed, src, category = '闲置', label = '', className = '', rounded = false }: Props) {
  const fallback = svgDataUri(seed, category, label);
  return (
    <img
      src={src || fallback}
      alt={label}
      className={`object-cover ${rounded ? 'rounded-full' : ''} ${className}`}
      onError={(e) => {
        const el = e.currentTarget as HTMLImageElement;
        if (el.src !== fallback) el.src = fallback;
      }}
    />
  );
}

/** 头像小占位(字母 + 品牌黄) */
export function Avatar({ seed, name, size = 40, className = '' }: { seed: string; name: string; size?: number; className?: string }) {
  const h = hashStr(seed);
  const bg = PALETTE[h % PALETTE.length];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'>
<rect width='80' height='80' rx='16' fill='${bg}'/>
<text x='40' y='44' font-size='36' fill='#00000088' text-anchor='middle' dominant-baseline='central' font-family='sans-serif'>${(name || '?').slice(0, 1)}</text></svg>`;
  return (
    <img
      src={`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`}
      alt={name}
      style={{ width: size, height: size }}
      className={`rounded-lg object-cover ${className}`}
    />
  );
}
