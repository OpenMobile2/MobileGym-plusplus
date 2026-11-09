import type { AppManifest } from '@/os/types/manifest';
import { LauncherIcon } from './res/appIcon';

export const manifest: AppManifest = {
  id: 'dida',
  packageName: 'com.dida.todo',
  displayName: '滴答清单',
  displayNameEn: 'TickTick',
  aliases: ['滴答', 'ticktick', 'dida', '待办', '清单', '番茄专注', 'todo'],
  version: '1.0.0',
  versionCode: 1,
  type: 'plugin',
  icon: LauncherIcon,
  // 真机图标为深色圆角瓦片 + 蓝环 + 黄勾。瓦片底色交给 iconBackground,LauncherIcon 只画环+勾。
  iconBackground: '#16212C',
  iconForeground: '#4E7EF3',
  designViewportWidth: 375,
  theme: {
    colors: {
      // 取色自真机(design-tokens.md):深色默认,强调橙
      primary: '#F79A28',
      primaryDark: '#D97F16',
      background: '#000000',
      surface: '#1C1C1E',
      textPrimary: '#FFFFFF',
      textSecondary: '#8E8E93',
      border: '#2C2C2E',
      // 深色页顶栏近黑,状态栏前景用浅色
      statusBarForeground: 'light',
      navigationBarForeground: 'light',
    },
  },
  intentFilters: [],
  // 外发 Intent：分享 / 选图 / 支付（供 IntentResolver 与 bench 静态分析）
  queries: [
    { action: 'ACTION_SEND', type: 'text/plain' },
    { action: 'ACTION_PICK', type: 'image/*' },
    { action: 'ACTION_PAY', scheme: 'alipays' },
  ],
};
