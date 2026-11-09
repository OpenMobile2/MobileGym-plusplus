import React from 'react';
import { useParams } from 'react-router-dom';
import { useWangyiyunStore } from '../state';
import { useWangyiyunGestures } from '../hooks/useWangyiyunGestures';
import { TopBar, Cover, coverBg, useToast, useSheets, WY } from '../components/ui';
import { TrackList } from '../components/parts';
import { playerGradient } from '../res/colors';
import { IcShare, IcComment, IcHeart } from '../res/icons';

export default function PlaylistDetailPage() {
  const { id = '' } = useParams();
  const { bindTap, go } = useWangyiyunGestures();
  const { open } = useSheets();
  const [toast, showToast] = useToast();
  const playlist = useWangyiyunStore((s) => s.playlists.find((p) => p.id === id));
  const collected = useWangyiyunStore((s) => s.collectedPlaylistIds.includes(id));
  const toggleCollect = useWangyiyunStore((s) => s.toggleCollectPlaylist);
  const removeSong = useWangyiyunStore((s) => s.removeSongFromPlaylist);
  const [manage, setManage] = React.useState(false);
  const [selected, setSelected] = React.useState<string[]>([]);

  if (!playlist) return <div className="h-full flex items-center justify-center" style={{ background: WY.pageBg }}>歌单不存在</div>;
  const grad = playerGradient(playlist.seed);

  return (
    <div className="flex flex-col h-full" data-status-bar-foreground="light" style={{ background: WY.pageBg }}>
      {toast}
      <div style={{ background: `linear-gradient(180deg, ${grad.from}, ${grad.to})` }} className="shrink-0">
        <div className="h-9" />
        <TopBar dark right={playlist.mine ? (
          <button {...bindTap({ kind: 'action', id: 'playlist.manage.enter' }, {
            onTrigger: () => { setManage((v) => !v); setSelected([]); },
          })} className="bg-transparent border-none cursor-pointer text-white text-[13px]">
            {manage ? '完成' : '管理'}
          </button>
        ) : undefined} />
        <div className="flex gap-3 px-4 pb-4">
          <Cover seed={playlist.seed} className="w-24 h-24" rounded={10} />
          <div className="flex-1 min-w-0 text-white">
            <div className="text-[16px] font-semibold line-clamp-2">{playlist.title}</div>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-5 h-5 rounded-full" style={{ background: coverBg(playlist.creator) }} />
              <span className="text-[12px] opacity-85">{playlist.creator}</span>
            </div>
            {playlist.desc && <div className="text-[11px] opacity-70 mt-2 line-clamp-1">{playlist.desc} ›</div>}
          </div>
        </div>
        <div className="flex justify-around pb-4 text-white text-[12px]">
          <button onClick={() => open('share', `playlist:${id}`)} className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer text-white">
            <IcShare size={20} />分享
          </button>
          <button onClick={() => playlist.songIds[0] && go('playlist.comment-open', { sid: playlist.songIds[0] })} className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer text-white">
            <IcComment size={20} />评论
          </button>
          <button {...bindTap({ kind: 'action', id: 'playlist.collect.toggle' }, {
            params: { playlistId: id },
            onTrigger: () => { toggleCollect(id); showToast(collected ? '已取消收藏' : '歌单已收藏'); },
          })} className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer text-white">
            <IcHeart size={20} fill={collected ? WY.primary : 'none'} style={{ color: collected ? WY.primary : '#fff' }} />
            {collected ? '已收藏' : `收藏${playlist.collectCount}`}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto -mt-3 bg-white" data-scroll-container="pl-list" data-scroll-direction="vertical">
        {manage ? (
          <div className="pt-4 px-4">
            {playlist.songIds.map((songId) => {
              const song = useWangyiyunStore.getState().songs.find((s) => s.id === songId);
              const on = selected.includes(songId);
              return (
                <button key={songId} onClick={() => setSelected((xs) => on ? xs.filter((x) => x !== songId) : [...xs, songId])}
                  className="flex items-center w-full py-3 bg-transparent border-none border-b cursor-pointer text-left"
                  style={{ borderColor: WY.divider }}>
                  <span className="w-5 h-5 rounded-full border mr-3" style={{ borderColor: on ? WY.primary : WY.textTertiary, background: on ? WY.primary : 'transparent' }} />
                  <span className="flex-1 text-[14px]" style={{ color: WY.textPrimary }}>{song?.title}</span>
                </button>
              );
            })}
            <button {...bindTap({ kind: 'action', id: 'playlist.song.delete' }, {
              params: { count: selected.length },
              onTrigger: () => {
                selected.forEach((songId) => removeSong(id, songId));
                showToast(`已删除${selected.length}首`);
                setSelected([]);
              },
            })} disabled={!selected.length} className="w-full my-4 py-3 rounded-full border-none cursor-pointer text-white"
              style={{ background: selected.length ? WY.primary : WY.textTertiary }}>删除({selected.length})</button>
          </div>
        ) : (
          <TrackList songIds={playlist.songIds} source={`歌单:${playlist.title}`} />
        )}
      </div>
    </div>
  );
}
