import React from 'react';
import { useParams } from 'react-router-dom';
import { useJingdongGestures } from '../hooks/useJingdongGestures';
import { useJingdongStore } from '../state';
import { showToast } from '../components/ui';
import { IcNavBack, IcShare, IcTruck, IcTicket } from '../res/icons';

export function LogisticsPage() {
  const { bindTap, bindBack } = useJingdongGestures();
  const { orderId } = useParams();
  const orders = useJingdongStore((s) => s.orders);
  const markOrderLogisticsViewed = useJingdongStore((s) => s.markOrderLogisticsViewed);
  const remindOrder = useJingdongStore((s) => s.remindOrder);
  const order = orders.find((o) => o.id === orderId) || orders[0];

  React.useEffect(() => {
    if (order?.id) markOrderLogisticsViewed(order.id);
  }, [markOrderLogisticsViewed, order?.id]);

  const nodes = order?.logistics.nodes.length
    ? order.logistics.nodes
    : [{ time: '刚刚', text: '您提交了订单,请等待系统确认' }];
  const address = order?.addressSnapshot.full || '';

  const coupons = [
    { text: '满10.01减10' },
    { text: '满3.01减3' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="dark">
      {/* 顶部 */}
      <div className="shrink-0 pt-10 h-[76px] flex items-center px-2">
        <button {...bindBack()} aria-label="返回" className="w-9 h-9 flex items-center justify-center">
          <IcNavBack size={24} className="text-[#333]" />
        </button>
        <div className="flex-1" />
        <button className="flex flex-col items-center text-[#333] px-1" aria-label="分享">
          <IcShare size={18} />
          <span className="text-[10px]">分享</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="logi-scroll" data-scroll-direction="vertical">
        <div className="px-4 text-[22px] font-bold text-[#1A1A1A]">已下单</div>

        {/* 物流状态 + 时间线 */}
        <div className="mx-3 mt-3 bg-white rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-[#EEF1F6] flex items-center justify-center">
                <IcTruck size={20} className="text-[#7A8296]" />
              </div>
              <span className="text-[16px] font-semibold text-[#1A1A1A]">快递运输</span>
            </div>
            <button
              {...bindTap({ kind: 'action', id: 'logistics.remind.action' }, { onTrigger: () => { if (order?.id) remindOrder(order.id); showToast('已催单'); } })}
              className="h-8 px-4 rounded-full bg-[#F3F4F6] text-[13px] text-[#333]"
            >
              我要催单
            </button>
          </div>

          {address && (
            <div className="flex items-start gap-2 mt-4">
              <span className="w-2.5 h-2.5 rounded-full bg-[#CCC] mt-1.5 shrink-0" />
              <div className="text-[13px] text-[#888] leading-snug">收货地址:{address}</div>
            </div>
          )}

          <div className="mt-2 pl-1">
            {nodes.map((n, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className={`w-2.5 h-2.5 rounded-full mt-1 ${i === 0 ? 'bg-[#E1251B]' : 'bg-[#CCC]'}`} />
                  {i < nodes.length - 1 && <span className="flex-1 w-px bg-[#EEE] my-0.5" />}
                </div>
                <div className={`pb-4 ${i === 0 ? '' : 'opacity-70'}`}>
                  <div className={`text-[14px] ${i === 0 ? 'text-[#1A1A1A] font-medium' : 'text-[#666]'}`}>{i === 0 ? '已下单' : ''}{n.text}</div>
                  <div className="text-[12px] text-[#AAA] mt-1">{n.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 等快递抢优惠 */}
        <div className="mx-3 mt-3 mb-4 bg-white rounded-xl p-4">
          <div className="text-[16px] font-bold text-[#1A1A1A] mb-3">等快递抢优惠</div>
          <div className="grid grid-cols-2 gap-3">
            {coupons.map((c) => (
              <div key={c.text} className="rounded-xl bg-[#FFF6EC] p-3 flex flex-col items-center">
                <div className="w-11 h-11 rounded-lg bg-gradient-to-b from-[#FF8A3D] to-[#FF5A2C] flex items-center justify-center">
                  <IcTicket size={22} className="text-white" />
                </div>
                <div className="text-[15px] font-bold text-[#E1251B] mt-2">{c.text}</div>
                <div className="text-[11px] text-[#C08A5A] mt-0.5">限时专享优惠券</div>
                <button
                  {...bindTap('logistics.coupon-open', { params: { q: '优惠' } })}
                  className="mt-2 h-7 px-6 rounded-full bg-[#E1251B] text-[13px] text-white"
                >
                  立即使用
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
