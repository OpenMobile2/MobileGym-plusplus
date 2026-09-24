import React, { useState } from 'react';
import { usePinduoduoGestures } from '../hooks/usePinduoduoGestures';
import { usePinduoduoStore } from '../state';
import { usePinduoduoStrings } from '../hooks/usePinduoduoStrings';
import { Img, TopBar, EmptyState, showToast } from '../components/ui';

const AFTERSALE_TABS = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待处理' },
] as const;

export function AftersaleListPage() {
  const { bindTap } = usePinduoduoGestures();
  const s = usePinduoduoStrings();
  const orders = usePinduoduoStore((st) => st.orders);
  const [tab, setTab] = useState<'all' | 'pending'>('all');

  const aftersale = orders.filter((o) => o.status === 'refunding' || o.status === 'refunded');
  const list = tab === 'pending' ? aftersale.filter((o) => o.status === 'refunding') : aftersale;

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5] overflow-hidden" data-status-bar-foreground="dark">
      <TopBar title="退款/售后" className="bg-white" />

      {/* Tab */}
      <div className="shrink-0 bg-white flex px-3 border-b border-[#EEE]">
        {AFTERSALE_TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="relative py-2.5 mr-6 text-[14px]"
            >
              <span className={active ? 'text-[#E22E1F] font-medium' : 'text-[#666]'}>{t.label}</span>
              {active && <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-6 h-0.5 rounded-full bg-[#E22E1F]" />}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-2.5" data-scroll-container data-scroll-direction="vertical">
        {list.length === 0 ? (
          <EmptyState text={s.empty_orders} />
        ) : (
          list.map((o) => {
            const line = o.lines[0];
            const done = o.status === 'refunded';
            return (
              <div key={o.id} className="bg-white rounded-lg mb-2.5 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-[#F5F5F5]">
                  <span className="text-[13px] text-[#333] font-medium truncate">{o.shopName}</span>
                  <span className={`text-[13px] ${done ? 'text-[#20B010]' : 'text-[#E22E1F]'}`}>
                    {done ? '退款成功' : '退款中'}
                  </span>
                </div>
                <div className="flex gap-2.5 px-3 py-2.5">
                  <Img src={line.image} className="w-16 h-16 rounded-md object-cover shrink-0" alt={line.title} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-[#333] line-clamp-2 leading-[17px]">{line.title}</div>
                    <div className="text-[12px] text-[#999] mt-1 truncate">{line.skuDesc}</div>
                    <div className="text-[12px] text-[#999] mt-1">退款金额 ¥{o.itemTotal.toFixed(2)}</div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 px-3 pb-2.5">
                  <button
                    {...bindTap({ kind: 'action', id: 'aftersale.refundflow.show' }, { onTrigger: () => showToast('退款原路返回') })}
                    className="px-3 h-8 rounded-full border border-[#DDD] text-[13px] text-[#666]"
                  >
                    钱款去向
                  </button>
                  <button
                    {...bindTap('aftersale.detail-open', { params: { orderId: o.id } })}
                    className="px-3 h-8 rounded-full border border-[#E22E1F] text-[13px] text-[#E22E1F]"
                  >
                    售后详情
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
