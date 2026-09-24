import React from 'react';
import { useWangyiyunStore } from '../state';
import { useWangyiyunGestures } from '../hooks/useWangyiyunGestures';
import { TopBar, Screen, Cover, WY } from '../components/ui';

export default function RankMainPage() {
  const { go } = useWangyiyunGestures();
  const ranks = useWangyiyunStore((s) => s.ranks);
  const songs = useWangyiyunStore((s) => s.songs);
  const official = ranks.filter((r) => r.official);
  return (
    <Screen>
      <TopBar title="排行榜" />
      <div className="flex-1 overflow-y-auto px-3" data-scroll-container="rank-list" data-scroll-direction="vertical">
        <div className="text-[15px] font-semibold py-2" style={{ color: WY.textPrimary }}>官方榜</div>
        {official.map((r) => (
          <button key={r.id} onClick={() => go('rank.detail-open', { id: r.id })} className="flex gap-3 w-full bg-white rounded-xl p-2.5 mb-2 border-none cursor-pointer text-left">
            <Cover seed={r.seed} className="w-16 h-16" rounded={10} />
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-medium mb-0.5" style={{ color: WY.textPrimary }}>{r.name} <span className="text-[10px]" style={{ color: WY.textTertiary }}>{r.updateTime}</span></div>
              {r.songIds.slice(0, 3).map((sid, i) => {
                const s = songs.find((x) => x.id === sid);
                return <div key={sid} className="text-[11px] truncate" style={{ color: WY.textSecondary }}>{i + 1} {s?.title} - {s?.artist}</div>;
              })}
            </div>
          </button>
        ))}
        <div className="text-[15px] font-semibold py-2" style={{ color: WY.textPrimary }}>精选榜</div>
        <div className="grid grid-cols-3 gap-2 pb-4">
          {ranks.filter((r) => !r.official).map((r) => (
            <button key={r.id} onClick={() => go('rank.detail-open', { id: r.id })} className="bg-transparent border-none cursor-pointer p-0">
              <Cover seed={r.seed} className="w-full aspect-square" rounded={8} />
              <div className="text-[11px] mt-1 truncate" style={{ color: WY.textPrimary }}>{r.name}</div>
            </button>
          ))}
        </div>
      </div>
    </Screen>
  );
}
