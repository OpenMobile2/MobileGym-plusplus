import type { AppManifest } from '@/os/types/manifest';
import { PERMISSIONS } from '@/os/permissions';
import { IcLauncher } from './res/icons';

export const manifest: AppManifest = {
  id: 'flomo',
  packageName: 'com.flomo.app',
  displayName: 'flomo',
  displayNameEn: 'flomo',
  aliases: ['浮墨', 'flomo'],
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
    colorsDark: {
      primary: '#33B679',
      background: '#121212',
      surface: '#1C1C1E',
      textPrimary: '#F2F2F7',
      textSecondary: '#8E8E93',
      border: '#2C2C2E',
      statusBarForeground: 'light',
      navigationBarForeground: 'light',
    },
  },
  permissions: [
    PERMISSIONS.READ_EXTERNAL_STORAGE,
    PERMISSIONS.WRITE_EXTERNAL_STORAGE,
  ],
  intentFilters: [],
  queries: [
    { action: 'com.mobilegym.SHARE', type: 'text/plain' },
    { action: 'com.mobilegym.SHARE', type: 'image/*' },
    { action: 'com.mobilegym.PICK_IMAGE', type: 'image/*' },
    { action: 'com.mobilegym.PAY' },
    { action: 'ACTION_PAY', scheme: 'alipays' },
    { action: 'ACTION_SEND', type: 'text/plain' },
    { action: 'ACTION_SEND', type: 'image/*' },
  ],
};
