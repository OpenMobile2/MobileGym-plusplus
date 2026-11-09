import React from 'react';
import { useWangyiyunStore } from '../state';
import { TopBar, Screen, coverBg, WY } from '../components/ui';
import { IcPlay } from '../res/icons';

export default function ArtistNewsPage() {
  const songs = useWangyiyunStore((s) => s.songs);
  const playSong = useWangyiyunStore((s) => s.playSong);
  return (
    <Screen>
      <TopBar title="音乐新动向" />
      <div className="flex-1 overflow-y-auto">
        <div className="text-[12px] px-4 py-2" style={{ color: WY.textSecondary }}>07·20</div>
        {songs.slice(0, 5).map((s) => (
          <div key={s.id} className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: WY.divider }}>
            <div className="w-10 h-10 rounded-full" style={{ background: coverBg(s.artistId) }} />
            <div className="flex-1 min-w-0"><div className="text-[13px]" style={{ color: WY.textPrimary }}>{s.artist} · 单曲上线</div><div className="text-[12px] truncate" style={{ color: WY.textSecondary }}>{s.title}</div></div>
            <button onClick={() => playSong(s.id, undefined, '音乐新动向')} className="bg-transparent border-none cursor-pointer" style={{ color: WY.textTertiary }} aria-label="播放"><IcPlay size={22} /></button>
          </div>
        ))}
      </div>
    </Screen>
  );
}
