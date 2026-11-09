import defaults from './defaults.json';
import {
  TABS,
  QUICK_VIEW_CARDS,
  GUIDE_CARDS,
  SORT_OPTIONS,
  UNREAD_SORT_OPTIONS,
  CHANNEL_ROW_MENU,
  COPY_SUBMENU,
  QUICK_ACTIONS,
} from '../constants';

/** 结构常量 + 可替换默认数据的统一出口（导航图 data 模式的 ref 根） */
export const SLACK_CONFIG = {
  ...defaults,
  tabs: TABS,
  quickViewCards: QUICK_VIEW_CARDS,
  guideCards: GUIDE_CARDS,
  sortOptions: SORT_OPTIONS,
  unreadSortOptions: UNREAD_SORT_OPTIONS,
  channelRowMenu: CHANNEL_ROW_MENU,
  copySubmenu: COPY_SUBMENU,
  quickActions: QUICK_ACTIONS,
};

export type SlackConfig = typeof SLACK_CONFIG;
export default SLACK_CONFIG;
