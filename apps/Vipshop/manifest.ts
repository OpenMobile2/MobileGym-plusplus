import type { AppManifest } from '@/os/types/manifest';
import { IcLauncher } from './res/icons';

export const manifest: AppManifest = {
  id: 'vipshop',
  packageName: 'com.achievo.vipshop',
  displayName: '唯品会',
  displayNameEn: 'VIP.com',
  aliases: ['唯品会', 'vip', 'vipshop'],
  version: '1.0.0',
  versionCode: 1,
  type: 'plugin',
  icon: IcLauncher,
  iconBackground: '#E4007F',
  iconForeground: '#FFFFFF',
  designViewportWidth: 360,
  theme: {
    colors: {
      primary: '#E4007F',
      background: '#F5F5F5',
      surface: '#FFFFFF',
      textPrimary: '#222222',
      textSecondary: '#888888',
      border: '#EEEEEE',
      statusBarForeground: 'dark',
      navigationBarForeground: 'dark',
    },
  },
  intentFilters: [],
};
