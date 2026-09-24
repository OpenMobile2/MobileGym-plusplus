// 好片 tab(深色策展页,tab 根页 /haopian)。节点 haopian.home(spec v1.0.0,11 条交互)。
// 视觉证据:841(顶部日期 + 全宽 banner 大卡「《挑战》9.2分 科幻」+ 三键 历年好剧/电影片单/排行榜
// + 筛选 tab 题材/品类/演员/片单 + 二级 chip 行 + 高分优先/仅看免费 两枚 pill)、
// 844(题材态:题材行 + 地区行;结果是单列长卡 —— 左竖版海报 + 右 片名/追按钮/评分/榜单 chip/
// 年份·地区·品类·题材·主演)、737(演员态:王楚然选中)、739(题材=喜剧,二级行展开)。
// spec regions 写的是「结果双列」,真机 841/844/737/739 一致是单列长卡 —— 以截图为准。
import React, { useMemo } from 'react';
import * as TimeService from '@/os/TimeService';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTencentvideoStore } from '../state';
import { TV_COLORS as C } from '../constants';
import { TvImg } from '../components/Img';
import { Badge, EmptyState } from '../components/ui';
import { IcArrowRight, IcCheck, IcCrown, IcEpisodes, IcFollow, IcHeat, IcStar } from '../res/icons';

const UI_FILTER_TAB = 'haopian.filterTab';
const UI_FILTER_CHIP = 'haopian.filterChip';
const UI_HIGH_SCORE = 'haopian.highScoreFirst';
const UI_FREE_ONLY = 'haopian.freeOnly';
/** 二级 chip 行的「全部」结构性标签(spec 没给种子键,证据 844/737/739 每行首项都是它) */
const ALL = '全部';

export default function HaopianHomePage() {
  const { bindTap } = useTencentvideoGestures();
  const s = useTencentvideoStrings();

  const contents = useTencentvideoStore((s) => s.contents);
  const channels = useTencentvideoStore((s) => s.channels);
  const chasing = useTencentvideoStore((s) => s.chasing);
  const wontfixToast = useTencentvideoStore((s) => s.wontfixToast);
  const ui = useTencentvideoStore((s) => s.ui);
  const toast = useTencentvideoStore((s) => s.toast);
  const setUi = useTencentvideoStore((s) => s.setUi);
  const chaseToggle = useTencentvideoStore((s) => s.chaseToggle);

  const hp = channels.haopian ?? {};
  const filterTabs = useMemo(() => hp.filterTabs ?? [], [hp.filterTabs]);
  const actorRow = useMemo(() => hp.actorRow ?? [], [hp.actorRow]);
  const genreSecondRow = useMemo(() => hp.genreSecondRow ?? [], [hp.genreSecondRow]);
  const results = useMemo(() => hp.results ?? {}, [hp.results]);
  const toggles = hp.toggles;
  const banner = hp.banner;
  const buttons = useMemo(() => hp.buttons ?? [], [hp.buttons]);

  const filterTab = (ui[UI_FILTER_TAB] as string) || filterTabs[0] || '';
  const chip = (ui[UI_FILTER_CHIP] as string) || ALL;
  // 两枚开关的初值来自种子(高分优先默认开、仅看免费默认关,证据 841)
  const highScoreFirst =
    ui[UI_HIGH_SCORE] === undefined ? toggles?.highScoreFirst === true : ui[UI_HIGH_SCORE] === true;
  const freeOnly =
    ui[UI_FREE_ONLY] === undefined ? toggles?.freeOnly === true : ui[UI_FREE_ONLY] === true;

  const byId = useMemo(() => {
    const m = new Map<string, (typeof contents)[number]>();
    for (const c of contents) m.set(c.id, c);
    return m;
  }, [contents]);

  /** 各筛选维度的二级 chip 行:题材/地区从内容库归纳,演员用种子行,品类=内容分类 */
  const genreChips = useMemo(() => {
    const seen: string[] = [];
    for (const c of contents) for (const t of c.tags) if (!seen.includes(t)) seen.push(t);
    return [ALL, ...seen.slice(0, 10)];
  }, [contents]);
  const regionChips = useMemo(() => {
    const seen: string[] = [];
    for (const c of contents) {
      if (typeof c.region === 'string' && !seen.includes(c.region)) seen.push(c.region);
    }
    return [ALL, ...seen];
  }, [contents]);
  const categoryChips = useMemo(() => {
    const seen: string[] = [];
    for (const c of contents) if (!seen.includes(c.category)) seen.push(c.category);
    return [ALL, ...seen];
  }, [contents]);
  /** 片单维度:年份(真机片单是按年/主题的策展集合,种子只有年度分组可用) */
  const yearChips = useMemo(() => {
    const seen: string[] = [];
    for (const c of contents) {
      const y = typeof c.year === 'number' ? String(c.year) : '';
      if (y && !seen.includes(y)) seen.push(y);
    }
    return [ALL, ...seen.sort().reverse().slice(0, 8)];
  }, [contents]);

  const primaryChips =
    filterTab === filterTabs[1]
      ? categoryChips
      : filterTab === filterTabs[2]
        ? actorRow
        : filterTab === filterTabs[3]
          ? yearChips
          : genreChips;
  /** 题材 tab 下的二级行:选中「喜剧」时露出细分题材(证据 739);其余维度用地区行(证据 844) */
  const secondaryChips =
    filterTab === filterTabs[0]
      ? chip === '喜剧'
        ? [ALL, ...genreSecondRow]
        : regionChips
      : [];

  /** 结果集:先按当前 chip 过滤,再叠加两枚开关;种子 results 的推荐序优先排在前面 */
  const resultItems = useMemo(() => {
    const matches = (c: (typeof contents)[number]): boolean => {
      if (chip === ALL) return true;
      if (filterTab === filterTabs[1]) return c.category === chip;
      if (filterTab === filterTabs[2]) return (c.cast ?? []).some((p) => p.name === chip);
      if (filterTab === filterTabs[3]) return String(c.year ?? '') === chip;
      return c.tags.includes(chip) || c.region === chip;
    };
    let list = contents.filter(matches);
    if (freeOnly) list = list.filter((c) => c.badge !== 'VIP' && c.badge !== 'SVIP');
    // 种子里给了几套「真机同款结果序」,命中就把它们提到最前(其余按热度兜底)
    const featuredKey =
      chip === '喜剧'
        ? 'genreComedy'
        : chip === '港台'
          ? 'regionTaiwan'
          : chip === actorRow[3]
            ? 'actorShenzhiyue'
            : 'default';
    const featured = (results[featuredKey] ?? []).map((id) => byId.get(id)).filter((c) => c !== undefined);
    const rest = list.filter((c) => !featured.some((f) => f.id === c.id));
    const merged = [...featured.filter((f) => list.some((c) => c.id === f.id)), ...rest];
    return highScoreFirst
      ? [...merged].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      : merged;
  }, [contents, chip, filterTab, filterTabs, freeOnly, highScoreFirst, results, byId, actorRow]);

  const bannerContent = banner?.contentId ? byId.get(banner.contentId) : undefined;
  // 顶部日期走 TimeService(硬规则7:禁 new Date)
  const today = TimeService.getDate();
  const dateText = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const chipBind = (value: string) =>
    bindTap({ kind: 'action', id: 'haopian.filter.select' }, {
      params: { value },
      onTrigger: () => setUi(UI_FILTER_CHIP, value),
    });

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: C.darkBg }}
      data-status-bar-foreground="light"
    >
      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* 顶部日期(真机是策展当日的日期条,证据 841「07-25」) */}
        <div className="px-3 pt-1 pb-2 text-[19px] font-bold" style={{ color: C.darkText }}>
          {dateText}
        </div>

        {/* 策展 banner 大卡 */}
        {banner && (
          <div className="px-3">
            <div
              {...bindTap('detail.movie.open.fromHaopianBanner', {
                params: { contentId: banner.contentId ?? '' },
              })}
              className="relative w-full aspect-[4/5] rounded-xl overflow-hidden cursor-pointer"
            >
              <TvImg
                id={banner.img ?? bannerContent?.still}
                alt={banner.title ?? ''}
                className="w-full h-full object-cover"
              />
              <div
                className="absolute inset-x-0 bottom-0 px-3 pb-3 pt-12"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.78), transparent)' }}
              >
                <div className="text-[12px]" style={{ color: 'rgba(255,255,255,0.72)' }}>
                  《{banner.title}》 {banner.rating}分 {banner.tag}
                </div>
                <div className="text-[20px] font-bold text-white truncate mt-0.5">
                  {bannerContent?.recommend ?? banner.title}
                </div>
                {bannerContent?.desc && (
                  <div className="text-[12px] truncate" style={{ color: 'rgba(255,255,255,0.72)' }}>
                    {bannerContent.desc}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 三键 */}
        <div className="flex items-center gap-2 px-3 pt-3">
          <button
            {...bindTap('activity.yearly.open.fromHaopian')}
            className="flex-1 flex items-center justify-center gap-1.5 h-11 rounded-lg border-none text-[14px]"
            style={{ background: C.darkCard, color: C.darkText }}
          >
            <IcEpisodes size={16} />
            {buttons[0]}
          </button>
          <button
            {...bindTap({ kind: 'action', id: 'haopian.filmlist.wontfix' }, {
              onTrigger: () => toast(s.notOpen),
            })}
            className="flex-1 flex items-center justify-center gap-1.5 h-11 rounded-lg border-none text-[14px]"
            style={{ background: C.darkCard, color: C.darkText }}
          >
            <IcStar size={16} />
            {buttons[1]}
          </button>
          <button
            {...bindTap('rank.page.open.fromHaopian')}
            className="flex-1 flex items-center justify-center gap-1.5 h-11 rounded-lg border-none text-[14px]"
            style={{ background: C.darkCard, color: C.darkText }}
          >
            <IcHeat size={16} />
            {buttons[2]}
          </button>
        </div>

        {/* 筛选 tab */}
        <div
          className="flex items-center gap-5 px-3 pt-4 pb-1"
          data-scroll-container="filterTabs"
          data-scroll-direction="horizontal"
        >
          {filterTabs.map((t) => {
            const active = t === filterTab;
            return (
              <button
                key={t}
                {...bindTap({ kind: 'action', id: 'haopian.filtertab.switch' }, {
                  params: { value: t },
                  onTrigger: () => {
                    setUi(UI_FILTER_TAB, t);
                    setUi(UI_FILTER_CHIP, ALL); // 换维度 → 二级行整行换,选中复位
                  },
                })}
                className={`bg-transparent border-none p-0 ${active ? 'text-[16px] font-bold' : 'text-[15px]'}`}
                style={{ color: active ? C.darkText : C.darkTextSub }}
              >
                {t}
              </button>
            );
          })}
        </div>

        {/* 二级 chip 行(一级 + 可选二级) */}
        <div
          className="flex gap-3.5 overflow-x-auto px-3 py-1.5 scrollbar-none"
          data-scroll-container="filterChips"
          data-scroll-direction="horizontal"
        >
          {primaryChips.map((cp) => (
            <button
              key={cp}
              {...chipBind(cp)}
              className={`shrink-0 bg-transparent border-none p-0 text-[14px] whitespace-nowrap ${
                cp === chip ? 'font-bold' : ''
              }`}
              style={{ color: cp === chip ? C.darkText : C.darkTextSub }}
            >
              {cp}
            </button>
          ))}
        </div>
        {secondaryChips.length > 0 && (
          <div
            className="flex gap-3.5 overflow-x-auto px-3 pb-1.5 scrollbar-none"
            data-scroll-container="filterChips2"
            data-scroll-direction="horizontal"
          >
            {secondaryChips.map((cp) => (
              <button
                key={`s_${cp}`}
                {...chipBind(cp)}
                className={`shrink-0 bg-transparent border-none p-0 text-[14px] whitespace-nowrap ${
                  cp === chip ? 'font-bold' : ''
                }`}
                style={{ color: cp === chip ? C.darkText : C.darkTextSub }}
              >
                {cp}
              </button>
            ))}
          </div>
        )}

        {/* 两枚开关 pill:选中 = #161616 底 + 白字 + 前置对勾(design-tokens §四) */}
        <div className="flex items-center gap-2 px-3 py-2">
          <TogglePill
            label="高分优先"
            on={highScoreFirst}
            bind={bindTap({ kind: 'action', id: 'haopian.highscore.toggle' }, {
              onTrigger: () => setUi(UI_HIGH_SCORE, !highScoreFirst),
            })}
          />
          <TogglePill
            label="仅看免费"
            on={freeOnly}
            bind={bindTap({ kind: 'action', id: 'haopian.freeonly.toggle' }, {
              onTrigger: () => setUi(UI_FREE_ONLY, !freeOnly),
            })}
          />
        </div>

        {/* 结果长卡列表 */}
        {resultItems.length === 0 ? (
          <EmptyState text="没有符合条件的好片" sub="换个筛选试试" dark />
        ) : (
          <div className="flex flex-col">
            {resultItems.map((c) => {
              const chasingNow = chasing.some((x) => x.contentId === c.id);
              const meta = [
                c.year,
                c.region,
                c.category,
                ...(c.tags ?? []).slice(0, 1),
                ...(c.cast ?? []).slice(0, 2).map((p) => p.name),
              ]
                .filter(Boolean)
                .join(' ');
              return (
                <div
                  key={c.id}
                  {...bindTap('detail.series.open.fromHaopian', { params: { contentId: c.id } })}
                  className="flex gap-3 px-3 py-2.5 cursor-pointer"
                >
                  <div className="relative shrink-0 w-[96px] aspect-[3/4] rounded-lg overflow-hidden">
                    <TvImg id={c.poster} alt={c.title} className="w-full h-full object-cover" />
                    {c.badge && (
                      <div className="absolute top-0 right-0">
                        <Badge
                          text={c.badge}
                          className="rounded-none rounded-bl-[6px] rounded-tr-[8px]"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-start gap-2">
                      <div
                        className="flex-1 min-w-0 text-[16px] font-semibold truncate"
                        style={{ color: C.darkText }}
                      >
                        {c.title}
                      </div>
                      <button
                        {...bindTap({ kind: 'action', id: 'haopian.follow.toggle' }, {
                          params: { contentId: c.id },
                          stopPropagation: true,
                          onTrigger: () => chaseToggle(c.id),
                        })}
                        className="shrink-0 inline-flex items-center gap-1 px-2.5 h-7 rounded-full border-none text-[12px]"
                        style={{
                          background: chasingNow ? 'rgba(255,255,255,0.10)' : C.darkCard,
                          color: chasingNow ? C.darkTextSub : C.darkText,
                        }}
                      >
                        <IcFollow size={12} />
                        {chasingNow ? '在追' : '追'}
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 overflow-hidden">
                      {typeof c.rating === 'number' && Number.isFinite(c.rating) && (
                        <span
                          className="shrink-0 text-[13px] font-semibold"
                          style={{ color: C.badgeOrange }}
                        >
                          {c.rating.toFixed(1)}分
                        </span>
                      )}
                      {typeof c.rankNote === 'string' && (
                        <span
                          className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-[3px] rounded text-[11px] leading-none"
                          style={{ background: 'rgba(172,112,54,0.22)', color: C.rankChipText }}
                        >
                          {c.rankNote}
                          <IcArrowRight size={10} />
                        </span>
                      )}
                      {c.badge === 'VIP' && (
                        <span style={{ color: C.vipBadgeBg }}>
                          <IcCrown size={13} />
                        </span>
                      )}
                    </div>
                    <div className="text-[12px] mt-1.5 truncate" style={{ color: C.darkTextSub }}>
                      {meta}
                    </div>
                    {c.recommend && (
                      <div className="text-[12px] mt-1 truncate" style={{ color: C.darkTextSub }}>
                        {c.recommend}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="h-4" />
      </div>
    </div>
  );
}

/** 深色筛选 pill:开态 #161616 底 + 白字 + 对勾;关态透明底灰字(design-tokens §四) */
function TogglePill({ label, on, bind }: { label: string; on: boolean; bind: object }) {
  return (
    <button
      {...bind}
      className="inline-flex items-center gap-1 px-3 h-8 rounded-full border-none text-[13px]"
      style={{
        background: on ? C.darkCard : 'rgba(255,255,255,0.06)',
        color: on ? C.darkText : C.darkTextSub,
      }}
    >
      <IcCheck size={13} />
      {label}
    </button>
  );
}
