import React from 'react';
import { useWangyiyunStore } from '../state';
import { useWangyiyunGestures } from '../hooks/useWangyiyunGestures';
import { useToast, WY, NOT_OPEN } from '../components/ui';
import { TrackList } from '../components/parts';
import { IcBack } from '../res/icons';

export default function DailyRecPage() {
  const { bindTap, bindBack, go } = useWangyiyunGestures();
  const [toast, showToast] = useToast();
  const [tab, setTab] = React.useState<'default' | 'style'>('default');
  const songs = useWangyiyunStore((s) => s.songs);
  const ids = songs.slice(0, 12).map((s) => s.id);

  return (
    <div className="flex flex-col h-full" data-status-bar-foreground="light" style={{ background: WY.pageBg }}>
      {toast}
      <div className="shrink-0" style={{ background: `linear-gradient(180deg, ${WY.dailyFrom}, ${WY.pageBg})` }}>
        <div className="h-10" />
        <div className="flex items-center h-11 px-1 text-white">
          <button {...bindBack()} className="w-10 h-10 flex items-center justify-center bg-transparent border-none cursor-pointer text-white" aria-label="返回"><IcBack size={22} /></button>
          <div className="flex gap-2">
            {(['default', 'style'] as const).map((t) => (
              <button key={t} {...bindTap({ kind: 'action', id: 'daily.style.select.target' }, {
                params: { target: t },
                onTrigger: () => setTab(t),
              })} className="px-3 py-1 rounded-full text-[13px] border-none cursor-pointer"
                style={{ background: tab === t ? 'rgba(255,255,255,0.4)' : 'transparent', color: '#fff' }}>{t === 'default' ? '默认推荐' : '风格推荐'}</button>
            ))}
          </div>
        </div>
        <div className="px-5 py-2 text-white">
          <div className="text-[26px] font-bold">21<span className="text-[15px]">/07</span></div>
          <div className="flex gap-4 mt-1 text-[12px] opacity-90">
            <button onClick={() => showToast(NOT_OPEN)} className="bg-transparent border-none cursor-pointer text-white">查看今日运势 ›</button>
            <button onClick={() => go('daily.history-open')} className="bg-transparent border-none cursor-pointer text-white">历史日推 VIP</button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto -mt-2" data-scroll-container="daily-list" data-scroll-direction="vertical">
        <TrackList songIds={ids} source="每日推荐" showIndex playAllTransition="daily.playall" />
      </div>
    </div>
  );
}
