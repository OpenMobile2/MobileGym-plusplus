export const OS = {
  STATUS_BAR_H: 40,
  GESTURE_BAR_H: 16,
  VIEWPORT_W: 360,
  VIEWPORT_H: 800,
  TOP_BAR_H: 44,
  TAB_BAR_H: 58,
} as const;

export const DATA_VERSION = 1;

export const CHANNELS = [
  { id: 'live', label: '直播' },
  { id: 'recommend', label: '推荐' },
  { id: 'hot', label: '热门' },
  { id: 'anime', label: '番剧' },
  { id: 'movie', label: '影视' },
  { id: 'game', label: '游戏' },
  { id: 'tech', label: '科技' },
  { id: 'life', label: '生活' },
  { id: 'food', label: '美食' },
  { id: 'knowledge', label: '知识' },
] as const;

export const COVER_PALETTES = [
  ['#7dd3fc', '#fb7185', '#1f2937'],
  ['#fbbf24', '#f472b6', '#312e81'],
  ['#34d399', '#38bdf8', '#0f172a'],
  ['#f97316', '#facc15', '#262626'],
  ['#a78bfa', '#22d3ee', '#111827'],
  ['#f9a8d4', '#fde68a', '#172554'],
] as const;
