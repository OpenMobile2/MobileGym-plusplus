import React from 'react';
import { useParams } from 'react-router-dom';
import { useBroadcastGestures } from '../hooks/useBroadcastGestures';
import { useBroadcastStore } from '../state';
import { Artwork, TopBar, fmtClock, fmtDate, fmtDuration, showToast } from '../components/common';
import { useEpisodeMenu } from '../components/cards';
import { IcPlay, IcPause, IcDownload, IcSave, IcSaved, IcShare, IcMore } from '../res/icons';
import { useBroadcastStrings } from '../hooks/useBroadcastStrings';
import { localizeCadence } from '../res/localize';

export const EpisodePage: React.FC = () => {
  const s = useBroadcastStrings();
  const { id = '' } = useParams();
  const { bindTap } = useBroadcastGestures();
  const ep = useBroadcastStore(s => s.episodes[id]);
  const shows = useBroadcastStore(s => s.shows);
  const saved = useBroadcastStore(s => s.savedEpisodeIds);
  const downloaded = useBroadcastStore(s => s.downloadedEpisodeIds);
  const playEpisode = useBroadcastStore(s => s.playEpisode);
  const togglePlay = useBroadcastStore(s => s.togglePlay);
  const player = useBroadcastStore(s => s.player);
  const seek = useBroadcastStore(s => s.seek);
  const toggleSave = useBroadcastStore(s => s.toggleSave);
  const toggleDownload = useBroadcastStore(s => s.toggleDownload);
  const { open: openEpisodeMenu } = useEpisodeMenu();

  if (!ep) return <div className="flex flex-col h-full bg-app-bg"><TopBar title={s.latest_episodes} /><div className="p-8 text-app-text-muted">{s.episode_not_found}</div></div>;
  const show = shows[ep.showId];
  const isSaved = saved.includes(ep.id);
  const isDownloaded = downloaded.includes(ep.id);
  const isPlaying = player.currentEpisodeId === ep.id && player.isPlaying;

  const seekTo = (sec: number) => { playEpisode(ep.id); seek(sec); };

  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
      <TopBar transparent showBack right={
        <>
          <button onClick={() => showToast(s.feature_unavailable)} data-action="broadcast.share.open" className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center" aria-label={s.share}><IcShare size={18} className="text-app-text" /></button>
          <button onClick={() => openEpisodeMenu(ep.id)} data-action="broadcast.episode.menu.open" data-action-params={JSON.stringify({ episodeId: ep.id })} className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center"><IcMore size={18} className="text-app-text" /></button>
        </>
      } />
      <div className="flex-1 overflow-y-auto px-4 pb-10" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="text-[13px] text-app-text-muted mt-1">{fmtDate(ep.date, s)}</div>
        <h1 className="text-[22px] font-extrabold text-app-text leading-snug mt-1">{ep.title}</h1>
        <button {...bindTap('broadcast.show-open', { params: { id: ep.showId } })} className="flex items-center gap-2 mt-3">
          <Artwork showId={show?.id} color={show?.artworkColor || '#888'} text={show?.artworkText} size={28} radius={6} />
          <span className="text-[14px] font-medium text-app-text">{show?.title}</span>
          <span className="text-app-text-muted">›</span>
        </button>

        {/* 动作行 */}
        <div className="flex items-center gap-3 mt-4">
          <button onClick={() => isPlaying ? togglePlay() : playEpisode(ep.id)} data-action="broadcast.episode.play" data-action-params={JSON.stringify({ episodeId: ep.id })} className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-full bg-app-primary/10">
            {isPlaying
              ? <IcPause size={18} className="text-app-primary" fill="currentColor" />
              : <IcPlay size={18} className="text-app-primary" fill="currentColor" />}
            <span className="text-[15px] font-semibold text-app-primary">{isPlaying ? s.playing : ep.progressSec > 0 ? fmtDuration(ep.durationSec - ep.progressSec, s) : fmtDuration(ep.durationSec, s)}</span>
          </button>
          <button onClick={() => toggleDownload(ep.id)} data-action="broadcast.episode.download" data-action-params={JSON.stringify({ episodeId: ep.id })} className={`w-11 h-11 rounded-full flex items-center justify-center ${isDownloaded ? 'bg-app-primary/15' : 'bg-black/5'}`}>
            <IcDownload size={20} className={isDownloaded ? 'text-app-primary' : 'text-app-text'} />
          </button>
          <button onClick={() => toggleSave(ep.id)} data-action="broadcast.episode.save" data-action-params={JSON.stringify({ episodeId: ep.id })} className={`w-11 h-11 rounded-full flex items-center justify-center ${isSaved ? 'bg-app-primary/15' : 'bg-black/5'}`}>
            {isSaved ? <IcSaved size={20} className="text-app-primary" /> : <IcSave size={20} className="text-app-text" />}
          </button>
        </div>

        <p className="mt-5 text-[15px] leading-relaxed text-app-text whitespace-pre-line">{ep.desc}</p>

        {/* 时光机 章节 */}
        {ep.chapters && ep.chapters.length > 0 && (
          <div className="mt-6">
            <div className="text-[16px] font-bold text-app-text mb-2">{s.time_machine}</div>
            <ul className="space-y-3">
              {ep.chapters.map((c, i) => (
                <li key={i} className="flex gap-3">
                  <button onClick={() => seekTo(c.timeSec)} data-action="broadcast.episode.chapter.seek" data-action-params={JSON.stringify({ episodeId: ep.id, timeSec: c.timeSec })} className="text-[14px] font-semibold text-app-primary shrink-0 tabular-nums">{fmtClock(c.timeSec)}</button>
                  <span className="text-[14px] text-app-text leading-snug">{c.title}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 信息 */}
        <div className="mt-8">
          <div className="text-[16px] font-bold text-app-text mb-2">{s.information}</div>
          <dl className="text-[14px]">
            {[[s.info_show, show?.title], [s.info_frequency, show ? localizeCadence(show.cadence, s) : ''], [s.info_duration, fmtDuration(ep.durationSec, s)], [s.info_release_date, fmtDate(ep.date, s)], [s.info_rating, s.suitable_for_children]].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2.5 border-b border-app-border">
                <dt className="text-app-text-muted">{k}</dt><dd className="text-app-text">{v}</dd>
              </div>
            ))}
          </dl>
          <button onClick={() => showToast(s.feature_unavailable)} className="mt-3 text-[13px] text-app-primary">{s.related_content}</button>
        </div>
      </div>
    </div>
  );
};
