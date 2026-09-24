// apps/GoogleDrive/manifest.ts — Google 云端硬盘身份与主题
import type { AppManifest } from '@/os/types/manifest';
import { IcLauncher } from './res/icons';
import { GD } from './res/colors';

export const manifest: AppManifest = {
  id: 'googledrive',                 // appId — 也是 localStorage 键 / __SIM__.getState().apps.googledrive
  packageName: 'com.google.android.apps.docs',
  displayName: 'Google 云端硬盘',
  displayNameEn: 'Drive',
  aliases: ['云端硬盘', '谷歌云盘', 'google drive', 'drive', 'gdrive'],
  version: '1.0.0',
  versionCode: 1,
  type: 'plugin',
  icon: IcLauncher,
  iconBackground: '#FFFFFF',
  iconForeground: GD.blue,
  designViewportWidth: 360,
  theme: {
    colors: {
      primary: GD.blue,
      primaryDark: GD.blueStrong,
      background: GD.surface,
      surface: GD.surface,
      textPrimary: GD.text,
      textSecondary: GD.textSecondary,
      border: GD.divider,
      statusBarForeground: 'dark',
      navigationBarForeground: 'dark',
    },
  },
  queries: [
    { action: 'ACTION_SEND', type: 'text/plain' },
    { action: 'ACTION_PICK', type: 'image/*' },
    { action: 'ACTION_PAY', scheme: 'alipays' },
  ],
};
