import React from 'react';

/** 桌面启动图标:白底 + 蓝色书本描边 + 斩字笔刷,呼应品牌蓝(design-tokens primary #2F58E8) */
export function LauncherIcon({ size = 48 }: { size?: number | string; color?: string }) {
  return (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="48" height="48" rx="11" fill="#FFFFFF" />
    <rect x="10" y="12" width="28" height="24" rx="3" fill="#2F58E8" />
    <rect x="10" y="12" width="6" height="24" rx="3" fill="#1F3FAE" />
    <path d="M20 19h12M20 24h12M20 29h8" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M31 30l6-9" stroke="#F7B733" strokeWidth="3" strokeLinecap="round" />
  </svg>
  );
}

export default LauncherIcon;
