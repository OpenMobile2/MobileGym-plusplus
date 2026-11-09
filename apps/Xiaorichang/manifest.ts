import type { AppManifest } from '@/os/types/manifest';
import { LauncherIcon } from './res/appIcon';

export const manifest: AppManifest = {
  id: 'xiaorichang',
  packageName: 'com.xiaorichang.habit',
  displayName: '小日常',
  displayNameEn: 'Daily',
  aliases: ['小日常', '打卡', '习惯', '习惯打卡', 'habit', 'daily', 'checkin'],
  version: '1.0.0',
  versionCode: 1,
  type: 'plugin',
  icon: LauncherIcon,
  iconBackground: '#FFF5D5',
  iconForeground: '#F7CE45',
  designViewportWidth: 360,
  theme: {
    colors: {
      // 取色自真机截图(docs/xiaorichang-replication/design-tokens.md,区域众数采样)
      primary: '#F7CE45',
      primaryDark: '#E69F4B',
      background: '#FFFFFF',
      surface: '#F8F8F8',
      textPrimary: '#212121',
      textSecondary: '#9AA5B1',
      border: '#EEEEEE',
      // 首屏为白底浅色页 → 状态栏前景 dark。
      // ⚠ 该约束仅适用于浅色态;深色态由页面内 data-status-bar-foreground 翻转为 light。
      statusBarForeground: 'dark',
      navigationBarForeground: 'dark',
    },
    colorsDark: {
      primary: '#F7CE45',
      primaryDark: '#E3B83A',
      background: '#181817',
      surface: '#252522',
      textPrimary: '#F4F3EE',
      textSecondary: '#ABA9A1',
      border: '#3A3934',
      statusBarForeground: 'light',
      navigationBarForeground: 'light',
    },
  },
  intentFilters: [],
  queries: [
    { action: 'ACTION_SEND', type: 'text/plain' },
    { action: 'ACTION_SEND', type: 'image/*' },
    { action: 'ACTION_PICK', type: 'image/*' },
    { action: 'ACTION_PAY', scheme: 'alipays' },
  ],
};
