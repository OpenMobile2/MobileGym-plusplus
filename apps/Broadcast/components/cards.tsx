// apps/Broadcast/components/cards.tsx — 节目/单集卡片与行
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBroadcastGestures } from '../hooks/useBroadcastGestures';
import { useBroadcastStore } from '../state';
import { Artwork, fmtDuration, fmtRemain } from './common';
import type { Episode, Show } from '../types';
import { IcPlay, IcPause, IcMore } from '../res/icons';
import { useBroadcastStrings } from '../hooks/useBroadcastStrings';

// 打开单集上下文菜单(URL 驱动:?epMenu=<id>)
export function useEpisodeMenu() {
  const [sp, setSp] = useSearchParams();
  const open = (episodeId: string) =>
    setSp(p => { p.set('epMenu', episodeId); return p; });
  const close = () => setSp(p => { p.delete('epMenu'); return p; });
  return { openId: sp.get('epMenu'), open, close };
}

// 播放胶囊:▶ + 进度/时长
export const PlayPill: React.FC<{ ep: Episode }> = ({ ep }) => {
  const s = useBroadcastStrings();
  const playEpisode = useBroadcastStore(s => s.playEpisode);
  const togglePlay = useBroadcastStore(s => s.togglePlay);
  const current = useBroadcastStore(s => s.player.currentEpisodeId);
  const isPlaying = useBroadcastStore(s => s.player.isPlaying);
  const active = current === ep.id;
  const remain = ep.durationSec - ep.progressSec;
  const started = ep.progressSec > 0 && remain > 0;
  return (
    <button
      data-action="broadcast.episode.play"
      data-action-params={JSON.stringify({ episodeId: ep.id })}
      onClick={(e) => {
        e.stopPropagation();
        if (active) togglePlay();
        else playEpisode(ep.id);
      }}
      className="inline-flex items-center gap-2 h-8 pl-2.5 pr-3.5 rounded-full bg-app-primary/10 active:bg-app-primary/20 shrink-0"
    >
      {active && isPlaying
        ? <IcPause size={15} className="text-app-primary" fill="currentColor" />
        : <IcPlay size={15} className="text-app-primary" fill="currentColor" />}
      {started && (
        <span className="w-12 h-1 rounded-full bg-app-primary/25 overflow-hidden">
          <span className="block h-full bg-app-primary" style={{ width: `${Math.round((ep.progressSec / ep.durationSec) * 100)}%` }} />
        </span>
      )}
      <span className="text-[13px] font-semibold text-app-primary">
        {active && isPlaying ? s.playing : started ? fmtRemain(remain, s) : fmtDuration(ep.durationSec, s)}
      </span>
    </button>
  );
};

// 节目方块(横向卡)
export const ShowTile: React.FC<{ show: Show; size?: number }> = ({ show, size = 150 }) => {
  const { bindTap } = useBroadcastGestures();
  return (
    <button {...bindTap('broadcast.show-open', { params: { id: show.id } })} className="flex flex-col text-left shrink-0" style={{ width: size }}>
      <Artwork showId={show.id} color={show.artworkColor} text={show.artworkText} size={size} radius={12} />
      <div className="mt-1.5 text-[14px] font-medium text-app-text truncate w-full">{show.title}</div>
      <div className="text-[12px] text-app-text-muted truncate w-full">{show.author}</div>
    </button>
  );
};

// 排行卡(带序号)
export const RankTile: React.FC<{ show: Show; rank: number; size?: number }> = ({ show, rank, size = 140 }) => {
  const { bindTap } = useBroadcastGestures();
  return (
    <button {...bindTap('broadcast.show-open', { params: { id: show.id } })} className="flex flex-col text-left shrink-0" style={{ width: size }}>
      <Artwork showId={show.id} color={show.artworkColor} text={show.artworkText} size={size} radius={12} />
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className="text-[15px] font-bold text-app-text-muted">{rank}</span>
        <span className="text-[14px] font-medium text-app-text truncate">{show.title}</span>
      </div>
      <div className="text-[12px] text-app-text-muted truncate w-full pl-5">{show.author}</div>
    </button>
  );
};

// 单集行(列表通用)
export const EpisodeRow: React.FC<{ ep: Episode; showArtwork?: boolean; label?: string }> = ({ ep, showArtwork = true, label }) => {
  const s = useBroadcastStrings();
  const { bindTap } = useBroadcastGestures();
  const shows = useBroadcastStore(s => s.shows);
  const { open } = useEpisodeMenu();
  const show = shows[ep.showId];
  return (
    <div {...bindTap('broadcast.episode-open', { params: { id: ep.id } })} className="flex gap-3 px-4 py-3 border-b border-app-border active:bg-black/5">
      {showArtwork && <Artwork showId={show?.id} color={show?.artworkColor || '#888'} text={show?.artworkText} size={56} radius={8} />}
      <div className="flex-1 min-w-0">
        <div className="text-[12px] text-app-text-muted mb-0.5">{label ? `${label} · ` : ''}{show?.title}</div>
        <div className="text-[15px] font-medium text-app-text leading-snug line-clamp-2">{ep.title}</div>
        <div className="mt-2 flex items-center justify-between">
          <PlayPill ep={ep} />
          <button
            data-action="broadcast.episode.menu.open"
            data-action-params={JSON.stringify({ episodeId: ep.id })}
            onClick={(e) => { e.stopPropagation(); open(ep.id); }}
            className="w-8 h-8 flex items-center justify-center text-app-text-muted"
            aria-label={s.more}
          >
            <IcMore size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
