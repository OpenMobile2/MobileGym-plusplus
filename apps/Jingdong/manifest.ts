import type { AppManifest } from '@/os/types/manifest';
import { IcLauncher } from './res/icons';

export const manifest: AppManifest = {
  id: 'jingdong',
  packageName: 'com.jingdong.app.mall',
  displayName: '京东',
  displayNameEn: 'JD',
  aliases: ['京东', 'jd', 'JD', '京东商城', '京东秒送', 'shopping'],
  version: '1.0.0',
  versionCode: 1,
  type: 'plugin',
  icon: IcLauncher,
  iconBackground: '#E1251B',
  iconForeground: '#FFFFFF',
  designViewportWidth: 360,
  theme: {
    colors: {
      primary: '#E1251B',
      background: '#F5F5F5',
      surface: '#FFFFFF',
      textPrimary: '#1A1A1A',
      textSecondary: '#6B6B6B',
      border: '#EEEEEE',
      // 首屏为浅色顶栏 → 前景用深色(保真四要素 §10.1 A2)
      statusBarForeground: 'dark',
      navigationBarForeground: 'dark',
    },
  },
  intentFilters: [],
  queries: [
    { action: 'ACTION_PAY', scheme: 'weixin' },
    { action: 'ACTION_SEND', type: 'text/plain' },
  ],
};
