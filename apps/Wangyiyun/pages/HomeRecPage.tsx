import React from 'react';
import { useWangyiyunStore } from '../state';
import { useWangyiyunGestures } from '../hooks/useWangyiyunGestures';
import { Screen, Cover, WY } from '../components/ui';
import { HomeTopTabs, SectionTitle } from '../components/parts';
import { IcPlay } from '../res/icons';

export default function HomeRecPage() {
  const { bindTap, go } = useWangyiyunGestures();
  const playlists = useWangyiyunStore((s) => s.playlists);
  const songs = useWangyiyunStore((s) => s.songs);
  const ranks = useWangyiyunStore((s) => s.ranks);
  const playSong = useWangyiyunStore((s) => s.playSong);
  const enterRoam = useWangyiyunStore((s) => s.enterRoam);

  const recPlaylists = playlists.filter((p) => !p.isLiked).slice(0, 3);
  const redHeart = songs.slice(10, 13);

  const bigCard = (title: string, sub: string, seed: string, binding: React.HTMLAttributes<HTMLButtonElement>) => (
    <button {...binding} className="flex-1 rounded-xl overflow-hidden bg-transparent border-none cursor-pointer p-0 text-left">
      <Cover seed={seed} className="h-32 rounded-xl relative">
        <div className="absolute inset-0 flex flex-col justify-end p-2">
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent rounded-xl" />
          <div className="text-white text-[13px] font-semibold">{title}</div>
          <div className="text-white/80 text-[10px] truncate">{sub}</div>
        </div>
      </Cover>
    </button>
  );

  return (
    <Screen>
      <HomeTopTabs />
      <div className="flex-1 overflow-y-auto px-3" data-scroll-container="home-feed" data-scroll-direction="vertical">
        {/* 三横卡 */}
        <div className="flex gap-2 mt-2">
          {bigCard('每日推荐', '符合你口味的新歌', 'cover1', bindTap('home.daily-open'))}
          {bigCard('私人雷达', '你爱的歌值得反复聆听', 'radar', bindTap('home.radar-open', { params: { id: 'pl_radar' } }))}
          {bigCard('心动模式', '红心歌曲和相似推荐', 'liked', bindTap('home.heart-open'))}
        </div>

        {/* 横滑功能卡 */}
        <div className="flex gap-2 mt-3 overflow-x-auto">
          <button {...bindTap('roam.start', { beforeTrigger: () => enterRoam() })}
            className="shrink-0 w-28 rounded-lg bg-white p-2 border-none cursor-pointer text-left">
            <div className="text-[13px] font-medium" style={{ color: WY.textPrimary }}>漫游</div>
            <div className="text-[10px] mt-0.5 truncate" style={{ color: WY.textSecondary }}>多样频道无限畅听</div>
          </button>
          <button {...bindTap('home.roam-open', { beforeTrigger: () => enterRoam() })}
            className="shrink-0 w-28 rounded-lg bg-white p-2 border-none cursor-pointer text-left">
            <div className="text-[13px] font-medium" style={{ color: WY.textPrimary }}>相似歌曲</div>
            <div className="text-[10px] mt-0.5 truncate" style={{ color: WY.textSecondary }}>从你喜欢的歌听起</div>
          </button>
          <button {...bindTap('home.playlist-open', { params: { id: 'pl_radar' } })}
            className="shrink-0 w-28 rounded-lg bg-white p-2 border-none cursor-pointer text-left">
            <div className="text-[13px] font-medium" style={{ color: WY.textPrimary }}>相似艺人</div>
            <div className="text-[10px] mt-0.5 truncate" style={{ color: WY.textSecondary }}>从你喜欢的艺人听起</div>
          </button>
          <button {...bindTap('home.podcastep-open', { params: { id: 'ep_002' } })}
            className="shrink-0 w-28 rounded-lg bg-white p-2 border-none cursor-pointer text-left">
            <div className="text-[13px] font-medium" style={{ color: WY.textPrimary }}>每日播客</div>
            <div className="text-[10px] mt-0.5 truncate" style={{ color: WY.textSecondary }}>vol.08</div>
          </button>
        </div>

        {/* 你的红心歌曲和相似推荐 */}
        <SectionTitle title="你的红心歌曲和相似推荐" />
        <div className="bg-white rounded-xl px-3">
          {redHeart.map((song) => (
            <div key={song.id} className="flex items-center gap-3 py-2.5 border-b last:border-b-0" style={{ borderColor: WY.divider }}
              {...bindTap({ kind: 'action', id: 'play.song.inline' }, {
                params: { songId: song.id },
                onTrigger: () => playSong(song.id, undefined, '你的红心歌曲和相似推荐'),
              })} role="button">
              <Cover seed={song.seed} className="w-10 h-10" />
              <div className="flex-1 min-w-0">
                <div className="text-[14px] truncate" style={{ color: WY.textPrimary }}>{song.title}</div>
                <div className="text-[11px] truncate" style={{ color: WY.textSecondary }}>{song.artist}</div>
              </div>
              <IcPlay size={22} style={{ color: WY.textTertiary }} />
            </div>
          ))}
        </div>

        {/* 推荐歌单 */}
        <SectionTitle title="推荐歌单" onMore={() => go('music.square-open')} />
        <div className="flex gap-3 overflow-x-auto">
          {recPlaylists.map((p) => (
            <button key={p.id} {...bindTap('home.playlist-open', { params: { id: p.id } })} className="shrink-0 w-28 bg-transparent border-none cursor-pointer p-0 text-left">
              <Cover seed={p.seed} className="w-28 h-28 rounded-lg relative">
                <span className="absolute top-1 right-1.5 text-white text-[10px]">▶ {p.playCount}</span>
              </Cover>
              <div className="text-[12px] mt-1 line-clamp-2" style={{ color: WY.textPrimary }}>{p.title}</div>
            </button>
          ))}
        </div>

        {/* 排行榜 */}
        <SectionTitle title="排行榜" onMore={() => go('home.rank-open')} />
        <div className="flex gap-3 overflow-x-auto pb-4">
          {ranks.map((r) => (
            <button key={r.id} onClick={() => go('rank.detail-open', { id: r.id })} className="shrink-0 w-40 bg-white rounded-lg p-2 border-none cursor-pointer text-left">
              <div className="text-[13px] font-semibold mb-1" style={{ color: WY.textPrimary }}>{r.name}</div>
              {r.songIds.slice(0, 3).map((sid, i) => {
                const song = songs.find((x) => x.id === sid);
                return <div key={sid} className="text-[11px] truncate" style={{ color: WY.textSecondary }}>{i + 1} {song?.title}</div>;
              })}
            </button>
          ))}
        </div>
      </div>
    </Screen>
  );
}
