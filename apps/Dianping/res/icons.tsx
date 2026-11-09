import React from 'react';

type IconProps = { size?: number; className?: string };

function Svg({
  size = 24,
  className,
  children,
  viewBox = '0 0 24 24',
}: IconProps & { children: React.ReactNode; viewBox?: string }) {
  return (
    <svg width={size} height={size} viewBox={viewBox} fill="none" className={className} aria-hidden>
      {children}
    </svg>
  );
}

/** 首页选中: 橙铃铛(真机) */
export function IcTabHome({ size = 22, className }: IconProps) {
  return (
    <Svg size={size} className={className} viewBox="0 0 24 24">
      <path
        d="M6 9.5a6 6 0 1 1 12 0v3.2l1.4 2.1a1 1 0 0 1-.85 1.55H5.45a1 1 0 0 1-.85-1.55L6 12.7V9.5Z"
        fill="currentColor"
      />
      <path d="M10 18.2a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

/** 真机地图 Tab: 折叠地图 */
export function IcTabMap({ size = 22, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path
        d="M4.5 7.2 9.2 5.5l5.3 2.1L19.5 5.8v11.5l-5 1.8-5.3-2.1L4.5 18.8V7.2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M9.2 5.5v11.7M14.5 7.6v11.5" stroke="currentColor" strokeWidth="1.5" />
    </Svg>
  );
}

export function IcTabMsg({ size = 22, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path
        d="M5 6.5h14a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5H9.2L5.5 19.5V8A1.5 1.5 0 0 1 5 6.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IcTabMine({ size = 22, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5.5 19c1.4-3.2 3.6-4.8 6.5-4.8S16.1 15.8 17.5 19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** 打卡中心钮内: 白定位针 */
export function IcCheckinPin({ size = 16, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path d="M12 20s6-4.6 6-9.5a6 6 0 1 0-12 0C6 15.4 12 20 12 20Z" fill="currentColor" />
      <circle cx="12" cy="10.5" r="2" fill="#FF6633" />
    </Svg>
  );
}

export function IcSearch({ size = 18, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <circle cx="11" cy="11" r="6.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M15.8 15.8 20 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function IcScan({ size = 18, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path
        d="M7 5H5.5A1.5 1.5 0 0 0 4 6.5V8M17 5h1.5A1.5 1.5 0 0 1 20 6.5V8M7 19H5.5A1.5 1.5 0 0 1 4 17.5V16M17 19h1.5a1.5 1.5 0 0 0 1.5-1.5V16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path d="M6 12h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </Svg>
  );
}

export function IcBack({ size = 22, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path d="M15 5 8 12l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IcClose({ size = 20, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function IcStar({ size = 12, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path
        d="M12 2.8l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.1 6.8 18.8l1-5.8L3.6 8.9l5.8-.8L12 2.8Z"
        fill="currentColor"
      />
    </Svg>
  );
}

export function IcStarOutline({ size = 18, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path
        d="M12 3.2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.5 7.2 18.1l.9-5.4L4.2 8.9l5.4-.8L12 3.2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IcHeart({ size = 18, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path
        d="M12 20s-7-4.4-7-9.2A3.9 3.9 0 0 1 12 7.4a3.9 3.9 0 0 1 7 3.4C19 15.6 12 20 12 20Z"
        fill="currentColor"
      />
    </Svg>
  );
}

export function IcShare({ size = 18, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path d="M12 3v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 7l4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M5 13v5.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function IcMore({ size = 18, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <circle cx="6" cy="12" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="18" cy="12" r="1.5" fill="currentColor" />
    </Svg>
  );
}

export function IcCamera({ size = 14, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <rect x="3" y="7" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="13" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 7 10.2 5h3.6L15 7" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </Svg>
  );
}

export function IcPhone({ size = 16, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path
        d="M7 4.5h3l1 3-2 1.5a10 10 0 0 0 4.5 4.5l1.5-2 3 1v3A1.5 1.5 0 0 1 16.5 17 12.5 12.5 0 0 1 4 4.5 1.5 1.5 0 0 1 5.5 3H7Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IcTaxi({ size = 16, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path d="M5 11h14l-1.2-3.2A2 2 0 0 0 15.9 6H8.1a2 2 0 0 0-1.9 1.8L5 11Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 11h16v5H4z" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="7.5" cy="16" r="1.2" fill="currentColor" />
      <circle cx="16.5" cy="16" r="1.2" fill="currentColor" />
    </Svg>
  );
}

export function IcMapMini({ size = 16, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path
        d="M4 7.5 9 5l6 2.5L20 5v12.5L15 20l-6-2.5L4 20V7.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IcQueue({ size = 16, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path d="M7 7h10M7 12h10M7 17h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </Svg>
  );
}

export function IcThumbs({ size = 18, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path
        d="M8 10V19H5.5A1.5 1.5 0 0 1 4 17.5v-6A1.5 1.5 0 0 1 5.5 10H8Zm0 0 2.2-4.4A1.8 1.8 0 0 1 11.8 4.5H12a1.5 1.5 0 0 1 1.5 1.7L13 10h5.2a2 2 0 0 1 1.95 2.4l-1.1 5.2A2.5 2.5 0 0 1 16.6 19H8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IcSettings({ size = 20, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      {/* 标准 8 齿齿轮外廓 + 中心圆孔 */}
      <path
        d="M10.6 2.6h2.8l.5 2.2c.55.17 1.07.4 1.55.68l1.96-1.16 1.98 1.98-1.16 1.96c.28.48.51 1 .68 1.55l2.2.5v2.8l-2.2.5c-.17.55-.4 1.07-.68 1.55l1.16 1.96-1.98 1.98-1.96-1.16c-.48.28-1 .51-1.55.68l-.5 2.2h-2.8l-.5-2.2a6.8 6.8 0 0 1-1.55-.68l-1.96 1.16-1.98-1.98 1.16-1.96a6.8 6.8 0 0 1-.68-1.55l-2.2-.5v-2.8l2.2-.5c.17-.55.4-1.07.68-1.55L4.31 6.28 6.29 4.3l1.96 1.16c.48-.28 1-.51 1.55-.68l.5-2.2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" fill="none" />
    </Svg>
  );
}

/** 梨形头像(默认用户头像,绿底白梨,对齐原图水果头像) */
export function IcPear({ size = 40, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} aria-hidden>
      <circle cx="24" cy="24" r="24" fill="#AFC98F" />
      <path d="M25.5 15c.4-1.6 1.7-2.8 3.3-2.9-.2 1.7-1.4 3-3 3.2" fill="#7BA05B" />
      <path
        d="M24 15.5c-1.2 0-2.2.9-2.5 2.1-.2.9-.9 1.5-1.6 2.2-1.9 1.8-3.1 4-3.1 6.6 0 4 3.2 7.1 7.2 7.1s7.2-3.1 7.2-7.1c0-2.6-1.2-4.8-3.1-6.6-.7-.7-1.4-1.3-1.6-2.2-.3-1.2-1.3-2.1-2.5-2.1Z"
        fill="#F4F1E4"
      />
      <circle cx="24" cy="26" r="1.4" fill="#C9B88A" opacity="0.5" />
    </svg>
  );
}

export function IcHeadset({ size = 20, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path d="M5 13v-1a7 7 0 0 1 14 0v1" stroke="currentColor" strokeWidth="1.6" />
      <rect x="3.5" y="12" width="3.5" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
      <rect x="17" y="12" width="3.5" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
    </Svg>
  );
}

export function IcClock({ size = 16, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 8v4.5l3 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

export function IcChevronDown({ size = 12, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path d="M5 8l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IcChevronRight({ size = 12, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IcOrder({ size = 20, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <rect x="6" y="3.5" width="12" height="17" rx="1.6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 8h6M9 11.5h6M9 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function IcTicket({ size = 20, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path
        d="M4 8.5A1.5 1.5 0 0 1 5.5 7h13A1.5 1.5 0 0 1 20 8.5v1a2 2 0 0 0 0 4v1a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 14.5v-1a2 2 0 0 0 0-4v-1Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M13 7.5v9" stroke="currentColor" strokeWidth="1.4" strokeDasharray="1.6 1.6" />
    </Svg>
  );
}

export function IcWallet({ size = 20, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <rect x="4" y="6.5" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 10h16" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="16.5" cy="14" r="1.2" fill="currentColor" />
    </Svg>
  );
}

export function IcPen({ size = 20, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path
        d="M14.5 5.5l4 4L9 19l-4.5 1L5.5 15.5 14.5 5.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M13 7l4 4" stroke="currentColor" strokeWidth="1.6" />
    </Svg>
  );
}

export function IcDoc({ size = 20, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path
        d="M7 3.5h6l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 6 19V5A1.5 1.5 0 0 1 7 3.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M13 3.5V8h4M9 12h6M9 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function IcComment({ size = 20, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path
        d="M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v8A1.5 1.5 0 0 1 18.5 16H9l-4 3v-3H5.5A1.5 1.5 0 0 1 4 14.5v-8Z"
        fill="currentColor"
      />
    </Svg>
  );
}

export function IcPersonAdd({ size = 20, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <circle cx="10" cy="8" r="3.2" fill="currentColor" />
      <path d="M4 19c1.2-3 3.2-4.5 6-4.5 1.2 0 2.3.3 3.2.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M17.5 13.5v5M15 16h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function IcBroom({ size = 18, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      {/* 实心扫帚:柄 + 绑带 + 锯齿帚束 */}
      <rect x="11.2" y="2.8" width="1.6" height="9" rx="0.8" fill="currentColor" />
      <rect x="8.4" y="11.2" width="7.2" height="1.9" rx="0.5" fill="currentColor" />
      <path
        d="M8.7 13.6h6.6l.7 5.4-1-.95-.9.95-.9-.95-.9.95-.9-.95-.9.95-.9-.95-.9.95.8-5.4Z"
        fill="currentColor"
      />
    </Svg>
  );
}

export function IcTrash({ size = 18, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path d="M4 7h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M6 7l.9 11.2A1.6 1.6 0 0 0 8.5 20h7a1.6 1.6 0 0 0 1.6-1.8L18 7" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M10 11v5M14 11v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function IcFlag({ size = 20, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path d="M6 4v16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6 5h10l-2 3 2 3H6V5Z" fill="currentColor" />
    </Svg>
  );
}

export function IcLocateFixed({ size = 20, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </Svg>
  );
}

export function IcTrophy({ size = 20, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path d="M7 4h10v3a5 5 0 0 1-10 0V4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M7 5H4.5v1.5A3 3 0 0 0 7 9.4M17 5h2.5v1.5A3 3 0 0 1 17 9.4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 12v4M9 20h6M10 16h4l.5 4h-5l.5-4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </Svg>
  );
}

export const IcCheckinPlus = IcCheckinPin;

export const ICON_REGISTRY = {
  IcTabHome,
  IcTabMap,
  IcTabMsg,
  IcTabMine,
  IcCheckinPin,
  IcCheckinPlus,
  IcSearch,
  IcScan,
  IcBack,
  IcClose,
  IcStar,
  IcStarOutline,
  IcHeart,
  IcShare,
  IcMore,
  IcCamera,
  IcPhone,
  IcTaxi,
  IcMapMini,
  IcQueue,
  IcThumbs,
  IcSettings,
  IcHeadset,
  IcClock,
  IcChevronDown,
  IcChevronRight,
  IcOrder,
  IcTicket,
  IcWallet,
  IcPen,
  IcDoc,
  IcComment,
  IcPersonAdd,
  IcBroom,
  IcTrash,
  IcFlag,
  IcLocateFixed,
  IcTrophy,
  IcPear,
} as const;
