import React from 'react';
import { useWangyiyunStore } from '../state';
import { useWangyiyunGestures } from '../hooks/useWangyiyunGestures';
import { useSheets, useToast, Cover, WY, NOT_OPEN } from '../components/ui';
import { MINE_FILTERS } from '../constants';
import { IcPlus, IcChevronRight } from '../res/icons';

export default function MinePage() {
  const { bindTap, go } = useWangyiyunGestures();
  const { open } = useSheets();
  const [toast, showToast] = useToast();
  const [filter, setFilter] = React.useState('近期');
  const session = useWangyiyunStore((s) => s.session);
  const playlists = useWangyiyunStore((s) => s.playlists);
  const albums = useWangyiyunStore((s) => s.albums);
  const collectedPl = useWangyiyunStore((s) => s.collectedPlaylistIds);
  const collectedAlbums = useWangyiyunStore((s) => s.collectedAlbumIds);

  const created = playlists.filter((p) => p.mine);
  const collected = playlists.filter((p) => collectedPl.includes(p.id) && !p.mine);
  const liked = playlists.find((p) => p.isLiked);
  const albumList = albums.filter((a) => collectedAlbums.includes(a.id));

  return (
    <div className="flex flex-col h-full" data-status-bar-foreground="light">
      <div className="shrink-0 pb-3" style={{ background: `linear-gradient(180deg, #4A4A52, ${WY.pageBg})` }}>
        <div className="h-10" />
        <div className="flex items-center gap-3 px-4">
          <Cover seed={session.seed} className="w-16 h-16 border-2 border-white/60" rounded={32} />
          <div className="flex-1 text-white">
            <div className="text-[17px] font-semibold">{session.nick} <span className="text-[10px] px-1 rounded" style={{ background: WY.vipGold }}>{session.vip}</span></div>
            <div className="text-[12px] opacity-85 mt-1">{session.follows}关注 {session.fans}粉丝 Lv.{session.level} {session.hours}小时</div>
          </div>
          <button onClick={() => go('mine.privacy-open')} className="text-white bg-transparent border-none cursor-pointer text-[13px]">···</button>
        </div>
        <div className="flex gap-2 px-4 mt-3">
          {['最近', '本地', '会员', '装扮'].map((q) => (
            <button key={q} onClick={() => q === '最近' ? go('mine.recent-open') : showToast(NOT_OPEN)}
              className="flex-1 py-2 rounded-full bg-white/20 text-white text-[12px] border-none cursor-pointer">{q}</button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white" data-scroll-container="mine-list" data-scroll-direction="vertical">
        <div className="flex gap-4 px-4 py-2 text-[13px] border-b sticky top-0 bg-white z-10" style={{ borderColor: WY.divider }}>
          {MINE_FILTERS.map((f) => (
            <button key={f} {...bindTap({ kind: 'action', id: 'mine.filter.select.target' }, {
              params: { target: f },
              onTrigger: () => setFilter(f),
            })} className="bg-transparent border-none cursor-pointer p-0"
              style={{ color: filter === f ? WY.primary : WY.textSecondary }}>
              {f}{f === '创建' ? created.length : f === '收藏' ? collected.length : f === '专辑' ? albumList.length : ''}
            </button>
          ))}
        </div>
        {toast}
        {filter !== '专辑' && liked && (
          <button {...bindTap('mine.liked-open')} className="flex items-center gap-3 w-full px-4 py-3 bg-transparent border-none cursor-pointer text-left">
            <Cover seed={liked.seed} className="w-12 h-12" />
            <div className="flex-1 min-w-0">
              <div className="text-[15px]" style={{ color: WY.textPrimary }}>我喜欢的音乐</div>
              <div className="text-[11px]" style={{ color: WY.textSecondary }}>{liked.songIds.length}首 · {liked.playCount}播放</div>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full border" style={{ color: WY.primary, borderColor: WY.primary }}>心动模式</span>
          </button>
        )}
        {filter === '专辑' ? albumList.map((a) => (
          <button key={a.id} onClick={() => go('mine.album-open', { id: a.id })} className="flex items-center gap-3 w-full px-4 py-3 bg-transparent border-none cursor-pointer text-left">
            <Cover seed={a.seed} className="w-12 h-12" />
            <div className="flex-1 min-w-0">
              <div className="text-[14px] truncate" style={{ color: WY.textPrimary }}>{a.title}</div>
              <div className="text-[11px] truncate" style={{ color: WY.textSecondary }}>专辑 · {a.songIds.length}首 · {a.artist}</div>
            </div>
          </button>
        )) : (filter === '创建' ? created : filter === '收藏' ? collected : playlists)
          .filter((p) => !p.isLiked)
          .map((p) => (
            <button key={p.id} onClick={() => go('mine.playlist-open', { id: p.id })} className="flex items-center gap-3 w-full px-4 py-3 bg-transparent border-none cursor-pointer text-left">
              <Cover seed={p.seed} className="w-12 h-12" />
              <div className="flex-1 min-w-0">
                <div className="text-[14px] truncate" style={{ color: WY.textPrimary }}>{p.title}</div>
                <div className="text-[11px] truncate" style={{ color: WY.textSecondary }}>歌单 · {p.songIds.length}首 · {p.creator}</div>
              </div>
            </button>
          ))}
        {filter !== '专辑' && (
          <>
            <button onClick={() => go('mine.rankstat-open')} className="flex items-center w-full px-4 py-3 bg-transparent border-none cursor-pointer text-left">
              <span className="flex-1 text-[14px]" style={{ color: WY.textPrimary }}>听歌排行 <span style={{ color: WY.textSecondary }}>累计听歌918首</span></span>
              <IcChevronRight size={16} style={{ color: WY.textTertiary }} />
            </button>
            <button {...bindTap({ kind: 'action', id: 'playlist.create.open' }, { onTrigger: () => open('create') })}
              className="flex items-center gap-2 w-full px-4 py-3 bg-transparent border-none cursor-pointer text-left">
              <IcPlus size={18} style={{ color: WY.textPrimary }} /><span className="text-[14px]" style={{ color: WY.textPrimary }}>新建歌单</span>
            </button>
          </>
        )}
        <div className="text-center text-[11px] py-4" style={{ color: WY.textTertiary }}>展示创建/收藏的内容,该列表仅自己可见</div>
      </div>
    </div>
  );
}
