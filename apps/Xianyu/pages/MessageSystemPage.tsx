import React from 'react';
import * as TimeService from '@/os/TimeService';
import { useXianyuStore } from '../state';
import { useXianyuGestures } from '../hooks/useXianyuGestures';
import { TopBar } from '../components/TopBar';
import { EmptyState } from '../components/ui';
import { ItemImage } from '../components/ItemImage';
import { IcReceipt, IcArrowRight } from '../res/icons';
import type { XyOrder } from '../types';

/** 根据订单状态 + 视角生成一条系统交易通知文案 */
function noticeText(o: XyOrder): { title: string; body: string } {
  const buyer = o.role === 'buyer';
  switch (o.status) {
    case 'pendingPayment':
      return { title: '订单待付款', body: buyer ? '你有一笔订单待付款,请尽快完成支付' : '买家已下单,等待买家付款' };
    case 'pendingShip':
      return { title: buyer ? '付款成功' : '买家已付款', body: buyer ? '你已付款成功,等待卖家发货' : '买家已付款,请尽快发货' };
    case 'pendingReceipt':
      return { title: '卖家已发货', body: '包裹已发出,请注意查收并及时确认收货' };
    case 'pendingReview':
      return { title: '交易成功', body: '交易已完成,快去评价一下这次交易吧~' };
    case 'completed':
      return { title: '交易完成', body: '本次交易已全部完成,感谢使用闲鱼' };
    case 'refunding':
      return { title: '退款处理中', body: '你的退款申请正在处理,请耐心等待' };
    case 'closed':
    default:
      return { title: '订单已关闭', body: '该订单已关闭,如有疑问可联系客服' };
  }
}

function fmtTime(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function MessageSystemPage() {
  const { bindTap } = useXianyuGestures();
  const orders = useXianyuStore((s) => s.orders);

  const notices = [...orders].sort((a, b) => {
    const ta = a.paidAt ?? a.createdAt;
    const tb = b.paidAt ?? b.createdAt;
    return tb - ta;
  });

  return (
    <div className="flex flex-col h-full bg-[#F4F4F4]" data-status-bar-foreground="dark">
      <TopBar title="交易消息" />

      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="MessageSystemPage-main"
        data-scroll-direction="vertical"
      >
        {notices.length === 0 ? (
          <EmptyState text="暂无交易消息" hint="下单后交易动态会显示在这里" />
        ) : (
          <div className="pt-2">
            {notices.map((o) => {
              const n = noticeText(o);
              const ts = o.paidAt ?? o.createdAt;
              return (
                <button
                  key={o.id}
                  {...bindTap('order.detail-open', { params: { orderId: o.id } })}
                  className="w-full bg-white mb-2 px-3 py-3 border-none cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-[#FFF3E0] flex items-center justify-center">
                      <IcReceipt size={14} className="text-[#FF6A00]" />
                    </span>
                    <span className="text-[14px] font-semibold text-[#111]">{n.title}</span>
                    <span className="ml-auto text-[11px] text-[#999]">{fmtTime(ts)}</span>
                  </div>
                  <div className="flex gap-2 rounded-lg bg-[#F7F7F7] p-2">
                    <ItemImage seed={o.itemId} src={o.image} label={o.title} className="w-12 h-12 rounded-md shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] text-[#333] line-clamp-2">{n.body}</div>
                      <div className="text-[12px] text-[#999] truncate mt-1">{o.title}</div>
                    </div>
                    <IcArrowRight size={16} className="text-[#CCC] self-center" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
