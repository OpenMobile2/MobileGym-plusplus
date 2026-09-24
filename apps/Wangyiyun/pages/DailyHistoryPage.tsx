import React from 'react';
import { useWangyiyunStore } from '../state';
import { TopBar, Screen, WY } from '../components/ui';
import { TrackList } from '../components/parts';

const DATES = ['07-21', '07-07', '06-21'];
export default function DailyHistoryPage() {
  const [d, setD] = React.useState('07-21');
  const songs = useWangyiyunStore((s) => s.songs);
  const idx = DATES.indexOf(d);
  const ids = songs.slice(idx * 2, idx * 2 + 10).map((s) => s.id);
  return (
    <div className="flex flex-col h-full" data-status-bar-foreground="light" style={{ background: WY.pageBg }}>
      <div style={{ background: 'linear-gradient(180deg,#6E7C99,#F2F6F9)' }} className="shrink-0">
        <div className="h-10" />
        <TopBar dark title="历史日推" />
        <div className="text-white/80 text-[12px] px-4 pb-1">您已尊享查看60天内近5次历史日推的特权</div>
        <div className="flex gap-8 px-5 py-2">
          {DATES.map((x) => (
            <button key={x} onClick={() => setD(x)} className="bg-transparent border-none cursor-pointer text-[15px]"
              style={{ color: '#fff', fontWeight: d === x ? 700 : 400, borderBottom: d === x ? '2px solid #fff' : 'none' }}>{x}</button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto"><TrackList songIds={ids} source="历史日推" showIndex playAllTransition="dailyhistory.playall" /></div>
    </div>
  );
}
