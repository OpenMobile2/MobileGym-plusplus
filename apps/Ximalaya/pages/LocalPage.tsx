import React, { useState } from 'react';
import { useXimalayaGestures } from '../hooks/useXimalayaGestures';
import { useXimalayaStrings } from '../hooks/useXimalayaStrings';
import { useXimalayaStore } from '../state';
import { TopBar, Img, EmptyState, showToast, wontfix } from '../components/ui';
import { IcMore, IcClose, IcPlay } from '../res/icons';

const LOCAL_MENU = ['查看专辑', '播放', '管理下载', '排序', '删除'];

export function LocalPage() {
  const { bindTap } = useXimalayaGestures();
  const s = useXimalayaStrings();
  const local = useXimalayaStore((st) => st.local);
  const albums = useXimalayaStore((st) => st.albums);
  const playTrack = useXimalayaStore((st) => st.playTrack);

  const [tab, setTab] = useState<'album' | 'sound' | 'video' | 'book'>('album');
  const [autoClean, setAutoClean] = useState(false);
  const [menuAlbum, setMenuAlbum] = useState<string | null>(null);

  const list = local.filter((l) => l.kind === tab);
  const usedMB = local.reduce((sum, l) => sum + l.sizeMB, 0);
  const menuAlbumObj = albums.find((a) => a.id === menuAlbum);

  const TABS = [
    { label: '专辑', k: 'album' as const, bind: bindTap({ kind: 'action', id: 'local.tab.select.opt' }, { params: { tab: 'album' }, onTrigger: () => setTab('album') }) },
    { label: '声音', k: 'sound' as const, bind: bindTap({ kind: 'action', id: 'local.tab.select.opt' }, { params: { tab: 'sound' }, onTrigger: () => setTab('sound') }) },
    { label: '视频', k: 'video' as const, bind: bindTap({ kind: 'action', id: 'local.tab.select.opt' }, { params: { tab: 'video' }, onTrigger: () => setTab('video') }) },
    { label: '书籍', k: 'book' as const, bind: bindTap({ kind: 'action', id: 'local.tab.select.opt' }, { params: { tab: 'book' }, onTrigger: () => setTab('book') }) },
  ];

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5] relative" data-status-bar-foreground="dark">
      <TopBar title={s.mine_local} />

      {/* Tab */}
      <div className="shrink-0 bg-white flex items-center gap-6 px-4 pb-2 text-[15px]">
        {TABS.map((t) => (
          <button key={t.k} {...t.bind} className={t.k === tab ? 'text-[#333] font-semibold border-b-2 border-[#FE4543] pb-1' : 'text-[#999] pb-1'}>{t.label}</button>
        ))}
      </div>

      {/* 容量 + 自动清理 */}
      <div className="shrink-0 bg-white border-t border-[#F5F5F5] flex items-center justify-between px-4 py-2.5">
        <span className="text-[12px] text-[#999]">已占用 {usedMB.toFixed(1)} MB</span>
        <button
          {...bindTap({ kind: 'action', id: 'local.autoclean.toggle' }, { onTrigger: () => setAutoClean((v) => !v) })}
          className="flex items-center gap-2 text-[12px] text-[#666]"
        >
          自动清理完播
          <span className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors ${autoClean ? 'bg-[#FE4543] justify-end' : 'bg-[#DDD] justify-start'}`}>
            <span className="w-4 h-4 rounded-full bg-white" />
          </span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
        {list.length === 0 ? (
          <EmptyState text={s.empty_local} />
        ) : (
          <div className="p-3 flex flex-col gap-2">
            {list.map((l) => {
              const album = albums.find((a) => a.id === l.albumId);
              if (!album) return null;
              return (
                <div key={l.albumId} {...bindTap('local.player-open', { beforeTrigger: () => playTrack(album.id, album.trackIds[0]) })} className="bg-white rounded-xl p-2.5 flex items-center gap-3">
                  <Img src={album.cover} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] text-[#333] font-medium truncate">{album.title}</div>
                    <div className="text-[12px] text-[#999] mt-0.5">已下载 {l.downloadedCount}/{l.totalCount} 集 · {l.sizeMB.toFixed(1)} MB</div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#FFF0EF] flex items-center justify-center text-[#FE4543] shrink-0"><IcPlay size={16} /></div>
                  <button
                    {...bindTap({ kind: 'action', id: 'local.item.menu' }, { params: { albumId: l.albumId }, stopPropagation: true, onTrigger: () => setMenuAlbum(l.albumId) })}
                    aria-label="更多" className="w-8 h-8 flex items-center justify-center text-[#999] shrink-0"
                  ><IcMore size={20} /></button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 本地项…菜单(本地态) */}
      {menuAlbum && menuAlbumObj && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end" onClick={() => setMenuAlbum(null)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white rounded-t-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#F5F5F5]">
              <Img src={menuAlbumObj.cover} className="w-10 h-10 rounded-lg object-cover" />
              <div className="flex-1 text-[14px] text-[#333] font-medium truncate">{menuAlbumObj.title}</div>
              <button onClick={() => setMenuAlbum(null)} className="text-[#999]"><IcClose size={20} /></button>
            </div>
            {LOCAL_MENU.map((m) => (
              <button
                key={m}
                onClick={() => {
                  if (m === '删除') showToast('已删除本地下载');
                  else wontfix();
                  setMenuAlbum(null);
                }}
                className={`w-full text-left px-4 py-3.5 text-[15px] border-b border-[#F5F5F5] last:border-0 ${m === '删除' ? 'text-[#FE4543]' : 'text-[#333]'}`}
              >{m}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
