import React from 'react';
import { useParams } from 'react-router-dom';
import { useWangyiyunStore } from '../state';
import { useWangyiyunGestures } from '../hooks/useWangyiyunGestures';
import { TopBar, Screen, coverBg, WY } from '../components/ui';

export default function ProfileOtherPage() {
  const { id = '' } = useParams();
  const { bindTap } = useWangyiyunGestures();
  const [followed, setFollowed] = React.useState(false);
  const playlists = useWangyiyunStore((s) => s.playlists.filter((p) => !p.isLiked));
  return (
    <Screen>
      <TopBar title="个人主页" />
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-14 h-14 rounded-full" style={{ background: coverBg(id) }} />
        <div className="flex-1"><div className="text-[16px] font-semibold" style={{ color: WY.textPrimary }}>{id}</div><div className="text-[12px]" style={{ color: WY.textSecondary }}>12关注 · 88粉丝</div></div>
        <button onClick={() => setFollowed((f) => !f)} className="px-4 py-1.5 rounded-full text-[13px] border cursor-pointer" style={{ borderColor: WY.primary, background: followed ? 'transparent' : WY.primary, color: followed ? WY.primary : '#fff' }}>{followed ? '已关注' : '关注'}</button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {playlists.map((p) => (
          <button key={p.id} {...bindTap('user.playlist-open', { params: { id: p.id } })} className="flex items-center gap-3 w-full px-4 py-3 bg-transparent border-none border-b cursor-pointer text-left" style={{ borderColor: WY.divider }}>
            <div className="w-12 h-12 rounded-lg" style={{ background: coverBg(p.seed) }} />
            <div className="text-[14px]" style={{ color: WY.textPrimary }}>{p.title}</div>
          </button>
        ))}
      </div>
    </Screen>
  );
}
