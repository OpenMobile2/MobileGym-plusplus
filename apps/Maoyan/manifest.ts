import type { AppManifest } from '@/os/types/manifest';

/**
 * 图标:猫眼样式——红底白色猫眼形(design-tokens §6 A1;色值取自 anchor_hot_list.jpg 顶栏)
 */
const IcLauncher = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="%23DC4038"/>
  <ellipse cx="50" cy="50" rx="30" ry="38" fill="none" stroke="white" stroke-width="7"/>
  <ellipse cx="50" cy="50" rx="11" ry="17" fill="white"/>
</svg>`;

export const manifest: AppManifest = {
  id: 'maoyan',
  packageName: 'com.sankuai.movie',
  displayName: '猫眼',
  displayNameEn: 'Maoyan',
  aliases: ['猫眼电影', 'maoyan', '猫眼演出'],
  version: '1.0.0',
  versionCode: 1,
  type: 'plugin',
  icon: IcLauncher,
  iconBackground: '#DC4038',
  iconForeground: '#FFFFFF',
  designViewportWidth: 360,
  theme: {
    colors: {
      // 取色来源:docs/maoyan-replication/design-tokens.md(anchor_hot_list/anchor_seat/anchor_mine)
      primary: '#DC4038',
      primaryDark: '#B93129',
      background: '#F7F7F8',
      surface: '#FFFFFF',
      textPrimary: '#1A1A1A',
      textSecondary: '#666666',
      border: '#EEEEEE',
      statusBarForeground: 'dark',
      navigationBarForeground: 'dark',
    },
    // 深色(跟随 OS 快捷开关;品牌红保持不变,只换中性层)
    colorsDark: {
      primary: '#DC4038',
      primaryDark: '#B93129',
      background: '#121214',
      surface: '#1C1C1E',
      textPrimary: '#EDEDF0',
      textSecondary: '#A0A0A6',
      border: '#2C2C2E',
      tabBarBg: '#1C1C1E',
      statusBarForeground: 'light',
      navigationBarForeground: 'light',
    },
  },
  intentFilters: [],
  queries: [
    { action: 'ACTION_PAY', scheme: 'weixin' },
    { action: 'ACTION_SEND', type: 'text/plain' },
  ],
};
