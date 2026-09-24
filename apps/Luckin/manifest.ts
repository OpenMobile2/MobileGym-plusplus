import type { AppManifest } from '@/os/types/manifest';
import { IcLauncher } from './res/icons';

export const manifest: AppManifest = {
  id: 'luckin',
  packageName: 'com.luckin.mobilegym',
  displayName: '瑞幸咖啡',
  displayNameEn: 'Luckin Coffee',
  aliases: ['瑞幸', '咖啡', 'luckin', 'coffee'],
  version: '1.0.1',
  versionCode: 2,
  type: 'plugin',
  icon: IcLauncher,
  iconBackground: '#1737A3',
  iconForeground: '#FFFFFF',
  designViewportWidth: 360,
  theme: {
    colors: {
      primary: '#1C2E9C',
      background: '#F4F5F7',
      surface: '#FFFFFF',
      textPrimary: '#1A1A1A',
      textSecondary: '#8A8A8A',
      border: '#EEEEEE',
      statusBarForeground: 'dark',
      navigationBarForeground: 'dark',
    },
  },
  intentFilters: [],
};
