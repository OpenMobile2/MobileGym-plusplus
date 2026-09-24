import type { AppManifest } from '@/os/types/manifest';
import { LauncherIcon } from './res/appIcon';

export const manifest: AppManifest = {
  id: 'youku',
  packageName: 'com.youku.phone',
  displayName: '优酷视频',
  displayNameEn: 'Youku',
  aliases: ['优酷', 'youku', '优酷视频', '视频', '追剧', '看剧'],
  version: '1.0.0',
  versionCode: 1,
  type: 'plugin',
  // 透明底玻璃字形(不闭合圆环+播放三角),底色瓦片由 OS 用 iconBackground 绘制(55% 居中)
  icon: LauncherIcon,
  iconBackground: '#0C7BFF',
  iconForeground: '#ffffff',
  designViewportWidth: 360,
  theme: {
    colors: {
      // 浅色模式(用户可选);默认仍走 App appearanceMode=dark → colorsDark
      primary: '#0C7BFF',
      primaryDark: '#0A66D6',
      background: '#F5F5F5',
      surface: '#FFFFFF',
      textPrimary: '#1A1A1A',
      textSecondary: '#666666',
      border: '#E8E8E8',
      statusBarForeground: 'dark',
      navigationBarForeground: 'dark',
    },
    colorsDark: {
      primary: '#3D9BFF',
      primaryDark: '#0C7BFF',
      background: '#000000',
      surface: '#1A1A1A',
      textPrimary: '#F5F5F5',
      textSecondary: '#A0A0A0',
      border: '#2A2A2A',
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
