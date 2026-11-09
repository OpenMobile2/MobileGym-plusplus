import React from 'react';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { useCtripStrings } from '../hooks/useCtripStrings';
import { TopBar, Price, useToast } from '../components/ui';
import { PAY_METHODS, WONTFIX_TOAST } from '../constants';
import type { ActivityResult } from '@/os/types/manifest';
import type { CtripStringKey } from '../res/strings';

/** 收银台(spec cashier.main)。支付宝走 startActivityForResult；其他方式本地 payPending。 */
export default function CashierMainPage() {
  const { bindTap, go, backOr } = useCtripGestures();
  const s = useCtripStrings();
  const [toast, showToast] = useToast();
  const pending = useCtripStore((st) => st._pendingOrder);
  const user = useCtripStore((st) => st.user);
  const payPending = useCtripStore((st) => st.payPending);
  const [method, setMethod] = React.useState('bankcard');

  const amount = pending?.amount ?? 0;
  const pointsCut = Math.min(62, Math.floor(amount / 10));

  const doPay = () => {
    if (method === 'alipay') {
      const launched = window.__OS__?.startActivityForResult?.(
        'alipay',
        {
          action: 'ACTION_PAY',
          scheme: 'alipays',
          data: {
            amount,
            orderId: pending?.id || `ctrip-${amount}`,
            merchantName: '携程旅行',
            subject: pending?.title || s.cashierTitle,
          },
        },
        (result: ActivityResult) => {
          if (result.resultCode === 'OK') {
            payPending('alipay');
            go('cashier.pay');
          }
        },
      );
      if (launched) return;
    }
    payPending('bankcard');
    go('cashier.pay');
  };

  if (!pending) {
    return (
      <div className="flex h-full flex-col bg-app-bg">
        <TopBar title={s.cashierTitle} backTo="/orders" />
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="text-[16px] font-semibold text-app-text">{s.t('当前没有待支付订单')}</div>
          <div className="mt-2 text-[13px] text-app-text-muted">{s.t('该订单可能已支付、取消或退款')}</div>
          <button
            type="button"
            onClick={() => backOr('/orders')}
            className="mt-5 rounded-full border-none bg-app-primary px-8 py-2.5 text-[14px] text-white"
          >{s.t('返回订单')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-app-bg">
      <TopBar title={s.cashierTitle} />
      <div className="flex-1 overflow-y-auto pb-16" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="bg-app-surface px-4 py-6 text-center">
          <div className="text-[13px] text-app-text-muted">{s.payAmount}</div>
          <div className="mt-1"><Price value={amount} size="l" className="text-[30px]" /></div>
          {pending && <div className="text-[12px] text-app-text-muted mt-1 line-clamp-1">{pending.title}</div>}
        </div>

        <div className="bg-[#FFF7E0] mx-3 mt-2 rounded-lg px-3 py-2 flex items-center justify-between">
          <span className="text-[12px] text-[#B8860B]">{s.pointsBanner.replace('{points}', String(user.points))}</span>
          <span className="text-[12px] text-[#B8860B]">{s.pointsCut.replace('{amount}', String(pointsCut))}</span>
        </div>

        <div className="bg-app-surface mt-2">
          <div className="px-4 py-2 text-[13px] text-app-text-muted">{s.selectPayMethod}</div>
          {PAY_METHODS.map((m) => (
            <button
              key={m.id}
              {...bindTap({ kind: 'action', id: 'cashier.method.select.bankcard' }, { params: { method: m.id }, onTrigger: () => setMethod(m.id) })}
              className="w-full flex items-center justify-between px-4 py-3.5 border-b border-app-border bg-transparent border-x-0 border-t-0 cursor-pointer text-left"
            >
              <div>
                <div className="text-[15px] text-app-text">{s[m.labelKey as CtripStringKey]}</div>
                {m.subKey ? (
                  <div className="text-[11px] text-[#FF6A2C]">
                    {s[m.subKey as CtripStringKey]}{m.recommend ? ` · ${s.recommend}` : ''}
                  </div>
                ) : null}
              </div>
              <span className={`w-5 h-5 rounded-full border text-[12px] leading-4 text-center ${method === m.id ? 'bg-app-primary border-app-primary text-white' : 'border-[#CCCCCC] text-transparent'}`}>✓</span>
            </button>
          ))}
          <button {...bindTap({ kind: 'action', id: 'cashier.changecard.wontfix' }, { onTrigger: () => showToast(WONTFIX_TOAST) })} className="w-full text-left px-4 py-3 text-[13px] text-app-primary bg-transparent border-none cursor-pointer">{s.changeCard}</button>
        </div>

        <div className="bg-app-surface mt-2 px-4 py-3 text-[13px] text-app-text-muted">{s.installmentHint}</div>
      </div>

      <div className="shrink-0 bg-app-surface border-t border-app-border flex items-center px-3 py-2.5">
        <div className="mr-auto"><Price value={amount} size="m" /></div>
        <button
          {...bindTap({ kind: 'action', id: 'cashier.pay' }, { onTrigger: doPay })}
          className="rounded-full bg-gradient-to-r from-[#FF9F45] to-[#FF6A2C] text-white text-[15px] font-medium px-10 py-2.5 border-none cursor-pointer"
        >{method === 'alipay' ? s.payWithAlipay : s.confirmPay} ¥{amount}</button>
      </div>
      {toast}
    </div>
  );
}
