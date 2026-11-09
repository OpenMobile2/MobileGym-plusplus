// 节点 player.portrait —— 竖屏内嵌播放态(证据 789 电影形态含小窗 icon / 820 剧集形态 / 825 VIP 金框)。
// 与 detail.* 的区别:这里播放器控件是「可操作」的(播放/进度/弹幕/小窗/全屏),
// 详情页顶部那块只是预览,整块点进来才到本页。页面下半部分是静态信息区 ——
// 选集/操作行等交互归 detail.series 节点,不在本节点的 interactions 里,不能在这儿接线。
import React, { useEffect, useMemo } from 'react';
import { useActivityContext } from '@/os/ActivityContext';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTencentvideoStore } from '../state';
import { usePlaybackTicker } from '../hooks/usePlaybackTicker';
import { useSeekBind } from '../hooks/useSeekBind';
import { useDeclarePlayerOrientation } from '../hooks/usePlayerOrientation';
import { TV_COLORS as C, VIP_FRAME_SECONDS } from '../constants';
import { PlayerCore, ProgressBar } from '../components/PlayerCore';
import {
  CommentEntryRow,
  DetailActionRow,
  type DetailActionItem,
  PausedAdOverlay,
  PlayerTopBar,
  PortraitControlRow,
  isDanmakuOn,
  stillOf,
} from '../components/detail';
import { TvImg } from '../components/Img';
import { PosterCard } from '../components/PosterCard';
import { IcAudioMode, IcCast, IcClose, IcDownload, IcPip, IcSparkle, IcThumbsUp, IcTopDanmaku, IcTimer } from '../res/icons';

export default function PlayerPortraitPage() {
  const { bindTap, bindBack } = useTencentvideoGestures();
  const s = useTencentvideoStrings();
  usePlaybackTicker();
  useDeclarePlayerOrientation('portrait');
  const { activityId } = useActivityContext();

  const contents = useTencentvideoStore((st) => st.contents);
  const comments = useTencentvideoStore((st) => st.comments);
  const detail = useTencentvideoStore((st) => st.detail);
  const player = useTencentvideoStore((st) => st.player);
  const playback = useTencentvideoStore((st) => st.playback);
  const user = useTencentvideoStore((st) => st.user);
  const recommendedIds = useTencentvideoStore((st) => st.recommendedIds);
  const wontfixToast = useTencentvideoStore((st) => st.wontfixToast);

  const toast = useTencentvideoStore((st) => st.toast);
  const playToggle = useTencentvideoStore((st) => st.playToggle);
  const seekPlayback = useTencentvideoStore((st) => st.seekPlayback);
  const controlsToggle = useTencentvideoStore((st) => st.controlsToggle);
  const danmakuModeCycle = useTencentvideoStore((st) => st.danmakuModeCycle);
  const pipOpen = useTencentvideoStore((st) => st.pipOpen);
  const pipClose = useTencentvideoStore((st) => st.pipClose);
  const audioModeExit = useTencentvideoStore((st) => st.audioModeExit);
  const openPlayback = useTencentvideoStore((st) => st.openPlayback);
  const recommendToggle = useTencentvideoStore((st) => st.recommendToggle);
  const postComment = useTencentvideoStore((st) => st.postComment);
  const ui = useTencentvideoStore((st) => st.ui);
  const setUi = useTencentvideoStore((st) => st.setUi);

  const seekBind = useSeekBind('player.portrait.progress.seek');

  useEffect(() => {
    const payload = window.__OS__?.getIntentPayload?.(activityId) as { data?: Record<string, any> } | null;
    const contentId = payload?.data?.contentId;
    if (typeof contentId !== 'string') return;
    const episode = Math.max(1, Number(payload?.data?.episode ?? 1));
    const season = Number(payload?.data?.season);
    const subTab = typeof payload?.data?.subTab === 'string' ? payload.data.subTab : undefined;
    if (
      playback.contentId !== contentId ||
      playback.episodeIndex !== episode ||
      (Number.isFinite(season) && playback.season !== season) ||
      (subTab !== undefined && playback.subTab !== subTab)
    ) {
      openPlayback(contentId, episode, undefined, Number.isFinite(season) ? season : undefined, subTab);
    }
  }, [activityId, openPlayback, playback.contentId, playback.episodeIndex, playback.season, playback.subTab]);

  const content = contents.find((c) => c.id === playback.contentId);
  const recommendationItems = useMemo(() => {
    if (!content) return [];
    const sameCategory = contents.filter(
      (item) => item.id !== content.id && item.category === content.category,
    );
    const fallback = contents.filter(
      (item) => item.id !== content.id && !sameCategory.some((same) => same.id === item.id),
    );
    return [...sameCategory, ...fallback].slice(0, 6);
  }, [content, contents]);
  const episodeIdentity = playback.season !== null
    ? `s${playback.season}-${playback.subTab ?? '正片'}-ep${playback.episodeIndex}`
    : `ep${playback.episodeIndex}`;
  const episodeThreadKey = content && ((content.episodes ?? 1) > 1 || playback.season !== null)
    ? `${content.id}#${episodeIdentity}`
    : content?.id;
  const commentThread = episodeThreadKey
    ? comments[episodeThreadKey] ?? comments[content?.id ?? '']
    : undefined;

  if (!content) return null;

  const isMovie = content.category === '电影';
  // 金框只在 VIP 集开头露一小会儿(见 constants.VIP_FRAME_SECONDS 的证据说明)
  const vipFrameOn =
    content.vipFrom !== undefined &&
    playback.episodeIndex >= content.vipFrom &&
    playback.positionSec < VIP_FRAME_SECONDS;
  const controlsVisible = playback.controlsVisible;
  const isRecommended = recommendedIds.includes(content.id);
  const playbackLabel = playback.season !== null
    ? `第${playback.season}季 · ${playback.subTab ?? '正片'} · 第${playback.episodeIndex}期`
    : `第${playback.episodeIndex}集`;

  const surfaceBind = bindTap({ kind: 'action', id: 'player.portrait.controls.toggle' }, {
    onTrigger: controlsToggle,
  });
  const playBind = bindTap({ kind: 'action', id: 'player.portrait.play.toggle' }, {
    onTrigger: playToggle,
  });
  const pipBind = bindTap({ kind: 'action', id: 'player.portrait.pip.open' }, {
    onTrigger: playback.pipOn ? pipClose : pipOpen,
  });
  // 音频模式的退出键与两枚 chip 归 player.sheets 节点(它是「更多·音频播放」的产物态),
  // 但形态长在播放器上,所以在这儿接线。
  const audioExitBind = bindTap({ kind: 'action', id: 'player.sheets.audioMode.exit' }, {
    onTrigger: audioModeExit,
  });
  const audioExtraBind = bindTap({ kind: 'action', id: 'player.sheets.audioExtra.wontfix' }, {
    onTrigger: () => toast(s.notOpen),
  });

  /** 音频模式左右两枚 chip(证据 821:臻彩音效 / 定时关闭) */
  const audioChips = (
    <>
      <button
        {...audioExtraBind}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-1 bg-transparent border-none text-white/70"
      >
        <IcSparkle size={20} />
        <span className="text-[11px]">{s.audioZhencai}</span>
      </button>
      <button
        {...audioExtraBind}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-1 bg-transparent border-none text-white/70"
      >
        <IcTimer size={20} />
        <span className="text-[11px]">{playback.sleepTimer ?? s.sheetTimer}</span>
      </button>
    </>
  );

  const playerBlock = (
    <PlayerCore
      stillId={stillOf(content)}
      danmaku={isDanmakuOn(player.danmaku.mode)}
      surfaceBind={surfaceBind}
      topSlot={controlsVisible ? (
        <PlayerTopBar
          backBind={bindBack()}
          svipLabel={user.membership === 'svip' ? user.vipLevelLabel : s.upgradeSvip}
          svipBind={bindTap('vip.cashier.open.fromPlayerPortrait')}
          castBind={bindTap('cast.search.open.fromPortrait', { params: { contentId: content.id } })}
          shareBind={bindTap('player.sheets.open.sharePoster.fromPortrait', { params: { sheet: 'share' } })}
          moreBind={bindTap('player.sheets.open.more.fromPortrait', { params: { sheet: 'more' } })}
          vipNote={playback.audioMode || !vipFrameOn ? undefined : detail.vipFrameNote}
          castSlot={playback.audioMode ? (
            <button {...audioExitBind} className="bg-transparent border-none p-1 text-white" aria-label="退出音频播放">
              <IcAudioMode size={19} />
            </button>
          ) : undefined}
        />
      ) : undefined}
      centerSlot={
        playback.playing || playback.audioMode ? undefined : (
          <PausedAdOverlay
            img={detail.adCard.img}
            badge={detail.adOverlay.badge}
            pausedLabel={detail.adOverlay.paused}
            buttonLabel={detail.adOverlay.button}
            closeBind={playBind}
            ctaBind={playBind}
            subtitle={content.recommend}
          />
        )
      }
      bottomSlot={controlsVisible ? (
        <PortraitControlRow
          playing={playback.playing}
          positionSec={playback.positionSec}
          durationSec={playback.durationSec}
          playBind={playBind}
          progressSlot={
            <ProgressBar onSeek={seekPlayback} dataProps={seekBind} />
          }
          danmakuOn={isDanmakuOn(player.danmaku.mode)}
          danmakuBind={bindTap({ kind: 'action', id: 'player.danmaku.mode.cycle' }, {
            onTrigger: danmakuModeCycle,
          })}
          fullscreenBind={bindTap('player.fullscreen.open.fromPortrait')}
          // 小窗只在电影形态露出(证据 789)
          extraSlot={isMovie ? (
            <button {...pipBind} className="shrink-0 bg-transparent border-none p-0.5 text-white" aria-label="小窗">
              <IcPip size={17} />
            </button>
          ) : undefined}
        />
      ) : undefined}
    >
      {playback.audioMode && audioChips}
    </PlayerCore>
  );

  // 弹幕只是播放器叠层状态，正文操作必须始终保留，避免开启弹幕后下载/投屏入口消失。
  const quickActions: DetailActionItem[] = [
    {
      key: 'recommend',
      label: isRecommended ? s.detailRecommended : s.detailRecommend,
      icon: <IcThumbsUp size={22} />,
      active: isRecommended,
      bind: bindTap({ kind: 'action', id: 'player.portrait.recommend.toggle' }, {
        onTrigger: () => recommendToggle(content.id),
      }),
    },
    {
      key: 'download',
      label: s.detailDownload,
      icon: <IcDownload size={22} />,
      bind: bindTap('download.select.open.fromPortrait', { params: { contentId: content.id } }),
    },
    {
      key: 'danmaku',
      label: s.danmaku,
      icon: <IcTopDanmaku size={22} />,
      active: isDanmakuOn(player.danmaku.mode),
      bind: bindTap({ kind: 'action', id: 'player.danmaku.mode.cycle' }, {
        onTrigger: danmakuModeCycle,
      }),
    },
    {
      key: 'cast',
      label: s.detailCast,
      icon: <IcCast size={22} />,
      bind: bindTap('cast.search.open.fromPortrait', { params: { contentId: content.id } }),
    },
  ];

  /** 正片信息区:本节点无交互声明,纯展示(演职员/选集等入口在 detail.series) */
  const infoBlock = (
    <div className="flex-1 overflow-y-auto" data-scroll-container="main">
      <div className="px-3 pt-3 pb-1 flex items-baseline gap-2">
        <span className="text-[19px] font-bold" style={{ color: C.text }}>{content.title}</span>
        {!isMovie && (
          <span className="text-[12px]" style={{ color: C.primary }}>
            {detail.playingLabel} {playbackLabel}
          </span>
        )}
      </div>
      <div className="px-3 pb-2 text-[12px]" style={{ color: C.textSub }}>
        {[content.year, content.region, content.tags?.join(' ')].filter(Boolean).join(' · ')}
      </div>
      {content.desc && (
        <div className="px-3 pb-3 text-[13px] leading-[21px]" style={{ color: C.textSub }}>
          {content.desc}
        </div>
      )}
      {content.cast && content.cast.length > 0 && (
        <div className="px-3 pb-4 text-[12px]" style={{ color: C.textSub }}>
          {content.cast.map((p) => `${p.name} 饰 ${p.role}`).join('   ')}
        </div>
      )}

      <DetailActionRow items={quickActions} />

      <section className="pt-2 pb-4">
        <div className="px-3 pb-2 text-[17px] font-bold" style={{ color: C.text }}>
          {s.playerRecommendations}
        </div>
        <div
          className="flex gap-2 overflow-x-auto px-3 scrollbar-none"
          data-scroll-container="playerRecommendations"
          data-scroll-direction="horizontal"
        >
          {recommendationItems.map((item) => (
            <div key={item.id} className="shrink-0 w-[104px]">
              <PosterCard
                content={item}
                size="sm"
                bind={
                  item.category === '电影'
                    ? bindTap('detail.movie.open.fromPlayerRecommend', {
                        params: { contentId: item.id },
                      })
                    : bindTap('detail.series.open.fromPlayerRecommend', {
                        params: { contentId: item.id },
                      })
                }
              />
            </div>
          ))}
        </div>
      </section>

      <section className="border-t pt-3" style={{ borderColor: C.chipGray }}>
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
        <CommentEntryRow
          avatar={user.avatar}
          placeholder={detail.commentEntry}
          moreLabel={detail.commentsMore}
          totalText={
            String(commentThread?.total ?? commentThread?.items.length ?? 0)
          }
          value={(ui['player.portrait.commentDraft'] as string) ?? ''}
          onChangeValue={(v) => setUi('player.portrait.commentDraft', v)}
          submitBind={bindTap({ kind: 'action', id: 'player.portrait.comment.post' }, {
            onTrigger: () => {
              const draft = String(ui['player.portrait.commentDraft'] ?? '').trim();
              if (!draft || !episodeThreadKey) return;
              postComment(episodeThreadKey, draft);
              setUi('player.portrait.commentDraft', '');
            },
          })}
          moreBind={bindTap('detail.comments.open.fromPlayerPortrait', {
            params: { contentId: content.id },
          })}
        />
      </section>
      <div className="h-6" />
    </div>
  );

  // 小窗态:画面缩到右上角浮窗,正文区整屏可读(证据:spec player.portrait 小窗模式)
  if (playback.pipOn) {
    return (
      <div className="flex flex-col h-full" style={{ background: C.pageBg }}>
        {infoBlock}
        <div className="absolute right-2 top-2 w-40 rounded-lg overflow-hidden shadow-lg z-20">
          <div className="relative">
            <TvImg
              id={stillOf(content)}
              alt={content.title}
              className="w-full aspect-video object-cover"
            />
            <button
              {...pipBind}
              className="absolute right-1 top-1 w-5 h-5 rounded-full bg-black/55 border-none text-white flex items-center justify-center"
              aria-label="关闭小窗"
            >
              <IcClose size={12} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative" style={{ background: C.pageBg }}>
      {playerBlock}
      {infoBlock}
    </div>
  );
}
