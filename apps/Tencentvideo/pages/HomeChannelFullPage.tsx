// 频道页·完整 8 频道。节点 home.channel.full(spec v1.3.0,23 条交互)。
// 一个组件渲染 8 个频道:频道差异全在 data/defaults.json 的 channels.<key>(banner/金刚位/
// chip/楼层/赛程),页面只负责「按 uiState 取种子 + 接线」。
// 视觉证据:813 电视剧(金刚位 pill 行 + chip 行 + 双列横版卡 + N刷榜序号角标)、
// 791 电影(卡右下大号评分)、798 动漫、767 纪录片、787 综艺(预约卡 + 榜单chip)、
// 780 少儿(年龄∨ 筛选行 + 榜单序号)、779 NBA(chip + 全部赛程 + 专题楼层)、
// 771 追番(「换一换」+ 内嵌自动播放漫剧卡)。
import React, { useEffect, useMemo } from 'react';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTvQuery } from '../hooks/useTvParams';
import { useTencentvideoStore } from '../state';
import {
  CHANNEL_FULL_TABS,
  CHANNEL_LITE_TABS,
  CHANNEL_SHORTVIDEO_TAB,
  CHANNEL_HOME_TAB,
  TV_COLORS as C,
} from '../constants';
import { ChannelHeader, LandscapeCard, RankChip } from '../components/cards';
import {
  ChannelBanner,
  KingKongRow,
  RankNumBadge,
  ScheduleHeader,
  ScheduleRow,
} from '../components/channel';
import { TvImg } from '../components/Img';
import type { BindProps } from '../components/ui';
import { SectionHeader } from '../components/ui';
import type { TvContent, TvShortVideoItem } from '../types';
import { IcArrowDown, IcClose, IcLoop } from '../res/icons';

/** 频道 tab 文案 → defaults.json channels 的键(证据 832 频道条 + defaults.channels 命名) */
const CHANNEL_KEY_BY_TAB: Record<string, string> = {
  电视剧: 'tv',
  电影: 'movie',
  综艺: 'variety',
  动漫: 'anime',
  少儿: 'kids',
  NBA: 'nba',
  追番: 'bangumi',
  纪录片: 'doc',
};

/**
 * 金刚位「排行榜」落到榜单页的哪个分类(rank.page 的 ?rank=)。
 * rankings 种子只有 tv/anime/shortdrama/kids 四组,电影/综艺/纪录片/NBA 并入 tv 组。
 */
const RANK_KEY_BY_TAB: Record<string, string> = {
  电视剧: 'tv',
  动漫: 'anime',
  追番: 'anime',
  少儿: 'kids',
  电影: 'tv',
  综艺: 'tv',
  纪录片: 'tv',
  NBA: 'tv',
};

/**
 * 少儿「年龄∨」档位。证据 780 只拍到收起态的「年龄∨」,展开档位未入镜,
 * 按少儿频道通行分档补齐;种子无年龄字段,选中后对当前楼层做确定性切片(不是假过滤:
 * 换档确实换一批内容,只是分档规则取自档位下标而非真实年龄标签)。
 */
const AGE_OPTIONS = ['全部年龄', '0-3岁', '4-6岁', '7-9岁', '10岁以上'];

const UI_CHANNEL = 'home.channel.full.channel';
const UI_PANEL = 'home.channel.full.channelpanel';
const UI_AGE = 'home.channel.full.age';
const UI_AGE_OPEN = 'home.channel.full.ageOpen';
/** chip 选中态按频道各存一份(切频道不串台) */
const chipKeyOf = (channelKey: string) => `home.channel.full.chip.${channelKey}`;

/** 确定性轮转:换一换/chip/年龄档都靠它换批,绝不用 Math.random(硬禁项1) */
function rotate<T>(list: readonly T[], offset: number): T[] {
  if (list.length === 0) return [];
  const k = ((offset % list.length) + list.length) % list.length;
  return [...list.slice(k), ...list.slice(0, k)];
}

export default function HomeChannelFullPage() {
  const { bindTap } = useTencentvideoGestures();
  const s = useTencentvideoStrings();

  const contents = useTencentvideoStore((st) => st.contents);
  const channels = useTencentvideoStore((st) => st.channels);
  const channelTabs = useTencentvideoStore((st) => st.channelTabs);
  const channelPanelExtra = useTencentvideoStore((st) => st.channelPanelExtra);
  const reservations = useTencentvideoStore((st) => st.reservations);
  const shuffleSeeds = useTencentvideoStore((st) => st.shuffleSeeds);
  const wontfixToast = useTencentvideoStore((st) => st.wontfixToast);
  const ui = useTencentvideoStore((st) => st.ui);
  const toast = useTencentvideoStore((st) => st.toast);
  const setUi = useTencentvideoStore((st) => st.setUi);
  const reserveToggle = useTencentvideoStore((st) => st.reserveToggle);
  const shuffleRefresh = useTencentvideoStore((st) => st.shuffleRefresh);

  const channelParam = useTvQuery('channel');

  // 从首页/浏览版/短视频页带 ?channel= 进来时对齐 uiState;页内 tab 互切只改 uiState
  useEffect(() => {
    if (channelParam && CHANNEL_KEY_BY_TAB[channelParam]) setUi(UI_CHANNEL, channelParam);
  }, [channelParam, setUi]);

  // 进页收起上次遗留的展开面板(store.ui 会被持久化)
  useEffect(() => {
    setUi(UI_PANEL, false);
    setUi(UI_AGE_OPEN, false);
  }, [setUi]);

  const uiTab = ui[UI_CHANNEL];
  const activeTab =
    typeof uiTab === 'string' && CHANNEL_KEY_BY_TAB[uiTab]
      ? uiTab
      : channelParam && CHANNEL_KEY_BY_TAB[channelParam]
        ? channelParam
        : CHANNEL_FULL_TABS[0];
  const channelKey = CHANNEL_KEY_BY_TAB[activeTab];
  const rankKey = RANK_KEY_BY_TAB[activeTab];
  const ch = channels[channelKey] ?? {};
  const panelOpen = ui[UI_PANEL] === true;
  const ageOpen = ui[UI_AGE_OPEN] === true;
  const ageIndex = typeof ui[UI_AGE] === 'number' ? (ui[UI_AGE] as number) : 0;

  const byId = useMemo(() => {
    const m = new Map<string, TvContent>();
    for (const c of contents) m.set(c.id, c);
    return m;
  }, [contents]);

  /** 楼层池 = floors + subBoards(综艺的三张子榜也是楼层,只是标题即 chip 名) */
  const floors = useMemo(
    () => [...(ch.floors ?? []), ...(ch.subBoards ?? [])],
    [ch.floors, ch.subBoards],
  );

  /**
   * chip 行:优先用种子 chips(电视剧/电影/纪录片/NBA);少儿是 filters(首项为年龄∨);
   * 动漫/追番/综艺种子没给 chips,用楼层标题当 chip(与真机「推荐/暑期补番」一致)。
   */
  const chips = useMemo(() => {
    if (ch.chips) return ch.chips;
    if (ch.filters) return ch.filters.filter((f) => !f.includes('年龄'));
    return floors.map((f) => f.title);
  }, [ch.chips, ch.filters, floors]);

  const hasAgeFilter = (ch.filters ?? []).some((f) => f.includes('年龄'));
  const chipKey = chipKeyOf(channelKey);
  const uiChip = ui[chipKey];
  const activeChip =
    typeof uiChip === 'string' && chips.includes(uiChip) ? uiChip : (chips[0] ?? '');
  const chipIndex = Math.max(0, chips.indexOf(activeChip));
  /** chip 命中同名楼层就换楼层;题材类 chip(刑侦/男频/动作…)种子没有对应楼层,按 chip 下标轮转首个楼层 */
  const matchedFloor = floors.find((f) => f.title === activeChip);
  const baseFloor = matchedFloor ?? floors[0];
  /** 榜单类 chip(N刷榜/热播榜/情感综艺榜…)带名次角标(证据 813/780/783) */
  const ranked = activeChip.includes('榜');

  const shuffleKey = `home.channel.full.${channelKey}`;
  const shuffleSeed = shuffleSeeds[shuffleKey] ?? 0;

  const gridItems = useMemo(() => {
    const offset = (matchedFloor ? 0 : chipIndex) + shuffleSeed + ageIndex;
    return rotate(baseFloor?.ids ?? [], offset)
      .map((id) => byId.get(id))
      .filter((c): c is TvContent => c !== undefined);
  }, [baseFloor, matchedFloor, chipIndex, shuffleSeed, ageIndex, byId]);

  /** banner:纪录片种子没给 banner(证据 767 有),用当前楼层首项兜底 */
  const bannerContentId = ch.banner?.contentId ?? baseFloor?.ids[0];
  const bannerContent = bannerContentId ? byId.get(bannerContentId) : undefined;
  const bannerImg = ch.banner?.img ?? bannerContent?.still ?? bannerContent?.poster;
  const bannerTitle = ch.banner?.title ?? bannerContent?.title ?? '';
  const bannerSub = ch.banner?.subtitle ?? bannerContent?.recommend;

  /** 内嵌自动播放卡:综艺=续播条那部(证据 783 奔跑吧),追番=短番楼层首项(证据 771 漫剧) */
  const autoplayId = ch.resumeBar?.contentId ?? (channelKey === 'bangumi' ? floors[1]?.ids[0] : undefined);
  const autoplay = autoplayId ? byId.get(autoplayId) : undefined;

  /** NBA 专题楼层的资讯卡:种子没有体育内容,借短视频频道的资讯卡位撑结构 */
  const newsItems = useMemo(() => {
    if (channelKey !== 'nba') return [];
    return ((channels.shortvideo?.items ?? []) as TvShortVideoItem[]).slice(0, 4);
  }, [channelKey, channels.shortvideo?.items]);

  const isReserved = (id: string) => reservations.some((r) => r.contentId === id);

  /* ---------- 顶部频道条 ---------- */

  const tabBind = (tab: string): BindProps => {
    if (tab === CHANNEL_HOME_TAB) return bindTap('home.feed.switch.fromChannel');
    if (CHANNEL_LITE_TABS.includes(tab)) {
      return bindTap('home.channel.lite.switch.fromFull', { params: { channel: tab } });
    }
    if (tab === CHANNEL_SHORTVIDEO_TAB) return bindTap('home.shortvideo.switch.fromFull');
    return bindTap({ kind: 'action', id: 'home.channel.full.tab.switch' }, {
      params: { channel: tab },
      onTrigger: () => setUi(UI_CHANNEL, tab),
    });
  };

  /* ---------- 金刚位 ---------- */

  const kingKongBind = (item: string): BindProps => {
    if (item.includes('排行榜')) {
      return bindTap('rank.page.open.fromChannel', { params: { rank: rankKey } });
    }
    if (item.startsWith('全部')) {
      return bindTap('filter.page.open.fromChannel', { params: { channel: activeTab } });
    }
    return bindTap({ kind: 'action', id: 'home.channel.full.kingkong.wontfix' }, {
      onTrigger: () => toast(s.notOpen),
    });
  };

  /* ---------- 内容卡 ---------- */

  const cardBind = (c: TvContent): BindProps =>
    c.category === '电影'
      ? bindTap('detail.movie.open.fromChannel', { params: { contentId: c.id } })
      : bindTap('detail.series.open.fromChannel', { params: { contentId: c.id } });

  const renderCard = (c: TvContent, index: number) => {
    const reserving = typeof c.reserveNote === 'string';
    const reserved = isReserved(c.id);
    return (
      <div key={c.id} className="relative">
        {ranked && <RankNumBadge rank={index + 1} />}
        <LandscapeCard
          content={c}
          ratingCorner={c.category === '电影'}
          cornerNote={reserving ? String(c.reserveNote) : undefined}
          bind={cardBind(c)}
          chips={
            <>
              {typeof c.rankNote === 'string' && c.rankNote.length > 0 && (
                <RankChip
                  text={`${c.rankNote}名`}
                  bind={bindTap('rank.page.open.fromChannel', {
                    params: { rank: rankKey },
                    stopPropagation: true,
                  })}
                />
              )}
              {reserving && (
                <button
                  {...bindTap({ kind: 'action', id: 'home.channel.full.reserve.toggle' }, {
                    params: { contentId: c.id },
                    stopPropagation: true,
                    onTrigger: () => reserveToggle(c.id),
                  })}
                  className="shrink-0 px-2.5 h-[22px] rounded-full text-[11px] leading-none border-none"
                  style={
                    reserved
                      ? { background: C.divider, color: C.textTertiary }
                      : { background: C.primaryBg, color: C.primary }
                  }
                >
                  {reserved ? '已预约' : '预约'}
                </button>
              )}
            </>
          }
        />
      </div>
    );
  };

  /* ---------- NBA 频道(赛程 + 专题资讯,无双列剧卡) ---------- */

  const nbaBlock = (
    <>
      <div
        className="flex gap-2 overflow-x-auto px-3 pt-3 pb-1 scrollbar-none"
        data-scroll-container="nbachips"
        data-scroll-direction="horizontal"
      >
        {(ch.chips ?? []).map((chip) => (
          <button
            key={chip}
            {...bindTap({ kind: 'action', id: 'home.channel.full.nbachip.wontfix' }, {
              onTrigger: () => toast(s.notOpen),
            })}
            className="shrink-0 h-8 px-3 rounded-full border-none text-[13px] whitespace-nowrap"
            style={{ background: C.chipGray, color: C.text }}
          >
            {chip}
          </button>
        ))}
      </div>
      <ScheduleHeader
        title={s.scheduleAll}
        bind={bindTap({ kind: 'action', id: 'home.channel.full.match.wontfix' }, {
          onTrigger: () => toast(s.notOpen),
        })}
      />
      <ScheduleRow
        items={ch.schedule ?? []}
        getBind={() => bindTap({ kind: 'action', id: 'home.channel.full.match.wontfix' }, {
          onTrigger: () => toast(s.notOpen),
        })}
      />
      {ch.topic && <SectionHeader title={ch.topic} />}
      <div className="grid grid-cols-2 gap-x-2.5 gap-y-3 px-3">
        {newsItems.map((item, i) => (
          <button
            key={item.id}
            // 首张资讯卡进体育资讯详情(spec:NBA/体育频道 资讯视频卡),其余为热点原创栏目 = 暂未开放
            {...(i === 0
              ? bindTap('detail.sports.open.fromChannel', {
                params: { contentId: item.linkedFilm ?? item.id },
              })
              : bindTap({ kind: 'action', id: 'home.channel.full.nbanews.wontfix' }, {
                onTrigger: () => toast(s.notOpen),
              }))}
            className="flex flex-col text-left bg-transparent border-none p-0"
          >
            <div className="relative w-full aspect-video rounded-lg overflow-hidden">
              <TvImg id={item.cover} alt={item.title} className="w-full h-full object-cover" />
            </div>
            <div className="mt-1.5 text-[14px] font-medium truncate" style={{ color: C.text }}>
              {item.title}
            </div>
            <div className="text-[12px] truncate" style={{ color: C.textSub }}>
              {item.author}
            </div>
          </button>
        ))}
      </div>
    </>
  );

  /* ---------- 常规频道主体 ---------- */

  const listBlock = (
    <>
      <KingKongRow items={ch.kingKong ?? []} getBind={kingKongBind} />

      <div className="flex items-center gap-2 px-3 pt-2 pb-1">
        {hasAgeFilter && (
          <button
            {...bindTap({ kind: 'action', id: 'home.channel.full.age.select' }, {
              onTrigger: () => setUi(UI_AGE_OPEN, !ageOpen),
            })}
            className="shrink-0 inline-flex items-center gap-0.5 bg-transparent border-none p-0 text-[13px]"
            style={{ color: C.text }}
          >
            {AGE_OPTIONS[ageIndex]}
            <IcArrowDown size={14} />
          </button>
        )}
        {hasAgeFilter && <span className="w-px h-3.5 shrink-0" style={{ background: C.divider }} />}
        <div
          className="flex-1 min-w-0 flex gap-2 overflow-x-auto scrollbar-none"
          data-scroll-container="chips"
          data-scroll-direction="horizontal"
        >
          {chips.map((chip) => {
            const on = chip === activeChip;
            return (
              <button
                key={chip}
                {...bindTap({ kind: 'action', id: 'home.channel.full.chip.switch' }, {
                  params: { chip },
                  onTrigger: () => setUi(chipKey, chip),
                })}
                className="shrink-0 h-7 px-3 rounded-full border-none text-[13px] whitespace-nowrap"
                style={
                  on
                    ? { background: C.primaryBg, color: C.primary }
                    : { background: C.chipGray, color: C.text }
                }
              >
                {chip}
              </button>
            );
          })}
        </div>
      </div>

      {/* 年龄档下拉(证据 780 筛选行首项「年龄∨」) */}
      {ageOpen && (
        <div className="px-3 pb-1 flex flex-wrap gap-2">
          {AGE_OPTIONS.map((age, i) => (
            <button
              key={age}
              {...bindTap({ kind: 'action', id: 'home.channel.full.age.select' }, {
                params: { age },
                onTrigger: () => {
                  setUi(UI_AGE, i);
                  setUi(UI_AGE_OPEN, false);
                },
              })}
              className="px-3 h-7 rounded-full border-none text-[12px]"
              style={
                i === ageIndex
                  ? { background: C.primaryBg, color: C.primary }
                  : { background: C.chipGray, color: C.textSub }
              }
            >
              {age}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-2.5 gap-y-3 px-3 pt-1">
        {gridItems.map(renderCard)}
      </div>

      {/* 「换一换」(证据 771 追番 / 781 少儿:楼层底部居中胶囊) */}
      {typeof ch.swapBtn === 'string' && (
        <div className="flex justify-center pt-4">
          <button
            {...bindTap({ kind: 'action', id: 'home.channel.full.shuffle.refresh' }, {
              onTrigger: () => shuffleRefresh(shuffleKey),
            })}
            className="inline-flex items-center gap-1 px-5 h-8 rounded-full border-none text-[13px]"
            style={{ background: C.chipGray, color: C.text }}
          >
            <IcLoop size={14} />
            {ch.swapBtn}
          </button>
        </div>
      )}

      {/* 内嵌自动播放卡(证据 783 综艺续播条 / 771 追番漫剧) */}
      {autoplay && (
        <div className="pt-4">
          <div
            {...bindTap('detail.series.open.fromChannelAutoplay', {
              params: { contentId: autoplay.id },
            })}
            className="cursor-pointer"
          >
            <div className="relative w-full aspect-video overflow-hidden">
              <TvImg
                id={autoplay.still ?? autoplay.poster}
                alt={autoplay.title}
                className="w-full h-full object-cover"
              />
              {typeof autoplay.aiNote === 'string' && (
                <span className="absolute bottom-1 right-1 text-[9px] text-white/70">
                  {autoplay.aiNote}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 px-3 pt-2">
              <div className="w-8 h-11 rounded overflow-hidden shrink-0">
                <TvImg
                  id={autoplay.poster}
                  alt={autoplay.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold truncate" style={{ color: C.text }}>
                  {autoplay.title}
                </div>
                <div className="text-[12px] truncate" style={{ color: C.textSub }}>
                  {ch.resumeBar?.text ?? autoplay.recommend ?? autoplay.tags.join(' ')}
                </div>
              </div>
              {typeof autoplay.followText === 'string' && (
                <span className="shrink-0 text-[11px]" style={{ color: C.textSub }}>
                  {autoplay.followText}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="flex flex-col h-full" style={{ background: C.pageBg }}>
      <ChannelHeader
        placeholder={channels.home?.searchPlaceholder ?? ''}
        tabs={channelTabs}
        activeTab={activeTab}
        getTabBind={tabBind}
        searchBind={bindTap('search.hub.open.fromChannel')}
        filterLabel="筛选"
        filterBind={bindTap('filter.page.open.fromChannelSearchbar', {
          params: { channel: activeTab },
        })}
        expandBind={bindTap({ kind: 'action', id: 'home.channel.full.channelpanel.toggle' }, {
          onTrigger: () => setUi(UI_PANEL, !panelOpen),
        })}
        highlightTab="少儿"
      />

      {/* 全部频道面板(∨ 展开;长尾频道 = 暂未开放,与首页同构) */}
      {panelOpen && (
        <div className="shrink-0 px-3 pb-3 pt-1" style={{ background: C.pageBg }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-semibold" style={{ color: C.text }}>
              全部频道
            </span>
            <button
              {...bindTap({ kind: 'action', id: 'home.channel.full.channelpanel.toggle' }, {
                onTrigger: () => setUi(UI_PANEL, false),
              })}
              className="bg-transparent border-none p-0"
              style={{ color: C.textSub }}
              aria-label="收起"
            >
              <IcClose size={16} />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {channelPanelExtra.map((extra) => (
              <button
                key={extra}
                {...bindTap({ kind: 'action', id: 'home.channel.full.channelpanel.toggle' }, {
                  onTrigger: () => toast(s.notOpen),
                })}
                className="py-2 rounded-lg border-none text-[12px]"
                style={{ background: C.chipGray, color: C.textSub }}
              >
                {extra}
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <ChannelBanner
          img={bannerImg}
          title={bannerTitle}
          subtitle={bannerSub}
          dots={5}
          activeDot={0}
          bind={
            // NBA banner 是直播流(证据 779「直播中」),范围外 → 暂未开放;其余 banner 进详情
            channelKey === 'nba'
              ? bindTap({ kind: 'action', id: 'home.channel.full.match.wontfix' }, {
                onTrigger: () => toast(s.notOpen),
              })
              : bindTap('detail.series.open.fromChannelBanner', {
                params: { contentId: bannerContentId ?? '' },
              })
          }
        />

        {channelKey === 'nba' ? nbaBlock : listBlock}

        <div className="pt-5 pb-4 text-center text-[11px]" style={{ color: C.textSub }}>
          {s.appName}
        </div>
      </div>
    </div>
  );
}
