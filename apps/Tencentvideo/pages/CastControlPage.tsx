// 投屏控制页(AirPlay)。节点 cast.control(spec v1.0.0,12 条交互)。
// 视觉证据:467997@15(暖调深色底:顶栏 返回/AirPlay/电源icon;按钮行 切换投屏设备/添加到桌面;
// 片名区「九重紫 第13集」+ 副标题;胶囊行 720P/倍速(置灰)/弹(置灰)/选集;-15s/播放/+15s;
// 进度条 04:12 / 45:44 + 下一集 icon;提示条「AirPlay无法调节音量」;底部「我的投屏历史」上拉条)、
// 467997@19(切换设备面板:iPhone 喇叭 ⇌ MacBook Air)。
//
// 本页为深色页,顶栏前景要 light —— DARK_ROUTES 在共享的 TencentvideoApp.tsx 里登记,
// 本轮不改共享文件,已在交付报告里申报 '/cast/control' 需要加入。
import React, { useEffect, useMemo } from 'react';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { usePlaybackTicker } from '../hooks/usePlaybackTicker';
import { useSeekBind } from '../hooks/useSeekBind';
import { useTencentvideoStore } from '../state';
import { TV_COLORS as C } from '../constants';
import { ProgressBar, fmtTime } from '../components/PlayerCore';
import { EpisodeNumberChips } from '../components/detail';
import { OptionTile } from '../components/sheets';
import {
  IcArrowUp, IcBan, IcDanmaku, IcHistory, IcNavBack, IcNext, IcPause, IcPlay, IcMute,
} from '../res/icons';

/** 页内弹层(清晰度 / 选集 / 切换设备 / 投屏历史抽屉),离散 UI 态一律走 store.ui */
const UI_QUALITY = 'cast.control.qualityPanel';
const UI_EPISODES = 'cast.control.episodesPanel';
const UI_DEVICES = 'cast.control.devicePanel';
const UI_HISTORY = 'cast.control.historyDrawer';

/** ±15 秒(证据 467997@15 的两枚 15 秒环形按钮) */
const STEP_SEC = 15;
/** 投屏起始进度 04:12(spec note 的种子值),仅在本页自建播放上下文时用 */
const SEED_POSITION_SEC = 252;
const SEED_EPISODE = 13;

export default function CastControlPage() {
  const { bindTap, bindBack } = useTencentvideoGestures();
  const s = useTencentvideoStrings();
  usePlaybackTicker();

  const contents = useTencentvideoStore((st) => st.contents);
  const castPage = useTencentvideoStore((st) => st.player.castPage);
  const qualities = useTencentvideoStore((st) => st.player.qualities);
  const cast = useTencentvideoStore((st) => st.cast);
  const playback = useTencentvideoStore((st) => st.playback);
  const watchHistory = useTencentvideoStore((st) => st.watchHistory);
  const ui = useTencentvideoStore((st) => st.ui);

  const toast = useTencentvideoStore((st) => st.toast);
  const setUi = useTencentvideoStore((st) => st.setUi);
  const openPlayback = useTencentvideoStore((st) => st.openPlayback);
  const seekPlayback = useTencentvideoStore((st) => st.seekPlayback);
  const playToggle = useTencentvideoStore((st) => st.playToggle);
  const nextEpisode = useTencentvideoStore((st) => st.nextEpisode);
  const selectEpisode = useTencentvideoStore((st) => st.selectEpisode);
  const selectQuality = useTencentvideoStore((st) => st.selectQuality);
  const castConnect = useTencentvideoStore((st) => st.castConnect);
  const castDisconnect = useTencentvideoStore((st) => st.castDisconnect);
  const castDeviceSwitch = useTencentvideoStore((st) => st.castDeviceSwitch);
  const castSeekStep = useTencentvideoStore((st) => st.castSeekStep);

  const seekBind = useSeekBind('cast.control.progress.seek');

  // 直接进本页(走查/深链)时也得有投屏连接与播放上下文;离开本页 = 断开投屏
  // (spec:电源 icon 与返回键都建模为 effect:back,断开动作挂在卸载上才两条路都覆盖)
  const connected = cast.status === 'connected';
  const hasPlayback = playback.contentId !== null;
  const fallbackId = contents.find((c) => (c.episodes ?? 0) > 1)?.id ?? contents[0]?.id ?? '';
  useEffect(() => {
    if (!connected) castConnect(castPage.phoneSpeaker);
  }, [connected, castConnect, castPage.phoneSpeaker]);
  useEffect(() => {
    if (hasPlayback || !fallbackId) return;
    openPlayback(fallbackId, SEED_EPISODE);
    seekPlayback(SEED_POSITION_SEC);
  }, [hasPlayback, fallbackId, openPlayback, seekPlayback]);
  useEffect(() => castDisconnect, [castDisconnect]);

  const content = contents.find((c) => c.id === playback.contentId);
  const qualityLabel = qualities.find((q) => q.id === playback.qualityId)?.label ?? '';

  /** 可切换的投屏设备(证据 467997@19:iPhone 喇叭 / MacBook Air) */
  const devices = useMemo(
    () => [castPage.phoneSpeaker, castPage.airplayDevice],
    [castPage.phoneSpeaker, castPage.airplayDevice],
  );

  /** 投屏历史 = 最近看过的内容(defaults 无独立种子,见交付报告的诉求清单) */
  const historyItems = useMemo(() => watchHistory.slice(0, 5), [watchHistory]);

  const episodeList = useMemo(() => {
    const total = content?.updatedTo ?? content?.episodes ?? 0;
    return Array.from({ length: total }, (_, i) => i + 1);
  }, [content?.updatedTo, content?.episodes]);

  const qualityOptions = useMemo(() => qualities.filter((q) => q.id !== 'auto'), [qualities]);

  const qualityOpen = ui[UI_QUALITY] === true;
  const episodesOpen = ui[UI_EPISODES] === true;
  const devicesOpen = ui[UI_DEVICES] === true;
  const historyOpen = ui[UI_HISTORY] === true;

  if (!content) return null;

  const isVariety = content.category === '综艺';
  const unit = isVariety ? s.periodUnit : s.episodeUnit;
  const episodeLabel = s.episodeOrdinal
    ? `${s.episodeOrdinal}${playback.episodeIndex}${unit}`
    : `${unit} ${playback.episodeIndex}`;
  const wontfix = (id: string) => bindTap({ kind: 'action', id }, { onTrigger: () => toast(s.notOpen) });

  /* ---------- 弹层 ---------- */

  const qualityToggle = bindTap({ kind: 'action', id: 'cast.control.quality.open' }, {
    onTrigger: () => setUi(UI_QUALITY, !qualityOpen),
  });
  const episodesToggle = bindTap({ kind: 'action', id: 'cast.control.episodes.open' }, {
    onTrigger: () => setUi(UI_EPISODES, !episodesOpen),
  });
  const devicesToggle = bindTap({ kind: 'action', id: 'cast.control.device.switch' }, {
    onTrigger: () => setUi(UI_DEVICES, !devicesOpen),
  });
  const historyToggle = bindTap({ kind: 'action', id: 'cast.control.history.expand' }, {
    onTrigger: () => setUi(UI_HISTORY, !historyOpen),
  });

  const panel = (title: string, close: object, body: React.ReactNode) => (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/45" {...close} />
      <div className="relative rounded-t-2xl max-h-[64%] flex flex-col" style={{ background: C.darkCard }}>
        <div className="text-center py-3 text-[15px] font-semibold shrink-0" style={{ color: C.darkText }}>
          {title}
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-6">{body}</div>
      </div>
    </div>
  );

  const qualityPanel = panel(s.quality, qualityToggle, (
    <div className="grid grid-cols-3 gap-2">
      {qualityOptions.map((q) => (
        <OptionTile
          key={q.id}
          label={q.label}
          sub={q.desc}
          tierBadge={q.tier === 'free' ? undefined : q.tier.toUpperCase()}
          selected={q.id === playback.qualityId}
          locked={q.tier === 'svip'}
          className="h-[56px]"
          bind={q.tier === 'svip'
            // 投屏链路不支持 SVIP 画质档,且本路由没有申报去权益墙的转场(见交付报告诉求)
            ? wontfix('cast.control.disabled.wontfix')
            : bindTap({ kind: 'action', id: 'cast.control.quality.open' }, {
              onTrigger: () => {
                selectQuality(q.id);
                setUi(UI_QUALITY, false);
              },
            })}
        />
      ))}
    </div>
  ));

  const episodesPanel = panel(s.episodeSection, episodesToggle, (
    <EpisodeNumberChips
      episodes={episodeList}
      currentEpisode={playback.episodeIndex}
      vipFrom={content.vipFrom}
      dark
      wrap
      getBind={(ep) => bindTap({ kind: 'action', id: 'cast.control.episodes.open' }, {
        onTrigger: () => {
          selectEpisode(ep);
          setUi(UI_EPISODES, false);
        },
      })}
    />
  ));

  const devicesPanel = panel(s.castSwitchDevice, devicesToggle, (
    <div className="flex flex-col gap-2">
      {devices.map((d) => {
        const on = d === cast.device;
        return (
          <button
            key={d}
            {...bindTap({ kind: 'action', id: 'cast.control.device.switch' }, {
              onTrigger: () => {
                castDeviceSwitch(d);
                setUi(UI_DEVICES, false);
              },
            })}
            className="w-full rounded-lg border-none px-4 h-12 text-left text-[14px]"
            style={{
              background: on ? 'rgba(6,191,184,0.20)' : 'rgba(255,255,255,0.10)',
              color: on ? C.primary : C.darkText,
            }}
          >
            {d}
          </button>
        );
      })}
    </div>
  ));

  const historyDrawer = panel(s.castHistory, historyToggle, (
    <div className="flex flex-col">
      {historyItems.map((h) => {
        const c = contents.find((x) => x.id === h.contentId);
        return (
          <div key={h.id} className="flex items-center gap-2 py-2.5">
            <span className="flex-1 min-w-0 truncate text-[14px]" style={{ color: C.darkText }}>
              {c?.title ?? h.contentId}{h.episode ? ` ${h.episode}` : ''}
            </span>
            <span className="shrink-0 text-[12px]" style={{ color: C.darkTextSub }}>{h.date}</span>
          </div>
        );
      })}
    </div>
  ));

  /* ---------- 页面 ---------- */

  const stepButton = (delta: number) => (
    <button
      {...bindTap({ kind: 'action', id: 'cast.control.seek.step15' }, {
        onTrigger: () => castSeekStep(delta),
      })}
      className="relative bg-transparent border-none p-0"
      style={{ color: C.darkText }}
      aria-label={delta < 0 ? s.castSeekBack : s.castSeekForward}
    >
      <span className="block" style={delta > 0 ? { transform: 'scaleX(-1)' } : undefined}>
        <IcHistory size={32} />
      </span>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold">
        {STEP_SEC}
      </span>
    </button>
  );

  return (
    <div
      className="relative flex flex-col h-full"
      style={{ background: `linear-gradient(180deg, ${C.svipBarBg} 0%, ${C.darkBg} 65%)` }}
      data-status-bar-foreground="light"
    >
      {/* 顶栏:返回 / 设备名 / 电源(断开投屏,spec 两者都是 effect:back,断开挂在卸载上) */}
      <div className="shrink-0 flex items-center h-11 px-2">
        <button
          {...bindBack()}
          className="bg-transparent border-none p-1"
          style={{ color: C.darkText }}
          aria-label={s.back}
        >
          <IcNavBack size={22} />
        </button>
        <div className="flex-1 text-center text-[16px] font-semibold truncate" style={{ color: C.darkText }}>
          {cast.device === castPage.phoneSpeaker ? 'AirPlay' : (cast.device ?? 'AirPlay')}
        </div>
        <button
          {...bindBack()}
          className="bg-transparent border-none p-1"
          style={{ color: C.darkText }}
          aria-label={s.castDisconnect}
        >
          <IcBan size={20} />
        </button>
      </div>

      {/* 按钮行 */}
      <div className="shrink-0 flex items-center justify-center gap-3 pb-3">
        <button
          {...devicesToggle}
          className="rounded-full border-none px-3 h-7 text-[12px]"
          style={{ background: 'rgba(255,255,255,0.12)', color: C.darkText }}
        >
          {s.castSwitchDevice}
        </button>
        <button
          {...wontfix('cast.control.addToHome.wontfix')}
          className="rounded-full border-none px-3 h-7 text-[12px]"
          style={{ background: 'rgba(255,255,255,0.12)', color: C.darkText }}
        >
          {s.castAddToHome}
        </button>
      </div>
      <div className="shrink-0 h-px mx-0" style={{ background: 'rgba(255,255,255,0.10)' }} />

      <div
        className="flex-1 overflow-y-auto px-4"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* 片名区 */}
        <div className="pt-10 text-center">
          <div className="text-[21px] font-semibold" style={{ color: C.darkText }}>
            {content.title} {episodeLabel}
          </div>
          <div className="pt-1.5 text-[14px]" style={{ color: C.darkTextSub }}>
            {content.recommend}
          </div>
        </div>

        {/* 胶囊行:720P / 倍速(置灰) / 弹(置灰) / 选集 */}
        <div
          className="mt-7 flex items-center rounded-full h-12"
          style={{ background: 'rgba(255,255,255,0.10)' }}
        >
          <button
            {...qualityToggle}
            className="flex-1 bg-transparent border-none text-[14px] font-semibold"
            style={{ color: C.darkText }}
          >
            {qualityLabel}
          </button>
          <button
            {...wontfix('cast.control.disabled.wontfix')}
            className="flex-1 bg-transparent border-none text-[14px]"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            {s.speed}
          </button>
          <button
            {...wontfix('cast.control.disabled.wontfix')}
            className="flex-1 bg-transparent border-none flex items-center justify-center"
            style={{ color: 'rgba(255,255,255,0.35)' }}
            aria-label={s.danmaku}
          >
            <IcDanmaku size={18} />
          </button>
          <button
            {...episodesToggle}
            className="flex-1 bg-transparent border-none text-[14px]"
            style={{ color: C.darkText }}
          >
            {s.episodeSection}
          </button>
        </div>

        {/* 控制区 */}
        <div className="mt-10 flex items-center justify-center gap-12">
          {stepButton(-STEP_SEC)}
          <button
            {...bindTap({ kind: 'action', id: 'cast.control.play.toggle' }, { onTrigger: playToggle })}
            className="bg-transparent border-none p-0"
            style={{ color: C.darkText }}
            aria-label={playback.playing ? s.pause : s.play}
          >
            {playback.playing ? <IcPause size={40} /> : <IcPlay size={40} />}
          </button>
          {stepButton(STEP_SEC)}
        </div>

        {/* 进度条 + 时间 + 下一集 */}
        <div className="mt-9 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <ProgressBar onSeek={seekPlayback} dataProps={seekBind} />
            <div className="flex items-center justify-between text-[11px] tabular-nums pt-0.5" style={{ color: C.darkTextSub }}>
              <span>{fmtTime(playback.positionSec)}</span>
              <span>{fmtTime(playback.durationSec)}</span>
            </div>
          </div>
          <button
            {...bindTap({ kind: 'action', id: 'cast.control.episode.next' }, { onTrigger: nextEpisode })}
            className="shrink-0 bg-transparent border-none p-0 mb-3"
            style={{ color: C.darkText }}
            aria-label={s.nextEpisode}
          >
            <IcNext size={22} />
          </button>
        </div>

        {/* 提示条 */}
        <div className="mt-10 flex justify-center">
          <div
            className="flex items-center gap-1.5 rounded-full px-4 h-10 text-[13px]"
            style={{ background: 'rgba(255,255,255,0.08)', color: C.darkTextSub }}
          >
            <IcMute size={16} />{s.castNoVolume}
          </div>
        </div>
        <div className="h-6" />
      </div>

      {/* 底部「我的投屏历史」上拉条 */}
      <button
        {...historyToggle}
        className="shrink-0 flex items-center gap-2 px-4 h-12 border-none w-full text-left"
        style={{ background: C.darkCard, color: C.darkText }}
      >
        <IcHistory size={17} />
        <span className="flex-1 text-[14px]">{s.castHistory}</span>
        <IcArrowUp size={18} />
      </button>

      {qualityOpen && qualityPanel}
      {episodesOpen && episodesPanel}
      {devicesOpen && devicesPanel}
      {historyOpen && historyDrawer}
    </div>
  );
}
