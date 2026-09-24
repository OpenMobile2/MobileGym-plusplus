/**
 * OS 宿主约束 —— 来源:os/data/simulatorConfig.ts;不要手动改。
 */
export const OS = {
  STATUS_BAR_H: 40,
  GESTURE_BAR_H: 16,
  VIEWPORT_W: 360,
  VIEWPORT_H: 800,
} as const;

/**
 * DATA_VERSION —— 每次修改 defaults.json 必须递增。
 */
export const DATA_VERSION = 3;

/** 底部 TabBar(四格,短剧Tab按审定Q1删除) */
export const MAIN_TABS = [
  { id: 'home', path: '/', label: 'tabHome' },
  { id: 'welfare', path: '/welfare', label: 'tabWelfare' },
  { id: 'shelf', path: '/shelf', label: 'tabShelf' },
  { id: 'mine', path: '/me', label: 'tabMine' },
] as const;

/** 首页频道(前3个可用,其余 wontfix toast) */
export const HOME_CHANNELS = [
  { id: 'recommend', label: '推荐', enabled: true },
  { id: 'novel', label: '小说', enabled: true },
  { id: 'newbook', label: '新书', enabled: true },
  { id: 'listen', label: '听书', enabled: false },
  { id: 'drama', label: '看剧', enabled: false },
  { id: 'classic', label: '经典', enabled: false },
  { id: 'manju', label: '漫剧', enabled: false },
  { id: 'video', label: '视频', enabled: false },
  { id: 'knowledge', label: '知识', enabled: false },
  { id: 'mall', label: '商城', enabled: false },
] as const;

/** 阅读器 7 档主题(design-tokens.md 实测色) */
export const READER_THEMES = [
  { id: 'white', bg: '#F6F6F6', text: '#111111', night: false },
  { id: 'cream', bg: '#E8E3CF', text: '#2C2617', night: false },
  { id: 'green', bg: '#E4F0D8', text: '#1E2A18', night: false },
  { id: 'blue', bg: '#D8E4F0', text: '#182430', night: false },
  { id: 'night1', bg: '#0E0E0E', text: '#8C8C8C', night: true },
  { id: 'night2', bg: '#1A1A1A', text: '#8C8C8C', night: true },
  { id: 'night3', bg: '#262626', text: '#8C8C8C', night: true },
] as const;

/**
 * 夜间模式档位:阅读器工具栏与「我的」右上角月亮读写同一档(走查轮3 #2),
 * 开夜间 → night2,关夜间 → cream(日间默认档)。
 */
export const NIGHT_THEME_IDX = 5;
export const DAY_THEME_IDX = 1;

/** 字号档范围(显示数值,像素 = 值 * 0.72 缩放,见 ReaderPage) */
export const FONT_SIZE_MIN = 15;
export const FONT_SIZE_MAX = 32;
export const FONT_SIZE_DEFAULT = 23;

/** 出版书「实体书」售价(元),走系统收银台 ACTION_PAY */
export const PHYSICAL_BOOK_PRICE = 28;

/** 阅读奖励:每周期秒数与金币数(挂件 mm:ss得NN金币) */
export const COIN_CYCLE_SECONDS = 300;
export const COIN_CYCLE_REWARD = 20;

/** 排行榜子榜(小说/出版) */
export const RANK_SUBS_NOVEL = ['推荐榜', '完本榜', '新书榜', '书友榜', '追更榜', '黑马榜', '巅峰榜', '书荒榜'] as const;
export const RANK_SUBS_PUBLISH = ['热门榜', '影视原著榜', '典藏榜', '知识榜', '名家榜', '飙升榜'] as const;

/** 分类页标签组(男生/女生,取自真机截图 88_4 + r5) */
export const CATEGORY_GROUPS: Record<'male' | 'female', { group: string; tags: string[] }[]> = {
  male: [
    { group: '热门标签', tags: ['都市', '悬疑', '玄幻', '历史', '衍生', '奇幻仙侠', '科幻末世', '种田', '推理', '无脑爽', '穿越', '重生', '黑道', '学霸'] },
    { group: '主题', tags: ['搞笑轻松', '悬疑脑洞', '都市生活', '末日求生', '规则怪谈', '仕途', '都市高武', '异能', '架空', '东方玄幻', '灵气复苏', '历史古代'] },
    { group: '角色', tags: ['群像', '大佬', '神医', '特工', '皇帝', '天才', '神探', '反派'] },
    { group: '情节', tags: ['系统', '重生', '打脸', '无限流', '家庭', '乡村', '双重生', '宠物', '电竞', '修仙', '捉鬼'] },
  ],
  female: [
    { group: '热门标签', tags: ['古代言情', '现代言情', '悬疑', '总裁', '穿越', '甜宠', '重生', '校园', '娱乐圈', '豪门总裁', '青梅竹马', '暗恋'] },
    { group: '主题', tags: ['搞笑轻松', '日久生情', '异世穿越', '古风世情', '第一人称', '古言权谋', '青春甜宠', '职场商战', '宫斗宅斗', '豪门世家', '虐恋情深', '现言甜宠'] },
    { group: '角色', tags: ['大女主', '医女', '女帝', '嫡女', '萌宝', '王妃'] },
    { group: '情节', tags: ['先婚后爱', '闪婚', '马甲', '穿书', '破镜重圆', '追妻', '打脸虐渣', '豪门恩怨'] },
  ],
};

/** 标签结果页排序 */
export const TAG_SORTS = ['综合', '热门', '新书', '高分'] as const;

/** 星级文案(写书评) */
export const STAR_LABELS = ['', '差评', '还行', '不错', '好看', '超好看'] as const;
