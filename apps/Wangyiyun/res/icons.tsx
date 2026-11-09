import React from 'react';

type P = { size?: number; className?: string; style?: React.CSSProperties; fill?: string };
const S = (size = 24, className?: string, style?: React.CSSProperties) => ({
  width: size, height: size, viewBox: '0 0 24 24', className, style,
  fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
});

export const IcBack = ({ size, className, style }: P) => (
  <svg {...S(size, className, style)}><path d="M15 18l-6-6 6-6" /></svg>
);
export const IcChevronDown = ({ size, className, style }: P) => (
  <svg {...S(size, className, style)}><path d="M6 9l6 6 6-6" /></svg>
);
export const IcChevronRight = ({ size, className, style }: P) => (
  <svg {...S(size, className, style)}><path d="M9 6l6 6-6 6" /></svg>
);
export const IcMenu = ({ size, className, style }: P) => (
  <svg {...S(size, className, style)}><path d="M3 6h18M3 12h18M3 18h18" /></svg>
);
export const IcSearch = ({ size, className, style }: P) => (
  <svg {...S(size, className, style)}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
);
export const IcHomeTab = ({ size, className, style }: P) => (
  <svg {...S(size, className, style)}><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></svg>
);
export const IcNotesTab = ({ size, className, style, fill }: P) => (
  <svg {...S(size, className, style)} fill={fill || 'none'}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /></svg>
);
export const IcMineTab = ({ size, className, style }: P) => (
  <svg {...S(size, className, style)}><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></svg>
);
export const IcPlay = ({ size, className, style, fill }: P) => (
  <svg width={size || 24} height={size || 24} viewBox="0 0 24 24" className={className} style={style} fill={fill || 'currentColor'}><path d="M7 4v16l13-8z" /></svg>
);
export const IcPause = ({ size, className, style, fill }: P) => (
  <svg width={size || 24} height={size || 24} viewBox="0 0 24 24" className={className} style={style} fill={fill || 'currentColor'}><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
);
export const IcPrev = ({ size, className, style, fill }: P) => (
  <svg width={size || 24} height={size || 24} viewBox="0 0 24 24" className={className} style={style} fill={fill || 'currentColor'}><path d="M6 5v14h2V5zM20 5l-10 7 10 7z" /></svg>
);
export const IcNext = ({ size, className, style, fill }: P) => (
  <svg width={size || 24} height={size || 24} viewBox="0 0 24 24" className={className} style={style} fill={fill || 'currentColor'}><path d="M16 5v14h2V5zM4 5l10 7-10 7z" /></svg>
);
export const IcHeart = ({ size, className, style, fill }: P) => (
  <svg width={size || 24} height={size || 24} viewBox="0 0 24 24" className={className} style={style} fill={fill || 'none'} stroke="currentColor" strokeWidth={2}><path d="M12 21s-7-4.5-9.5-8.5C1 9 3 5.5 6.5 5.5 9 5.5 12 8 12 8s3-2.5 5.5-2.5C21 5.5 23 9 21.5 12.5 19 16.5 12 21 12 21z" /></svg>
);
export const IcComment = ({ size, className, style }: P) => (
  <svg {...S(size, className, style)}><path d="M21 11.5a8.5 8.5 0 01-12 7.7L3 21l1.8-6A8.5 8.5 0 1121 11.5z" /></svg>
);
export const IcQueue = ({ size, className, style }: P) => (
  <svg {...S(size, className, style)}><path d="M4 7h11M4 12h11M4 17h7M18 7v10l3-2" /></svg>
);
export const IcMore = ({ size, className, style }: P) => (
  <svg width={size || 24} height={size || 24} viewBox="0 0 24 24" className={className} style={style} fill="currentColor"><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></svg>
);
export const IcShuffle = ({ size, className, style }: P) => (
  <svg {...S(size, className, style)}><path d="M16 3h5v5M4 20l17-17M21 16v5h-5M15 15l6 6M4 4l5 5" /></svg>
);
export const IcLoop = ({ size, className, style }: P) => (
  <svg {...S(size, className, style)}><path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 014-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 01-4 4H3" /></svg>
);
export const IcLoopOne = ({ size, className, style }: P) => (
  <svg width={size || 24} height={size || 24} viewBox="0 0 24 24" className={className} style={style} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 014-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 01-4 4H3" /><text x="12" y="15" fontSize="8" fill="currentColor" stroke="none" textAnchor="middle">1</text></svg>
);
export const IcOrder = ({ size, className, style }: P) => (
  <svg {...S(size, className, style)}><path d="M3 6h13M3 12h13M3 18h9M18 15l3 3-3 3" /></svg>
);
export const IcMic = ({ size, className, style }: P) => (
  <svg {...S(size, className, style)}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M6 11a6 6 0 0012 0M12 17v4" /></svg>
);
export const IcPlus = ({ size, className, style }: P) => (
  <svg {...S(size, className, style)}><path d="M12 5v14M5 12h14" /></svg>
);
export const IcCheck = ({ size, className, style }: P) => (
  <svg {...S(size, className, style)}><path d="M20 6L9 17l-5-5" /></svg>
);
export const IcTrash = ({ size, className, style }: P) => (
  <svg {...S(size, className, style)}><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>
);
export const IcShare = ({ size, className, style }: P) => (
  <svg {...S(size, className, style)}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" /></svg>
);
export const IcDownload = ({ size, className, style }: P) => (
  <svg {...S(size, className, style)}><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></svg>
);
export const IcInfo = ({ size, className, style }: P) => (
  <svg {...S(size, className, style)}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>
);
export const IcBulb = ({ size, className, style }: P) => (
  <svg {...S(size, className, style)}><path d="M9 18h6M10 21h4M12 3a6 6 0 00-4 10c1 1 1 2 1 3h6c0-1 0-2 1-3a6 6 0 00-4-10z" /></svg>
);
export const IcCast = ({ size, className, style }: P) => (
  <svg {...S(size, className, style)}><path d="M3 6h18v12h-6" /><path d="M3 12a6 6 0 016 6M3 16a2 2 0 012 2" /></svg>
);
export const IcClose = ({ size, className, style }: P) => (
  <svg {...S(size, className, style)}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const IcSettings = ({ size, className, style }: P) => (
  <svg {...S(size, className, style)}><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 00-.1-1l2-1.5-2-3.5-2.4 1a7 7 0 00-1.7-1l-.4-2.5h-4l-.4 2.5a7 7 0 00-1.7 1l-2.4-1-2 3.5 2 1.5a7 7 0 000 2l-2 1.5 2 3.5 2.4-1a7 7 0 001.7 1l.4 2.5h4l.4-2.5a7 7 0 001.7-1l2.4 1 2-3.5-2-1.5a7 7 0 00.1-1z" /></svg>
);
export const IcCamera = ({ size, className, style }: P) => (
  <svg {...S(size, className, style)}><rect x="3" y="7" width="18" height="13" rx="2" /><circle cx="12" cy="13" r="3.5" /><path d="M8 7l1.5-3h5L16 7" /></svg>
);
