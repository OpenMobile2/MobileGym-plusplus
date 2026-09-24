import React from 'react';
import { useParams } from 'react-router-dom';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { TopBar, Img, Price, useToast, EmptyState, VIP } from '../components/ui';
import { IcLocation, IcCopy, IcTruck, IcService, IcShield } from '../res/icons';
import type { VipOrderStatus } from '../types';

const STATUS_LABEL: Record<VipOrderStatus, string> = {
  pendingPayment: '等待付款',
  pendingReceipt: '商家已发货,待收货',
  completed: '交易完成',
  canceled: '交易已取消',
  refunding: '退款处理中',
};

export default function OrderDetailPage() {
  const { id = '' } = useParams();
  const { bindTap } = useVipshopGestures();
  const [toast, showToast] = useToast();

  const order = useVipshopStore((s) => s.orders.find((o) => o.id === id));
  const confirmReceipt = useVipshopStore((s) => s.confirmReceipt);

  if (!order) {
    return (
      <div className="flex flex-col h-full bg-[#F5F5F5]">
        <TopBar title="订单详情" />
        <EmptyState text="订单不存在" />
      </div>
    );
  }

  const latestLog = order.logistics[0];

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]">
      <TopBar title="订单详情" />

      <div className="flex-1 overflow-y-auto" data-scroll-container="order-detail" data-scroll-direction="vertical">
        {/* 状态 banner */}
        <div className="px-4 py-4 text-white" style={{ background: `linear-gradient(135deg,#FF6FA5,${VIP.primary})` }}>
          <div className="text-[18px] font-semibold">{STATUS_LABEL[order.status]}</div>
          {order.status === 'pendingPayment' && (
            <div className="text-[12px] opacity-90 mt-1">请尽快完成付款,以免订单取消</div>
          )}
        </div>

        {/* 物流摘要 */}
        {latestLog && order.status !== 'pendingPayment' && order.status !== 'canceled' && (
          <button
            {...bindTap('orderDetail.logistics-open', { params: { id: order.id } })}
            className="w-full bg-white px-3 py-3 flex items-center gap-2 border-none cursor-pointer text-left"
          >
            <IcTruck size={18} style={{ color: VIP.primary }} className="shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-[#222222] line-clamp-1">{latestLog.text}</div>
              <div className="text-[11px] text-[#888888] mt-0.5">{order.courier} · {latestLog.time}</div>
            </div>
            <span className="text-[12px] text-[#888888]">查看物流 ›</span>
          </button>
        )}

        {/* 收货地址 */}
        <div className="bg-white mt-2 px-3 py-3 flex items-start gap-2">
          <IcLocation size={18} style={{ color: VIP.primary }} className="shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-semibold text-[#222222]">{order.addressSnapshot.name}</span>
              <span className="text-[13px] text-[#666666]">{order.addressSnapshot.phone}</span>
            </div>
            <div className="text-[12px] text-[#666666] mt-0.5">{order.addressSnapshot.full}</div>
          </div>
        </div>

        {/* 商品清单 */}
        <div className="bg-white mt-2">
          <div className="px-3 py-2 text-[13px] font-semibold text-[#222222] border-b border-[#F5F5F5]">{order.brandName}</div>
          {order.lines.map((l, i) => (
            <div key={`${l.itemId}_${i}`} className="flex gap-2.5 px-3 py-2.5 border-b border-[#F5F5F5]">
              <Img src={l.image} className="w-16 h-16 rounded-lg object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-[#222222] line-clamp-2">{l.title}</div>
                <div className="text-[11px] text-[#888888] mt-0.5">{l.skuDesc}</div>
              </div>
              <div className="text-right shrink-0">
                <Price value={l.price} size="s" />
                <div className="text-[11px] text-[#888888] mt-0.5">x{l.qty}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 金额明细 */}
        <div className="bg-white mt-2 px-3 py-2 text-[12px] text-[#666666]">
          <div className="flex justify-between py-1"><span>商品总额</span><span>¥{order.itemTotal.toFixed(2)}</span></div>
          <div className="flex justify-between py-1"><span>运费</span><span>{order.shippingFee === 0 ? '包邮' : `¥${order.shippingFee}`}</span></div>
          <div className="flex justify-between py-1 border-t border-[#F5F5F5] mt-1 pt-2 text-[#222222] font-semibold">
            <span>实付款</span><span style={{ color: VIP.price }}>¥{order.paidAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* 订单信息 */}
        <div className="bg-white mt-2 px-3 py-2 text-[12px] text-[#666666]">
          <div className="flex justify-between items-center py-1.5">
            <span>订单编号</span>
            <span className="flex items-center gap-1.5">
              <span className="text-[#222222]">{order.orderNo}</span>
              <button
                {...bindTap({ kind: 'action', id: 'orderDetail.copyOrderNo.submit' }, { onTrigger: () => showToast('已复制') })}
                className="flex items-center gap-0.5 text-[11px] rounded px-1.5 py-0.5 border cursor-pointer bg-white"
                style={{ color: VIP.primary, borderColor: VIP.primary }}
              >
                <IcCopy size={11} />复制
              </button>
            </span>
          </div>
          <div className="flex justify-between py-1.5"><span>支付方式</span><span className="text-[#222222]">{order.payMethod ?? '—'}</span></div>
          <div className="flex justify-between py-1.5 items-center">
            <span className="flex items-center gap-1"><IcShield size={12} style={{ color: VIP.gold }} />100%正品保障</span>
            <span className="text-[#BBBBBB]">假一赔十</span>
          </div>
        </div>

        <div className="h-3" />
      </div>

      {/* 底部按钮栏 */}
      <div className="shrink-0 bg-white border-t border-[#EEEEEE] flex items-center justify-end px-3 h-14 gap-2 flex-wrap">
        <button
          {...bindTap('orderDetail.service-open')}
          className="flex items-center gap-1 text-[13px] rounded-full px-3 py-1.5 border cursor-pointer bg-white text-[#666666] border-[#DDDDDD]"
        >
          <IcService size={14} />客服
        </button>

        {order.isInternational && (
          <button
            {...bindTap('orderDetail.trace-open', { params: { id: order.id } })}
            className="text-[13px] rounded-full px-3 py-1.5 border cursor-pointer bg-white"
            style={{ color: VIP.gold, borderColor: VIP.gold }}
          >
            商品溯源
          </button>
        )}

        <button
          {...bindTap('orderDetail.refund-open', { params: { id: order.id } })}
          className="text-[13px] rounded-full px-3 py-1.5 border cursor-pointer bg-white text-[#666666] border-[#DDDDDD]"
        >
          申请售后
        </button>

        {order.status === 'pendingPayment' && (
          <button
            {...bindTap('orderDetail.pay-open', { params: { orderId: order.id } })}
            className="text-[14px] rounded-full px-5 py-1.5 border-none cursor-pointer text-white font-semibold"
            style={{ background: VIP.ctaBlack }}
          >
            继续付款
          </button>
        )}

        {order.status === 'pendingReceipt' && (
          <button
            {...bindTap({ kind: 'action', id: 'orderDetail.confirmReceipt.submit' }, {
              onTrigger: () => { confirmReceipt(order.id); showToast('确认收货成功'); },
            })}
            className="text-[14px] rounded-full px-5 py-1.5 border-none cursor-pointer text-white font-semibold"
            style={{ background: VIP.ctaBlack }}
          >
            确认收货
          </button>
        )}
      </div>
      {toast}
    </div>
  );
}
