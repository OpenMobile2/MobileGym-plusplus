import type { AppManifest } from '@/os/types/manifest';
import { PERMISSIONS } from '@/os/permissions';
import { IcLauncher } from './res/icons';

export const manifest: AppManifest = {
  id: 'bilibili2',
  packageName: 'com.bilibili.app.v2.prototype',
  displayName: '哔哩哔哩 V2',
  displayNameEn: 'Bilibili V2',
  aliases: ['b站', 'Bilibili', 'video community', 'danmaku'],
  version: '1.0.0',
  versionCode: 1,
  type: 'plugin',
  icon: IcLauncher,
  iconBackground: '#fb7299',
  iconForeground: '#ffffff',
  designViewportWidth: 360,
  theme: {
    colors: {
      primary: '#fb7299',
      primaryDark: '#d85f81',
      onPrimary: '#ffffff',
      background: '#f5f6f7',
      surface: '#ffffff',
      textPrimary: '#18191c',
      textSecondary: '#6b7280',
      border: '#e5e7eb',
      statusBarForeground: 'dark',
      navigationBarForeground: 'dark',
    },
  },
  permissions: [
    PERMISSIONS.CAMERA,
    PERMISSIONS.RECORD_AUDIO,
    PERMISSIONS.READ_EXTERNAL_STORAGE,
  ],
};
