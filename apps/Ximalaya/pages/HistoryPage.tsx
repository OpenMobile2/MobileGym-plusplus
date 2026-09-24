import React, { useState } from 'react';
import * as TimeService from '@/os/TimeService';
import { useXimalayaGestures } from '../hooks/useXimalayaGestures';
import { useXimalayaStrings } from '../hooks/useXimalayaStrings';
import { useXimalayaStore } from '../state';
import { TopBar, Img, EmptyState, showToast, wontfix, formatDuration } from '../components/ui';
import { IcMore, IcClose } from '../res/icons';
import type { HistoryItem } from '../types';

const HIST_MENU = ['查看专辑', '收藏声音', '添加到听单', '分享', '删除'];

export function HistoryPage() {
  const { bindTap } = useXimalayaGestures();
  const s = useXimalayaStrings();
  const history = useXimalayaStore((st) => st.history);
  const albums = useXimalayaStore((st) => st.albums);
  const tracks = useXimalayaStore((st) => st.tracks);
  const playTrack = useXimalayaStore((st) => st.playTrack);
  const removeHistory = useXimalayaStore((st) => st.removeHistory);
  const toggleCollect = useXimalayaStore((st) => st.toggleCollect);

  const [tab, setTab] = useState<'play' | 'browse'>('play');
  const [menuTrack, setMenuTrack] = useState<string | null>(null);

  const filtered = history.filter((h) => h.kind === tab);
  const now = TimeService.now();
  const today = filtered.filter((h) => now - h.listenedAt < 86400000);
  const earlier = filtered.filter((h) => now - h.listenedAt >= 86400000);
  const menuItem = history.find((h) => h.trackId === menuTrack);
  const menuAlbum = menuItem && albums.find((a) => a.id === menuItem.albumId);

  const TABS: { label: string; val: 'play' | 'browse'; bind: React.HTMLAttributes<HTMLElement> }[] = [
    { label: '播放历史', val: 'play', bind: bindTap({ kind: 'action', id: 'history.tab.select.opt' }, { params: { tab: 'play' }, onTrigger: () => setTab('play') }) },
    { label: '浏览历史', val: 'browse', bind: bindTap({ kind: 'action', id: 'history.tab.select.opt' }, { params: { tab: 'browse' }, onTrigger: () => setTab('browse') }) },
  ];

  const renderRow = (h: HistoryItem) => {
    const album = albums.find((a) => a.id === h.albumId);
    const track = tracks.find((t) => t.id === h.trackId);
    if (!album || !track) return null;
    return (
      <div key={h.trackId} {...bindTap('history.player-open', { beforeTrigger: () => playTrack(h.albumId, h.trackId) })} className="bg-white rounded-xl p-2.5 flex items-center gap-3">
        <Img src={album.cover} className="w-14 h-14 rounded-lg object-cover shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-[14px] text-[#333] font-medium truncate">{track.title}</div>
          <div className="text-[12px] text-[#999] truncate mt-0.5">{album.title}</div>
          <div className="text-[11px] text-[#FE4543] mt-0.5">
            {h.remainSec > 0 ? `剩 ${Math.ceil(h.remainSec / 60)} 分钟` : `已听完 · ${formatDuration(track.durationSec)}`}
          </div>
        </div>
        <button
          {...bindTap({ kind: 'action', id: 'history.item.menu' }, { params: { trackId: h.trackId }, stopPropagation: true, onTrigger: () => setMenuTrack(h.trackId) })}
          aria-label="更多" className="w-8 h-8 flex items-center justify-center text-[#999]"
        ><IcMore size={20} /></button>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5] relative" data-status-bar-foreground="dark">
      <TopBar
        title={s.mine_history}
        right={<button {...bindTap('history.manage-open')} className="text-[14px] text-[#333] px-2">{s.manage}</button>}
      />

      {/* 双 Tab */}
      <div className="shrink-0 bg-white flex items-center gap-6 px-4 pb-2 text-[15px]">
        {TABS.map((t) => (
          <button key={t.val} {...t.bind} className={t.val === tab ? 'text-[#333] font-semibold border-b-2 border-[#FE4543] pb-1' : 'text-[#999] pb-1'}>{t.label}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
        {filtered.length === 0 ? (
          <EmptyState text={s.empty_history} />
        ) : (
          <div className="p-3 flex flex-col gap-3">
            {today.length > 0 && (
              <div>
                <div className="text-[13px] text-[#999] mb-2 px-1">今天</div>
                <div className="flex flex-col gap-2">{today.map(renderRow)}</div>
              </div>
            )}
            {earlier.length > 0 && (
              <div>
                <div className="text-[13px] text-[#999] mb-2 px-1">更早</div>
                <div className="flex flex-col gap-2">{earlier.map(renderRow)}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 历史项…菜单(本地态) */}
      {menuTrack && menuAlbum && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end" onClick={() => setMenuTrack(null)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white rounded-t-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#F5F5F5]">
              <Img src={menuAlbum.cover} className="w-10 h-10 rounded-lg object-cover" />
              <div className="flex-1 text-[14px] text-[#333] font-medium truncate">{menuAlbum.title}</div>
              <button onClick={() => setMenuTrack(null)} className="text-[#999]"><IcClose size={20} /></button>
            </div>
            {HIST_MENU.map((m) => (
              <button
                key={m}
                onClick={() => {
                  if (m === '删除') { removeHistory(menuTrack); showToast('已删除'); }
                  else if (m === '收藏声音') { toggleCollect(menuTrack); showToast('已收藏'); }
                  else wontfix();
                  setMenuTrack(null);
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
