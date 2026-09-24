import React from 'react';
import { usePinduoduoGestures } from '../hooks/usePinduoduoGestures';
import { usePinduoduoStore } from '../state';
import { Img, wontfix } from '../components/ui';
import {
  IcSettings, IcMapPin, IcChevronRight, IcWallet, IcUsers, IcPackage, IcTruck,
  IcStar, IcHeart, IcTicket, IcClock, IcRefresh, IcGift,
} from '../res/icons';

const ORDER_ENTRIES = [
  { status: 'pendingPayment', label: '待付款', Icon: IcWallet },
  { status: 'grouping', label: '待分享', Icon: IcUsers },
  { status: 'packing', label: '待发货', Icon: IcPackage },
  { status: 'shipped', label: '待收货', Icon: IcTruck },
  { status: 'completed', label: '评价', Icon: IcStar },
] as const;

const TOOLS = [
  { transitionId: 'mine.favorites-open', label: '商品收藏', Icon: IcHeart },
  { transitionId: 'mine.wallet-open', label: '多多钱包', Icon: IcWallet },
  { transitionId: 'mine.coupon-open', label: '优惠券', Icon: IcTicket },
  { transitionId: 'mine.footprint-open', label: '历史浏览', Icon: IcClock },
  { transitionId: 'mine.aftersale-open', label: '退款售后', Icon: IcRefresh },
] as const;

export function MinePage() {
  const { bindTap } = usePinduoduoGestures();
  const user = usePinduoduoStore((s) => s.user);
  const orders = usePinduoduoStore((s) => s.orders);
  const countOf = (status: string) =>
    orders.filter((o) =>
      status === 'completed' ? o.status === 'completed' && !o.reviewed : o.status === status,
    ).length;

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5] overflow-hidden" data-status-bar-foreground="light">
      <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
        {/* 红头 */}
        <div className="bg-gradient-to-b from-[#E22E1F] to-[#F04C3A] px-4 pt-3 pb-6 text-white">
          <div className="flex items-center justify-end">
            <button
              {...bindTap('mine.settings-open')}
              aria-label="设置"
              className="w-9 h-9 flex items-center justify-center -mr-2"
            >
              <IcSettings size={22} />
            </button>
          </div>
          <div className="flex items-center gap-3 -mt-2">
            <Img src={user.avatar} className="w-16 h-16 rounded-full object-cover border-2 border-white/60" alt={user.nick} />
            <div className="min-w-0">
              <div className="text-[19px] font-semibold truncate">{user.nick}</div>
              <div className="text-[12px] opacity-90 mt-1">多多号:{user.pddId}</div>
            </div>
          </div>
          {/* 地址入口 */}
          <button
            {...bindTap('mine.address-open')}
            className="mt-4 w-full flex items-center justify-between bg-white/15 rounded-lg px-3 py-2 text-left"
          >
            <span className="flex items-center gap-1.5 text-[13px]">
              <IcMapPin size={16} /> 收货地址
            </span>
            <IcChevronRight size={16} className="opacity-80" />
          </button>
        </div>

        {/* 省钱月卡横幅 */}
        <button
          {...bindTap({ kind: 'action', id: 'mine.monthcard.wontfix' }, { onTrigger: wontfix })}
          className="mx-3 -mt-3 mb-3 w-[calc(100%-1.5rem)] flex items-center justify-between rounded-xl px-4 py-3 bg-gradient-to-r from-[#3A2A1A] to-[#5A3A20] text-[#FFD24D] text-left"
        >
          <span className="flex items-center gap-2 text-[14px] font-medium">
            <IcGift size={18} /> 省钱月卡 · 每月立省 100 元
          </span>
          <span className="text-[12px] bg-[#FFD24D] text-[#5A3A20] rounded-full px-2.5 py-0.5 font-medium">立即开通</span>
        </button>

        {/* 我的订单 */}
        <div className="mx-3 mb-3 bg-white rounded-xl">
          <button
            {...bindTap('mine.orders-open')}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
          >
            <span className="text-[15px] font-medium text-[#333]">我的订单</span>
            <span className="flex items-center text-[12px] text-[#999]">
              查看全部 <IcChevronRight size={14} />
            </span>
          </button>
          <div className="flex px-1 pb-3">
            {ORDER_ENTRIES.map(({ status, label, Icon }) => {
              const n = countOf(status);
              return (
                <button
                  key={status}
                  {...bindTap('mine.orders-open-status', { params: { status } })}
                  className="flex-1 flex flex-col items-center gap-1 py-1"
                >
                  <span className="relative">
                    <Icon size={24} className="text-[#555]" />
                    {n > 0 && (
                      <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-1 rounded-full bg-[#E22E1F] text-white text-[10px] leading-[15px] text-center">
                        {n}
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] text-[#666]">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 工具宫格 */}
        <div className="mx-3 mb-4 bg-white rounded-xl px-1 py-3">
          <div className="grid grid-cols-4 gap-y-4">
            {TOOLS.map(({ transitionId, label, Icon }) => (
              <button
                key={transitionId}
                {...bindTap(transitionId)}
                className="flex flex-col items-center gap-1.5"
              >
                <Icon size={23} className="text-[#E22E1F]" />
                <span className="text-[11px] text-[#666]">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
