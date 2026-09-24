import React from 'react';
import { useParams } from 'react-router-dom';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { TopBar, Img, useToast, NOT_OPEN, EmptyState, VIP } from '../components/ui';
import { IcTruck, IcCopy, IcService } from '../res/icons';

export default function LogisticsPage() {
  const { id = '' } = useParams();
  const { bindTap } = useVipshopGestures();
  const [toast, showToast] = useToast();

  const order = useVipshopStore((s) => s.orders.find((o) => o.id === id));

  if (!order) {
    return (
      <div className="flex flex-col h-full bg-[#F5F5F5]">
        <TopBar title="物流详情" />
        <EmptyState text="暂无物流信息" />
      </div>
    );
  }

  // 时间轴:最新在前
  const nodes = order.logistics;

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]">
      <TopBar title="物流详情" />

      <div className="flex-1 overflow-y-auto" data-scroll-container="logistics" data-scroll-direction="vertical">
        {/* 快递摘要 */}
        <div className="bg-white px-3 py-3 flex items-center gap-3">
          {order.lines[0] && <Img src={order.lines[0].image} className="w-14 h-14 rounded-lg object-cover shrink-0" />}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-[13px] text-[#222222]">
              <IcTruck size={15} style={{ color: VIP.primary }} />
              <span className="font-semibold">{order.courier}</span>
            </div>
            <div className="text-[12px] text-[#666666] mt-1">运单号:{order.trackingNo}</div>
            <div className="flex gap-2 mt-1.5">
              <button
                {...bindTap({ kind: 'action', id: 'logistics.copyNo.submit' }, { onTrigger: () => showToast('已复制') })}
                className="flex items-center gap-0.5 text-[11px] rounded-full px-2.5 py-0.5 border cursor-pointer bg-white"
                style={{ color: VIP.primary, borderColor: VIP.primary }}
              >
                <IcCopy size={11} />复制
              </button>
              <button
                {...bindTap({ kind: 'action', id: 'logistics.contactCourier.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
                className="flex items-center gap-0.5 text-[11px] rounded-full px-2.5 py-0.5 border cursor-pointer bg-white text-[#666666] border-[#DDDDDD]"
              >
                <IcService size={11} />联系快递
              </button>
            </div>
          </div>
        </div>

        {/* 物流时间轴 */}
        <div className="bg-white mt-2 px-4 py-4">
          {nodes.length === 0 && <div className="text-[13px] text-[#888888] text-center py-6">暂无物流轨迹</div>}
          {nodes.map((n, i) => {
            const isFirst = i === 0;
            const isLast = i === nodes.length - 1;
            return (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 mt-1"
                    style={isFirst ? { background: VIP.primary } : { background: '#DDDDDD' }}
                  />
                  {!isLast && <span className="w-px flex-1 min-h-10 bg-[#EEEEEE]" />}
                </div>
                <div className="pb-5 flex-1 min-w-0">
                  <div className="text-[13px] leading-snug" style={{ color: isFirst ? '#222222' : '#666666', fontWeight: isFirst ? 600 : 400 }}>{n.text}</div>
                  <div className="text-[11px] text-[#999999] mt-0.5">{n.time}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {toast}
    </div>
  );
}
