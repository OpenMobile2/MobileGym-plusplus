import React from 'react';

/** 桌面启动图标:品牌青底 + 白色 BOSS 字样(呼应真机 icon),色值取自 design-tokens primary #12ADA9 */
export function LauncherIcon({ size = 48 }: { size?: number | string; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="11" fill="#12ADA9" />
      <text
        x="24"
        y="27"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="Arial, sans-serif"
        fontSize="13"
        fontWeight="900"
        fill="#FFFFFF"
      >
        BOSS
      </text>
      <rect x="12" y="33" width="24" height="3.5" rx="1.75" fill="#FFFFFF" opacity="0.9" />
    </svg>
  );
}

export default LauncherIcon;
