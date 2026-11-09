import React from 'react';
import { usePinduoduoGestures } from '../hooks/usePinduoduoGestures';
import { usePinduoduoStore } from '../state';
import { Img, TopBar, EmptyState } from '../components/ui';
import { IcChevronRight } from '../res/icons';
import type { Order } from '../types';

const STATUS_NOTICE: Record<string, { title: string; body: string }> = {
  shipped: { title: '发货通知', body: '您的包裹已发货,请留意物流动态。' },
  packing: { title: '订单通知', body: '商家正在打包,商品即将发出。' },
  refunded: { title: '退款成功', body: '「先用后付」订单实际退款0元,金额已原路返回。' },
  refunding: { title: '退款处理中', body: '您的退款申请已提交,正在处理中。' },
  completed: { title: '交易完成', body: '订单已确认收货,感谢您的购买。' },
  grouping: { title: '拼单提醒', body: '您的拼单还差1人成团,快邀请好友吧。' },
  pendingPayment: { title: '待付款提醒', body: '您有一笔订单待付款,请及时处理。' },
};

// 交易通知:用订单造通知流
export function NotificationPage() {
  const { bindTap } = usePinduoduoGestures();
  const orders = usePinduoduoStore((s) => s.orders);

  const notices = orders
    .map((o) => ({ order: o, notice: STATUS_NOTICE[o.status] }))
    .filter((n): n is { order: Order; notice: { title: string; body: string } } => !!n.notice);

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5] overflow-hidden" data-status-bar-foreground="dark">
      <TopBar title="交易通知" />

      {notices.length === 0 ? (
        <EmptyState text="暂无交易通知" />
      ) : (
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2" data-scroll-container data-scroll-direction="vertical">
          {notices.map(({ order, notice }) => {
            const line = order.lines[0];
            return (
              <button
                key={order.id}
                {...bindTap('notification.item-open', { params: { itemId: line.itemId } })}
                className="w-full bg-white rounded-xl overflow-hidden text-left"
              >
                <div className="px-3 py-2 border-b border-[#F5F5F5] flex items-center">
                  <span className="text-[13px] text-[#E22E1F] font-medium flex-1">{notice.title}</span>
                  <span className="text-[11px] text-[#BBB]">拼多多</span>
                </div>
                <div className="p-3 flex gap-3">
                  <Img src={line.image} className="w-14 h-14 rounded object-cover bg-[#F5F5F5] shrink-0" alt={line.title} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-[#333] leading-snug line-clamp-2">{notice.body}</div>
                    <div className="text-[12px] text-[#999] truncate mt-1">{line.title}</div>
                  </div>
                </div>
                <div className="px-3 py-2 border-t border-[#F5F5F5] flex items-center text-[12px] text-[#999]">
                  <span className="flex-1">查看详情</span>
                  <IcChevronRight size={14} className="text-[#CCC]" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
