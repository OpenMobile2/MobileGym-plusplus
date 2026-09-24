// 筛选页。节点 filter.page(spec v1.0.0,9 条交互)。
// 视觉证据:795(电视剧:顶栏「‹ 榜单 筛选 以片找片」+ 分类 tab 横滑行 + 排序行(最热/最新上架/高分好评)
// + 维度行(类型/资费/地区/年份,左侧维度名做成淡青胶囊)+ 居中「展开∨」+ 三列结果宫格:
// 海报左上年份、右上角标、右下更新进度、标题、演员行、米黄 chip(讨论破500万/评分9.4))、
// 794(综艺:排序为 最热/最近更新/高分好评,多「出品」「明星」两行,明星行是人名)、
// 796(动漫:多「状态」「画风」两行)、749(短剧:排序 最热/最新上架/限免中,维度 偏好/故事背景/
// 身份人设/主要看点;结果卡左下热度值 🔥10480、右下全N集,标题下再挂一个题材 chip)。
//
// 维度取值口径:defaults 只给了短剧的 filter.dims(channels.shortdrama.filter),其余分类的维度
// 由内容库现算(tags/region/year/badge/producer/更新进度),保证 chip 一定筛得出结果。
import React, { useEffect, useMemo } from 'react';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTvQuery } from '../hooks/useTvParams';
import { useTencentvideoStore } from '../state';
import { TV_COLORS as C } from '../constants';
import { FacetRow, GridResultCard } from '../components/search';
import type { BindProps } from '../components/ui';
import { IcArrowDown, IcComment, IcFollow, IcNavBack, IcStar } from '../res/icons';
import type { TvContent } from '../types';

const UI_CATEGORY = 'filter.page.category';
const UI_SORT = 'filter.page.sort';
const UI_DIM_PREFIX = 'filter.page.dim.';
const UI_STAR = 'filter.page.star';
const UI_EXPANDED = 'filter.page.dimsExpanded';

const sortKey = (category: string) => `${UI_SORT}.${category}`;
const dimKey = (category: string, label: string) => `${UI_DIM_PREFIX}${category}.${label}`;
const starKey = (category: string) => `${UI_STAR}.${category}`;

/** 结构性标签(spec 未给种子,证据 795/794/796/749 逐字抄录) */
const LABEL_RANK_TAB = '榜单';
const LABEL_FILTER_TAB = '筛选';
const LABEL_FINDFILM_TAB = '以片找片';
const LABEL_EXPAND = '展开';
const LABEL_COLLAPSE = '收起';
const DIM_TYPE = '类型';
const DIM_PRICE = '资费';
const DIM_REGION = '地区';
const DIM_YEAR = '年份';
const DIM_PRODUCER = '出品';
const DIM_STATUS = '状态';
const DIM_STAR = '明星';
/** 资费三档(证据 795「免费 限免 会员」) */
const PRICE_FREE = '免费';
const PRICE_LIMITED = '限免';
const PRICE_VIP = '会员';
/** 更新状态三档(证据 796「即将上线 更新中 已完结」) */
const STATUS_SOON = '即将上线';
const STATUS_UPDATING = '更新中';
const STATUS_DONE = '已完结';
/** 通用排序(证据 795);综艺第二档是「最近更新」(证据 794);短剧走种子 channels.shortdrama.filter.sorts */
const DEFAULT_SORTS = ['最热', '最新上架', '高分好评'] as const;
const VARIETY_SORTS = ['最热', '最近更新', '高分好评'] as const;
/** 折叠态露出的维度行数(证据 795:折叠时露 4 行 + 展开∨) */
const COLLAPSED_DIMS = 4;

/** 分类 tab 显示名 → contents.category(真机把「剧集」叫「电视剧」) */
const CATEGORY_TABS = ['电视剧', '电影', '综艺', '纪录片', '动漫', '少儿', '短剧', '短番'] as const;
const CATEGORY_OF_LABEL: Record<string, string> = { 电视剧: '剧集' };

/** 内容资费档:优先看角标,其次看 vipFrom(证据 795 资费行) */
function priceOf(c: TvContent): string {
  if (c.badge === PRICE_LIMITED || typeof c.freeUpTo === 'number') return PRICE_LIMITED;
  if (c.badge === PRICE_VIP || c.badge === 'VIP' || c.vipFrom !== undefined) return PRICE_VIP;
  return PRICE_FREE;
}

/** 内容更新状态(证据 796 状态行) */
function statusOf(c: TvContent): string {
  const total = c.episodes ?? 0;
  const upTo = c.updatedTo ?? 0;
  if (upTo === 0) return STATUS_SOON;
  return upTo >= total ? STATUS_DONE : STATUS_UPDATING;
}

interface DimDef {
  label: string;
  options: string[];
  match: (c: TvContent, value: string) => boolean;
}

export default function FilterPagePage() {
  const { bindTap, bindBack } = useTencentvideoGestures();
  const s = useTencentvideoStrings();

  const contents = useTencentvideoStore((s) => s.contents);
  const channels = useTencentvideoStore((s) => s.channels);
  const ui = useTencentvideoStore((s) => s.ui);
  const setUi = useTencentvideoStore((s) => s.setUi);
  const openPlayback = useTencentvideoStore((s) => s.openPlayback);

  // channel 是本路由申报过的 queryParams(金刚位/搜索条「筛选」入口带进来)
  const channelParam = useTvQuery('channel');
  const entryCategory =
    channelParam && CATEGORY_TABS.includes(channelParam as (typeof CATEGORY_TABS)[number])
      ? channelParam
      : null;

  // 每次从不同频道重新进入筛选页，都以本次入口参数为准；后续页内切分类不再被参数反复覆盖。
  useEffect(() => {
    if (entryCategory) setUi(UI_CATEGORY, entryCategory);
  }, [entryCategory, setUi]);

  const category =
    (ui[UI_CATEGORY] as string) ||
    entryCategory ||
    CATEGORY_TABS[0];
  const expanded = ui[UI_EXPANDED] === true;
  const star = category === '综艺' ? ((ui[starKey(category)] as string) ?? '') : '';

  const isShortDrama = category === '短剧';
  const shortFilter = channels.shortdrama?.filter;

  const pool = useMemo(() => {
    const key = CATEGORY_OF_LABEL[category] ?? category;
    return contents.filter((c) => c.category === key);
  }, [contents, category]);

  const sorts = useMemo<readonly string[]>(() => {
    if (isShortDrama && shortFilter) return shortFilter.sorts;
    return category === '综艺' ? VARIETY_SORTS : DEFAULT_SORTS;
  }, [isShortDrama, shortFilter, category]);
  const savedSort = ui[sortKey(category)] as string | undefined;
  const sort = savedSort && sorts.includes(savedSort) ? savedSort : sorts[0];

  /** 维度组:短剧走种子 dims,其余按内容库现算 */
  const dims = useMemo<DimDef[]>(() => {
    const uniq = (xs: (string | undefined)[]) =>
      [...new Set(xs.filter((x): x is string => !!x))];

    if (isShortDrama && shortFilter) {
      return Object.entries(shortFilter.dims)
        .map(([label, options]) => {
          const match = (c: TvContent, value: string) =>
            c.tags.includes(value) || (c.desc ?? '').includes(value) || c.title.includes(value);
          return {
            label,
            // 无内容命中的运营标签不展示，避免筛选结果固定空白。
            options: options.filter((option) => pool.some((c) => match(c, option))),
            match,
          };
        })
        .filter((dim) => dim.options.length > 0);
    }

    const tagCount = new Map<string, number>();
    for (const c of pool) for (const t of c.tags) tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
    const tags = [...tagCount.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 10)
      .map(([t]) => t);

    const list: DimDef[] = [
      { label: DIM_TYPE, options: tags, match: (c, v) => c.tags.includes(v) },
      {
        label: DIM_PRICE,
        options: uniq(pool.map(priceOf)),
        match: (c, v) => priceOf(c) === v,
      },
      {
        label: DIM_REGION,
        options: uniq(pool.map((c) => c.region)),
        match: (c, v) => c.region === v,
      },
      {
        label: DIM_YEAR,
        options: uniq(
          [...pool].sort((a, b) => (b.year ?? 0) - (a.year ?? 0)).map((c) => String(c.year ?? '')),
        ),
        match: (c, v) => String(c.year ?? '') === v,
      },
    ];

    const producers = uniq(pool.map((c) => (typeof c.producer === 'string' ? c.producer : undefined)));
    if (producers.length > 0) {
      list.push({
        label: DIM_PRODUCER,
        options: producers,
        match: (c, v) => c.producer === v,
      });
    }
    // 动漫多一行更新状态(证据 796)
    if (category === '动漫') {
      list.push({
        label: DIM_STATUS,
        options: uniq(pool.map(statusOf)),
        match: (c, v) => statusOf(c) === v,
      });
    }
    return list.filter((d) => d.options.length > 1);
  }, [isShortDrama, shortFilter, pool, category]);

  /** 明星行(仅综艺,证据 794:维度组末尾一行人名) */
  const stars = useMemo<string[]>(() => {
    if (category !== '综艺') return [];
    const names: string[] = [];
    for (const c of pool) {
      for (const m of c.cast ?? []) {
        if (!names.includes(m.name)) names.push(m.name);
      }
    }
    return names.slice(0, 10);
  }, [category, pool]);

  const dimValues = useMemo(() => {
    const out: Record<string, string> = {};
    for (const d of dims) {
      const saved = (ui[dimKey(category, d.label)] as string) ?? '';
      out[d.label] = d.options.includes(saved) ? saved : '';
    }
    return out;
  }, [category, dims, ui]);

  const results = useMemo(() => {
    let list = pool.filter((c) =>
      dims.every((d) => {
        const v = dimValues[d.label];
        return !v || d.match(c, v);
      }),
    );
    if (star) list = list.filter((c) => (c.cast ?? []).some((m) => m.name === star));
    if (isShortDrama && sort === '限免中') {
      list = list.filter((c) => typeof c.freeUpTo === 'number' || c.badge === PRICE_LIMITED);
    }
    const sorted = [...list];
    if (sort === '最热') sorted.sort((a, b) => (b.heat ?? 0) - (a.heat ?? 0));
    else if (sort === '高分好评') sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    else sorted.sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || (b.updatedTo ?? 0) - (a.updatedTo ?? 0));
    return sorted;
  }, [pool, dims, dimValues, star, isShortDrama, sort]);

  const visibleDims = expanded ? dims : dims.slice(0, COLLAPSED_DIMS);

  /** 维度 chip:再点一次取消选中(真机维度默认无选中态,证据 795) */
  const dimBind = (label: string, option: string): BindProps =>
    bindTap({ kind: 'action', id: 'filter.page.dim.select' }, {
      onTrigger: () => setUi(dimKey(category, label), dimValues[label] === option ? '' : option),
    });

  const resetFilters = () => {
    setUi(sortKey(category), sorts[0]);
    for (const d of dims) setUi(dimKey(category, d.label), '');
    setUi(starKey(category), '');
  };

  /** 结果卡副标题:主演行(证据 795「何与 孟子义 孔雪儿」) */
  const castLine = (c: TvContent) => (c.cast ?? []).map((m) => m.name).join(' ');

  /**
   * 结果卡下方 chip:讨论/在追/评分(证据 795),短剧给题材(证据 749)。
   * 795 里 chip 文字前都带一枚小图标(气泡/列表/星),这里按语义挑现有图标。
   */
  const cardChip = (c: TvContent): { icon: React.ReactNode; text: string } | null => {
    if (isShortDrama) {
      const t = c.tags.join('');
      return t ? { icon: null, text: t } : null;
    }
    if (typeof c.discussText === 'string') return { icon: <IcComment size={9} />, text: c.discussText };
    if (typeof c.followText === 'string') return { icon: <IcFollow size={9} />, text: c.followText };
    // 种子里 rating 可能是 null(如短剧/综艺),不能只判 undefined
    if (typeof c.rating === 'number' && Number.isFinite(c.rating)) {
      return { icon: <IcStar size={9} />, text: `评分 ${c.rating.toFixed(1)}` };
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full" style={{ background: C.pageBg }} data-status-bar-foreground="dark">
      {/* 顶栏:返回 + 三 tab。「榜单」在 /filter 上没有申报过 transition,按只读标签渲染 */}
      <div className="flex items-center h-11 px-2 shrink-0">
        <button
          {...bindBack()}
          className="bg-transparent border-none p-1"
          style={{ color: C.text }}
          aria-label={s.back}
        >
          <IcNavBack size={22} />
        </button>
        <div className="flex-1 flex items-center justify-center gap-5">
          <span className="text-[16px]" style={{ color: C.textSub }}>
            {LABEL_RANK_TAB}
          </span>
          <span className="text-[18px] font-bold" style={{ color: C.text }}>
            {LABEL_FILTER_TAB}
          </span>
          <button
            {...bindTap('findfilm.page.open.fromFilter')}
            className="bg-transparent border-none p-0 text-[16px]"
            style={{ color: C.textSub }}
          >
            {LABEL_FINDFILM_TAB}
          </button>
        </div>
        <span className="w-8" />
      </div>

      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* 分类 tab */}
        <FacetRow
          options={CATEGORY_TABS}
          active={category}
          getBind={(o) =>
            bindTap({ kind: 'action', id: 'filter.page.category.switch' }, {
              onTrigger: () => setUi(UI_CATEGORY, o),
            })
          }
        />
        {/* 排序 */}
        <FacetRow
          options={sorts}
          active={sort}
          getBind={(o) =>
            bindTap({ kind: 'action', id: 'filter.page.sort.switch' }, {
              onTrigger: () => setUi(sortKey(category), o),
            })
          }
        />
        {/* 维度组 */}
        {visibleDims.map((d) => (
          <FacetRow
            key={d.label}
            label={d.label}
            options={d.options}
            active={dimValues[d.label]}
            getBind={(o) => dimBind(d.label, o)}
          />
        ))}
        {expanded && stars.length > 0 && (
          <FacetRow
            label={DIM_STAR}
            options={stars}
            active={star}
            getBind={(o) =>
              bindTap({ kind: 'action', id: 'filter.page.star.select' }, {
                onTrigger: () => setUi(starKey(category), star === o ? '' : o),
              })
            }
          />
        )}

        {/* 展开 ∨ / 收起 ∧ */}
        <button
          {...bindTap({ kind: 'action', id: 'filter.page.dims.expand' }, {
            onTrigger: () => setUi(UI_EXPANDED, !expanded),
          })}
          className="w-full flex items-center justify-center gap-0.5 py-2 bg-transparent border-none text-[13px]"
          style={{ color: C.textSub }}
        >
          {expanded ? LABEL_COLLAPSE : LABEL_EXPAND}
          <IcArrowDown
            size={14}
            className={expanded ? 'rotate-180' : undefined}
          />
        </button>

        {/* 结果宫格 */}
        <div className="grid grid-cols-3 gap-x-2 gap-y-3 px-3 pb-6">
          {results.map((c) => {
            const chip = cardChip(c);
            return (
              <GridResultCard
                key={c.id}
                content={c}
                /* 749 的短剧卡副行是推荐语(「优雅厮杀 荆棘之路闪耀」)且海报左上不打年份;
                   795 的长内容卡副行才是主演行 */
                subtitle={isShortDrama ? undefined : castLine(c)}
                showYear={!isShortDrama}
                cornerLeft={isShortDrama && c.heat !== undefined ? `🔥${c.heat}` : undefined}
                bind={
                  isShortDrama
                    ? bindTap('shortdrama.player.open.fromFilter', {
                        params: { contentId: c.id },
                        beforeTrigger: () => openPlayback(c.id, 1),
                      })
                    : bindTap('detail.series.open.fromFilter', { params: { contentId: c.id } })
                }
                chip={
                  chip ? (
                    <span
                      className="inline-flex items-center gap-[2px] min-w-0 px-1 py-[1px] rounded text-[10px] leading-[14px]"
                      style={{ background: C.rankChipBg, color: C.rankChipText }}
                    >
                      {chip.icon}
                      <span className="truncate">{chip.text}</span>
                    </span>
                  ) : undefined
                }
              />
            );
          })}
        </div>
        {results.length === 0 && (
          <div className="px-3 pb-8 text-center">
            <div className="text-[14px]" style={{ color: C.textSub }}>{s.filterNoResults}</div>
            <button
              {...bindTap({ kind: 'action', id: 'filter.page.reset' }, { onTrigger: resetFilters })}
              className="mt-3 px-5 h-9 rounded-full border-none text-[13px] font-medium"
              style={{ background: C.primaryBg, color: C.primary }}
            >
              {s.filterReset}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
