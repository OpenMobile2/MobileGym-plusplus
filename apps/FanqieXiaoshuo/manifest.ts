import type { AppManifest } from '@/os/types/manifest';
import { IcLauncher } from './res/icons';

export const manifest: AppManifest = {
  id: 'fanqiexiaoshuo',
  packageName: 'com.dragon.read',
  displayName: '番茄免费小说',
  displayNameEn: 'Fanqie Novel',
  aliases: ['番茄小说', '番茄', 'fanqie', 'tomato novel'],
  version: '1.0.0',
  versionCode: 1,
  type: 'plugin',
  icon: IcLauncher,
  iconBackground: '#FA6E3D',
  iconForeground: '#FFFFFF',
  designViewportWidth: 360,
  theme: {
    colors: {
      // 取色:design-tokens.md(Q12 常态白/淡橙)
      primary: '#FA6E3D',
      primaryDark: '#E85A20',
      background: '#F5F5F5',
      surface: '#FFFFFF',
      textPrimary: '#1A1A1A',
      textSecondary: '#8A8A8A',
      border: '#EEEEEE',
      statusBarForeground: 'dark',
      navigationBarForeground: 'dark',
    },
    // 深色跟随 OS(res/colors.ts 的 colorsDark 覆盖 Tier-2)
    // 主色不随深色变:res/colors.ts 的 colorsDark 未覆盖 brand/brand_dark
    colorsDark: {
      primary: '#FA6E3D',
      primaryDark: '#E85A20',
      background: '#121212',
      surface: '#1E1E1E',
      textPrimary: '#E8E8E8',
      textSecondary: '#9A9A9A',
      border: '#333333',
      statusBarForeground: 'light',
      navigationBarForeground: 'light',
    },
  },
  intentFilters: [],
  queries: [
    // 阅读器菜单「分享」→ 系统分享(回落系统剪贴板,剪贴板走 ClipboardService 无需声明)
    { action: 'ACTION_SEND', type: 'text/plain' },
    // 书籍详情「实体书购买」→ 系统收银台(微信优先,支付宝回落)
    { action: 'ACTION_PAY', scheme: 'weixin' },
    { action: 'ACTION_PAY', scheme: 'alipays' },
  ],
};
