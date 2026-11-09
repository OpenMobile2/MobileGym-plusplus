import React from 'react';

type P = { size?: number; className?: string; color?: string; strokeWidth?: number };
const S: React.FC<P & { children: React.ReactNode; fill?: string }> = ({
  size = 24, className, color = 'currentColor', strokeWidth = 1.8, fill = 'none', children,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color}
    strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {children}
  </svg>
);

export const IcHome: React.FC<P> = (p) => <S {...p}><path d="M4 11.5 12 4l8 7.5" /><path d="M6 10v9h12v-9" /></S>;
export const IcBook: React.FC<P> = (p) => <S {...p}><path d="M5 4h10a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V4Z" /><path d="M17 4h2v16" /></S>;
export const IcTrain: React.FC<P> = (p) => <S {...p}><path d="m5 5 6 6" /><path d="m19 5-6 6" /><path d="M9 15l-4 4" /><path d="m15 15 4 4" /><circle cx="12" cy="12" r="2" /></S>;
export const IcTogether: React.FC<P> = (p) => <S {...p}><circle cx="8" cy="9" r="3" /><circle cx="16" cy="9" r="3" /><path d="M3 20c0-3 2.5-5 5-5s5 2 5 5" /><path d="M13 20c0-3 2.5-5 5-5s3 1.5 3 3" /></S>;
export const IcMall: React.FC<P> = (p) => <S {...p}><path d="M4 7h16l-1.5 12h-13L4 7Z" /><path d="M8 7a4 4 0 0 1 8 0" /></S>;

export const IcSearch: React.FC<P> = (p) => <S {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></S>;
export const IcMail: React.FC<P> = (p) => <S {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></S>;
export const IcBolt: React.FC<P> = (p) => <S {...p} fill={p.color ?? 'currentColor'} color="none"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" /></S>;
export const IcCoin: React.FC<P> = (p) => <S {...p} fill={p.color ?? '#F5A623'} color="#D98A00"><circle cx="12" cy="12" r="9" /></S>;
export const IcChevronRight: React.FC<P> = (p) => <S {...p}><path d="m9 6 6 6-6 6" /></S>;
export const IcChevronLeft: React.FC<P> = (p) => <S {...p}><path d="m15 6-6 6 6 6" /></S>;
export const IcClose: React.FC<P> = (p) => <S {...p}><path d="M6 6l12 12M18 6 6 18" /></S>;
export const IcStar: React.FC<P> = (p) => <S {...p} fill={p.color ?? 'none'}><path d="m12 3 2.9 5.9 6.1.9-4.5 4.3 1 6-5.5-2.9L6.5 20l1-6L3 9.8l6.1-.9L12 3Z" /></S>;
export const IcSpeaker: React.FC<P> = (p) => <S {...p}><path d="M4 9v6h4l5 4V5L8 9H4Z" /><path d="M16 9a4 4 0 0 1 0 6" /></S>;
export const IcCheck: React.FC<P> = (p) => <S {...p}><path d="m5 12 5 5L20 6" /></S>;
export const IcCheckCircle: React.FC<P> = (p) => <S {...p} fill={p.color ?? '#3DBE6B'} color="#fff" strokeWidth={2.4}><circle cx="12" cy="12" r="10" stroke="none" /><path d="m7 12 3.5 3.5L17 9" /></S>;
export const IcCart: React.FC<P> = (p) => <S {...p}><circle cx="9" cy="20" r="1.4" /><circle cx="17" cy="20" r="1.4" /><path d="M3 4h2l2.2 11h10L20 8H6" /></S>;
export const IcHeadset: React.FC<P> = (p) => <S {...p}><path d="M4 13a8 8 0 0 1 16 0" /><rect x="3" y="13" width="4" height="6" rx="1.5" /><rect x="17" y="13" width="4" height="6" rx="1.5" /></S>;
export const IcUser: React.FC<P> = (p) => <S {...p}><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" /></S>;
export const IcSettings: React.FC<P> = (p) => <S {...p}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></S>;
export const IcEdit: React.FC<P> = (p) => <S {...p}><path d="M4 20h4L18 10l-4-4L4 16v4Z" /><path d="m13 5 4 4" /></S>;
export const IcCamera: React.FC<P> = (p) => <S {...p}><path d="M4 8h3l2-2h6l2 2h3v11H4V8Z" /><circle cx="12" cy="13" r="3.2" /></S>;
export const IcChart: React.FC<P> = (p) => <S {...p}><path d="M4 19V5M4 19h16" /><path d="m7 15 3-4 3 3 4-6" /></S>;
export const IcPlay: React.FC<P> = (p) => <S {...p} fill={p.color ?? 'currentColor'} color="none"><path d="M7 4v16l13-8L7 4Z" /></S>;
export const IcPause: React.FC<P> = (p) => <S {...p} fill={p.color ?? 'currentColor'} color="none"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></S>;
export const IcArrowLeft: React.FC<P> = (p) => <S {...p}><path d="M20 12H4M10 6l-6 6 6 6" /></S>;
export const IcArrowRight: React.FC<P> = (p) => <S {...p}><path d="M4 12h16M14 6l6 6-6 6" /></S>;
export const IcList: React.FC<P> = (p) => <S {...p}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></S>;
export const IcBulb: React.FC<P> = (p) => <S {...p}><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3Z" /></S>;
export const IcTrash: React.FC<P> = (p) => <S {...p}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></S>;
export const IcShare: React.FC<P> = (p) => <S {...p}><path d="M12 3v12M8 7l4-4 4 4" /><path d="M5 13v6h14v-6" /></S>;
export const IcMore: React.FC<P> = (p) => <S {...p}><circle cx="5" cy="12" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="19" cy="12" r="1.4" /></S>;
export const IcTag: React.FC<P> = (p) => <S {...p}><path d="M4 4h7l9 9-7 7-9-9V4Z" /><circle cx="8" cy="8" r="1.3" /></S>;
export const IcGift: React.FC<P> = (p) => <S {...p}><rect x="4" y="9" width="16" height="11" rx="1" /><path d="M4 13h16M12 9v11" /><path d="M12 9C10 5 6 6 8 9M12 9c2-4 6-3 4 0" /></S>;

/** 品牌『斩』字形(简化笔刷),用于 Ai 工具位与首页 logo */
export const IcZhan: React.FC<P> = (p) => <S {...p} strokeWidth={2}><path d="M4 6h9M8 4v10M4 14h8" /><path d="M15 5l5 14" /></S>;
