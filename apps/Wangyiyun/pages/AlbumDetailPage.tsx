import React from 'react';
import { useParams } from 'react-router-dom';
import { useWangyiyunStore } from '../state';
import { useWangyiyunGestures } from '../hooks/useWangyiyunGestures';
import { TopBar, Cover, useToast, WY } from '../components/ui';
import { TrackList } from '../components/parts';
import { playerGradient } from '../res/colors';

export default function AlbumDetailPage() {
  const { id = '' } = useParams();
  const { bindTap, go } = useWangyiyunGestures();
  const album = useWangyiyunStore((s) => s.albums.find((a) => a.id === id));
  const collected = useWangyiyunStore((s) => s.collectedAlbumIds.includes(id));
  const toggle = useWangyiyunStore((s) => s.toggleCollectAlbum);
  const [toast, showToast] = useToast();
  if (!album) return <div className="h-full flex items-center justify-center" style={{ background: WY.pageBg }}>专辑不存在</div>;
  const grad = playerGradient(album.seed);
  return (
    <div className="flex flex-col h-full" data-status-bar-foreground="light" style={{ background: WY.pageBg }}>
      {toast}
      <div style={{ background: `linear-gradient(180deg, ${grad.from}, ${grad.to})` }} className="shrink-0">
        <div className="h-10" />
        <TopBar dark title="专辑" />
        <div className="flex gap-3 px-4 pb-4 text-white">
          <Cover seed={album.seed} className="w-24 h-24" rounded={10} />
          <div className="flex-1">
            <div className="text-[17px] font-bold">{album.title}</div>
            <button {...bindTap('album.artist-open', { params: { id: album.artistId } })} className="text-[13px] opacity-85 mt-1 bg-transparent border-none cursor-pointer text-white p-0">歌手:{album.artist} ›</button>
            <div className="text-[11px] opacity-70 mt-1">发行时间:{album.date}</div>
            <button {...bindTap({ kind: 'action', id: 'album.collect.toggle' }, {
              params: { albumId: id },
              onTrigger: () => { toggle(id); showToast(collected ? '已取消收藏' : '已收藏专辑'); },
            })}
              className="mt-2 px-3 py-1 rounded-full text-[12px] border border-white/60 bg-transparent cursor-pointer text-white">
              {collected ? '已收藏' : `收藏 ${album.collectCount}`}
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto -mt-3">
        <TrackList songIds={album.songIds} source={`专辑:${album.title}`} showIndex playAllTransition="album.playall" />
      </div>
    </div>
  );
}
