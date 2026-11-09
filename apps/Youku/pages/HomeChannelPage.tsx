import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as TimeService from '../../../os/TimeService';
import { YOUKU_CONFIG } from '../data';
import type { CatalogItem } from '../types';
import { useYoukuStore } from '../state';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { useI18n } from '../i18n';
import { contentNavParams } from '../utils/openContent';
import Img from '../components/Img';
import {
  Carousel,
  Dots,
  IcChevronDown,
  IcMute,
  PosterCard,
  RankCard,
  SectionHeader,
  fmtWan,
  type ChannelChip,
} from './home/homeUi';
import {
  BroadcastCard,
  ChannelHeader,
  CircleEntry,
  FilterChipsRow,
  RankListRow,
  UpcomingCard,
  WeekTabsRow,
  type ChannelCfg,
  type UpcomingItem,
} from './home/channelUi';
import HScroll from './home/HScroll';
import { useHorizontalSwipe } from './home/useHorizontalSwipe';

const C = YOUKU_CONFIG;
const CATALOG = C.catalog as unknown as CatalogItem[];
const CFG = C.channelConfig as unknown as Record<string, ChannelCfg>;
const UPCOMING = C.upcoming as unknown as UpcomingItem[];
const RANKS = C.ranks as unknown as Record<string, string[]>;

/** 频道相邻顺序 = 频道条顺序:内容频道 → 长尾频道(整页左右滑 qa:Q9) */
const ORDER: Array<{ id: string; kind: 'content' | 'lite' }> = [
  ...C.channels.content.map((c) => ({ id: c.id, kind: 'content' as const })),
  ...C.channels.lite.map((c) => ({ id: c.id, kind: 'lite' as const })),
];

/** 『排行榜/N刷榜』胶囊 → 切换为榜单视图(spec home.channel.filter.select.tag) */
const RANK_CHIPS = new Set(['排行榜', 'N刷榜']);

/** 筛选胶囊 → 过滤规则(种子数据无同名标签的运营胶囊,映射到确定性字段规则;缺省按 tags 命中) */
const FILTER_RULES: Record<string, (it: CatalogItem) => boolean> = {
  爆款IP: (it) => it.heat >= 8000,
  人间宝藏: (it) => it.rating >= 9.0,
  功夫专场: (it) => it.tags.some((x) => ['动作', '武侠', '战争'].includes(x)),
  喜剧大师: (it) => it.tags.includes('喜剧'),
  必得周边: (it) => it.badge.includes('帧享'),
  加更礼: (it) => it.badge === '加更礼',
  我的西行记: (it) => it.id === 'v_xiyou',
  百厨争霸: (it) => it.id === 'v_baichu',
};

/** 少儿标签 → 过滤规则(推荐=不过滤;益智映射启蒙/亲子;其余按 tags,命不中即空态) */
const KIDS_TAG_RULES: Record<string, (it: CatalogItem) => boolean> = {
  推荐: () => true,
  益智: (it) => it.tags.some((x) => ['启蒙', '亲子'].includes(x)),
};

/** 剧集运营位角色卡(s219 村暖花开3 样式;展示文案为本地 mock 数据) */
const DRAMA_ROLE_CARDS = [
  { name: '马春花·村主任', desc: '带村致富 金点子多' },
  { name: '牛结实·倔管家', desc: '嘴硬心软 承包笑点' },
  { name: '花溪村双宝', desc: '活宝兄弟 欢乐加倍' },
  { name: '新村官报到', desc: '城里青年 下乡历练' },
] as const;

/** 综艺运营位单集卡(s222 EP8上/EP8下/EP7上/EP7下;副标为本地 mock 文案,ep 用于定位集数) */
const VARIETY_EP_CARDS = [
  { caption: '扔沙包大战', sub: '西行小队 1V1 上头', ep: 8 },
  { caption: '舞力全开', sub: '地板舞灵魂较量', ep: 8 },
  { caption: '古集寻宝', sub: '老街寻味 边走边聊', ep: 7 },
  { caption: '演技较量', sub: '即兴戏码 笑点拉满', ep: 7 },
] as const;

/** 每日放送更新时间(静态展示,按条目轮转) */
const BROADCAST_TIMES = ['08:00', '10:00', '12:00', '18:00'] as const;

/** 周一~周日(getDay 序:1..6,0) */
const WEEK_DAYS = [1, 2, 3, 4, 5, 6, 0] as const;

const rotate = <T,>(arr: T[], n: number): T[] =>
  arr.length ? [...arr.slice(n % arr.length), ...arr.slice(0, n % arr.length)] : arr;

/**
 * spec 节点 home.channel(route /home/channel/:channelId)—— 首页-通用频道页。
 * 视觉参照 s219(剧集)/ s220(动漫)/ s221(电影)/ s222(综艺)/ s223(少儿);
 * SLG 广告 Banner 已按 spec 移除,版面由相邻内容楼层补齐。
 */
export default function HomeChannelPage() {
  const { channelId = 'drama' } = useParams<{ channelId: string }>();
  const { bindTap, action, go } = useYoukuGestures();
  const { t, locale } = useI18n();
  const showToast = useYoukuStore((s) => s.showToast);
  const toggleZhui = useYoukuStore((s) => s.toggleZhui);
  const toggleReserve = useYoukuStore((s) => s.toggleReserve);
  const libFollowing = useYoukuStore((s) => s.libFollowing);
  const reservations = useYoukuStore((s) => s.reservations);
  const avatar = useYoukuStore((s) => s.user.avatar);

  const cfg: ChannelCfg = CFG[channelId] ?? {};
  const byId = useMemo(() => new Map(CATALOG.map((c) => [c.id, c])), []);
  const channelItems = useMemo(
    () => CATALOG.filter((c) => c.channel === channelId).sort((a, b) => b.heat - a.heat),
    [channelId],
  );

  const now = TimeService.getDate();
  const today = now.getDay();

  // 页内选择态(select 类 action;换频道时统一复位,effect 幂等 StrictMode 安全)
  const [filterSel, setFilterSel] = useState(cfg.filters?.[0] ?? '全部');
  const [rankTab, setRankTab] = useState(0);
  const [broadcastDay, setBroadcastDay] = useState(today);
  const [kidsAge, setKidsAge] = useState(cfg.ages?.[2] ?? '6岁+');
  const [kidsTag, setKidsTag] = useState(cfg.tags?.[0] ?? '推荐');
  const [bannerIdx, setBannerIdx] = useState(0);
  const [muted, setMuted] = useState(true);
  useEffect(() => {
    const c = CFG[channelId] ?? {};
    setFilterSel(c.filters?.[0] ?? '全部');
    setRankTab(0);
    setBroadcastDay(today);
    setKidsAge(c.ages?.[2] ?? '6岁+');
    setKidsTag(c.tags?.[0] ?? '推荐');
    setBannerIdx(0);
    setMuted(true);
  }, [channelId, today]);

  // 搜索框轮播热词(与 home.main 同实现)
  const hotwords = C.searchHotwords as Array<{ word: string; tag: string }>;
  const [hotIdx, setHotIdx] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setHotIdx((i) => (i + 1) % hotwords.length), 4000);
    return () => window.clearInterval(timer);
  }, [hotwords.length]);

  // 整页左右滑切相邻频道(qa:Q9;相邻为长尾频道时由声明层 cases 按 kind 分流)
  const orderIdx = ORDER.findIndex((o) => o.id === channelId);
  const pageSwipe = useHorizontalSwipe({
    onLeft: () => {
      const next = ORDER[orderIdx + 1];
      if (next) go('home.channel.swipeChannel.open', { channelId: next.id, kind: next.kind });
    },
    onRight: () => {
      const prev = orderIdx > 0 ? ORDER[orderIdx - 1] : undefined;
      if (prev) go('home.channel.swipeChannel.open', { channelId: prev.id, kind: prev.kind });
    },
  });

  // 频道条:首页(可点回精选) + 内容频道(当前高亮) + 长尾频道
  const chips: ChannelChip[] = [
    {
      key: 'home',
      name: t('home.homeChip'),
      active: false,
      bind: bindTap('home.channel.home.open'),
    },
    ...C.channels.content.map((c) => ({
      key: c.id,
      name: c.name,
      active: c.id === channelId,
      bind:
        c.id === channelId
          ? undefined
          : bindTap('home.channel.switch.open', { params: { channelId: c.id } }),
    })),
    ...C.channels.lite.map((c) => ({
      key: c.id,
      name: c.name,
      active: false,
      bind: bindTap('home.channel.channelLite.open', { params: { channelId: c.id } }),
    })),
  ];

  const wontfix = () => showToast(t('common.wontfix'));
  const isZhui = (id: string) => libFollowing.some((e) => e.id === id);

  // ---- 频道 Banner(电影/动漫/综艺/少儿;剧集无 Banner,s219)
  const bannerSlides = useMemo(() => {
    if (channelId === 'drama') return [] as CatalogItem[];
    const bannerFirst = cfg.bannerId ? byId.get(cfg.bannerId) : undefined;
    const rest = channelItems.filter((x) => x.id !== cfg.bannerId);
    return [...(bannerFirst ? [bannerFirst] : []), ...rest].slice(0, 3);
  }, [channelId, channelItems, byId, cfg.bannerId]);
  const advanceBanner = (dir: 1 | -1) =>
    setBannerIdx((i) => (i + dir + bannerSlides.length) % bannerSlides.length);

  // ---- 筛选行 + 内容网格 / 榜单视图
  const isRankView = RANK_CHIPS.has(filterSel);
  const rankItemsAll = useMemo(
    () =>
      (RANKS[channelId] ?? [])
        .map((id) => byId.get(id))
        .filter((x): x is CatalogItem => !!x),
    [channelId, byId],
  );
  const gridItems = useMemo(() => {
    if (!filterSel || filterSel === '全部') return channelItems;
    const rule = FILTER_RULES[filterSel] ?? ((it: CatalogItem) => it.tags.includes(filterSel));
    return channelItems.filter(rule);
  }, [channelItems, filterSel]);

  // ---- 运营位 / 预约位 / 每日放送数据
  const opItem = cfg.opFloor ? byId.get(cfg.opFloor.showId) : undefined;
  const upcomingItems = (cfg.upcomingIds ?? [])
    .map((id) => UPCOMING.find((u) => u.id === id))
    .filter((x): x is UpcomingItem => !!x);
  const moreKey =
    channelId === 'movie' ? 'home.moreMovie' : channelId === 'anime' ? 'home.moreAnime' : 'home.moreDrama';
  const guessItems = useMemo(
    () => [...channelItems].sort((a, b) => b.rating - a.rating).slice(0, 6),
    [channelItems],
  );
  const broadcastItems = channelItems.filter((x) => x.broadcastDay === broadcastDay);
  const themeItems = useMemo(() => {
    if (channelId === 'anime') {
      return [...channelItems]
        .sort(
          (a, b) =>
            (b.tags.includes('推理') ? 1 : 0) - (a.tags.includes('推理') ? 1 : 0) ||
            b.rating - a.rating,
        )
        .slice(0, 3);
    }
    return [...channelItems].sort((a, b) => b.rating - a.rating).slice(0, 3);
  }, [channelId, channelItems]);

  // 少儿:年龄下拉轻做为循环选择(spec inferred 轻做),标签+年龄双重过滤
  const ages = cfg.ages ?? [];
  const nextAge = ages.length ? ages[(ages.indexOf(kidsAge) + 1) % ages.length] : kidsAge;
  const kidsGrid = useMemo(() => {
    if (channelId !== 'kids') return [] as CatalogItem[];
    const tagRule = KIDS_TAG_RULES[kidsTag] ?? ((it: CatalogItem) => it.tags.includes(kidsTag));
    return channelItems.filter((it) => it.ages === kidsAge).filter(tagRule);
  }, [channelId, channelItems, kidsAge, kidsTag]);

  const emptyHint = (
    <div className="flex h-28 items-center justify-center text-[12px] text-[#666666]">
      {t('home.emptyTag')}
    </div>
  );

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden bg-(--app-c-page-bg) text-(--app-c-text-primary)"
    >
      <ChannelHeader
        avatar={avatar}
        hotword={hotwords[hotIdx]?.word ?? ''}
        hotTag={hotwords[hotIdx]?.tag || undefined}
        searchBind={bindTap('home.channel.search.open')}
        filterBind={action('home.channel.filterEntry.wontfixToast', wontfix)}
        filterLabel={t('home.filter')}
        chips={chips}
        expandBind={action('home.main.channelExpand.wontfixToast', wontfix)}
      />

      <div
        data-scroll-container="main"
        data-scroll-direction="vertical"
        {...pageSwipe}
        className="min-h-0 flex-1 overflow-y-auto pb-6"
      >
        {/* 频道 Banner 轮播(部分带静音图标;素材为静态图) */}
        {bannerSlides.length > 0 ? (
          <div className="relative h-[204px] w-full">
            <Carousel
              index={bannerIdx}
              onAdvance={advanceBanner}
              className="h-full"
              slides={bannerSlides.map((it) => (
                <div
                  key={it.id}
                  {...bindTap('home.channel.banner.player.open', { params: contentNavParams(it) })}
                  className="relative h-full w-full cursor-pointer"
                >
                  <Img
                    src={it.still}
                    label={it.title}
                    ratio="landscape"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black to-transparent" />
                  <div className="absolute inset-x-0 bottom-2.5 px-4 pr-16">
                    <div className="truncate text-[22px] font-bold text-white drop-shadow">
                      {it.title}
                    </div>
                    <div className="mt-1 truncate text-[12px] text-white/85">
                      {[it.badge, it.tags.join(' '), it.recTitle].filter(Boolean).join(' / ')}
                    </div>
                  </div>
                </div>
              ))}
            />
            {channelId === 'movie' || channelId === 'kids' ? (
              <button
                {...action('home.channel.banner.muteToggle', () => setMuted((m) => !m))}
                className="absolute bottom-12 right-3 z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-none bg-black/45 text-white"
                aria-label="mute"
              >
                <IcMute muted={muted} size={14} />
              </button>
            ) : null}
            <div
              {...action('home.channel.banner.swipe', () => advanceBanner(1))}
              className="absolute bottom-2.5 right-3 z-10 cursor-pointer p-1"
            >
              <Dots count={bannerSlides.length} index={bannerIdx} />
            </div>
          </div>
        ) : null}

        {/* 筛选行 + 内容网格(『排行榜/N刷榜』切换榜单视图;少儿频道无筛选行) */}
        {cfg.filters ? (
          <>
            <FilterChipsRow
              chips={cfg.filters.map((f) => ({
                label: f,
                active: f === filterSel,
                bind: action('home.channel.filter.select.tag', () => setFilterSel(f), {
                  params: { value: f },
                }),
              }))}
            />
            {isRankView ? (
              <div className="mt-1">
                {rankItemsAll.map((item, i) => (
                  <RankListRow
                    key={item.id}
                    item={item}
                    rank={i + 1}
                    t={t}
                    heatText={t('home.heat', { n: item.heat })}
                    bind={bindTap('home.channel.card.player.open', {
                      params: contentNavParams(item),
                    })}
                  />
                ))}
              </div>
            ) : gridItems.length === 0 ? (
              emptyHint
            ) : (
              <div className="grid grid-cols-3 gap-x-2 gap-y-4 px-3 pt-1">
                {gridItems.map((item) => (
                  <PosterCard
                    key={item.id}
                    item={item}
                    t={t}
                    showRec
                    leftOverride={isZhui(item.id) ? t('home.watching') : undefined}
                    tapBind={bindTap('home.channel.card.player.open', {
                      params: contentNavParams(item),
                    })}
                  />
                ))}
              </div>
            )}
          </>
        ) : null}

        {/* 剧集运营位:村暖花开式合集卡(加追 + 角色卡,s219) */}
        {channelId === 'drama' && cfg.opFloor && opItem ? (
          <div className="mx-3 mt-6 rounded-2xl bg-gradient-to-b from-[#4A2418] to-[#1A1A1A] p-3">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[17px] font-bold text-(--app-c-text-primary)">{cfg.opFloor.title}</div>
                <div className="mt-0.5 truncate text-[12px] text-[#FFB27A]">{opItem.recTitle}</div>
              </div>
              <button
                {...action('home.channel.follow.toggle', () => toggleZhui(opItem.id, String(opItem.type)), {
                  params: { showId: opItem.id },
                })}
                className={`h-8 shrink-0 cursor-pointer rounded-full border-none px-4 text-[13px] ${
                  isZhui(opItem.id) ? 'bg-black/30 text-white/70' : 'bg-white font-medium text-black'
                }`}
              >
                {isZhui(opItem.id) ? t('home.followed') : t('home.follow')}
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {DRAMA_ROLE_CARDS.map((rc) => (
                <div
                  key={rc.name}
                  {...bindTap('home.channel.opfloor.player.open', {
                    params: contentNavParams(opItem),
                  })}
                  className="cursor-pointer"
                >
                  <div className="aspect-video w-full overflow-hidden rounded-lg bg-black/30">
                    <Img
                      src={opItem.still}
                      label={rc.name}
                      ratio="landscape"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="mt-1 truncate text-[13px] text-(--app-c-text-primary)">{rc.name}</div>
                  <div className="truncate text-[11px] text-white/60">{rc.desc}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* 综艺运营位:每周五更新合集(加追 + EP 单集卡定位集数,s222) */}
        {channelId === 'variety' && cfg.opFloor && opItem ? (
          <div className="mx-3 mt-6 rounded-2xl bg-gradient-to-b from-[#7A4108] to-[#1A1A1A] p-3">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[17px] font-bold text-(--app-c-text-primary)">{cfg.opFloor.title}</div>
                <div className="mt-0.5 truncate text-[12px] text-[#FFD9A0]">{cfg.opFloor.sub}</div>
              </div>
              <button
                {...action('home.channel.follow.toggle', () => toggleZhui(opItem.id, String(opItem.type)), {
                  params: { showId: opItem.id },
                })}
                className={`h-8 shrink-0 cursor-pointer rounded-full border-none px-4 text-[13px] ${
                  isZhui(opItem.id) ? 'bg-black/30 text-white/70' : 'bg-white font-medium text-black'
                }`}
              >
                {isZhui(opItem.id) ? t('home.followed') : t('home.follow')}
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(cfg.opFloor.episodes ?? []).map((label, i) => {
                const card = VARIETY_EP_CARDS[i % VARIETY_EP_CARDS.length];
                return (
                  <div
                    key={label}
                    {...bindTap('home.channel.opfloor.player.open', {
                      params: contentNavParams(opItem, { ep: card.ep }),
                    })}
                    className="cursor-pointer"
                  >
                    <div className="aspect-video w-full overflow-hidden rounded-lg bg-black/30">
                      <Img
                        src={opItem.still}
                        label={label}
                        ratio="landscape"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="mt-1 truncate text-[13px] text-(--app-c-text-primary)">
                      {label} · {card.caption}
                    </div>
                    <div className="truncate text-[11px] text-white/60">{card.sub}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* 动漫:每日精选 + 每日放送(周tab,今天默认选中,s220) */}
        {channelId === 'anime' ? (
          <>
            <div className="mt-6">
              <SectionHeader title={t('home.dailyPick')} />
              <div className="grid grid-cols-3 gap-x-2 gap-y-4 px-3">
                {themeItems.map((item) => (
                  <PosterCard
                    key={item.id}
                    item={item}
                    t={t}
                    showRec
                    tapBind={bindTap('home.channel.card.player.open', {
                      params: contentNavParams(item),
                    })}
                  />
                ))}
              </div>
            </div>
            <div className="mt-6">
              <SectionHeader
                title={t('home.broadcast')}
                moreLabel={t('home.viewMore')}
                moreBind={action('home.channel.more.wontfixToast', wontfix)}
              />
              <WeekTabsRow
                tabs={WEEK_DAYS.map((d) => ({
                  key: String(d),
                  label: d === today ? t('home.today') : t(`home.week.${d}`),
                  active: d === broadcastDay,
                  bind: action('home.channel.broadcast.select.day', () => setBroadcastDay(d), {
                    params: { value: String(d) },
                  }),
                }))}
              />
              {broadcastItems.length === 0 ? (
                emptyHint
              ) : (
                <HScroll id="broadcast-row" className="mt-1 gap-2 px-3">
                  {broadcastItems.map((item, i) => (
                    <BroadcastCard
                      key={item.id}
                      item={item}
                      t={t}
                      timeText={t('home.updateTime', { t: BROADCAST_TIMES[i % BROADCAST_TIMES.length] })}
                      bind={bindTap('home.channel.broadcast.player.open', {
                        params: contentNavParams(item),
                      })}
                    />
                  ))}
                </HScroll>
              )}
            </div>
          </>
        ) : null}

        {/* 预约位:N部新剧/新片/新番·即将上线(预约toggle联动 me.library 预约tab) */}
        {cfg.upcomingTitle && upcomingItems.length > 0 ? (
          <div className="mt-6">
            <SectionHeader
              title={cfg.upcomingTitle}
              moreLabel={t(moreKey)}
              moreBind={action('home.channel.more.wontfixToast', wontfix)}
            />
            <HScroll id="upcoming-row" className="gap-2.5 px-3">
              {upcomingItems.map((u) => {
                const reserved = reservations.includes(u.id);
                return (
                  <UpcomingCard
                    key={u.id}
                    item={u}
                    reserved={reserved}
                    countText={t('home.reserveCount', {
                      n: fmtWan(u.reserveCount + (reserved ? 1 : 0), locale),
                    })}
                    btnLabel={
                      reserved
                        ? t('home.reserved')
                        : channelId === 'anime'
                          ? t('home.reserveGift')
                          : t('home.reserve')
                    }
                    comingSoonLabel={t('home.comingSoon')}
                    cardBind={action('home.channel.upcomingCard.wontfixToast', wontfix)}
                    btnBind={action('home.channel.reserve.toggle', () => toggleReserve(u.id), {
                      params: { upcomingId: u.id },
                      stopPropagation: true,
                    })}
                  />
                );
              })}
            </HScroll>
          </div>
        ) : null}

        {/* 猜你在追(剧集/电影,横滑;正在追角标联动 me.library) */}
        {channelId === 'drama' || channelId === 'movie' ? (
          <div className="mt-6">
            <SectionHeader title={t('home.guessFollow')} />
            <HScroll id="guess-follow" className="gap-2 px-3">
              {guessItems.map((item) => (
                <PosterCard
                  key={item.id}
                  item={item}
                  t={t}
                  className="w-[104px] shrink-0"
                  titleClassName="text-[13px]"
                  leftOverride={isZhui(item.id) ? t('home.watching') : undefined}
                  tapBind={bindTap('home.channel.card.player.open', {
                    params: contentNavParams(item),
                  })}
                />
              ))}
            </HScroll>
          </div>
        ) : null}

        {/* 榜单tab楼层(剧集/电影/动漫:热度榜/N刷榜/…,01-04 排名卡) */}
        {channelId !== 'variety' && cfg.rankTabs && rankItemsAll.length > 0 ? (
          <div className="mt-6">
            <HScroll id="rank-tabs" className="items-baseline gap-4 px-3">
              {cfg.rankTabs.map((tab, i) => (
                <span
                  key={tab}
                  {...action('home.channel.rank.select.tab', () => setRankTab(i), {
                    params: { value: tab },
                  })}
                  className={`shrink-0 cursor-pointer whitespace-nowrap ${
                    i === rankTab ? 'text-[18px] font-bold text-(--app-c-text-primary)' : 'text-[14px] text-[#8A8A8A]'
                  }`}
                >
                  {tab}
                </span>
              ))}
            </HScroll>
            <HScroll id="rank-cards" className="mt-2.5 gap-2 px-3">
              {rotate(rankItemsAll, rankTab)
                .slice(0, 6)
                .map((item, i) => (
                  <RankCard
                    key={item.id}
                    item={item}
                    rank={i + 1}
                    t={t}
                    tapBind={bindTap('home.channel.card.player.open', {
                      params: contentNavParams(item),
                    })}
                  />
                ))}
            </HScroll>
          </div>
        ) : null}

        {/* 主题楼层(剧集/动漫)/ 节目合集楼层(综艺,s222) */}
        {channelId === 'drama' || channelId === 'anime' ? (
          <div className="mt-6">
            <SectionHeader
              title={channelId === 'drama' ? t('home.theme.drama') : t('home.theme.anime')}
            />
            <div className="grid grid-cols-3 gap-x-2 gap-y-4 px-3">
              {themeItems.map((item) => (
                <PosterCard
                  key={item.id}
                  item={item}
                  t={t}
                  showRec
                  tapBind={bindTap('home.channel.card.player.open', {
                    params: contentNavParams(item),
                  })}
                />
              ))}
            </div>
          </div>
        ) : null}
        {channelId === 'variety'
          ? [
              { title: t('home.collection.variety1'), items: channelItems.slice(0, 3) },
              { title: t('home.collection.variety2'), items: [...channelItems].reverse().slice(0, 3) },
            ].map((floor) => (
              <div key={floor.title} className="mt-6">
                <SectionHeader title={floor.title} />
                <div className="grid grid-cols-3 gap-x-2 gap-y-4 px-3">
                  {floor.items.map((item) => (
                    <PosterCard
                      key={item.id}
                      item={item}
                      t={t}
                      showRec
                      tapBind={bindTap('home.channel.card.player.open', {
                        params: contentNavParams(item),
                      })}
                    />
                  ))}
                </div>
              </div>
            ))
          : null}

        {/* 少儿:圆形分类入口 + 宝贝正在看 + 年龄/标签筛选 + 内容网格(s223) */}
        {channelId === 'kids' ? (
          <>
            {cfg.entries ? (
              <HScroll id="kids-entries" className="mt-3 gap-3 px-3">
                {cfg.entries.map((label, i) => (
                  <CircleEntry
                    key={label}
                    label={label}
                    index={i}
                    badge={label === '听音频' ? '上新' : undefined}
                    bind={action('home.channel.kidsEntry.wontfixToast', wontfix)}
                  />
                ))}
              </HScroll>
            ) : null}
            <div className="mt-6">
              <SectionHeader
                title={t('home.babyWatching')}
                moreLabel={t('home.viewMore')}
                moreBind={action('home.channel.more.wontfixToast', wontfix)}
              />
              <HScroll id="kids-watching" className="gap-2 px-3">
                {channelItems.map((item) => (
                  <PosterCard
                    key={item.id}
                    item={item}
                    t={t}
                    className="w-[104px] shrink-0"
                    titleClassName="text-[13px]"
                    tapBind={bindTap('home.channel.card.player.open', {
                      params: contentNavParams(item),
                    })}
                  />
                ))}
              </HScroll>
            </div>
            {ages.length && cfg.tags ? (
              <>
                <div className="mt-5 flex items-center gap-2 px-3">
                  {/* 年龄下拉轻做:点按循环切换枚举(spec inferred) */}
                  <span
                    {...action('home.channel.kidsAge.select.age', () => setKidsAge(nextAge), {
                      params: { value: nextAge },
                    })}
                    className="flex shrink-0 cursor-pointer items-center gap-1 rounded-full bg-(--app-c-card-bg) px-3 py-1.5 text-[13px] text-(--app-c-text-primary)"
                  >
                    {kidsAge}
                    <IcChevronDown size={12} className="text-[#999999]" />
                  </span>
                  <HScroll id="kids-tags" className="min-w-0 flex-1 items-center gap-1.5">
                    {cfg.tags.map((tag) => (
                      <span
                        key={tag}
                        {...action('home.channel.kidsTag.select.tag', () => setKidsTag(tag), {
                          params: { value: tag },
                        })}
                        className={`shrink-0 cursor-pointer whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] ${
                          tag === kidsTag ? 'bg-(--app-c-chip-bg) text-(--app-c-text-primary)' : 'text-[#8A8A8A]'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </HScroll>
                </div>
                <div className="mt-3">
                  {kidsGrid.length === 0 ? (
                    emptyHint
                  ) : (
                    <div className="grid grid-cols-3 gap-x-2 gap-y-4 px-3">
                      {kidsGrid.map((item) => (
                        <PosterCard
                          key={item.id}
                          item={item}
                          t={t}
                          showRec
                          tapBind={bindTap('home.channel.card.player.open', {
                            params: contentNavParams(item),
                          })}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
