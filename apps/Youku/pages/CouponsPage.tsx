import React, { useState } from 'react';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { useYoukuStore } from '../state';
import { WONTFIX_TOAST } from '../constants';
import { IcBack, IcService, EmptyBox } from './me/meShared';

type CouponTab = 'all' | 'welfare' | 'virtual' | 'goods' | 'offline';
const TABS: Array<{ id: CouponTab; label: string }> = [
  { id: 'all', label: '全部' },
  { id: 'welfare', label: '福利券' },
  { id: 'virtual', label: '虚拟资产' },
  { id: 'goods', label: '实物商品' },
  { id: 'offline', label: '线下报名' },
];

/**
 * spec 节点 me.coupons(route /me/coupons)—— 我的卡券(s250)。
 * 一级tab×二级胶囊tab均可切换,全部为空态(收纳盒插画)。
 */
export default function CouponsPage() {
  const { action, bindBack } = useYoukuGestures();
  const showToast = useYoukuStore((s) => s.showToast);
  const [tab, setTab] = useState<CouponTab>('all');
  const [sub, setSub] = useState<'received' | 'expired'>('received');

  const tabBind = (id: CouponTab) => {
    switch (id) {
      case 'all':
        return action('me.coupons.tab.select.all', () => setTab('all'));
      case 'welfare':
        return action('me.coupons.tab.select.welfare', () => setTab('welfare'));
      case 'virtual':
        return action('me.coupons.tab.select.virtual', () => setTab('virtual'));
      case 'goods':
        return action('me.coupons.tab.select.goods', () => setTab('goods'));
      default:
        return action('me.coupons.tab.select.offline', () => setTab('offline'));
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-(--app-c-page-bg) pt-10 text-(--app-c-text-primary)">
      {/* 顶栏:返回 / 我的卡券 / 客服 */}
      <div className="flex h-12 shrink-0 items-center px-3">
        <button {...bindBack()} aria-label="返回" className="flex h-9 w-9 cursor-pointer items-center justify-center border-none bg-transparent p-0 text-(--app-c-text-primary)">
          <IcBack size={24} strokeWidth={2.2} />
        </button>
        <span className="flex-1 text-center text-[18px] font-bold">我的卡券</span>
        <button
          {...action('me.coupons.service.wontfixToast', () => showToast(WONTFIX_TOAST))}
          className="flex h-9 w-9 cursor-pointer items-center justify-center border-none bg-transparent p-0 text-(--app-c-text-primary)"
        >
          <IcService size={20} strokeWidth={1.8} />
        </button>
      </div>

      {/* 一级tab */}
      <div className="flex shrink-0 items-baseline gap-6 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
        {TABS.map((t) => (
          <button
            key={t.id}
            {...tabBind(t.id)}
            className={`shrink-0 cursor-pointer border-none bg-transparent p-0 ${
              tab === t.id ? 'text-[18px] font-bold text-(--app-c-text-primary)' : 'text-[16px] text-[#8A8A8A]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 二级胶囊tab:已领取 / 已过期 */}
      <div className="flex shrink-0 gap-2.5 px-4 pb-1 pt-1.5">
        <button
          {...action('me.coupons.subtab.select.received', () => setSub('received'))}
          className={`cursor-pointer rounded-full border-none px-4 py-1.5 text-[13px] ${
            sub === 'received' ? 'bg-white font-medium text-black' : 'bg-(--app-c-chip-bg) text-[#999999]'
          }`}
        >
          已领取
        </button>
        <button
          {...action('me.coupons.subtab.select.expired', () => setSub('expired'))}
          className={`cursor-pointer rounded-full border-none px-4 py-1.5 text-[13px] ${
            sub === 'expired' ? 'bg-white font-medium text-black' : 'bg-(--app-c-chip-bg) text-[#999999]'
          }`}
        >
          已过期
        </button>
      </div>

      {/* 空态:各tab均为空(s250) */}
      <div data-scroll-container="main" data-scroll-direction="vertical" className="min-h-0 flex-1 overflow-y-auto">
        <EmptyBox text="暂时没有卡券" />
      </div>
    </div>
  );
}
