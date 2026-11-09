import type { AppManifest } from '@/os/types/manifest';

const IcLauncher = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="%23FF6633"/>
  <circle cx="50" cy="48" r="28" fill="white"/>
  <path d="M38 52c4 10 20 10 24 0" stroke="%23FF6633" stroke-width="5" fill="none" stroke-linecap="round"/>
  <circle cx="40" cy="42" r="4" fill="%23FF6633"/><circle cx="60" cy="42" r="4" fill="%23FF6633"/>
</svg>`;

export const manifest: AppManifest = {
  id: 'dianping',
  packageName: 'com.dianping.v1',
  displayName: '大众点评',
  displayNameEn: 'Dianping',
  aliases: ['点评', 'dianping', '大众点评'],
  version: '0.1.0-slice',
  versionCode: 1,
  type: 'plugin',
  icon: IcLauncher,
  iconBackground: '#FF6633',
  iconForeground: '#FFFFFF',
  designViewportWidth: 360,
  theme: {
    colors: {
      primary: '#FF6633',
      primaryDark: '#E55A2B',
      background: '#F5F5F5',
      surface: '#FFFFFF',
      textPrimary: '#222222',
      textSecondary: '#999999',
      border: '#EEEEEE',
      statusBarForeground: 'dark',
      navigationBarForeground: 'dark',
    },
    colorsDark: {
      primary: '#FF7A47',
      primaryDark: '#E55A2B',
      background: '#121212',
      surface: '#1E1E1E',
      textPrimary: '#F2F2F2',
      textSecondary: '#9A9A9A',
      border: '#2C2C2C',
      statusBarForeground: 'light',
      navigationBarForeground: 'light',
    },
  },
  intentFilters: [],
  queries: [
    { action: 'ACTION_PAY', scheme: 'alipays' },
    { action: 'ACTION_PAY', scheme: 'weixin' },
    { action: 'ACTION_SEND', type: 'text/plain' },
  ],
};
