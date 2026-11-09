import React, { useState } from 'react';
import { useXimalayaGestures } from '../hooks/useXimalayaGestures';
import { useXimalayaStrings } from '../hooks/useXimalayaStrings';
import { useXimalayaStore } from '../state';
import { TopBar, Img, VipTag, EmptyState, showToast } from '../components/ui';
import { IcChevronRight } from '../res/icons';

export function PurchasedPage() {
  const { bindTap } = useXimalayaGestures();
  const s = useXimalayaStrings();
  const purchased = useXimalayaStore((st) => st.purchased);
  const albums = useXimalayaStore((st) => st.albums);

  const [tab, setTab] = useState<'album' | 'anchorVip' | 'package'>('album');

  const list = purchased.filter((p) => p.kind === tab);

  const TABS = [
    { label: '专辑', k: 'album' as const, bind: bindTap({ kind: 'action', id: 'purchased.tab.select.opt' }, { params: { tab: 'album' }, onTrigger: () => setTab('album') }) },
    { label: '主播会员', k: 'anchorVip' as const, bind: bindTap({ kind: 'action', id: 'purchased.tab.select.opt' }, { params: { tab: 'anchorVip' }, onTrigger: () => setTab('anchorVip') }) },
    { label: '畅听包', k: 'package' as const, bind: bindTap({ kind: 'action', id: 'purchased.tab.select.opt' }, { params: { tab: 'package' }, onTrigger: () => setTab('package') }) },
  ];

  const showOrders = () => showToast(`共 ${purchased.length} 笔已购订单`);

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <TopBar
        title={s.mine_purchased}
        right={<button {...bindTap({ kind: 'action', id: 'purchased.order.tap' }, { onTrigger: showOrders })} className="text-[14px] text-[#333] px-2">订单</button>}
      />

      {/* Tab */}
      <div className="shrink-0 bg-white flex items-center gap-6 px-4 pb-2 text-[15px]">
        {TABS.map((t) => (
          <button key={t.k} {...t.bind} className={t.k === tab ? 'text-[#333] font-semibold border-b-2 border-[#FE4543] pb-1' : 'text-[#999] pb-1'}>{t.label}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
        {list.length === 0 ? (
          <EmptyState text={s.empty_purchased} />
        ) : (
          <div className="p-3 flex flex-col gap-2">
            {list.map((p) => {
              const album = albums.find((a) => a.id === p.albumId);
              if (!album) return null;
              return (
                <div key={p.albumId} {...bindTap('purchased.album-open', { params: { id: p.albumId } })} className="bg-white rounded-xl p-2.5 flex items-center gap-3">
                  <Img src={album.cover} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] text-[#333] font-medium leading-snug line-clamp-2">{album.title}</div>
                    <div className="mt-1 flex items-center gap-1">
                      {album.isVip && <VipTag />}
                      <span className="text-[11px] text-[#999]">{album.anchorName}</span>
                    </div>
                    <div className="text-[11px] text-[#FE4543] mt-1">
                      {p.kind === 'anchorVip' ? '主播会员 · 有效期内' : p.kind === 'package' ? '畅听包' : `已购 ${p.purchasedCount} 集`}
                    </div>
                  </div>
                  <IcChevronRight size={18} className="text-[#CCC]" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
