import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { usePinduoduoGestures } from '../hooks/usePinduoduoGestures';
import { usePinduoduoStore } from '../state';
import { Img, TopBar, PriceYuan, FufeiTag, showToast } from '../components/ui';
import { IcMapPin } from '../res/icons';
import type { OrderStatus } from '../types';

const STATUS_TEXT: Record<OrderStatus, string> = {
  pendingPayment: '等待付款',
  grouping: '拼团中,待分享成团',
  packing: '商家备货中,请耐心等待',
  shipped: '商品已发出,待收货',
  completed: '交易成功',
  refunding: '退款处理中',
  refunded: '退款成功',
};

const UNSHIPPED: OrderStatus[] = ['pendingPayment', 'grouping', 'packing'];

export function OrderDetailPage() {
  const { orderId } = useParams();
  const [sp] = useSearchParams();
  const isQuickRefund = sp.get('refund') === 'quick';

  const { bindTap, bindBack, back } = usePinduoduoGestures();
  const order = usePinduoduoStore((s) => s.orders.find((o) => o.id === orderId));
  const confirmQuickRefund = usePinduoduoStore((s) => s.confirmQuickRefund);
  const soloFinishGroup = usePinduoduoStore((s) => s.soloFinishGroup);

  if (!order) {
    return <div className="h-full pt-10 flex items-center justify-center text-[#999]">订单不存在</div>;
  }

  const itemId = order.lines[0]?.itemId || '';
  const shipped = order.status === 'shipped' || order.status === 'completed';
  const unshipped = UNSHIPPED.includes(order.status);
  const addr = order.addressSnapshot;

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5] overflow-hidden" data-status-bar-foreground="dark">
      <TopBar title="订单详情" className="bg-white" />

      <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
        {/* 状态头 */}
        <div className="bg-gradient-to-r from-[#FF4D2E] to-[#E22E1F] text-white px-4 py-5">
          <div className="text-[18px] font-semibold">{STATUS_TEXT[order.status]}</div>
        </div>

        {/* 收货地址 */}
        <div className="mx-3 -mt-3 bg-white rounded-xl px-3 py-3 flex gap-2">
          <IcMapPin size={18} className="text-[#E22E1F] shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className="text-[14px] text-[#333]">
              <span className="font-medium">{addr.name}</span>
              <span className="ml-2 text-[#666]">{addr.phone}</span>
            </div>
            <div className="text-[13px] text-[#666] mt-1 leading-snug">{addr.full}</div>
          </div>
        </div>

        {/* 商品行 */}
        <div className="mx-3 mt-3 bg-white rounded-xl overflow-hidden">
          <div className="px-3 py-2.5 border-b border-[#F5F5F5] text-[13px] font-medium text-[#333]">{order.shopName}</div>
          {order.lines.map((ln, i) => (
            <div key={i} {...bindTap('orderdetail.item-open', { params: { itemId: ln.itemId } })} className="flex gap-3 px-3 py-2.5">
              <Img src={ln.image} className="w-16 h-16 rounded-lg object-cover shrink-0" alt={ln.title} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-[#333] leading-snug line-clamp-2">{ln.title}</div>
                <div className="text-[12px] text-[#999] mt-1 truncate">{ln.skuDesc}</div>
              </div>
              <div className="text-right shrink-0">
                <PriceYuan value={ln.price} className="text-[#333] text-[14px]" symbolClass="text-[11px]" />
                <div className="text-[12px] text-[#999] mt-1">x{ln.qty}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 金额明细 */}
        <div className="mx-3 mt-3 bg-white rounded-xl px-3 py-1">
          <Row label="商品金额" value={<PriceYuan value={order.itemTotal} className="text-[#333] text-[14px]" symbolClass="text-[11px]" />} />
          <Row
            label="实付款"
            value={<PriceYuan value={order.paidAmount} className="text-[#E22E1F] text-[15px]" symbolClass="text-[11px]" />}
          />
          {order.fufei && (
            <div className="flex items-center gap-1 py-2 text-[12px] text-[#20B010] border-t border-[#F5F5F5]">
              <FufeiTag />
              <span>确认收货后自动付款 ¥{order.autoPayAmount.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* 订单信息 */}
        <div className="mx-3 mt-3 bg-white rounded-xl px-3 py-1">
          <Row label="订单编号" value={<span className="text-[13px] text-[#666]">{order.orderNo}</span>} />
          <Row label="下单时间" value={<span className="text-[13px] text-[#666]">已下单</span>} />
          <Row label="支付方式" value={<span className="text-[13px] text-[#666]">{order.payMethod || '未支付'}</span>} />
        </div>
        <div className="h-4" />
      </div>

      {/* 底部按钮 */}
      <div className="shrink-0 bg-white border-t border-[#EEE] px-3 py-2.5 flex items-center justify-end gap-2" data-hide-on-keyboard>
        {shipped && (
          <button
            {...bindTap('orderdetail.logistics-open', { params: { orderId: order.id } })}
            className="px-4 h-8 rounded-full border border-[#DDD] text-[13px] text-[#666]"
          >查看物流</button>
        )}
        {unshipped && (
          <button
            {...bindTap('orderdetail.refund.show', { params: { orderId: order.id } })}
            className="px-4 h-8 rounded-full border border-[#DDD] text-[13px] text-[#666]"
          >申请退款</button>
        )}
        {order.status === 'shipped' && (
          <button
            {...bindTap('refundform.open', { params: { orderId: order.id } })}
            className="px-4 h-8 rounded-full border border-[#DDD] text-[13px] text-[#666]"
          >申请退款</button>
        )}
        {order.status === 'grouping' && (
          <button
            {...bindTap({ kind: 'action', id: 'orderdetail.group.solo' }, {
              onTrigger: () => { soloFinishGroup(order.id); showToast('拼单成功'); },
            })}
            className="px-4 h-8 rounded-full bg-gradient-to-r from-[#FF4D2E] to-[#E22E1F] text-white text-[13px]"
          >直接免拼</button>
        )}
        {order.status === 'completed' && (
          <button
            {...bindTap('orderdetail.invoice-open', { params: { orderId: order.id } })}
            className="px-4 h-8 rounded-full border border-[#DDD] text-[13px] text-[#666]"
          >开发票</button>
        )}
        {order.status === 'completed' && !order.reviewed && (
          <button
            {...bindTap('orderdetail.review-open', { params: { orderId: order.id } })}
            className="px-4 h-8 rounded-full border border-[#DDD] text-[13px] text-[#666]"
          >去评价</button>
        )}
        <button
          {...bindTap('orderdetail.reorder-open', { params: { itemId } })}
          className="px-4 h-8 rounded-full bg-gradient-to-r from-[#FF4D2E] to-[#E22E1F] text-white text-[13px]"
        >再次拼单</button>
      </div>

      {/* 极速退款弹层 */}
      {isQuickRefund && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" {...bindBack()} />
          <div className="relative bg-white rounded-t-2xl p-5">
            <div className="text-center text-[16px] font-medium text-[#333]">商品未发货,享极速退款</div>
            <div className="text-center my-4">
              <PriceYuan
                value={order.paidAmount > 0 ? order.paidAmount : order.itemTotal}
                className="text-[28px] text-[#E22E1F]"
                symbolClass="text-[16px]"
              />
            </div>
            <div className="text-center text-[12px] text-[#999] mb-4">款项将原路退回,预计 1-3 个工作日到账</div>
            <button
              {...bindTap({ kind: 'action', id: 'orderdetail.quickrefund.confirm' }, {
                onTrigger: () => { confirmQuickRefund(order.id); showToast('退款成功'); back(); },
              })}
              className="w-full h-11 rounded-full bg-gradient-to-r from-[#FF4D2E] to-[#E22E1F] text-white font-medium"
            >确认退款</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 text-[13px]">
      <span className="text-[#999]">{label}</span>
      <span>{value}</span>
    </div>
  );
}
