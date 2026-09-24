import React from 'react';
import { useParams } from 'react-router-dom';
import { useXianyuStore } from '../state';
import { useXianyuGestures } from '../hooks/useXianyuGestures';
import { TopBar } from '../components/TopBar';
import { ItemImage } from '../components/ItemImage';
import { BottomSheet, usePanel, useToast, Price } from '../components/ui';
import type { XyOrderStatus } from '../types';

const STATUS_TEXT: Record<XyOrderStatus, string> = {
  pendingPayment: '等待付款',
  pendingShip: '等待卖家发货',
  pendingReceipt: '等待收货',
  pendingReview: '待评价',
  completed: '交易成功',
  refunding: '退款中',
  closed: '交易关闭',
};

const CANCEL_REASONS = ['不想买了', '拍错了/多拍了', '协商一致退款', '其他原因'];

export default function OrderDetailPage() {
  const { orderId = '' } = useParams();
  const { bindTap, bindBack, back } = useXianyuGestures();
  const [toast, showToast] = useToast();
  const panel = usePanel('panel');

  const order = useXianyuStore((s) => s.orders.find((o) => o.id === orderId));
  const cancelOrder = useXianyuStore((s) => s.cancelOrder);
  const deleteOrder = useXianyuStore((s) => s.deleteOrder);
  const confirmReceipt = useXianyuStore((s) => s.confirmReceipt);

  if (!order) {
    return (
      <div className="flex flex-col h-full bg-[#F4F4F4]" data-status-bar-foreground="dark">
        <TopBar title="订单详情" />
        <div className="flex-1 flex items-center justify-center text-[#999] text-sm">订单不存在或已删除</div>
      </div>
    );
  }

  const o = order;

  return (
    <div className="flex flex-col h-full bg-[#F4F4F4] relative" data-status-bar-foreground="dark">
      <TopBar title="订单详情" />

      <div className="flex-1 overflow-y-auto" data-scroll-container="OrderDetailPage-main" data-scroll-direction="vertical">
        {/* 大状态 */}
        <div className="bg-white px-4 py-5">
          <div className="text-[20px] font-bold text-[#111]">{STATUS_TEXT[o.status]}</div>
          {o.status === 'pendingPayment' && <div className="text-[13px] text-[#999] mt-1">请尽快完成付款</div>}
        </div>

        {/* 地址快照 */}
        {o.addressSnapshot && (
          <div className="bg-white mt-2 px-4 py-3">
            <div className="text-[14px] text-[#111]">
              <span className="font-medium">{o.addressSnapshot.name}</span>
              <span className="ml-2 text-[#666]">{o.addressSnapshot.phone}</span>
            </div>
            <div className="text-[12px] text-[#666] mt-0.5">{o.addressSnapshot.full}</div>
          </div>
        )}

        {/* 商品行 */}
        <div className="bg-white mt-2 px-4 py-3 flex gap-2">
          <ItemImage seed={o.itemId} src={o.image} label={o.title} className="w-16 h-16 rounded-lg" />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] text-[#1A1A1A] line-clamp-2">{o.title}</div>
            <div className="text-[12px] text-[#999] mt-1">{o.sellerName}</div>
          </div>
          <Price value={o.price} size={15} />
        </div>

        {/* 金额明细 */}
        <div className="bg-white mt-2 px-4 py-2 text-[13px]">
          <div className="flex justify-between py-1"><span className="text-[#666]">商品金额</span><span>¥{o.price}</span></div>
          <div className="flex justify-between py-1"><span className="text-[#666]">运费</span><span>包邮</span></div>
          <div className="flex justify-between py-1"><span className="text-[#666]">实付款</span><Price value={o.price} size={15} /></div>
        </div>

        {/* 订单信息 */}
        <div className="bg-white mt-2 px-4 py-2 text-[12px] text-[#999]">
          <div className="py-0.5">订单编号:{o.orderNo}</div>
          {o.payMethod && <div className="py-0.5">支付方式:{o.payMethod}</div>}
        </div>
      </div>

      {/* 底部按钮组(按状态)。注:去评价仅在 orders.bought 声明(review.write-open from),此处不放 */}
      {(o.status === 'pendingPayment' || o.status === 'closed' || o.status === 'pendingReceipt'
        || o.status === 'completed') && (
        <div className="shrink-0 bg-white border-t border-[#EEE] flex items-center justify-end px-3 py-2 gap-2">
          {o.status === 'pendingPayment' && (
            <>
              <button
                {...bindTap({ kind: 'action', id: 'order.cancel.open' }, { onTrigger: () => panel.open('cancel') })}
                className="text-[13px] px-4 py-1.5 rounded-full border border-[#DDD] bg-white text-[#333] cursor-pointer"
              >取消订单</button>
              <button
                {...bindTap('order.pay-open', { params: { orderId: o.id } })}
                className="text-[13px] px-5 py-1.5 rounded-full border-none text-white cursor-pointer"
                style={{ background: 'linear-gradient(90deg,#FF6A00,#FF3000)' }}
              >去付款</button>
            </>
          )}
          {o.status === 'closed' && (
            <>
              <button
                {...bindTap({ kind: 'action', id: 'order.delete.commit' }, { onTrigger: () => { deleteOrder(o.id); back(); } })}
                className="text-[13px] px-4 py-1.5 rounded-full border border-[#DDD] bg-white text-[#333] cursor-pointer"
              >删除订单</button>
              <button
                {...bindTap('home.item-open', { params: { itemId: o.itemId } })}
                className="text-[13px] px-5 py-1.5 rounded-full border-none text-white cursor-pointer"
                style={{ background: 'linear-gradient(90deg,#FF6A00,#FF3000)' }}
              >再次购买</button>
            </>
          )}
          {o.status === 'pendingReceipt' && (
            <button
              onClick={() => { confirmReceipt(o.id); showToast('已确认收货'); }}
              className="text-[13px] px-5 py-1.5 rounded-full border-none text-white cursor-pointer"
              style={{ background: 'linear-gradient(90deg,#FF6A00,#FF3000)' }}
            >确认收货</button>
          )}
          {o.status === 'completed' && (
            <button
              {...bindTap('review.detail-open', { params: { orderId: o.id } })}
              className="text-[13px] px-5 py-1.5 rounded-full border border-[#DDD] bg-white text-[#333] cursor-pointer"
            >查看评价</button>
          )}
        </div>
      )}

      {/* 取消原因弹层 */}
      {panel.value === 'cancel' && (
        <BottomSheet title="选择取消原因" onClose={panel.close} closeBinding={bindBack()}>
          <div className="px-2 py-1">
            {CANCEL_REASONS.map((reason) => (
              <button
                key={reason}
                {...bindTap(
                  { kind: 'action', id: 'order.cancelReason.select.target' },
                  { params: { target: reason }, onTrigger: () => { cancelOrder(o.id, reason); panel.close(); showToast('订单已取消'); } },
                )}
                className="w-full text-left text-[14px] text-[#333] px-3 py-3.5 border-b border-[#F4F4F4] bg-transparent border-x-0 border-t-0 cursor-pointer"
              >{reason}</button>
            ))}
          </div>
        </BottomSheet>
      )}
      {toast}
    </div>
  );
}
