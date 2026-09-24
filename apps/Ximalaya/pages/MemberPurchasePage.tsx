import React, { useState } from 'react';
import { useXimalayaGestures } from '../hooks/useXimalayaGestures';
import { useXimalayaStrings } from '../hooks/useXimalayaStrings';
import { useXimalayaStore } from '../state';
import { Img, TopBar, showToast } from '../components/ui';
import { IcCheck } from '../res/icons';
import type { MemberPlan } from '../types';

const TIERS: { key: MemberPlan['tier']; label: string }[] = [
  { key: 'vip', label: 'VIP会员' },
  { key: 'platinum', label: 'VIP白金' },
  { key: 'svip', label: 'SVIP大师课' },
];
const PAY_METHODS = [
  { id: 'alipay', label: '支付宝', color: '#1677FF' },
  { id: 'wechat', label: '微信支付', color: '#07C160' },
];

export function MemberPurchasePage() {
  const { bindTap } = useXimalayaGestures();
  const s = useXimalayaStrings();
  const user = useXimalayaStore((st) => st.user);
  const plans = useXimalayaStore((st) => st.memberPlans);

  const [tier, setTier] = useState<MemberPlan['tier']>('vip');
  const tierPlans = plans.filter((p) => p.tier === tier);
  const [planId, setPlanId] = useState<string>(tierPlans[0]?.id ?? '');
  const [method, setMethod] = useState<string>('alipay');

  const selected = plans.find((p) => p.id === planId) ?? tierPlans[0];

  const switchTier = (t: MemberPlan['tier']) => {
    setTier(t);
    const first = plans.find((p) => p.tier === t);
    if (first) setPlanId(first.id);
  };

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F7F3EC]" data-status-bar-foreground="dark">
      <TopBar title="开通会员" transparent />
      <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
        {/* 用户 + 过期 */}
        <div className="mx-3 mt-1 rounded-2xl bg-gradient-to-br from-[#3A3140] to-[#241E28] p-4 flex items-center gap-3">
          <Img src={user.avatar} className="w-12 h-12 rounded-full object-cover border border-[#F5C36B]/60" />
          <div className="flex-1 min-w-0 text-white">
            <div className="text-[16px] font-semibold text-[#F5D9A0]">{user.name}</div>
            <div className="text-[12px] text-white/60 mt-0.5">{user.isVip ? 'VIP 会员生效中' : 'VIP 会员已过期'}</div>
          </div>
        </div>

        {/* 会员档 Tab */}
        <div className="flex items-center gap-2 px-3 mt-4">
          {TIERS.map((t) => {
            const active = t.key === tier;
            return (
              <button
                key={t.key}
                {...bindTap({ kind: 'action', id: 'purchase.tier.select.opt' }, { params: { tier: t.key }, onTrigger: () => switchTier(t.key) })}
                className={'flex-1 h-9 rounded-full text-[13px] font-medium ' + (active ? 'bg-[#2A2018] text-[#F5C36B]' : 'bg-white text-[#666]')}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* 套餐卡 */}
        <div className="px-3 mt-3 grid grid-cols-2 gap-3">
          {tierPlans.map((p) => {
            const active = p.id === planId;
            return (
              <button
                key={p.id}
                {...bindTap({ kind: 'action', id: 'purchase.plan.select.opt' }, { params: { planId: p.id }, onTrigger: () => setPlanId(p.id) })}
                className={'relative rounded-xl bg-white p-3 flex flex-col items-center border-2 ' + (active ? 'border-[#E7B85C]' : 'border-transparent')}
              >
                {p.badge && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] px-1.5 py-0.5 rounded-full bg-[#FE4543] text-white whitespace-nowrap">{p.badge}</span>
                )}
                <div className="text-[13px] text-[#333] mt-1">{p.name}</div>
                <div className="text-[20px] font-bold text-[#C4302B] mt-1">¥{p.price}</div>
                <div className="text-[11px] text-[#BBB] line-through">¥{p.originPrice}</div>
              </button>
            );
          })}
        </div>

        {/* 支付方式 */}
        <div className="mx-3 mt-4 rounded-xl bg-white overflow-hidden">
          {PAY_METHODS.map((m) => {
            const active = m.id === method;
            return (
              <button
                key={m.id}
                {...bindTap({ kind: 'action', id: 'purchase.paymethod.select.opt' }, { params: { method: m.id }, onTrigger: () => setMethod(m.id) })}
                className="w-full flex items-center justify-between px-4 py-3.5 border-b border-[#F5F5F5] last:border-0"
              >
                <span className="flex items-center gap-2 text-[15px] text-[#333]">
                  <span className="w-5 h-5 rounded-full" style={{ background: m.color }} />
                  {m.label}
                </span>
                <span className={'w-5 h-5 rounded-full flex items-center justify-center ' + (active ? 'bg-[#FE4543] text-white' : 'border border-[#DDD] text-transparent')}>
                  <IcCheck size={14} />
                </span>
              </button>
            );
          })}
        </div>

        {/* 联合会员 wontfix */}
        <button
          {...bindTap({ kind: 'action', id: 'purchase.union.wontfix' }, { onTrigger: () => showToast('该功能暂未开放') })}
          className="mx-3 mt-3 mb-3 w-[calc(100%-1.5rem)] rounded-xl bg-white px-4 py-3 flex items-center justify-between text-[14px] text-[#333]"
        >
          <span>联合会员套餐</span>
          <span className="text-[12px] text-[#999]">更多权益 ›</span>
        </button>
        <div className="h-24" />
      </div>

      {/* 底部开通条 */}
      <div className="shrink-0 bg-white border-t border-[#F0F0F0] px-4 py-3 flex items-center gap-3">
        <div className="flex-1">
          <div className="text-[18px] font-bold text-[#C4302B]">¥{selected?.price ?? 0}</div>
          <div className="text-[11px] text-[#999]">已选:{selected?.name ?? '—'}</div>
        </div>
        <button
          {...bindTap('purchase.confirm')}
          className="h-11 px-8 rounded-full bg-gradient-to-r from-[#FE4543] to-[#F5352E] text-white text-[15px] font-semibold"
        >
          {s.member_confirm}
        </button>
      </div>
    </div>
  );
}
