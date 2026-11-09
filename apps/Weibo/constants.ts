/** 微博结构常量(用户数据在 data/defaults.json)。 */
export const DATA_VERSION = 7;

export const TABS = [
  { id: 'home', route: '/', labelKey: 'tabHome', icon: 'IcHome' },
  { id: 'video', route: '/video', labelKey: 'tabVideo', icon: 'IcVideo' },
  { id: 'discover', route: '/discover', labelKey: 'tabDiscover', icon: 'IcDiscover' },
  { id: 'message', route: '/message', labelKey: 'tabMessage', icon: 'IcMessage' },
  { id: 'me', route: '/me', labelKey: 'tabMe', icon: 'IcMe' },
] as const;

/** 首页顶部频道 chips(热门态) */
export const HOME_CHANNELS = ['热门', '世界杯', '同城', '实时', '榜单'] as const;
/** 发现页频道 chips */
export const DISCOVER_CHANNELS = ['热点', '星品', '热转', 'V发布', '世界杯'] as const;
/** 关注分组面板 */
export const FOLLOW_GROUPS = ['全部关注', '最新微博', '特别关注', '好友圈', '原创', '视频', 'V+微博', '群微博'] as const;
/** ＋菜单 */
export const PLUS_MENU = [
  { id: 'compose', labelKey: 'plusCompose', icon: 'IcCompose' },
  { id: 'album', labelKey: 'plusAlbum', icon: 'IcImage' },
  { id: 'checkin', labelKey: 'plusCheckin', icon: 'IcCalendar' },
  { id: 'review', labelKey: 'plusReview', icon: 'IcStar' },
  { id: 'live', labelKey: 'plusLive', icon: 'IcVideo' },
] as const;
/** 搜索结果 tabs(话题态无「用户」) */
export const SEARCH_TABS = ['综合', '智搜', '实时', '用户', '视频', '图片', '关注', '热门', '全网', '话题', '超话', '地点'] as const;
/** 可见范围 */
export const VISIBILITY_OPTIONS = [
  { id: 'public', label: '公开', desc: '所有人可见' },
  { id: 'fans', label: '粉丝', desc: '关注你的人可见' },
  { id: 'friends', label: '好友圈', desc: '相互关注好友可见' },
  { id: 'private', label: '仅自己可见', desc: '' },
] as const;
/** 话题选择页左侧分类 */
export const TOPIC_CATEGORIES = ['美食', '时尚美妆', '动漫', '搞笑', '旅游', '明星', '游戏', '摄影', '萌宠', '运动健身', '电视剧', '综艺', '电影'] as const;
/** 超话选择页左侧分类 */
export const ST_CATEGORIES = ['最近使用', '游戏', '电竞', '动漫', '体育运动', '明星', '红人', '影视综', '读书', '心情充电', 'AI', '美好生活'] as const;
/** 超话发帖版块 */
export const ST_SECTIONS = ['超友趣', '周边', '官方公告', '应援专区'] as const;
/** 设置页列表 */
export const SETTINGS_ITEMS = ['账号管理', '账号与安全', '会员专属设置', '通知设置', '添加小组件', '屏蔽设置', '隐私设置', '通用设置', '自定义导航栏', '未成年人模式', '关爱模式', '客服中心', '社区管理中心', '关于微博', '存储空间'] as const;
/** 消息设置行 */
export const MSG_SETTINGS_ITEMS = ['关注人动态', '视频动态', '粉丝群', '超话社区', '关注推荐', '关注人上热搜', '铁粉', '服务动态', '内容资讯', 'V+付费内容', '直播', '生日动态'] as const;
/** 详情页大家都在搜 chips */
export const RELATED_SEARCH = ['乳状云是什么', '台风最新路径', '演唱会门票', '毕业季文案'] as const;
