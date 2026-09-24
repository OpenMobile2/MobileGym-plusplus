import React from 'react';
import { useWangyiyunStore } from '../state';
import { useWangyiyunGestures } from '../hooks/useWangyiyunGestures';
import { TopBar, Screen, coverBg, WY } from '../components/ui';

const REGIONS = ['华语', '欧美', '日本', '韩国', '其他'];
export default function BrowseArtistsPage() {
  const { bindTap, go } = useWangyiyunGestures();
  const [region, setRegion] = React.useState('华语');
  const artists = useWangyiyunStore((s) => s.artists);
  const toggleFollow = useWangyiyunStore((s) => s.toggleFollowArtist);
  return (
    <Screen>
      <TopBar title="歌手分类" />
      <div className="flex gap-4 px-4 py-2 text-[13px] shrink-0">
        {REGIONS.map((r) => <button key={r} onClick={() => setRegion(r)} className="bg-transparent border-none cursor-pointer p-0" style={{ color: region === r ? WY.primary : WY.textSecondary }}>{r}</button>)}
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="text-[13px] px-4 py-2" style={{ color: WY.textSecondary }}>热门歌手</div>
        {artists.map((a) => (
          <div key={a.id} className="flex items-center gap-3 px-4 py-2.5 border-b" style={{ borderColor: WY.divider }}>
            <button {...bindTap('browseartists.artist-open', { params: { id: a.id } })} className="flex items-center gap-3 flex-1 bg-transparent border-none cursor-pointer text-left">
              <div className="w-11 h-11 rounded-full" style={{ background: coverBg(a.seed) }} /><span className="text-[15px]" style={{ color: WY.textPrimary }}>{a.name}</span>
            </button>
            <button onClick={() => toggleFollow(a.id)} className="px-3 py-1 rounded-full text-[12px] border cursor-pointer" style={{ borderColor: a.followed ? WY.textTertiary : WY.primary, color: a.followed ? WY.textTertiary : WY.primary, background: 'transparent' }}>{a.followed ? '已关注' : '+ 关注'}</button>
          </div>
        ))}
      </div>
    </Screen>
  );
}
