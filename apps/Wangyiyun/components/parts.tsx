import React from 'react';
import { useLocation } from 'react-router-dom';
import { WY } from '../res/colors';
import { useWangyiyunStore } from '../state';
import { useWangyiyunGestures } from '../hooks/useWangyiyunGestures';
import { useSheets, SongRow } from './ui';
import { IcMenu, IcSearch, IcPlay } from '../res/icons';
import { HOME_TABS } from '../constants';
import type { TransitionId } from '../navigation.declaration';

/** 首页顶栏:汉堡 + 横滑 tab + 搜索 */
export function HomeTopTabs() {
  const location = useLocation();
  const { bindTap } = useWangyiyunGestures();
  const { open } = useSheets();
  return (
    <div className="flex items-center h-11 shrink-0 px-1">
      <button {...bindTap({ kind: 'action', id: 'drawer.panel.open' }, { onTrigger: () => open('drawer') })}
        className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer" style={{ color: WY.textPrimary }} aria-label="菜单">
        <IcMenu size={22} />
      </button>
      <div className="flex-1 flex items-center gap-4 overflow-x-auto px-1">
        {HOME_TABS.map((t) => {
          const active = location.pathname === t.route;
          const binding =
            t.key === 'heart' ? bindTap('hometabs.heart-open') :
            t.key === 'music' ? bindTap('hometabs.music-open') :
            t.key === 'podcast' ? bindTap('hometabs.podcast-open') :
            t.key === 'audiobook' ? bindTap('hometabs.audiobook-open') :
            bindTap('hometabs.rec-open');
          return (
            <button key={t.key} {...binding}
              className="bg-transparent border-none cursor-pointer whitespace-nowrap py-1"
              style={{ color: active ? WY.textPrimary : WY.textSecondary, fontSize: active ? 18 : 15, fontWeight: active ? 700 : 400 }}>
              {t.label}
            </button>
          );
        })}
      </div>
      <button {...bindTap('hometabs.search-open')} className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer" style={{ color: WY.textPrimary }} aria-label="搜索">
        <IcSearch size={20} />
      </button>
    </div>
  );
}

export function SectionTitle({ title, onMore }: { title: string; onMore?: () => void }) {
  return (
    <button onClick={onMore} disabled={!onMore}
      className="flex items-center w-full mt-4 mb-2 bg-transparent border-none cursor-pointer p-0 text-left">
      <span className="text-[16px] font-semibold" style={{ color: WY.textPrimary }}>{title}</span>
      {onMore && <span className="ml-1 text-[13px]" style={{ color: WY.textTertiary }}>›</span>}
    </button>
  );
}

type PlayAllId =
  | 'playlist.playall'
  | 'daily.playall'
  | 'album.playall'
  | 'artist.playall'
  | 'rank.playall'
  | 'liked.playall'
  | 'dailyhistory.playall';

/** 播放全部 + 歌曲列表(歌单/专辑/榜单/红心 复用;点行=整列表替换队列从该曲起播 qa:Q3) */
export function TrackList({ songIds, source, showIndex = false, playAllTransition = 'playlist.playall' }: {
  songIds: string[];
  source: string;
  showIndex?: boolean;
  playAllTransition?: PlayAllId;
}) {
  const songs = useWangyiyunStore((s) => s.songs);
  const playFrom = useWangyiyunStore((s) => s.playFrom);
  const { bindTap } = useWangyiyunGestures();
  const { open } = useSheets();
  const list = songIds.map((id) => songs.find((x) => x.id === id)).filter(Boolean) as NonNullable<ReturnType<typeof songs.find>>[];
  const beforeTrigger = () => {
    if (list[0]) playFrom(songIds, list[0].id, source);
  };
  const playAllBinding = (() => {
    const opts = { beforeTrigger };
    switch (playAllTransition as TransitionId) {
      case 'daily.playall': return bindTap('daily.playall', opts);
      case 'album.playall': return bindTap('album.playall', opts);
      case 'artist.playall': return bindTap('artist.playall', opts);
      case 'rank.playall': return bindTap('rank.playall', opts);
      case 'liked.playall': return bindTap('liked.playall', opts);
      case 'dailyhistory.playall': return bindTap('dailyhistory.playall', opts);
      default: return bindTap('playlist.playall', opts);
    }
  })();
  return (
    <div className="bg-white rounded-t-2xl px-3 pt-1">
      <button {...playAllBinding}
        className="flex items-center gap-2 w-full py-3 bg-transparent border-none cursor-pointer text-left">
        <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: WY.primary }}>
          <IcPlay size={18} className="text-white" />
        </span>
        <span className="text-[15px] font-semibold" style={{ color: WY.textPrimary }}>播放全部</span>
        <span className="text-[12px]" style={{ color: WY.textSecondary }}>{list.length}首</span>
      </button>
      {list.map((song, i) => (
        <SongRow key={song.id} song={song} index={showIndex ? i + 1 : undefined}
          onTap={() => playFrom(songIds, song.id, source)}
          binding={bindTap({ kind: 'action', id: 'play.song.fromlist' }, {
            params: { songId: song.id },
            onTrigger: () => playFrom(songIds, song.id, source),
          })}
          onMore={() => open('songmenu', song.id)}
          moreBinding={bindTap({ kind: 'action', id: 'songmenu.panel.open' }, {
            stopPropagation: true,
            params: { songId: song.id },
            onTrigger: () => open('songmenu', song.id),
          })} />
      ))}
      <div className="h-6" />
    </div>
  );
}
