import React from 'react';
import { useWangyiyunStore } from '../state';
import { TopBar, Screen, WY } from '../components/ui';
import { TrackList } from '../components/parts';

const TABS = ['歌曲', '声音', '有声书', '直播'];
export default function RecentPage() {
  const [tab, setTab] = React.useState('歌曲');
  const history = useWangyiyunStore((s) => s.historyQueue);
  const songs = useWangyiyunStore((s) => s.songs);
  const ids = history.length ? history : songs.slice(0, 6).map((s) => s.id);
  return (
    <Screen>
      <TopBar title="最近播放" right={<span className="text-[11px]" style={{ color: WY.textSecondary }}>3台设备</span>} />
      <div className="flex gap-4 px-4 py-2 text-[14px]">
        {TABS.map((t) => <button key={t} onClick={() => setTab(t)} className="bg-transparent border-none cursor-pointer p-0" style={{ color: tab === t ? WY.primary : WY.textSecondary }}>{t}</button>)}
      </div>
      <div className="flex-1 overflow-y-auto">
        {tab === '歌曲' ? <TrackList songIds={ids} source="最近播放" /> : <div className="p-10 text-center text-[13px]" style={{ color: WY.textSecondary }}>{tab}列表</div>}
      </div>
    </Screen>
  );
}
