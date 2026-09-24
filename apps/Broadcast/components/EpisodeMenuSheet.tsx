// apps/Broadcast/components/EpisodeMenuSheet.tsx — 单集上下文菜单(URL 驱动 ?epMenu=<id>)
import React from 'react';
import { useBroadcastGestures } from '../hooks/useBroadcastGestures';
import { useBroadcastStore } from '../state';
import { useEpisodeMenu } from './cards';
import { Artwork, showToast } from './common';
import { IcDownload, IcSave, IcShare } from '../res/icons';
import { useBroadcastStrings } from '../hooks/useBroadcastStrings';

const Item: React.FC<{ label: string; danger?: boolean; action?: string; epId?: string; onClick?: () => void; tap?: React.HTMLAttributes<HTMLButtonElement> }> = ({ label, danger, action, epId, onClick, tap }) => (
  <button
    {...(onClick ? { onClick } : {})}
    {...tap}
    {...(action ? { 'data-action': action, 'data-action-params': JSON.stringify({ episodeId: epId }) } : {})}
    className={`w-full text-left px-5 py-3.5 text-[16px] border-b border-app-border last:border-0 active:bg-black/5 ${danger ? 'text-red-500' : 'text-app-text'}`}
  >
    {label}
  </button>
);

export const EpisodeMenuSheet: React.FC = () => {
  const s = useBroadcastStrings();
  const { openId } = useEpisodeMenu();
  const { back, bindBack, bindTap } = useBroadcastGestures();
  const episodes = useBroadcastStore(s => s.episodes);
  const shows = useBroadcastStore(s => s.shows);
  const saved = useBroadcastStore(s => s.savedEpisodeIds);
  const downloaded = useBroadcastStore(s => s.downloadedEpisodeIds);
  const toggleSave = useBroadcastStore(s => s.toggleSave);
  const toggleDownload = useBroadcastStore(s => s.toggleDownload);
  const playNext = useBroadcastStore(s => s.playNext);
  const addToQueue = useBroadcastStore(s => s.addToQueue);
  const markPlayed = useBroadcastStore(s => s.markPlayed);
  const removeFromUpNext = useBroadcastStore(s => s.removeFromUpNext);
  if (!openId) return null;
  const ep = episodes[openId];
  if (!ep) return null;
  const show = shows[ep.showId];
  const isSaved = saved.includes(ep.id);
  const isDownloaded = downloaded.includes(ep.id);
  const run = (fn: () => void, toast?: string) => () => { fn(); if (toast) showToast(toast); back(); };

  return (
    <div className="absolute inset-0 z-[120] flex flex-col justify-end">
      <div {...bindBack()} className="absolute inset-0 bg-black/30" />
      <div className="relative bg-app-surface rounded-t-2xl pb-6 max-h-[80%] overflow-y-auto shadow-2xl">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-app-border">
          <Artwork showId={show?.id} color={show?.artworkColor || '#888'} text={show?.artworkText} size={44} radius={8} />
          <div className="min-w-0">
            <div className="text-[14px] font-medium text-app-text line-clamp-2">{ep.title}</div>
            <div className="text-[12px] text-app-text-muted truncate">{show?.title}</div>
          </div>
        </div>
        {/* 顶部三按钮 */}
        <div className="grid grid-cols-3 gap-2 px-5 py-3 border-b border-app-border">
          <button data-action="broadcast.episode.download" data-action-params={JSON.stringify({ episodeId: ep.id })}
            onClick={run(() => toggleDownload(ep.id), isDownloaded ? s.download_removed : s.download_complete)}
            className="flex flex-col items-center gap-1 py-2 rounded-xl bg-black/5 active:bg-black/10">
            <IcDownload size={20} className="text-app-text" /><span className="text-[12px] text-app-text">{isDownloaded ? s.remove_download : s.download}</span>
          </button>
          <button data-action="broadcast.episode.save" data-action-params={JSON.stringify({ episodeId: ep.id })}
            onClick={run(() => toggleSave(ep.id), isSaved ? s.save_removed : s.saved_complete)}
            className="flex flex-col items-center gap-1 py-2 rounded-xl bg-black/5 active:bg-black/10">
            <IcSave size={20} className="text-app-text" /><span className="text-[12px] text-app-text">{isSaved ? s.unsave : s.save}</span>
          </button>
          <button data-action="broadcast.share.open"
            onClick={run(() => showToast(s.feature_unavailable))}
            className="flex flex-col items-center gap-1 py-2 rounded-xl bg-black/5 active:bg-black/10">
            <IcShare size={20} className="text-app-text" /><span className="text-[12px] text-app-text">{s.share}</span>
          </button>
        </div>
        <Item label={s.play_next} action="broadcast.episode.playNext" epId={ep.id} onClick={run(() => playNext(ep.id), s.added_to_next)} />
        <Item label={s.add_to_queue} action="broadcast.episode.addQueue" epId={ep.id} onClick={run(() => addToQueue(ep.id), s.added_to_queue)} />
        <Item label={s.mark_played} action="broadcast.episode.markPlayed" epId={ep.id} onClick={run(() => markPlayed(ep.id))} />
        <Item label={s.go_to_episode} tap={bindTap('broadcast.episode-open', { params: { id: ep.id } })} />
        <Item label={s.go_to_show} tap={bindTap('broadcast.show-open', { params: { id: ep.showId } })} />
        <Item label={s.report_problem} onClick={run(() => showToast(s.feature_unavailable))} />
        <Item label={s.remove_from_up_next} danger action="broadcast.episode.removeUpNext" epId={ep.id} onClick={run(() => removeFromUpNext(ep.id), s.removed_from_up_next)} />
      </div>
    </div>
  );
};
