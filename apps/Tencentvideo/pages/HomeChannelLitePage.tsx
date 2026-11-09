// 频道页·浏览版 5 频道(体育/播客/游戏/好物/爱玩)。节点 home.channel.lite(spec v1.3.0,10 条交互)。
// 分配表锁定:浏览版频道的深层点击一律「暂未开放」,只有频道切换/搜索/播客 chip/播客「追」是真交互。
// 视觉证据:764+766 体育(入口 pill 行 + 全部赛程 + 直播楼层)、762 播客(大图卡 + 追按钮 + N人在追)、
// 761 游戏(banner + 入口 + 赛程)、759 好物(顶部购物车/订单/客服 + 金刚位 + 商品卡 + 子tab)、
// 770 爱玩(整屏游戏推广 + 立即前往 + 两个入口)。
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
import { ChannelHeader, ChasePill } from '../components/cards';
import { ChannelBanner, KingKongRow, ScheduleHeader, ScheduleRow } from '../components/channel';
import { TvImg } from '../components/Img';
import { SectionHeader } from '../components/ui';
import type { BindProps } from '../components/ui';
import type { TvPodcastItem } from '../types';

/** 浏览版频道 tab 文案 → defaults.json channels 的键 */
const CHANNEL_KEY_BY_TAB: Record<string, string> = {
  体育: 'sports',
  播客: 'podcast',
  游戏: 'game',
  好物: 'goods',
  爱玩: 'aiwan',
};

const UI_CHANNEL = 'home.channel.lite.channel';
const UI_PODCHIP = 'home.channel.lite.podchip';

export default function HomeChannelLitePage() {
  const { bindTap } = useTencentvideoGestures();
  const s = useTencentvideoStrings();

  const channels = useTencentvideoStore((st) => st.channels);
  const channelTabs = useTencentvideoStore((st) => st.channelTabs);
  const goodsShop = useTencentvideoStore((st) => st.goodsShop);
  const chasing = useTencentvideoStore((st) => st.chasing);
  const wontfixToast = useTencentvideoStore((st) => st.wontfixToast);
  const ui = useTencentvideoStore((st) => st.ui);
  const toast = useTencentvideoStore((st) => st.toast);
  const setUi = useTencentvideoStore((st) => st.setUi);
  const chaseToggle = useTencentvideoStore((st) => st.chaseToggle);

  const channelParam = useTvQuery('channel');

  useEffect(() => {
    if (channelParam && CHANNEL_KEY_BY_TAB[channelParam]) setUi(UI_CHANNEL, channelParam);
  }, [channelParam, setUi]);

  const uiTab = ui[UI_CHANNEL];
  const activeTab =
    typeof uiTab === 'string' && CHANNEL_KEY_BY_TAB[uiTab]
      ? uiTab
      : channelParam && CHANNEL_KEY_BY_TAB[channelParam]
        ? channelParam
        : CHANNEL_LITE_TABS[0];
  const channelKey = CHANNEL_KEY_BY_TAB[activeTab];
  const ch = channels[channelKey] ?? {};

  /** 深层入口统一 toast(spec:浏览版深层点击 = 暂未开放) */
  const deepBind = (): BindProps =>
    bindTap({ kind: 'action', id: 'home.channel.lite.deep.wontfix' }, {
      onTrigger: () => toast(s.notOpen),
    });

  const bannerBind = (): BindProps =>
    bindTap({ kind: 'action', id: 'home.channel.lite.banner.wontfix' }, {
      onTrigger: () => toast(s.notOpen),
    });

  const tabBind = (tab: string): BindProps => {
    if (tab === CHANNEL_HOME_TAB) return bindTap('home.feed.switch.fromLite');
    if (CHANNEL_FULL_TABS.includes(tab)) {
      return bindTap('home.channel.full.switch.fromLite', { params: { channel: tab } });
    }
    if (tab === CHANNEL_SHORTVIDEO_TAB) return bindTap('home.shortvideo.switch.fromLite');
    return bindTap({ kind: 'action', id: 'home.channel.lite.tab.switch' }, {
      params: { channel: tab },
      onTrigger: () => setUi(UI_CHANNEL, tab),
    });
  };

  /* ---------- 播客 ---------- */

  const podChips = useMemo(() => ch.chips ?? [], [ch.chips]);
  const uiPodChip = ui[UI_PODCHIP];
  const activePodChip =
    typeof uiPodChip === 'string' && podChips.includes(uiPodChip) ? uiPodChip : (podChips[0] ?? '');
  const podcastItems = useMemo(() => {
    const items = (ch.items ?? []) as TvPodcastItem[];
    const offset = Math.max(0, podChips.indexOf(activePodChip));
    // chip 无独立种子列表,按 chip 下标确定性轮转同一批播客(与真机「换 chip 换一批」一致)
    if (items.length === 0) return items;
    const k = offset % items.length;
    return [...items.slice(k), ...items.slice(0, k)];
  }, [ch.items, podChips, activePodChip]);

  const goodsItems = useMemo(
    () => (ch.itemIds ?? []).map((id) => goodsShop.items.find((g) => g.id === id)).filter((g) => g !== undefined),
    [ch.itemIds, goodsShop.items],
  );

  const isChasing = (key: string) => chasing.some((c) => c.contentId === key);

  /* ---------- 各频道主体 ---------- */

  const sportsBlock = (
    <>
      <KingKongRow items={ch.entries ?? []} getBind={deepBind} />
      <ScheduleHeader title={s.scheduleAll} bind={deepBind()} />
      <ScheduleRow items={ch.schedule ?? []} getBind={deepBind} />
    </>
  );

  const gameBlock = (
    <>
      <KingKongRow items={ch.entries ?? []} getBind={deepBind} />
      <ScheduleHeader title={s.scheduleAll} bind={deepBind()} />
      <ScheduleRow items={ch.schedule ?? []} getBind={deepBind} />
    </>
  );

  const podcastBlock = (
    <>
      <div
        className="flex gap-2 overflow-x-auto px-3 pt-3 pb-1 scrollbar-none"
        data-scroll-container="chips"
        data-scroll-direction="horizontal"
      >
        {podChips.map((chip) => {
          const on = chip === activePodChip;
          return (
            <button
              key={chip}
              {...bindTap({ kind: 'action', id: 'home.channel.lite.podchip.switch' }, {
                params: { chip },
                onTrigger: () => setUi(UI_PODCHIP, chip),
              })}
              className="shrink-0 h-7 px-3 rounded-full border-none text-[13px] whitespace-nowrap"
              style={on ? { background: C.primaryBg, color: C.primary } : { background: C.chipGray, color: C.text }}
            >
              {chip}
            </button>
          );
        })}
      </div>
      {podcastItems.map((item) => {
        const chasingNow = isChasing(item.title);
        return (
          <div key={item.title} className="pt-3">
            <div {...deepBind()} className="w-full aspect-video overflow-hidden cursor-pointer">
              <TvImg id={item.cover} alt={item.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center gap-2 px-3 pt-2">
              <div className="w-8 h-8 rounded overflow-hidden shrink-0">
                <TvImg id={item.cover} alt={item.title} className="w-full h-full object-cover" />
              </div>
              <div {...deepBind()} className="flex-1 min-w-0 cursor-pointer">
                <div className="text-[15px] font-semibold truncate" style={{ color: C.text }}>
                  {item.title}
                </div>
                <div className="text-[12px] truncate" style={{ color: C.textSub }}>
                  {`更新至${item.eps}集`}
                </div>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-1">
                <ChasePill
                  chasing={chasingNow}
                  label={chasingNow ? '在追' : '追'}
                  bind={bindTap({ kind: 'action', id: 'home.channel.lite.follow.toggle' }, {
                    params: { podcast: item.title },
                    stopPropagation: true,
                    onTrigger: () => chaseToggle(item.title),
                  })}
                />
                <span className="text-[11px]" style={{ color: C.textSub }}>
                  {item.followText}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );

  const goodsBlock = (
    <>
      <KingKongRow items={ch.entries ?? []} getBind={deepBind} />
      <div className="grid grid-cols-2 gap-2 px-3 pt-3">
        {goodsItems.map((g) => (
          <button
            key={g.id}
            {...deepBind()}
            className="flex flex-col rounded-xl overflow-hidden border-none p-2 text-left"
            style={{ background: C.chipGray }}
          >
            <div className="w-full aspect-square rounded-lg overflow-hidden">
              <TvImg id={g.img} alt={g.name} className="w-full h-full object-cover" />
            </div>
            <div className="mt-1.5 text-[13px] font-medium truncate" style={{ color: C.text }}>
              {g.name}
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-[14px] font-semibold" style={{ color: C.unlockRed }}>
                {`¥${g.price}`}
              </span>
              <span className="text-[11px]" style={{ color: C.textSub }}>
                {g.sales}
              </span>
            </div>
          </button>
        ))}
      </div>
      <div
        className="flex gap-5 overflow-x-auto px-3 pt-4 scrollbar-none"
        data-scroll-container="subtabs"
        data-scroll-direction="horizontal"
      >
        {(ch.subTabs ?? []).map((t, i) => (
          <button
            key={t}
            {...deepBind()}
            className={`shrink-0 bg-transparent border-none p-0 whitespace-nowrap ${
              i === 0 ? 'text-[17px] font-bold' : 'text-[15px]'
            }`}
            style={{ color: i === 0 ? C.text : C.textSub }}
          >
            {t}
          </button>
        ))}
      </div>
    </>
  );

  const aiwanBlock = (
    <div className="px-3 pt-2">
      <button
        {...deepBind()}
        className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border-none p-0"
      >
        <TvImg
          id={ch.promo?.img}
          alt={ch.promo?.title ?? ''}
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-x-0 bottom-0 pt-10 pb-4 px-4 flex flex-col items-center gap-2"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent)' }}
        >
          <span className="text-white text-[22px] font-bold drop-shadow">{ch.promo?.title}</span>
          <span
            className="px-8 h-10 inline-flex items-center rounded-full text-[16px] font-semibold"
            style={{
              background: `linear-gradient(90deg, ${C.goldBtnFrom}, ${C.goldBtnTo})`,
              color: C.goldBtnText,
            }}
          >
            {ch.promo?.btn}
          </span>
        </div>
      </button>
      <div className="grid grid-cols-2 gap-2 pt-3">
        {(ch.entries ?? []).map((e) => (
          <button
            key={e}
            {...deepBind()}
            className="px-3 py-2.5 rounded-xl border-none text-left text-[14px]"
            style={{ background: C.chipGray, color: C.text }}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );

  const bodyByChannel: Record<string, React.ReactNode> = {
    sports: sportsBlock,
    game: gameBlock,
    podcast: podcastBlock,
    goods: goodsBlock,
    aiwan: aiwanBlock,
  };

  return (
    <div className="flex flex-col h-full" style={{ background: C.pageBg }}>
      <ChannelHeader
        placeholder={channels.home?.searchPlaceholder ?? ''}
        tabs={channelTabs}
        activeTab={activeTab}
        getTabBind={tabBind}
        searchBind={bindTap('search.hub.open.fromLite')}
        filterLabel="筛选"
        // 浏览版没有 filter.page 入口(spec 未申报),筛选并入「深层入口」口径
        filterBind={deepBind()}
        highlightTab="少儿"
      />

      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* 好物顶部工具行(证据 759:购物车/订单/客服) */}
        {channelKey === 'goods' && (
          <div className="flex items-center justify-end gap-2 px-3 pt-2">
            {(ch.topActions ?? []).map((t) => (
              <button
                key={t}
                {...deepBind()}
                className="px-2.5 h-7 rounded-full border-none text-[12px]"
                style={{ background: C.chipGray, color: C.text }}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {ch.banner && (
          <ChannelBanner
            img={ch.banner.img}
            title={ch.banner.title}
            subtitle={ch.banner.subtitle}
            dots={4}
            activeDot={0}
            bind={bannerBind()}
          />
        )}

        {bodyByChannel[channelKey]}

        {/* 体育/游戏的内容楼层:种子只给了赛程,楼层标题保留入口态(暂未开放) */}
        {(channelKey === 'sports' || channelKey === 'game') && (
          <SectionHeader
            title={activeTab}
            right={
              <button
                {...deepBind()}
                className="bg-transparent border-none p-0 text-[12px]"
                style={{ color: C.textSub }}
              >
                更多
              </button>
            }
          />
        )}

        <div className="h-6" />
      </div>
    </div>
  );
}
