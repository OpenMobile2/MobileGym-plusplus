import React from 'react';
import { useWangyiyunStore } from '../state';
import { useWangyiyunGestures } from '../hooks/useWangyiyunGestures';
import { Cover, WY } from '../components/ui';
import { IcChevronDown, IcHeart, IcPrev, IcNext, IcPlay, IcPause } from '../res/icons';
import { playerGradient } from '../res/colors';

export default function HeartModePage() {
  const { bindTap, bindBack } = useWangyiyunGestures();
  const [started, setStarted] = React.useState(false);
  const songs = useWangyiyunStore((s) => s.songs);
  const liked = useWangyiyunStore((s) => s.likedSongIds);
  const isPlaying = useWangyiyunStore((s) => s.isPlaying);
  const playFrom = useWangyiyunStore((s) => s.playFrom);
  const togglePlay = useWangyiyunStore((s) => s.togglePlay);
  const nextSong = useWangyiyunStore((s) => s.nextSong);
  const prevSong = useWangyiyunStore((s) => s.prevSong);
  const currentId = useWangyiyunStore((s) => s.currentSongId);
  const song = songs.find((x) => x.id === currentId);
  const grad = playerGradient(song?.seed || 'heart');

  if (!started) {
    return (
      <div className="flex flex-col h-full items-center justify-center px-8" style={{ background: '#151515' }} data-status-bar-foreground="light">
        <div className="text-6xl mb-6">🎧</div>
        <div className="text-white text-[18px] font-semibold mb-2">邀你体验「心动」</div>
        <div className="text-white/60 text-[13px] text-center mb-10">红心歌曲和相似推荐,一键沉浸</div>
        <button {...bindTap({ kind: 'action', id: 'heart.mode.start' }, {
          onTrigger: () => {
            setStarted(true);
            const ids = liked.length ? liked : songs.map((s) => s.id);
            playFrom(ids, ids[0], '心动模式');
          },
        })}
          className="px-10 py-3 rounded-full text-[15px] border-none cursor-pointer" style={{ background: '#fff', color: WY.textPrimary }}>立即收听</button>
      </div>
    );
  }
  return (
    <div className="flex flex-col h-full" style={{ background: `linear-gradient(180deg,${grad.from},${grad.to})` }} data-status-bar-foreground="light">
      <div className="h-10" />
      <div className="flex items-center h-11 px-2"><button {...bindBack()} className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer text-white" aria-label="收起"><IcChevronDown size={26} /></button></div>
      <div className="flex-1 flex flex-col items-center justify-center">
        <button {...bindTap('heart.player-open')} className="w-56 h-56 rounded-full flex items-center justify-center border-none cursor-pointer p-0" style={{ background: 'rgba(0,0,0,0.35)', animation: isPlaying ? 'spin 16s linear infinite' : 'none' }} aria-label="打开播放页">
          <Cover seed={song?.seed || 'liked'} className="w-40 h-40" rounded={999} />
        </button>
        <div className="text-white text-[18px] font-semibold mt-6">{song?.title}</div>
        <div className="text-white/70 text-[13px]">{song?.artist}</div>
      </div>
      <div className="flex items-center justify-center gap-10 pb-10 text-white">
        <button {...bindTap({ kind: 'action', id: 'player.skip.control' }, { onTrigger: prevSong })} className="bg-transparent border-none cursor-pointer text-white" aria-label="上一首"><IcPrev size={30} /></button>
        <button {...bindTap({ kind: 'action', id: 'player.play.toggle' }, { onTrigger: togglePlay })} className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center border-none cursor-pointer text-white" aria-label="播放">{isPlaying ? <IcPause size={30} /> : <IcPlay size={30} />}</button>
        <button {...bindTap({ kind: 'action', id: 'player.skip.control' }, { onTrigger: nextSong })} className="bg-transparent border-none cursor-pointer text-white" aria-label="下一首"><IcNext size={30} /></button>
      </div>
    </div>
  );
}
