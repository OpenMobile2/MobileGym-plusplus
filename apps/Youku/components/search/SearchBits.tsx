import React from 'react';

/**
 * 搜索模块共享展示件(无任何 transition/action 绑定,绑定一律留在页面文件内保持字面量)。
 */

// ---------------------------------------------------------------- 线性小图标(细线白/灰,design-tokens 图标风格)
type IconProps = { size?: number; className?: string };

export function IcSearch({ size = 17, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4.2-4.2" />
    </svg>
  );
}

export function IcMic({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
    </svg>
  );
}

export function IcTrash({ size = 17, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className={className}>
      <path d="M4 7h16" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export function IcRefresh({ size = 17, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}>
      <path d="M20 11a8 8 0 1 0-2.34 5.66" />
      <path d="M20 5v6h-6" />
    </svg>
  );
}

export function IcPlaySolid({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M7 4.5v15l13-7.5z" />
    </svg>
  );
}

export function IcFlame({ size = 12, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2c1 4-3 5.5-3 9a3 3 0 0 0 6 .3C16.5 13 18 14 18 16a6 6 0 1 1-12 0c0-5 5-7 6-14z" />
    </svg>
  );
}

export function IcChevronDown({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function IcChevronUp({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}>
      <path d="M6 15l6-6 6 6" />
    </svg>
  );
}

// ---------------------------------------------------------------- 海报右上权益角标
/** 帧享=金渐变深棕字;VIP/SVIP=黑透底金字;其余(独播/首播/限免中/预告/付费)=黑透底白字 */
export function PosterBadge({ text }: { text: string }) {
  if (!text) return null;
  if (text.includes('帧享')) {
    return (
      <span className="absolute right-0 top-0 rounded-bl-md rounded-tr-lg bg-gradient-to-r from-[#F0D9A0] to-[#D9B36A] px-1.5 py-0.5 text-[10px] font-semibold text-[#5C4318]">
        {text}
      </span>
    );
  }
  const gold = text === 'VIP' || text === 'SVIP';
  return (
    <span className={`absolute right-0 top-0 rounded-bl-md rounded-tr-lg bg-black/45 px-1.5 py-0.5 text-[10px] font-semibold ${gold ? 'text-[#E8C87E]' : 'text-white'}`}>
      {text}
    </span>
  );
}

// ---------------------------------------------------------------- 榜单编号:蓝三角绸带 + 斜体大数字
export function RankCorner({ index }: { index: number }) {
  const num = String(index + 1).padStart(2, '0');
  return (
    <>
      <div className="pointer-events-none absolute left-0 top-0 h-0 w-0 border-r-[46px] border-t-[46px] border-r-transparent border-t-[#0C7BFF]" />
      <span className="pointer-events-none absolute left-0.5 top-0 text-[22px] font-black italic leading-[26px] text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.45)]">
        {num}
      </span>
    </>
  );
}

// ---------------------------------------------------------------- 关键词高亮(命中片段蓝色,s229/s230)
export function Hi({ text, kw }: { text: string; kw: string }) {
  const k = kw.trim();
  const i = k ? text.indexOf(k) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span className="text-[#3D8BFF]">{k}</span>
      {text.slice(i + k.length)}
    </>
  );
}
