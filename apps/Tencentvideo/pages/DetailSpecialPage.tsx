// 剧场版/多集片详情页(繁花形态)。节点 detail.special(spec v1.2.0,17 条交互)。
// 视觉证据:804(顶部黑条未播态「▶ 立即播放」+ tab 行右侧金按钮 + 灰底分数 pill 行 +
// 5 键操作行 +「选集 全6集 ›」+ 宽标题选集 chip + 广告卡 + 双列推荐卡带 ⋮)、
// 810(点「立即播放」后:播放器展开 + 贴片广告已暂停态 + 黑金运营条 + 选中 chip 青底带 VIP 角标)、
// 802(同族滚动态)。
//
// 与 detail.series 的差异:默认不展开播放器(黑条形态)、站外分同排展示、
// 选集是宽标题 chip 而非数字 chip、底部是双列推荐卡而非横滑推荐楼层。
import React, { useMemo } from 'react';
import { usePlaybackTicker } from '../hooks/usePlaybackTicker';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTvContent } from '../hooks/useTvParams';
import { useDeclarePlayerOrientation } from '../hooks/usePlayerOrientation';
import { useTencentvideoStore } from '../state';
import { TV_COLORS as C } from '../constants';
import { PlayerCore } from '../components/PlayerCore';
import { PosterCard } from '../components/PosterCard';
import { landscapeCornerNote, RankChip } from '../components/cards';
import { Badge } from '../components/ui';
import {
  DetailActionRow,
  DetailAdCard,
  EpisodeSectionHeader,
  OpBanner,
  PausedAdOverlay,
  stillOf,
  type DetailActionItem,
} from '../components/detail';
import { DetailHostBar, DetailSubTabRow, StaticPlayerControlRow } from '../components/detailExtra';
import {
  IcArrowRight, IcCast, IcDownload, IcFollow, IcHeat, IcMoreVertical,
  IcNavBack, IcThumbsUp, IcTogether, IcTv,
} from '../res/icons';

const UI_TAB = 'detail.special.tab';
const UI_INTRO = 'detail.special.introExpanded';
const UI_PLAYING = 'detail.special.playerOpen';

/** 顶部黑条的「立即播放」文案(证据 804;spec 未给种子字段,属结构性标签) */
const PLAY_NOW_LABEL = '立即播放';

export default function DetailSpecialPage() {
  const { bindTap, bindBack } = useTencentvideoGestures();
  const s = useTencentvideoStrings();
  usePlaybackTicker();
  useDeclarePlayerOrientation('portrait');

  const content = useTvContent('tv_hushanghuakai');
  const detail = useTencentvideoStore((st) => st.detail);
  const user = useTencentvideoStore((st) => st.user);
  const contents = useTencentvideoStore((st) => st.contents);
  const playback = useTencentvideoStore((st) => st.playback);
  const chasing = useTencentvideoStore((st) => st.chasing);
  const recommendedIds = useTencentvideoStore((st) => st.recommendedIds);
  const wontfixToast = useTencentvideoStore((st) => st.wontfixToast);
  const ui = useTencentvideoStore((st) => st.ui);

  const toast = useTencentvideoStore((st) => st.toast);
  const setUi = useTencentvideoStore((st) => st.setUi);
  const openPlayback = useTencentvideoStore((st) => st.openPlayback);
  const selectEpisode = useTencentvideoStore((st) => st.selectEpisode);
  const chaseToggle = useTencentvideoStore((st) => st.chaseToggle);
  const recommendToggle = useTencentvideoStore((st) => st.recommendToggle);

  const contentId = content?.id ?? '';
  const tabs = useMemo(() => detail.tabs.slice(0, 3), [detail.tabs]);
  const activeTab = (ui[UI_TAB] as string) || tabs[0];
  const introExpanded = ui[UI_INTRO] === true;
  const playerOpen = ui[UI_PLAYING] === true && playback.contentId === contentId;

  const isChasing = chasing.some((c) => c.contentId === contentId);
  const isRecommended = recommendedIds.includes(contentId);
  const currentEpisode = playback.contentId === contentId ? playback.episodeIndex : 0;

  const episodes = useMemo(
    () => Array.from({ length: content?.episodes ?? 0 }, (_, i) => i + 1),
    [content?.episodes],
  );

  /** 双列推荐卡:同品类其他内容(证据 804 繁花 / 这一秒过火) */
  const recommendItems = useMemo(() => {
    if (!content) return [];
    return contents
      .filter((c) => c.id !== content.id && c.category === content.category)
      .slice(0, 4);
  }, [content, contents]);

  if (!content) return null;

  /** 切到第 episode 集并保证播放器已展开 */
  const playEpisode = (episode: number) => {
    if (playback.contentId === contentId) selectEpisode(episode);
    else openPlayback(contentId, episode);
    setUi(UI_PLAYING, true);
  };

  const playStartBind = bindTap({ kind: 'action', id: 'detail.special.play.start' }, {
    onTrigger: () => playEpisode(currentEpisode > 0 ? currentEpisode : 1),
  });

  /* ---------- 顶部:黑条未播态 / 播放器展开态 ---------- */

  const castBind = bindTap('cast.search.open.fromDetail', { params: { contentId } });

  const topBlock = playerOpen ? (
    <div className="relative shrink-0" style={{ background: C.darkBg }}>
      <PlayerCore
        stillId={stillOf(content)}
        danmaku={false}
        topSlot={
          /* 展开态顶栏只有返回与投屏(证据 810);分享/更多在本路由没有申报 transition */
          <div className="flex items-center h-11 px-2 text-white">
            <button {...bindBack()} className="bg-transparent border-none p-1 text-white" aria-label={s.back}>
              <IcNavBack size={22} />
            </button>
            <div className="flex-1" />
            <button {...castBind} className="bg-transparent border-none p-1 text-white" aria-label="投屏">
              <IcTv size={19} />
            </button>
          </div>
        }
        centerSlot={
          <PausedAdOverlay
            img={detail.adCard.img}
            badge={detail.adOverlay.badge}
            pausedLabel={detail.adOverlay.paused}
            buttonLabel={detail.adOverlay.button}
            subtitle={content.recommend}
          />
        }
      />
      <div className="absolute inset-x-0 bottom-0">
        <StaticPlayerControlRow
          playing={playback.playing}
          positionSec={playback.positionSec}
          durationSec={playback.durationSec}
        />
      </div>
    </div>
  ) : (
    <DetailHostBar
      backBind={bindBack()}
      playLabel={PLAY_NOW_LABEL}
      playBind={playStartBind}
      castBind={castBind}
    />
  );

  /* ---------- tab 行 ---------- */

  // bindTap 提到分支外:tab 是页内 ui 态不是 URL search,避免声明检查误报 fromSearchTooBroad
  const ugcTabBind = bindTap('detail.ugc.open.fromTab', { params: { contentId } });
  const discussTabBind = bindTap('detail.discuss.open.fromTab', { params: { contentId } });
  const introTabBind = (tab: string) =>
    bindTap({ kind: 'action', id: 'detail.special.intro.expand' }, {
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
      bind: bindTap({ kind: 'action', id: 'detail.special.together.wontfix' }, {
        onTrigger: () => toast(s.notOpen),
      }),
    },
  ];

  /* ---------- 分数 pill 行(证据 804:9.8分 / 站外8.1 / 热度) ---------- */

  const scorePill = (text: React.ReactNode, key: string) => (
    <span
      key={key}
      className="shrink-0 inline-flex items-center gap-0.5 rounded-full px-2.5 py-1 text-[13px]"
      style={{ background: C.chipGray, color: C.text }}
    >
      {text}
    </span>
  );

  return (
    <div className="flex flex-col h-full" style={{ background: C.pageBg }}>
      {topBlock}
      {playerOpen && (
        <OpBanner
          title={detail.opBannerVariety.title}
          sub={detail.opBannerVariety.sub}
          button={user.membership === 'svip' ? s.renewSvip : detail.opBannerVariety.button}
          bind={bindTap('vip.cashier.open.fromDetail')}
          buttonBind={bindTap('vip.cashier.open.fromDetail')}
        />
      )}

      <DetailSubTabRow
        tabs={tabs}
        activeTab={activeTab}
        badges={{ 讨论: typeof content.discussCount === 'number' ? String(content.discussCount) : undefined }}
        getTabBind={tabBind}
        ctaLabel={user.membership === 'svip' ? s.renewSvip : detail.opBannerVariety.button}
        ctaBind={bindTap('vip.cashier.open.fromDetail')}
      />

      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <div className="px-3 pt-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[21px] font-bold leading-tight truncate" style={{ color: C.text }}>
              {content.title}
            </span>
            <button
              {...bindTap({ kind: 'action', id: 'detail.special.intro.expand' }, {
                onTrigger: () => setUi(UI_INTRO, !introExpanded),
              })}
              className="shrink-0 flex items-center bg-transparent border-none p-0 text-[13px]"
              style={{ color: C.textSub }}
            >
              {s.intro}
              <IcArrowRight size={13} />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2 overflow-x-auto scrollbar-none">
            {typeof content.rating === 'number' &&
              Number.isFinite(content.rating) &&
              scorePill(
                <>
                  <b className="text-[14px]">{content.rating.toFixed(1)}</b>分
                </>,
                'rating',
              )}
            {typeof content.outerRating === 'string' && scorePill(content.outerRating, 'outer')}
            {typeof content.heat === 'number' &&
              Number.isFinite(content.heat) &&
              scorePill(
                <>
                  <IcHeat size={12} />
                  {content.heat}
                </>,
                'heat',
              )}
          </div>
        </div>

        {introExpanded && content.desc && (
          <div className="px-3 pt-2 text-[13px] leading-[21px]" style={{ color: C.textSub }}>
            {content.desc}
          </div>
        )}

        <DetailActionRow items={actionItems} />

        <EpisodeSectionHeader
          label={s.episodeSection}
          note={`全${content.episodes ?? episodes.length}集`}
          bind={bindTap('detail.episodePanel.open.fromSpecial', { params: { contentId } })}
        />
        {/* 宽标题选集 chip(证据 804/810):种子暂无分集标题,按「第N集」呈现 */}
        <div
          className="flex gap-2 overflow-x-auto px-3 pb-1 scrollbar-none"
          data-scroll-container="episodes"
          data-scroll-direction="horizontal"
        >
          {episodes.map((ep) => {
            const active = ep === currentEpisode;
            const vip = content.vipFrom !== undefined && ep >= content.vipFrom;
            return (
              <button
                key={ep}
                {...bindTap({ kind: 'action', id: 'detail.special.episode.select' }, {
                  onTrigger: () => playEpisode(ep),
                })}
                className="relative shrink-0 w-[150px] min-h-[54px] rounded-md border-none px-3 py-2 text-left text-[13px] leading-[18px]"
                style={{
                  background: active ? C.primaryBg : C.chipGray,
                  color: active ? C.primary : C.text,
                }}
              >
                第{ep}集
                {vip && (
                  <span className="absolute top-0 right-0">
                    <Badge text="VIP" variant="vip" className="rounded-none rounded-bl-[4px] rounded-tr-[6px]" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <DetailAdCard
          img={detail.adCard.img}
          badge={detail.adCard.badge}
          title={detail.adCard.title}
          button={detail.adCard.button}
          bind={bindTap({ kind: 'action', id: 'detail.special.ad.wontfix' }, {
            onTrigger: () => toast(s.notOpen),
          })}
        />

        <div className="grid grid-cols-2 gap-x-2.5 gap-y-4 px-3 pt-4">
          {recommendItems.map((c) => (
            <PosterCard
              key={c.id}
              content={c}
              size="md"
              cornerNote={landscapeCornerNote(c)}
              subtitle=""
              bind={bindTap('detail.series.open.fromRecommend', { params: { contentId: c.id } })}
              footer={
                <div className="flex items-center gap-1 mt-1">
                  <div className="flex-1 min-w-0 flex">
                    {typeof c.rankNote === 'string' && c.rankNote.length > 0 ? (
                      <RankChip text={c.rankNote} />
                    ) : (
                      <span className="text-[11px] truncate" style={{ color: C.textSub }}>
                        {c.recommend}
                      </span>
                    )}
                  </div>
                  <button
                    {...bindTap({ kind: 'action', id: 'detail.special.feedback.wontfix' }, {
                      stopPropagation: true,
                      onTrigger: () => toast(s.notOpen),
                    })}
                    className="shrink-0 bg-transparent border-none p-0 leading-none"
                    style={{ color: C.textSub }}
                    aria-label="更多"
                  >
                    <IcMoreVertical size={14} />
                  </button>
                </div>
              }
            />
          ))}
        </div>

        <div className="h-6" />
      </div>
    </div>
  );
}
