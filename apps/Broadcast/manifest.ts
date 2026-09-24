// apps/Broadcast/manifest.ts — 苹果播客身份与主题
import type { AppManifest } from '@/os/types/manifest';
import { IcLauncher } from './res/icons';

export const manifest: AppManifest = {
  id: 'broadcast',                   // appId — 唯一,也是 localStorage 键 / __SIM__.getState().apps.broadcast
  packageName: 'com.apple.podcasts',
  displayName: '播客',
  displayNameEn: 'Podcasts',
  aliases: ['苹果播客', 'apple podcasts', 'podcast'],
  version: '1.0.0',
  versionCode: 1,
  type: 'plugin',
  icon: IcLauncher,
  iconBackground: '#8E4EC6',
  iconForeground: '#ffffff',
  designViewportWidth: 360,
  theme: {
    colors: {
      primary: '#8E4EC6',            // 品牌紫:播放键/active tab/链接
      primaryDark: '#7438AE',
      background: '#FFFFFF',
      surface: '#FFFFFF',
      textPrimary: '#1C1C1E',
      textSecondary: '#8A8A8E',
      border: '#E5E5EA',
      statusBarForeground: 'dark',
      navigationBarForeground: 'dark',
    },
  },
};
