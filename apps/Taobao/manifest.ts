import type { AppManifest } from '@/os/types/manifest';
import { IcLauncher } from './res/icons';

export const manifest: AppManifest = {
  id: 'taobao',
  packageName: 'com.taobao.taobao',
  displayName: '淘宝',
  displayNameEn: 'Taobao',
  aliases: ['淘宝网', 'tb', '网购', 'shopping'],
  version: '1.0.0',
  versionCode: 1,
  type: 'plugin',
  icon: IcLauncher,
  iconBackground: '#FF5000',
  iconForeground: '#FFFFFF',
  designViewportWidth: 360,
  theme: {
    colors: {
      primary: '#FF5000',
      background: '#F5F6F7',
      surface: '#FFFFFF',
      textPrimary: '#111111',
      textSecondary: '#666666',
      border: '#EEEEEE',
      statusBarForeground: 'dark',
      navigationBarForeground: 'dark',
    },
    colorsDark: {
      primary: '#FF6A26',
      background: '#121212',
      surface: '#1E1E1E',
      textPrimary: '#F5F5F5',
      textSecondary: '#A3A3A3',
      border: '#2A2A2A',
      statusBarForeground: 'light',
      navigationBarForeground: 'light',
    },
  },
  intentFilters: [],
  queries: [
    { action: 'ACTION_PAY', scheme: 'alipays' },
    { action: 'ACTION_SEND', type: 'text/plain' },
    { action: 'ACTION_SEND', type: 'image/*' },
  ],
};
