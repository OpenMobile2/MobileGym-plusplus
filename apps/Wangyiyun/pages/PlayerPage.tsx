import React from 'react';
import { useWangyiyunStore } from '../state';
import { useWangyiyunGestures } from '../hooks/useWangyiyunGestures';
import { useSheets, useToast, coverStyle, fmtTime, WY } from '../components/ui';
import { playerGradient } from '../res/colors';
import {
  IcChevronDown, IcShare, IcHeart, IcComment, IcMore, IcQueue,
  IcPrev, IcNext, IcPlay, IcPause, IcShuffle, IcLoop, IcLoopOne, IcOrder,
  IcCast, IcBulb, IcInfo,
} from '../res/icons';
import { PLAY_MODE_LABEL } from '../constants';

export default function PlayerPage() {
  const { bindTap, bindBack, go } = useWangyiyunGestures();
  const { open } = useSheets();
  const [toast, showToast] = useToast();
  const [view, setView] = React.useState<'cover' | 'lyrics'>('cover');

  const songs = useWangyiyunStore((s) => s.songs);
  const currentId = useWangyiyunStore((s) => s.currentSongId);
  const isPlaying = useWangyiyunStore((s) => s.isPlaying);
  const progress = useWangyiyunStore((s) => s.progressSec);
  const playMode = useWangyiyunStore((s) => s.playMode);
  const playSource = useWangyiyunStore((s) => s.playSource);
  const roamMode = useWangyiyunStore((s) => s.roamMode);
  const likedSongIds = useWangyiyunStore((s) => s.likedSongIds);
  const togglePlay = useWangyiyunStore((s) => s.togglePlay);
  const seekTo = useWangyiyunStore((s) => s.seekTo);
  const cyclePlayMode = useWangyiyunStore((s) => s.cyclePlayMode);
  const nextSong = useWangyiyunStore((s) => s.nextSong);
  const prevSong = useWangyiyunStore((s) => s.prevSong);
  const toggleHeart = useWangyiyunStore((s) => s.toggleHeart);
  const enterRoam = useWangyiyunStore((s) => s.enterRoam);
  const quality = useWangyiyunStore((s) => s.quality);

  const song = songs.find((x) => x.id === currentId);
  const dur = song?.durationSec ?? 240;
  const liked = !!song && likedSongIds.includes(song.id);
  const grad = playerGradient(song?.seed ?? 'x');

  // 进度推进
  React.useEffect(() => {
    if (!isPlaying) return;
    const t = setInterval(() => {
      const st = useWangyiyunStore.getState();
      const s = st.songs.find((x) => x.id === st.currentSongId);
      const d = s?.durationSec ?? 240;
      if (st.progressSec + 1 >= d) st.nextSong();
      else st.seekTo(st.progressSec + 1);
    }, 1000);
    return () => clearInterval(t);
  }, [isPlaying]);

  if (!song) return <div className="h-full" style={{ background: grad.to }} />;

  const modeIcon = playMode === 'shuffle' ? <IcShuffle size={22} /> : playMode === 'loop' ? <IcLoopOne size={22} /> : <IcOrder size={22} />;
  const curLine = Math.min(song.lyrics.length - 1, Math.floor(progress / (dur / song.lyrics.length)));

  const onHeart = () => {
    toggleHeart(song.id);
    if (!liked) showToast('已添加到我喜欢的音乐');
  };

  return (
    <div className="flex flex-col h-full" data-status-bar-foreground="light"
      style={{ background: `linear-gradient(180deg, ${grad.from}, ${grad.to})` }}>
      {toast}
      <div className="h-9 shrink-0" />
      {/* 顶栏 */}
      <div className="flex items-center h-11 px-2 text-white shrink-0">
        <button {...bindBack()} className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer text-white" aria-label="收起"><IcChevronDown size={26} /></button>
        <div className="flex-1 text-center min-w-0">
          {roamMode ? <span className="text-[13px]">为你推荐的相似歌曲</span> : <span className="text-[12px] opacity-80 truncate block">{playSource}</span>}
        </div>
        <button onClick={() => open('share', `song:${song.id}`)} className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer text-white" aria-label="分享"><IcShare size={20} /></button>
      </div>

      {/* 歌名 */}
      <div className="px-6 text-white shrink-0">
        <div className="text-[20px] font-semibold truncate">{song.title}</div>
        <button onClick={() => go('player.artist-open', { id: song.artistId })} className="text-[13px] opacity-80 bg-transparent border-none cursor-pointer p-0 text-white">{song.artist} ›</button>
      </div>

      {/* 封面/歌词 */}
      <div className="flex-1 flex items-center justify-center overflow-hidden px-8"
        {...bindTap({ kind: 'action', id: 'player.view.toggle' }, { onTrigger: () => setView((v) => (v === 'cover' ? 'lyrics' : 'cover')) })}
        role="button">
        {view === 'cover' ? (
          <div className="w-64 h-64 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.35)', animation: isPlaying ? 'spin 16s linear infinite' : 'none' }}>
            <div className="w-44 h-44 rounded-full" style={coverStyle(song.seed)} />
          </div>
        ) : (
          <div className="h-full w-full overflow-y-auto py-6 text-center" data-scroll-container="lyrics" data-scroll-direction="vertical">
            {song.lyrics.map((l, i) => (
              <div key={i} className="py-2 text-[15px]" style={{ color: i === curLine ? '#fff' : 'rgba(255,255,255,0.45)', fontWeight: i === curLine ? 600 : 400 }}
                {...bindTap({ kind: 'action', id: 'lyrics.line.seek' }, {
                  stopPropagation: true,
                  params: { line: i },
                  onTrigger: () => seekTo(Math.floor((i / song.lyrics.length) * dur)),
                })}>{l}</div>
            ))}
          </div>
        )}
      </div>

      {/* 计数行 */}
      <div className="flex items-center justify-end gap-4 px-6 text-white shrink-0 mb-2">
        <button {...bindTap({ kind: 'action', id: 'song.heart.toggle' }, {
          params: { songId: song.id },
          onTrigger: onHeart,
        })} className="flex items-center gap-1 bg-transparent border-none cursor-pointer text-white">
          <IcHeart size={22} fill={liked ? WY.primary : 'none'} style={{ color: liked ? WY.primary : '#fff' }} /><span className="text-[12px]">{song.likeW}</span>
        </button>
        <button onClick={() => go('player.comment-open', { id: song.id })} className="flex items-center gap-1 bg-transparent border-none cursor-pointer text-white">
          <IcComment size={22} /><span className="text-[12px]">{song.commentW}</span>
        </button>
        <button {...bindTap({ kind: 'action', id: 'songmenu.panel.open' }, {
          params: { songId: song.id },
          onTrigger: () => open('songmenu', song.id),
        })} className="bg-transparent border-none cursor-pointer text-white" aria-label="更多"><IcMore size={22} /></button>
      </div>

      {/* 进度条 */}
      <div className="flex items-center gap-2 px-6 text-white/80 text-[11px] shrink-0">
        <span>{fmtTime(progress)}</span>
        <input type="range" min={0} max={dur} value={progress}
          {...bindTap({ kind: 'action', id: 'player.progress.seek' }, { onTrigger: () => seekTo(progress) })}
          onChange={(e) => seekTo(Number(e.target.value))}
          className="flex-1" style={{ accentColor: '#fff' }} aria-label="进度" />
        <span>{fmtTime(dur)}</span>
      </div>
      <div className="text-center text-white/50 text-[11px] -mt-4 mb-1 pointer-events-none">{quality || '极高'}音质</div>

      {/* 控制行 */}
      <div className="flex items-center justify-between px-8 py-3 text-white shrink-0">
        <button {...bindTap({ kind: 'action', id: 'player.mode.cycle' }, { onTrigger: () => showToast(PLAY_MODE_LABEL[cyclePlayMode()]) })}
          className="bg-transparent border-none cursor-pointer text-white" aria-label="播放模式">{modeIcon}</button>
        <button {...bindTap({ kind: 'action', id: 'player.track.skip' }, { params: { direction: 'prev' }, onTrigger: prevSong })}
          className="bg-transparent border-none cursor-pointer text-white" aria-label="上一首"><IcPrev size={30} /></button>
        <button {...bindTap({ kind: 'action', id: 'player.play.toggle' }, { onTrigger: togglePlay })}
          className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center border-none cursor-pointer text-white" aria-label="播放/暂停">
          {isPlaying ? <IcPause size={30} /> : <IcPlay size={30} />}
        </button>
        <button {...bindTap({ kind: 'action', id: 'player.track.skip' }, { params: { direction: 'next' }, onTrigger: nextSong })}
          className="bg-transparent border-none cursor-pointer text-white" aria-label="下一首"><IcNext size={30} /></button>
        <button {...bindTap({ kind: 'action', id: 'queue.sheet.open' }, { onTrigger: () => open('queue') })}
          className="bg-transparent border-none cursor-pointer text-white" aria-label="播放列表"><IcQueue size={26} /></button>
      </div>

      {/* 底排小图标 */}
      <div className="flex items-center justify-around px-8 pb-4 text-white/85 shrink-0">
        <button {...bindTap({ kind: 'action', id: 'devices.sheet.open' }, { onTrigger: () => open('devices') })}
          className="bg-transparent border-none cursor-pointer text-white/85" aria-label="投设备"><IcCast size={20} /></button>
        <button {...bindTap('player.roam-enter', {
          onTrigger: () => { enterRoam(); showToast('已切换到相似歌曲'); },
        })} className="bg-transparent border-none cursor-pointer text-white/85" aria-label="相似歌曲"><IcBulb size={20} /></button>
        {view === 'lyrics' ? (
          <button {...bindTap('lyrics.wiki-open', { params: { id: song.id } })} className="bg-transparent border-none cursor-pointer text-white/85" aria-label="歌曲百科"><IcInfo size={20} /></button>
        ) : (
          <button {...bindTap('player.wiki-open', { params: { id: song.id } })} className="bg-transparent border-none cursor-pointer text-white/85" aria-label="歌曲百科"><IcInfo size={20} /></button>
        )}
        <button onClick={() => open('songmenu', song.id)} className="bg-transparent border-none cursor-pointer text-white/85" aria-label="更多"><IcMore size={20} /></button>
      </div>
    </div>
  );
}
