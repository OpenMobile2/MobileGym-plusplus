import type { AppManifest } from '@/os/types/manifest';
import { IcLauncher } from './res/icons';

export const manifest: AppManifest = {
  id: 'meituan',
  packageName: 'com.meituan.service.mobile',
  displayName: '美团外卖',
  displayNameEn: 'Meituan',
  aliases: ['外卖', '美团', '点外卖', 'food delivery'],
  version: '1.0.0',
  versionCode: 1,
  type: 'plugin',
  icon: IcLauncher,
  iconBackground: '#FFCD00',
  iconForeground: '#000000',
  designViewportWidth: 360,
  theme: {
    colors: {
      primary: '#FF6000',
      background: '#F5F5F5',
      surface: '#FFFFFF',
      textPrimary: '#1A1A1A',
      textSecondary: '#666666',
      border: '#EEEEEE',
      statusBarForeground: 'dark',
      navigationBarForeground: 'dark',
    },
  },
  intentFilters: [],
};
