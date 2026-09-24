// 搜索中间页(榜单/找片双 tab + 历史)。节点 search.hub(spec v1.0.0,13 条交互)。
// 视觉证据:843(搜索条 placeholder + 语音 icon + 取消;榜单 tab 横滑榜卡:热搜HOT / 电视剧TV SERIES,
// 卡内 1-10 名 = 序号方标 + 竖版缩略图 + 词条 + 热度/讨论 chip + 「年份 品类 主演」行)、
// 858(横滑到第二三张卡:电视剧/电影,右上角「›」进榜单页)、f_005(继续横滑:动漫/少儿)、
// f_034(找片 tab:历史行「历史 + chips + 垃圾桶」在最上,tab 行下面是 分类/类型/排序 三行 chip
//        + 三列宫格结果,卡片左上年份、右上角标、右下集数)。
//
// 口径锁定(spec note):榜单/找片/联想都在同一界面内切换,「提交」才进 search.result;
// 无匹配词提交进 search.empty。输入即时联想是独立路由 /search/suggest(同界面的 overlay 态)。
import React, { useMemo, useRef } from 'react';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTencentvideoStore } from '../state';
import { RANK_BOARD_BY_CATEGORY, TV_COLORS as C } from '../constants';
import { FacetRow, GridResultCard, SearchTopBar, TextTabRow, searchHasMatch } from '../components/search';
import { TvImg } from '../components/Img';
import type { BindProps } from '../components/ui';
// res/icons.tsx 没有垃圾桶图标,按 brief §4「挑语义最近的现有图标」用 IcBan(清除/禁用)代替
import { IcArrowRight, IcBan, IcComment, IcHeat, IcSearch } from '../res/icons';
import type { TvContent } from '../types';

/** 页内离散 UI 态(brief §3:一律走 store.ui,不进 URL) */
const UI_TAB = 'search.hub.tab';
const UI_CATEGORY = 'search.hub.find.category';
const UI_TYPE = 'search.hub.find.type';
const UI_SORT = 'search.hub.find.sort';

/** 结构性标签:内部 state 键(中文)与显示分离 */
const KEY_ALL = '全部';
const KEY_SORT_HOT = '最热';
const KEY_SORT_NEW = '最新上架';
const KEY_SORT_SCORE = '高分好评';
const KEY_TYPE = '类型';
/** 找片 tab 分类行(证据 f_034 第一行;显示名 → contents.category) */
const FIND_CATEGORIES = ['电视剧', '电影', '综艺', '少儿', '动漫', '纪录片', '短剧'] as const;
/** 榜卡英文副名(证据 843/858/f_005 标题右侧灰色小字) */
const BOARD_EN: Record<string, string> = {
  热搜: 'HOT',
  电视剧: 'TV SERIES',
  电影: 'MOVIE',
  动漫: 'ANIMATION',
  少儿: 'CHILDREN',
  短剧: 'SHORT DRAMA',
};

/** 显示分类名 → contents.category(真机把「剧集」叫「电视剧」,同 RANK_BOARD_BY_CATEGORY 口径) */
const CATEGORY_OF_LABEL: Record<string, string> = { 电视剧: '剧集' };

/** 热度数字 → 真机文案「实时热度超2.5万」(证据 843:百花杀 heat 25452 → 2.5万) */
function heatText(heat: number | undefined): string {
  if (!heat) return '';
  return `实时热度超${(heat / 10000).toFixed(1)}万`;
}

/** 榜卡/热搜条目的「年份 品类 主演…」行(证据 843「2026 电视剧 何与 孟子义 孔雪儿 叶…」) */
function metaLine(c: TvContent): string {
  const board = RANK_BOARD_BY_CATEGORY[c.category] || c.category;
  const cast = (c.cast ?? []).map((m) => m.name).join(' ');
  return [c.year, board, cast].filter(Boolean).join(' ');
}

interface BoardDef {
  /** 榜名(同时用作 rank.page 的 rank 参数) */
  name: string;
  rows: { key: string; word: string; content?: TvContent }[];
}

export default function SearchHubPage() {
  const { bindTap, bindBack, go } = useTencentvideoGestures();
  const s = useTencentvideoStrings();

  const searchHub = useTencentvideoStore((s) => s.searchHub);
  const hotSearch = useTencentvideoStore((s) => s.hotSearch);
  const rankings = useTencentvideoStore((s) => s.rankings);
  const contents = useTencentvideoStore((s) => s.contents);
  const search = useTencentvideoStore((s) => s.search);
  const ui = useTencentvideoStore((s) => s.ui);
  const wontfixToast = useTencentvideoStore((s) => s.wontfixToast);

  const toast = useTencentvideoStore((s) => s.toast);
  const setUi = useTencentvideoStore((s) => s.setUi);
  const setSearchInput = useTencentvideoStore((s) => s.setSearchInput);
  const submitSearch = useTencentvideoStore((s) => s.submitSearch);
  const clearSearchHistory = useTencentvideoStore((s) => s.clearSearchHistory);

  const boardScrollRef = useRef<HTMLDivElement>(null);

  const activeTab = (ui[UI_TAB] as string) || searchHub.midTabs[0];
  const category = (ui[UI_CATEGORY] as string) || KEY_ALL;
  const typeChip = (ui[UI_TYPE] as string) || KEY_ALL;
  const sort = (ui[UI_SORT] as string) || KEY_SORT_HOT;

  const sortLabel = (v: string) =>
    v === KEY_SORT_HOT ? s.searchSortHot : v === KEY_SORT_NEW ? s.searchSortNew : v === KEY_SORT_SCORE ? s.searchSortScore : v;
  const findSorts = [KEY_SORT_HOT, KEY_SORT_NEW, KEY_SORT_SCORE] as const;

  const byId = useMemo(() => {
    const m = new Map<string, TvContent>();
    for (const c of contents) m.set(c.id, c);
    return m;
  }, [contents]);

  /**
   * 热搜词 → 内容:种子里 hotSearch 是词(「千芳劫百花宴刺杀」),缩略图/热度/主演行要靠
   * 内容库补齐,所以按「词里包含片名」取最长命中(确定性,无随机)。
   */
  const contentOfWord = useMemo(() => {
    return (word: string): TvContent | undefined => {
      let hit: TvContent | undefined;
      for (const c of contents) {
        if (!word.includes(c.title)) continue;
        if (!hit || c.title.length > hit.title.length) hit = c;
      }
      return hit;
    };
  }, [contents]);

  /** 榜卡:热搜(hotSearch 全 10 条)+ 分类榜(searchHub.boards / rankings) */
  const boards = useMemo<BoardDef[]>(() => {
    const fromIds = (name: string, ids: string[]): BoardDef => ({
      name,
      rows: ids
        .map((id) => byId.get(id))
        .filter((c): c is TvContent => c !== undefined)
        .map((c) => ({ key: c.id, word: c.title, content: c })),
    });
    return [
      {
        name: '热搜',
        rows: hotSearch.map((h) => ({
          key: `${h.rank}`,
          word: h.keyword,
          content: contentOfWord(h.keyword),
        })),
      },
      fromIds('电视剧', searchHub.boards.tv ?? []),
      fromIds('电影', searchHub.boards.movie ?? []),
      fromIds('动漫', rankings.anime.hot.map((e) => e.id)),
      fromIds('少儿', rankings.kids.hot),
      fromIds('短剧', rankings.shortdrama.verticalHot.map((e) => e.id)),
    ].filter((b) => b.rows.length > 0);
  }, [hotSearch, contentOfWord, byId, searchHub.boards, rankings]);

  /* ---------- 找片 tab ---------- */

  const categoryPool = useMemo(() => {
    if (category === KEY_ALL) return contents;
    const key = CATEGORY_OF_LABEL[category] ?? category;
    return contents.filter((c) => c.category === key);
  }, [contents, category]);

  /** 类型行 = 当前分类池里出现过的题材标签(证据 f_034「爱情 都市 青春 奇幻 武侠 古装 科幻…」) */
  const typeOptions = useMemo(() => {
    const count = new Map<string, number>();
    for (const c of categoryPool) for (const t of c.tags) count.set(t, (count.get(t) ?? 0) + 1);
    const sorted = [...count.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    return [KEY_ALL, ...sorted.slice(0, 12).map(([t]) => t)];
  }, [categoryPool]);

  const findResults = useMemo(() => {
    const pool = typeChip === KEY_ALL
      ? categoryPool
      : categoryPool.filter((c) => c.tags.includes(typeChip));
    const list = [...pool];
    if (sort === KEY_SORT_HOT) list.sort((a, b) => (b.heat ?? 0) - (a.heat ?? 0));
    else if (sort === KEY_SORT_NEW) list.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
    else list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    return list.slice(0, 18);
  }, [categoryPool, typeChip, sort]);

  /* ---------- 提交 ---------- */

  const hasMatch = (q: string): boolean => searchHasMatch(contents, q);

  const submitWord = search.input.trim();

  const submit = () => {
    if (!submitWord) return;
    submitSearch(submitWord);
    if (hasMatch(submitWord)) go('search.result.open.fromHub');
    else go('search.empty.open.fromHub');
  };

  /** 输入即进联想态(spec:type → search.suggest.open.fromInput) */
  const onInput = (v: string) => {
    setSearchInput(v);
    if (v.trim()) go('search.suggest.open.fromInput');
  };

  const findFilterBind = (key: string, value: string): BindProps =>
    bindTap({ kind: 'action', id: 'search.hub.findfilter.select' }, {
      onTrigger: () => setUi(key, value),
    });

  return (
    <div className="flex flex-col h-full" style={{ background: C.pageBg }} data-status-bar-foreground="dark">
      <SearchTopBar
        value={search.input}
        placeholder={searchHub.placeholder}
        onValueChange={onInput}
        onSubmit={submit}
        voiceBind={bindTap({ kind: 'action', id: 'search.hub.voice.wontfix' }, {
          onTrigger: () => toast(s.notOpen),
        })}
        cancelBind={bindBack()}
        cancelLabel={s.searchCancel}
        autoFocus
      />

      {/* 有词时露出提交行 —— 真机是系统键盘右下的蓝色「搜索」键(证据 843),web 端没有系统键盘,
          故把「键盘搜索键」落成搜索条下的同语义提交行:命中进 result、不命中进 empty。 */}
      {submitWord !== '' && (
        <button
          {...(hasMatch(submitWord)
            ? bindTap('search.result.open.fromHub', {
              beforeTrigger: () => submitSearch(submitWord),
            })
            : bindTap('search.empty.open.fromHub', {
              beforeTrigger: () => submitSearch(submitWord),
            }))}
          className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-transparent border-none text-left text-[14px]"
          style={{ color: C.textSub }}
        >
          <IcSearch size={15} />
          <span>
            {s.searchSubmit} <span style={{ color: C.primary }}>{submitWord}</span>
          </span>
        </button>
      )}

      {/* 历史行(有历史时才出现,证据 f_034) */}
      {searchHub.history.length > 0 && (
        <div className="shrink-0 px-3 pt-1 pb-2">
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-semibold" style={{ color: C.text }}>
              {s.searchHistory}
            </span>
            <button
              {...bindTap({ kind: 'action', id: 'search.hub.history.clear' }, {
                onTrigger: () => clearSearchHistory(),
              })}
              className="bg-transparent border-none p-1"
              style={{ color: C.textSub }}
              aria-label={s.searchClearHistory}
            >
              <IcBan size={16} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 pt-1.5">
            {searchHub.history.map((h) => (
              <button
                key={h}
                {...bindTap('search.result.open.fromHistory', {
                  beforeTrigger: () => submitSearch(h),
                })}
                className="px-3 py-1 rounded-full text-[13px] border-none"
                style={{ background: C.chipGray, color: C.text }}
              >
                {h}
              </button>
            ))}
          </div>
        </div>
      )}

      <TextTabRow
        tabs={searchHub.midTabs}
        activeTab={activeTab}
        getTabBind={(t) =>
          bindTap({ kind: 'action', id: 'search.hub.tab.switch' }, {
            onTrigger: () => setUi(UI_TAB, t),
          })
        }
      />

      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {activeTab === searchHub.midTabs[0] ? (
          /* ---------- 榜单 tab:横滑榜卡 ---------- */
          <div
            ref={boardScrollRef}
            {...bindTap({ kind: 'action', id: 'search.hub.rankCards.swipe' }, {
              onTrigger: () =>
                boardScrollRef.current?.scrollBy({ left: 258, behavior: 'smooth' }),
            })}
            className="flex gap-2.5 overflow-x-auto scrollbar-none px-3 py-2 items-start"
            data-scroll-container="rankCards"
            data-scroll-direction="horizontal"
          >
            {boards.map((b) => (
              <div
                key={b.name}
                /* 卡宽 248 ≈ 真机 843 里榜卡占屏 0.68,右侧刚好露出下一张卡的书脊 */
                className="shrink-0 w-[248px] rounded-xl overflow-hidden"
                style={{ background: C.pageBg, border: `1px solid ${C.chipGray}` }}
              >
                <div className="flex items-center gap-1 px-3 pt-2.5 pb-1">
                  <span className="text-[17px] font-bold" style={{ color: C.badgeOrange }}>
                    {b.name}
                  </span>
                  <span className="text-[10px] font-semibold" style={{ color: C.rankChipText }}>
                    {BOARD_EN[b.name] ?? ''}
                  </span>
                  <span className="flex-1" />
                  <button
                    {...bindTap('rank.page.open.fromSearchHub', {
                      params: { rank: b.name },
                      stopPropagation: true,
                    })}
                    className="bg-transparent border-none p-0"
                    style={{ color: C.textSub }}
                    aria-label={`${b.name}榜单`}
                  >
                    <IcArrowRight size={16} />
                  </button>
                </div>
                {b.rows.slice(0, 10).map((row, i) => {
                  const c = row.content;
                  // 热搜条目 = 以该词发起搜索;分类榜条目 = 整卡进榜单页(spec 只给这两条口径)
                  const rowBind =
                    b.name === '热搜'
                      ? bindTap('search.result.open.fromHotword', {
                        stopPropagation: true,
                        beforeTrigger: () => submitSearch(row.word),
                      })
                      : c
                        ? bindTap('detail.series.open.fromSearchFind', {
                          params: { contentId: c.id },
                          stopPropagation: true,
                        })
                        : bindTap('rank.page.open.fromSearchHub', {
                          params: { rank: b.name },
                          stopPropagation: true,
                        });
                  return (
                    <div
                      key={row.key}
                      {...rowBind}
                      className="flex gap-2 px-3 py-1.5 cursor-pointer"
                    >
                      <div className="relative w-[38px] h-[52px] rounded overflow-hidden shrink-0">
                        <TvImg
                          id={c?.poster}
                          alt={row.word}
                          className="w-full h-full object-cover"
                        />
                        <span
                          className="absolute top-0 left-0 w-[15px] h-[15px] flex items-center justify-center text-[10px] font-bold text-white rounded-br-[5px]"
                          style={{ background: i < 3 ? C.badgeOrange : C.maskBadge }}
                        >
                          {i + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-medium truncate" style={{ color: C.text }}>
                          {row.word}
                        </div>
                        <div className="flex items-center gap-1 mt-1 overflow-hidden">
                          {/* 真机 843/f_005 的 chip 左侧带小图标:讨论=气泡、热度=火苗 */}
                          {c?.discussText && (
                            <span
                              className="shrink-0 inline-flex items-center gap-[2px] px-1 py-[1px] rounded text-[10px] leading-[14px]"
                              style={{ background: C.rankChipBg, color: C.rankChipText }}
                            >
                              <IcComment size={9} />
                              {c.discussText}
                            </span>
                          )}
                          {c?.heat !== undefined && (
                            <span
                              className="shrink-0 inline-flex items-center gap-[2px] px-1 py-[1px] rounded text-[10px] leading-[14px]"
                              style={{ background: C.rankChipBg, color: C.rankChipText }}
                            >
                              <IcHeat size={9} />
                              {heatText(c.heat)}
                            </span>
                          )}
                        </div>
                        {c && (
                          <div className="text-[11px] truncate mt-1" style={{ color: C.textSub }}>
                            {metaLine(c)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          /* ---------- 找片 tab:分类/类型/排序 + 三列宫格 ---------- */
          <>
            {/* f_034:找片的维度行不带胶囊底,维度名灰字、选中项青字 */}
            <FacetRow
              options={[KEY_ALL, ...FIND_CATEGORIES]}
              active={category}
              getBind={(o) => findFilterBind(UI_CATEGORY, o)}
              variant="text"
              getLabel={(o) => (o === KEY_ALL ? s.searchCategoryAll : o)}
            />
            <FacetRow
              label={s.searchType}
              options={typeOptions}
              active={typeChip}
              getBind={(o) => findFilterBind(UI_TYPE, o)}
              variant="text"
              getLabel={(o) => (o === KEY_ALL ? s.searchCategoryAll : o)}
            />
            <FacetRow
              options={findSorts}
              active={sort}
              getBind={(o) => findFilterBind(UI_SORT, o)}
              variant="text"
              getLabel={sortLabel}
            />
            <div className="grid grid-cols-3 gap-x-2 gap-y-3 px-3 pt-2 pb-6">
              {findResults.map((c) => (
                <GridResultCard
                  key={c.id}
                  content={c}
                  bind={bindTap('detail.series.open.fromSearchFind', {
                    params: { contentId: c.id },
                  })}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
