import type { AppManifest } from '@/os/types/manifest';

const IcLauncher = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="24" fill="%2322C7CB"/>
  <path d="M15 53c14-14 29-20 43-18l17-17c3-3 9-2 10 2l-13 20 11 8c3 2 3 7 0 9l-18-2-13 22-7-2 5-23-18-9-11 14-6-4z" fill="white"/>
</svg>`;

export const manifest: AppManifest = {
  id: 'qunaer',
  packageName: 'com.Qunar',
  displayName: '去哪儿旅行',
  displayNameEn: 'Qunar Travel',
  aliases: ['去哪儿', 'Qunar', '旅行', '机票酒店火车票'],
  version: '1.0.0',
  versionCode: 1,
  type: 'plugin',
  icon: IcLauncher,
  iconBackground: '#22C7CB',
  iconForeground: '#FFFFFF',
  designViewportWidth: 360,
  theme: {
    colors: {
      primary: '#22C7CB',
      primaryDark: '#08AEB4',
      background: '#F3F6F7',
      surface: '#FFFFFF',
      textPrimary: '#202A2E',
      textSecondary: '#7A868C',
      border: '#E9EEF0',
      statusBarForeground: 'dark',
      navigationBarForeground: 'dark',
    },
  },
  intentFilters: [],
};
