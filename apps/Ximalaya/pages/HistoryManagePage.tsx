import React, { useState } from 'react';
import { useXimalayaGestures } from '../hooks/useXimalayaGestures';
import { useXimalayaStrings } from '../hooks/useXimalayaStrings';
import { useXimalayaStore } from '../state';
import { TopBar, Img, EmptyState, showToast } from '../components/ui';
import { IcCheck } from '../res/icons';

export function HistoryManagePage() {
  const { bindTap, back } = useXimalayaGestures();
  const s = useXimalayaStrings();
  const history = useXimalayaStore((st) => st.history);
  const albums = useXimalayaStore((st) => st.albums);
  const tracks = useXimalayaStore((st) => st.tracks);
  const removeHistory = useXimalayaStore((st) => st.removeHistory);

  const [checked, setChecked] = useState<string[]>([]);

  const items = history.filter((h) => h.kind === 'play');
  const allChecked = items.length > 0 && checked.length === items.length;

  const toggle = (id: string) =>
    setChecked((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  const selectAll = () => setChecked(allChecked ? [] : items.map((h) => h.trackId));
  const selectFinished = () => setChecked(items.filter((h) => h.remainSec === 0).map((h) => h.trackId));

  const del = () => {
    if (checked.length === 0) return;
    const n = checked.length;
    checked.forEach((id) => removeHistory(id));
    showToast(`已删除 ${n} 条`);
    setChecked([]);
    back();
  };

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <TopBar title="管理收听" />

      {/* 快捷选择条 */}
      <div className="shrink-0 bg-white border-b border-[#F5F5F5] flex items-center gap-3 px-4 py-2 text-[13px]">
        <button {...bindTap({ kind: 'action', id: 'histmanage.selectall.toggle' }, { onTrigger: selectAll })} className="px-3 py-1 rounded-full bg-[#F5F5F5] text-[#333]">{allChecked ? '取消全选' : s.select_all}</button>
        <button {...bindTap({ kind: 'action', id: 'histmanage.selectall.toggle' }, { onTrigger: selectFinished })} className="px-3 py-1 rounded-full bg-[#F5F5F5] text-[#333]">选择已听完</button>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
        {items.length === 0 ? (
          <EmptyState text={s.empty_history} />
        ) : (
          <div className="p-3 flex flex-col gap-2">
            {items.map((h) => {
              const album = albums.find((a) => a.id === h.albumId);
              const track = tracks.find((t) => t.id === h.trackId);
              if (!album || !track) return null;
              const on = checked.includes(h.trackId);
              return (
                <div key={h.trackId} onClick={() => toggle(h.trackId)} className="bg-white rounded-xl p-2.5 flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${on ? 'bg-[#FE4543] border-[#FE4543] text-white' : 'border-[#CCC] text-transparent'}`}><IcCheck size={14} /></div>
                  <Img src={album.cover} className="w-12 h-12 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] text-[#333] font-medium truncate">{track.title}</div>
                    <div className="text-[12px] text-[#999] truncate mt-0.5">{h.remainSec > 0 ? `剩 ${Math.ceil(h.remainSec / 60)} 分钟` : '已听完'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 底部删除条 */}
      <div className="shrink-0 bg-white border-t border-[#EEE] flex items-center justify-between px-4 py-3">
        <button onClick={selectAll} className="flex items-center gap-2 text-[14px] text-[#333]">
          <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${allChecked ? 'bg-[#FE4543] border-[#FE4543] text-white' : 'border-[#CCC] text-transparent'}`}><IcCheck size={14} /></span>
          {s.select_all}
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'histmanage.delete.submit' }, { onTrigger: del })}
          className={`px-5 py-2 rounded-full text-[14px] font-medium ${checked.length ? 'bg-[#FE4543] text-white' : 'bg-[#F0F0F0] text-[#BBB]'}`}
        >{s.delete}{checked.length ? `(${checked.length})` : ''}</button>
      </div>
    </div>
  );
}
