import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBroadcastGestures } from '../hooks/useBroadcastGestures';
import { useBroadcastStore } from '../state';
import { PLAYBACK_SPEEDS, SLEEP_OPTIONS } from '../constants';
import { Artwork, fmtClock, showToast } from '../components/common';
import { useEpisodeMenu } from '../components/cards';
import { IcPlay, IcPause, IcReplay, IcSpeed, IcSleep, IcAirplay, IcQueue, IcMore, IcChevronDown, IcVolumeLow, IcVolumeHigh } from '../res/icons';
import { useBroadcastStrings } from '../hooks/useBroadcastStrings';
import { formatString } from '../res/localize';

export const NowPlayingPage: React.FC = () => {
  const s = useBroadcastStrings();
  const { bindTap, bindBack } = useBroadcastGestures();
  const [sp] = useSearchParams();
  const { open: openEpisodeMenu } = useEpisodeMenu();
  const isQueue = sp.get('view') === 'queue';

  const player = useBroadcastStore(s => s.player);
  const episodes = useBroadcastStore(s => s.episodes);
  const shows = useBroadcastStore(s => s.shows);
  const queueIds = useBroadcastStore(s => s.queueIds);
  const togglePlay = useBroadcastStore(s => s.togglePlay);
  const skip = useBroadcastStore(s => s.skip);
  const seek = useBroadcastStore(s => s.seek);
  const setSpeed = useBroadcastStore(s => s.setSpeed);
  const setSleep = useBroadcastStore(s => s.setSleep);
  const clearQueue = useBroadcastStore(s => s.clearQueue);
  const playEpisode = useBroadcastStore(s => s.playEpisode);

  const ep = player.currentEpisodeId ? episodes[player.currentEpisodeId] : null;
  const show = ep ? shows[ep.showId] : null;

  const cycleSpeed = () => {
    const i = PLAYBACK_SPEEDS.indexOf(player.speed as never);
    setSpeed(PLAYBACK_SPEEDS[(i + 1) % PLAYBACK_SPEEDS.length]);
  };
  const cycleSleep = () => {
    const opts = [0, ...SLEEP_OPTIONS];
    const i = opts.indexOf(player.sleepMinutes);
    const next = opts[(i + 1) % opts.length];
    setSleep(next);
    showToast(next ? formatString(s.sleep_timer_minutes, { count: next }) : s.sleep_timer_off);
  };
  const onScrub = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!ep) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(Math.round(ratio * ep.durationSec));
  };

  if (!ep || !show) {
    return <div className="flex flex-col h-full bg-app-bg items-center justify-center text-app-text-muted" data-status-bar-foreground="dark"><button {...bindBack()} className="absolute top-12 left-4">{s.close}</button>{s.nothing_playing}</div>;
  }

  const remain = ep.durationSec - ep.progressSec;
  const pct = Math.round((ep.progressSec / ep.durationSec) * 100);

  return (
    <div className="flex flex-col h-full px-5 pt-4 pb-7" data-status-bar-foreground="light" style={{ background: `linear-gradient(180deg, ${show.artworkColor} 0%, ${show.artworkColor} 36%, color-mix(in srgb, ${show.artworkColor} 72%, #3d0710) 100%)` }} data-scroll-container="main" data-scroll-direction="vertical">
      <div className="relative h-10 mb-2 flex items-center justify-center shrink-0">
        <button {...bindBack()} className="absolute left-0 w-10 h-10 rounded-full bg-black/20 flex items-center justify-center active:bg-black/30" aria-label={s.close_player}>
          <IcChevronDown size={25} className="text-white" />
        </button>
        <span className="text-[13px] font-semibold text-white/85">{s.now_playing}</span>
      </div>

      {!isQueue ? (
        <>
          <div className="flex-1 flex items-center justify-center">
            <Artwork showId={show.id} color={show.artworkColor} text={show.artworkText} size={292} radius={16} className="shadow-[0_18px_38px_rgba(70,0,0,.34)] border border-white/10" />
          </div>
          <div className="text-white mt-4">
            <div className="text-[12px] opacity-70">{show.author}</div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0 overflow-hidden">
                <style>{`@keyframes broadcast-title-marquee{0%,15%{transform:translateX(0)}85%,100%{transform:translateX(calc(-100% + 230px))}}`}</style>
                <div className="w-max min-w-full whitespace-nowrap text-[18px] font-bold" style={{ animation: ep.title.length > 22 ? 'broadcast-title-marquee 12s ease-in-out infinite alternate' : undefined }}>{ep.title}</div>
              </div>
              <button
                onClick={() => openEpisodeMenu(ep.id)}
                data-action="broadcast.episode.menu.open"
                data-action-params={JSON.stringify({ episodeId: ep.id })}
                className="w-8 h-8 flex items-center justify-center shrink-0"
                aria-label={s.more}
              >
                <IcMore size={20} className="text-white/80" />
              </button>
            </div>
            <div className="text-[13px] opacity-70">{show.title}</div>
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto text-white">
          <div className="flex items-center gap-3 py-3 border-b border-white/15">
            <Artwork showId={show.id} color={show.artworkColor} text={show.artworkText} size={44} radius={8} />
            <div className="min-w-0"><div className="text-[14px] font-medium truncate">{ep.title}</div><div className="text-[12px] opacity-70">{show.title}</div></div>
          </div>
          <div className="flex items-center justify-between mt-4 mb-2">
            <span className="text-[18px] font-bold">{s.queue}</span>
            <button onClick={() => { clearQueue(); showToast(s.queue_cleared); }} data-action="broadcast.player.queue.clear" className="text-[14px] opacity-90">{s.clear}</button>
          </div>
          {queueIds.length === 0 && <div className="py-8 text-center opacity-60 text-sm">{s.queue_empty}</div>}
          {queueIds.map(qid => { const qe = episodes[qid]; if (!qe) return null; return (
            <button
              key={qid}
              onClick={() => playEpisode(qid)}
              data-action="broadcast.episode.play"
              data-action-params={JSON.stringify({ episodeId: qid })}
              className="w-full flex items-center gap-3 py-3 border-b border-white/10 text-left active:bg-white/10"
            >
              <Artwork showId={shows[qe.showId]?.id} color={shows[qe.showId]?.artworkColor || '#888'} text={shows[qe.showId]?.artworkText} size={40} radius={6} />
              <div className="min-w-0 flex-1"><div className="text-[14px] truncate">{qe.title}</div><div className="text-[12px] opacity-60">{fmtClock(qe.durationSec)}</div></div>
              <span className="opacity-50">≡</span>
            </button>
          ); })}
        </div>
      )}

      {/* 进度条 */}
      <div className="mt-5 text-white">
        <div data-action="broadcast.player.seek" className="h-1.5 rounded-full bg-white/25 overflow-hidden cursor-pointer" onPointerDown={onScrub}>
          <div className="h-full bg-white" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between text-[11px] opacity-70 mt-1 tabular-nums">
          <span>{fmtClock(ep.progressSec)}</span><span>-{fmtClock(remain)}</span>
        </div>
      </div>

      {/* 传输键 */}
      <div className="flex items-center justify-between mt-4 text-white">
        <button onClick={cycleSpeed} data-action="broadcast.player.speed.cycle" className="flex flex-col items-center w-12"><IcSpeed size={22} /><span className="text-[10px] mt-0.5">{player.speed}×</span></button>
        <button onClick={() => skip(-15)} data-action="broadcast.player.skip.back" className="flex items-center justify-center w-12"><IcReplay size={28} /></button>
        <button onClick={togglePlay} data-action="broadcast.player.playpause.toggle" className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
          {player.isPlaying ? <IcPause size={30} className="text-app-text" fill="currentColor" /> : <IcPlay size={30} className="text-app-text" fill="currentColor" />}
        </button>
        <button onClick={() => skip(30)} data-action="broadcast.player.skip.forward" className="flex items-center justify-center w-12"><IcReplay size={28} className="-scale-x-100" /></button>
        <button onClick={cycleSleep} data-action="broadcast.player.sleep.set" className="flex flex-col items-center w-12"><IcSleep size={22} /><span className="text-[10px] mt-0.5">{player.sleepMinutes || ''}</span></button>
      </div>

      <div className="flex items-center gap-3 mt-6 text-white/80">
        <IcVolumeLow size={19} aria-hidden />
        <div className="h-1.5 flex-1 rounded-full bg-white/45">
          <div className="h-full w-[72%] rounded-full bg-white/90" />
        </div>
        <IcVolumeHigh size={20} aria-hidden />
      </div>

      {/* 底部:AirPlay + 队列 */}
      <div className="flex items-center justify-between mt-5 text-white/80">
        <button onClick={() => showToast(s.feature_unavailable)} data-action="broadcast.player.airplay" className="w-10 h-10 flex items-center justify-center"><IcAirplay size={22} /></button>
        {isQueue ? (
          <button {...bindTap('broadcast.nowplaying-open')} className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/20"><IcQueue size={22} /></button>
        ) : (
          <button {...bindTap('broadcast.playerQueue-open')} className="w-10 h-10 flex items-center justify-center rounded-lg"><IcQueue size={22} /></button>
        )}
      </div>
    </div>
  );
};
