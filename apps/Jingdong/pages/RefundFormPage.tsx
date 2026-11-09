import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useJingdongGestures } from '../hooks/useJingdongGestures';
import { useJingdongStore } from '../state';
import { TopBar, Img, EmptyState, showToast } from '../components/ui';
import { IcHeadphones, IcPhone } from '../res/icons';

const REASONS = [
  '不想要了',
  '商品缺货/少送/错送',
  '整单未收到',
  '商品降价',
  '拍错/多拍/买多了',
  '商品质量问题',
  '包装破损/污渍',
  '其他',
];

export function RefundFormPage() {
  const { bindTap, back } = useJingdongGestures();
  const [searchParams] = useSearchParams();
  const orders = useJingdongStore((s) => s.orders);
  const shops = useJingdongStore((s) => s.shops);
  const submitRefund = useJingdongStore((s) => s.submitRefund);

  const paramId = searchParams.get('orderId');
  const order = paramId
    ? orders.find((o) => o.id === paramId)
    : orders.find((o) => o.status === 'undelivered' || o.status === 'done');

  const [reason, setReason] = useState<string>('');

  if (!order) {
    return (
      <div className="flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="dark">
        <TopBar title="申请退款" className="pt-10" />
        <EmptyState text="暂无可退款订单" />
      </div>
    );
  }

  const shop = shops.find((s) => s.id === order.shopId);
  const first = order.lines[0];
  const totalQty = order.lines.reduce((n, l) => n + l.qty, 0);

  const submit = () => {
    if (!reason) {
      showToast('请先选择您遇到的问题');
      return;
    }
    submitRefund(order.id, reason);
    showToast('退款申请已提交');
    back();
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <TopBar title="申请退款" className="pt-10" />
      <div className="flex-1 overflow-y-auto" data-scroll-container="refund-scroll" data-scroll-direction="vertical">
        {/* 退款商品 + 联系商家 */}
        <div className="mx-3 mt-2 bg-white rounded-xl p-4">
          <div className="flex items-center gap-2.5">
            {shop?.logo ? (
              <Img src={shop.logo} className="w-10 h-10 rounded-lg object-cover bg-[#F5F5F5]" alt={order.shopName} />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-[#F5F5F5]" />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-semibold text-[#1A1A1A] truncate">{order.shopName}</div>
              <div className="text-[12px] text-[#999] mt-0.5">推荐联系商家,解决速度更快</div>
            </div>
            <button {...bindTap('refund.cs-open', { params: { chatId: 'ch_cs' } })} aria-label="在线咨询" className="w-9 h-9 rounded-full bg-[#F3F4F6] flex items-center justify-center text-[#555]">
              <IcHeadphones size={18} />
            </button>
            <button {...bindTap('refund.cs-open', { params: { chatId: 'ch_cs' } })} aria-label="电话联系" className="w-9 h-9 rounded-full bg-[#F3F4F6] flex items-center justify-center text-[#555]">
              <IcPhone size={18} />
            </button>
          </div>
          <div className="flex items-center gap-2.5 mt-4 pt-3 border-t border-[#F2F2F2]">
            <Img src={first.image} className="w-14 h-14 rounded-lg object-cover bg-[#F5F5F5] shrink-0" alt={first.title} />
            <div className="flex-1 min-w-0">
              <div className="text-[14px] text-[#1A1A1A] line-clamp-1">{first.title}</div>
              <div className="text-[12px] text-[#999] mt-1">共{totalQty}件商品</div>
            </div>
          </div>
        </div>

        {/* 退款原因 */}
        <div className="mx-3 mt-3 bg-white rounded-xl p-4">
          <div className="text-[16px] font-bold text-[#1A1A1A]">请选择您遇到的问题 <span className="text-[#E1251B]">*</span></div>
          <div className="text-[12px] text-[#999] mt-1 mb-1">请选择真实原因,以免影响处理结果</div>
          {REASONS.map((r) => {
            const active = reason === r;
            return (
              <button
                key={r}
                {...bindTap({ kind: 'action', id: 'refund.reason.select.item' }, { params: { reasonId: r }, onTrigger: () => setReason(r) })}
                className="w-full flex items-center justify-between py-3.5 border-b border-[#F5F5F5] last:border-0 text-left"
              >
                <span className="text-[15px] text-[#333]">{r}</span>
                <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${active ? 'border-[#E1251B] bg-[#E1251B]' : 'border-[#CCC]'}`}>
                  {active && <span className="w-2 h-2 rounded-full bg-white" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 提交 */}
      <div className="shrink-0 bg-[#F5F5F5] px-3 py-2.5">
        <button
          {...bindTap({ kind: 'action', id: 'refund.form.submit' }, { onTrigger: submit })}
          className={`w-full h-11 rounded-full text-[16px] font-medium ${reason ? 'bg-[#E1251B] text-white' : 'bg-[#CCC] text-white'}`}
        >
          {reason ? '提交申请' : '请先选择您遇到的问题'}
        </button>
      </div>
    </div>
  );
}
