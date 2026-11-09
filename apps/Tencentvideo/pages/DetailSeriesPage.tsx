// 剧集详情页(含综艺形态)。节点 detail.series(spec v1.2.0)。
// 视觉证据:824(剧集形态:黑底内嵌播放器 + 贴片广告已暂停态 + 黑金运营条 + 7 tab +
// 标题徽标行 + 5 键操作行 + 选集 chips + 广告卡 + 推荐楼层)、845(综艺形态:2 tab +
// 季横滑 + 子 tab + 期卡)、825(VIP 集金框提示 + 已推荐/已追选中态)、826(功能搬家引导气泡)。
//
// 播放器分工:顶部播放器区的画面/控件行按 spec 归 player.portrait 节点(独立路由),
// 本页的播放器区是「预览态」—— 画面与控件行整体走 player.portrait.open.fromSeries
// 进入竖屏播放态,顶栏 5 个 icon 则是本页自己的 transition(证据 824 顶栏)。
import React, { useEffect, useMemo } from 'react';
import { usePlaybackTicker } from '../hooks/usePlaybackTicker';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTvContent } from '../hooks/useTvParams';
import { useDeclarePlayerOrientation } from '../hooks/usePlayerOrientation';
import { useTencentvideoStore } from '../state';
import { RANK_BOARD_BY_CATEGORY, TV_COLORS as C, VIP_FRAME_SECONDS } from '../constants';
import { PlayerCore, ProgressBar } from '../components/PlayerCore';
import { PosterCard } from '../components/PosterCard';
import { TvImg } from '../components/Img';
import {
  CastRow,
  CommentEntryRow,
  DetailActionRow,
  DetailAdCard,
  DetailGuideBubble,
  DetailTabRow,
  DetailTitleBlock,
  EpisodeCardRow,
  EpisodeNumberChips,
  EpisodeSectionHeader,
  OpBanner,
  PausedAdOverlay,
  PillChipRow,
  PlayerTopBar,
  PortraitControlRow,
  RecommendFloor,
  SeasonRow,
  isDanmakuOn,
  stillOf,
  type DetailActionItem,
  type EpisodeCardItem,
} from '../components/detail';
import {
  IcCast, IcDownload, IcFollow, IcThumbsUp, IcTogether,
} from '../res/icons';
import type { TvContent } from '../types';
import {
  currentSeasonOf,
  seasonEpisodeStateOf,
  seasonNumbersOf,
  seasonSubTabsOf,
} from '../utils/seasonEpisodes';

/** 选集 chips 一次露出的窗口大小(证据 824:10-15 共 6 张) */
const EPISODE_WINDOW = 6;
/** 综艺期卡窗口(证据 845:3 张半) */
const EPISODE_CARD_WINDOW = 4;
/** 普通横屏剧集单集时长；与 store.openPlayback 的长内容默认值保持一致。 */
const SERIES_EPISODE_SEC = 2700;

const UI_TAB = 'detail.series.tab';
const UI_GROUP = 'detail.series.episodeGroup';
const UI_SEASON = 'playback.season';
const UI_SUBTAB = 'playback.subTab';
const UI_RECTAB = 'detail.series.recommendTab';
const UI_GUIDE_DONE = 'detail.series.guideDismissed';
const UI_INTRO = 'detail.series.introExpanded';
const UI_DRAFT = 'detail.series.commentDraft';

export default function DetailSeriesPage() {
  const { bindTap, bindBack } = useTencentvideoGestures();
  const s = useTencentvideoStrings();
  usePlaybackTicker();
  useDeclarePlayerOrientation('portrait');

  const content = useTvContent('tv_');
  const detail = useTencentvideoStore((st) => st.detail);
  const contents = useTencentvideoStore((st) => st.contents);
  const user = useTencentvideoStore((st) => st.user);
  const comments = useTencentvideoStore((st) => st.comments);
  const player = useTencentvideoStore((st) => st.player);
  const playback = useTencentvideoStore((st) => st.playback);
  const chasing = useTencentvideoStore((st) => st.chasing);
  const recommendedIds = useTencentvideoStore((st) => st.recommendedIds);
  const wontfixToast = useTencentvideoStore((st) => st.wontfixToast);
  const watchHistory = useTencentvideoStore((st) => st.watchHistory);
  const ui = useTencentvideoStore((st) => st.ui);

  const toast = useTencentvideoStore((st) => st.toast);
  const setUi = useTencentvideoStore((st) => st.setUi);
  const openPlayback = useTencentvideoStore((st) => st.openPlayback);
  const seekPlayback = useTencentvideoStore((st) => st.seekPlayback);
  const selectEpisode = useTencentvideoStore((st) => st.selectEpisode);
  const chaseToggle = useTencentvideoStore((st) => st.chaseToggle);
  const recommendToggle = useTencentvideoStore((st) => st.recommendToggle);
  const postComment = useTencentvideoStore((st) => st.postComment);

  const contentId = content?.id ?? '';
  const isVariety = content?.category === '综艺';
  const rankBoard = RANK_BOARD_BY_CATEGORY[content?.category ?? ''] ?? '';
  const tabs = isVariety ? detail.varietyTabs : detail.tabs;
  const opBanner = isVariety ? detail.opBannerVariety : detail.opBanner;

  // 进详情即建立播放上下文(证据 824:进页就是播放中态),并从观看历史续播 ——
  // 真机进详情时高亮的正是「正在播放」那一集(824 的第 12 集),不是第 1 集。
  useEffect(() => {
    if (!contentId || playback.contentId === contentId) return;
    const entry = watchHistory.find((h) => h.contentId === contentId);
    const ep = Number(entry?.episode?.match(/第(\d+)(?:集|期)$/)?.[1] ?? 1) || 1;
    openPlayback(contentId, ep, SERIES_EPISODE_SEC, entry?.season, entry?.subTab);
    if (entry?.progressPct) seekPlayback((entry.progressPct / 100) * SERIES_EPISODE_SEC);
  }, [contentId, playback.contentId, watchHistory, openPlayback, seekPlayback]);

  const activeTab = (ui[UI_TAB] as string) || tabs[0];
  // 没有真实直播列表时不展示「主创直播」空 tab。
  const episodeGroups = detail.episodeGroups.slice(0, 1);
  const episodeGroup = (ui[UI_GROUP] as string) || episodeGroups[0];
  const seasons = useMemo(() => seasonNumbersOf(content), [content]);
  const currentSeason = useMemo(() => currentSeasonOf(content, seasons), [content, seasons]);
  const seasonUiKey = `${UI_SEASON}.${contentId}`;
  const subTabUiKey = `${UI_SUBTAB}.${contentId}`;
  const requestedSeason = (ui[seasonUiKey] as number) || currentSeason;
  const activeSeason = seasons.includes(requestedSeason) ? requestedSeason : currentSeason;
  const subTabs = useMemo(() => seasonSubTabsOf(content, activeSeason), [content, activeSeason]);
  const requestedSubTab = (ui[subTabUiKey] as string) || subTabs[0] || '';
  const activeSubTab = subTabs.includes(requestedSubTab) ? requestedSubTab : subTabs[0] || '';
  const introExpanded = ui[UI_INTRO] === true;
  const guideOpen = ui[UI_GUIDE_DONE] !== true;

  const currentEpisode = playback.episodeIndex;
  const seasonEpisodeState = useMemo(
    () => seasonEpisodeStateOf(content, activeSeason, activeSubTab),
    [content, activeSeason, activeSubTab],
  );
  const seasonEpisodeTotal = seasonEpisodeState.available;
  const isChasing = chasing.some((c) => c.contentId === contentId);
  const isRecommended = recommendedIds.includes(contentId);
  // 金框只在 VIP 集开头露一小会儿(见 constants.VIP_FRAME_SECONDS 的证据说明)
  const vipFrameOn =
    content?.vipFrom !== undefined &&
    currentEpisode >= content.vipFrom &&
    playback.positionSec < VIP_FRAME_SECONDS;

  /**
   * 集数窗口:把「正在播放」那集摆在窗口中后段,右界不超过已更新集数。
   * 证据 824:更新至 15 集、在播第 12 集 → 露出 10-15,第 12 在第 3 位。
   */
  const episodeWindow = useMemo(() => {
    const total = content?.episodes ?? 0;
    const upTo = Math.max(1, content?.updatedTo ?? total);
    const anchor = currentEpisode > 0 ? currentEpisode : upTo;
    const end = Math.min(upTo, Math.max(anchor + 3, EPISODE_WINDOW));
    const start = Math.max(1, end - EPISODE_WINDOW + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [content?.episodes, content?.updatedTo, currentEpisode]);

  /** 综艺期卡:期号 + 确定性日期(以 updatedTo 期为最新,每期倒推 4 天) */
  const episodeCards = useMemo<EpisodeCardItem[]>(() => {
    if (!isVariety || !content) return [];
    const upTo = seasonEpisodeTotal;
    const start = Math.max(1, upTo - EPISODE_CARD_WINDOW + 1);
    return Array.from({ length: upTo - start + 1 }, (_, i) => {
      const ep = start + i;
      const dayOffset = (upTo - ep) * 4;
      const day = 24 - dayOffset;
      const dateText = day > 0 ? `2026-07-${String(day).padStart(2, '0')}` : `2026-06-${String(30 + day).padStart(2, '0')}`;
      return {
        episode: ep,
        title: `第${activeSeason}季·${activeSubTab}·第${ep}期:${content.recommend ?? content.title}`,
        dateText,
        vip: content.vipFrom !== undefined ? ep >= content.vipFrom : ep >= upTo - 1,
        still: content.still,
      };
    });
  }, [isVariety, content, seasonEpisodeTotal, activeSeason, activeSubTab]);

  /** 每个推荐 tab 有独立主题召回；无对应数据的 tab 不展示。 */
  const recommendPools = useMemo(() => {
    if (!content) return new Map<string, TvContent[]>();
    const sameCategory = contents.filter((item) => item.id !== content.id && item.category === content.category);
    const tags = new Set(content.tags);
    const cast = new Set((content.cast ?? []).map((member) => member.name));
    const byTheme = new Map<string, TvContent[]>();
    for (const tab of detail.recommendTabs) {
      let pool: TvContent[];
      if (tab === '极致虐恋') {
        pool = contents.filter((item) =>
          item.id !== content.id && item.tags.some((tag) => /(爱情|虐恋|情感|甜宠)/.test(tag)),
        );
      } else if (tab === '原著解析') {
        pool = sameCategory.filter((item) => item.tags.some((tag) => tags.has(tag)));
      } else if (tab === '追剧团') {
        pool = sameCategory.filter((item) =>
          (item.cast ?? []).some((member) => cast.has(member.name)) || item.tags.some((tag) => tags.has(tag)),
        );
      } else if (tab === '官方') {
        const titleRoot = content.title.replace(/[·第].*$/, '');
        pool = contents.filter((item) => {
          if (item.id === content.id) return false;
          const sameSeries = Boolean(content.seriesKey && item.seriesKey === content.seriesKey);
          const sameFamily = titleRoot.length > 1 && item.title.includes(titleRoot);
          const sameDirector = Boolean(content.director && item.director === content.director);
          return sameSeries || sameFamily || sameDirector;
        });
      } else {
        pool = sameCategory.filter((item) => item.tags.some((tag) => tags.has(tag)));
      }
      byTheme.set(tab, pool.slice(0, 6));
    }
    return byTheme;
  }, [content, contents, detail.recommendTabs]);
  const visibleRecommendTabs = detail.recommendTabs.filter((tab) => (recommendPools.get(tab)?.length ?? 0) > 0);
  const requestedRecommendTab = (ui[UI_RECTAB] as string) || visibleRecommendTabs[0];
  const recommendTab = visibleRecommendTabs.includes(requestedRecommendTab)
    ? requestedRecommendTab
    : visibleRecommendTabs[0] ?? '';
  const recommendItems = recommendPools.get(recommendTab) ?? [];

  const episodeIdentity = playback.season !== null
    ? `s${playback.season}-${playback.subTab ?? '正片'}-ep${playback.episodeIndex}`
    : `ep${playback.episodeIndex}`;
  const commentThreadKey = (content?.episodes ?? 1) > 1 || playback.season !== null
    ? `${contentId}#${episodeIdentity}`
    : contentId;
  const commentThread = comments[commentThreadKey] ?? comments[contentId];

  if (!content) return null;

  /* ---------- 播放器区 ---------- */

  // 画面与控件行都进竖屏播放态(spec:播放器控件交互归 player.portrait 节点)
  const enterPortrait = bindTap('player.portrait.open.fromSeries');

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
            castBind={bindTap('cast.search.open.fromDetail', { params: { contentId } })}
            shareBind={bindTap('player.sheets.open.share.fromDetail', { params: { sheet: 'share' } })}
            moreBind={bindTap('player.sheets.open.more.fromDetail', { params: { sheet: 'more' } })}
            vipNote={vipFrameOn ? detail.vipFrameNote : undefined}
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
      {/* 控件行:按钮/轻点都进竖屏播放态,但进度条在详情页就能直接拖(真机如此) */}
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
  const goodsTabBind = bindTap({ kind: 'action', id: 'detail.series.goodsTab.wontfix' }, {
    onTrigger: () => toast(s.notOpen),
  });
  const introTabBind = bindTap({ kind: 'action', id: 'detail.series.intro.expand' }, {
    onTrigger: () => setUi(UI_TAB, '详情'),
  });
  const extraTabBind = bindTap({ kind: 'action', id: 'detail.series.extraTab.wontfix' }, {
    onTrigger: () => toast(s.notOpen),
  });
  const tabBind = (tab: string) => {
    if (tab === '二创') return ugcTabBind;
    if (tab === '讨论') return discussTabBind;
    if (tab === '买周边') return goodsTabBind;
    if (tab === '详情') return introTabBind;
    return extraTabBind;
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
      bind: bindTap({ kind: 'action', id: 'detail.series.together.wontfix' }, {
        onTrigger: () => toast(s.notOpen),
      }),
    },
  ];

  /* ---------- 选集区 ---------- */

  const episodeSection = isVariety ? (
    <>
      <SeasonRow
        seasons={seasons}
        activeSeason={activeSeason}
        labelOf={(n) => `第${n}季`}
        getBind={(n) => bindTap({ kind: 'action', id: 'detail.series.season.switch' }, {
          onTrigger: () => {
            const nextSubTabs = seasonSubTabsOf(content, n);
            openPlayback(contentId, 1, SERIES_EPISODE_SEC, n, nextSubTabs[0]);
          },
        })}
        moreBind={bindTap('detail.episodePanel.open.fromDetail', { params: { contentId } })}
      />
      <PillChipRow
        chips={subTabs}
        activeChip={activeSubTab}
        getBind={(c) => bindTap({ kind: 'action', id: 'detail.series.subTab.switch' }, {
          onTrigger: () => openPlayback(contentId, 1, SERIES_EPISODE_SEC, activeSeason, c),
        })}
      />
      {content.updateNote && (
        <div className="px-3 pb-2 text-[12px]" style={{ color: C.textSub }}>
          {content.updateNote}
        </div>
      )}
      <EpisodeCardRow
        items={episodeCards}
        currentEpisode={currentEpisode}
        playingLabel={detail.playingLabel}
        getBind={(it) => bindTap({ kind: 'action', id: 'detail.series.episodeCard.select' }, {
          onTrigger: () => selectEpisode(it.episode),
        })}
      />
    </>
  ) : (
    <>
      <EpisodeSectionHeader
        label={s.episodeSection}
        // 完结剧只报「全N集」;连载中才有追剧日历与更新进度(证据 824)
        // episodes 缺省时绝不拼出「全undefined集」
        note={(content.episodes && (content.updatedTo ?? 0) >= content.episodes
          ? `全${content.episodes}集`
          : [
            detail.calendarLabel,
            content.updatedTo ? `更新至${content.updatedTo}集` : '',
            content.episodes ? `全${content.episodes}集` : '',
          ].filter(Boolean).join(' · ')) || undefined}
        bind={bindTap('detail.episodePanel.open.fromDetail', { params: { contentId } })}
      />
      <PillChipRow
        chips={episodeGroups}
        activeChip={episodeGroup}
        getBind={(c) => bindTap({ kind: 'action', id: 'detail.series.episodeGroup.switch' }, {
          onTrigger: () => setUi(UI_GROUP, c),
        })}
      />
      <EpisodeNumberChips
        episodes={episodeWindow}
        currentEpisode={currentEpisode}
        vipFrom={content.vipFrom}
        getBind={(ep, isVip) =>
          bindTap(
            { kind: 'action', id: isVip ? 'detail.series.episodeVip.select' : 'detail.series.episode.select' },
            { onTrigger: () => selectEpisode(ep) },
          )
        }
      />
    </>
  );

  return (
    <div className="flex flex-col h-full" style={{ background: C.pageBg }}>
      {playerBlock}
      <OpBanner
        title={isVariety ? opBanner.title : `《${content.title}》${opBanner.title}`}
        sub={opBanner.sub}
        button={isVariety && user.membership === 'svip' ? s.renewSvip : opBanner.button}
        bind={bindTap({ kind: 'action', id: 'detail.series.opButton.wontfix' }, {
          onTrigger: () => toast(s.notOpen),
        })}
        buttonBind={
          isVariety
            ? bindTap('vip.cashier.open.fromDetail')
            : bindTap({ kind: 'action', id: 'detail.series.opButton.wontfix' }, {
              onTrigger: () => toast(s.notOpen),
            })
        }
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

        <DetailTitleBlock
          title={content.title}
          introLabel={s.intro}
          introBind={bindTap({ kind: 'action', id: 'detail.series.intro.expand' }, {
            onTrigger: () => setUi(UI_INTRO, !introExpanded),
          })}
          rating={content.rating}
          doubanRating={isVariety ? 7.0 : undefined}
          heat={content.heat}
          rankNote={content.rankNote ? `${rankBoard}${content.rankNote}名` : undefined}
          genre={content.tags?.join('')}
        />

        {introExpanded && content.desc && (
          <div className="px-3 pt-2 text-[13px] leading-[21px]" style={{ color: C.textSub }}>
            {content.desc}
          </div>
        )}

        <DetailActionRow
          items={actionItems}
          guideSlot={
            guideOpen ? (
              <DetailGuideBubble
                icons={[
                  <IcThumbsUp key="a" size={22} />,
                  <IcFollow key="b" size={22} />,
                  <IcDownload key="c" size={22} />,
                  <IcCast key="d" size={22} />,
                  <IcTogether key="e" size={22} />,
                ]}
                text={detail.guide.text}
                text2={detail.guide.text2}
                button={detail.guide.button}
                arrowLeftPct={50}
                buttonBind={bindTap({ kind: 'action', id: 'detail.series.guide.dismiss' }, {
                  onTrigger: () => setUi(UI_GUIDE_DONE, true),
                })}
              />
            ) : undefined
          }
        />

        {episodeSection}

        <DetailAdCard
          img={detail.adCard.img}
          badge={detail.adCard.badge}
          title={detail.adCard.title}
          button={detail.adCard.button}
          bind={bindTap({ kind: 'action', id: 'detail.series.ad.wontfix' }, {
            onTrigger: () => toast(s.notOpen),
          })}
        />

        {content.cast && content.cast.length > 0 && (
          <div className="pt-4">
            <div className="px-3 pb-2 text-[17px] font-bold" style={{ color: C.text }}>
              演职员
            </div>
            <CastRow
              cast={content.cast}
              avatarOf={(_, i) => `avatar_u${String((i % 12) + 1).padStart(2, '0')}.png`}
              getBind={(name) => bindTap('star.page.open.fromSeries', { params: { actor: name } })}
            />
          </div>
        )}

        <RecommendFloor
          tabs={visibleRecommendTabs}
          activeTab={recommendTab}
          getTabBind={(t) => bindTap({ kind: 'action', id: 'detail.series.recommendTab.switch' }, {
            onTrigger: () => setUi(UI_RECTAB, t),
          })}
          moreBind={bindTap({ kind: 'action', id: 'detail.series.recommendTab.switch' }, {
            onTrigger: () => {
              const i = visibleRecommendTabs.indexOf(recommendTab);
              setUi(UI_RECTAB, visibleRecommendTabs[(i + 1) % visibleRecommendTabs.length]);
            },
          })}
        >
          <div
            className="flex gap-2 overflow-x-auto px-3 scrollbar-none"
            data-scroll-container="recommendCards"
            data-scroll-direction="horizontal"
          >
            {recommendItems.map((c) => (
              <div key={c.id} className="shrink-0 w-[104px]">
                <PosterCard
                  content={c}
                  size="sm"
                  bind={bindTap('detail.series.open.fromRecommend', { params: { contentId: c.id } })}
                />
              </div>
            ))}
          </div>
        </RecommendFloor>

        <section className="pt-1">
          <div className="px-3 flex items-baseline gap-1 text-[17px] font-bold" style={{ color: C.text }}>
            <span>{s.commentsTitle}</span>
            <span className="text-[12px] font-normal" style={{ color: C.textSub }}>
              {commentThread?.total ?? commentThread?.items.length ?? 0}
            </span>
          </div>
          <div className="px-3 pt-1">
            {(commentThread?.items ?? []).slice(0, 2).map((comment) => (
              <div key={comment.id} className="flex gap-2.5 py-2.5">
                <TvImg
                  id={comment.avatar}
                  alt={comment.author}
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[12px]" style={{ color: C.textSub }}>
                    {comment.author}
                  </div>
                  <div className="mt-0.5 text-[13px] leading-[19px] line-clamp-2" style={{ color: C.text }}>
                    {comment.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <CommentEntryRow
          avatar={user.avatar}
          placeholder={detail.commentEntry}
          moreLabel={detail.commentsMore}
          totalText={commentThread ? String(commentThread.total) : undefined}
          value={(ui[UI_DRAFT] as string) ?? ''}
          onChangeValue={(v) => setUi(UI_DRAFT, v)}
          submitBind={bindTap({ kind: 'action', id: 'detail.series.comment.post' }, {
            onTrigger: () => {
              const draft = String(ui[UI_DRAFT] ?? '').trim();
              if (!draft || !contentId) return;
              postComment(commentThreadKey, draft);
              setUi(UI_DRAFT, '');
            },
          })}
          moreBind={bindTap('detail.comments.open.fromSeries', { params: { contentId } })}
        />

        <div className="h-6" />
      </div>
    </div>
  );
}
