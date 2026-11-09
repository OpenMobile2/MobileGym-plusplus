import React from 'react';
import * as TimeService from '@/os/TimeService';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { Img, useToast, NOT_OPEN, VIP, PinkHeaderBg } from '../components/ui';
import { ItemGrid } from '../components/ItemCard';
import {
  IcCard, IcTruck, IcComment, IcRefresh, IcTicket, IcCoins, IcWallet,
  IcService, IcSparkles, IcGift, IcUsers, IcCrown, IcBell, IcSettings, IcScan, IcGrid,
} from '../res/icons';

const ORDER_ENTRIES = [
  { tab: 'pendingPayment', label: '待付款', Icon: IcCard, accent: false },
  { tab: 'pendingReceipt', label: '待收货', Icon: IcTruck, accent: false },
  { tab: 'completed', label: '待评价', Icon: IcComment, accent: false },
  { tab: 'canceled', label: '退换/售后', Icon: IcRefresh, accent: false },
  { tab: 'all', label: '全部订单', Icon: IcGrid, accent: true },
] as const;

const TILE = 'flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer shrink-0';
const LBL = 'text-[11px] text-[#666666]';

export default function MinePage() {
  const { bindTap } = useVipshopGestures();
  const [toast, showToast] = useToast();

  const session = useVipshopStore((s) => s.session);
  const items = useVipshopStore((s) => s.items);
  const favorites = useVipshopStore((s) => s.favorites);
  const footprints = useVipshopStore((s) => s.footprints);
  const subscribedBrands = useVipshopStore((s) => s.subscribedBrands);
  const coupons = useVipshopStore((s) => s.coupons);
  const checkIn = useVipshopStore((s) => s.checkIn);

  const couponCount = coupons.filter((c) => !c.used).length;
  const favThumb = items.find((it) => favorites.includes(it.id))?.image;
  const footThumb = items.find((it) => it.id === footprints[0]?.itemId)?.image;
  const buyThumb = items[3]?.image;
  const guess = items.slice(0, 8);

  const onCheckIn = () => {
    const earned = checkIn();
    showToast(earned > 0 ? `签到成功,+${earned} 唯品币` : '今日已签到,明天再来~');
  };

  const statInner = (value: string, sub: string, thumb: string | undefined, label: string) => (
    <>
      <span className="text-[16px] font-bold text-[#222222]">{value}</span>
      <span className="text-[10px]" style={{ color: VIP.primary }}>{sub}</span>
      {thumb
        ? <Img src={thumb} className="w-10 h-10 rounded object-cover mt-0.5" />
        : <div className="w-10 h-10 rounded mt-0.5 flex items-center justify-center text-[16px]" style={{ background: '#FDECF5' }}>📁</div>}
      <span className="text-[11px] text-[#666666]">{label}</span>
    </>
  );
  const statCls = 'flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer px-1';

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <div className="flex-1 overflow-y-auto" data-scroll-container="mine-body" data-scroll-direction="vertical">
        {/* 粉色头部 · IMG_278 */}
        <PinkHeaderBg className="px-4 pt-12 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Img src={session.avatar || '/@app-assets/Vipshop/gen/avatar_bunny.png'} className="w-16 h-16 rounded-full object-cover bg-white" style={{ border: `2px solid ${VIP.primary}` }} />
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] text-white rounded-full px-1.5 py-0.5 whitespace-nowrap" style={{ background: '#3A3A44' }}>白银会员</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[18px] font-bold text-[#222222]">
                {session.loggedIn ? (session.nick || '唯品会会员') : '点击登录'}
              </div>
            </div>
            <button
              {...bindTap({ kind: 'action', id: 'mine.wontfix.disabled' }, { params: { target: 'scan' }, onTrigger: () => showToast(NOT_OPEN) })}
              className="bg-transparent border-none cursor-pointer"
              aria-label="扫一扫"
            >
              <IcScan size={20} className="text-[#333]" />
            </button>
            <button {...bindTap('mine.settings-open')} className="bg-transparent border-none cursor-pointer" aria-label="设置">
              <IcSettings size={20} className="text-[#333]" />
            </button>
            <button {...bindTap('mine.service-open')} className="bg-transparent border-none cursor-pointer relative" aria-label="消息">
              <IcBell size={20} className="text-[#333]" />
              <span className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full" style={{ background: VIP.red }} />
            </button>
          </div>

          {/* 超V年卡横幅 */}
          <button
            {...bindTap({ kind: 'action', id: 'mine.svip.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
            className="mt-3 w-full rounded-xl overflow-hidden flex items-stretch border-none cursor-pointer p-0"
          >
            <span className="px-3 py-2.5 flex items-center gap-1 text-[12px] font-bold" style={{ background: '#2B2B33', color: VIP.gold }}>
              <IcCrown size={13} />超级VIP
            </span>
            <span className="flex-1 px-3 py-2 flex items-center gap-2" style={{ background: 'linear-gradient(90deg,#F6E7CF,#F0D8B0)' }}>
              <span className="text-[22px] font-bold shrink-0" style={{ color: '#7A4A12' }}>¥30</span>
              {/* 原来硬塞了 <br/> 断行,窄屏下和自动换行叠加会断成三行 */}
              <span className="text-[11px] text-left flex-1 min-w-0 leading-tight" style={{ color: '#7A4A12' }}>超V年卡限时直降 再送自营全场券</span>
              <span className="text-[12px] rounded-full px-3 py-1 text-white font-semibold shrink-0 whitespace-nowrap" style={{ background: VIP.primary }}>立即开通</span>
            </span>
          </button>
        </PinkHeaderBg>

        {/* 订单五格(含全部订单) · IMG_278 */}
        <div className="bg-white mx-2 -mt-2 rounded-lg px-2 py-3">
          <div className="grid grid-cols-5 gap-1">
            {ORDER_ENTRIES.map((e) => (
              <button key={e.tab} {...bindTap('mine.orders-open', { params: { tab: e.tab } })} className="flex flex-col items-center gap-1.5 bg-transparent border-none cursor-pointer">
                {e.accent ? (
                  <span className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#FDECF5' }}>
                    <e.Icon size={20} style={{ color: VIP.primary }} />
                  </span>
                ) : (
                  <e.Icon size={22} className="text-[#444444]" />
                )}
                <span className={`text-[11px] ${e.accent ? 'font-semibold text-[#222222]' : 'text-[#666666]'}`}>{e.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 数据行:收藏/足迹/常购/订阅 */}
        <div className="bg-white mx-2 mt-2 rounded-lg grid grid-cols-4 py-3">
          <button {...bindTap('mine.favorites-open')} className={statCls}>
            {statInner(String(favorites.length), '60天低价', favThumb, '收藏')}
          </button>
          <button {...bindTap('mine.footprints-open')} className={statCls}>
            {statInner(String(footprints.length), '看过好物', footThumb, '足迹')}
          </button>
          <button {...bindTap('mine.item-open', { params: { id: items[3]?.id ?? '' } })} className={statCls}>
            {statInner('¥54', '再来一单', buyThumb, '常购')}
          </button>
          <button {...bindTap('mine.subscribe-open', { params: { tab: 'brand' } })} className={statCls}>
            {statInner(String(subscribedBrands.length), '去订阅品牌', undefined, '订阅')}
          </button>
        </div>

        {/* 我的服务 */}
        <div className="bg-white mx-2 mt-2 rounded-lg p-3">
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            <button {...bindTap('mine.service-open')} className={TILE}>
              <IcService size={22} className="text-[#444444]" /><span className={LBL}>唯品客服</span>
            </button>
            <button {...bindTap('mine.flash-open')} className={TILE}>
              <IcSparkles size={22} className="text-[#444444]" /><span className={LBL}>惊喜预告</span>
            </button>
            <button {...bindTap('mine.myReviews-open')} className={TILE}>
              <IcComment size={22} className="text-[#444444]" /><span className={LBL}>我的评价</span>
            </button>
            <button {...bindTap('mine.coupons-open')} className={TILE}>
              <IcTicket size={22} className="text-[#444444]" /><span className={LBL}>领券中心</span>
            </button>
            <button {...bindTap({ kind: 'action', id: 'mine.checkin.submit' }, { onTrigger: onCheckIn })} className={TILE}>
              <IcGift size={22} className="text-[#444444]" /><span className={LBL}>签到有礼</span>
            </button>
            <button {...bindTap({ kind: 'action', id: 'mine.wontfix.disabled' }, { params: { target: 'charity' }, onTrigger: () => showToast(NOT_OPEN) })} className={TILE}>
              <IcUsers size={22} className="text-[#444444]" /><span className={LBL}>我的公益</span>
            </button>
            <button {...bindTap('mine.settings-open')} className={TILE}>
              <IcSettings size={22} className="text-[#444444]" /><span className={LBL}>设置</span>
            </button>
          </div>
        </div>

        {/* 我的资产 · IMG_278 五格 */}
        <div className="bg-white mx-2 mt-2 rounded-lg grid grid-cols-5 py-3 px-1">
          <button {...bindTap('mine.coupons-open')} className="flex flex-col items-center gap-0.5 bg-transparent border-none cursor-pointer">
            <span className="text-[16px] font-bold text-[#222222]">{couponCount}</span>
            <span className="text-[11px] text-[#666666]">优惠券</span>
          </button>
          <button {...bindTap('mine.vipcoin-open')} className="flex flex-col items-center gap-0.5 bg-transparent border-none cursor-pointer">
            <span className="text-[16px] font-bold text-[#222222]">{session.vipcoin}</span>
            <span className="text-[11px] text-[#666666]">唯品币</span>
          </button>
          <button {...bindTap('mine.vipfloat-open')} className="flex flex-col items-center gap-0.5 bg-transparent border-none cursor-pointer relative">
            <span className="text-[13px] font-bold text-[#222222]">最高3万</span>
            <span className="text-[11px] text-[#666666]">唯品花</span>
            <span className="absolute -top-1 right-0 text-[9px] text-white rounded px-1" style={{ background: VIP.primary }}>先用后还</span>
          </button>
          <button
            {...bindTap({ kind: 'action', id: 'mine.wontfix.disabled' }, { params: { target: 'loan' }, onTrigger: () => showToast(NOT_OPEN) })}
            className="flex flex-col items-center gap-0.5 bg-transparent border-none cursor-pointer"
          >
            <span className="text-[13px] font-bold text-[#222222]">**万</span>
            <span className="text-[11px] text-[#666666]">借钱</span>
          </button>
          <button {...bindTap('mine.vipfloat-open')} className="flex flex-col items-center gap-0.5 bg-transparent border-none cursor-pointer">
            <IcWallet size={18} className="text-[#888]" />
            <span className="text-[11px] text-[#666666]">我的资产</span>
            <span className="text-[9px]" style={{ color: VIP.primary }}>有优惠</span>
          </button>
        </div>

        {/* 猜你喜欢 */}
        <div className="mt-3 px-3 pb-1"><span className="text-[15px] font-bold text-[#222222]">猜你喜欢</span></div>
        <ItemGrid items={guess} bindingOf={(it) => bindTap('mine.item-open', { params: { id: it.id } })} />
        <div className="h-3" />
      </div>
      {toast}
    </div>
  );
}
