import React, { useRef, useState } from 'react';
import { Price } from './ui';
import { useTaobaoGestures } from '../hooks/useTaobaoGestures';
import { useStrings } from '../hooks/useStrings';
import type { TaobaoStringKey } from '../res/strings';
import { PayPinCapture } from '@/os/components/PayPinCapture';

const CHANNEL_KEYS: TaobaoStringKey[] = ['payChannelBankCard', 'payChannelHuabei', 'payChannelFamilyCard'];

/**
 * 支付密码弹层(模拟,IMG_8746)。任意 6 位密码即支付成功。
 * 输满 6 位 → onSuccess;关闭 → onClose(订单留在待付款,spec judge)。
 */
export function PayPanel({
  amount, onSuccess, onClose,
}: {
  amount: number;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const { bindTap } = useTaobaoGestures();
  const s = useStrings();
  const [digits, setDigits] = useState('');
  const [channel, setChannel] = useState(0);
  const channels = CHANNEL_KEYS.map((k) => s[k]);
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
    <div className="absolute inset-0 z-40">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute left-0 right-0 bottom-0 bg-app-surface rounded-t-2xl" data-keep-keyboard>
        <PayPinCapture value={digits} onChange={apply} />
        <div className="relative pt-4 pb-2 text-center">
          <button
            {...bindTap({ kind: 'action', id: 'pay.panel.close' }, { onTrigger: onClose })}
            className="absolute left-3 top-3 w-7 h-7 rounded-full bg-[#F5F5F5] text-app-text-muted border-none cursor-pointer"
          >
            ✕
          </button>
          <div className="text-[15px] font-semibold">{s.enterPayPasswordTitle}</div>
          <div className="mt-2"><Price value={amount} size="l" /></div>
          <div className="text-[11px] text-[#00B578] mt-1">{s.payGreenEnergyText}</div>
        </div>

        {/* 渠道 */}
        <div className="px-6">
          {channels.map((c, i) => (
            <button
              key={c}
              {...bindTap({ kind: 'action', id: 'pay.channel.select.option' }, {
                params: { channel: c }, onTrigger: () => setChannel(i),
              })}
              className="w-full flex items-center justify-between h-9 bg-transparent border-none cursor-pointer text-[13px]"
            >
              <span className="text-app-text">{c}</span>
              {channel === i && <span className="text-[#1677FF]">✓</span>}
            </button>
          ))}
        </div>

        {/* 密码格 */}
        <div className="flex justify-center gap-2 mt-2 px-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              className={`w-11 h-11 rounded-lg border flex items-center justify-center text-[20px] ${
                i === digits.length ? 'border-[#1677FF]' : 'border-[#E5E5E5]'
              }`}
            >
              {i < digits.length ? '●' : ''}
            </span>
          ))}
        </div>

        {/* 数字键盘 */}
        <div
          {...bindTap({ kind: 'action', id: 'pay.password.input' }, { onTrigger: () => {} })}
          className="grid grid-cols-3 gap-px bg-[#E5E5E5] mt-4"
        >
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, i) => (
            <button
              key={i}
              disabled={k === ''}
              onClick={() => {
                if (k === '⌫') setDigits((d) => d.slice(0, -1));
                else if (k) press(k);
              }}
              className="h-12 bg-app-surface text-[20px] font-medium border-none cursor-pointer active:bg-[#F5F5F5] disabled:bg-[#FAFAFA]"
            >
              {k}
            </button>
          ))}
        </div>
        <div className="h-4 bg-app-surface" />
      </div>
    </div>
  );
}
