import type { AppManifest } from '@/os/types/manifest';
import { LauncherIcon } from './res/appIcon';

export const manifest: AppManifest = {
  id: 'baicizhan',
  packageName: 'com.baicizhan.client',
  displayName: '百词斩',
  displayNameEn: 'Baicizhan',
  aliases: ['百词斩', '背单词', '单词', 'baicizhan', 'word', 'vocabulary', 'GRE'],
  version: '1.0.0',
  versionCode: 1,
  type: 'plugin',
  icon: LauncherIcon,
  iconBackground: '#FFFFFF',
  iconForeground: '#2F58E8',
  designViewportWidth: 360,
  theme: {
    colors: {
      // 取色自真机截图(docs/baicizhan-replication/design-tokens.md,区域众数采样)
      primary: '#2F58E8',
      primaryDark: '#1F50E7',
      background: '#FFFFFF',
      surface: '#F5F7FB',
      textPrimary: '#212121',
      textSecondary: '#9AA5B1',
      border: '#EEEEEE',
      // 首屏(首页/学习流)为浅色 → 状态栏前景 dark。
      // ⚠ 深色页(排行榜)在页面内用 data-status-bar-foreground="light" 翻转。
      statusBarForeground: 'dark',
      navigationBarForeground: 'dark',
    },
    colorsDark: {
      primary: '#7293FF',
      primaryDark: '#5E80F2',
      background: '#10131A',
      surface: '#1B202A',
      textPrimary: '#F2F5FA',
      textSecondary: '#A7B1C0',
      border: '#303744',
      statusBarForeground: 'light',
      navigationBarForeground: 'light',
    },
  },
  intentFilters: [],
  queries: [
    { action: 'ACTION_PAY', scheme: 'alipays' },
    { action: 'ACTION_PAY', scheme: 'weixin' },
    { action: 'ACTION_SEND', type: 'text/plain' },
  ],
};

export default manifest;
