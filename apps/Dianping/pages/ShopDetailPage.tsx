import React, { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import * as TimeService from '../../../os/TimeService';
import { useAppStrings } from '@/os/useAppStrings';
import { useDianpingGestures } from '../hooks/useDianpingGestures';
import { useDianpingStore } from '../state';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import {
  IcBack,
  IcSearch,
  IcStarOutline,
  IcStar,
  IcShare,
  IcMore,
  IcTaxi,
  IcMapMini,
  IcCamera,
  IcCheckinPin,
  IcChevronRight,
  IcClose,
  IcTabHome,
  IcTabMsg,
  IcLocateFixed,
  IcFlag,
  IcPear,
} from '../res/icons';
import { Stars } from '../components/Stars';
import { computeOpenStatus, hoursLabel } from '../utils/openStatus';
import { fmtDistance } from '../utils/appTime';
import { shopCoverUrl, dishImageUrl, shopGalleryUrls } from '../assets';
import { useDragScroll } from '../hooks/useDragScroll';
import { DpAvatar } from '../components/DpAvatar';
import { sharePlainText } from '@/os/shareBridge';

export default function ShopDetailPage() {
  const { shopId = '' } = useParams();
  const [sp, setSp] = useSearchParams();
  const sec = sp.get('sec') || 'offers';
  const more = sp.get('more') === 'open';
  const s = useAppStrings(strings, stringsEn);
  const { bindTap, bindBack, action } = useDianpingGestures();
  const shop = useDianpingStore((st) => st.shops.find((x) => x.id === shopId));
  const fav = useDianpingStore((st) => st.favoriteShopIds.includes(shopId));
  const toggleFavoriteShop = useDianpingStore((st) => st.toggleFavoriteShop);
  const recordBrowseShop = useDianpingStore((st) => st.recordBrowseShop);
  const userReviews = useDianpingStore((st) => st.userReviews);
  const userProfile = useDianpingStore((st) => st.userProfile);
  const showToast = useDianpingStore((st) => st.showToast);
  const shops = useDianpingStore((st) => st.shops);
  const browseHistory = useDianpingStore((st) => st.browseHistory);
  const recentShops = browseHistory
    .filter((e) => e.kind === 'shop' && e.refId !== shopId)
    .map((e) => shops.find((x) => x.id === e.refId))
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
    .slice(0, 6);
  const secRefs = {
    offers: useRef<HTMLDivElement>(null),
    dishes: useRef<HTMLDivElement>(null),
    reviews: useRef<HTMLDivElement>(null),
  };
  const galleryRef = useDragScroll<HTMLDivElement>();
  const dishRowRef = useDragScroll<HTMLDivElement>();
  const recentRef = useDragScroll<HTMLDivElement>();
  const [galleryIdx, setGalleryIdx] = useState(0);

  useEffect(() => {
    if (shopId) recordBrowseShop(shopId);
  }, [shopId, recordBrowseShop]);

  if (!shop) {
    return (
      <div className="flex h-full flex-col bg-(--app-c-card-bg) pt-10">
        <button type="button" className="cursor-pointer border-none bg-transparent p-3" {...bindBack()}>
          <IcBack size={22} />
        </button>
        <div className="text-center text-(--app-c-text-muted)">Shop not found</div>
      </div>
    );
  }

  const status = computeOpenStatus(shop.hours);
  const statusText =
    status === 'open' ? s.openNow : status === 'closingSoon' ? s.closingSoon : s.closed;
  const reviewPhotos = shop.dishes
    .map((d) => dishImageUrl(shop.id, d.id))
    .filter((u): u is string => Boolean(u));
  // 顶图图集:生成的门店/招牌图 + 菜品图,去重(缺图前也有多张)
  const gallery = [...shopGalleryUrls(shop.id), ...reviewPhotos].filter(
    (u, i, arr) => arr.indexOf(u) === i,
  );
  const picCount = Math.max(9, Math.round(shop.reviewCount * 0.35));
  const videoCount = Math.max(1, Math.round(shop.reviewCount / 130));
  const fmtReviewDate = (ts: number) => {
    const d = TimeService.fromTimestamp(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const myShopReviews = userReviews
    .filter((r) => r.shopId === shop.id && !shop.reviews.some((sr) => sr.id === r.id))
    .map((r) => ({
      id: r.id,
      userName: userProfile.nickname,
      score: r.score,
      body: r.body,
      tags: ['我的评价'],
      dateLabel: fmtReviewDate(r.createdAt),
      hasPhoto: (r.photos?.length ?? 0) > 0,
      photos: r.photos ?? [],
      avgPriceText: r.avgPriceText,
    }));
  const mergedReviews = [...myShopReviews, ...shop.reviews];
  // 人均:优先用评价自带(写评价录入的联动),否则确定性给约 1/3 的评价派生一个
  const avgFor = (id: string, given?: string) =>
    given ??
    (Math.abs([...id].reduce((a, c) => (a * 17 + c.charCodeAt(0)) | 0, 3)) % 3 === 0
      ? `¥${shop.avgPrice + ((id.length % 21) - 10)}/人`
      : '');

  const vouchers = shop.deals.filter((d) => d.kind === 'voucher');
  const setmeals = shop.deals.filter((d) => d.kind === 'setmeal');

  const dealRow = (d: (typeof shop.deals)[number], last: boolean, brand: boolean) => (
    <div
      key={d.id}
      className={`flex items-center gap-2.5 py-2.5 ${last ? '' : 'border-b border-dashed border-(--app-c-border)'}`}
    >
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-2.5 border-none bg-transparent p-0 text-left cursor-pointer"
        {...bindTap('shop.voucher-open', { params: { shopId: shop.id, dealId: d.id } })}
      >
        <div className="relative h-[64px] w-[64px] shrink-0 overflow-hidden rounded-[6px]" style={{ background: shop.coverColor }}>
          {shopCoverUrl(shop.id) ? (
            <img src={shopCoverUrl(shop.id)} alt="" className="h-full w-full object-cover" />
          ) : null}
          {d.kind === 'voucher' ? (
            <span className="absolute left-0 top-0 rounded-br bg-[#FF4B33] px-1 text-[9px] text-white">券</span>
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-(--app-c-text-primary)">
            {brand ? (
              <span className="mr-1 rounded-[3px] bg-[#3D3D3D] px-1 py-0.5 text-[9px] font-normal text-white align-middle">
                品牌主推
              </span>
            ) : null}
            {d.title}
          </div>
          <div className="mt-0.5 text-[11px] text-(--app-c-text-muted)">
            {d.kind === 'voucher' ? '全场通用 · 周末可用 · 免预约' : '过期自动退 · 随时退'} · {d.sold}
          </div>
          {d.kind === 'setmeal' && d.items && d.items.length > 0 ? (
            <div className="mt-0.5 line-clamp-1 text-[11px] text-(--app-c-text-secondary)">
              含 {d.items.map((it) => `${it.name}×${it.qty}`).join('、')}
            </div>
          ) : null}
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-[16px] font-bold text-[#FF6633]">¥{d.price}</span>
            {d.origin > d.price ? (
              <span className="rounded-[3px] bg-[#FFF1EA] px-1 text-[10px] text-[#FF6633]">
                {((d.price / d.origin) * 10).toFixed(1)}折
              </span>
            ) : null}
            <span className="text-[11px] text-[#CCC] line-through">¥{d.origin}</span>
          </div>
        </div>
      </button>
      <button
        type="button"
        className="shrink-0 rounded-[6px] border-none bg-[#FF6633] px-3 py-1.5 text-[12px] font-medium text-white cursor-pointer"
        {...bindTap('shop.deal-buy', { params: { shopId: shop.id, dealId: d.id } })}
      >
        {s.grab}
      </button>
    </div>
  );

  const goSec = (target: 'offers' | 'dishes' | 'reviews') => {
    const next = new URLSearchParams(sp);
    next.set('sec', target);
    setSp(next, { replace: true });
    secRefs[target].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="relative flex h-full flex-col bg-(--app-c-page-bg)" data-status-bar-foreground="dark">
      <div
        className="flex-1 overflow-y-auto pb-[60px]"
        data-scroll-container="shop-detail"
        data-scroll-direction="vertical"
      >
        {/* 头图 · 可横滑图集 */}
        <div className="relative h-[200px]" style={{ background: shop.coverColor }}>
          {gallery.length > 0 ? (
            <div
              ref={galleryRef}
              className="flex h-full snap-x snap-mandatory overflow-x-auto"
              data-scroll-container="shop-gallery"
              data-scroll-direction="horizontal"
              onScroll={(e) => {
                const el = e.currentTarget;
                const idx = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
                if (idx !== galleryIdx) setGalleryIdx(idx);
              }}
            >
              {gallery.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt=""
                  draggable={false}
                  className="h-full w-full shrink-0 snap-start object-cover"
                />
              ))}
            </div>
          ) : null}
          {gallery.length > 1 ? (
            <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
              {gallery.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${i === galleryIdx ? 'w-3 bg-white' : 'w-1.5 bg-white/60'}`}
                />
              ))}
            </div>
          ) : null}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-2 pt-2">
            <button
              type="button"
              className="rounded-full bg-black/35 p-1.5 text-white border-none cursor-pointer"
              {...bindBack()}
            >
              <IcBack size={20} />
            </button>
            <div className="flex gap-2">
              {(
                [
                  ['search', <IcSearch key="s" size={17} />, () => showToast(s.notOpen)],
                  [
                    'fav',
                    fav ? (
                      <IcStar key="f" size={17} className="text-[#FF6633]" />
                    ) : (
                      <IcStarOutline key="f" size={17} />
                    ),
                    () => toggleFavoriteShop(shop.id),
                  ],
                  [
                    'share',
                    <IcShare key="h" size={17} />,
                    () => {
                      const text = `${shop.name} ${shop.score}分 https://dianping.mock/shop/${shop.id}`;
                      const launched = sharePlainText(text, { onResult: (r) => { if (r.resultCode === 'OK') showToast('分享成功'); } });
                      if (!launched) showToast(s.notOpen);
                    },
                  ],
                  ['more', <IcMore key="m" size={17} />, () => showToast(s.notOpen)],
                ] as const
              ).map(([key, icon, fn]) => (
                <button
                  key={key}
                  type="button"
                  className="rounded-full bg-black/35 p-1.5 text-white border-none cursor-pointer"
                  {...(key === 'fav'
                    ? action('shop.favorite.toggle', fn, { params: { id: shop.id } })
                    : key === 'share'
                      ? action('shop.share.open', fn, { params: { id: shop.id } })
                      : key === 'search'
                        ? bindTap('shop.search-open', { params: { shopId: shop.id } })
                        : bindTap('shop.more-open', { params: { shopId: shop.id } }))}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <div className="absolute bottom-3 left-3 max-w-[70%] text-[15px] font-bold text-white drop-shadow">
            {shop.coverLabel}
          </div>
          <div className="absolute bottom-3 right-3 flex gap-1.5">
            <span className="rounded-full bg-black/40 px-2 py-0.5 text-[10px] text-white">视频 {videoCount}</span>
            <span className="flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-[10px] text-white">
              <IcCamera size={11} /> 图片 {picCount}
            </span>
          </div>
        </div>

        {/* 基础信息 */}
        <div className="bg-(--app-c-card-bg) px-3 py-3">
          <div className="text-[18px] font-bold leading-snug text-(--app-c-text-primary)">{shop.name}</div>
          <div className="mt-1.5 flex items-center gap-2">
            <Stars score={shop.score} size={12} />
            <span className="text-[12px] text-(--app-c-text-secondary)">
              {shop.reviewCount}条
            </span>
            <span className="text-[12px] text-(--app-c-text-secondary)">
              ¥{shop.avgPrice}
              {s.perPerson}
            </span>
            <span className="ml-auto rounded-[3px] bg-[#FFF1EA] px-1.5 py-0.5 text-[10px] font-medium text-[#FF6633]">
              榜单
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-(--app-c-text-muted)">
            <span>
              口味{shop.taste} 环境{shop.env} 服务{shop.service}
              {shop.ingredient != null ? ` 食材${shop.ingredient}` : ''}
            </span>
            <span className="text-(--app-c-text-secondary)">
              {shop.category} {shop.district}
            </span>
          </div>
          <div className="mt-2 rounded-[6px] bg-[#FFF5F0] px-2 py-1.5 text-[11px] text-[#E11D48]">
            当前有优惠，{shop.district}美食券可用
          </div>
          <div className="mt-2 flex w-full items-center gap-1 text-[12px]">
            <span className="font-medium text-[#00B578]">{statusText}</span>
            <span className="text-(--app-c-text-secondary)">{hoursLabel(shop.hours)}</span>
          </div>
          <div className="mt-2 flex items-stretch border-t border-[#F5F5F5] pt-2">
            <div className="min-w-0 flex-1 pr-2">
              <div className="text-[12px] leading-snug text-(--app-c-text-primary)">{shop.address}</div>
              <div className="mt-0.5 text-[11px] text-(--app-c-text-muted)">
                距你 {fmtDistance(shop.distanceM)}
              </div>
            </div>
            <div className="flex shrink-0 divide-x divide-[#F0F0F0] border-l border-(--app-c-border)">
              {(
                [
                  [IcTaxi, s.taxi],
                  [IcMapMini, '地图'],
                ] as const
              ).map(([Icon, label]) => (
                <button
                  key={label}
                  type="button"
                  className="flex w-12 flex-col items-center justify-center gap-0.5 border-none bg-transparent text-[10px] text-(--app-c-text-secondary) cursor-pointer"
                  {...action('shop.utility.open.disabled', () => showToast(s.notOpen))}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 吸顶段 Tab */}
        <div className="sticky top-0 z-10 mt-2 flex bg-(--app-c-card-bg)">
          {(
            [
              ['offers', s.offers],
              ['dishes', s.dishes],
              ['reviews', `${s.reviews}(${shop.reviewCount})`],
            ] as const
          ).map(([id, label]) => {
            const active = sec === id;
            return (
              <button
                key={id}
                type="button"
                className={`relative flex-1 border-none bg-transparent py-2.5 text-[14px] cursor-pointer ${
                  active ? 'font-bold text-(--app-c-text-primary)' : 'text-(--app-c-text-secondary)'
                }`}
                {...action('shop.section.select.target', () => goSec(id), { params: { target: id } })}
              >
                {label}
                {active ? (
                  <span className="absolute bottom-0 left-1/2 h-[3px] w-5 -translate-x-1/2 rounded-full bg-[#FF6633]" />
                ) : null}
              </button>
            );
          })}
        </div>

        <div ref={secRefs.offers} className="scroll-mt-11">
          {/* 优惠(代金券) */}
          {vouchers.length > 0 ? (
            <div className="bg-(--app-c-card-bg) px-3 py-2">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[15px] font-bold text-(--app-c-text-primary)">优惠</span>
                <span className="text-[11px] text-(--app-c-text-muted)">过期自动退 · 随时退</span>
              </div>
              {vouchers.map((d, idx) => dealRow(d, idx === vouchers.length - 1, false))}
            </div>
          ) : null}
          {/* 到店套餐 */}
          {setmeals.length > 0 ? (
            <div className="mt-2 bg-(--app-c-card-bg) px-3 py-2">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[15px] font-bold text-(--app-c-text-primary)">到店套餐</span>
                <span className="text-[11px] text-(--app-c-text-muted)">随时退 · 过期退</span>
              </div>
              {setmeals.map((d, idx) => dealRow(d, idx === setmeals.length - 1, idx === 0))}
            </div>
          ) : null}
        </div>

        {(
          <div ref={secRefs.dishes} className="mt-2 scroll-mt-11 bg-(--app-c-card-bg) px-3 py-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[15px] font-bold">{s.dishes}</span>
              <button
                type="button"
                className="border-none bg-transparent text-[12px] text-(--app-c-text-muted) cursor-pointer"
                {...bindTap('shop.dishes-open', { params: { shopId: shop.id } })}
              >
                {s.viewAll} <IcChevronRight size={11} className="inline" />
              </button>
            </div>
            <div
              ref={dishRowRef}
              className="flex gap-2 overflow-x-auto pb-1"
              data-scroll-container="dish-row"
              data-scroll-direction="horizontal"
            >
              {shop.dishes.map((d) => (
                <div key={d.id} className="w-[108px] shrink-0">
                  <div
                    className="relative h-[108px] overflow-hidden rounded-[6px]"
                    style={{ background: shop.coverColor }}
                  >
                    {dishImageUrl(shop.id, d.id) ? (
                      <img
                        src={dishImageUrl(shop.id, d.id)}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : null}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-1.5 py-1 text-[10px] text-white">
                      {d.recommendCount}
                      {s.recommendCount}
                    </div>
                  </div>
                  <div className="mt-1 truncate text-[12px] font-medium text-(--app-c-text-primary)">{d.name}</div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="mt-2 w-full border-none bg-transparent py-2 text-center text-[13px] text-(--app-c-text-secondary) cursor-pointer"
              {...action('shop.menu.open.disabled', () => showToast(s.notOpen))}
            >
              {s.textMenu} <IcChevronRight size={11} className="inline" />
            </button>
          </div>
        )}

        {(
          <div ref={secRefs.reviews} className="mt-2 scroll-mt-11 bg-(--app-c-card-bg) px-3 py-2">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[15px] font-bold">
                {s.reviews}({shop.reviewCount})
              </span>
              <button
                type="button"
                className="border-none bg-transparent text-[12px] text-(--app-c-text-muted) cursor-pointer"
                {...bindTap('shop.reviews-open', { params: { shopId: shop.id } })}
              >
                {s.viewAll} <IcChevronRight size={11} className="inline" />
              </button>
            </div>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {shop.tags.map((t) => (
                <span key={t} className="rounded-full bg-(--app-c-page-bg) px-2.5 py-1 text-[11px] text-(--app-c-text-secondary)">
                  {t}
                </span>
              ))}
            </div>
            {mergedReviews.map((r, ri) => (
              <button
                key={r.id}
                type="button"
                className="block w-full border-none border-b border-[#F5F5F5] bg-transparent py-3 text-left last:border-none cursor-pointer"
                {...bindTap('shop.review-open', { params: { shopId: shop.id, reviewId: r.id } })}
              >
                <div className="flex items-center gap-2">
                  {r.userName === userProfile.nickname ? (
                    <IcPear size={32} className="shrink-0 rounded-full" />
                  ) : (
                    <DpAvatar seed={r.userName} size={32} className="shrink-0 rounded-full" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-medium text-(--app-c-text-primary)">{r.userName}</span>
                      <span className="rounded bg-[#FFF3C4] px-1 text-[9px] text-[#B45309]">
                        Lv{3 + ((r.body.length + ri) % 6)}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <Stars score={r.score} size={10} showScore={false} />
                      <span className="text-[10px] text-(--app-c-text-muted)">{r.dateLabel}</span>
                      {avgFor(r.id, r.avgPriceText) ? (
                        <span className="text-[10px] text-(--app-c-text-muted)">{avgFor(r.id, r.avgPriceText)}</span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="mt-1.5 text-[13px] leading-5 text-(--app-c-text-primary)">{r.body}</div>
                {(r.photos && r.photos.length > 0) || (r.hasPhoto && reviewPhotos.length > 0) ? (
                  <div className="mt-2 grid grid-cols-3 gap-1">
                    {(r.photos && r.photos.length > 0
                      ? r.photos.slice(0, 3)
                      : [0, 1, 2].map((i) => reviewPhotos[(ri + i) % reviewPhotos.length])
                    ).map((url, i) => (
                      <div
                        key={i}
                        className="aspect-square overflow-hidden rounded-[4px]"
                        style={{ background: shop.coverColor }}
                      >
                        {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 底栏: 收藏 / 打卡 / 写评价 */}
      <div className="absolute inset-x-0 bottom-0 flex h-[56px] items-center gap-1 border-t border-(--app-c-border) bg-(--app-c-card-bg) px-2">
        <button
          type="button"
          className="flex w-14 flex-col items-center gap-0.5 border-none bg-transparent text-[10px] text-(--app-c-text-secondary) cursor-pointer"
          {...action('shop.bar.favorite', () => toggleFavoriteShop(shop.id), { params: { id: shop.id } })}
        >
          {fav ? (
            <IcStar size={20} className="text-[#FF6633]" />
          ) : (
            <IcStarOutline size={20} />
          )}
          {fav ? s.favorited : s.favorite}
        </button>
        <button
          type="button"
          className="flex w-14 flex-col items-center gap-0.5 border-none bg-transparent text-[10px] text-(--app-c-text-secondary) cursor-pointer"
          {...bindTap('shop.checkin-open', { params: { shop: shop.id } })}
        >
          <IcCheckinPin size={18} className="text-(--app-c-text-secondary)" />
          {s.checkin}
        </button>
        <button
          type="button"
          className="ml-1 flex-1 rounded-full border-none bg-[#FF6633] py-[11px] text-center text-[15px] font-semibold text-white cursor-pointer"
          {...bindTap('shop.write-open', { params: { shopId: shop.id } })}
        >
          {s.writeReview}
        </button>
      </div>

      {/* 右上角「⋯」快捷入口浮层(对齐 added_2 · 475) */}
      {more ? (
        <div className="absolute inset-0 z-30 flex flex-col">
          <button
            type="button"
            aria-label="close"
            className="absolute inset-0 border-none bg-black/40 cursor-pointer"
            {...bindBack()}
          />
          <div className="relative rounded-b-[16px] bg-(--app-c-card-bg) px-4 pb-4 pt-3">
            <div className="flex items-center justify-center">
              <span className="text-[16px] font-semibold text-(--app-c-text-primary)">快捷入口</span>
              <button
                type="button"
                className="absolute right-3 border-none bg-transparent p-1 text-(--app-c-text-secondary) cursor-pointer"
                {...bindBack()}
              >
                <IcClose size={22} />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-5 gap-y-3">
              {(
                [
                  ['home', IcTabHome, '返回首页'],
                  ['msg', IcTabMsg, '消息'],
                  ['fav', IcStarOutline, '我的收藏'],
                  ['near', IcLocateFixed, '搜索附近'],
                  ['report', IcFlag, '信息报错'],
                ] as const
              ).map(([key, Icon, label]) => {
                const binding =
                  key === 'home'
                    ? bindTap('shop.more.home')
                    : key === 'msg'
                      ? bindTap('shop.more.msg')
                      : key === 'fav'
                        ? bindTap('shop.more.fav')
                        : action('shop.more.entry.disabled', () => showToast(s.notOpen));
                return (
                  <button
                    key={key}
                    type="button"
                    className="flex flex-col items-center gap-1 border-none bg-transparent cursor-pointer"
                    {...binding}
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-(--app-c-page-bg) text-(--app-c-text-primary)">
                      <Icon size={20} />
                    </span>
                    <span className="text-[11px] text-(--app-c-text-secondary)">{label}</span>
                  </button>
                );
              })}
            </div>
            {recentShops.length > 0 ? (
              <>
                <div className="mt-4 mb-2 text-[15px] font-bold text-(--app-c-text-primary)">
                  最近浏览的“南京”商户
                </div>
                <div ref={recentRef} className="flex gap-2 overflow-x-auto pb-1">
                  {recentShops.map((sh) => (
                    <button
                      key={sh.id}
                      type="button"
                      className="w-[140px] shrink-0 overflow-hidden rounded-[8px] border border-(--app-c-border) bg-(--app-c-card-bg) text-left cursor-pointer"
                      {...bindTap('food.shop-open', { params: { shopId: sh.id } })}
                    >
                      <div className="h-[86px] w-full" style={{ background: sh.coverColor }}>
                        {shopCoverUrl(sh.id) ? (
                          <img src={shopCoverUrl(sh.id)} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="px-2 py-1.5">
                        <div className="truncate text-[12px] font-medium text-(--app-c-text-primary)">
                          {sh.name}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1">
                          <Stars score={sh.score} size={9} showScore={false} />
                          <span className="text-[10px] text-[#FF6633]">¥{sh.avgPrice}/人</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
