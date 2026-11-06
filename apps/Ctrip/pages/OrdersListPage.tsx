import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { useCtripStrings } from '../hooks/useCtripStrings';
import { TopBar, Img, Price, useUiState } from '../components/ui';
import { ORDER_TABS } from '../constants';
import type { CtripOrder } from '../types';
import { parseRouteTitle, resolveSearchCity } from '../utils/searchCity';

function rebookParams(o: CtripOrder): Record<string, string> {
  const params: Record<string, string> = { category: o.category };
  if (o.category === 'hotel') {
    params.city = resolveSearchCity(`${o.title} ${o.subtitle}`, '上海');
  } else if (o.category === 'train' || o.category === 'flight') {
    const route = parseRouteTitle(o.title) || parseRouteTitle(o.subtitle);
    if (route.from) params.from = route.from;
    if (route.to) params.to = route.to;
  } else if (o.category === 'ticket') {
    params.city = resolveSearchCity(`${o.title} ${o.subtitle}`, '上海');
  } else if (o.category === 'car') {
    params.location = o.subtitle || '上海虹桥机场';
  }
  return params;
}

function resolveHotelId(o: CtripOrder, hotels: { id: string; name: string }[]): string {
  const hit = hotels.find((h) => o.title.includes(h.name) || h.name.includes(o.title.slice(0, 6)));
  return hit?.id || hotels[0]?.id || 'h_atour';
}

/** 订单列表(spec orders.list)。5 tab 切换;卡片操作:立即支付→detail,改签→rebook,报销→invoice,再次预订→品类搜索,退票→cancel。 */
export default function OrdersListPage() {
  const s = useCtripStrings();
  const { bindTap, go } = useCtripGestures();
  const [sp] = useSearchParams();
  // fallback 固定为 all，避免从「待付款」入口进来后点「待付款」被当成删除 state
  const [tab, setTab] = useUiState('all');

  React.useEffect(() => {
    const next = sp.get('state');
    if (next && next !== tab) setTab(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅跟随 URL 入参
  }, [sp]);

  const orders = useCtripStore((s) => s.orders);
  const hotels = useCtripStore((s) => s.hotels);

  const filtered = orders.filter((o) => {
    if (tab === 'all') return true;
    if (tab === 'unpaid') return o.status === 'unpaid';
    if (tab === 'upcoming') return o.status === 'upcoming';
    if (tab === 'refund') return o.status === 'refunded' || o.status === 'cancelled';
    if (tab === 'toReview' || tab === 'review') return o.status === 'completed' && !o.reviewed;
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title={s.t('我的订单')} />
      <div className="shrink-0 bg-white flex border-b border-[#F0F0F0]">
        {ORDER_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            {...bindTap({ kind: 'action', id: 'orders.tab.select.all' }, { params: { tab: t.id }, onTrigger: () => setTab(t.id) })}
            className={`flex-1 py-2.5 text-[13px] bg-transparent border-none cursor-pointer relative ${tab === t.id ? 'text-[#0086F6] font-semibold' : 'text-[#666666]'}`}
          >
            {s.t(t.label)}
            {tab === t.id && <span className="absolute left-1/2 -translate-x-1/2 bottom-0.5 w-5 h-[3px] rounded-full bg-[#0086F6]" />}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-[14px] text-[#999999]">{s.t('暂无订单')}</div>
        ) : (
          filtered.map((o) => <OrderCard key={o.id} o={o} bindTap={bindTap} go={go} hotels={hotels} />)
        )}
      </div>
    </div>
  );
}

function OrderCard({ o, bindTap, go, hotels }: { o: CtripOrder; bindTap: ReturnType<typeof useCtripGestures>['bindTap']; go: ReturnType<typeof useCtripGestures>['go']; hotels: { id: string; name: string }[] }) {
  const s = useCtripStrings();
  const CAT_LABEL: Record<CtripOrder['category'], string> = {
    hotel: s.t('酒店'), train: s.t('火车票'), flight: s.t('机票'), ticket: s.t('门票'), car: s.t('租车'),
  };
  return (
    <div {...bindTap('orders.toDetail', { params: { id: o.id } })} className="bg-white mx-2 mt-2 rounded-xl p-3 cursor-pointer">
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-[#666666]">{CAT_LABEL[o.category]} · {o.date}</span>
        <span className={`text-[13px] font-semibold ${o.status === 'unpaid' ? 'text-[#FF6A2C]' : o.status === 'upcoming' ? 'text-[#38A169]' : 'text-[#999999]'}`}>{o.statusText}</span>
      </div>
      <div className="flex gap-3 mt-2">
        {o.image ? <Img src={o.image} className="w-16 h-16 rounded-lg object-cover shrink-0" /> : <div className="w-16 h-16 rounded-lg bg-[#EAF4FF] flex items-center justify-center text-[#0086F6] text-[12px] shrink-0">{CAT_LABEL[o.category]}</div>}
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold line-clamp-1">{o.title}</div>
          <div className="text-[12px] text-[#999999] mt-1 line-clamp-1">{o.subtitle}</div>
          {o.refundInfo && <div className="text-[11px] text-[#38A169] mt-1">{o.refundInfo}</div>}
        </div>
        <Price value={o.price} size="m" />
      </div>
      <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-[#F5F5F5]">
        {o.status === 'unpaid' && (
          <button {...bindTap('orders.toDetail', { params: { id: o.id }, stopPropagation: true })} className="text-[13px] text-white bg-gradient-to-r from-[#FF9F45] to-[#FF6A2C] rounded-full px-4 py-1.5 border-none cursor-pointer">{s.t('立即支付')}</button>
        )}
        {(o.status === 'upcoming') && (
          <>
            {(o.category === 'train' || o.category === 'flight') && (
              <button {...bindTap('orders.toRebook', { params: { id: o.id }, stopPropagation: true })} className="text-[13px] text-[#333333] border border-[#DDDDDD] rounded-full px-4 py-1.5 bg-white cursor-pointer">{s.t('改签')}</button>
            )}
            <button {...bindTap('orders.toRefund', { params: { id: o.id }, stopPropagation: true })} className="text-[13px] text-[#333333] border border-[#DDDDDD] rounded-full px-4 py-1.5 bg-white cursor-pointer">{s.t(o.category === 'hotel' ? '取消/退款' : '退票/退款')}</button>
          </>
        )}
        {o.status === 'completed' && (
          <>
            <button {...bindTap('orders.toInvoice', { stopPropagation: true })} className="text-[13px] text-[#333333] border border-[#DDDDDD] rounded-full px-4 py-1.5 bg-white cursor-pointer">{s.t('报销凭证')}</button>
            {o.category === 'hotel' && !o.reviewed && (
              <button
                {...bindTap('hotelDetail.toReview', {
                  params: { id: resolveHotelId(o, hotels), orderId: o.id },
                  stopPropagation: true,
                })}
                className="text-[13px] text-[#333333] border border-[#DDDDDD] rounded-full px-4 py-1.5 bg-white cursor-pointer"
              >{s.t('去点评')}</button>
            )}
            <button {...bindTap('orders.rebookSame', { params: rebookParams(o), stopPropagation: true })} className="text-[13px] text-[#0086F6] border border-[#0086F6] rounded-full px-4 py-1.5 bg-white cursor-pointer">{s.t('再次预订')}</button>
          </>
        )}
        {(o.status === 'cancelled' || o.status === 'refunded') && (
          <button {...bindTap('orders.rebookSame', { params: rebookParams(o), stopPropagation: true })} className="text-[13px] text-[#0086F6] border border-[#0086F6] rounded-full px-4 py-1.5 bg-white cursor-pointer">{s.t('再次预订')}</button>
        )}
      </div>
    </div>
  );
}
