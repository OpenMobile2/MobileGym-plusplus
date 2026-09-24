import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { useDianpingGestures } from '../hooks/useDianpingGestures';
import { useDianpingStore } from '../state';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcBack } from '../res/icons';

const METHODS = [
  { id: 'wechat', labelKey: 'payWechat' as const },
  { id: 'alipay', labelKey: 'payAlipay' as const },
];

export default function OrderPayPage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindBack, action, go } = useDianpingGestures();
  const [sp] = useSearchParams();
  const orderId = sp.get('orderId') || '';
  const order = useDianpingStore((st) => st.orders.find((o) => o.id === orderId));
  const payOrder = useDianpingStore((st) => st.payOrder);
  const showToast = useDianpingStore((st) => st.showToast);
  const [method, setMethod] = useState('wechat');
  const payingOrderIdRef = useRef<string | null>(null);
  const wechatPaidRef = useRef(false);

  useEffect(() => {
    const unregister = window.__OS__?.broadcast?.registerReceiver?.('dianping.PAY_RESULT', (intent) => {
      const payingOrderId = payingOrderIdRef.current;
      if (intent?.data?.resultCode !== 'OK' || !payingOrderId) return;
      payOrder(payingOrderId, 'wechat');
      wechatPaidRef.current = true;
    });
    return () => unregister?.();
  }, [payOrder]);

  if (!order) {
    return (
      <div className="p-4">
        <button type="button" className="cursor-pointer border-none bg-transparent" {...bindBack()}>
          <IcBack size={22} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-(--app-c-page-bg)" data-status-bar-foreground="dark">
      <div className="flex h-11 items-center gap-1 bg-(--app-c-card-bg) px-1">
        <button type="button" className="cursor-pointer border-none bg-transparent p-1.5" {...bindBack()}>
          <IcBack size={22} />
        </button>
        <div className="text-[16px] font-semibold">{s.confirmPay}</div>
      </div>
      <div
        className="flex-1 overflow-y-auto px-3 pt-4"
        data-scroll-container="order-pay"
        data-scroll-direction="vertical"
      >
        <div className="rounded-[12px] bg-(--app-c-card-bg) py-6 text-center">
          <div className="text-[13px] text-(--app-c-text-muted)">{order.dealTitle}</div>
          <div className="mt-2 text-[32px] font-bold text-(--app-c-text-primary)">
            <span className="text-[18px]">¥</span>
            {order.payAmount}
          </div>
        </div>
        <div className="mt-3 overflow-hidden rounded-[12px] bg-(--app-c-card-bg)">
          {METHODS.map((m) => (
            <button
              key={m.id}
              type="button"
              className="flex w-full cursor-pointer items-center justify-between border-none border-b border-[#F5F5F5] bg-transparent px-3 py-3.5 text-left"
              {...action('pay.method.select.target', () => setMethod(m.id), {
                params: { method: m.id },
              })}
            >
              <span className="text-[14px] text-(--app-c-text-primary)">{s[m.labelKey]}</span>
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                  method === m.id ? 'border-[#FF6633]' : 'border-[#DDD]'
                }`}
              >
                {method === m.id ? <span className="h-2.5 w-2.5 rounded-full bg-[#FF6633]" /> : null}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="border-t border-(--app-c-border) bg-(--app-c-card-bg) p-3">
        <button
          type="button"
          className="w-full cursor-pointer rounded-full border-none bg-[#FF6600] py-3 text-[15px] font-semibold text-white"
          {...action(
            'pay.confirm.do',
            () => {
              const target = method === 'wechat' ? 'wechat' : 'alipay';
              const scheme = method === 'wechat' ? 'weixin' : 'alipays';
              payingOrderIdRef.current = order.id;
              wechatPaidRef.current = false;
              const launched = window.__OS__?.startActivityForResult?.(
                target,
                {
                  action: 'ACTION_PAY',
                  scheme,
                  data: {
                    amount: order.payAmount,
                    orderId: order.id,
                    paymentMethod: method,
                    source: 'dianping',
                    merchantName: '大众点评',
                    subject: order.dealTitle,
                  },
                },
                (result) => {
                  const paid = result.resultCode === 'OK' || (method === 'wechat' && wechatPaidRef.current);
                  payingOrderIdRef.current = null;
                  if (!paid) return;
                  if (result.resultCode === 'OK') payOrder(order.id, method as 'wechat' | 'alipay');
                  go('pay.success', { orderId: order.id });
                },
              );
              if (!launched) {
                payingOrderIdRef.current = null;
                showToast(s.notOpen);
              }
            },
            { params: { orderId: order.id } },
          )}
        >
          {s.confirmPay}
        </button>
      </div>
    </div>
  );
}
