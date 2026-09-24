import type { AppManifest } from '@/os/types/manifest';
import { IcLauncher } from './res/icons';

export const manifest: AppManifest = {
  id: 'pinduoduo',
  packageName: 'com.xunmeng.pinduoduo',
  displayName: '拼多多',
  displayNameEn: 'Pinduoduo',
  aliases: ['拼夕夕', 'pdd', '拼团', '拼多多', 'shopping'],
  version: '1.0.0',
  versionCode: 1,
  type: 'plugin',
  icon: IcLauncher,
  iconBackground: '#E22E1F',
  iconForeground: '#FFFFFF',
  designViewportWidth: 360,
  theme: {
    colors: {
      primary: '#E22E1F',
      background: '#F5F5F5',
      surface: '#FFFFFF',
      textPrimary: '#333333',
      textSecondary: '#999999',
      border: '#EEEEEE',
      statusBarForeground: 'light',
      navigationBarForeground: 'dark',
    },
  },
  intentFilters: [],
};
