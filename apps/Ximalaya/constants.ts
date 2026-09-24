// 结构性常量(非用户数据)。用户数据放 data/defaults.json。

// 改动 defaults.json 时 +1,重置本地 localStorage。
// v2: 100 专辑 / 718 集 / 60 主播(原 10/60/10)
export const DATA_VERSION = 3;

// 品牌色(取自真机像素采样,见 docs/ximalaya-replication/design-tokens.md)
export const XMLY_RED = '#FE4543';
export const XMLY_RED_DEEP = '#F5352E';
export const VIP_GOLD = '#F5C36B';

// 底部主 Tab:首页 / 快听 / [中央播放按钮] / 会员 / 我的
// 中央播放按钮不是 tab 路由,单独在 TabBar 里渲染。
export const MAIN_TABS = [
  { id: 'home', path: '/', labelKey: 'tab_home', icon: 'IcTabHome', transitionId: 'tabbar.home-open' },
  { id: 'quicklisten', path: '/quicklisten', labelKey: 'tab_quick', icon: 'IcTabQuick', transitionId: 'tabbar.quicklisten-open' },
  { id: 'member', path: '/member', labelKey: 'tab_member', icon: 'IcTabMember', transitionId: 'tabbar.member-open' },
  { id: 'mine', path: '/me', labelKey: 'tab_mine', icon: 'IcTabMine', transitionId: 'tabbar.mine-open' },
] as const;

export const TAB_PATHS = MAIN_TABS.map((t) => t.path) as string[];

// 首页顶部分类 Tab
export const HOME_CATEGORY_TABS = ['推荐', '小说', '儿童', '相声评书', '大师课', '历史'] as const;

// 播放页 封面/文稿/周边
export const PLAYER_TABS = ['封面', '文稿', '周边'] as const;

// 定时:按时间 / 按集数
export const TIMER_TIME_OPTIONS = [15, 30, 60, 90] as const;
export const TIMER_COUNT_OPTIONS = [1, 2, 3, 5] as const;

// 倍速
export const SPEED_OPTIONS = [0.8, 1.0, 1.2, 1.5, 1.8] as const;

// 搜索结果 Tab
export const SEARCH_RESULT_TABS = ['精选', '专辑', '声音', '主播', '广播'] as const;

// 我的-内容 Tab
export const MINE_CONTENT_TABS = ['消息', '历史', '订阅', '本地', '已购'] as const;

// 订阅二级分类
export const SUBSCRIBE_TABS = ['全部', '有声书', '播客', '听单'] as const;

// 举报原因
export const REPORT_REASONS = [
  '存在政治反动内容', '存在低俗色情内容', '存在垃圾广告信息', '存在盗版或侵权',
  '内容不适合未成年人', '举报其他违规内容', '涉互联网算法推荐', '涉网络暴力有害信息',
  '网络谣言和虚假信息', '侵害企业或个人合法权益',
] as const;
