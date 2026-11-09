import React from 'react';
import type { IconProps } from '@/os/types/res';

/**
 * Launcher 图标字形 —— 低多边形(low-poly)红番茄 + 绿蒂 + 右下柔和投影,透明底。
 * 底色瓦片由 OS 用 manifest.iconBackground(米白 #ECE7D3)绘制;此处只画番茄字形,
 * 充满 viewBox(OS 会缩放到瓦片 55% 居中),避免出现「图标里套图标」。
 * 参考真机图标 fanqie_todo_images/added/…_115_53.jpg。
 */
export const LauncherIcon: React.FC<IconProps> = ({ size = 96 }) => (
  <svg width={size} height={size} viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="fq-shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="3.5" />
      </filter>
    </defs>
    {/* 右下柔和投影 */}
    <ellipse cx="54" cy="62" rx="36" ry="32" fill="#00000022" filter="url(#fq-shadow)" />
    {/* 绿蒂(星形切面) */}
    <polygon points="46,4 40,26 52,26" fill="#57AC46" />
    <polygon points="24,14 47,24 41,30" fill="#3E8B34" />
    <polygon points="68,14 45,24 51,30" fill="#48A03C" />
    <polygon points="46,10 39,28 53,28" fill="#4E9E3E" />
    {/* 番茄主体:8 面切面(左上亮 → 右下暗,营造立体感) */}
    <polygon points="46,56 22,30 48,22" fill="#F27B62" />
    <polygon points="46,56 48,22 74,32" fill="#EC6248" />
    <polygon points="46,56 74,32 84,58" fill="#DB4B37" />
    <polygon points="46,56 84,58 72,84" fill="#C33C2A" />
    <polygon points="46,56 72,84 46,92" fill="#B63523" />
    <polygon points="46,56 46,92 20,82" fill="#C93E2B" />
    <polygon points="46,56 20,82 10,54" fill="#E15540" />
    <polygon points="46,56 10,54 22,30" fill="#EF6E54" />
    {/* 高光切面 */}
    <polygon points="46,56 22,30 33,26" fill="#F79178" opacity="0.85" />
  </svg>
);

export default LauncherIcon;
