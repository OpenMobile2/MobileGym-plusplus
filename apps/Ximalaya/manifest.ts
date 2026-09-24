import type { AppManifest } from '@/os/types/manifest';
import { IcLauncher } from './res/icons';

export const manifest: AppManifest = {
  id: 'ximalaya',
  packageName: 'com.ximalaya.ting.android',
  displayName: '喜马拉雅',
  displayNameEn: 'Ximalaya',
  aliases: ['喜马拉雅FM', '听书', 'ximalaya', 'xmly', '听'],
  version: '1.0.0',
  versionCode: 1,
  type: 'plugin',
  icon: IcLauncher,
  iconBackground: '#FE4543',
  iconForeground: '#FFFFFF',
  designViewportWidth: 360,
  theme: {
    colors: {
      primary: '#FE4543',
      primaryDark: '#F5352E',
      background: '#F5F5F5',
      surface: '#FFFFFF',
      textPrimary: '#333333',
      textSecondary: '#999999',
      border: '#EEEEEE',
      statusBarForeground: 'dark',
      navigationBarForeground: 'dark',
    },
  },
  intentFilters: [],
};
