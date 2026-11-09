import React from 'react';
import { useXimalayaGestures } from '../hooks/useXimalayaGestures';
import { Img } from '../components/ui';
import { useXimalayaStore } from '../state';
import { IcPlay, IcPause, IcPrev, IcNext, IcClose } from '../res/icons';

export function DrivingPage() {
  const { bindTap, back } = useXimalayaGestures();
  const albums = useXimalayaStore((st) => st.albums);
  const tracks = useXimalayaStore((st) => st.tracks);
  const player = useXimalayaStore((st) => st.player);
  const togglePlay = useXimalayaStore((st) => st.togglePlay);
  const playTrack = useXimalayaStore((st) => st.playTrack);

  const album = albums.find((a) => a.id === player.currentAlbumId) ?? albums[0];
  const track = tracks.find((t) => t.id === player.currentTrackId) ?? tracks[0];
  const list = album.trackIds ?? [];
  const pos = list.indexOf(track.id);

  const jump = (dir: 'prev' | 'next') => {
    if (list.length === 0) return;
    const nextPos = dir === 'prev'
      ? (pos - 1 + list.length) % list.length
      : (pos + 1) % list.length;
    const nt = tracks.find((t) => t.id === list[nextPos]);
    if (nt) playTrack(album.id, nt.id);
  };

  return (
    <div
      className="h-full flex flex-col pt-10 items-center"
      style={{ background: `linear-gradient(180deg, ${album.themeColor} 0%, #050507 80%)` }}
      data-status-bar-foreground="light"
    >
      {/* 退出驾驶模式 */}
      <div className="w-full shrink-0 h-12 flex items-center px-3">
        <button
          {...bindTap({ kind: 'action', id: 'driving.exit.tap' }, { onTrigger: () => back() })}
          className="flex items-center gap-1 text-white/85 text-[15px]"
        >
          <IcClose size={22} />退出驾驶模式
        </button>
      </div>

      {/* 超大封面 + 标题 */}
      <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center px-8 gap-8">
        <Img src={album.cover} className="w-64 h-64 max-w-[75vw] max-h-[45vh] rounded-3xl object-cover shadow-2xl" />
        <div className="text-center">
          <div className="text-white text-[26px] font-bold leading-tight line-clamp-2">{track.title}</div>
          <div className="text-white/60 text-[16px] mt-2 truncate">{album.title}</div>
        </div>

        {/* 超大控制 */}
        <div className="flex items-center justify-center gap-12 mt-2">
          <button
            {...bindTap({ kind: 'action', id: 'driving.prevnext.select.opt' }, { params: { dir: 'prev' }, onTrigger: () => jump('prev') })}
            className="text-white/90" aria-label="上一集"
          ><IcPrev size={48} /></button>
          <button
            {...bindTap({ kind: 'action', id: 'driving.toggle.toggle' }, { onTrigger: togglePlay })}
            className="w-24 h-24 rounded-full bg-white text-black flex items-center justify-center shadow-xl"
            aria-label="播放/暂停"
          >{player.playing ? <IcPause size={52} /> : <IcPlay size={52} />}</button>
          <button
            {...bindTap({ kind: 'action', id: 'driving.prevnext.select.opt' }, { params: { dir: 'next' }, onTrigger: () => jump('next') })}
            className="text-white/90" aria-label="下一集"
          ><IcNext size={48} /></button>
        </div>
      </div>

      <div className="shrink-0 h-8 text-white/40 text-[13px]">驾驶模式 · 极简收听</div>
    </div>
  );
}
