import type { AppManifest } from '@/os/types/manifest';
import { IcLauncher } from './res/icons';

export const manifest: AppManifest = {
  id: 'kapi',
  packageName: 'com.kapi.bookkeeping',
  displayName: '卡皮记账',
  displayNameEn: 'Kapi',
  aliases: ['卡皮', '记账', '记一笔', 'bookkeeping'],
  version: '1.0.0',
  versionCode: 1,
  type: 'plugin',
  icon: IcLauncher,
  iconBackground: '#4B6EF5',
  iconForeground: '#FFFFFF',
  designViewportWidth: 360,
  theme: {
    colors: {
      primary: '#4B6EF5',
      background: '#EEF1F9',
      surface: '#FFFFFF',
      textPrimary: '#1A1D26',
      textSecondary: '#8A92A6',
      border: '#EDEFF4',
      statusBarForeground: 'dark',
      navigationBarForeground: 'dark',
    },
    colorsDark: {
      primary: '#6B8AFF',
      background: '#12141A',
      surface: '#1C1F2A',
      textPrimary: '#F2F4F8',
      textSecondary: '#9AA3B5',
      border: '#2A3040',
      statusBarForeground: 'light',
      navigationBarForeground: 'light',
    },
  },
  intentFilters: [],
  queries: [
    { action: 'ACTION_SEND', type: 'text/plain' },
    { action: 'ACTION_SEND', type: 'image/*' },
    { action: 'ACTION_PICK', type: 'image/*' },
  ],
};
