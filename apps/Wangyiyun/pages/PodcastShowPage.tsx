import React from 'react';
import { useParams } from 'react-router-dom';
import { useWangyiyunStore } from '../state';
import { useWangyiyunGestures } from '../hooks/useWangyiyunGestures';
import { TopBar, Screen, Cover, useToast, fmtTime, WY } from '../components/ui';

export default function PodcastShowPage() {
  const { id = '' } = useParams();
  const { bindTap } = useWangyiyunGestures();
  const [toast, showToast] = useToast();
  const show = useWangyiyunStore((s) => s.podcasts.find((p) => p.id === id));
  const episodes = useWangyiyunStore((s) => s.episodes.filter((e) => e.showId === id));
  const subscribed = useWangyiyunStore((s) => s.subscribedShowIds.includes(id));
  const subscribe = useWangyiyunStore((s) => s.subscribePodcast);
  if (!show) return <Screen><div className="p-8 text-center" style={{ color: WY.textSecondary }}>播客不存在</div></Screen>;
  return (
    <Screen>
      <TopBar title="播客" />
      {toast}
      <div className="flex gap-3 px-4 py-3">
        <Cover seed={show.seed} className="w-20 h-20" />
        <div className="flex-1">
          <div className="text-[16px] font-semibold" style={{ color: WY.textPrimary }}>{show.title}</div>
          <div className="text-[12px] mt-1" style={{ color: WY.textSecondary }}>{show.host}</div>
          <button onClick={() => { subscribe(id); showToast(subscribed ? '已取消订阅' : '已订阅'); }} className="mt-2 px-3 py-1 rounded-full text-[12px] border cursor-pointer" style={{ borderColor: WY.primary, background: subscribed ? 'transparent' : WY.primary, color: subscribed ? WY.primary : '#fff' }}>{subscribed ? '已订阅' : '订阅播客'}</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {episodes.map((e) => (
          <button key={e.id} {...bindTap('show.episode-open', { params: { id: e.id } })} className="flex gap-3 w-full px-4 py-3 bg-transparent border-none border-b cursor-pointer text-left" style={{ borderColor: WY.divider }}>
            <Cover seed={e.seed} className="w-12 h-12 shrink-0" />
            <div className="flex-1 min-w-0"><div className="text-[14px] line-clamp-2" style={{ color: WY.textPrimary }}>{e.title}</div><div className="text-[11px] mt-1" style={{ color: WY.textSecondary }}>{fmtTime(e.durationSec)}</div></div>
          </button>
        ))}
      </div>
    </Screen>
  );
}
