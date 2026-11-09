import React from 'react';
import { useXianyuStore } from '../state';
import { useXianyuGestures } from '../hooks/useXianyuGestures';
import { IcClose, IcCheck } from '../res/icons';

export default function PayPage() {
  const { bindTap, bindBack, go } = useXianyuGestures();
  const orders = useXianyuStore((s) => s.orders);
  const checkout = useXianyuStore((s) => s.checkout);
  const markOrderPaid = useXianyuStore((s) => s.markOrderPaid);
  const setCheckoutPayMethod = useXianyuStore((s) => s.setCheckoutPayMethod);

  // 最近一笔待付款订单(确认订单页刚 createOrder)
  const order = orders.find((o) => o.status === 'pendingPayment');
  if (!order) return <div className="flex flex-col h-full bg-white items-center justify-center text-[#999]">没有待支付订单</div>;

  const method = checkout?.payMethod ?? '支付宝';
  const methods = [
    { label: '支付宝', sub: '招商银行储蓄卡(0612)', icon: '💙' },
    { label: '余额', sub: '闲鱼余额 ¥1280.50', icon: '🐟' },
  ];

  return (
    <div className="flex flex-col h-full bg-white" data-status-bar-foreground="dark">
      <div className="h-11 flex items-center px-2 shrink-0">
        <button {...bindBack()} aria-label="关闭" className="bg-transparent border-none cursor-pointer"><IcClose size={22} className="text-[#111]" /></button>
        <div className="flex-1 text-center font-semibold text-[16px] text-[#111]">收银台</div>
        <div className="w-8" />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="text-center py-6">
          <div className="text-[13px] text-[#999]">支付宝担保交易</div>
          <div className="text-[34px] font-bold text-[#111] mt-1">¥{order.price}</div>
          <div className="text-[12px] text-[#999] mt-1">{order.title.slice(0, 18)}</div>
        </div>

        <div className="px-3">
          <div className="text-[13px] text-[#666] mb-1">选择支付方式</div>
          {methods.map((m) => (
            <button
              key={m.label}
              {...bindTap({ kind: 'action', id: 'order.bankCard.select.target' }, { params: { target: m.label === '支付宝' ? 'alipay' : 'balance' }, onTrigger: () => setCheckoutPayMethod(m.label) })}
              className="w-full flex items-center gap-3 py-3 bg-transparent border-none border-b border-[#F4F4F4] cursor-pointer"
            >
              <span className="text-[20px]">{m.icon}</span>
              <div className="flex-1 text-left"><div className="text-[14px] text-[#111]">{m.label}</div><div className="text-[11px] text-[#999]">{m.sub}</div></div>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center ${method === m.label ? 'bg-[#1677FF] text-white' : 'border border-[#CCC]'}`}>{method === m.label && <IcCheck size={14} />}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="shrink-0 px-4 pb-4 pt-2">
        <button
          {...bindTap({ kind: 'action', id: 'order.pay.confirm' }, {
            params: { orderId: order.id },
            onTrigger: () => {
              if (method === '支付宝') {
                const launched = window.__OS__?.startActivityForResult?.(
                  'alipay',
                  {
                    action: 'ACTION_PAY',
                    scheme: 'alipays',
                    data: {
                      amount: order.price,
                      orderId: order.id,
                      merchantName: '闲鱼',
                      subject: order.title,
                    },
                  },
                  (result) => {
                    if (result.resultCode === 'OK') {
                      markOrderPaid(order.id);
                      go('order.paySuccess-open', { orderId: order.id });
                    }
                  },
                );
                if (launched) return;
              }
              markOrderPaid(order.id);
              go('order.paySuccess-open', { orderId: order.id });
            },
          })}
          className="w-full h-12 rounded-full text-white text-[16px] font-semibold border-none cursor-pointer"
          style={{ background: 'linear-gradient(90deg,#FF6A00,#FF3000)' }}
        >极速付款 ¥{order.price}</button>
        <div className="text-center text-[11px] text-[#999] mt-2">模拟支付,不会真实扣款</div>
      </div>
    </div>
  );
}
