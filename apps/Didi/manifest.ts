import type { AppManifest } from '@/os/types/manifest';
import { PERMISSIONS } from '@/os/permissions';
import { IcLauncher } from './res/icons';

export const manifest: AppManifest = {
  id: 'didi',
  packageName: 'com.sdu.didi.psnger',
  displayName: '滴滴出行',
  displayNameEn: 'DiDi',
  aliases: ['滴滴', '滴滴出行', 'didi', '打车', '叫车', '网约车'],
  version: '1.0.0',
  versionCode: 1,
  type: 'plugin',
  icon: IcLauncher,
  iconBackground: '#FF7D41',
  iconForeground: '#FFFFFF',
  designViewportWidth: 360,
  theme: {
    colors: {
      primary: '#FF7D41',      // 滴滴橙
      background: '#F5F6FA',
      surface: '#FFFFFF',
      textPrimary: '#1A1A1A',
      textSecondary: '#8A8F99',
      border: '#ECECEC',
      statusBarForeground: 'dark',
      navigationBarForeground: 'dark',
    },
    colorsDark: {
      primary: '#FF7D41',
      background: '#121212',
      surface: '#1C1C1E',
      textPrimary: '#F2F2F7',
      textSecondary: '#8E8E93',
      border: '#2C2C2E',
      tabBarBg: '#1C1C1E',
      statusBarForeground: 'light',
      navigationBarForeground: 'light',
    },
  },
  permissions: [PERMISSIONS.READ_EXTERNAL_STORAGE],
  intentFilters: [],
  queries: [
    { action: 'com.mobilegym.SHARE', type: 'text/plain' },
    { action: 'com.mobilegym.PICK_IMAGE', type: 'image/*' },
    { action: 'com.mobilegym.PAY' },
    { action: 'ACTION_PAY', scheme: 'weixin' },
    { action: 'ACTION_SEND', type: 'text/plain' },
  ],
};
