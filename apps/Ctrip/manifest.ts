import type { AppManifest } from '@/os/types/manifest';
import { IcLauncher } from './res/icons';

export const manifest: AppManifest = {
  id: 'ctrip',
  packageName: 'com.ctrip.app',
  displayName: '携程旅行',
  displayNameEn: 'Ctrip',
  aliases: ['携程', 'ctrip', '订酒店', '订机票', '火车票', '旅行'],
  version: '1.0.0',
  versionCode: 1,
  type: 'plugin',
  icon: IcLauncher,
  iconBackground: '#0086F6',
  iconForeground: '#FFFFFF',
  designViewportWidth: 360,
  theme: {
    colors: {
      primary: '#0086F6',
      background: '#F5F6F8',
      surface: '#FFFFFF',
      textPrimary: '#111111',
      textSecondary: '#888888',
      border: '#EEEEEE',
      statusBarForeground: 'dark',
      navigationBarForeground: 'dark',
    },
  },
  intentFilters: [],
};
