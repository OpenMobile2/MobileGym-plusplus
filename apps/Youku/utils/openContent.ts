/**
 * spec.scope.contentRouting(冻结拍板)——内容卡通用路由:
 *   电影 → player.main(/player)
 *   剧集/综艺/动漫/少儿(多集) → player.series.main(/player/series)
 *   短视频 → shorts.feed(/shorts)
 *   短剧 → shorts.dramaList(/shorts/dramas)
 *
 * 实现方式(nav checker 铁律:transitionId 必须是绑定处的字符串字面量):
 * 声明层给每条内容卡 transition 配了统一的 4 分支 cases(按运行时参数 ctype 分流),
 * 页面侧保持字面量调用,由本工具函数产出参数:
 *
 *   const { bindTap } = useYoukuGestures();
 *   <div {...bindTap('home.main.card.player.open', { params: contentNavParams(item) })} />
 *   // 或命令式:go('home.main.card.player.open', contentNavParams(item))
 *
 * buildSearchParams 只会把命中分支声明过的 searchParams 写进 URL,
 * 因此 contentNavParams 同时携带 videoId/showId/shortId/dramaId 是安全的。
 */

export type ContentType = 'movie' | 'series' | 'variety' | 'anime' | 'kids' | 'short' | 'drama';

/** 路由分流用的四类 */
export type ContentCase = 'movie' | 'series' | 'short' | 'drama';

export interface ContentLike {
  id: string;
  type: ContentType | string;
}

/** item.type → 路由分支(剧集/综艺/动漫/少儿统一走 series 播放页) */
export function contentCase(type: string): ContentCase {
  if (type === 'movie') return 'movie';
  if (type === 'short') return 'short';
  if (type === 'drama') return 'drama';
  return 'series';
}

/**
 * 产出内容卡跳转参数(供 go()/bindTap params 使用)。
 * @param extra 额外参数(如 { ep: '2' } 定位集数、{ commentId } 定位评论)
 */
export function contentNavParams(
  item: ContentLike,
  extra?: Record<string, string | number>,
): Record<string, string | number> {
  return {
    ctype: contentCase(String(item.type)),
    videoId: item.id,
    showId: item.id,
    shortId: item.id,
    dramaId: item.id,
    ...(extra ?? {}),
  };
}
