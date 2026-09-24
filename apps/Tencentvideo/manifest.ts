import type { AppManifest } from '@/os/types/manifest';
import { PERMISSIONS } from '@/os/permissions';
import { IcLauncher } from './res/icons';

export const manifest: AppManifest = {
  id: 'tencentvideo',
  packageName: 'com.tencent.qqlive',
  displayName: '腾讯视频',
  displayNameEn: 'Tencent Video',
  aliases: ['腾讯视频', 'tencent video', '视频', 'qqlive', 'Tencent Video'],
  version: '1.0.0',
  versionCode: 1,
  type: 'plugin',
  icon: IcLauncher,
  iconBackground: '#FFFFFF',
  designViewportWidth: 360,
  theme: {
    colors: {
      // 色值取 docs/tencentvideo-replication/design-tokens.md(真机取色)
      primary: '#06BFB8',        // 品牌青绿
      accent: '#FF6510',         // 角标橙红
      background: '#FFFFFF',     // 页面背景(832/810/736)
      surface: '#FFFFFF',
      textPrimary: '#000000',
      textSecondary: '#6E6E6E',
      border: '#D2D2D4',
      tabBarBg: '#FFFFFF',
      statusBarForeground: 'dark',
      navigationBarForeground: 'dark',
    },
    colorsDark: {
      primary: '#06BFB8',
      background: '#121212',
      surface: '#1C1C1E',
      textPrimary: '#F2F2F7',
      textSecondary: '#8E8E93',
      border: '#2C2C2E',
      tabBarBg: '#1C1C1E',
      statusBarForeground: 'light',
      navigationBarForeground: 'light',
    },
  },
  intentFilters: [
    {
      action: 'ACTION_VIEW',
      scheme: 'tencentvideo',
      route: '/player/portrait',
      description: '打开分享的视频与对应集数',
    },
  ],
  permissions: [
    PERMISSIONS.READ_EXTERNAL_STORAGE,
    PERMISSIONS.WRITE_EXTERNAL_STORAGE,
  ],
  queries: [
    { action: 'com.mobilegym.PAY' },
    { action: 'com.mobilegym.SHARE', type: 'text/plain' },
    { action: 'com.mobilegym.PICK_IMAGE', type: 'image/*' },
    { action: 'ACTION_SEND', type: 'text/plain' },
    { action: 'ACTION_PAY', scheme: 'weixin' },
    { action: 'ACTION_VIEW', scheme: 'tencentvideo' },
  ],
};
