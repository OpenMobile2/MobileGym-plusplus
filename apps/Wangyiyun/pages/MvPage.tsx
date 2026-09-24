import React from 'react';
import { useParams } from 'react-router-dom';
import { useWangyiyunStore } from '../state';
import { TopBar, coverBg, useToast, WY } from '../components/ui';
import { IcHeart, IcPlay, IcPause } from '../res/icons';

export default function MvPage() {
  const { id = '' } = useParams();
  const [toast, showToast] = useToast();
  const [playing, setPlaying] = React.useState(true);
  const [liked, setLiked] = React.useState(false);
  const song = useWangyiyunStore((s) => s.songs.find((x) => x.id === id));
  return (
    <div className="flex flex-col h-full bg-black" data-status-bar-foreground="light">
      <div className="h-10" /><TopBar dark title="MV" />
      <div className="flex-1 relative flex items-center justify-center" onClick={() => setPlaying((p) => !p)} role="button">
        <div className="absolute inset-0" style={{ background: coverBg(song?.seed || 'mv') }} />
        {!playing && <div className="relative z-10 w-16 h-16 rounded-full bg-black/40 flex items-center justify-center"><IcPlay size={32} className="text-white" /></div>}
        <div className="absolute right-3 bottom-20 z-10 flex flex-col gap-4 items-center text-white">
          <button onClick={(e) => { e.stopPropagation(); setLiked((l) => !l); }} className="bg-transparent border-none cursor-pointer text-white flex flex-col items-center"><IcHeart size={26} fill={liked ? WY.primary : 'none'} style={{ color: liked ? WY.primary : '#fff' }} /><span className="text-[11px]">{liked ? '1692' : '1691'}</span></button>
        </div>
        <div className="absolute left-3 bottom-6 z-10 text-white text-[13px]">{song?.artist} · MV 《{song?.title}》</div>
      </div>
      {toast}
    </div>
  );
}
