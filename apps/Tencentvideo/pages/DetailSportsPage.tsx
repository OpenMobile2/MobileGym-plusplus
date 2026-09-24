// 体育视频详情页(按日期的正片列表 / 下载置灰)。节点 detail.sports(spec v1.2.0,15 条交互)。
// 视觉证据:775(顶部只读播放器 + 2 tab + 右侧「特惠开体育VIP」金按钮 + 热度·日期·简介行 +
// 5 键操作行(下载与一起看置灰)+「正片列表」栏目 + 日期卡横滑 + 广告卡 + 「06-11期看点&花絮」)、
// 776(切集后:「正在播放」盖章右移,标题日期与花絮栏目标题同步换期)。
//
// 播放器区在本节点没有申报任何交互(P2 从简),故渲染为只读预览:顶栏 icon 走 wontfix,
// 控件行是静态展示条,不做点了没反应的假按钮。
import React, { useEffect, useMemo } from 'react';
import { usePlaybackTicker } from '../hooks/usePlaybackTicker';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTvContent } from '../hooks/useTvParams';
import { useDeclarePlayerOrientation } from '../hooks/usePlayerOrientation';
import { useTencentvideoStore } from '../state';
import { TV_COLORS as C } from '../constants';
import { PlayerCore } from '../components/PlayerCore';
import { TvImg } from '../components/Img';
import {
  DetailActionRow,
  DetailAdCard,
  PlayerTopBar,
  stillOf,
  type DetailActionItem,
} from '../components/detail';
import { DetailSubTabRow, StaticPlayerControlRow } from '../components/detailExtra';
import {
  IcArrowRight, IcCast, IcDownload, IcFollow, IcHeat, IcThumbsUp, IcTogether,
} from '../res/icons';
import { shareEpisodeToWechat } from '../capabilities';

const UI_TAB = 'detail.sports.tab';
const UI_INTRO = 'detail.sports.introExpanded';
const UI_LIST_EXPANDED = 'detail.sports.listExpanded';

/** 栏目标签(证据 775;spec 未给种子字段,属结构性标签) */
const SECTION_MAIN = '正片列表';
const SECTION_HIGHLIGHT = '期看点&花絮';
const HIGHLIGHT_TAG = '看点';
/** 体育 VIP 金按钮文案(证据 775) */
const SPORTS_VIP_LABEL = '特惠开体育VIP';

/**
 * 期号 → 日期。与 detail.series 综艺期卡同一口径:以最新一期锚定 2026-07-24,
 * 每往前一期倒推 3 天(证据 775 正片列表 06-09 / 06-11 / 06-14 的三日节奏)。
 */
function episodeDate(episode: number, latest: number): { month: string; day: string; year: number } {
  const offset = (latest - episode) * 3;
  const raw = 24 - offset;
  const month = raw > 0 ? 7 : 6;
  const day = raw > 0 ? raw : 30 + raw;
  return { month: String(month).padStart(2, '0'), day: String(day).padStart(2, '0'), year: 2026 };
}

export default function DetailSportsPage() {
  const { bindTap, bindBack } = useTencentvideoGestures();
  const s = useTencentvideoStrings();
  usePlaybackTicker();
  useDeclarePlayerOrientation('portrait');

  const content = useTvContent('dc_');
  const detail = useTencentvideoStore((st) => st.detail);
  const user = useTencentvideoStore((st) => st.user);
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
  const latest = content?.updatedTo ?? content?.episodes ?? 1;

  useEffect(() => {
    if (!contentId || playback.contentId === contentId) return;
    openPlayback(contentId, latest);
  }, [contentId, playback.contentId, latest, openPlayback]);

  const tabs = detail.varietyTabs;
  const activeTab = (ui[UI_TAB] as string) || tabs[0];
  const introExpanded = ui[UI_INTRO] === true;
  const listExpanded = ui[UI_LIST_EXPANDED] === true;

  const isChasing = chasing.some((c) => c.contentId === contentId);
  const isRecommended = recommendedIds.includes(contentId);
  const currentEpisode = playback.contentId === contentId ? playback.episodeIndex : latest;

  const episodes = useMemo(
    () => Array.from({ length: latest }, (_, i) => i + 1),
    [latest],
  );
  /** 花絮行取当前期之外的相邻期(证据 775 花絮为同期的额外物料) */
  const highlightEpisodes = useMemo(
    () => episodes.filter((ep) => ep !== currentEpisode).slice(-4),
    [episodes, currentEpisode],
  );

  if (!content) return null;

  const cur = episodeDate(currentEpisode, latest);
  const moreBind = bindTap({ kind: 'action', id: 'detail.sports.topIcons.wontfix' }, {
    onTrigger: () => toast(s.notOpen),
  });
  const castBind = bindTap('cast.search.open.fromDetail', { params: { contentId } });
  const shareBind = bindTap({ kind: 'action', id: 'detail.sports.share' }, {
    onTrigger: () => {
      const launched = shareEpisodeToWechat(
        {
          contentId: content.id,
          episode: currentEpisode,
          title: content.title,
          subtitle: `${cur.month}-${cur.day}期`,
          cover: content.poster,
        },
        (result) => toast(result.resultCode === 'OK' ? s.shareSuccess : s.shareCanceled),
      );
      if (!launched) toast(s.shareCanceled);
    },
  });

  /* ---------- 操作行(下载 / 一起看置灰,证据 775) ---------- */

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
      disabled: true,
      bind: bindTap({ kind: 'action', id: 'detail.sports.download.wontfix' }, {
        onTrigger: () => toast(s.notOpen),
      }),
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
      disabled: true,
      bind: bindTap({ kind: 'action', id: 'detail.sports.together.wontfix' }, {
        onTrigger: () => toast(s.notOpen),
      }),
    },
  ];

  /* ---------- 期卡 ---------- */

  const episodeCard = (ep: number, kind: 'main' | 'highlight') => {
    const d = episodeDate(ep, latest);
    const active = kind === 'main' && ep === currentEpisode;
    const bind =
      kind === 'main'
        ? bindTap({ kind: 'action', id: 'detail.sports.episode.select' }, {
          onTrigger: () => selectEpisode(ep),
        })
        : bindTap({ kind: 'action', id: 'detail.sports.highlight.select' }, {
          onTrigger: () => selectEpisode(ep),
        });
    return (
      <div key={`${kind}_${ep}`} className={listExpanded && kind === 'main' ? 'flex gap-2.5' : 'shrink-0 w-[152px]'} {...bind}>
        <div
          className={`relative rounded-md overflow-hidden aspect-video ${
            listExpanded && kind === 'main' ? 'w-[132px] shrink-0' : ''
          }`}
        >
          <TvImg id={stillOf(content)} alt={content.title} className="w-full h-full object-cover" />
          {active && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="rounded-[3px] px-1.5 py-[2px] text-[11px] text-white"
                style={{ background: C.toastBg }}
              >
                {detail.playingLabel}
              </span>
            </div>
          )}
          <span className="absolute bottom-1 right-1.5 text-[10px] text-white/85">
            {d.year}-{d.month}-{d.day}
          </span>
        </div>
        <div
          className={`text-[13px] leading-[18px] line-clamp-2 ${
            listExpanded && kind === 'main' ? 'flex-1 min-w-0' : 'mt-1.5'
          }`}
          style={{ color: active ? C.primary : C.text }}
        >
          {d.month}-{d.day} {content.title}
          {kind === 'main' ? '' : HIGHLIGHT_TAG}
        </div>
      </div>
    );
  };

  const discussTabBind = bindTap('detail.discuss.open.fromTab', { params: { contentId } });

  return (
    <div className="flex flex-col h-full" style={{ background: C.pageBg }}>
      <div className="relative shrink-0" style={{ background: C.darkBg }}>
        <PlayerCore
          stillId={stillOf(content)}
          danmaku={false}
          topSlot={
            <PlayerTopBar
              backBind={bindBack()}
              svipLabel={user.membership === 'svip' ? user.vipLevelLabel : s.upgradeSvip}
              svipBind={bindTap('vip.cashier.open.fromDetail')}
              castBind={castBind}
              shareBind={shareBind}
              moreBind={moreBind}
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

      <DetailSubTabRow
        tabs={tabs}
        activeTab={activeTab}
        badges={{ 讨论: typeof content.discussCount === 'number' ? String(content.discussCount) : undefined }}
        getTabBind={(tab) => {
          // discussBind 提到分支外,避免 fromSearchTooBroad 误报(tab 是页内 ui 态)
          if (tab === '讨论') return discussTabBind;
          return bindTap({ kind: 'action', id: 'detail.sports.intro.expand' }, {
            onTrigger: () => setUi(UI_TAB, tab),
          });
        }}
        ctaLabel={SPORTS_VIP_LABEL}
        ctaBind={bindTap('vip.cashier.open.fromSports')}
      />

      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <div className="px-3 pt-1">
          <div className="text-[21px] font-bold leading-tight" style={{ color: C.text }}>
            {content.title}
          </div>
          <button
            {...bindTap({ kind: 'action', id: 'detail.sports.intro.expand' }, {
              onTrigger: () => setUi(UI_INTRO, !introExpanded),
            })}
            className="mt-1.5 flex items-center gap-1 bg-transparent border-none p-0 text-[12px]"
            style={{ color: C.textSub }}
          >
            {content.heat !== undefined && (
              <span className="flex items-center gap-0.5">
                <IcHeat size={12} />
                {content.heat}
              </span>
            )}
            <span>· {cur.year}年{cur.month}月{cur.day}日 ·</span>
            <span className="flex items-center">
              {s.intro}
              <IcArrowRight size={12} />
            </span>
          </button>
          {introExpanded && content.desc && (
            <div className="pt-2 text-[13px] leading-[21px]" style={{ color: C.textSub }}>
              {content.desc}
            </div>
          )}
        </div>

        <DetailActionRow items={actionItems} />

        {/* 正片列表 */}
        <div className="flex items-start px-3 pt-4 pb-2">
          <div className="flex-1 min-w-0">
            <div className="text-[17px] font-bold" style={{ color: C.text }}>
              {SECTION_MAIN}
            </div>
            {content.updateNote && (
              <div className="text-[12px] mt-0.5" style={{ color: C.textSub }}>
                {content.updateNote}
              </div>
            )}
          </div>
          <button
            {...bindTap({ kind: 'action', id: 'detail.sports.episodeList.expand' }, {
              onTrigger: () => setUi(UI_LIST_EXPANDED, !listExpanded),
            })}
            className="shrink-0 bg-transparent border-none p-1"
            style={{ color: C.textSub }}
            aria-label={SECTION_MAIN}
          >
            <IcArrowRight size={18} />
          </button>
        </div>
        <div
          className={
            listExpanded
              ? 'flex flex-col gap-3 px-3 pb-1'
              : 'flex gap-2 overflow-x-auto px-3 pb-1 scrollbar-none'
          }
          data-scroll-container="episodes"
          data-scroll-direction={listExpanded ? 'vertical' : 'horizontal'}
        >
          {episodes.map((ep) => episodeCard(ep, 'main'))}
        </div>

        <DetailAdCard
          img={detail.adCard.img}
          badge={detail.adCard.badge}
          title={detail.adCard.title}
          button={detail.adCard.button}
          bind={bindTap({ kind: 'action', id: 'detail.sports.ad.wontfix' }, {
            onTrigger: () => toast(s.notOpen),
          })}
        />

        {/* 看点&花絮 */}
        <div className="flex items-center px-3 pt-4 pb-2">
          <div className="flex-1 min-w-0 text-[17px] font-bold" style={{ color: C.text }}>
            {cur.month}-{cur.day}{SECTION_HIGHLIGHT}
          </div>
          <button
            {...bindTap({ kind: 'action', id: 'detail.sports.highlight.select' }, {
              onTrigger: () => selectEpisode(highlightEpisodes[0] ?? currentEpisode),
            })}
            className="shrink-0 bg-transparent border-none p-1"
            style={{ color: C.textSub }}
            aria-label={SECTION_HIGHLIGHT}
          >
            <IcArrowRight size={18} />
          </button>
        </div>
        <div
          className="flex gap-2 overflow-x-auto px-3 pb-1 scrollbar-none"
          data-scroll-container="highlights"
          data-scroll-direction="horizontal"
        >
          {highlightEpisodes.map((ep) => episodeCard(ep, 'highlight'))}
        </div>

        <div className="h-6" />
      </div>
    </div>
  );
}
