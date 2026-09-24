import React from 'react';
import { useParams } from 'react-router-dom';
import { useBroadcastGestures } from '../hooks/useBroadcastGestures';
import { useBroadcastStore } from '../state';
import { Artwork, TopBar, fmtDate, showToast } from '../components/common';
import { EpisodeRow } from '../components/cards';
import { IcPlay, IcPause, IcStar, IcFollow, IcFollowed, IcMore, IcChevronRight } from '../res/icons';
import { useBroadcastStrings } from '../hooks/useBroadcastStrings';
import { formatString, localizeCadence, localizeGenre } from '../res/localize';

export const ShowPage: React.FC = () => {
  const s = useBroadcastStrings();
  const { id = '' } = useParams();
  const { bindTap } = useBroadcastGestures();
  const show = useBroadcastStore(s => s.shows[id]);
  const episodes = useBroadcastStore(s => s.episodes);
  const followed = useBroadcastStore(s => s.followedShowIds);
  const toggleFollow = useBroadcastStore(s => s.toggleFollow);
  const playEpisode = useBroadcastStore(s => s.playEpisode);
  const togglePlay = useBroadcastStore(s => s.togglePlay);
  const player = useBroadcastStore(s => s.player);

  if (!show) return <div className="flex flex-col h-full bg-app-bg"><TopBar title={s.shows} /><div className="p-8 text-app-text-muted">{s.show_not_found}</div></div>;
  const isFollowed = followed.includes(show.id);
  const eps = show.episodeIds.map(e => episodes[e]).filter(Boolean);
  const latest = eps[0];
  const playingLatest = latest?.id === player.currentEpisodeId && player.isPlaying;

  return (
    <div className="flex flex-col h-full" data-status-bar-foreground="light" style={{ background: `linear-gradient(180deg, ${show.artworkColor} 0%, ${show.artworkColor} 72%, #fff 72%)` }}>
      <TopBar transparent showBack right={
        <>
          <button onClick={() => toggleFollow(show.id)} data-action="broadcast.show.follow.toggle" data-action-params={JSON.stringify({ showId: show.id })} className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center" aria-label={isFollowed ? s.followed : s.follow}>
            {isFollowed ? <IcFollowed size={20} className="text-white" /> : <IcFollow size={20} className="text-white" />}
          </button>
          <button onClick={() => showToast(s.feature_unavailable)} data-action="broadcast.show.menu.open" className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center" aria-label={s.more}><IcMore size={20} className="text-white" /></button>
        </>
      } />
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* tinted 头部 */}
        <div className="px-5 pt-2 pb-5 text-white flex flex-col items-center text-center">
          <Artwork showId={show.id} color={show.artworkColor} text={show.artworkText} size={178} radius={15} className="border border-white/15 shadow-[0_12px_30px_rgba(80,0,0,.28)]" />
          <div className="mt-3 text-[22px] font-extrabold">{show.title}</div>
          <div className="text-[14px] opacity-75">{show.author}</div>
          {latest && (
            <button onClick={() => playingLatest ? togglePlay() : playEpisode(latest.id)} data-action="broadcast.show.play" data-action-params={JSON.stringify({ showId: show.id })} className="mt-3 inline-flex items-center gap-2 h-11 px-7 rounded-full bg-white/90 shadow-sm">
              {playingLatest ? <IcPause size={17} className="text-app-text" fill="currentColor" /> : <IcPlay size={17} className="text-app-text" fill="currentColor" />}
              <span className="text-[16px] font-semibold text-app-text">{playingLatest ? s.playing : s.latest_episode}</span>
            </button>
          )}
          <p className="mt-4 text-left w-full text-[13px] leading-relaxed opacity-90 line-clamp-3">{show.desc}</p>
          <div className="mt-2 text-left w-full text-[12px] opacity-75">★ {show.rating} ({show.ratingCount}) · {localizeGenre(show.genreId, show.genreId, s)} · {localizeCadence(show.cadence, s)}</div>
        </div>
        {/* 白色区:单集 + 评分 */}
        <div className="bg-app-bg rounded-t-2xl pt-2 min-h-[300px]">
          <button {...bindTap('broadcast.showEpisodes-open', { params: { id: show.id } })} className="flex items-center justify-between w-full px-4 py-3">
            <span className="text-[19px] font-bold text-app-text">{s.latest_episodes}</span>
            <span className="text-[13px] text-app-primary">{s.view_all}</span>
          </button>
          {eps.slice(0, 3).map(ep => <EpisodeRow key={ep.id} ep={ep} showArtwork={false} label={fmtDate(ep.date, s)} />)}

          <button {...bindTap('broadcast.showReviews-open', { params: { id: show.id } })} className="flex items-center justify-between w-full px-4 py-4 mt-2">
            <span className="text-[19px] font-bold text-app-text">{s.ratings_reviews}</span>
            <IcChevronRight size={20} className="text-app-text-muted" />
          </button>
          <div className="flex items-center gap-3 px-4 pb-6">
            <div className="text-[40px] font-extrabold text-app-text">{show.rating}</div>
            <div className="flex flex-col">
              <div className="flex">{[1, 2, 3, 4, 5].map(n => <IcStar key={n} size={16} className={n <= Math.round(show.rating) ? 'text-app-primary' : 'text-app-border'} fill={n <= Math.round(show.rating) ? 'currentColor' : 'none'} />)}</div>
              <span className="text-[12px] text-app-text-muted mt-1">{formatString(s.ratings_count, { count: show.ratingCount })}</span>
            </div>
            <button {...bindTap('broadcast.showWriteReview-open', { params: { id: show.id } })} className="ml-auto text-[13px] text-app-primary font-medium">{s.write_review}</button>
          </div>
          {show.website && (
            <div className="px-4 pb-10">
              <button onClick={() => showToast(s.feature_unavailable)} className="text-[13px] text-app-primary">{formatString(s.show_website, { website: show.website })}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
