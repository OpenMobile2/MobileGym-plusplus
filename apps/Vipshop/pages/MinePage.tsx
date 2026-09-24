import React from 'react';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { Img, useToast, NOT_OPEN, VIP, PinkHeaderBg } from '../components/ui';
import { ItemGrid } from '../components/ItemCard';
import { ORDER_TABS } from '../constants';
import {
  IcCard, IcTruck, IcComment, IcRefresh, IcReceipt, IcTicket, IcCoins, IcWallet,
  IcHeart, IcFootprint, IcBell, IcService, IcSettings, IcGift, IcSparkles,
  IcCrown, IcUsers, IcArrowRight,
} from '../res/icons';

/** 订单入口:tab param 复用 mine.orders-open */
const ORDER_ENTRIES = [
  { tab: 'pendingPayment', label: '待付款', Icon: IcCard },
  { tab: 'pendingReceipt', label: '待收货', Icon: IcTruck },
  { tab: 'completed', label: '待评价', Icon: IcComment },
  { tab: 'canceled', label: '退换/售后', Icon: IcRefresh },
] as const;

/** 我的服务:暂未开放的 tile(领券/惊喜/签到/公益 共用 mine.wontfix.disabled) */
const WONTFIX_TILES = [
  { id: 'coupon-center', label: '领券中心', Icon: IcTicket },
  { id: 'surprise', label: '惊喜预告', Icon: IcSparkles },
  { id: 'signin', label: '签到有礼', Icon: IcGift },
  { id: 'charity', label: '我的公益', Icon: IcUsers },
] as const;

const TILE_CLS = 'flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer';
const TILE_LBL = 'text-[11px] text-[#666666]';

export default function MinePage() {
  const { bindTap } = useVipshopGestures();
  const [toast, showToast] = useToast();

  const session = useVipshopStore((s) => s.session);
  const items = useVipshopStore((s) => s.items);

  const guess = items.slice(0, 8);

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <div className="flex-1 overflow-y-auto" data-scroll-container="mine-body" data-scroll-direction="vertical">
        {/* 粉色头部 */}
        <PinkHeaderBg className="px-4 pt-12 pb-4">
          <div className="flex items-center gap-3">
            <Img src={session.avatar} className="w-16 h-16 rounded-full object-cover bg-white" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[18px] font-bold text-[#222222]">
                  {session.loggedIn ? session.nick : '点击登录'}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 text-[10px] rounded-full px-1.5 py-0.5"
                  style={{ background: VIP.ctaBlack, color: VIP.gold }}
                >
                  <IcCrown size={11} />超V
                </span>
              </div>
              {session.loggedIn && (
                <div className="text-[12px] text-[#888888] mt-1">{session.phone}</div>
              )}
            </div>
          </div>
        </PinkHeaderBg>

        {/* 我的订单 */}
        <div className="bg-white mx-2 -mt-2 rounded-lg p-3">
          <button
            {...bindTap('mine.orders-open', { params: { tab: 'all' } })}
            className="w-full flex items-center justify-between bg-transparent border-none cursor-pointer p-0"
          >
            <span className="text-[15px] font-semibold text-[#222222]">我的订单</span>
            <span className="flex items-center text-[12px] text-[#888888]">
              全部<IcArrowRight size={14} />
            </span>
          </button>
          <div className="grid grid-cols-4 gap-1 mt-3">
            {ORDER_ENTRIES.map((e) => (
              <button
                key={e.tab}
                {...bindTap('mine.orders-open', { params: { tab: e.tab } })}
                className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer"
              >
                <e.Icon size={22} className="text-[#444444]" />
                <span className="text-[11px] text-[#666666]">{e.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 我的钱包 */}
        <div className="bg-white mx-2 mt-2 rounded-lg p-3">
          <div className="text-[15px] font-semibold text-[#222222] mb-3">我的钱包</div>
          <div className="grid grid-cols-3">
            <button
              {...bindTap('mine.coupons-open')}
              className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer"
            >
              <IcTicket size={22} style={{ color: VIP.primary }} />
              <span className="text-[12px] text-[#666666]">优惠券</span>
            </button>
            <button
              {...bindTap('mine.vipcoin-open')}
              className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer"
            >
              <IcCoins size={22} style={{ color: VIP.gold }} />
              <span className="text-[12px] text-[#666666]">唯品币</span>
            </button>
            <button
              {...bindTap('mine.vipfloat-open')}
              className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer"
            >
              <IcWallet size={22} style={{ color: VIP.orange }} />
              <span className="text-[12px] text-[#666666]">唯品花</span>
            </button>
          </div>
        </div>

        {/* 我的服务 */}
        <div className="bg-white mx-2 mt-2 rounded-lg p-3">
          <div className="text-[15px] font-semibold text-[#222222] mb-3">我的服务</div>
          <div className="grid grid-cols-5 gap-y-4">
            <button {...bindTap('mine.favorites-open')} className={TILE_CLS}>
              <IcHeart size={22} className="text-[#444444]" /><span className={TILE_LBL}>收藏</span>
            </button>
            <button {...bindTap('mine.footprints-open')} className={TILE_CLS}>
              <IcFootprint size={22} className="text-[#444444]" /><span className={TILE_LBL}>足迹</span>
            </button>
            <button {...bindTap('mine.subscribe-open')} className={TILE_CLS}>
              <IcBell size={22} className="text-[#444444]" /><span className={TILE_LBL}>订阅</span>
            </button>
            <button {...bindTap('mine.service-open')} className={TILE_CLS}>
              <IcService size={22} className="text-[#444444]" /><span className={TILE_LBL}>客服</span>
            </button>
            <button {...bindTap('mine.settings-open')} className={TILE_CLS}>
              <IcSettings size={22} className="text-[#444444]" /><span className={TILE_LBL}>设置</span>
            </button>
            {WONTFIX_TILES.map((t) => (
              <button
                key={t.id}
                {...bindTap({ kind: 'action', id: 'mine.wontfix.disabled' }, { params: { target: t.id }, onTrigger: () => showToast(NOT_OPEN) })}
                className={TILE_CLS}
              >
                <t.Icon size={22} className="text-[#444444]" /><span className={TILE_LBL}>{t.label}</span>
              </button>
            ))}
            <button
              {...bindTap({ kind: 'action', id: 'mine.svip.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
              className={TILE_CLS}
            >
              <IcCrown size={22} style={{ color: VIP.gold }} /><span className={TILE_LBL}>超V开通</span>
            </button>
          </div>
        </div>

        {/* 猜你喜欢 */}
        <div className="mt-3 px-3 pb-1">
          <span className="text-[15px] font-bold text-[#222222]">猜你喜欢</span>
        </div>
        <ItemGrid items={guess} bindingOf={(it) => bindTap('mine.item-open', { params: { id: it.id } })} />
        <div className="h-3" />
      </div>
      {toast}
    </div>
  );
}
