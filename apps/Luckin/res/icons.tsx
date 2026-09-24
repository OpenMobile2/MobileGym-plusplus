import React from 'react';

type IconProps = { size?: number | string; color?: string; strokeWidth?: number | string; className?: string; fill?: string };

const Svg = ({ size = 24, className, children, viewBox = '0 0 24 24' }: IconProps & { children: React.ReactNode; viewBox?: string }) => (
  <svg width={size} height={size} viewBox={viewBox} fill="none" aria-hidden="true" className={className}>{children}</svg>
);

export const IcLauncher = ({ size = 48, className }: IconProps) => (
  <Svg size={size} className={className} viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="24" fill="#1737A3" />
    <path d="M13 32c3-10 8-16 17-17-2 3-3 6-2 9 2-2 5-3 9-2-2 9-10 15-20 13l-4-3Z" fill="white" />
    <path d="M20 14c1-3 4-5 7-6-1 3-1 5 0 7" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
    <circle cx="33" cy="16" r="2" fill="#F12B00" />
  </Svg>
);

export const IcHome = (p: IconProps) => <Svg {...p}><path d="M3 11.5 12 4l9 7.5V21h-6v-6H9v6H3v-9.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></Svg>;
export const IcMenu = (p: IconProps) => <Svg {...p}><path d="M7 3h10l1 18H6L7 3Z" stroke="currentColor" strokeWidth="1.8" /><path d="M9 8c2 2 4 2 6 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></Svg>;
export const IcBag = (p: IconProps) => <Svg {...p}><path d="M5 8h14l-1 13H6L5 8Z" stroke="currentColor" strokeWidth="1.8" /><path d="M9 9V6a3 3 0 0 1 6 0v3" stroke="currentColor" strokeWidth="1.8" /></Svg>;
export const IcCrown = (p: IconProps) => <Svg {...p}><path d="m3 7 5 4 4-7 4 7 5-4-2 12H5L3 7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></Svg>;
export const IcDeer = (p: IconProps) => <Svg {...p}><path d="M7 9 4 5m3 4 1-5m9 5 3-4m-3 4-1-5M7 12c0-4 10-4 10 0v3c0 7-10 7-10 0v-3Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><circle cx="10" cy="14" r="1" fill="currentColor" /><circle cx="14" cy="14" r="1" fill="currentColor" /></Svg>;
export const IcSearch = (p: IconProps) => <Svg {...p}><circle cx="10.5" cy="10.5" r="6" stroke="currentColor" strokeWidth="1.8" /><path d="m15 15 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></Svg>;
export const IcBack = (p: IconProps) => <Svg {...p}><path d="m15 4-8 8 8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
export const IcChevron = (p: IconProps) => <Svg {...p}><path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
export const IcPlus = (p: IconProps) => <Svg {...p}><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></Svg>;
export const IcMinus = (p: IconProps) => <Svg {...p}><path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></Svg>;
export const IcCheck = (p: IconProps) => <Svg {...p}><path d="m5 12 4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
export const IcClose = (p: IconProps) => <Svg {...p}><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></Svg>;
export const IcHeart = (p: IconProps) => <Svg {...p}><path d="M12 20S4 15 4 9a4 4 0 0 1 7-2.6A4 4 0 0 1 20 9c0 6-8 11-8 11Z" stroke="currentColor" strokeWidth="1.8" fill={p.fill ?? 'none'} /></Svg>;
export const IcPin = (p: IconProps) => <Svg {...p}><path d="M12 21s7-6 7-12A7 7 0 1 0 5 9c0 6 7 12 7 12Z" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="9" r="2.3" stroke="currentColor" strokeWidth="1.6" /></Svg>;
export const IcMessage = (p: IconProps) => <Svg {...p}><path d="M4 5h16v12H9l-5 4V5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></Svg>;
export const IcSettings = (p: IconProps) => <Svg {...p}><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" /><path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></Svg>;
export const IcCoffee = (p: IconProps) => <Svg {...p}><path d="M5 8h12v7a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5V8Z" stroke="currentColor" strokeWidth="1.8" /><path d="M17 10h2a2 2 0 0 1 0 4h-2M8 4c0 1 1 1 1 2m4-2c0 1 1 1 1 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></Svg>;
