import type { AppManifest } from '@/os/types/manifest';
import { LauncherIcon } from './res/appIcon';

export const manifest: AppManifest = {
  id: 'suning',
  packageName: 'com.suning.mobile.ebuy',
  displayName: '苏宁易购',
  displayNameEn: 'Suning',
  aliases: ['苏宁', 'suning', '易购', '苏宁电器', '国补', '买家电'],
  version: '1.0.0',
  versionCode: 1,
  type: 'plugin',
  icon: LauncherIcon,
  // 真机图标为橙底狮子吉祥物;底色交给瓦片,LauncherIcon 只画透明底字形
  iconBackground: '#FD7101',
  iconForeground: '#ffffff',
  designViewportWidth: 360,
  theme: {
    colors: {
      // 取色自真机截图(design-tokens.md):主橙/按钮橙/页面灰底
      primary: '#FD7101',
      primaryDark: '#FB5603',
      background: '#F1F1F1',
      surface: '#ffffff',
      textPrimary: '#262626',
      textSecondary: '#757575',
      border: '#EEEEEE',
      tabBarBg: '#ffffff',
      // 多数页面白底深字;橙色顶栏页(订单详情/卡券包等)在页面内 override 为 light
      statusBarForeground: 'dark',
      navigationBarForeground: 'dark',
    },
    colorsDark: {
      primary: '#FD7101',
      primaryDark: '#FB5603',
      background: '#121212',
      surface: '#1E1E1E',
      textPrimary: '#F2F2F2',
      textSecondary: '#A8A8A8',
      border: '#2C2C2C',
      tabBarBg: '#1E1E1E',
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
