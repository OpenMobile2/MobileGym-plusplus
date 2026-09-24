import type { AppManifest } from '@/os/types/manifest';
import { IcLauncher } from './res/icons';

export const manifest: AppManifest = {
  id: 'tbsg',
  packageName: 'com.taobao.shangou',
  displayName: '淘宝闪购',
  displayNameEn: 'TB Instant',
  aliases: ['闪购', '外卖', 'shangou', 'waimai', 'takeout'],
  version: '1.0.0',
  versionCode: 1,
  type: 'plugin',
  icon: IcLauncher,
  iconBackground: '#ED6C2C',
  iconForeground: '#ffffff',
  designViewportWidth: 402,
  theme: {
    colors: {
      // 色值来源:design-tokens.md(真机截图 PIL 取模)
      primary: '#ED6C2C',
      primaryDark: '#D45A1E',
      background: '#F3F6F8',
      surface: '#ffffff',
      textPrimary: '#1A1A1A',
      textSecondary: '#999999',
      border: '#EEEEEE',
      statusBarForeground: 'dark',
      navigationBarForeground: 'dark',
    },
  },
};
