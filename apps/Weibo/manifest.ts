import type { AppManifest } from '@/os/types/manifest';
import { IcLauncher } from './res/icons';

/** 色值取自真机锚点截图(docs/weibo-replication/design-tokens.md §1,2026-07-09 采集) */
export const manifest: AppManifest = {
  id: 'weibo',
  packageName: 'com.sina.weibo',
  displayName: '微博',
  displayNameEn: 'Weibo',
  aliases: ['微博', 'weibo', '新浪微博'],
  version: '1.0.0',
  versionCode: 1,
  type: 'plugin',
  icon: IcLauncher,
  iconBackground: '#FF8200',
  iconForeground: '#FFFFFF',
  designViewportWidth: 360,
  theme: {
    colors: {
      primary: '#FF8200',
      primaryDark: '#F26D0D',
      background: '#F2F2F2',
      surface: '#FFFFFF',
      textPrimary: '#1A1A1A',
      textSecondary: '#7F7F7F',
      border: '#EEEEEE',
      statusBarForeground: 'dark',
      navigationBarForeground: 'dark',
    },
  },
  intentFilters: [],
  queries: [
    { action: 'ACTION_SEND', type: 'text/plain' },
  ],
};
