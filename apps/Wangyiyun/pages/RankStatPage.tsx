import React from 'react';
import { useWangyiyunStore } from '../state';
import { TopBar, Screen, WY } from '../components/ui';

export default function RankStatPage() {
  const [tab, setTab] = React.useState<'week' | 'all'>('week');
  const songs = useWangyiyunStore((s) => s.songs);
  const list = tab === 'week' ? songs.slice(0, 10) : songs.slice(5, 15);
  return (
    <Screen>
      <TopBar title="听歌排行" />
      <div className="flex gap-5 px-4 py-2 text-[14px]">
        <button onClick={() => setTab('week')} className="bg-transparent border-none cursor-pointer p-0" style={{ color: tab === 'week' ? WY.primary : WY.textSecondary }}>最近一周</button>
        <button onClick={() => setTab('all')} className="bg-transparent border-none cursor-pointer p-0" style={{ color: tab === 'all' ? WY.primary : WY.textSecondary }}>所有时间</button>
      </div>
      <div className="flex-1 overflow-y-auto px-4">
        {list.map((s, i) => (
          <div key={s.id} className="flex items-center gap-3 py-2.5 border-b" style={{ borderColor: WY.divider }}>
            <span className="w-5 text-[15px]" style={{ color: i < 3 ? WY.primary : WY.textTertiary }}>{i + 1}</span>
            <div className="flex-1 min-w-0"><div className="text-[14px] truncate" style={{ color: WY.textPrimary }}>{s.title}</div><div className="text-[11px] truncate" style={{ color: WY.textSecondary }}>{s.artist}</div></div>
            <span className="text-[11px]" style={{ color: WY.textTertiary }}>{tab === 'week' ? (10 - i) : (30 - i * 2)}次</span>
          </div>
        ))}
      </div>
    </Screen>
  );
}
