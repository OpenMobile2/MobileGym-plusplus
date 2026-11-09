import { YOUKU_CONFIG } from '../../data';
import { CATALOG, SHORTS } from '../feedShared';
import type { CatalogItem, ShortVideo } from '../../types';

/**
 * 播放模块共享工具(player.main / player.series.main / episodes.sheet / rating.page / 三 sheet)。
 * - 评论/弹幕 key 约定(05-build-progress):电影=videoId;剧集=`${showId}:${ep}`
 * - 跨路由易失同步单例(feedShared.jieshuoLocator 同款合同:纯 UI 态,刷新即失)
 */

export const catalogItem = (id?: string | null): CatalogItem | undefined =>
  id ? CATALOG.find((c) => c.id === id) : undefined;

export function hashInt(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export const commentKey = (id: string, ep?: number): string => (ep != null ? `${id}:${ep}` : id);

/**
 * 讨论tab展示基数(真机 1万+/5971/2431;种子无全量计数,用确定性伪计数,每集独立)。
 * 乘 Knuth 常数打散:相邻集 key 的 hashInt 只差 ±1,直接取模会让同剧所有集
 * 四舍五入后显示同一个「x.x万」,切集时讨论数不可观察(运行时走查抓出)。
 */
export const discussBase = (key: string): number =>
  800 + (((hashInt(key) * 2654435761) >>> 0) % 24000);

/** 评论输入框占位文案随影片/集变化(spec s238/s258/a266 三种) */
export const placeholderKey = (key: string): string => `player.comment.ph${(hashInt(key) % 3) + 1}`;

/** 看点tab二创短视频:关联本片的优先,不足补齐 */
export function highlightShorts(contentId: string): ShortVideo[] {
  const linked = SHORTS.filter((s) => s.linkedContentId === contentId);
  const rest = SHORTS.filter((s) => s.linkedContentId !== contentId);
  return [...linked, ...rest].slice(0, 6);
}

/** 同系列影片(电影页系列横滑) */
export const seriesFilms = (item: CatalogItem): CatalogItem[] =>
  item.seriesId ? CATALOG.filter((c) => c.seriesId === item.seriesId) : [];

/** 为你推荐:电影页推电影(票房角标),剧集页推多集内容(独播角标) */
export function movieRecommends(excludeId: string): CatalogItem[] {
  const cur = catalogItem(excludeId);
  return CATALOG.filter(
    (c) => c.type === 'movie' && c.id !== excludeId && (!cur?.seriesId || c.seriesId !== cur.seriesId),
  ).slice(0, 6);
}

export function seriesRecommends(excludeId: string): CatalogItem[] {
  return CATALOG.filter(
    (c) => c.id !== excludeId && c.episodeCount != null && (c.type === 'series' || c.type === 'anime' || c.type === 'variety'),
  ).slice(0, 6);
}

/** VIP 内容判定:电影=badge VIP;剧集=ep >= vipFrom(free 1-2 / 试看 3 / VIP 4+) */
export const isVipMovie = (item: CatalogItem): boolean => item.badge === 'VIP';

export const epLocked = (item: CatalogItem, ep: number, memberActive: boolean): boolean =>
  !memberActive && item.vipFrom != null && ep >= item.vipFrom;

/** 分集剧情(defaults.episodeSynopsis;缺失由页面用 i18n fallback) */
export const synopsisOf = (showId: string): string[] =>
  ((YOUKU_CONFIG as unknown as { episodeSynopsis: Record<string, string[]> }).episodeSynopsis ?? {})[showId] ?? [];

/** 弹幕池(静态种子部分;我发的从 store userDanmakuByKey 取) */
export function danmakuSeeds(key: string): string[] {
  const cfg = YOUKU_CONFIG as unknown as { seedDanmaku: Record<string, string[]>; defaultDanmaku: string[] };
  return cfg.seedDanmaku[key] ?? cfg.defaultDanmaku;
}

/** 语言选项 → select 参数值(spec note: option=english/mandarin/french) */
export const LANG_VALUE: Record<string, string> = {
  普通话: 'mandarin',
  粤语: 'cantonese',
  英语: 'english',
  法语: 'french',
};

/**
 * 跨路由易失同步(路由互斥挂载,back 后由页面在初始化时消费):
 * - 选集面板切集 → 剧集页 ep 回填
 * - 评分页进入/提交 → 播放页回到讨论tab(a266 已评态)
 */
export const playerSync: { showId: string | null; ep: number | null; discussKey: string | null } = {
  showId: null,
  ep: null,
  discussKey: null,
};
