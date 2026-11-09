import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { useDianpingGestures } from '../hooks/useDianpingGestures';
import { useDianpingStore } from '../state';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcBack } from '../res/icons';
import { shopCoverUrl } from '../assets';
import type { OrderStatus } from '../types';

const TABS: {
  id: string;
  labelKey: 'orderAll' | 'orderPending' | 'orderUsable' | 'orderRefund';
  filter?: OrderStatus[];
}[] = [
  { id: 'all', labelKey: 'orderAll' },
  { id: 'pending', labelKey: 'orderPending', filter: ['pending_pay'] },
  { id: 'usable', labelKey: 'orderUsable', filter: ['usable'] },
  { id: 'refund', labelKey: 'orderRefund', filter: ['refunding', 'refunded'] },
];

export default function OrdersPage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindBack, bindTap } = useDianpingGestures();
  const [sp] = useSearchParams();
  const tab = sp.get('tab') || 'all';
  const orders = useDianpingStore((st) => st.orders);
  const list = useMemo(() => {
    const conf = TABS.find((t) => t.id === tab);
    if (!conf?.filter) return orders;
    return orders.filter((o) => conf.filter!.includes(o.status));
  }, [orders, tab]);

  const statusText = (st: OrderStatus) => {
    if (st === 'usable') return s.orderUsable;
    if (st === 'refunding') return s.orderRefunding;
    if (st === 'refunded') return s.orderRefunded;
    if (st === 'used') return s.orderUsed;
    return s.orderPending;
  };

  return (
    <div className="flex h-full flex-col bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <div className="bg-white">
        <div className="flex h-11 items-center gap-1 px-1">
          <button type="button" className="cursor-pointer border-none bg-transparent p-1.5" {...bindBack()}>
            <IcBack size={22} />
          </button>
          <div className="text-[16px] font-semibold">{s.mineOrders}</div>
        </div>
        <div className="flex px-2">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                className={`relative flex-1 cursor-pointer border-none bg-transparent py-2.5 text-[14px] ${
                  active ? 'font-bold text-[#222]' : 'text-[#666]'
                }`}
                {...bindTap('orders.tab', { params: { tab: t.id } })}
              >
                {s[t.labelKey]}
                {active ? (
                  <span className="absolute bottom-0 left-1/2 h-[3px] w-5 -translate-x-1/2 rounded-full bg-[#FF6633]" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto" data-scroll-container="orders" data-scroll-direction="vertical">
        {list.length === 0 ? (
          <div className="py-16 text-center text-[13px] text-[#999]">{s.emptyOrders}</div>
        ) : (
          list.map((o) => (
            <button
              key={o.id}
              type="button"
              className="mx-3 mt-2 flex w-[calc(100%-1.5rem)] cursor-pointer gap-3 rounded-[10px] border-none bg-white p-3 text-left"
              {...bindTap('orders.detail-open', { params: { orderId: o.id } })}
            >
              <div
                className="h-14 w-14 shrink-0 overflow-hidden rounded-lg"
                style={{ background: o.coverColor }}
              >
                {shopCoverUrl(o.shopId) ? (
                  <img src={shopCoverUrl(o.shopId)} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="truncate text-[14px] font-semibold text-[#222]">{o.dealTitle}</div>
                  <span className="shrink-0 text-[11px] text-[#FF6633]">{statusText(o.status)}</span>
                </div>
                <div className="mt-0.5 truncate text-[11px] text-[#999]">{o.shopName}</div>
                <div className="mt-1 text-[13px] font-bold text-[#FF6633]">
                  ¥{o.payAmount} <span className="text-[11px] font-normal text-[#999]">x{o.qty}</span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
