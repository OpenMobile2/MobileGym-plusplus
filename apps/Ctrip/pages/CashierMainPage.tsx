import React from 'react';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { TopBar, Price, useToast } from '../components/ui';
import { PAY_METHODS, WONTFIX_TOAST } from '../constants';

/** 收银台(spec cashier.main)。支付方式单选;支付→success(payPending 生成订单,不真实扣款,Q2)。 */
export default function CashierMainPage() {
  const { bindTap } = useCtripGestures();
  const [toast, showToast] = useToast();
  const pending = useCtripStore((s) => s._pendingOrder);
  const user = useCtripStore((s) => s.user);
  const payPending = useCtripStore((s) => s.payPending);
  const [method, setMethod] = React.useState('bankcard');

  const amount = pending?.amount ?? 0;
  const pointsCut = Math.min(62, Math.floor(amount / 10));

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title="收银台" />
      <div className="flex-1 overflow-y-auto pb-16" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 金额 */}
        <div className="bg-white px-4 py-6 text-center">
          <div className="text-[13px] text-[#999999]">支付金额</div>
          <div className="mt-1"><Price value={amount} size="l" className="text-[30px]" /></div>
          {pending && <div className="text-[12px] text-[#999999] mt-1 line-clamp-1">{pending.title}</div>}
        </div>

        {/* 积分权益 */}
        <div className="bg-[#FFF7E0] mx-3 mt-2 rounded-lg px-3 py-2 flex items-center justify-between">
          <span className="text-[12px] text-[#B8860B]">积分当钱花 · 当前{user.points}积分</span>
          <span className="text-[12px] text-[#B8860B]">本单可抵 ¥{pointsCut}</span>
        </div>

        {/* 支付方式 */}
        <div className="bg-white mt-2">
          <div className="px-4 py-2 text-[13px] text-[#999999]">选择支付方式</div>
          {PAY_METHODS.map((m) => (
            <button
              key={m.id}
              {...bindTap({ kind: 'action', id: 'cashier.method.select.bankcard' }, { params: { method: m.id }, onTrigger: () => setMethod(m.id) })}
              className="w-full flex items-center justify-between px-4 py-3.5 border-b border-[#F5F5F5] bg-transparent border-x-0 border-t-0 cursor-pointer text-left"
            >
              <div>
                <div className="text-[15px] text-[#222222]">{m.label}</div>
                {m.sub && <div className="text-[11px] text-[#FF6A2C]">{m.sub}{m.recommend ? ' · 推荐' : ''}</div>}
              </div>
              <span className={`w-5 h-5 rounded-full border text-[12px] leading-4 text-center ${method === m.id ? 'bg-[#0086F6] border-[#0086F6] text-white' : 'border-[#CCCCCC] text-transparent'}`}>✓</span>
            </button>
          ))}
          <button {...bindTap({ kind: 'action', id: 'cashier.changecard.wontfix' }, { onTrigger: () => showToast(WONTFIX_TOAST) })} className="w-full text-left px-4 py-3 text-[13px] text-[#0086F6] bg-transparent border-none cursor-pointer">换卡支付 / 其他支付方式 ›</button>
        </div>

        {/* 分期 */}
        <div className="bg-white mt-2 px-4 py-3 text-[13px] text-[#666666]">花呗分期 · 最高12期,国家贴息可享免息(演示)</div>
      </div>

      {/* 底部支付 */}
      <div className="shrink-0 bg-white border-t border-[#EEEEEE] flex items-center px-3 py-2.5">
        <div className="mr-auto"><Price value={amount} size="m" /></div>
        <button
          {...bindTap('cashier.pay', { beforeTrigger: () => payPending() })}
          className="rounded-full bg-gradient-to-r from-[#FF9F45] to-[#FF6A2C] text-white text-[15px] font-medium px-10 py-2.5 border-none cursor-pointer"
        >{PAY_METHODS.find((m) => m.id === method)?.id === 'alipay' ? '支付宝支付' : '确认支付'} ¥{amount}</button>
      </div>
      {toast}
    </div>
  );
}
