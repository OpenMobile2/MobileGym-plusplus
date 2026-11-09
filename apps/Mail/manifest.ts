import { IcLauncher } from './res/icons';
import type { AppManifest } from '@/os/types/manifest';

export const manifest: AppManifest = {
  id: 'mail',
  packageName: 'com.apple.mobilemail',
  displayName: '邮件',
  displayNameEn: 'Mail',
  aliases: ['邮件', '邮箱', 'mail', 'email', 'inbox'],
  version: '1.0.0',
  versionCode: 1,
  type: 'plugin',
  icon: IcLauncher,
  iconBackground: '#1E7BF5',
  iconForeground: '#FFFFFF',
  designViewportWidth: 360,
  theme: {
    colors: {
      // 色值取自 mail_images/ 里的 iOS 26 真机截图
      primary: '#007AFF',
      primaryDark: '#0062CC',
      background: '#F2F2F7',
      surface: '#FFFFFF',
      textPrimary: '#000000',
      textSecondary: '#8E8E93',
      border: '#E5E5EA',
      // 全 App 浅底 → 状态栏与手势条前景都用深色
      statusBarForeground: 'dark',
      navigationBarForeground: 'dark',
    },
    colorsDark: {
      primary: '#0A84FF',
      primaryDark: '#0060DF',
      background: '#000000',
      surface: '#1C1C1E',
      textPrimary: '#FFFFFF',
      textSecondary: '#98989F',
      border: '#38383A',
      statusBarForeground: 'light',
      navigationBarForeground: 'light',
    },
  },
  intentFilters: [],
};
