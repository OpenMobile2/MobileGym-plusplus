import type { AppManifest } from '@/os/types/manifest';
import { IcLauncher } from './res/icons';

export const manifest: AppManifest = {
  id: 'xianyu',
  packageName: 'com.taobao.idlefish',
  displayName: '闲鱼',
  displayNameEn: 'Idle Fish',
  aliases: ['咸鱼', '闲鱼二手', 'idlefish', '二手', '闲置'],
  version: '1.0.0',
  versionCode: 1,
  type: 'plugin',
  icon: IcLauncher,
  iconBackground: '#FFE411',
  iconForeground: '#111111',
  designViewportWidth: 360,
  theme: {
    colors: {
      // 取色自真机截图(design-tokens.md):闲鱼黄浅色顶栏 → statusBarForeground 'dark'
      primary: '#FFE411',
      background: '#F4F4F4',
      surface: '#FFFFFF',
      textPrimary: '#1A1A1A',
      textSecondary: '#666666',
      border: '#EEEEEE',
      statusBarForeground: 'dark',
      navigationBarForeground: 'dark',
    },
    colorsDark: {
      primary: '#FFE411',
      background: '#121212',
      surface: '#1E1E1E',
      textPrimary: '#F5F5F5',
      textSecondary: '#A0A0A0',
      border: '#333333',
      statusBarForeground: 'light',
      navigationBarForeground: 'light',
    },
  },
  intentFilters: [],
  queries: [
    { action: 'ACTION_PAY', scheme: 'alipays' },
    { action: 'ACTION_SEND', type: 'text/plain' },
  ],
};
