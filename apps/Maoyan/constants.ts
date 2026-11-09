/**
 * OS 宿主约束 —— 来源:os/data/simulatorConfig.ts
 */
export const OS = {
  STATUS_BAR_H: 40,
  GESTURE_BAR_H: 16,
  VIEWPORT_W: 360,
  VIEWPORT_H: 800,
  TOP_BAR_H: 44,
  TAB_BAR_H: 56,
} as const;

/**
 * DATA_VERSION —— 每次修改 defaults.json 必须递增。
 */
export const DATA_VERSION = 6;

/** 选座上限(spec qa:Q3) */
export const MAX_SEATS = 6;

/** 首页金刚区频道(spec home.channel.select.target) */
export const HOME_CHANNELS = [
  { id: 'movie', label: '电影/影院', labelEn: 'Movies' },
  { id: 'concert', label: '演唱会', labelEn: 'Concerts' },
  { id: 'show', label: '演出', labelEn: 'Shows' },
  { id: 'talkshow', label: '脱口秀', labelEn: 'Stand-up' },
  { id: 'drama', label: '话剧音乐剧', labelEn: 'Theatre' },
] as const;

/** 演出分类(show.channel 宫格 / show.category tab) */
export const SHOW_CATEGORIES = [
  { id: 'concert', label: '演唱会', labelEn: 'Concert' },
  { id: 'talkshow', label: '脱口秀', labelEn: 'Stand-up' },
  { id: 'exhibition', label: '休闲展览', labelEn: 'Exhibition' },
  { id: 'drama', label: '话剧音乐剧', labelEn: 'Theatre' },
  { id: 'musicfest', label: '音乐节', labelEn: 'Music Fest' },
  { id: 'kids', label: '亲子艺术', labelEn: 'Family Arts' },
  { id: 'classical', label: '音乐会', labelEn: 'Classical' },
  { id: 'crosstalk', label: '相声', labelEn: 'Crosstalk' },
] as const;

/** 玩乐频道金刚区(spec fun.category.select.option,15格全可点同行为) */
export const FUN_CATEGORIES = [
  '话剧音乐剧', 'KTV', '音乐会', '密室逃脱', '景点门票',
  '按摩/足疗', '电玩游戏厅', '运动健身', '网吧/电竞', '洗浴汗蒸',
  '休闲展览', '脱口秀', '沉浸剧场', '相声', '戏曲艺术',
] as const;

/** 影厅类型筛选(movie.cinemas.filter) */
export const HALL_TYPES = ['CGS中国巨幕', '杜比全景声', '儿童厅', '4K厅', '巨幕厅', '激光厅'] as const;
export const CINEMA_SERVICES = ['可退票', '可改签'] as const;
