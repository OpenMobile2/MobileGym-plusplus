import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { YOUKU_CONFIG } from '../data';
import type { CatalogItem } from '../types';
import { useYoukuStore } from '../state';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { useI18n } from '../i18n';
import { contentNavParams } from '../utils/openContent';
import Img from '../components/Img';
import { Carousel, Dots, PosterCard, SectionHeader, type ChannelChip } from './home/homeUi';
import {
  ChannelHeader,
  CircleEntry,
  LiteChipBtn,
  LiveWideCard,
  ScheduleCard,
  type ChannelCfg,
} from './home/channelUi';
import HScroll from './home/HScroll';
import { useHorizontalSwipe } from './home/useHorizontalSwipe';
import PlusMenu from '../components/PlusMenu';

const C = YOUKU_CONFIG;
const CATALOG = C.catalog as unknown as CatalogItem[];
const CFG = C.channelConfig as unknown as Record<string, ChannelCfg>;

/** 频道相邻顺序 = 频道条顺序:内容频道 → 长尾频道(整页左右滑 qa:Q9) */
const ORDER: Array<{ id: string; kind: 'content' | 'lite' }> = [
  ...C.channels.content.map((c) => ({ id: c.id, kind: 'content' as const })),
  ...C.channels.lite.map((c) => ({ id: c.id, kind: 'lite' as const })),
];

const asset = (name: string) => `/@app-assets/Youku/promo/${name}`;

// ---- 体育/游戏频道静态版面数据(直播/电商推广整组 wontfix,展示文案为本地 mock,已脱敏)
const SPORTS_BANNER = {
  title: '网球巡回赛·雅典站 今晚22:30 巅峰对决 冲击四强',
  subSuffix: '雅典站赛事直播',
  cover: asset('sports_banner.png'),
};
const SPORTS_SCHEDULE = [
  {
    league: '网球巡回·格城站',
    time: '今天 16:30',
    desc: '格城站 第五比赛日全景播出',
    cover: asset('sports_schedule_1.png'),
  },
  {
    league: '网球巡回·巴城站',
    time: '今天 17:00',
    desc: '巴城站 第五比赛日全景播出',
    cover: asset('sports_schedule_2.png'),
  },
  {
    league: '羽毛球公开赛',
    time: '今天 19:30',
    desc: '混双半决赛焦点对决',
    cover: asset('sports_schedule_3.png'),
  },
] as const;
const SPORTS_LIVE_CARDS = [
  {
    title: '女子巡回赛·雅典站 焦点战',
    live: false,
    gradient: 'from-[#4A2E7A] to-[#221540]',
    cover: asset('sports_live_1.png'),
  },
  {
    title: '男子大师赛·决胜盘对决',
    live: true,
    gradient: 'from-[#7A3A16] to-[#3A1C0A]',
    cover: asset('sports_live_2.png'),
  },
] as const;
const GAME_BANNER = {
  title: '大师赛专属票根 现已上架',
  sub: '本命卡司 近在咫尺 欢迎选购',
  tickets: [asset('game_ticket_1.png'), asset('game_ticket_2.png'), asset('game_ticket_3.png')],
};

/**
 * spec 节点 home.channelLite(route /home/channel-lite/:channelId)—— 首页-长尾轻量频道。
 * Q1-B 单屏轻量版:纪录片(s224)/ 体育(s225)/ 人文(s226)/ 游戏(s227),
 * 深层落地页/直播/电商推广一律 wontfix toast;内容卡走通用路由。
 */
export default function HomeChannelLitePage() {
  const { channelId = 'documentary' } = useParams<{ channelId: string }>();
  const { bindTap, action, bindBack, go } = useYoukuGestures();
  const { t } = useI18n();
  const showToast = useYoukuStore((s) => s.showToast);
  const avatar = useYoukuStore((s) => s.user.avatar);
  const [sp, setSearchParams] = useSearchParams();
  const menuOpen = sp.get('menu') === 'plus';
  const openPlusMenu = () =>
    setSearchParams((p) => {
      p.set('menu', 'plus');
      return p;
    });

  const cfg: ChannelCfg = CFG[channelId] ?? {};
  const byId = useMemo(() => new Map(CATALOG.map((c) => [c.id, c])), []);
  const items = useMemo(
    () =>
      (cfg.ids ?? [])
        .map((id) => byId.get(id))
        .filter((x): x is CatalogItem => !!x),
    [byId, cfg.ids],
  );

  // Banner 轮播(纪录片/人文:片库内容;换频道复位,effect 幂等)
  const [bannerIdx, setBannerIdx] = useState(0);
  useEffect(() => setBannerIdx(0), [channelId]);
  const advanceBanner = (dir: 1 | -1) =>
    setBannerIdx((i) => (i + dir + items.length) % items.length);

  // 搜索框轮播热词(与 home.main 同实现)
  const hotwords = C.searchHotwords as Array<{ word: string; tag: string }>;
  const [hotIdx, setHotIdx] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setHotIdx((i) => (i + 1) % hotwords.length), 4000);
    return () => window.clearInterval(timer);
  }, [hotwords.length]);

  // 整页左右滑切相邻频道(相邻为内容频道时由声明层 cases 按 kind 分流)
  const orderIdx = ORDER.findIndex((o) => o.id === channelId);
  const pageSwipe = useHorizontalSwipe({
    onLeft: () => {
      const next = ORDER[orderIdx + 1];
      if (next) go('home.channelLite.swipeChannel.open', { channelId: next.id, kind: next.kind });
    },
    onRight: () => {
      const prev = orderIdx > 0 ? ORDER[orderIdx - 1] : undefined;
      if (prev) go('home.channelLite.swipeChannel.open', { channelId: prev.id, kind: prev.kind });
    },
  });

  // 频道条:首页(可点回精选) + 内容频道 + 长尾频道(当前高亮)
  const chips: ChannelChip[] = [
    {
      key: 'home',
      name: t('home.homeChip'),
      active: false,
      bind: bindTap('home.channelLite.home.open'),
    },
    ...C.channels.content.map((c) => ({
      key: c.id,
      name: c.name,
      active: false,
      bind: bindTap('home.channelLite.channel.open', { params: { channelId: c.id } }),
    })),
    ...C.channels.lite.map((c) => ({
      key: c.id,
      name: c.name,
      active: c.id === channelId,
      bind:
        c.id === channelId
          ? undefined
          : bindTap('home.channelLite.switch.open', { params: { channelId: c.id } }),
    })),
  ];

  const wontfix = () => showToast(t('common.wontfix'));
  const hasContentBanner = channelId === 'documentary' || channelId === 'humanities';

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden bg-(--app-c-page-bg) text-(--app-c-text-primary)"
    >
      <ChannelHeader
        avatar={avatar}
        avatarBind={bindTap('home.channelLite.me.open')}
        hotword={hotwords[hotIdx]?.word ?? ''}
        hotTag={hotwords[hotIdx]?.tag || undefined}
        searchBind={bindTap('home.channelLite.search.open')}
        filterBind={action('home.channelLite.plusMenu.open', openPlusMenu)}
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
        {/* 纪录片/人文:内容 Banner 轮播(片库内容,可进播放页) */}
        {hasContentBanner && items.length > 0 ? (
          <div className="relative mx-3 mt-2 h-[190px] overflow-hidden rounded-xl">
            <Carousel
              index={bannerIdx}
              onAdvance={advanceBanner}
              className="h-full"
              slides={items.map((it) => (
                <div
                  key={it.id}
                  {...bindTap('home.channelLite.banner.player.open', {
                    params: contentNavParams(it),
                  })}
                  className="relative h-full w-full cursor-pointer"
                >
                  <Img
                    src={it.still}
                    label={it.title}
                    ratio="landscape"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/90 to-transparent" />
                  <div className="absolute inset-x-0 bottom-2.5 px-3.5 pr-14">
                    <div className="truncate text-[20px] font-bold text-white drop-shadow">
                      {it.title}
                    </div>
                    <div className="mt-1 truncate text-[12px] text-white/85">
                      {[it.badge, it.tags.join(' '), it.recTitle].filter(Boolean).join(' / ')}
                    </div>
                  </div>
                </div>
              ))}
            />
            <div
              {...action('home.channelLite.banner.swipe', () => advanceBanner(1))}
              className="absolute bottom-2.5 right-3 z-10 cursor-pointer p-1"
            >
              <Dots count={items.length} index={bannerIdx} />
            </div>
          </div>
        ) : null}

        {/* 纪录片/人文:胶囊快捷入口(Q1-B 轻做,同组一致提示) */}
        {hasContentBanner && cfg.chips ? (
          <div className="mt-3 flex gap-2 px-3">
            {cfg.chips.map((label) => (
              <LiteChipBtn
                key={label}
                label={label}
                bind={action('home.channelLite.entry.wontfixToast', wontfix)}
              />
            ))}
          </div>
        ) : null}

        {/* 纪录片/人文:内容三列网格 */}
        {hasContentBanner ? (
          <div className="mt-4 grid grid-cols-3 gap-x-2 gap-y-4 px-3">
            {items.map((item) => (
              <PosterCard
                key={item.id}
                item={item}
                t={t}
                showRec
                tapBind={bindTap('home.channelLite.card.player.open', {
                  params: contentNavParams(item),
                })}
              />
            ))}
          </div>
        ) : null}

        {/* 体育:直播 Banner + 赛事入口 + 推荐赛程 + 热门直播(直播类整组 wontfix,s225) */}
        {channelId === 'sports' ? (
          <>
            <div
              {...action('home.channelLite.live.wontfixToast', wontfix)}
              className="relative mx-3 mt-2 h-[180px] cursor-pointer overflow-hidden rounded-xl bg-gradient-to-br from-[#5A2E9A] to-[#22114E]"
            >
              <Img
                src={SPORTS_BANNER.cover}
                label={SPORTS_BANNER.title}
                ratio="landscape"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 px-3.5 pb-3">
                <div className="pr-20 text-[16px] font-bold leading-6 text-(--app-c-text-primary)">
                  {SPORTS_BANNER.title}
                </div>
                <div className="mt-1.5 text-[11px] text-white/70">
                  {t('home.reserving')} / {SPORTS_BANNER.subSuffix}
                </div>
              </div>
              <button
                {...action('home.channelLite.live.wontfixToast', wontfix, {
                  stopPropagation: true,
                })}
                className="absolute right-3 top-[104px] h-8 cursor-pointer rounded-lg border-none bg-white px-4 text-[13px] font-medium text-black"
              >
                {t('home.reserve')}
              </button>
            </div>
            <HScroll id="sports-entries-1" className="mt-4 gap-3 px-3">
              {(cfg.entries ?? []).slice(0, 5).map((label, i) => (
                <CircleEntry
                  key={label}
                  label={label}
                  index={i}
                  bind={action('home.channelLite.entry.wontfixToast', wontfix)}
                />
              ))}
            </HScroll>
            <HScroll id="sports-entries-2" className="mt-3 gap-3 px-3">
              {(cfg.entries ?? []).slice(5).map((label, i) => (
                <CircleEntry
                  key={label}
                  label={label}
                  index={i + 5}
                  bind={action('home.channelLite.entry.wontfixToast', wontfix)}
                />
              ))}
            </HScroll>
            <div className="mt-6">
              <SectionHeader
                title={t('home.recSchedule')}
                sub={t('home.todayMatches')}
                moreLabel={t('home.allSchedule')}
                moreBind={action('home.channelLite.live.wontfixToast', wontfix)}
              />
              <HScroll id="sports-schedule" className="gap-2.5 px-3">
                {SPORTS_SCHEDULE.map((m) => (
                  <ScheduleCard
                    key={m.league}
                    league={m.league}
                    time={m.time}
                    desc={m.desc}
                    cover={m.cover}
                    liveLabel={t('home.live')}
                    bind={action('home.channelLite.live.wontfixToast', wontfix)}
                  />
                ))}
              </HScroll>
            </div>
            <div className="mt-6">
              <SectionHeader
                title={t('home.tennisLive')}
                moreLabel={t('home.more')}
                moreBind={action('home.channelLite.live.wontfixToast', wontfix)}
              />
              <HScroll id="sports-live" className="gap-2.5 px-3">
                {SPORTS_LIVE_CARDS.map((card) => (
                  <LiveWideCard
                    key={card.title}
                    title={card.title}
                    badge={card.live ? t('home.live') : t('home.reserve')}
                    badgeLive={card.live}
                    gradient={card.gradient}
                    cover={card.cover}
                    bind={action('home.channelLite.live.wontfixToast', wontfix)}
                  />
                ))}
              </HScroll>
            </div>
          </>
        ) : null}

        {/* 游戏:票根 Banner(电商推广 wontfix)+ 游戏入口 + 游戏头条(s227) */}
        {channelId === 'game' ? (
          <>
            <div
              {...action('home.channelLite.promo.wontfixToast', wontfix)}
              className="relative mx-3 mt-2 h-[150px] cursor-pointer overflow-hidden rounded-xl bg-gradient-to-br from-[#1E6FD8] to-[#0A3A80] p-4"
            >
              <div className="text-[19px] font-bold leading-7 text-(--app-c-text-primary)">{GAME_BANNER.title}</div>
              <div className="mt-1 inline-block rounded bg-[#F8E3A8] px-2 py-0.5 text-[11px] text-[#5C4318]">
                {GAME_BANNER.sub}
              </div>
              <div className="absolute bottom-4 left-4 flex gap-2">
                {GAME_BANNER.tickets.map((src) => (
                  <div key={src} className="h-10 w-8 overflow-hidden rounded-sm bg-white/20">
                    <Img src={src} label="票根" ratio="poster" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
            <HScroll id="game-entries-1" className="mt-4 gap-3 px-3">
              {(cfg.entries ?? []).slice(0, 5).map((label, i) => (
                <CircleEntry
                  key={label}
                  label={label}
                  index={i}
                  bind={action('home.channelLite.entry.wontfixToast', wontfix)}
                />
              ))}
            </HScroll>
            <HScroll id="game-entries-2" className="mt-3 gap-3 px-3">
              {(cfg.entries ?? []).slice(5).map((label, i) => (
                <CircleEntry
                  key={label}
                  label={label}
                  index={i + 5}
                  badge={label === '即点即玩' ? '快看' : undefined}
                  bind={action('home.channelLite.entry.wontfixToast', wontfix)}
                />
              ))}
            </HScroll>
            <div className="mt-6">
              <SectionHeader title={t('home.gameHeadline')} />
              <div className="grid grid-cols-3 gap-x-2 gap-y-4 px-3">
                {items.map((item) => (
                  <PosterCard
                    key={item.id}
                    item={item}
                    t={t}
                    showRec
                    tapBind={bindTap('home.channelLite.card.player.open', {
                      params: contentNavParams(item),
                    })}
                  />
                ))}
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* 顶栏「+」下拉:筛选 / 扫一扫 / 投屏 */}
      <PlusMenu
        open={menuOpen}
        backdropBind={bindBack()}
        filterBind={bindTap('home.channelLite.plusMenu.filter.open')}
        scanBind={action('home.channelLite.plusMenu.scan.wontfixToast', wontfix)}
        castBind={action('home.channelLite.plusMenu.cast.wontfixToast', wontfix)}
        filterLabel={t('home.filter')}
        scanLabel={t('menu.scan')}
        castLabel={t('menu.cast')}
      />
    </div>
  );
}
