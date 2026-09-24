import React from 'react';
import type { IconProps } from '@/os/types/res';

/**
 * Launcher 图标字形 —— 优酷 logo 意象:不闭合圆环包裹实心播放三角,白色玻璃字形,透明底。
 * 底色瓦片由 OS 用 manifest.iconBackground(优酷蓝 #0C7BFF)绘制;
 * 此处只画透明底字形并充满 viewBox(OS 缩放到瓦片 55% 居中),避免图标套图标。
 */
export const LauncherIcon: React.FC<IconProps> = ({ size = 96 }) => (
  <svg width={size} height={size} viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 不闭合圆环:右上开口(用大弧线描边) */}
    <path
      d="M69 13.5A41 41 0 1 0 86.5 39"
      stroke="#FFFFFF"
      strokeWidth="11"
      strokeLinecap="round"
      fill="none"
    />
    {/* 开口端小圆点(优酷环端点) */}
    <circle cx="70" cy="12.5" r="6" fill="#FFFFFF" />
    {/* 实心播放三角(圆角) */}
    <path
      d="M39 31.5c0-3.6 3.9-5.8 7-3.9l24.4 15c3 1.8 3 6.1 0 7.9L46 65.4c-3.1 1.9-7-0.3-7-3.9v-30Z"
      fill="#FFFFFF"
    />
  </svg>
);
