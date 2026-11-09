import React, { useState } from 'react';
import { useXimalayaGestures } from '../hooks/useXimalayaGestures';
import { useXimalayaStrings } from '../hooks/useXimalayaStrings';
import { useXimalayaStore } from '../state';
import { TopBar, Img, VipTag, EmptyState, showToast } from '../components/ui';
import { IcCheck } from '../res/icons';

export function SubscribeManagePage() {
  const { bindTap, back } = useXimalayaGestures();
  const s = useXimalayaStrings();
  const albums = useXimalayaStore((st) => st.albums);
  const subscribedAlbumIds = useXimalayaStore((st) => st.subscribedAlbumIds);
  const toggleSubscribe = useXimalayaStore((st) => st.toggleSubscribe);

  const [checked, setChecked] = useState<string[]>([]);
  const subscribed = albums.filter((a) => subscribedAlbumIds.includes(a.id));

  const toggle = (id: string) =>
    setChecked((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  const allChecked = subscribed.length > 0 && checked.length === subscribed.length;
  const toggleAll = () => setChecked(allChecked ? [] : subscribed.map((a) => a.id));

  const remove = () => {
    if (checked.length === 0) return;
    checked.forEach((id) => toggleSubscribe(id));
    showToast(`已取消订阅 ${checked.length} 个`);
    setChecked([]);
    back();
  };

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <TopBar title="批量管理" />

      <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
        {subscribed.length === 0 ? (
          <EmptyState text={s.empty_subscribe} />
        ) : (
          <div className="p-3 flex flex-col gap-2">
            {subscribed.map((a) => {
              const on = checked.includes(a.id);
              return (
                <div
                  key={a.id}
                  {...bindTap({ kind: 'action', id: 'submanage.check.toggle' }, { params: { albumId: a.id }, onTrigger: () => toggle(a.id) })}
                  className="bg-white rounded-xl p-2.5 flex items-center gap-3"
                >
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${on ? 'bg-[#FE4543] border-[#FE4543] text-white' : 'border-[#CCC] text-transparent'}`}>
                    <IcCheck size={14} />
                  </div>
                  <Img src={a.cover} className="w-14 h-14 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] text-[#333] font-medium leading-snug line-clamp-2">{a.title}</div>
                    <div className="mt-1 flex items-center gap-1">
                      {a.isVip && <VipTag />}
                      <span className="text-[11px] text-[#999]">{a.anchorName}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 底部批量条 */}
      <div className="shrink-0 bg-white border-t border-[#EEE] flex items-center justify-between px-4 py-3">
        <button onClick={toggleAll} className="flex items-center gap-2 text-[14px] text-[#333]">
          <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${allChecked ? 'bg-[#FE4543] border-[#FE4543] text-white' : 'border-[#CCC] text-transparent'}`}><IcCheck size={14} /></span>
          {s.select_all}
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'submanage.remove.submit' }, { onTrigger: remove })}
          className={`px-5 py-2 rounded-full text-[14px] font-medium ${checked.length ? 'bg-[#FE4543] text-white' : 'bg-[#F0F0F0] text-[#BBB]'}`}
        >取消订阅{checked.length ? `(${checked.length})` : ''}</button>
      </div>
    </div>
  );
}
