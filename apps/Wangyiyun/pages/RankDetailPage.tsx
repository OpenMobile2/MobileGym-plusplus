import React from 'react';
import { useParams } from 'react-router-dom';
import { useWangyiyunStore } from '../state';
import { TopBar, Cover, useToast, WY } from '../components/ui';
import { TrackList } from '../components/parts';
import { playerGradient } from '../res/colors';

export default function RankDetailPage() {
  const { id = '' } = useParams();
  const rank = useWangyiyunStore((s) => s.ranks.find((r) => r.id === id));
  const [toast] = useToast();
  if (!rank) return <div className="h-full flex items-center justify-center" style={{ background: WY.pageBg }}>榜单不存在</div>;
  const grad = playerGradient(rank.seed);
  return (
    <div className="flex flex-col h-full" data-status-bar-foreground="light" style={{ background: WY.pageBg }}>
      {toast}
      <div style={{ background: `linear-gradient(180deg, ${grad.from}, ${grad.to})` }} className="shrink-0">
        <div className="h-10" />
        <TopBar dark />
        <div className="flex gap-3 px-4 pb-4 text-white">
          <Cover seed={rank.seed} className="w-24 h-24" rounded={10} />
          <div className="flex-1">
            <div className="text-[18px] font-bold">{rank.name}</div>
            <div className="text-[12px] opacity-80 mt-1">▶ {rank.playW}</div>
            <div className="text-[11px] opacity-70 mt-2 line-clamp-2">{rank.desc}</div>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto -mt-3" data-scroll-container="rank-detail" data-scroll-direction="vertical">
        <TrackList songIds={rank.songIds} source={`榜单:${rank.name}`} showIndex />
      </div>
    </div>
  );
}
