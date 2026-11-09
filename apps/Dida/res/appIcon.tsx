import React from 'react';
import type { IconProps } from '@/os/types/res';

/**
 * Launcher 图标字形 —— 蓝色圆环 + 橙黄对勾(透明底)。
 * 真机图标(dida_images/60.png)为深色圆角瓦片 + 蓝环 + 黄勾;
 * OS 用 manifest.iconBackground 画瓦片,此处只画环+勾字形,充满 viewBox。
 */
export const LauncherIcon: React.FC<IconProps> = ({ size = 96 }) => (
  <svg width={size} height={size} viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 蓝色圆环(留缺口) */}
    <path
      d="M48 16 a32 32 0 1 1 -22.6 9.4"
      stroke="#4E7EF3"
      strokeWidth="8"
      strokeLinecap="round"
      fill="none"
    />
    {/* 橙黄对勾 */}
    <path
      d="M32 50 L44 62 L70 33"
      stroke="#FFC24B"
      strokeWidth="9"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

export default LauncherIcon;
