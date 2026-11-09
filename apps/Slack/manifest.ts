import type { AppManifest } from '@/os/types/manifest';
import { LauncherIcon } from './res/appIcon';

export const manifest: AppManifest = {
  id: 'slack',
  packageName: 'com.slack.android',
  displayName: 'Slack',
  displayNameEn: 'Slack',
  aliases: ['slack', '斯莱克', '团队协作', '工作沟通'],
  version: '1.0.0',
  versionCode: 1,
  type: 'plugin',
  icon: LauncherIcon,
  // 真机图标为白底圆角瓦片 + 四色井号，瓦片交给 iconBackground。
  iconBackground: '#FFFFFF',
  iconForeground: '#4A154B',
  designViewportWidth: 390,
  theme: {
    colors: {
      // 取色自真机（docs/slack-replication/design-tokens.md，已做 Display P3 → sRGB 转换）
      primary: '#4A154B',
      primaryDark: '#420E43',
      background: '#FFFFFF',
      surface: '#FFFFFF',
      textPrimary: '#1D1C1D',
      textSecondary: '#5E5D5F',
      border: '#EAEAEA',
      // 顶栏是深紫，状态栏前景用浅色；底栏悬浮在白底上，手势条用深色
      statusBarForeground: 'light',
      navigationBarForeground: 'dark',
    },
  },
  intentFilters: [],
  // 出站能力：分享文本 / 系统相册选图（对应 __OS__ ACTION_SEND / albumBridge.pickImages）
  queries: [
    { action: 'ACTION_SEND', type: 'text/plain' },
    { action: 'ACTION_PICK', type: 'image/*' },
  ],
};
