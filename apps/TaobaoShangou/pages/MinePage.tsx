import React, { useMemo, useState } from 'react';
import * as TimeService from '@/os/TimeService';
import { useAppStrings } from '@/os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { useTbsgStore } from '../state';
import { AppImg, Price, showToast } from '../components/common';
import { IcRight, IcSettings } from '../res/icons';
import { useStatusBarBg } from '../statusbar';

/** 我的 tab(spec mine.main,证据 IMG_6032/6043) */
export default function MinePage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap } = useTbsgGestures();

  useStatusBarBg('#3B4079');
  const user = useTbsgStore((st) => st.user);
  const shops = useTbsgStore((st) => st.shops);
  const items = useTbsgStore((st) => st.items);
  const orders = useTbsgStore((st) => st.orders);
  const coupons = useTbsgStore((st) => st.coupons);
  const foodCard = useTbsgStore((st) => st.foodCard);
  const favorites = useTbsgStore((st) => st.favorites);
  const frequentShops = useTbsgStore((st) => st.frequentShops);

  /** 吃货豆说明小浮层(action mine.beans.view,原地开合) */
  const [beansOpen, setBeansOpen] = useState(false);

  const now = TimeService.now();
  const couponCount = coupons.filter((c) => c.status === 'claimed' && c.expireAt > now).length;
  const reviewBadge = orders.filter((o) => o.status === 'delivered' && !o.reviewed).length;
  /** 进行中(待支付/备餐/配送)与退款中订单数,下单后即时更新 */
  const pendingBadge = orders.filter((o) => ['unpaid', 'preparing', 'delivering'].includes(o.status)).length;
  const refundBadge = orders.filter((o) => o.status === 'refunding').length;
  const orderBadge: Record<string, number> = { pending: pendingBadge, review: reviewBadge, refund: refundBadge };

  /** 你可能还喜欢:月售最高 8 个商品 */
  const recItems = useMemo(
    () => [...items].sort((a, b) => b.monthlySales - a.monthlySales).slice(0, 8),
    [items],
  );

  const stub = (id: string) => bindTap<HTMLButtonElement>(
    { kind: 'action', id: id as never },
    { onTrigger: () => showToast(s.notOpen) },
  );

  return (
    <div className="flex flex-col h-full bg-[#F3F6F8]" data-status-bar-foreground="light">
      <div data-scroll-container="main" data-scroll-direction="vertical" className="flex-1 overflow-y-auto">
        {/* 深蓝紫渐变头 */}
        <div className="px-4 pt-3 pb-16" style={{ background: 'linear-gradient(180deg,#3B4079 0%,#4A4F86 45%,#6A70A6 100%)' }}>
          <div className="flex items-start">
            <AppImg src={user.avatar} className="w-14 h-14 rounded-full border-2 border-white/40 object-cover shrink-0" />
            <div className="ml-3 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-white text-[19px] font-bold truncate">{user.nickname}</span>
                <span className="text-white/80 text-[15px] font-semibold tracking-wide">{user.phoneMasked}</span>
              </div>
              {/* 悦享SVIP 黑金小标 */}
              <button
                {...stub('mine.svip.stub')}
                className="mt-1.5 inline-flex items-center gap-1 h-6 pl-1 pr-2 rounded-md bg-[#1F1F2E] border border-[#5A5A6E] cursor-pointer"
              >
                <span className="h-4 px-1 rounded-sm bg-gradient-to-r from-[#F5D9A8] to-[#E8B96F] text-[#3D2B00] text-[10px] font-bold flex items-center">悦享SVIP</span>
                <span className="text-[#E8CFA0] text-[11px]">{user.svipExpire}到期</span>
                <IcRight size={11} className="text-[#E8CFA0]" />
              </button>
            </div>
            <button
              {...bindTap<HTMLButtonElement>('mine.settings-open')}
              aria-label="设置"
              className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer shrink-0"
            >
              <IcSettings size={22} className="text-white" />
            </button>
          </div>
          {/* 悦享特权行 */}
          <div className="mt-3 flex items-center">
            <span className="text-white text-[17px] font-bold" style={{ fontStyle: 'italic' }}>悦享特权</span>
            <span className="mx-2 text-white/30">|</span>
            <span className="text-white/85 text-[13px]">7月特权已到账</span>
            <div className="flex-1" />
            <button
              {...stub('mine.svip.stub')}
              className="h-7 px-3 rounded-full bg-gradient-to-r from-[#F5D9A8] to-[#E8B96F] text-[#3D2B00] text-[12px] font-semibold flex items-center gap-0.5 border-none cursor-pointer"
            >
              全部特权
              <IcRight size={12} />
            </button>
          </div>
        </div>

        <div className="px-3 -mt-12 pb-4">
          {/* 三大资产入口 */}
          <div className="bg-white rounded-xl px-2 py-4">
            <div className="grid grid-cols-3">
              <button {...stub('mine.foodcard.stub')} className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer">
                <span className="text-[26px] leading-none">👑</span>
                <span className="text-[15px] font-semibold text-[#1A1A1A]">超级吃货卡</span>
                <span className="text-[12px] text-[#999999]">{foodCard.owned ? `${foodCard.count}张可用` : '购卡即享优惠'}</span>
              </button>
              <button
                {...bindTap<HTMLButtonElement>(
                  { kind: 'action', id: 'mine.beans.view' },
                  { onTrigger: () => setBeansOpen((v) => !v) },
                )}
                className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer"
              >
                <span className="text-[26px] leading-none">🫘</span>
                <span className="text-[15px] font-semibold text-[#1A1A1A]">吃货豆</span>
                <span className="text-[12px] text-[#999999]"><span className="text-[#ED6C2C]">{user.beans}</span> 豆可用</span>
              </button>
              <button {...bindTap<HTMLButtonElement>('mine.coupons-open')} className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer">
                <span className="text-[26px] leading-none">🧧</span>
                <span className="text-[15px] font-semibold text-[#1A1A1A]">红包卡券</span>
                <span className="text-[12px] text-[#999999]"><span className="text-[#F53F3F]">{couponCount}</span> 张红包可用</span>
              </button>
            </div>
            {beansOpen && (
              <div className="mx-2 mt-3 rounded-lg bg-[#FFF7EF] px-3 py-2.5 text-[12px] text-[#8A5A2B] leading-relaxed">
                吃货豆可下单抵现,评价、下单可赚豆
              </div>
            )}
          </div>

          {/* 我的订单 */}
          <div className="bg-white rounded-xl mt-3 px-3 pt-3 pb-4">
            <div className="text-[16px] font-bold text-[#1A1A1A] mb-3">{s.myOrders}</div>
            <div className="grid grid-cols-4">
              {([
                ['all', s.orderTabAll, '📄'],
                ['pending', s.orderTabPending, '🛵'],
                ['review', s.orderTabReview, '💬'],
                ['refund', s.orderTabRefund, '💱'],
              ] as const).map(([tab, label, icon]) => (
                <button
                  key={tab}
                  {...bindTap<HTMLButtonElement>('mine.orders-open', { params: { tab } })}
                  className="relative flex flex-col items-center gap-1.5 bg-transparent border-none cursor-pointer"
                >
                  <span className="text-[24px] leading-none relative">
                    {icon}
                    {tab !== 'all' && orderBadge[tab] > 0 && (
                      <span className="absolute -top-1.5 -right-3 min-w-4 h-4 px-1 rounded-full bg-[#F53F3F] text-white text-[10px] font-semibold flex items-center justify-center">
                        {orderBadge[tab]}
                      </span>
                    )}
                  </span>
                  <span className="text-[13px] text-[#1A1A1A]">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 我的钱包 */}
          <div className="bg-white rounded-xl mt-3 px-3 pt-3 pb-4">
            <div className="flex items-center mb-3">
              <span className="text-[16px] font-bold text-[#1A1A1A]">{s.myWallet}</span>
              <div className="flex-1" />
              <button {...stub('mine.wallet.stub')} className="flex items-center text-[13px] text-[#999999] bg-transparent border-none cursor-pointer">
                进入
                <IcRight size={13} />
              </button>
            </div>
            <div className="grid grid-cols-4">
              {([
                ['18.6万', '借钱'],
                ['35 元最高', '零钱'],
                ['420 元', '外卖红包'],
                ['15 元最高', '支付权益'],
              ] as const).map(([num, label]) => (
                <button key={label} {...stub('mine.wallet.stub')} className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer">
                  <span className="text-[16px] font-bold text-[#1A1A1A]">{num}</span>
                  <span className="text-[13px] text-[#666666]">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 我的关注 + 常点的店 */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="bg-white rounded-xl p-3">
              <div className="flex items-center mb-2">
                <span className="text-[15px] font-bold text-[#1A1A1A]">{s.myFollow} {favorites.length}</span>
                <div className="flex-1" />
                <IcRight size={14} className="text-[#BBBBBB]" />
              </div>
              <div data-scroll-container="favshops" data-scroll-direction="horizontal" className="flex gap-3 overflow-x-auto">
                {favorites.map((sid) => {
                  const shop = shops.find((x) => x.id === sid);
                  if (!shop) return null;
                  return (
                    <button
                      key={sid}
                      {...bindTap<HTMLButtonElement>('mine.favshop-open', { params: { shopId: sid } })}
                      className="flex flex-col items-center gap-1 w-16 shrink-0 bg-transparent border-none cursor-pointer"
                    >
                      <AppImg src={shop.logo} className="w-12 h-12 rounded-lg object-cover" />
                      <span className="text-[12px] text-[#1A1A1A] truncate w-full">{shop.name}</span>
                    </button>
                  );
                })}
                {favorites.length === 0 && <span className="text-[12px] text-[#999999] py-3">还没有关注的店铺</span>}
              </div>
            </div>
            <div className="bg-white rounded-xl p-3">
              <div className="flex items-center mb-2">
                <span className="text-[15px] font-bold text-[#1A1A1A]">常点的店</span>
                <div className="flex-1" />
                <IcRight size={14} className="text-[#BBBBBB]" />
              </div>
              <div className="flex gap-3">
                {frequentShops.map(({ shopId, times }) => {
                  const shop = shops.find((x) => x.id === shopId);
                  if (!shop) return null;
                  return (
                    <button
                      key={shopId}
                      {...bindTap<HTMLButtonElement>('mine.favshop-open', { params: { shopId } })}
                      className="flex flex-col items-center gap-1 w-16 shrink-0 bg-transparent border-none cursor-pointer"
                    >
                      <AppImg src={shop.logo} className="w-12 h-12 rounded-lg object-cover" />
                      <span className="text-[12px] text-[#1A1A1A] truncate w-full">{shop.name}</span>
                      <span className="text-[11px] text-[#999999]">点过{times}次</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 更多功能 */}
          <div className="bg-white rounded-xl mt-3 px-3 pt-3 pb-4">
            <div className="text-[16px] font-bold text-[#1A1A1A] mb-3">{s.moreFunctions}</div>
            <div className="grid grid-cols-4">
              <button {...bindTap<HTMLButtonElement>('mine.address-open')} className="flex flex-col items-center gap-1.5 bg-transparent border-none cursor-pointer">
                <span className="text-[24px] leading-none">📍</span>
                <span className="text-[13px] text-[#1A1A1A]">{s.myAddress}</span>
              </button>
              <button {...bindTap<HTMLButtonElement>('mine.service-open')} className="flex flex-col items-center gap-1.5 bg-transparent border-none cursor-pointer">
                <span className="text-[24px] leading-none">🎧</span>
                <span className="text-[13px] text-[#1A1A1A]">{s.myService}</span>
              </button>
              <button {...stub('mine.morefunc.stub')} className="flex flex-col items-center gap-1.5 bg-transparent border-none cursor-pointer">
                <span className="text-[24px] leading-none">🧾</span>
                <span className="text-[13px] text-[#1A1A1A]">开发票</span>
              </button>
              <button {...stub('mine.morefunc.stub')} className="flex flex-col items-center gap-1.5 bg-transparent border-none cursor-pointer">
                <span className="text-[24px] leading-none">🎁</span>
                <span className="text-[13px] text-[#1A1A1A]">下单返</span>
              </button>
            </div>
          </div>

          {/* 互动中心 */}
          <div className="bg-white rounded-xl mt-3 px-3 pt-3 pb-4">
            <div className="text-[16px] font-bold text-[#1A1A1A] mb-3">互动中心</div>
            <div className="grid grid-cols-4">
              {([
                ['💰', '天天赚现金'],
                ['🎁', '天天夺宝'],
                ['🎫', '天天抽奖'],
                ['🍉', '免费领水果'],
              ] as const).map(([icon, label]) => (
                <button key={label} {...stub('mine.activity.stub')} className="flex flex-col items-center gap-1.5 bg-transparent border-none cursor-pointer">
                  <span className="w-11 h-11 rounded-full bg-[#FFF1E8] flex items-center justify-center text-[22px]">{icon}</span>
                  <span className="text-[12px] text-[#1A1A1A]">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 你可能还喜欢 */}
          <div className="flex items-center justify-center gap-3 mt-5 mb-3">
            <span className="h-px w-10 bg-[#DDDDDD]" />
            <span className="text-[16px] font-bold text-[#1A1A1A]">你可能还喜欢</span>
            <span className="h-px w-10 bg-[#DDDDDD]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {recItems.map((it) => {
              const shop = shops.find((x) => x.id === it.shopId);
              return (
                <button
                  key={it.id}
                  {...bindTap<HTMLButtonElement>('mine.rec-open', { params: { shopId: it.shopId } })}
                  className="bg-white rounded-xl overflow-hidden text-left border-none cursor-pointer p-0 flex flex-col"
                >
                  <AppImg src={it.image} className="w-full h-36 object-cover" />
                  <div className="p-2.5">
                    <div className="text-[14px] font-semibold text-[#1A1A1A] leading-snug line-clamp-2">{it.name}</div>
                    <div className="mt-1.5"><Price value={it.price} size={17} orig={it.origPrice} /></div>
                    {shop && (
                      <div className="mt-1 text-[11px] text-[#999999] truncate">
                        {shop.name} · {shop.deliveryMinutes}分钟 {shop.distanceKm}km
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
