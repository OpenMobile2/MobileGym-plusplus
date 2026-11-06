import React from 'react';
import { usePinduoduoGestures } from '../hooks/usePinduoduoGestures';
import { usePinduoduoStore } from '../state';
import { Img, wontfix } from '../components/ui';
import { ItemCard } from '../components/ItemCard';
import {
  IcSettings, IcMapPin, IcChevronRight, IcWallet, IcUsers, IcPackage, IcTruck,
  IcStar, IcHeart, IcTicket, IcClock, IcRefresh, IcGift, IcHeadphones,
} from '../res/icons';

const ORDER_ENTRIES = [
  { status: 'pendingPayment', label: '待付款', Icon: IcWallet },
  { status: 'grouping', label: '拼团中', Icon: IcUsers },
  { status: 'packing', label: '打包中', Icon: IcPackage },
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
  const items = usePinduoduoStore((s) => s.items);
  const countOf = (status: string) =>
    orders.filter((o) =>
      status === 'completed' ? o.status === 'completed' && !o.reviewed : o.status === status,
    ).length;

  const featuredIds = ['i_bodywash', 'i_shirt', 'i_adidas_wash', 'i_photoframe'];
  const recommendItems = [
    ...featuredIds.map((id) => items.find((item) => item.id === id)).filter((item): item is NonNullable<typeof item> => Boolean(item)),
    ...items.filter((item) => !featuredIds.includes(item.id)),
  ].slice(0, 10);

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F4F4F4] overflow-hidden" data-status-bar-foreground="dark">
      <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
        {/* 真机个人中心为白色资料头。 */}
        <div className="bg-white px-4 pt-2.5 pb-3 text-[#222]">
          <div className="flex items-center">
            <Img
              src={user.avatar}
              className="w-[50px] h-[50px] rounded-full object-cover shrink-0"
              alt={user.nick}
            />
            <div className="min-w-0 flex-1 ml-2.5">
              <div className="text-[19px] leading-6 font-medium truncate">{user.nick}</div>
              <button
                {...bindTap('mine.address-open')}
                className="mt-0.5 flex items-center text-[13px] text-[#777] max-w-full"
              >
                <IcMapPin size={14} className="mr-0.5 shrink-0 text-[#999]" fill="currentColor" />
                <span className="truncate">收货地址</span>
                <IcChevronRight size={15} />
              </button>
            </div>
            <button
              {...bindTap('mine.settings-open')}
              aria-label="设置"
              className="h-8 px-3 rounded-full border border-[#D4D4D4] flex items-center gap-1 text-[13px] text-[#666] shrink-0"
            >
              <IcSettings size={17} fill="#999" className="text-[#999]" /> 设置
            </button>
          </div>
        </div>

        {/* 省钱月卡横幅 */}
        <button
          {...bindTap({ kind: 'action', id: 'mine.monthcard.wontfix' }, { onTrigger: wontfix })}
          className="mx-3 mb-0 w-[calc(100%-1.5rem)] h-[43px] flex items-center justify-between rounded-lg px-3.5 bg-[#FFF0EF] text-left"
        >
          <span className="flex items-center gap-2 text-[15px] text-[#D94338] font-medium">
            省钱月卡
            <span className="w-px h-3 bg-[#E8AAA5]" />
            <span className="text-[13px] font-normal">已省139元</span>
          </span>
          <IcChevronRight size={18} className="text-[#DE4A40]" />
        </button>

        {/* 我的订单 */}
        <div className="mt-1 bg-white">
          <button
            {...bindTap('mine.orders-open')}
            className="w-full flex items-center justify-between px-3 py-2.5 text-left"
          >
            <span className="min-w-0 flex items-center gap-1.5">
              <span className="text-[16px] font-medium text-[#222] shrink-0">我的订单</span>
              <span className="text-[12px] text-[#26A936] truncate">｜专属客服 · 闪电退换 · 售后无忧</span>
            </span>
            <span className="flex items-center text-[12px] text-[#999]">
              全部 <IcChevronRight size={14} />
            </span>
          </button>
          <div className="flex px-1 pb-3.5 pt-1">
            {ORDER_ENTRIES.map(({ status, label, Icon }) => {
              const n = countOf(status);
              return (
                <button
                  key={status}
                  {...bindTap('mine.orders-open-status', { params: { status } })}
                  className="flex-1 flex flex-col items-center gap-1.5"
                >
                  <span className="relative">
                    <Icon size={25} strokeWidth={1.55} className="text-[#8A8A8A]" />
                    {n > 0 && (
                      <span className="absolute -top-2 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-white text-[#E22E1F] text-[10px] leading-[14px] text-center border border-[#E22E1F]">
                        {n}
                      </span>
                    )}
                  </span>
                  <span className="text-[12px] text-[#666]">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 工具宫格 */}
        <div className="mt-px border-t-8 border-[#F5F5F5] bg-white px-1 pt-3 pb-3">
          <div className="grid grid-cols-5 gap-y-4">
            {TOOLS.map(({ transitionId, label, Icon }) => (
              <button
                key={transitionId}
                {...bindTap(transitionId)}
                className="flex flex-col items-center gap-1.5"
              >
                <Icon size={25} strokeWidth={1.8} fill="#E62E25" className="text-[#E62E25]" />
                <span className="text-[12px] text-[#666]">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2 h-11 px-4 bg-white flex items-center justify-between text-[12px] text-[#666] overflow-hidden">
          <span className="flex items-center gap-1.5 whitespace-nowrap"><IcHeadphones size={17} className="text-[#F3982B]" />专属客服</span>
          <span className="w-px h-4 bg-[#EAEAEA]" />
          <span className="flex items-center gap-1.5 whitespace-nowrap"><IcGift size={17} className="text-[#F3982B]" />免费领礼物</span>
          <span className="w-px h-4 bg-[#EAEAEA]" />
          <span className="flex items-center gap-1.5 whitespace-nowrap"><IcWallet size={17} className="text-[#F3982B]" />充值中心</span>
          <span className="w-px h-4 bg-[#EAEAEA]" />
          <span className="flex items-center gap-1.5 whitespace-nowrap"><IcTruck size={17} className="text-[#F3982B]" />火车票</span>
        </div>

        {/* 真机服务条后直接进入商品流。 */}
        <div className="pt-2 pb-4">
           <div className="grid grid-cols-2 gap-px bg-[#EAEAEA]">
              {recommendItems.map((it) => (
                <ItemCard
                  key={it.id}
                  item={it}
                  openBind={bindTap('mine.item-open', { params: { itemId: it.id } })}
                  quickBind={bindTap('mine.item-quickbuy', { params: { itemId: it.id, mode: 'group' }, stopPropagation: true })}
                />
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
