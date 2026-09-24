import React, { useState } from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { useDianpingGestures } from '../hooks/useDianpingGestures';
import { useDianpingStore } from '../state';
import { DIANPING_CONFIG } from '../data';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { ShopCard } from '../components/ShopCard';
import { Stars } from '../components/Stars';
import {
  IcHeadset,
  IcSettings,
  IcClock,
  IcStar,
  IcChevronRight,
  IcCheckinPin,
  IcPear,
} from '../res/icons';
import { serviceIconUrl } from '../assets';

function SvcImg({ n }: { n: number }) {
  return <img src={serviceIconUrl(n)} alt="" className="h-[26px] w-[26px] object-contain" />;
}

function YellowTile({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="flex h-[30px] w-[30px] items-center justify-center">{icon}</span>
      <span className="text-[11px] leading-none text-(--app-c-text-primary)">{label}</span>
    </div>
  );
}

type BottomTab = 'fav' | 'history' | 'reviews';

export default function MinePage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap, action } = useDianpingGestures();
  const showToast = useDianpingStore((st) => st.showToast);
  const favoriteShopIds = useDianpingStore((st) => st.favoriteShopIds);
  const browseHistory = useDianpingStore((st) => st.browseHistory);
  const userReviews = useDianpingStore((st) => st.userReviews);
  const orders = useDianpingStore((st) => st.orders);
  const checkins = useDianpingStore((st) => st.checkins);
  const shops = useDianpingStore((st) => st.shops);
  const userProfile = useDianpingStore((st) => st.userProfile);
  const [bottomTab, setBottomTab] = useState<BottomTab>('fav');
  const favShops = shops.filter((x) => favoriteShopIds.includes(x.id));
  const histShops = browseHistory
    .filter((e) => e.kind === 'shop')
    .map((e) => shops.find((x) => x.id === e.refId))
    .filter(Boolean)
    .slice(0, 8) as typeof shops;

  const user = DIANPING_CONFIG.user;
  const checkinCount = checkins.length;
  const footprintCount = browseHistory.filter((e) => e.kind === 'shop').length;
  const diningCount = orders.filter((o) => o.status !== 'pending_pay').length;
  const usableCoupons = orders.filter((o) => o.status === 'usable').length;
  const reviewedShopIds = new Set(userReviews.map((r) => r.shopId));
  const pendingCount = orders.filter(
    (o) => (o.status === 'usable' || o.status === 'used') && !reviewedShopIds.has(o.shopId),
  ).length;

  return (
    <div
      className="flex h-full flex-col bg-(--app-c-page-bg)"
      data-status-bar-foreground="dark"
      data-scroll-container="mine"
      data-scroll-direction="vertical"
    >
      <div className="flex-1 overflow-y-auto pb-3">
        <div className="bg-(--app-c-wash) px-3 pb-2 pt-2">
          <div className="mb-3 flex justify-end gap-3 pr-1">
            <button
              type="button"
              className="border-none bg-transparent text-(--app-c-text-primary) cursor-pointer"
              {...action('mine.cs.open.disabled', () => showToast(s.notOpen))}
            >
              <IcHeadset size={20} />
            </button>
            <button
              type="button"
              className="border-none bg-transparent text-(--app-c-text-primary) cursor-pointer"
              {...bindTap('mine.settings-open')}
            >
              <IcSettings size={20} />
            </button>
          </div>

          <div className="flex items-start gap-3">
            <IcPear size={58} className="shrink-0 rounded-full ring-2 ring-white" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-[18px] font-bold text-(--app-c-text-primary)">{userProfile.nickname}</span>
                <button
                  type="button"
                  className="shrink-0 border-none bg-transparent text-[12px] text-(--app-c-text-muted) cursor-pointer"
                  {...bindTap('mine.profile-open')}
                >
                  {s.profile} <IcChevronRight size={10} className="inline" />
                </button>
              </div>
              <div className="mt-1 text-[12px] text-(--app-c-text-secondary)">
                {user.fans ?? 3} 粉丝<span className="mx-2">{user.following ?? 5} 关注</span>
                {user.likes ?? 10} 获赞
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-[#FFF3C4] px-2 py-0.5 text-[10px] font-medium text-[#B45309]">
                  ★ Lv{user.level ?? 5}
                </span>
                <span className="rounded-full bg-[#FFE8D6] px-2 py-0.5 text-[10px] text-[#C2410C]">
                  {checkinCount + footprintCount}枚
                </span>
                <span className="rounded-full bg-[#E8F0FF] px-2 py-0.5 text-[10px] text-[#2563EB]">
                  白金会员
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {(
              [
                [s.checkin, `累计${checkinCount}次`, 'checkin'],
                [s.mineFootprint, `${footprintCount}个足迹`, 'foot'],
                [s.mineTaste, `用餐${diningCount}次`, 'taste'],
              ] as const
            ).map(([title, sub, kind]) => (
              <button
                key={title}
                type="button"
                className="rounded-[10px] border-none bg-(--app-c-card-bg) px-2 py-2.5 text-left shadow-sm cursor-pointer"
                {...(kind === 'checkin'
                  ? bindTap('mine.checkins-open')
                  : action('mine.entry.open.disabled', () => showToast(s.notOpen)))}
              >
                <div className="flex items-center gap-1 text-[13px] font-semibold text-(--app-c-text-primary)">
                  {kind === 'checkin' ? (
                    <IcCheckinPin size={14} className="text-[#FF6633]" />
                  ) : kind === 'foot' ? (
                    <IcClock size={14} className="text-[#FF6633]" />
                  ) : (
                    <IcStar size={13} className="text-[#D97706]" />
                  )}
                  {title}
                </div>
                <div className="mt-1 text-[11px] text-(--app-c-text-muted)">{sub}</div>
              </button>
            ))}
          </div>

          <button
            type="button"
            className="mt-2 flex w-full items-center justify-between rounded-[10px] border-none bg-(--app-c-card-bg) px-3 py-2.5 text-left shadow-sm cursor-pointer"
            {...bindTap('mine.reviews-open')}
          >
            <span className="text-[13px] font-medium text-(--app-c-text-primary)">
              {s.reviews} ({userReviews.length})
            </span>
            <IcChevronRight size={12} className="text-[#CCC]" />
          </button>
        </div>

        {/* 服务图标区 */}
        <div className="mx-3 mt-1 rounded-[12px] bg-(--app-c-card-bg) px-2 py-3">
          <div className="grid grid-cols-4 gap-y-3">
            <button
              type="button"
              className="relative border-none bg-transparent cursor-pointer"
              {...bindTap('mine.orders-open')}
            >
              <YellowTile label={s.mineOrders} icon={<SvcImg n={1} />} />
              {orders.length > 0 ? (
                <span className="absolute right-3 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF4B33] px-1 text-[9px] font-bold text-white">
                  {orders.length}
                </span>
              ) : null}
            </button>
            <button type="button" className="border-none bg-transparent cursor-pointer" {...bindTap('mine.fav-open')}>
              <YellowTile label={s.mineFav} icon={<SvcImg n={2} />} />
            </button>
            <button
              type="button"
              className="relative border-none bg-transparent cursor-pointer"
              {...bindTap('mine.pending-open')}
            >
              <YellowTile label={s.minePending} icon={<SvcImg n={3} />} />
              {pendingCount > 0 ? (
                <span className="absolute right-3 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF4B33] px-1 text-[9px] font-bold text-white">
                  {pendingCount}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              className="relative border-none bg-transparent cursor-pointer"
              {...bindTap('mine.coupons-open')}
            >
              <YellowTile label={s.mineCoupons} icon={<SvcImg n={4} />} />
              {usableCoupons > 0 ? (
                <span className="absolute right-3 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF4B33] px-1 text-[9px] font-bold text-white">
                  {usableCoupons}
                </span>
              ) : null}
            </button>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-y-3 border-t border-[#F5F5F5] pt-3">
            <button
              type="button"
              className="border-none bg-transparent cursor-pointer"
              {...bindTap('mine.history-open')}
            >
              <YellowTile label={s.recentBrowse} icon={<SvcImg n={5} />} />
            </button>
            {(
              [
                [s.mineWallet, 6, 'disabled'],
                [s.mineDrafts, 7, 'drafts'],
                [s.mineNotesCenter, 8, 'disabled'],
              ] as const
            ).map(([label, n, kind]) => (
              <button
                key={label}
                type="button"
                className="border-none bg-transparent cursor-pointer"
                {...(kind === 'drafts'
                  ? bindTap('mine.drafts-open')
                  : action('mine.entry.open.disabled', () => showToast(s.notOpen)))}
              >
                <YellowTile label={label} icon={<SvcImg n={n} />} />
              </button>
            ))}
          </div>
        </div>

        {/* 底部收藏/浏览/评价 Tab + 列表 */}
        <div className="mx-3 mt-2 overflow-hidden rounded-[12px] bg-(--app-c-card-bg)">
          <div className="flex border-b border-(--app-c-border)">
            {(
              [
                ['fav', `${s.myFavorites}(${favShops.length})`],
                ['history', s.recentBrowse],
                ['reviews', `${s.reviews}(${userReviews.length})`],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`relative flex-1 border-none bg-transparent py-2.5 text-[13px] cursor-pointer ${
                  bottomTab === id ? 'font-bold text-(--app-c-text-primary)' : 'text-(--app-c-text-secondary)'
                }`}
                {...action('mine.bottomTab.select.target', () => setBottomTab(id), {
                  params: { target: id },
                })}
              >
                {label}
                {bottomTab === id ? (
                  <span className="absolute bottom-0 left-1/2 h-[3px] w-6 -translate-x-1/2 rounded-full bg-[#FF6633]" />
                ) : null}
              </button>
            ))}
          </div>
          {bottomTab === 'fav' ? (
            favShops.length === 0 ? (
              <div className="py-10 text-center text-[12px] text-(--app-c-text-muted)">{s.emptyFav}</div>
            ) : (
              favShops.map((shop) => (
                <ShopCard key={shop.id} shop={shop} transitionId="food.shop-open" dense />
              ))
            )
          ) : bottomTab === 'history' ? (
            histShops.length === 0 ? (
              <div className="py-10 text-center text-[12px] text-(--app-c-text-muted)">{s.emptyHistory}</div>
            ) : (
              histShops.map((shop) => (
                <ShopCard key={shop.id} shop={shop} transitionId="food.shop-open" dense />
              ))
            )
          ) : userReviews.length === 0 ? (
            <div className="py-10 text-center text-[12px] text-(--app-c-text-muted)">{s.emptyReviews}</div>
          ) : (
            userReviews.map((r) => (
              <button
                key={r.id}
                type="button"
                className="flex w-full flex-col border-none border-b border-[#F5F5F5] bg-(--app-c-card-bg) px-3 py-3 text-left cursor-pointer"
                {...bindTap('shop.review-open', { params: { shopId: r.shopId, reviewId: r.id } })}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate text-[13px] font-semibold text-(--app-c-text-primary)">{r.shopName}</span>
                  <Stars score={r.score} size={10} showScore={false} />
                </div>
                <div className="mt-1 line-clamp-2 text-[12px] leading-5 text-(--app-c-text-secondary)">{r.body}</div>
              </button>
            ))
          )}
          <div className="py-3 text-center text-[11px] text-[#CCC]">没有更多了 ~</div>
        </div>
      </div>
    </div>
  );
}
