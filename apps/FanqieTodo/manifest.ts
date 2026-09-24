import type { AppManifest } from '@/os/types/manifest';
import { LauncherIcon } from './res/appIcon';

export const manifest: AppManifest = {
  id: 'fanqietodo',
  packageName: 'com.fanqie.todo',
  displayName: '番茄ToDo',
  displayNameEn: 'Fanqie ToDo',
  aliases: ['番茄todo', '番茄待办', '番茄钟', 'fanqie', 'tomato', 'pomodoro', '专注'],
  version: '1.0.0',
  versionCode: 1,
  type: 'plugin',
  icon: LauncherIcon,
  // 真机图标为米白底 + 低多边形红番茄。OS 把组件图标画成「底色瓦片 + 55% 居中字形」,
  // 故底色交给瓦片(iconBackground),LauncherIcon 只画透明底的番茄字形,避免图标套图标。
  iconBackground: '#ECE7D3',
  iconForeground: '#E14634',
  designViewportWidth: 360,
  theme: {
    colors: {
      // 取色自真机截图(design-tokens.md):待办顶栏番茄蓝、锁机/统计等浅色页
      primary: '#4A90D9',
      primaryDark: '#3B7CC4',
      background: '#F4F6F8',
      surface: '#ffffff',
      textPrimary: '#222222',
      textSecondary: '#8A8F99',
      border: '#EEF0F3',
      // 首屏「待办」顶栏为番茄蓝(深),状态栏前景用浅色;浅色顶栏页在页面内 override 为 dark
      statusBarForeground: 'light',
      navigationBarForeground: 'dark',
    },
  },
  intentFilters: [],
};
