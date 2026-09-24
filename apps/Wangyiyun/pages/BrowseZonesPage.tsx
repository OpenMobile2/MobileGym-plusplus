import React from 'react';
import { useWangyiyunStore } from '../state';
import { useWangyiyunGestures } from '../hooks/useWangyiyunGestures';
import { TopBar, Screen, coverBg, WY } from '../components/ui';

const ZONES = ['K-Pop专区', '粤语专区', '驾车专区', '华语专区', '情歌专区', '游戏专区', '放松专区', '跑步专区', '蓝调专区', '乐器专区', '拉丁专区', '日本音乐'];
export default function BrowseZonesPage() {
  const { bindTap, go } = useWangyiyunGestures();
  const [detail, setDetail] = React.useState<string | null>(null);
  const playlists = useWangyiyunStore((s) => s.playlists);
  if (detail) {
    return (
      <Screen>
        <TopBar title={detail} onBack={() => setDetail(null)} />
        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-3">
          {playlists.map((p) => (
            <button key={p.id} {...bindTap('browsezones.playlist-open', { params: { id: p.id } })} className="bg-transparent border-none cursor-pointer p-0 text-left">
              <div className="w-full aspect-video rounded-lg" style={{ background: coverBg(p.seed + detail) }} /><div className="text-[12px] mt-1 line-clamp-1" style={{ color: WY.textPrimary }}>{p.title}</div>
            </button>
          ))}
        </div>
      </Screen>
    );
  }
  return (
    <Screen>
      <TopBar title="音乐专区" />
      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2.5">
        {ZONES.map((z) => (
          <button key={z} onClick={() => setDetail(z)} className="h-16 rounded-xl flex items-center px-3 text-white text-[14px] font-medium border-none cursor-pointer" style={{ background: coverBg(z) }}>{z}</button>
        ))}
      </div>
    </Screen>
  );
}
