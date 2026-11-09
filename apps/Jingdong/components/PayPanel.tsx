import React, { useRef, useState } from 'react';
import { useJingdongGestures } from '../hooks/useJingdongGestures';
import { PriceYuan } from './ui';
import { PayPinCapture } from '@/os/components/PayPinCapture';

/**
 * 支付密码弹层。展示确认页已选支付方式(不可再选);
 * 任意输满 6 位 → onSuccess;关闭 → onClose(跳转待付款)。
 */
export function PayPanel({
  amount,
  payMethod,
  onSuccess,
  onClose,
}: {
  amount: number;
  payMethod: string;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const { bindTap } = useJingdongGestures();
  const [digits, setDigits] = useState('');
  const doneRef = useRef(false);

  const apply = (next: string) => {
    const clipped = next.replace(/\D/g, '').slice(0, 6);
    setDigits(clipped);
    if (clipped.length === 6 && !doneRef.current) {
      doneRef.current = true;
      window.setTimeout(onSuccess, 250);
    }
  };

  const press = (d: string) => apply(digits + d);

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <div
        {...bindTap({ kind: 'action', id: 'pay.panel.close' }, { onTrigger: onClose })}
        className="flex-1 bg-black/45"
      />
      <div className="relative bg-white rounded-t-2xl" data-keep-keyboard>
        <PayPinCapture value={digits} onChange={apply} />
        <div className="relative pt-4 pb-2 text-center">
          <button
            {...bindTap({ kind: 'action', id: 'pay.panel.close' }, { onTrigger: onClose })}
            aria-label="关闭"
            className="absolute left-3 top-3 w-7 h-7 rounded-full bg-[#F5F5F5] text-[#999] flex items-center justify-center text-[14px]"
          >
            ✕
          </button>
          <div className="text-[16px] font-semibold text-[#1A1A1A]">请输入支付密码</div>
          <div className="mt-2">
            <PriceYuan value={amount} className="text-[#E1251B] text-[26px]" />
          </div>
          <div className="mt-2 mx-5 flex items-center justify-between h-9 px-3 rounded-lg bg-[#F7F7F7]">
            <span className="text-[12px] text-[#999]">支付方式</span>
            <span className="text-[13px] text-[#1A1A1A] truncate max-w-[70%] text-right">{payMethod || '京东支付'}</span>
          </div>
        </div>

        <div className="flex justify-center gap-2 mt-3 px-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              className={`w-11 h-11 rounded-lg border flex items-center justify-center text-[18px] ${
                i === digits.length ? 'border-[#E1251B]' : 'border-[#E5E5E5]'
              }`}
            >
              {i < digits.length ? '●' : ''}
            </span>
          ))}
        </div>

        <div
          {...bindTap({ kind: 'action', id: 'pay.password.input' }, { onTrigger: () => {} })}
          className="grid grid-cols-3 gap-px bg-[#E5E5E5] mt-4"
          data-action="pay.password.input"
        >
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, i) => (
            <button
              key={i}
              type="button"
              disabled={k === ''}
              onClick={() => {
                if (k === '⌫') setDigits((d) => d.slice(0, -1));
                else if (k) press(k);
              }}
              className="h-12 bg-white text-[20px] font-medium disabled:bg-[#FAFAFA] active:bg-[#F5F5F5]"
            >
              {k}
            </button>
          ))}
        </div>
        <div className="h-4 bg-white" />
      </div>
    </div>
  );
}
