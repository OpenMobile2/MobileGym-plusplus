import React from 'react';
import type { IconProps } from '@/os/types/res';

/**
 * Launcher 图标字形 —— 白色圆润小鸟机器人头(菜鸟吉祥物风格),透明底。
 * 底色瓦片由 OS 用 manifest.iconBackground(品牌蓝 #1677FF)绘制;
 * 此处只画字形并充满 viewBox(OS 缩放到瓦片 55% 居中),避免图标套图标。
 */
export const LauncherIcon: React.FC<IconProps> = ({ size = 96 }) => (
  <svg width={size} height={size} viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 头部主体:白色圆角胶囊 */}
    <path
      d="M48 8C70 8 86 24 86 46c0 20-14 36-34 40l-8 2-8-2C16 82 10 66 10 46 10 24 26 8 48 8Z"
      fill="#FFFFFF"
    />
    {/* 面屏:深色圆角矩形 */}
    <rect x="22" y="28" width="52" height="34" rx="17" fill="#12233D" />
    {/* 微笑弧线(蓝青色) */}
    <path
      d="M34 44c4 7 10 10 14 10s10-3 14-10"
      stroke="#4ED6E8"
      strokeWidth="6"
      strokeLinecap="round"
      fill="none"
    />
    {/* 头顶小天线 */}
    <circle cx="48" cy="6" r="4" fill="#FFFFFF" />
  </svg>
);
