import React from 'react';
import { useWangyiyunStore } from '../state';
import { TopBar, Screen, Cover, WY } from '../components/ui';
import { TrackList } from '../components/parts';

export default function LikedPage() {
  const liked = useWangyiyunStore((s) => s.playlists.find((p) => p.isLiked));
  if (!liked) return <Screen><div className="p-8 text-center" style={{ color: WY.textSecondary }}>还没有喜欢的音乐</div></Screen>;
  return (
    <Screen>
      <TopBar title="我喜欢的音乐" />
      <div className="flex items-center gap-3 px-4 py-3">
        <Cover seed={liked.seed} className="w-20 h-20" rounded={10} />
        <div>
          <div className="text-[16px] font-semibold" style={{ color: WY.textPrimary }}>我喜欢的音乐</div>
          <div className="text-[12px] mt-1" style={{ color: WY.textSecondary }}>{liked.playCount}播放</div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto" data-scroll-container="liked-list" data-scroll-direction="vertical">
        <TrackList songIds={liked.songIds} source="我喜欢的音乐" showIndex playAllTransition="liked.playall" />
      </div>
    </Screen>
  );
}
