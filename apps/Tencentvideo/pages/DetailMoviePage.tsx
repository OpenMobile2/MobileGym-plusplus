// 电影详情页(音轨切换 + 系列电影横滑)。节点 detail.movie(spec v1.2.0,19 条交互)。
// 视觉证据:789(黑底内嵌播放器 + 贴片广告已暂停态 + 黑金运营条 + 3 tab + 竖版海报信息区 +
// 「英语∨」音轨入口 + 绿标评分 + 热度 chip + 5 键操作行 + 广告卡 + 系列电影横滑)、
// 788(系列电影横滑:VIP 角标 + 右下评分 + 「正在播放」盖章)。
//
// 与 detail.series 的差异:无选集区(电影单片)、信息区是「左海报右文案」、
// 顶栏多一个「预约小电视」icon、底部楼层是系列电影而非推荐楼层。
import React, { useEffect, useMemo, useRef } from 'react';
import { usePlaybackTicker } from '../hooks/usePlaybackTicker';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTvContent } from '../hooks/useTvParams';
import { useDeclarePlayerOrientation } from '../hooks/usePlayerOrientation';
import { useTencentvideoStore } from '../state';
import { TV_COLORS as C } from '../constants';
import { PlayerCore, ProgressBar } from '../components/PlayerCore';
import { TvImg } from '../components/Img';
import {
  DetailActionRow,
  DetailAdCard,
  DetailTabRow,
  OpBanner,
  PausedAdOverlay,
  PlayerTopBar,
  PortraitControlRow,
  isDanmakuOn,
  stillOf,
  type DetailActionItem,
} from '../components/detail';
import {
  IcArrowDown, IcArrowRight, IcCast, IcDownload, IcFollow, IcHeat,
  IcPlay, IcThumbsUp, IcTogether, IcTv,
} from '../res/icons';

const UI_TAB = 'detail.movie.tab';
const UI_INTRO = 'detail.movie.introExpanded';
const UI_AUDIO = 'detail.movie.audioTrack';

/** 「1:52:48」→ 秒。电影片长来自 content.duration(证据 789 右下角总时长)。 */
function durationToSec(text: string | undefined): number | undefined {
  if (!text) return undefined;
  const parts = text.split(':').map((n) => Number(n));
  if (parts.some((n) => Number.isNaN(n))) return undefined;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

export default function DetailMoviePage() {
  const { bindTap, bindBack } = useTencentvideoGestures();
  const s = useTencentvideoStrings();
  usePlaybackTicker();
  useDeclarePlayerOrientation('portrait');

  const content = useTvContent('mv_');
  const detail = useTencentvideoStore((st) => st.detail);
  const user = useTencentvideoStore((st) => st.user);
  const contents = useTencentvideoStore((st) => st.contents);
  const series = useTencentvideoStore((st) => st.series);
  const player = useTencentvideoStore((st) => st.player);
  const playback = useTencentvideoStore((st) => st.playback);
  const chasing = useTencentvideoStore((st) => st.chasing);
  const recommendedIds = useTencentvideoStore((st) => st.recommendedIds);
  const wontfixToast = useTencentvideoStore((st) => st.wontfixToast);
  const ui = useTencentvideoStore((st) => st.ui);

  const toast = useTencentvideoStore((st) => st.toast);
  const setUi = useTencentvideoStore((st) => st.setUi);
  const openPlayback = useTencentvideoStore((st) => st.openPlayback);
  const seekPlayback = useTencentvideoStore((st) => st.seekPlayback);
  const chaseToggle = useTencentvideoStore((st) => st.chaseToggle);
  const recommendToggle = useTencentvideoStore((st) => st.recommendToggle);

  const seriesRowRef = useRef<HTMLDivElement>(null);

  const contentId = content?.id ?? '';
  const durationSec = durationToSec(typeof content?.duration === 'string' ? content.duration : undefined);

  // 进详情即建立播放上下文(证据 789:进页就是播放中的贴片广告暂停态),片长照 content.duration
  useEffect(() => {
    if (!contentId || playback.contentId === contentId) return;
    openPlayback(contentId, 1, durationSec);
  }, [contentId, playback.contentId, durationSec, openPlayback]);

  // 电影形态只有 详情/二创/讨论 三个 tab(证据 789),取 detail.tabs 的前三项
  const tabs = useMemo(() => detail.tabs.slice(0, 3), [detail.tabs]);
  const activeTab = (ui[UI_TAB] as string) || tabs[0];
  const introExpanded = ui[UI_INTRO] === true;

  const audioTracks = useMemo<string[]>(
    () => (Array.isArray(content?.audioTracks) ? (content.audioTracks as string[]) : []),
    [content],
  );
  const activeAudio = (ui[UI_AUDIO] as string) || audioTracks[0] || '';

  const isChasing = chasing.some((c) => c.contentId === contentId);
  const isRecommended = recommendedIds.includes(contentId);

  /** 系列电影楼层:series[seriesKey].ids 顺序展开(证据 788) */
  const seriesGroup = typeof content?.seriesKey === 'string' ? series[content.seriesKey] : undefined;
  const seriesItems = useMemo(() => {
    if (!seriesGroup) return [];
    return seriesGroup.ids
      .map((id) => contents.find((c) => c.id === id))
      .filter((c) => c !== undefined);
  }, [seriesGroup, contents]);

  if (!content) return null;

  /* ---------- 播放器区 ---------- */

  // 画面与控件行整体进竖屏播放态(播放器控件交互归 player.portrait 节点)
  const enterPortrait = bindTap('player.portrait.open.fromMovie');

  const playerBlock = (
    <div className="relative shrink-0" style={{ background: C.darkBg }}>
      <PlayerCore
        stillId={stillOf(content)}
        danmaku={false}
        surfaceBind={enterPortrait}
        topSlot={
          <PlayerTopBar
            backBind={bindBack()}
            svipLabel={user.membership === 'svip' ? user.vipLevelLabel : s.upgradeSvip}
            svipBind={bindTap('vip.cashier.open.fromDetail')}
            shareBind={bindTap('player.sheets.open.share.fromDetail', { params: { sheet: 'share' } })}
            moreBind={bindTap('player.sheets.open.more.fromDetail', { params: { sheet: 'more' } })}
            castSlot={
              /* 电影顶栏比剧集多一个「预约小电视」icon(证据 789) */
              <>
                <button
                  {...bindTap('cast.search.open.fromDetail', { params: { contentId } })}
                  className="bg-transparent border-none p-1 text-white"
                  aria-label="投屏"
                >
                  <IcTv size={19} />
                </button>
                <button
                  {...bindTap({ kind: 'action', id: 'detail.movie.reserveIcon.wontfix' }, {
                    onTrigger: () => toast(s.notOpen),
                  })}
                  className="bg-transparent border-none p-1 text-white"
                  aria-label="预约"
                >
                  <IcFollow size={18} />
                </button>
              </>
            }
          />
        }
        centerSlot={
          playback.playing ? undefined : (
            <PausedAdOverlay
              img={detail.adCard.img}
              badge={detail.adOverlay.badge}
              pausedLabel={detail.adOverlay.paused}
              buttonLabel={detail.adOverlay.button}
              closeBind={enterPortrait}
              ctaBind={enterPortrait}
              subtitle={content.recommend}
            />
          )
        }
      />
      <div className="absolute inset-x-0 bottom-0">
        <PortraitControlRow
          playing={playback.playing}
          positionSec={playback.positionSec}
          durationSec={playback.durationSec}
          playBind={enterPortrait}
          progressSlot={<ProgressBar onSeek={seekPlayback} dataProps={enterPortrait} />}
          danmakuOn={isDanmakuOn(player.danmaku.mode)}
          danmakuBind={enterPortrait}
          fullscreenBind={enterPortrait}
        />
      </div>
    </div>
  );

  /* ---------- tab 行 ---------- */

  // bindTap 提到分支外:tab 是页内 ui 态不是 URL search,避免声明检查误报 fromSearchTooBroad
  const ugcTabBind = bindTap('detail.ugc.open.fromTab', { params: { contentId } });
  const discussTabBind = bindTap('detail.discuss.open.fromTab', { params: { contentId } });
  const introTabBind = (tab: string) =>
    bindTap({ kind: 'action', id: 'detail.movie.intro.expand' }, {
      onTrigger: () => setUi(UI_TAB, tab),
    });
  const tabBind = (tab: string) => {
    if (tab === '二创') return ugcTabBind;
    if (tab === '讨论') return discussTabBind;
    return introTabBind(tab);
  };

  /* ---------- 操作行 ---------- */

  const actionItems: DetailActionItem[] = [
    {
      key: 'recommend',
      label: isRecommended ? s.detailRecommended : s.detailRecommend,
      icon: <IcThumbsUp size={22} />,
      active: isRecommended,
      bind: bindTap({ kind: 'action', id: 'detail.recommend.toggle' }, {
        onTrigger: () => recommendToggle(contentId),
      }),
    },
    {
      key: 'follow',
      label: isChasing ? s.detailFollowed : s.detailFollow,
      icon: <IcFollow size={22} />,
      active: isChasing,
      bind: bindTap({ kind: 'action', id: 'detail.follow.toggle' }, {
        onTrigger: () => chaseToggle(contentId),
      }),
    },
    {
      key: 'download',
      label: s.detailDownload,
      icon: <IcDownload size={22} />,
      bind: bindTap('download.select.open.fromDetail', { params: { contentId } }),
    },
    {
      key: 'cast',
      label: s.detailCast,
      icon: <IcCast size={22} />,
      bind: bindTap('cast.search.open.fromDetailAction', { params: { contentId } }),
    },
    {
      key: 'together',
      label: s.detailWatchTogether,
      icon: <IcTogether size={22} />,
      bind: bindTap({ kind: 'action', id: 'detail.movie.together.wontfix' }, {
        onTrigger: () => toast(s.notOpen),
      }),
    },
  ];

  /* ---------- 信息区(证据 789:左竖版海报 + 右文案) ---------- */

  const metaLine = [
    content.year !== undefined ? String(content.year) : '',
    content.region ?? '',
    ...(content.cast ?? []).map((m) => m.name),
  ].filter(Boolean).join(' ');

  const infoBlock = (
    <div className="flex gap-3 px-3 pt-1">
      <div className="w-[86px] shrink-0 rounded-lg overflow-hidden aspect-[3/4]">
        <TvImg id={content.poster} alt={content.title} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[21px] font-bold leading-tight truncate" style={{ color: C.text }}>
            {content.title}
          </span>
          {activeAudio && (
            <button
              {...bindTap({ kind: 'action', id: 'detail.movie.audioTrack.switch' }, {
                onTrigger: () => {
                  if (audioTracks.length < 2) return;
                  const next = audioTracks[(audioTracks.indexOf(activeAudio) + 1) % audioTracks.length];
                  setUi(UI_AUDIO, next);
                  toast(`已切换为${next}`);
                },
              })}
              className="shrink-0 flex items-center rounded-[4px] border px-1.5 py-[2px] text-[12px]"
              style={{ borderColor: C.divider, color: C.text, background: 'transparent' }}
            >
              {activeAudio}
              <IcArrowDown size={12} />
            </button>
          )}
        </div>
        <button
          {...bindTap({ kind: 'action', id: 'detail.movie.intro.expand' }, {
            onTrigger: () => setUi(UI_INTRO, !introExpanded),
          })}
          className="mt-1.5 flex items-start gap-1 text-left bg-transparent border-none p-0 text-[12px] leading-[17px]"
          style={{ color: C.textSub }}
        >
          <span className="line-clamp-2">{metaLine}</span>
          <span className="shrink-0 flex items-center">
            {s.intro}
            <IcArrowRight size={12} />
          </span>
        </button>
        {typeof content.rating === 'number' && Number.isFinite(content.rating) && (
          <div className="mt-2 flex items-center gap-1">
            <span
              className="w-[15px] h-[15px] rounded-full flex items-center justify-center text-white"
              style={{ background: C.primary }}
            >
              <IcPlay size={9} />
            </span>
            <span className="text-[14px] font-semibold" style={{ color: C.text }}>
              {content.rating.toFixed(1)}
              <span className="text-[11px] font-normal">分</span>
            </span>
            <IcArrowRight size={12} color={C.textSub} />
          </div>
        )}
        {typeof content.heat === 'number' && Number.isFinite(content.heat) && (
          <span
            className="mt-2 inline-flex items-center gap-0.5 rounded-full px-2 py-[3px] text-[12px]"
            style={{ background: C.chipGray, color: C.textSub }}
          >
            <IcHeat size={12} />
            {content.heat}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full" style={{ background: C.pageBg }}>
      {playerBlock}
      <OpBanner
        title={detail.opBannerVariety.title}
        sub={detail.opBannerVariety.sub}
        button={user.membership === 'svip' ? s.renewSvip : detail.opBannerVariety.button}
        bind={bindTap('vip.cashier.open.fromDetail')}
        buttonBind={bindTap('vip.cashier.open.fromDetail')}
      />

      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <DetailTabRow
          tabs={tabs}
          activeTab={activeTab}
          badges={{ 讨论: content.discussText?.replace(/^讨论/, '') }}
          getTabBind={tabBind}
        />

        {infoBlock}

        {introExpanded && content.desc && (
          <div className="px-3 pt-2 text-[13px] leading-[21px]" style={{ color: C.textSub }}>
            {content.desc}
          </div>
        )}

        <DetailActionRow items={actionItems} />

        <DetailAdCard
          img={detail.adCard.img}
          badge={detail.adCard.badge}
          title={detail.adCard.title}
          button={detail.adCard.button}
          bind={bindTap({ kind: 'action', id: 'detail.movie.ad.wontfix' }, {
            onTrigger: () => toast(s.notOpen),
          })}
        />

        {seriesGroup && seriesItems.length > 0 && (
          <div className="pt-4">
            <button
              {...bindTap({ kind: 'action', id: 'detail.movie.seriesRow.swipe' }, {
                onTrigger: () => seriesRowRef.current?.scrollBy({ left: 160, behavior: 'smooth' }),
              })}
              className="block px-3 pb-2 bg-transparent border-none text-[17px] font-bold"
              style={{ color: C.text }}
            >
              {seriesGroup.title}
            </button>
            <div
              ref={seriesRowRef}
              className="flex gap-2 overflow-x-auto px-3 scrollbar-none"
              data-scroll-container="seriesRow"
              data-scroll-direction="horizontal"
            >
              {seriesItems.map((c) => {
                const current = c.id === contentId;
                return (
                  <div key={c.id} className="shrink-0 w-[152px]">
                    <div
                      {...(current
                        ? {}
                        : bindTap('detail.movie.open.fromSeries', { params: { contentId: c.id } }))}
                      className="relative rounded-md overflow-hidden aspect-video"
                    >
                      <TvImg
                        id={c.still ?? c.poster}
                        alt={c.title}
                        className="w-full h-full object-cover"
                      />
                      {c.badge && (
                        <span
                          className="absolute top-0 right-0 px-1 py-[1px] text-[10px] leading-[14px] font-semibold rounded-bl-[4px]"
                          style={{ background: C.vipBadgeBg, color: C.vipBadgeText }}
                        >
                          {c.badge}
                        </span>
                      )}
                      {current ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span
                            className="rounded-[3px] px-1.5 py-[2px] text-[11px] text-white"
                            style={{ background: C.toastBg }}
                          >
                            {detail.playingLabel}
                          </span>
                        </div>
                      ) : null}
                      {typeof c.rating === 'number' && Number.isFinite(c.rating) && (
                        <span className="absolute bottom-0.5 right-1.5 text-[15px] font-semibold text-white">
                          {c.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div
                      className="mt-1.5 text-[13px] truncate"
                      style={{ color: current ? C.primary : C.text }}
                    >
                      {c.title}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="h-6" />
      </div>
    </div>
  );
}
