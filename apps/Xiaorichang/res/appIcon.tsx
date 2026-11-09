import React from 'react';

/**
 * 桌面图标字形。OS 把组件图标画成「底色瓦片 + 55% 居中字形」,
 * 故底色交给 manifest.iconBackground,这里只画透明底的字形,避免图标套图标。
 * 字形取自 App 的核心隐喻「光芒值」——太阳。
 */
export function LauncherIcon({ size = 24, color = 'currentColor' }: { size?: number | string; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4.2" fill={color} stroke="none" />
      <path d="M12 2v2.2M12 19.8V22M4.22 4.22l1.56 1.56M18.22 18.22l1.56 1.56M2 12h2.2M19.8 12H22M4.22 19.78l1.56-1.56M18.22 5.78l1.56-1.56" />
    </svg>
  );
}
