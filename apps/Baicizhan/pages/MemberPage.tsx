import React, { useState } from 'react';
import type { ActivityResult } from '@/os/types/manifest';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { PageHeader } from '../components/common';

const PLANS = [
  { key: 'trial', id: 'member.plan.select.trial', title: '免费3天', price: '¥0', amount: 0, sub: '无任何付费!' },
  { key: 'monthly', id: 'member.plan.select.monthly', title: '连续包月', price: '¥9', amount: 9, sub: '仅0.3元/天' },
  { key: 'yearly', id: 'member.plan.select.yearly', title: '连续包年', price: '¥36', amount: 36, sub: '仅12元/月' },
] as const;

export default function MemberPage() {
  const s = useStrings();
  const { action, bindTap } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const toast = () => st.showToast(s.notAvailable);
  const [plan, setPlan] = useState<(typeof PLANS)[number]['key']>('trial');
  const selected = PLANS.find((item) => item.key === plan) ?? PLANS[0];
  const activePlan = st.memberships.proPlan;
  return (
    <div className="flex h-full flex-col" style={{ background: '#D7E6F7' }} data-status-bar-foreground="dark">
      <PageHeader title="Pro会员" />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="flex items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl">🐶</div>
          <div className="text-lg font-bold text-[#33405C]">{st.profile.name} {activePlan && <span className="rounded bg-[#2F58E8] px-1.5 text-xs text-white">PRO · 已开通</span>}</div>
        </div>
        <div className="mt-4 flex gap-3">
          {PLANS.map((p) => {
            const on = p.key === plan;
            return (
              <button key={p.key} {...action(p.id, () => setPlan(p.key))}
                className="flex-1 rounded-2xl p-3 text-center" style={{ background: '#fff', outline: on ? '2px solid #2F58E8' : '1px solid #E4E7EC' }}>
                <div className="text-xs text-[#5B6B85]">{p.title}</div>
                <div className="text-xl font-bold text-[#2F58E8]">{p.price}</div>
                <div className="text-[10px] text-[#9AA5B1]">{p.sub}</div>
              </button>
            );
          })}
        </div>
        <div className="mt-4 rounded-2xl bg-[#2A3B7A] p-4 text-center text-white">
          <div className="text-sm">现在开通再得 <b className="text-[#FFD84D]">5000铜板</b></div>
        </div>
        <button {...action('member.buy.system', () => {
          if (selected.amount === 0) {
            st.activatePro(selected.key);
            return;
          }
          const launched = window.__OS__?.startActivityForResult?.(
            'alipay',
            {
              action: 'ACTION_PAY',
              scheme: 'alipays',
              data: { amount: selected.amount, orderId: `bcz-member-${selected.key}`, merchantName: '百词斩', subject: `百词斩PRO${selected.title}`, source: 'baicizhan' },
            },
            (result: ActivityResult) => { if (result.resultCode === 'OK') st.activatePro(selected.key); },
          );
          if (!launched) toast();
        })} className="mt-4 w-full rounded-full bg-[#2F58E8] py-3.5 text-sm font-semibold text-white">确认协议并以 {selected.price} 开通</button>
        <div className="mt-2 text-center text-xs text-[#9AA5B1]">开通前请阅读 <button {...bindTap('member.unavailable.open', { params: { feature: '会员服务协议' } })} className="text-[#5B78C8]">《会员服务协议》</button> 与 <button {...bindTap('member.unavailable.open', { params: { feature: '自动续费协议' } })} className="text-[#5B78C8]">《自动续费协议》</button></div>
      </div>
    </div>
  );
}
