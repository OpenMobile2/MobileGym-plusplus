// 网易云音乐 结构常量

export const DATA_VERSION = 1;

/** 底部 TabBar 四格(spec chrome.tabbar) */
export const TAB_ROUTES = ['/', '/search', '/notes', '/me'] as const;

/** 首页顶部横滑 tab(午夜飞行按 qa:Q2 移除) */
export const HOME_TABS = [
  { key: 'heart', label: '心动', route: '/home/heart' },
  { key: 'rec', label: '推荐', route: '/' },
  { key: 'music', label: '音乐', route: '/home/music' },
  { key: 'podcast', label: '播客', route: '/podcast' },
  { key: 'audiobook', label: '听书', route: '/home/audiobook' },
] as const;

/** 播放模式循环:随机→单曲循环→顺序 */
export const PLAY_MODE_ORDER = ['shuffle', 'loop', 'order'] as const;
export const PLAY_MODE_LABEL: Record<string, string> = {
  shuffle: '随机播放',
  loop: '单曲循环',
  order: '顺序播放',
};

/** 评论排序 */
export const COMMENT_SORTS = ['rec', 'hot', 'new'] as const;

/** 搜索结果 tab */
export const SEARCH_TABS = ['综合', '单曲', '歌单', '播客', '专辑', '歌手', '笔记', '视频'] as const;

/** 歌单广场分类 */
export const SQUARE_CATS = ['精品', '硬地', '华语', '摇滚', '共享歌单', '民谣', '电子', '轻音乐'] as const;

/** 我的页音乐 tab 筛选 */
export const MINE_FILTERS = ['近期', '创建', '收藏', '专辑'] as const;

/** 设置分组 */
export const SETTINGS_SECTIONS = [
  '账号与安全', '播放与下载', '音质', '通用', '通知', '隐私与权限', '存储空间', '未成年人模式', '关于',
] as const;

/** 定时关闭枚举(qa:Q8) */
export const TIMER_OPTIONS = ['不开启', '15 分钟', '30 分钟', '60 分钟', '90 分钟', '自定义'] as const;
