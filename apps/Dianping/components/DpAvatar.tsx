import React, { useId } from 'react';
import { avatar2Url, AVATAR2_COUNT } from '../assets';

/** 非真人头像:确定性渐变彩底 + 白色美食图形,替代半身像照片。多样化配色+图形 */
const BG: [string, string][] = [
  ['#FF9A6B', '#FF6B4A'],
  ['#66D6A6', '#2FB584'],
  ['#7EA8F0', '#4E7BE0'],
  ['#F58AB6', '#E85C97'],
  ['#C39BF0', '#9A6EE0'],
  ['#FFD36B', '#F5B32F'],
  ['#66C9D6', '#2F9FB5'],
  ['#FF8A8A', '#E85C5C'],
  ['#8FCF6F', '#5FA83F'],
  ['#F0A66B', '#D97A3F'],
];

const GLYPHS: React.ReactNode[] = [
  // 苹果
  <path key="apple" d="M24 18c-1.5-2-4-2.4-6 .6-2-3-4.5-2.6-6-.6-2 2.7-1 8 2.5 10 1.5.9 2.5.9 3.5 0 3.5-2 4.5-7.3 2.5-10Zm-6-2c.3-1.6 1.6-2.7 3-2.8" fill="#fff" />,
  // 梨
  <path key="pear" d="M22 15.5c-.6.9-1.5 1.4-1.8 2.5-.4 1.6-2.2 2.3-2.2 5 0 2.6 1.9 4.2 4 4.2s4-1.6 4-4.2c0-2.7-1.8-3.4-2.2-5-.3-1.1-1.2-1.6-1.8-2.5Z" fill="#fff" />,
  // 星
  <path key="star" d="m21 13 2.3 4.7 5.2.8-3.8 3.6.9 5.1L21 24.8l-4.6 2.4.9-5.1-3.8-3.6 5.2-.8L21 13Z" fill="#fff" />,
  // 咖啡杯
  <g key="coffee" fill="#fff">
    <path d="M13 15h11v5a4 4 0 0 1-4 4h-3a4 4 0 0 1-4-4v-5Z" />
    <path d="M24 16.5h1.6a2 2 0 0 1 0 4H24" fill="none" stroke="#fff" strokeWidth="1.6" />
    <rect x="14" y="26" width="9" height="1.6" rx="0.8" />
  </g>,
  // 蛋糕
  <g key="cake" fill="#fff">
    <path d="M13 21h16v6a1 1 0 0 1-1 1H14a1 1 0 0 1-1-1v-6Z" />
    <path d="M14 21c0-1.6 1.3-2.5 3.5-2.5S21 21 21 21s0-2.5 3.5-2.5S28 19.4 28 21" fill="none" stroke="#fff" strokeWidth="1.5" />
    <path d="M21 13v3" stroke="#fff" strokeWidth="1.4" />
    <circle cx="21" cy="12.5" r="1" />
  </g>,
  // 波波奶茶
  <g key="boba" fill="#fff">
    <path d="M15 15h12l-1 12a2 2 0 0 1-2 1.8h-6A2 2 0 0 1 16 27L15 15Z" />
    <rect x="14" y="13.5" width="14" height="2" rx="1" />
    <circle cx="19" cy="25" r="1.1" fill="#E0A060" />
    <circle cx="22.5" cy="26" r="1.1" fill="#E0A060" />
    <circle cx="24" cy="23" r="1.1" fill="#E0A060" />
  </g>,
  // 爱心
  <path key="heart" d="M21 28s-7-4.4-7-9.2A3.9 3.9 0 0 1 21 15.4a3.9 3.9 0 0 1 7 3.4C28 23.6 21 28 21 28Z" fill="#fff" />,
  // 甜甜圈
  <g key="donut">
    <circle cx="21" cy="21" r="7.5" fill="#fff" />
    <circle cx="21" cy="21" r="2.6" fill="#F0A050" />
  </g>,
];

function hash(seed: string | number): number {
  const str = String(seed);
  let h = 5;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

export function DpAvatar({ seed, size = 32, className }: { seed: string | number; size?: number; className?: string }) {
  const uid = useId();
  const h = hash(seed);
  // 优先用生成的卡通头像;缺图时回退到 SVG
  const imgUrl = avatar2Url(h % AVATAR2_COUNT);
  if (imgUrl) {
    return (
      <img
        src={imgUrl}
        alt=""
        width={size}
        height={size}
        className={`rounded-full object-cover ${className ?? ''}`}
        style={{ width: size, height: size }}
      />
    );
  }
  const [c1, c2] = BG[h % BG.length];
  const glyph = GLYPHS[(h >> 3) % GLYPHS.length];
  const gid = `dpav${uid.replace(/:/g, '')}`;
  return (
    <svg width={size} height={size} viewBox="0 0 42 42" className={className} aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c1} />
          <stop offset="1" stopColor={c2} />
        </linearGradient>
      </defs>
      <circle cx="21" cy="21" r="21" fill={`url(#${gid})`} />
      {glyph}
    </svg>
  );
}
