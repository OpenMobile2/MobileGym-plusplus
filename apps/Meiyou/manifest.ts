import type { AppManifest } from '@/os/types/manifest';
import { IcLauncher } from './res/icons';

export const manifest: AppManifest = {
  id: 'meiyou',
  packageName: 'com.lingan.seeyou',
  displayName: '美柚',
  displayNameEn: 'Meetyou',
  aliases: ['美柚', 'meiyou', 'meetyou', '经期记录'],
  version: '1.0.0',
  versionCode: 1,
  type: 'plugin',
  icon: IcLauncher,
  iconBackground: '#FA4B85',
  iconForeground: '#FFFFFF',
  designViewportWidth: 360,
  theme: {
    colors: {
      // 取色见 docs/meiyou-replication/design-tokens.md(源自真机截图)
      primary: '#FA4B85',
      background: '#F2F2F4',
      surface: '#FFFFFF',
      textPrimary: '#1A1A1A',
      textSecondary: '#999999',
      border: '#EEEEEE',
      statusBarForeground: 'dark',
      navigationBarForeground: 'dark',
    },
  },
  intentFilters: [],
};
