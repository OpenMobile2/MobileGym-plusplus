import React from 'react';
import { useWangyiyunStore } from '../state';
import { useWangyiyunGestures } from '../hooks/useWangyiyunGestures';
import { useSheets, Cover, WY } from '../components/ui';
import { IcMenu, IcSearch, IcPlus, IcHeart } from '../res/icons';

export default function NotesFeedPage() {
  const { bindTap, go } = useWangyiyunGestures();
  const { open } = useSheets();
  const [tab, setTab] = React.useState<'rec' | 'follow'>('rec');
  const notes = useWangyiyunStore((s) => s.notes);
  const toggleLike = useWangyiyunStore((s) => s.toggleNoteLike);
  const shown = notes.filter((n) => tab === 'rec' ? true : n.kind === 'follow');

  return (
    <div className="flex flex-col h-full" style={{ background: WY.noteBg }} data-status-bar-foreground="light">
      <div className="h-10" />
      <div className="flex items-center h-11 px-2 text-white shrink-0">
        <button onClick={() => open('drawer')} className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer text-white" aria-label="菜单"><IcMenu size={22} /></button>
        <div className="flex-1 flex justify-center gap-5 text-[15px]">
          <button {...bindTap({ kind: 'action', id: 'notes.feed.select.target' }, {
            params: { target: 'follow' },
            onTrigger: () => setTab('follow'),
          })} className="bg-transparent border-none cursor-pointer p-0" style={{ color: tab === 'follow' ? '#fff' : 'rgba(255,255,255,0.5)' }}>关注</button>
          <button {...bindTap({ kind: 'action', id: 'notes.feed.select.target' }, {
            params: { target: 'rec' },
            onTrigger: () => setTab('rec'),
          })} className="bg-transparent border-none cursor-pointer p-0" style={{ color: tab === 'rec' ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight: 600 }}>推荐</button>
        </div>
        <button {...bindTap('moments.search-open')} className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer text-white" aria-label="搜索"><IcSearch size={20} /></button>
        <button onClick={() => go('notes.compose-open')} className="w-9 h-9 flex items-center justify-center rounded-full border-none cursor-pointer text-white" style={{ background: WY.primary }} aria-label="发笔记"><IcPlus size={20} /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-2" data-scroll-container="notes-feed" data-scroll-direction="vertical">
        <div className="columns-2 gap-2">
          {shown.map((n) => (
            <button key={n.id} onClick={() => go('notes.detail-open', { id: n.id })} className="w-full mb-2 break-inside-avoid rounded-xl overflow-hidden bg-transparent border-none cursor-pointer p-0 text-left" style={{ background: WY.noteCard }}>
              <Cover seed={n.coverSeed || n.seed} className="w-full" style={{ height: 120 + (n.body.length % 4) * 24 }} rounded={0} />
              <div className="p-2">
                <div className="text-[13px] text-white line-clamp-2">{n.body}</div>
                <div className="flex items-center gap-1 mt-2">
                  <Cover seed={n.seed} className="w-5 h-5" rounded={10} />
                  <span className="text-[11px] text-white/60 flex-1 truncate">{n.author}</span>
                  <span onClick={(e) => { e.stopPropagation(); toggleLike(n.id); }} className="flex items-center gap-0.5 text-white/60 text-[11px]">
                    <IcHeart size={13} fill={n.liked ? WY.primary : 'none'} style={{ color: n.liked ? WY.primary : 'currentColor' }} />{n.likes}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
