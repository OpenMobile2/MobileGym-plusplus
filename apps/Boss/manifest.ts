import type { AppManifest } from '@/os/types/manifest';
import { LauncherIcon } from './res/appIcon';

export const manifest: AppManifest = {
  id: 'boss',
  packageName: 'com.hpbr.bosszhipin',
  displayName: 'BOSS直聘',
  displayNameEn: 'BOSS Zhipin',
  aliases: ['BOSS直聘', 'boss', '直聘', '找工作', '招聘', 'job', 'zhipin'],
  version: '1.0.0',
  versionCode: 1,
  type: 'plugin',
  icon: LauncherIcon,
  iconBackground: '#12ADA9',
  iconForeground: '#FFFFFF',
  designViewportWidth: 360,
  theme: {
    colors: {
      // 取色自真机截图(docs/boss-replication/design-tokens.md,像素采样)
      primary: '#12ADA9',
      primaryDark: '#00A3A3',
      background: '#FFFFFF',
      surface: '#F5F6F7',
      textPrimary: '#222222',
      textSecondary: '#666666',
      border: '#EEEEEE',
      // 首屏(职位列表)浅青渐变白底 → 状态栏前景 dark。
      // ⚠ 深色页(VIP 会员/面试日程/上传方式)在页面内用 data-status-bar-foreground="light" 翻转。
      statusBarForeground: 'dark',
      navigationBarForeground: 'dark',
    },
    colorsDark: {
      primary: '#35C8C3',
      primaryDark: '#2BC0BC',
      background: '#121719',
      surface: '#1E2528',
      textPrimary: '#F3F7F7',
      textSecondary: '#A7B2B5',
      border: '#343D40',
      statusBarForeground: 'light',
      navigationBarForeground: 'light',
    },
  },
  intentFilters: [],
  queries: [
    { action: 'ACTION_SEND', type: 'text/plain' },
    { action: 'ACTION_PICK', type: 'image/*' },
    { action: 'ACTION_PAY', scheme: 'alipays' },
  ],
};

export default manifest;
