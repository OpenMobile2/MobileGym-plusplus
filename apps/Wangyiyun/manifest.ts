import type { AppManifest } from '@/os/types/manifest';

/**
 * 图标:网易云红底白色播放态波纹(design-tokens.md §1;主红 #E84849,取自锚点 212/213)
 */
const IcLauncher = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="%23E84849"/>
  <circle cx="50" cy="50" r="30" fill="none" stroke="white" stroke-width="6"/>
  <circle cx="50" cy="50" r="9" fill="white"/>
  <path d="M50 20 A30 30 0 0 1 80 50" fill="none" stroke="white" stroke-width="6" stroke-linecap="round" opacity="0.55"/>
</svg>`;

export const manifest: AppManifest = {
  id: 'wangyiyun',
  packageName: 'com.netease.cloudmusic',
  displayName: '网易云音乐',
  displayNameEn: 'NetEase Music',
  aliases: ['网易云', '云音乐', 'netease', 'cloudmusic'],
  version: '1.0.0',
  versionCode: 1,
  type: 'plugin',
  icon: IcLauncher,
  iconBackground: '#E84849',
  iconForeground: '#FFFFFF',
  designViewportWidth: 360,
  theme: {
    colors: {
      // 取色来源:docs/wangyiyun-replication/design-tokens.md
      primary: '#E84849',
      primaryDark: '#DD3A3A',
      background: '#F2F6F9',
      surface: '#FFFFFF',
      textPrimary: '#1A1A1A',
      textSecondary: '#8A8A8F',
      border: '#EFEFF1',
      statusBarForeground: 'dark',
      navigationBarForeground: 'dark',
    },
  },
  intentFilters: [],
};
