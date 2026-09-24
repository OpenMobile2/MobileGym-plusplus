import type { AppManifest } from '@/os/types/manifest';
import { LauncherIcon } from './res/appIcon';

export const manifest: AppManifest = {
  id: 'cainiao',
  packageName: 'com.cainiao.wireless',
  displayName: '菜鸟',
  displayNameEn: 'Cainiao',
  aliases: ['菜鸟裹裹', '菜鸟驿站', 'cainiao', 'guoguo', '快递', '取件', '寄件'],
  version: '1.0.0',
  versionCode: 1,
  type: 'plugin',
  icon: LauncherIcon,
  // 真机图标为蓝底白色小鸟机器人;底色交给瓦片,LauncherIcon 只画透明底字形
  iconBackground: '#1677FF',
  iconForeground: '#ffffff',
  designViewportWidth: 360,
  theme: {
    colors: {
      // 取色自真机截图(design-tokens.md):品牌蓝/页面灰底
      primary: '#1677FF',
      primaryDark: '#126BDF',
      background: '#F0F3F8',
      surface: '#ffffff',
      textPrimary: '#1A1A1A',
      textSecondary: '#999999',
      border: '#EEF0F3',
      // 首页顶部为品牌蓝深底,状态栏前景用浅色;白底内页在页面内 override 为 dark
      statusBarForeground: 'light',
      navigationBarForeground: 'dark',
    },
    colorsDark: {
      primary: '#3B8BFF',
      primaryDark: '#1677FF',
      background: '#0E1116',
      surface: '#1A1F27',
      textPrimary: '#F2F2F2',
      textSecondary: '#8A8A8A',
      border: '#2A3140',
      statusBarForeground: 'light',
      navigationBarForeground: 'light',
    },
  },
  intentFilters: [],
  queries: [
    { action: 'ACTION_SEND', type: 'text/plain' },
  ],
};
