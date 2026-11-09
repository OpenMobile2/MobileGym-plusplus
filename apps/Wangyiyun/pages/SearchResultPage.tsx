import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWangyiyunStore } from '../state';
import { useWangyiyunGestures } from '../hooks/useWangyiyunGestures';
import { TopBar, SongRow, Cover, useSheets, useToast, WY } from '../components/ui';
import { SEARCH_TABS } from '../constants';

export default function SearchResultPage() {
  const [sp] = useSearchParams();
  const q = sp.get('q') || '';
  const { bindTap } = useWangyiyunGestures();
  const { open } = useSheets();
  const [toast, showToast] = useToast();
  const [tab, setTab] = React.useState('单曲');
  const songs = useWangyiyunStore((s) => s.songs);
  const playlists = useWangyiyunStore((s) => s.playlists);
  const artists = useWangyiyunStore((s) => s.artists);
  const albums = useWangyiyunStore((s) => s.albums);
  const playFrom = useWangyiyunStore((s) => s.playFrom);

  const resultIds = songs.slice(0, 8).map((s) => s.id);

  return (
    <div className="flex flex-col h-full" style={{ background: WY.pageBg }} data-status-bar-foreground="dark">
      {toast}
      <TopBar title={q || '搜索结果'} />
      <div className="flex gap-4 px-4 py-2 overflow-x-auto text-[14px] shrink-0 bg-white">
        {SEARCH_TABS.map((t) => (
          <button key={t} {...bindTap({ kind: 'action', id: 'search.tab.select.target' }, {
            params: { target: t },
            onTrigger: () => setTab(t),
          })} className="bg-transparent border-none cursor-pointer p-0 whitespace-nowrap"
            style={{ color: tab === t ? WY.primary : WY.textSecondary, fontWeight: tab === t ? 600 : 400 }}>{t}</button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto" data-scroll-container="result-list" data-scroll-direction="vertical">
        {(tab === '单曲' || tab === '综合') && (
          <div className="bg-white px-3">
            {resultIds.map((sid) => {
              const song = songs.find((x) => x.id === sid)!;
              return <SongRow key={sid} song={song}
                binding={bindTap({ kind: 'action', id: 'play.song.fromsearch' }, {
                  params: { songId: sid },
                  onTrigger: () => playFrom(resultIds, sid, `搜索:${q}`),
                })}
                onMore={() => open('songmenu', sid)}
                moreBinding={bindTap({ kind: 'action', id: 'songmenu.panel.open' }, {
                  stopPropagation: true,
                  params: { songId: sid },
                  onTrigger: () => open('songmenu', sid),
                })} />;
            })}
          </div>
        )}
        {tab === '歌单' && (
          <div className="bg-white">
            {playlists.map((p) => (
              <button key={p.id} {...bindTap('search.playlist-open', { params: { id: p.id } })} className="flex items-center gap-3 w-full px-4 py-3 bg-transparent border-none border-b cursor-pointer text-left" style={{ borderColor: WY.divider }}>
                <Cover seed={p.seed} className="w-12 h-12 rounded-lg" />
                <div><div className="text-[14px]" style={{ color: WY.textPrimary }}>{p.title}</div><div className="text-[11px]" style={{ color: WY.textSecondary }}>{p.songIds.length}首 · {p.creator}</div></div>
              </button>
            ))}
          </div>
        )}
        {tab === '歌手' && (
          <div className="bg-white">
            {artists.map((a) => (
              <button key={a.id} {...bindTap('search.artist-open', { params: { id: a.id } })} className="flex items-center gap-3 w-full px-4 py-3 bg-transparent border-none border-b cursor-pointer text-left" style={{ borderColor: WY.divider }}>
                <Cover seed={a.seed} className="w-12 h-12 rounded-full" rounded={999} />
                <div className="text-[14px]" style={{ color: WY.textPrimary }}>{a.name} <span className="text-[11px]" style={{ color: WY.textSecondary }}>{a.fans}粉丝</span></div>
              </button>
            ))}
          </div>
        )}
        {tab === '专辑' && (
          <div className="bg-white">
            {albums.map((a) => (
              <button key={a.id} {...bindTap('search.album-open', { params: { id: a.id } })} className="flex items-center gap-3 w-full px-4 py-3 bg-transparent border-none border-b cursor-pointer text-left" style={{ borderColor: WY.divider }}>
                <Cover seed={a.seed} className="w-12 h-12 rounded-lg" />
                <div><div className="text-[14px]" style={{ color: WY.textPrimary }}>{a.title}</div><div className="text-[11px]" style={{ color: WY.textSecondary }}>{a.artist}</div></div>
              </button>
            ))}
          </div>
        )}
        {['笔记', '视频', '播客'].includes(tab) && (
          <div className="p-8 text-center text-[13px]" style={{ color: WY.textSecondary }}>{tab}结果</div>
        )}
      </div>
    </div>
  );
}
