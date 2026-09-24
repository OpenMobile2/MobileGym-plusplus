import type { AppManifest } from '@/os/types/manifest';
import { IcLauncher } from './res/icons';

export const manifest: AppManifest = {
  id: 'flomo',
  packageName: 'com.flomo.app',
  displayName: 'flomo',
  displayNameEn: 'flomo',
  aliases: ['浮墨', '浮墨笔记', 'flomo', '卡片笔记'],
  version: '1.0.0',
  versionCode: 1,
  type: 'plugin',
  icon: IcLauncher,
  iconBackground: '#33B679',
  iconForeground: '#FFFFFF',
  designViewportWidth: 360,
  theme: {
    colors: {
      // 默认浅色(用户确认);深色由偏好设置内开关切换
      primary: '#33B679',
      background: '#F7F8FA',
      surface: '#FFFFFF',
      textPrimary: '#1A1A1A',
      textSecondary: '#8A8F99',
      border: '#ECECEC',
      statusBarForeground: 'dark',
      navigationBarForeground: 'dark',
    },
  },
  intentFilters: [],
};
