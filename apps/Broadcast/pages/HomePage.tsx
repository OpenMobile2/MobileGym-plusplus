import React from 'react';
import { useBroadcastGestures } from '../hooks/useBroadcastGestures';
import { useBroadcastStore } from '../state';
import { Artwork, BigTitle, SectionHeader, fmtDate, fmtDuration, fmtRemain } from '../components/common';
import { ShowTile, useEpisodeMenu } from '../components/cards';
import { IcMore, IcPause, IcPlay } from '../res/icons';
import { useBroadcastStrings } from '../hooks/useBroadcastStrings';

const Avatar: React.FC = () => {
  const { bindTap } = useBroadcastGestures();
  const s = useBroadcastStrings();
  return (
    <button
      {...bindTap('broadcast.account-open')}
      className="w-10 h-10 rounded-full flex items-center justify-center text-[24px] overflow-hidden border border-black/5 shadow-sm"
      style={{ background: 'linear-gradient(145deg,#f7d9df,#d9b5c2)' }}
      aria-label={s.account}
    >
      👩🏻‍💻
    </button>
  );
};

export const HomePage: React.FC = () => {
  const s = useBroadcastStrings();
  const { bindTap } = useBroadcastGestures();
  const episodes = useBroadcastStore(s => s.episodes);
  const shows = useBroadcastStore(s => s.shows);
  const upNextIds = useBroadcastStore(s => s.upNextIds);
  const favoriteShowIds = useBroadcastStore(s => s.favoriteShowIds);
  const player = useBroadcastStore(s => s.player);
  const playEpisode = useBroadcastStore(s => s.playEpisode);
  const togglePlay = useBroadcastStore(s => s.togglePlay);
  const { open } = useEpisodeMenu();

  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
      <BigTitle title={s.tab_home} right={<Avatar />} />
      <div className="flex-1 overflow-y-auto pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 待播清单 */}
        <SectionHeader title={s.up_next} onMore={bindTap('broadcast.upnext-open')} />
        <div className="flex gap-3 px-4 pb-2 overflow-x-auto" data-scroll-container="carousel" data-scroll-direction="horizontal">
          {upNextIds.map(id => {
            const ep = episodes[id]; if (!ep) return null;
            const show = shows[ep.showId];
            const started = ep.progressSec > 0;
            const active = player.currentEpisodeId === id;
            const playing = active && player.isPlaying;
            return (
              <div key={id} className="w-[232px] shrink-0 rounded-[18px] overflow-hidden shadow-[inset_0_0_0_1px_rgba(255,255,255,.08)]" style={{ background: show?.artworkColor }}>
                <div {...bindTap('broadcast.episode-open', { params: { id } })} className="flex justify-center p-4 pb-0">
                  <Artwork showId={show?.id} color={show?.artworkColor || '#888'} text={show?.artworkText} size={178} radius={13} className="border border-white/15 shadow-lg" />
                </div>
                <div className="px-4 pt-3 pb-4 text-white">
                  <div className="text-[12px] opacity-80 mb-1">{started ? s.continue_listening : s.new_episode} · {fmtDate(ep.date, s)}</div>
                  <div className="text-[15px] font-semibold leading-[1.35] line-clamp-2 min-h-[41px]">{ep.title}</div>
                  <div className="mt-1 text-[12px] leading-snug opacity-75 line-clamp-2 min-h-[32px]">{ep.desc}</div>
                  <div className="mt-3 flex items-center justify-between">
                    <button
                      onClick={() => active ? togglePlay() : playEpisode(id)}
                      data-action="broadcast.episode.play"
                      data-action-params={JSON.stringify({ episodeId: id })}
                      className="inline-flex items-center gap-2 h-8 px-3 rounded-full bg-white/90 text-[13px] font-semibold text-app-text"
                    >
                      {playing ? <IcPause size={14} fill="currentColor" /> : <IcPlay size={14} fill="currentColor" />}
                      {playing ? s.playing : started ? fmtRemain(ep.durationSec - ep.progressSec, s) : fmtDuration(ep.durationSec, s)}
                    </button>
                    <button data-action="broadcast.episode.menu.open" data-action-params={JSON.stringify({ episodeId: id })} onClick={() => open(id)} className="text-white/90 w-8 h-8 flex items-center justify-center" aria-label={s.more}><IcMore size={20} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 你的最爱节目 */}
        <SectionHeader title={s.favorite_shows} onMore={bindTap('broadcast.libraryShows-open')} />
        <div className="flex gap-3 px-4 overflow-x-auto" data-scroll-container="carousel" data-scroll-direction="horizontal">
          {favoriteShowIds.map(id => shows[id] && <ShowTile key={id} show={shows[id]} size={144} />)}
        </div>
      </div>
    </div>
  );
};
