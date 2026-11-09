import React from 'react';

/**
 * 苏宁易购 launcher 图标字形:白色小狮子头(真机为橙底黄狮吉祥物,简化为白色字形)。
 * 透明底、填满 viewBox;底色由 manifest.iconBackground(#FD7101)瓦片提供。
 */
export const LauncherIcon: React.FC<{ size?: number | string; className?: string }> = ({
  size = 48,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    className={className}
    aria-label="苏宁易购"
  >
    {/* 鬃毛 */}
    <circle cx="24" cy="25" r="17" fill="#FFFFFF" opacity="0.35" />
    {/* 耳朵 */}
    <circle cx="12.5" cy="14.5" r="4.5" fill="#FFFFFF" />
    <circle cx="35.5" cy="14.5" r="4.5" fill="#FFFFFF" />
    {/* 脸 */}
    <circle cx="24" cy="26" r="13" fill="#FFFFFF" />
    {/* 眼睛 */}
    <circle cx="19" cy="23.5" r="1.9" fill="#FD7101" />
    <circle cx="29" cy="23.5" r="1.9" fill="#FD7101" />
    {/* 鼻子+嘴 */}
    <path d="M24 27.2c-1.5 0-2.6 1-2.6 2.1 0 1.2 1.2 2 2.6 2s2.6-.8 2.6-2c0-1.1-1.1-2.1-2.6-2.1Z" fill="#FD7101" />
    <path d="M24 31.2v2.2M24 33.4c-.9 1.2-2.4 1.6-3.8 1M24 33.4c.9 1.2 2.4 1.6 3.8 1" stroke="#FD7101" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);
