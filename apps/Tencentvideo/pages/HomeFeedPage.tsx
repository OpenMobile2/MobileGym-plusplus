// 首页·精选 feed。节点 home.feed(spec v1.1.0,19 条交互)。
// 视觉证据:832(沉浸态:banner 取色渐变压顶 + 搜索条 + 频道条 + 轮播 + 双列横版卡)、
// 827(滚动态:顶部转白底黑字 + 左上频道管理 icon + 信息流通栏大卡 + 底栏首位变「返回顶部」)。
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTencentvideoStore } from '../state';
import {
  CHANNEL_FULL_TABS,
  CHANNEL_LITE_TABS,
  CHANNEL_SHORTVIDEO_TAB,
  CHANNEL_HOME_TAB,
  CHROME_TOP_COLOR_KEY,
  HOME_SCROLLED_KEY,
  HOME_TOTOP_REQUEST_KEY,
  TV_COLORS as C,
} from '../constants';
import {
  ChannelHeader,
  ChasePill,
  FeedBigCard,
  InfoChip,
  LandscapeCard,
  RankChip,
} from '../components/cards';
import { TvImg } from '../components/Img';
import type { BindProps } from '../components/ui';
import { IcClose, IcMenu } from '../res/icons';

/** 首页 banner 取色(证据 832 顶部暗红压顶,取自 design-tokens 沉浸态样例) */
const HOME_THEME_COLOR = '#8C3A3A';

export default function HomeFeedPage() {
  const { bindTap, go } = useTencentvideoGestures();
  const s = useTencentvideoStrings();

  const contents = useTencentvideoStore((st) => st.contents);
  const channels = useTencentvideoStore((st) => st.channels);
  const channelTabs = useTencentvideoStore((st) => st.channelTabs);
  const channelPanelExtra = useTencentvideoStore((st) => st.channelPanelExtra);
  const chasing = useTencentvideoStore((st) => st.chasing);
  const dismissedFeedIds = useTencentvideoStore((st) => st.dismissedFeedIds);
  const wontfixToast = useTencentvideoStore((st) => st.wontfixToast);
  const toast = useTencentvideoStore((st) => st.toast);
  const chaseToggle = useTencentvideoStore((st) => st.chaseToggle);
  const dismissFeedCard = useTencentvideoStore((st) => st.dismissFeedCard);
  const setUi = useTencentvideoStore((st) => st.setUi);
  const ui = useTencentvideoStore((st) => st.ui);

  const home = channels.home ?? {};
  const scrollRef = useRef<HTMLDivElement>(null);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [bannerDragX, setBannerDragX] = useState(0);
  const bannerDragRef = useRef<{
    id: number;
    x: number;
    y: number;
    lastX: number;
    lastY: number;
    dragging: boolean;
  } | null>(null);
  const suppressBannerClickRef = useRef(false);
  const scrolled = ui[HOME_SCROLLED_KEY] === true;
  const panelOpen = ui['home.feed.channelpanel'] === true;

  // 进入首页时清掉上次遗留的滚动态/面板态(store.ui 会被持久化)
  useEffect(() => {
    setUi(HOME_SCROLLED_KEY, false);
    setUi('home.feed.channelpanel', false);
  }, [setUi]);

  // 沉浸态时把 banner 取色交给 AppShell,让红色铺到状态栏底下(证据 832);滚动态/离开首页恢复白底
  useEffect(() => {
    setUi(CHROME_TOP_COLOR_KEY, scrolled ? '' : HOME_THEME_COLOR);
    return () => setUi(CHROME_TOP_COLOR_KEY, '');
  }, [scrolled, setUi]);

  const byId = useMemo(() => {
    const m = new Map<string, (typeof contents)[number]>();
    for (const c of contents) m.set(c.id, c);
    return m;
  }, [contents]);

  const gridItems = useMemo(
    () => (home.grid ?? []).map((id) => byId.get(id)).filter((c) => c !== undefined),
    [home.grid, byId],
  );
  const feedItems = useMemo(
    () =>
      (home.feed ?? [])
        .filter((f) => !dismissedFeedIds.includes(f.contentId))
        .map((f) => ({ card: f, content: byId.get(f.contentId) }))
        .filter((x) => x.content !== undefined),
    [home.feed, byId, dismissedFeedIds],
  );

  const banner = home.banner;
  const bannerContent = banner?.contentId ? byId.get(banner.contentId) : undefined;
  /**
   * 推荐轮播池:主 banner + 双列 grid + 信息流 feed(去重)。
   * 指示点数量 = 池长度,每页用各自剧照/海报,不再共用 banner.img。
   */
  const bannerPool = useMemo(() => {
    type Slide = { id: string; title: string; img: string; category: string };
    const seen = new Set<string>();
    const slides: Slide[] = [];
    const push = (
      id: string | undefined,
      title: string | undefined,
      img: string | undefined,
      category: string | undefined,
    ) => {
      if (!id || seen.has(id) || !img) return;
      seen.add(id);
      slides.push({ id, title: title ?? '', img, category: category ?? '' });
    };
    if (bannerContent) {
      push(
        bannerContent.id,
        banner?.title ?? bannerContent.title,
        banner?.img ?? bannerContent.still ?? bannerContent.poster,
        bannerContent.category,
      );
    }
    for (const c of gridItems) {
      push(c.id, c.title, c.still ?? c.poster, c.category);
    }
    for (const { content: c } of feedItems) {
      if (!c) continue;
      push(c.id, c.title, c.still ?? c.poster, c.category);
    }
    return slides;
  }, [banner, bannerContent, gridItems, feedItems]);
  const bannerCount = Math.max(1, bannerPool.length);
  const currentBanner = bannerPool[bannerIndex % bannerCount];

  const advanceBanner = (step: number) => {
    if (bannerCount <= 1) return;
    setBannerIndex((index) => (index + step + bannerCount) % bannerCount);
  };

  // 首屏推荐广告自动轮播；页面不可见、用户正在拖动或系统要求减少动画时暂停。
  useEffect(() => {
    if (
      bannerCount <= 1 ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible' && !bannerDragRef.current?.dragging) {
        setBannerIndex((index) => (index + 1) % bannerCount);
      }
    }, 4500);
    return () => window.clearInterval(timer);
  }, [bannerCount]);

  const onBannerPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    bannerDragRef.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      dragging: false,
    };
    // 按下即捕获，桌面鼠标即使划出卡片/设备画布也能收到 move 与 up。
    if (typeof event.currentTarget.setPointerCapture === 'function') {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };

  const onBannerPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = bannerDragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    if (!drag.dragging) {
      if (Math.abs(dx) < 6 || Math.abs(dx) <= Math.abs(dy)) return;
      drag.dragging = true;
    }
    event.preventDefault();
    setBannerDragX(Math.max(-100, Math.min(100, dx)));
    // 模拟器可能在鼠标离开设备画布后吞掉 pointerup；越过阈值即刻提交，不再依赖抬手事件。
    if (Math.abs(dx) >= 24) finishBannerPointer(event);
  };

  const finishBannerPointer = (
    event: React.PointerEvent<HTMLDivElement>,
    cancelled = false,
  ) => {
    const drag = bannerDragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    if (!cancelled) {
      drag.lastX = event.clientX;
      drag.lastY = event.clientY;
    }
    const dx = drag.lastX - drag.x;
    if (drag.dragging) {
      suppressBannerClickRef.current = true;
      // 24px 即翻页；被宿主取消但已经形成明确横滑时也提交，贴近模拟器操作习惯。
      if (Math.abs(dx) >= 24) advanceBanner(dx < 0 ? 1 : -1);
      window.setTimeout(() => {
        suppressBannerClickRef.current = false;
      }, 350);
    }
    const hasCapture =
      typeof event.currentTarget.hasPointerCapture === 'function' &&
      event.currentTarget.hasPointerCapture(event.pointerId);
    bannerDragRef.current = null;
    setBannerDragX(0);
    if (hasCapture) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const onBannerPointerLeave = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = bannerDragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    const hasCapture =
      typeof event.currentTarget.hasPointerCapture === 'function' &&
      event.currentTarget.hasPointerCapture(event.pointerId);
    // 部分桌面模拟器不实现指针捕获，离开卡片就是最后一个可靠事件。
    if (!hasCapture) finishBannerPointer(event, true);
  };

  const isChasing = (id: string) => chasing.some((c) => c.contentId === id);

  const onScroll = () => {
    const top = scrollRef.current?.scrollTop ?? 0;
    const next = top > 120;
    if (next !== scrolled) setUi(HOME_SCROLLED_KEY, next);
  };

  // 底栏「返回顶部」由 TabBar 触发,经 ui 标志回传到本页执行滚动
  useEffect(() => {
    if (ui[HOME_TOTOP_REQUEST_KEY] !== true) return;
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    setUi(HOME_TOTOP_REQUEST_KEY, false);
    setUi(HOME_SCROLLED_KEY, false);
  }, [ui, setUi]);

  /** 频道 tab:按分组走三条 transition(精选=当前页不跳) */
  const tabBind = (tab: string): BindProps => {
    if (tab === CHANNEL_HOME_TAB) {
      return bindTap({ kind: 'action', id: 'home.feed.scroll.totop' }, {
        onTrigger: () => {
          scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
          setUi(HOME_SCROLLED_KEY, false);
        },
      });
    }
    if (CHANNEL_FULL_TABS.includes(tab)) {
      return bindTap('home.channel.full.switch.fromFeed', { params: { channel: tab } });
    }
    if (CHANNEL_LITE_TABS.includes(tab)) {
      return bindTap('home.channel.lite.switch.fromFeed', { params: { channel: tab } });
    }
    if (tab === CHANNEL_SHORTVIDEO_TAB) {
      return bindTap('home.shortvideo.switch.fromFeed');
    }
    return bindTap({ kind: 'action', id: 'home.feed.channelpanel.toggle' }, {
      onTrigger: () => toast(s.notOpen),
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* 顶部:沉浸态(banner 取色)/滚动态(白底) —— 滚动态左上出现频道管理 icon */}
      <div className="relative shrink-0">
        {scrolled && (
          <button
            {...bindTap({ kind: 'action', id: 'home.feed.channelmanage.wontfix' }, {
              onTrigger: () => toast(s.notOpen),
            })}
            className="absolute left-1 bottom-1.5 z-10 bg-transparent border-none p-1"
            style={{ color: C.text }}
            aria-label="频道管理"
          >
            <IcMenu size={18} />
          </button>
        )}
        <div className={scrolled ? 'pl-6' : ''}>
          <ChannelHeader
            placeholder={home.searchPlaceholder ?? ''}
            tabs={channelTabs}
            activeTab={CHANNEL_HOME_TAB}
            getTabBind={tabBind}
            searchBind={bindTap('search.hub.open.fromHome')}
            filterLabel="筛选"
            filterBind={bindTap('filter.page.open.fromSearchbar')}
            gamepadBind={bindTap({ kind: 'action', id: 'home.feed.gamepad.wontfix' }, {
              onTrigger: () => toast(s.notOpen),
            })}
            expandBind={bindTap({ kind: 'action', id: 'home.feed.channelpanel.toggle' }, {
              onTrigger: () => setUi('home.feed.channelpanel', !panelOpen),
            })}
            immersive={!scrolled}
            themeColor={HOME_THEME_COLOR}
            highlightTab="少儿"
          />
        </div>
      </div>

      {/* 全部频道面板(∨ 展开;长尾频道 = toast 暂未开放) */}
      {panelOpen && (
        <div className="shrink-0 px-3 pb-3 pt-1" style={{ background: C.pageBg }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-semibold" style={{ color: C.text }}>
              全部频道
            </span>
            <button
              {...bindTap({ kind: 'action', id: 'home.feed.channelpanel.toggle' }, {
                onTrigger: () => setUi('home.feed.channelpanel', false),
              })}
              className="bg-transparent border-none p-0"
              style={{ color: C.textSub }}
              aria-label="收起"
            >
              <IcClose size={16} />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {channelPanelExtra.map((ch) => (
              <button
                key={ch}
                {...bindTap({ kind: 'action', id: 'home.feed.channelpanel.toggle' }, {
                  onTrigger: () => toast(s.notOpen),
                })}
                className="py-2 rounded-lg border-none text-[12px]"
                style={{ background: C.chipGray, color: C.textSub }}
              >
                {ch}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 主滚动区 */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto"
        style={{ background: C.pageBg }}
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* 轮播 banner:整卡进详情;左右滑切换 + 指示点(点数=推荐数) */}
        {currentBanner && (
          <div className="px-3 pb-1 -mt-1">
            <div
              {...bindTap({ kind: 'action', id: 'home.feed.banner.swipe' }, {
                onTrigger: () => {
                  if (!suppressBannerClickRef.current) advanceBanner(1);
                },
              })}
              onPointerDown={onBannerPointerDown}
              onPointerMove={onBannerPointerMove}
              onPointerUp={(event) => finishBannerPointer(event)}
              onPointerCancel={(event) => finishBannerPointer(event, true)}
              onPointerLeave={onBannerPointerLeave}
              onLostPointerCapture={(event) => finishBannerPointer(event, true)}
              className="relative w-full aspect-[16/9] rounded-xl overflow-hidden"
              style={{ background: C.chipGray, touchAction: 'pan-y' }}
            >
              <div
                className="absolute inset-0"
                style={{
                  transform: `translateX(${bannerDragX}px)`,
                  transition: bannerDragRef.current?.dragging
                    ? 'none'
                    : 'transform 180ms ease-out',
                }}
              >
                <TvImg
                  id={currentBanner.img}
                  alt={currentBanner.title}
                  className="w-full h-full object-cover"
                />
                <button
                  {...bindTap(
                    currentBanner.category === '电影'
                      ? 'detail.movie.open.fromFeedBanner'
                      : 'detail.series.open.fromFeedBanner',
                    {
                    params: { contentId: currentBanner.id },
                    stopPropagation: true,
                    onTrigger: () => {
                      if (suppressBannerClickRef.current) return;
                      if (currentBanner.category === '电影') {
                        go('detail.movie.open.fromFeedBanner', {
                          contentId: currentBanner.id,
                        });
                      } else {
                        go('detail.series.open.fromFeedBanner', {
                          contentId: currentBanner.id,
                        });
                      }
                    },
                  })}
                  className="absolute inset-0 w-full bg-transparent border-none p-0"
                  aria-label={currentBanner.title}
                />
                <div
                  className="absolute inset-x-0 bottom-0 px-3 pb-2.5 pt-6 pointer-events-none"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}
                >
                  <div className="text-white text-[15px] font-semibold truncate">
                    {currentBanner.title}
                  </div>
                </div>
              </div>
              <div className="absolute bottom-2.5 right-3 flex items-center gap-[3px] pointer-events-none">
                {bannerPool.map((b, i) => (
                  <span
                    key={b.id}
                    className="rounded-full"
                    style={{
                      width: bannerCount > 8 ? 4 : 6,
                      height: bannerCount > 8 ? 4 : 6,
                      background:
                        i === bannerIndex % bannerCount
                          ? '#FFFFFF'
                          : 'rgba(255,255,255,0.45)',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 双列横版剧卡 */}
        <div className="grid grid-cols-2 gap-x-2.5 gap-y-3 px-3 pt-2">
          {gridItems.map((c) => {
            const isMovie = c.category === '电影';
            const hasRank = typeof c.rankNote === 'string' && c.rankNote.length > 0;
            return (
              <LandscapeCard
                key={c.id}
                content={c}
                ratingCorner={isMovie}
                bind={
                  isMovie
                    ? bindTap('detail.movie.open.fromFeed', { params: { contentId: c.id } })
                    : bindTap('detail.series.open.fromFeed', { params: { contentId: c.id } })
                }
                moreBind={bindTap({ kind: 'action', id: 'home.feed.feedback.wontfix' }, {
                  stopPropagation: true,
                  onTrigger: () => toast(s.notOpen),
                })}
                chips={
                  hasRank ? (
                    <RankChip
                      text={String(c.rankNote)}
                      bind={bindTap('rank.page.open.fromFeedBadge', {
                        params: { contentId: c.id },
                        stopPropagation: true,
                      })}
                    />
                  ) : undefined
                }
              />
            );
          })}
        </div>

        {/* 信息流通栏大卡 */}
        <div className="pt-4">
          {feedItems.map(({ card, content }) => {
            const c = content!;
            const chasingNow = isChasing(c.id);
            const isMovie = c.category === '电影';
            return (
              <div key={c.id} className="pb-4">
                <FeedBigCard
                  content={c}
                  bind={
                    isMovie
                      ? bindTap('detail.movie.open.fromFeed', { params: { contentId: c.id } })
                      : bindTap('detail.series.open.fromFeed', { params: { contentId: c.id } })
                  }
                  countText={typeof c.followText === 'string' ? c.followText : undefined}
                  chaseSlot={
                    <ChasePill
                      chasing={chasingNow}
                      label={chasingNow ? '在追' : (card.btn ?? '追')}
                      bind={bindTap({ kind: 'action', id: 'home.feed.follow.toggle' }, {
                        params: { contentId: c.id },
                        stopPropagation: true,
                        onTrigger: () => chaseToggle(c.id),
                      })}
                    />
                  }
                  closeBind={bindTap({ kind: 'action', id: 'home.feed.card.dismiss' }, {
                    params: { contentId: c.id },
                    stopPropagation: true,
                    onTrigger: () => dismissFeedCard(c.id),
                  })}
                  chips={
                    <>
                      {card.note && (
                        <RankChip
                          text={card.note}
                          bind={bindTap('rank.page.open.fromFeedBadge', {
                            params: { contentId: c.id },
                            stopPropagation: true,
                          })}
                        />
                      )}
                      {typeof c.discussText === 'string' && (
                        <InfoChip text={c.discussText} arrow />
                      )}
                    </>
                  }
                />
              </div>
            );
          })}
        </div>

        {/* 广告卡(保留骨架位,点击 = 暂未开放) */}
        <div className="px-3 pb-6">
          <button
            {...bindTap({ kind: 'action', id: 'home.feed.ad.wontfix' }, {
              onTrigger: () => toast(s.notOpen),
            })}
            className="relative w-full aspect-[16/9] rounded-lg overflow-hidden border-none p-0"
            style={{ background: C.chipGray }}
          >
            <TvImg id="banner_shop.png" alt="广告" className="w-full h-full object-cover" />
            <span
              className="absolute bottom-1 right-1 px-1 py-[1px] rounded text-[10px] leading-[14px] text-white"
              style={{ background: C.maskBadge }}
            >
              广告
            </span>
          </button>
        </div>

        <div className="pb-2 text-center text-[11px]" style={{ color: C.textSub }}>
          {s.appName}
        </div>
      </div>
    </div>
  );
}
