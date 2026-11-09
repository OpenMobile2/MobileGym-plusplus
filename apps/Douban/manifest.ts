import type { AppManifest } from '@/os/types/manifest';
import { IcLauncher } from './res/icons';

export const manifest: AppManifest = {
  id: 'douban',
  packageName: 'com.douban.frodo',
  displayName: '豆瓣',
  displayNameEn: 'Douban',
  aliases: ['豆瓣', 'douban', '豆瓣App'],
  version: '1.0.0',
  versionCode: 1,
  type: 'plugin',
  icon: IcLauncher,
  iconBackground: '#00B51D',
  iconForeground: '#FFFFFF',
  designViewportWidth: 360,
  theme: {
    colors: {
      primary: '#00B51D',
      background: '#F7F7F7',
      surface: '#FFFFFF',
      textPrimary: '#1A1A1A',
      textSecondary: '#8A8F99',
      border: '#EDEDED',
      statusBarForeground: 'dark',
      navigationBarForeground: 'dark',
    },
    colorsDark: {
      primary: '#00B51D',
      background: '#121212',
      surface: '#1C1C1E',
      textPrimary: '#F2F2F7',
      textSecondary: '#8E8E93',
      border: '#2C2C2E',
      statusBarForeground: 'light',
      navigationBarForeground: 'light',
    },
  },
  intentFilters: [],
  queries: [
    { action: 'com.mobilegym.SHARE', type: 'text/plain' },
    { action: 'com.mobilegym.PICK_IMAGE', type: 'image/*' },
    { action: 'com.mobilegym.PAY' },
  ],
};
