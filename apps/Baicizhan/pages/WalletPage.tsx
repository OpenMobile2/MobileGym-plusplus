import React, { useState } from 'react';
import type { ActivityResult } from '@/os/types/manifest';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { PageHeader } from '../components/common';

const AMOUNTS = [1, 6, 18, 40, 45, 50, 68, 158, 698];

export default function WalletPage() {
  const s = useStrings();
  const { action } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const [sel, setSel] = useState(1);
  return (
    <div className="flex h-full flex-col bg-white" data-status-bar-foreground="dark">
      <PageHeader title="我的账户" />
      <div className="min-h-0 flex-1 overflow-y-auto pb-6" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="flex items-center bg-[#FBF3DC] px-5 py-6">
          <div><div className="text-3xl font-bold text-[#33405C]">{st.coins}</div><div className="mt-1 text-xs text-[#9AA5B1]">金币 · 用于付费内容的购买</div></div>
          <div className="ml-auto text-4xl">🎓</div>
        </div>
        <div className="px-4 pt-4 text-sm font-semibold text-[#33405C]">充值</div>
        <div className="grid grid-cols-3 gap-3 p-4">
          {AMOUNTS.map((a) => {
            const on = a === sel;
            return (
              <button key={a} {...action('wallet.amount.pick', () => setSel(a), { params: { amount: a } })}
                className="rounded-xl py-4 text-center" style={{ background: on ? '#EAF0FF' : '#F7F8FA', outline: on ? `1px solid ${colors.primary}` : 'none' }}>
                <div className="text-base font-bold" style={{ color: on ? colors.primary : '#33405C' }}>{a} 金币</div>
                <div className="text-[10px] text-[#9AA5B1]">{a} 元</div>
              </button>
            );
          })}
        </div>
        <div className="px-4">
          <button {...action('wallet.recharge.system', () => {
            const launched = window.__OS__?.startActivityForResult?.(
              'alipay',
              {
                action: 'ACTION_PAY',
                scheme: 'alipays',
                data: { amount: sel, orderId: `bcz-wallet-${sel}`, merchantName: '百词斩', subject: `${sel}金币充值`, source: 'baicizhan' },
              },
              (result: ActivityResult) => { if (result.resultCode === 'OK') st.rechargeCoins(sel); },
            );
            if (!launched) st.showToast(s.notAvailable);
          })} className="w-full rounded-full py-3.5 text-sm font-semibold text-white" style={{ background: colors.primary }}>确认充值</button>
        </div>
        <div className="px-5 pt-4 text-[11px] leading-5 text-[#9AA5B1]">
          1. 金币的充值兑换比例为:1 金币 = 1.00 元人民币;<br />
          2. 金币仅可用于购买百词斩 App 内的学习课程(不含实物商品);<br />
          3. 金币充值后不会过期,但无法退款、提现和转赠他人。
        </div>
      </div>
    </div>
  );
}
