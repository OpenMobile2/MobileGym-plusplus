// apps/Broadcast/constants.ts — 结构性常量(用户不可改的 app 形状)
import { IcTabHome, IcTabBrowse, IcTabLibrary, IcTabSearch } from './res/icons';

/**
 * OS 宿主约束 —— 来源 os 层 simulatorConfig;不要手改。
 */
export const OS = {
  STATUS_BAR_H: 40,   // pt-10
  GESTURE_BAR_H: 16,  // h-4
  VIEWPORT_W: 360,
  VIEWPORT_H: 800,
} as const;

/**
 * DATA_VERSION —— 每次改 defaults.json 必须递增(state persistName 带此版本,变化即清缓存)。
 */
export const DATA_VERSION = 4;

// 底部四个主 Tab(主页/新发现/资料库/搜索)
export const TABS = [
  { id: 'home',    route: '/',        labelKey: 'tab_home',    icon: IcTabHome },
  { id: 'browse',  route: '/browse',  labelKey: 'tab_browse',  icon: IcTabBrowse },
  { id: 'library', route: '/library', labelKey: 'tab_library', icon: IcTabLibrary },
  { id: 'search',  route: '/search',  labelKey: 'tab_search',  icon: IcTabSearch },
] as const;

export const MAIN_TAB_ROUTES = TABS.map(t => t.route);

// 节目详情"单集"筛选项
export const EPISODE_FILTERS = [
  { id: 'all',        labelKey: 'filter_all' },
  { id: 'unplayed',   labelKey: 'filter_unplayed' },
  { id: 'played',     labelKey: 'filter_played' },
  { id: 'downloaded', labelKey: 'filter_downloaded' },
  { id: 'saved',      labelKey: 'filter_saved' },
] as const;

// 搜索结果分组标签
export const SEARCH_TABS = [
  { id: 'top',      labelKey: 'search_tab_top' },
  { id: 'shows',    labelKey: 'search_tab_shows' },
  { id: 'episodes', labelKey: 'search_tab_episodes' },
  { id: 'channels', labelKey: 'search_tab_channels' },
  { id: 'genres',   labelKey: 'search_tab_genres' },
] as const;

// 播放器倍速循环(G4 外推)
export const PLAYBACK_SPEEDS = [1, 1.25, 1.5, 1.75, 2, 0.5, 0.75] as const;

// 睡眠定时选项(分钟;0=本集结束;-1=关闭)(G4 外推)
export const SLEEP_OPTIONS = [5, 10, 15, 30, 45, 60] as const;
