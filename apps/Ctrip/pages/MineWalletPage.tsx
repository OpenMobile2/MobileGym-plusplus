import React from 'react';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { useCtripStrings } from '../hooks/useCtripStrings';
import { TopBar, useToast } from '../components/ui';
import { WONTFIX_TOAST } from '../constants';

/** 我的钱包(spec mine.wallet)。现金/返现/礼品卡/信贷额度展示;条目wontfix。 */
export default function MineWalletPage() {
  const s = useCtripStrings();
  const { bindTap } = useCtripGestures();
  const [toast, showToast] = useToast();
  const user = useCtripStore((s) => s.user);

  const ITEMS = [
    { label: s.t('现金账户'), value: '¥0.00' },
    { label: s.t('返现红包'), value: '¥28.00' },
    { label: s.t('礼品卡'), value: `${user.coupons} 张` },
    { label: s.t('优惠券'), value: `${user.coupons} 张` },
    { label: s.t('拿去花(信贷额度)'), value: s.t('额度 ¥20000') },
  ];

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title={s.t('我的钱包')} />
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="mx-2 mt-2 rounded-2xl bg-gradient-to-br from-[#33A5FF] to-[#0086F6] p-4 text-white">
          <div className="text-[12px] text-white/80">{s.t('返现红包可用余额')}</div>
          <div className="text-[28px] font-bold mt-1">¥28.00</div>
          <div className="text-[11px] text-white/80 mt-1">{s.t('来自历史订单返现，可在下单时抵扣')}</div>
        </div>
        <div className="bg-white mx-2 mt-2 rounded-xl">
          {ITEMS.map((it) => (
            <button
              key={it.label}
              {...bindTap({ kind: 'action', id: 'wallet.item.wontfix' }, { params: { item: it.label }, onTrigger: () => showToast(it.label === s.t('返现红包') ? s.t('返现红包可在酒店/机票下单收银台勾选抵扣') : WONTFIX_TOAST) })}
              className="w-full flex items-center justify-between px-4 py-3.5 border-b border-[#F2F2F2] last:border-0 bg-transparent border-x-0 border-t-0 cursor-pointer"
            >
              <span className="text-[15px] text-[#222222]">{it.label}</span>
              <span className="text-[13px] text-[#999999]">{it.value} ›</span>
            </button>
          ))}
        </div>
      </div>
      {toast}
    </div>
  );
}
