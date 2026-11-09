import React from 'react';
import { useWangyiyunStore } from '../state';
import { TopBar, Screen, WY } from '../components/ui';
import { TrackList } from '../components/parts';

const CATS = ['流行', '嘻哈说唱', '电子', 'R&B', '国风', '摇滚', '民谣', '古典'];
export default function BrowseStylesPage() {
  const [cat, setCat] = React.useState('流行');
  const [detail, setDetail] = React.useState<string | null>(null);
  const songs = useWangyiyunStore((s) => s.songs);
  if (detail) {
    return (
      <Screen>
        <TopBar title={detail} onBack={() => setDetail(null)} />
        <div className="flex-1 overflow-y-auto"><TrackList songIds={songs.slice(0, 8).map((s) => s.id)} source={`曲风:${detail}`} showIndex /></div>
      </Screen>
    );
  }
  return (
    <Screen>
      <TopBar title="曲风分类" />
      <div className="flex-1 flex overflow-hidden">
        <div className="w-24 shrink-0 overflow-y-auto bg-white">
          {CATS.map((c) => <button key={c} onClick={() => setCat(c)} className="block w-full py-3 text-[13px] border-none cursor-pointer text-left px-3" style={{ background: cat === c ? WY.pageBg : '#fff', color: cat === c ? WY.primary : WY.textPrimary }}>{c}</button>)}
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {['原声带', '电影原声', '电视剧原声', '综艺原声', cat + '流行'].map((s) => (
            <button key={s} onClick={() => setDetail(s)} className="block w-full py-3 text-[14px] border-b bg-transparent border-none cursor-pointer text-left" style={{ color: WY.textPrimary, borderColor: WY.divider }}>{s} ›</button>
          ))}
        </div>
      </div>
    </Screen>
  );
}
