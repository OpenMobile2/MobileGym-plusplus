// 榜单页。节点 rank.page(spec v1.3.0,7 条交互)。
// 视觉证据:801 电视剧榜(返回 + 「榜单」标题 + 以片找片 + 「电视剧∨」分类下拉 + 5 个榜 tab +
// 「{s.rankSortByHeat}」+ 名次角标压在海报左上 + 标题右侧火苗热度值 + 讨论/评分/题材 chip 行 +
// 「{s.rankLongpressHint}」引导)、797 动漫榜(tab 顺序不同)、750 短剧榜(分类=短剧,含竖屏双榜)。
import React, { useEffect, useMemo } from 'react';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTvQuery } from '../hooks/useTvParams';
import { useTencentvideoStore } from '../state';
import { TV_COLORS as C } from '../constants';
import { HeatValue } from '../components/channel';
import { TvImg } from '../components/Img';
import { Badge } from '../components/ui';
import type { BindProps } from '../components/ui';
import type { TvContent, TvRankEntry } from '../types';
import { IcArrowDown, IcNavBack } from '../res/icons';

/** 分类下拉的档位 = rankings 的四组种子(证据 801 电视剧∨ / 797 动漫∨ / 750 短剧∨) */
const RANK_CATEGORIES = [
  { key: 'tv', label: '电视剧' },
  { key: 'anime', label: '动漫' },
  { key: 'shortdrama', label: '短剧' },
  { key: 'kids', label: '少儿' },
] as const;

/** 电视剧榜 tab 顺序(证据 801;rankings.tv 种子没带 tabOrder,故在此固化真机顺序) */
const TV_TABS = ['热播榜', '热搜榜', '飙升榜', '期待榜', 'N刷榜'];
/** 少儿榜种子只有热播一组 */
const KIDS_TABS = ['热播榜'];

/** tab 文案 → rankings.<cat> 下的字段名 */
const FIELD_BY_TAB: Record<string, Record<string, string>> = {
  tv: { 热播榜: 'hot', 热搜榜: 'search', 飙升榜: 'rising', 期待榜: 'expect', N刷榜: 'nshua' },
  anime: { 热播榜: 'hot', 热搜榜: 'search' },
  shortdrama: {
    热播榜: 'verticalHot',
    热搜榜: 'verticalSearch',
    竖屏热播榜: 'verticalHot',
    竖屏热搜榜: 'verticalSearch',
  },
  kids: { 热播榜: 'hot' },
};

const UI_CATEGORY = 'rank.page.category';
const UI_TAB = 'rank.page.tab';
const UI_CAT_OPEN = 'rank.page.categoryOpen';

/** 榜单条目统一形状:种子里既有 {id,heat,note} 也有纯 id 串 */
interface RankItem {
  id: string;
  heat?: number;
  note?: string;
}

function normalize(raw: unknown): RankItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((e) =>
    typeof e === 'string' ? { id: e } : { id: (e as TvRankEntry).id, heat: (e as TvRankEntry).heat, note: (e as TvRankEntry).note },
  );
}

export default function RankPagePage() {
  const { bindTap, bindLongPress, bindBack } = useTencentvideoGestures();
  const s = useTencentvideoStrings();

  const contents = useTencentvideoStore((st) => st.contents);
  const rankings = useTencentvideoStore((st) => st.rankings);
  const wontfixToast = useTencentvideoStore((st) => st.wontfixToast);
  const ui = useTencentvideoStore((st) => st.ui);
  const toast = useTencentvideoStore((st) => st.toast);
  const setUi = useTencentvideoStore((st) => st.setUi);
  const openPlayback = useTencentvideoStore((st) => st.openPlayback);

  const rankParam = useTvQuery('rank');

  // 入口(频道金刚位/首页榜单角标/搜索榜卡)带 ?rank= 指定初始榜单分类
  useEffect(() => {
    if (!rankParam) return;
    const hit = RANK_CATEGORIES.find((c) => c.key === rankParam || c.label === rankParam);
    if (hit) setUi(UI_CATEGORY, hit.key);
  }, [rankParam, setUi]);

  useEffect(() => {
    setUi(UI_CAT_OPEN, false);
  }, [setUi]);

  const uiCat = ui[UI_CATEGORY];
  const categoryKey =
    typeof uiCat === 'string' && RANK_CATEGORIES.some((c) => c.key === uiCat)
      ? uiCat
      : RANK_CATEGORIES[0].key;
  const categoryLabelOf = (key: string) => {
    const map: Record<string, string> = {
      tv: s.rankCatTv,
      anime: s.rankCatAnime,
      shortdrama: s.rankCatShortdrama,
      kids: s.rankCatKids,
    };
    return map[key] ?? '';
  };
  const rankTabLabel = (t: string) => {
    const map: Record<string, string> = {
      热播榜: s.rankTabHot,
      热搜榜: s.rankTabSearch,
      飙升榜: s.rankTabSoar,
      期待榜: s.rankTabExpect,
      N刷榜: s.rankTabNshua,
      竖屏热播榜: s.rankTabHot,
      竖屏热搜榜: s.rankTabSearch,
    };
    return map[t] ?? t;
  };
  const categoryLabel = categoryLabelOf(categoryKey);
  const catOpen = ui[UI_CAT_OPEN] === true;

  const group = useMemo(
    () => (rankings as unknown as Record<string, Record<string, unknown>>)[categoryKey] ?? {},
    [rankings, categoryKey],
  );

  const tabs = useMemo(() => {
    const seeded = group.tabOrder;
    const candidates = Array.isArray(seeded)
      ? seeded as string[]
      : categoryKey === 'kids' ? KIDS_TABS : TV_TABS;
    // 没有独立榜单数据的 tab 直接收起，不能拿另一榜单轮转冒充。
    return candidates.filter((tab) => {
      const field = FIELD_BY_TAB[categoryKey]?.[tab];
      return normalize(field ? group[field] : undefined).length > 0;
    });
  }, [categoryKey, group]);

  const uiTab = ui[UI_TAB];
  const activeTab = typeof uiTab === 'string' && tabs.includes(uiTab) ? uiTab : tabs[0];

  const byId = useMemo(() => {
    const m = new Map<string, TvContent>();
    for (const c of contents) m.set(c.id, c);
    return m;
  }, [contents]);

  const rows = useMemo(() => {
    const field = FIELD_BY_TAB[categoryKey]?.[activeTab];
    return normalize(field ? group[field] : undefined)
      .map((r) => ({ item: r, content: byId.get(r.id) }))
      .filter((x): x is { item: RankItem; content: TvContent } => x.content !== undefined);
  }, [categoryKey, activeTab, group, byId]);

  /** 短剧榜条目直进竖屏播放器(spec Q7);其余进剧集详情。bindTap 提到分支外,避免 fromSearchTooBroad 误报 */
  const openShortdramaFromRank = (contentId: string): BindProps =>
    bindTap('shortdrama.player.open.fromRank', {
      params: { contentId },
      beforeTrigger: () => openPlayback(contentId, 1),
    });
  const openSeriesFromRank = (contentId: string): BindProps =>
    bindTap('detail.series.open.fromRank', { params: { contentId } });
  const rowNavBind = (contentId: string): BindProps =>
    categoryKey === 'shortdrama' ? openShortdramaFromRank(contentId) : openSeriesFromRank(contentId);

  return (
    <div className="flex flex-col h-full" style={{ background: C.pageBg }}>
      {/* 顶栏:返回 + 「榜单」+ 以片找片(证据 801;「筛选」入口 spec 未申报去向,不建交互) */}
      <div className="flex items-center gap-3 h-11 px-2 shrink-0">
        <button
          {...bindBack()}
          className="bg-transparent border-none p-1"
          style={{ color: C.text }}
          aria-label={s.back}
        >
          <IcNavBack size={22} />
        </button>
        <span className="text-[17px] font-bold" style={{ color: C.text }}>
          榜单
        </span>
        <button
          {...bindTap('findfilm.page.open.fromRank')}
          className="bg-transparent border-none p-0 text-[15px]"
          style={{ color: C.textSub }}
        >
          以片找片
        </button>
      </div>

      {/* 分类下拉 + 榜单 tab 横滑 */}
      <div className="flex items-center gap-2 px-3 pb-1 shrink-0">
        <button
          {...bindTap({ kind: 'action', id: 'rank.page.category.switch' }, {
            onTrigger: () => setUi(UI_CAT_OPEN, !catOpen),
          })}
          className="shrink-0 inline-flex items-center gap-0.5 bg-transparent border-none p-0 text-[14px]"
          style={{ color: C.text }}
        >
          {categoryLabel}
          <IcArrowDown size={14} />
        </button>
        <div
          className="flex-1 min-w-0 flex gap-1.5 overflow-x-auto scrollbar-none"
          data-scroll-container="tabs"
          data-scroll-direction="horizontal"
        >
          {tabs.map((t) => {
            const on = t === activeTab;
            return (
              <button
                key={t}
                {...bindTap({ kind: 'action', id: 'rank.page.tab.switch' }, {
                  params: { tab: t },
                  onTrigger: () => setUi(UI_TAB, t),
                })}
                className="shrink-0 h-7 px-3 rounded-full border-none text-[14px] whitespace-nowrap"
                style={
                  on
                    ? { background: C.primaryBg, color: C.primary, fontWeight: 600 }
                    : { background: 'transparent', color: C.text }
                }
              >
                {rankTabLabel(t)}
              </button>
            );
          })}
        </div>
      </div>

      {/* 分类选择展开态 */}
      {catOpen && (
        <div className="px-3 pb-2 flex gap-2 shrink-0">
          {RANK_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              {...bindTap({ kind: 'action', id: 'rank.page.category.switch' }, {
                params: { category: cat.key },
                onTrigger: () => {
                  setUi(UI_CATEGORY, cat.key);
                  setUi(UI_TAB, '');
                  setUi(UI_CAT_OPEN, false);
                },
              })}
              className="px-3 h-7 rounded-full border-none text-[13px]"
              style={
                cat.key === categoryKey
                  ? { background: C.primaryBg, color: C.primary }
                  : { background: C.chipGray, color: C.textSub }
              }
            >
              {categoryLabelOf(cat.key)}
            </button>
          ))}
        </div>
      )}

      <div className="px-3 pb-1 text-[11px] shrink-0" style={{ color: C.textSub }}>
        {s.rankSortByHeat}
      </div>

      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {rows.map(({ item, content }, i) => {
          const rank = i + 1;
          const heat = item.heat ?? content.heat;
          // 去重:榜单条目的 note 常常就是该片的 tag(「爱情」),重了会同一行出现两枚一样的 chip
          const chips = [
            ...new Set(
              [
                item.note,
                typeof content.followText === 'string' ? content.followText : undefined,
                typeof content.discussText === 'string' ? content.discussText : undefined,
                typeof content.rating === 'number' && Number.isFinite(content.rating)
                  ? `评分 ${content.rating.toFixed(1)}`
                  : undefined,
                ...content.tags,
              ].filter((t): t is string => typeof t === 'string' && t.length > 0),
            ),
          ];
          const meta = [content.year, content.region, content.episodes ? `全${content.episodes}集` : '']
            .filter((t) => t !== undefined && t !== '')
            .join(' ');
          return (
            <div
              key={content.id}
              // 整行:tap 进详情 / 长按 = 「{s.rankLongpressHint}」引导(证据 801,功能未开放)
              {...bindLongPress({ kind: 'action', id: 'rank.page.longpress.wontfix' }, {
                onTrigger: () => toast(s.notOpen),
              })}
              {...rowNavBind(content.id)}
              className="flex gap-2.5 px-3 py-2.5 cursor-pointer"
            >
              <div className="relative w-[58px] h-[78px] rounded-md overflow-hidden shrink-0">
                <TvImg id={content.poster} alt={content.title} className="w-full h-full object-cover" />
                <span
                  className="absolute top-0 left-0 min-w-[16px] px-1 text-center text-[11px] font-bold italic leading-[17px] text-white rounded-br-[6px]"
                  style={{ background: rank <= 3 ? C.badgeOrange : C.maskBadge }}
                >
                  {rank}
                </span>
                {content.badge && (
                  <div className="absolute top-0 right-0">
                    <Badge text={content.badge} className="rounded-none rounded-bl-[6px]" />
                  </div>
                )}
                {content.year && (
                  <span className="absolute bottom-0 left-0 px-1 text-[9px] leading-[13px] text-white/85">
                    {content.year}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0 text-[16px] font-semibold truncate" style={{ color: C.text }}>
                    {content.title}
                  </div>
                  {rank === 1 && (
                    <span className="shrink-0 text-[12px] pointer-events-none" style={{ color: C.textSub }}>
                      {s.rankLongpressHint}
                    </span>
                  )}
                  {heat !== undefined && <HeatValue heat={heat} />}
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {chips.slice(0, 4).map((t) => (
                    <span
                      key={t}
                      className="px-1.5 py-[2px] rounded text-[11px] leading-none"
                      style={{ background: C.chipGray, color: C.textSub }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div className="text-[11px] mt-1 truncate" style={{ color: C.textSub }}>
                  {meta}
                </div>
                <div className="text-[12px] mt-0.5 truncate" style={{ color: C.text }}>
                  {content.recommend ?? content.desc}
                </div>
              </div>
            </div>
          );
        })}
        <div className="h-6" />
      </div>
    </div>
  );
}
