import React from 'react';
import { useWangyiyunStore } from '../state';
import { useWangyiyunGestures } from '../hooks/useWangyiyunGestures';
import { Screen, coverBg, useToast, WY, NOT_OPEN } from '../components/ui';
import { HomeTopTabs } from '../components/parts';

export default function PodcastHomePage() {
  const { bindTap, go } = useWangyiyunGestures();
  const [toast, showToast] = useToast();
  const episodes = useWangyiyunStore((s) => s.episodes);
  return (
    <Screen>
      <HomeTopTabs />
      <div className="flex-1 overflow-y-auto px-3">
        <div className="flex gap-3 py-2">
          <button {...bindTap('podcast.mysubs-open')} className="text-[12px] px-3 py-1.5 rounded-full bg-white border-none cursor-pointer" style={{ color: WY.textPrimary }}>我的播客</button>
          <button {...bindTap('podcast.category-open')} className="text-[12px] px-3 py-1.5 rounded-full bg-white border-none cursor-pointer" style={{ color: WY.textPrimary }}>全部分类</button>
          <button {...bindTap('podcast.ranks-open')} className="text-[12px] px-3 py-1.5 rounded-full bg-white border-none cursor-pointer" style={{ color: WY.textPrimary }}>榜单</button>
        </div>
        <div className="text-[15px] font-semibold py-2" style={{ color: WY.textPrimary }}>为你推荐</div>
        {episodes.map((e) => (
          <button key={e.id} onClick={() => go('podcast.episode-open', { id: e.id })} className="flex gap-3 w-full bg-white rounded-xl p-2.5 mb-2 border-none cursor-pointer text-left">
            <div className="w-14 h-14 rounded-lg shrink-0" style={{ background: coverBg(e.seed) }} />
            <div className="flex-1 min-w-0"><div className="text-[14px] line-clamp-2" style={{ color: WY.textPrimary }}>{e.title}</div><div className="text-[11px] mt-1" style={{ color: WY.textSecondary }}>{e.showTitle}</div></div>
          </button>
        ))}
        <button onClick={() => go('podcast.more-open')} className="w-full text-center py-3 text-[13px] bg-transparent border-none cursor-pointer" style={{ color: WY.textSecondary }}>探索更多 全部榜单 ›</button>
      </div>
    </Screen>
  );
}
