// 节点 player.fullscreen —— 横屏全屏播放器(证据 846 控件全显 / 847-848 截图气泡 /
// ba6ce3@70 暂停 / ba6ce3@78 锁屏 / ba6ce3@88 拖进度)。
// 手机壳不转,靠 LandscapeStage 旋 90° 造出真横屏画布,里面按横屏布局写。
import React, { useEffect } from 'react';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTencentvideoStore } from '../state';
import { usePlaybackTicker } from '../hooks/usePlaybackTicker';
import { useSeekBind } from '../hooks/useSeekBind';
import { useDeclarePlayerOrientation } from '../hooks/usePlayerOrientation';
import { useTvQuery } from '../hooks/useTvParams';
import { TV_COLORS as C } from '../constants';
import { LandscapeStage } from '../components/LandscapeStage';
import { PlayerCore, ProgressBar, fmtTime } from '../components/PlayerCore';
import { isDanmakuOn, stillOf } from '../components/detail';
import { imgSrc, TvImg } from '../components/Img';
import { makeTextPosterDataUrl } from '@/os/albumBridge';
import { saveImageToAlbumWithSystem } from '../capabilities';
import {
  IcArrowDown, IcCamera, IcClose, IcDanmaku, IcGift, IcLock, IcMic, IcMore,
  IcNavBack, IcNext, IcPause, IcPlay, IcSettings, IcShare, IcSubtitle, IcTogether, IcTv, IcUnlock,
} from '../res/icons';

const UI_DRAFT = 'player.fullscreen.danmakuDraft';

export default function PlayerFullscreenPage() {
  const { bindTap, bindBack } = useTencentvideoGestures();
  const s = useTencentvideoStrings();
  usePlaybackTicker();
  useDeclarePlayerOrientation('landscape');

  const contents = useTencentvideoStore((st) => st.contents);
  const user = useTencentvideoStore((st) => st.user);
  const player = useTencentvideoStore((st) => st.player);
  const playback = useTencentvideoStore((st) => st.playback);
  const wontfixToast = useTencentvideoStore((st) => st.wontfixToast);
  const ui = useTencentvideoStore((st) => st.ui);

  const toast = useTencentvideoStore((st) => st.toast);
  const setUi = useTencentvideoStore((st) => st.setUi);
  const playToggle = useTencentvideoStore((st) => st.playToggle);
  const nextEpisode = useTencentvideoStore((st) => st.nextEpisode);
  const seekPlayback = useTencentvideoStore((st) => st.seekPlayback);
  const controlsToggle = useTencentvideoStore((st) => st.controlsToggle);
  const lockToggle = useTencentvideoStore((st) => st.lockToggle);
  const danmakuModeCycle = useTencentvideoStore((st) => st.danmakuModeCycle);
  const sendDanmaku = useTencentvideoStore((st) => st.sendDanmaku);
  const screenshotTake = useTencentvideoStore((st) => st.screenshotTake);
  const screenshotDismiss = useTencentvideoStore((st) => st.screenshotDismiss);
  const openPlayback = useTencentvideoStore((st) => st.openPlayback);

  const seekBind = useSeekBind('player.fullscreen.progress.seek');
  const requestedContentId = useTvQuery('contentId');

  useEffect(() => {
    if (!requestedContentId || requestedContentId === playback.contentId) return;
    if (contents.some((item) => item.id === requestedContentId)) openPlayback(requestedContentId, 1);
  }, [contents, openPlayback, playback.contentId, requestedContentId]);

  const content = contents.find((c) => c.id === playback.contentId);
  if (!content) {
    return (
      <div className="relative h-full flex items-center justify-center" style={{ background: C.darkBg }}>
        <button
          {...bindBack()}
          className="absolute left-3 top-3 bg-black/35 border-none rounded-full p-2 text-white"
          aria-label={s.back}
        >
          <IcNavBack size={22} />
        </button>
        <div className="text-[14px] text-white/70">{s.noPlayableContent}</div>
      </div>
    );
  }

  const isVariety = content.category === '综艺';
  const isSeries = content.category === '剧集' || isVariety;
  const locked = playback.locked;
  const controlsVisible = playback.controlsVisible && !locked;
  const draft = String(ui[UI_DRAFT] ?? '');

  const qualityLabel =
    player.qualities.find((q) => q.id === playback.qualityId)?.label ?? '720P';
  const audioLabel =
    player.audioQualities.find((q) => q.id === playback.audioQualityId)?.label ?? '标准';
  const speedLabel = playback.speed === 1 ? s.speed : `${playback.speed}X`;
  const episodeLabel = `第${playback.episodeIndex}${isVariety ? '期' : '集'}`;

  const wontfix = (id: string) => bindTap({ kind: 'action', id }, { onTrigger: () => toast(s.notOpen) });
  const saveScreenshot = () => {
    screenshotTake();
    const source = imgSrc(stillOf(content));
    if (!source) {
      toast(s.saveImageFailed);
      return;
    }
    const launched = saveImageToAlbumWithSystem(source, (result) => {
      toast(result.resultCode === 'OK' ? s.savedToAlbum : s.saveImageFailed);
    });
    if (!launched) toast(s.saveImageFailed);
  };
  const saveLongImage = () => {
    const source = makeTextPosterDataUrl(
      [`《${content.title}》`, episodeLabel, content.recommend ?? '腾讯视频精彩内容'],
      { title: '腾讯视频长图' },
    );
    const launched = saveImageToAlbumWithSystem(source, (result) => {
      toast(result.resultCode === 'OK' ? s.savedToAlbum : s.saveImageFailed);
    });
    if (!launched) toast(s.saveImageFailed);
  };

  /* ---------- 顶栏(证据 846) ---------- */
  const topBar = (
    <div className="absolute inset-x-0 top-0 z-20 flex items-center gap-2 px-3 h-11">
      <button {...bindBack()} className="bg-transparent border-none p-1 text-white" aria-label={s.back}>
        <IcNavBack size={22} />
      </button>
      <span className="text-[14px] font-semibold truncate max-w-[42%]">
        {episodeLabel} · {content.title}
      </span>
      <button
        {...wontfix('player.fullscreen.mode.wontfix')}
        className="flex items-center gap-0.5 rounded-full px-2 py-[3px] border-none text-[12px] text-white"
        style={{ background: 'rgba(0,0,0,0.35)' }}
      >
        {s.normalMode}<IcArrowDown size={12} />
      </button>
      <div className="flex-1" />
      <button
        {...bindTap('vip.cashier.open.fromPlayerFullscreen')}
        className="rounded-full px-3 py-1 border-none text-[12px] font-semibold"
        style={{ background: C.svipCapsule, color: C.goldBtnText }}
      >
        {user.membership === 'svip' ? user.vipLevelLabel : s.upgradeSvip}
      </button>
      <button
        {...bindTap('cast.search.open.fromFullscreen', { params: { contentId: content.id } })}
        className="bg-transparent border-none p-1 text-white"
        aria-label="投屏"
      >
        <IcTv size={19} />
      </button>
      <button
        {...wontfix('player.fullscreen.together.wontfix')}
        className="relative bg-transparent border-none p-1 text-white"
        aria-label="一起看"
      >
        <IcTogether size={19} />
        <span
          className="absolute -top-1 -right-1 rounded-[3px] px-1 text-[9px] leading-[12px]"
          style={{ background: C.primary, color: '#FFFFFF' }}
        >
          {s.freeLimited}
        </span>
      </button>
      <button
        {...bindTap('player.sheets.open.sharePoster', { params: { sheet: 'share' } })}
        className="bg-transparent border-none p-1 text-white"
        aria-label="分享"
      >
        <IcShare size={18} />
      </button>
      <button
        {...bindTap('player.sheets.open.more.fromFullscreen', { params: { sheet: 'more' } })}
        className="bg-transparent border-none p-1 text-white"
        aria-label="更多"
      >
        <IcMore size={20} />
      </button>
    </div>
  );

  /* ---------- 左侧锁屏 / 右侧工具(证据 846) ---------- */
  const lockButton = (
    <button
      {...bindTap({ kind: 'action', id: 'player.fullscreen.lock.toggle' }, { onTrigger: lockToggle })}
      className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-transparent border-none p-1 text-white"
      aria-label={locked ? '解锁' : '锁屏'}
    >
      {locked ? <IcLock size={20} /> : <IcUnlock size={20} />}
    </button>
  );

  const rightTools = (
    <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-5">
      <button
        {...bindTap({ kind: 'action', id: 'player.fullscreen.screenshot.take' }, { onTrigger: saveScreenshot })}
        className="bg-transparent border-none p-1 text-white"
        aria-label="截图"
      >
        <IcCamera size={20} />
      </button>
      <button
        {...wontfix('player.fullscreen.bonus.wontfix')}
        className="bg-transparent border-none p-1 text-white"
        aria-label="福利彩蛋"
      >
        <IcGift size={20} />
      </button>
      <span className="w-2 h-2 rounded-full" style={{ background: '#5B9BFF' }} aria-hidden />
    </div>
  );

  /* ---------- 截图气泡(证据 847/848) ---------- */
  const screenshotBubble = (
    <div className="absolute right-14 top-1/4 z-30 w-[150px] rounded-lg overflow-hidden" style={{ background: 'rgba(30,30,30,0.95)' }}>
      <div className="relative">
        <TvImg id={stillOf(content)} alt={content.title} className="w-full aspect-video object-cover" />
        <button
          {...bindTap('player.sheets.open.sharePoster.fromScreenshot', { params: { sheet: 'share' } })}
          className="absolute inset-0 flex items-center justify-center gap-1 bg-black/35 border-none text-white text-[12px]"
        >
          <IcShare size={12} />{player.screenshotActions[0]}
        </button>
      </div>
      {player.screenshotActions.slice(1).map((label) => (
        <button
          key={label}
          {...(label === '拼长图'
            ? bindTap({ kind: 'action', id: 'player.fullscreen.longImage.save' }, { onTrigger: saveLongImage })
            : wontfix('player.fullscreen.screenshotExtra.wontfix'))}
          className="block w-full py-1.5 bg-transparent border-none text-white text-[12px]"
        >
          {label}
        </button>
      ))}
      <button
        {...bindTap({ kind: 'action', id: 'player.fullscreen.screenshot.take' }, { onTrigger: screenshotDismiss })}
        className="absolute -right-1 -top-1 w-5 h-5 rounded-full bg-black/70 border-none text-white flex items-center justify-center"
        aria-label="关闭截图气泡"
      >
        <IcClose size={12} />
      </button>
    </div>
  );

  /* ---------- 底栏(证据 846) ---------- */
  const bottomBar = (
    <div className="absolute inset-x-0 bottom-0 z-20 px-3 pb-2">
      <div className="text-[12px] tabular-nums mb-0.5">
        {fmtTime(playback.positionSec)} <span className="text-white/60">/ {fmtTime(playback.durationSec)}</span>
      </div>
      <div className="relative">
        <ProgressBar onSeek={seekPlayback} dataProps={seekBind} thick />
        {/* 热度曲线:进度条上方的绿色起伏(证据 846),按索引确定,不随机 */}
        <svg className="absolute left-0 -top-2 w-full h-2 pointer-events-none" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden>
          <polyline
            points="0,7 8,5 16,6 24,3 32,5 40,2 48,4 56,6 64,3 72,5 80,4 88,6 100,5"
            fill="none"
            stroke={C.primary}
            strokeWidth="0.8"
            opacity="0.75"
          />
        </svg>
      </div>
      <div className="flex items-center gap-3 mt-1">
        <button
          {...bindTap({ kind: 'action', id: 'player.fullscreen.play.toggle' }, { onTrigger: playToggle })}
          className="bg-transparent border-none p-0.5 text-white"
          aria-label={playback.playing ? '暂停' : '播放'}
        >
          {playback.playing ? <IcPause size={22} /> : <IcPlay size={22} />}
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'player.fullscreen.episode.next' }, { onTrigger: nextEpisode })}
          className="bg-transparent border-none p-0.5 text-white"
          aria-label="下一集"
        >
          <IcNext size={20} />
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'player.danmaku.mode.cycle' }, { onTrigger: danmakuModeCycle })}
          className="relative bg-transparent border-none p-0.5 text-white"
          aria-label="弹幕"
        >
          <IcDanmaku size={19} />
          {isDanmakuOn(player.danmaku.mode) && (
            <span
              className="absolute -top-[1px] -right-[1px] w-1.5 h-1.5 rounded-full"
              style={{ background: player.danmaku.mode === 'selected' ? C.badgeOrange : C.primary }}
            />
          )}
        </button>
        <button
          {...bindTap('player.sheets.open.danmakuToolbox', { params: { sheet: 'danmaku' } })}
          className="bg-transparent border-none p-0.5 text-white"
          aria-label="弹幕设置"
        >
          <IcSettings size={18} />
        </button>
        <div
          className="flex-1 min-w-0 flex items-center gap-1 rounded-full px-3 h-7"
          style={{ background: 'rgba(255,255,255,0.16)' }}
          // 键盘配件:点「发送」时键盘别收,收了这条弹幕输入框会移位、点空
          data-keep-keyboard="true"
        >
          <input
            value={draft}
            onChange={(e) => setUi(UI_DRAFT, e.target.value)}
            placeholder={player.danmaku.placeholder}
            aria-label={player.danmaku.placeholder}
            className="flex-1 min-w-0 bg-transparent border-none outline-none text-[12px] text-white placeholder:text-white/60"
          />
          <button
            {...bindTap({ kind: 'action', id: 'player.fullscreen.danmaku.send' }, {
              onTrigger: () => {
                if (!draft.trim()) return;
                sendDanmaku(draft);
                setUi(UI_DRAFT, '');
              },
            })}
            className="shrink-0 bg-transparent border-none p-0 text-[12px]"
            style={{ color: draft.trim() ? C.primary : 'rgba(255,255,255,0.6)' }}
          >
            {s.send}
          </button>
        </div>
        <button
          {...wontfix('player.fullscreen.danmakuMic.wontfix')}
          className="bg-transparent border-none p-0.5 text-white"
          aria-label="语音弹幕"
        >
          <IcMic size={17} />
        </button>
        {isSeries && (
          <button
            {...wontfix('player.fullscreen.subtitle.wontfix')}
            className="bg-transparent border-none p-0.5 text-white"
            aria-label="字幕"
          >
            <IcSubtitle size={18} />
          </button>
        )}
        <button
          {...bindTap('player.sheets.open.speed', { params: { sheet: 'speed' } })}
          className="shrink-0 bg-transparent border-none p-0 text-[12px] text-white"
        >
          {speedLabel}
        </button>
        <button
          {...bindTap('player.sheets.open.quality', { params: { sheet: 'quality' } })}
          className="shrink-0 bg-transparent border-none p-0 text-[12px] font-semibold text-white"
        >
          {qualityLabel}·{audioLabel}声
        </button>
        <button
          {...bindTap('player.sheets.open.episodes', { params: { sheet: 'episodes' } })}
          className="shrink-0 bg-transparent border-none p-0 text-[12px] text-white"
        >
          {s.episodeSection}
        </button>
      </div>
    </div>
  );

  return (
    <LandscapeStage>
      <PlayerCore
        orientation="landscape"
        stillId={stillOf(content)}
        danmaku={isDanmakuOn(player.danmaku.mode)}
        surfaceBind={bindTap({ kind: 'action', id: 'player.fullscreen.controls.toggle' }, {
          onTrigger: controlsToggle,
        })}
        centerSlot={
          playback.playing ? undefined : (
            <div className="rounded-full px-4 py-1.5 text-[13px] bg-black/55">
              {/* 暂停中央标识(证据 ba6ce3@70) */}
              ⏸ {s.paused}
            </div>
          )
        }
      >
        {locked ? lockButton : (
          <>
            {controlsVisible && topBar}
            {controlsVisible && lockButton}
            {controlsVisible && rightTools}
            {controlsVisible && bottomBar}
            {playback.screenshotBubble && screenshotBubble}
          </>
        )}
      </PlayerCore>
    </LandscapeStage>
  );
}
