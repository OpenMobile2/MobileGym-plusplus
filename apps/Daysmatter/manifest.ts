import type { AppManifest } from '@/os/types/manifest';
import { LauncherIcon } from './res/appIcon';

export const manifest: AppManifest = {
  id: 'daysmatter',
  packageName: 'com.idailymedia.daysmatter',
  displayName: '倒数日',
  displayNameEn: 'Days Matter',
  aliases: ['倒数日', 'daysmatter', '纪念日', '倒计时'],
  version: '5.2.0',
  versionCode: 1,
  type: 'plugin',
  icon: LauncherIcon,
  iconBackground: '#3E7CB1',
  iconForeground: '#ffffff',
  designViewportWidth: 360,
  theme: {
    colors: {
      primary: '#3E7CB1',
      primaryDark: '#2F6491',
      background: '#F2F1EC',
      surface: '#ffffff',
      textPrimary: '#1A1A1A',
      textSecondary: '#6B6B6B',
      border: '#E4E2DC',
      statusBarForeground: 'light',
      navigationBarForeground: 'dark',
    },
  },
};
