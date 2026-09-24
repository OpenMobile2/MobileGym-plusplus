import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Img from '../components/Img';
import {
  IcNavBack, IcMore, IcSearch, IcChevronUp, IcChevronDown, IcPlus, IcCart, IcTicket, IcService, IcLayout, IcStore,
} from '../res/icons';
import { useSuningGestures } from '../hooks/useSuningGestures';
import { useSuningStore } from '../state';
import { SUNING_CONFIG } from '../data';
import { useStrings } from '../i18n';
import type { Product } from '../types';
import { fansText, shopOf } from '../utils/detail';
import { promoLabel } from '../utils/search';

type ShopSort = 'default' | 'sales' | 'newest' | 'priceAsc' | 'priceDesc';

/**
 * 店铺页(spec shop.main,s279/s345/s346/s347):精选/商品双 Tab(?tab=)、
 * 排序行、关注(粉丝数±1 且与 me.follow 店铺Tab 联动)、商品网格快捷加购、店铺底部 Tab。
 */
export default function ShopPage() {
  const { bindTap, action, bindBack } = useSuningGestures();
  const S = useStrings();
  const [searchParams, setSearchParams] = useSearchParams();
  const shopId = searchParams.get('shopId') ?? '';
  const tab = searchParams.get('tab') ?? 'featured';
  const shop = shopOf(shopId);

  const showToast = useSuningStore((s) => s.showToast);
  const followedShops = useSuningStore((s) => s.followedShops);
  const toggleFollowShop = useSuningStore((s) => s.toggleFollowShop);
  const cartItems = useSuningStore((s) => s.cartItems);
  const wontfix = () => showToast(S.toastNotOpen);

  const [sort, setSort] = useState<ShopSort>('default');

  if (!shop) {
    return (
      <div className="flex h-full flex-col bg-[var(--app-surface)] pt-10">
        <button {...bindBack()} className="w-10 cursor-pointer border-none bg-transparent p-2 text-[var(--app-text)]">
          <IcNavBack size={24} />
        </button>
        <div className="py-16 text-center text-[13px] text-[var(--app-c-text-muted)]">{S.emptyNoData}</div>
      </div>
    );
  }

  const isFollowed = followedShops.includes(shop.id);
  // 粉丝数 ±1:种子已含初始关注态,运行时切换在其上加减
  const followers = shop.followers + (isFollowed ? 1 : 0) - (shop.followed ? 1 : 0);
  const cartCount = cartItems.reduce((n, i) => n + i.qty, 0);
  const isStore = shop.type === 'store';

  const goTab = (value: string) =>
    setSearchParams(
      (p) => {
        p.set('tab', value);
        return p;
      },
      { replace: true },
    );

  const all = SUNING_CONFIG.products.filter((p) => p.shopId === shop.id);
  const sorted = [...all];
  if (sort === 'sales') sorted.sort((a, b) => b.rankFields.sales - a.rankFields.sales);
  else if (sort === 'newest') sorted.sort((a, b) => a.rankFields.newness - b.rankFields.newness);
  else if (sort === 'priceAsc') sorted.sort((a, b) => a.price - b.price);
  else if (sort === 'priceDesc') sorted.sort((a, b) => b.price - a.price);

  const priceActive = sort === 'priceAsc' || sort === 'priceDesc';
  const showProducts = tab === 'products';

  return (
    <div className="relative flex h-full flex-col bg-[var(--app-bg)]">
      {/* 顶栏:返回 + 店名 + 关注 + 更多 */}
      <div className="flex items-center gap-2 bg-[var(--app-surface)] px-2 pb-2 pt-10">
        <button {...bindBack()} className="cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]">
          <IcNavBack size={24} />
        </button>
        <span className="min-w-0 flex-1 truncate text-[16px] font-bold text-[var(--app-text)]">{shop.name}</span>
        <button
          {...action('shop.main.follow.toggle', () => toggleFollowShop(shop.id))}
          className={`shrink-0 cursor-pointer rounded-full px-3 py-1 text-[12px] ${
            isFollowed ? 'border-none bg-[var(--app-c-chip-bg)] text-[#888]' : 'border border-[var(--app-primary)] bg-[var(--app-surface)] font-bold text-[var(--app-primary)]'
          }`}
        >
          {isFollowed ? S.followed : S.follow}
        </button>
        <button {...action('shop.main.wontfix.toast', wontfix)} className="cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]">
          <IcMore size={20} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 店头:店铺 KV + 自营/好店标 + 粉丝数 */}
        <div className="flex items-center gap-3 bg-gradient-to-b from-[#FDE3CE] to-[var(--app-bg)] px-3 py-3">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white bg-[var(--app-surface)]">
            <Img src={shop.logo} className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="truncate text-[16px] font-bold text-[var(--app-text)]">{shop.name}</span>
              <span
                className={`shrink-0 rounded-sm px-1 text-[10px] font-bold leading-4 text-white ${
                  isStore ? 'bg-[#B0651F]' : 'bg-[var(--app-c-danger)]'
                }`}
              >
                {isStore ? S.goodShopTag : S.selfShopTag}
              </span>
            </div>
            <div className="mt-1 text-[12px] text-[#666]">
              {fansText(followers)}
              {S.followersSuffix}
            </div>
          </div>
        </div>

        {/* 店内导航:搜索胶囊 + 精选/商品/促销/上新/热销 */}
        <div className="bg-[var(--app-surface)] px-3 pb-2 pt-2">
          <button
            {...action('shop.main.wontfix.toast', wontfix)}
            className="flex w-full cursor-pointer items-center gap-1 rounded-full border-none bg-[var(--app-c-chip-bg)] px-3 py-1.5 text-left"
          >
            <IcSearch size={14} className="text-[var(--app-c-text-muted)]" />
            <span className="text-[12px] text-[var(--app-c-text-muted)]">{S.shopSearchPlaceholder}</span>
          </button>
          <div className="mt-2 flex gap-4">
            <button
              {...action('shop.main.select.featured', () => goTab('featured'))}
              className={`cursor-pointer border-none bg-transparent p-0 text-[14px] ${
                showProducts ? 'text-[var(--app-text-muted)]' : 'font-bold text-[var(--app-primary)]'
              }`}
            >
              {S.tabPicked}
            </button>
            <button
              {...action('shop.main.select.products', () => goTab('products'))}
              className={`cursor-pointer border-none bg-transparent p-0 text-[14px] ${
                showProducts ? 'font-bold text-[var(--app-primary)]' : 'text-[var(--app-text-muted)]'
              }`}
            >
              {S.tabProduct}
            </button>
            {/* 同组一致:促销/上新/热销 全部 toast */}
            <button {...action('shop.main.wontfix.toast', wontfix)} className="cursor-pointer border-none bg-transparent p-0 text-[14px] text-[var(--app-text-muted)]">
              {S.shopNavPromo}
            </button>
            <button {...action('shop.main.wontfix.toast', wontfix)} className="cursor-pointer border-none bg-transparent p-0 text-[14px] text-[var(--app-text-muted)]">
              {S.sortNew}
            </button>
            <button {...action('shop.main.wontfix.toast', wontfix)} className="cursor-pointer border-none bg-transparent p-0 text-[14px] text-[var(--app-text-muted)]">
              {S.shopNavHot}
            </button>
          </div>
        </div>

        {/* 排序行(仅商品Tab) */}
        {showProducts && (
          <div className="mt-1 flex items-center bg-[var(--app-surface)] px-2">
            <button
              {...action('shop.main.select.default', () => setSort('default'))}
              className={`flex-1 cursor-pointer border-none bg-transparent py-2.5 text-[14px] ${
                sort === 'default' ? 'font-bold text-[var(--app-primary)]' : 'text-[var(--app-text)]'
              }`}
            >
              {S.sortDefault}
            </button>
            <button
              {...action('shop.main.select.sales', () => setSort('sales'))}
              className={`flex-1 cursor-pointer border-none bg-transparent py-2.5 text-[14px] ${
                sort === 'sales' ? 'font-bold text-[var(--app-primary)]' : 'text-[var(--app-text)]'
              }`}
            >
              {S.sortSales}
            </button>
            <button
              {...action('shop.main.select.newest', () => setSort('newest'))}
              className={`flex-1 cursor-pointer border-none bg-transparent py-2.5 text-[14px] ${
                sort === 'newest' ? 'font-bold text-[var(--app-primary)]' : 'text-[var(--app-text)]'
              }`}
            >
              {S.sortNew}
            </button>
            <button
              {...action('shop.main.select.price', () => setSort(sort === 'priceAsc' ? 'priceDesc' : 'priceAsc'))}
              className={`flex flex-1 cursor-pointer items-center justify-center gap-0.5 border-none bg-transparent py-2.5 text-[14px] ${
                priceActive ? 'font-bold text-[var(--app-primary)]' : 'text-[var(--app-text)]'
              }`}
            >
              {S.sortPrice}
              <span className="flex flex-col">
                <IcChevronUp size={9} className={sort === 'priceAsc' ? 'text-[var(--app-primary)]' : 'text-[var(--app-c-text-muted)]'} strokeWidth={3} />
                <IcChevronDown size={9} className={sort === 'priceDesc' ? 'text-[var(--app-primary)]' : 'text-[var(--app-c-text-muted)]'} strokeWidth={3} />
              </span>
            </button>
            <button
              {...action('shop.main.wontfix.toast', wontfix)}
              className="shrink-0 cursor-pointer border-none bg-transparent px-1 py-2.5 text-[var(--app-text-muted)]"
            >
              <IcLayout size={18} />
            </button>
          </div>
        )}

        {/* 商品网格(精选Tab 带大字标题) */}
        <ShopGrid products={showProducts ? sorted : all} featuredTitle={showProducts ? '' : S.pickGoods} />
        <div className="h-16" />
      </div>

      {/* 悬浮:购物车浮标 + 领券中心浮标(仅商品Tab) */}
      {showProducts && (
        <div className="absolute bottom-24 right-3 flex flex-col gap-2">
          <button
            {...bindTap('shop.main.cart.open')}
            className="relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)] shadow-md"
          >
            <IcCart size={19} />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-[var(--app-c-danger)] px-1 text-center text-[10px] leading-4 text-white">
                {cartCount}
              </span>
            )}
          </button>
          <button
            {...action('shop.main.wontfix.toast', wontfix)}
            className="flex h-11 w-11 cursor-pointer flex-col items-center justify-center rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-primary)] shadow-md"
          >
            <IcTicket size={17} />
            <span className="text-[8px] leading-3 text-[var(--app-text-muted)]">{S.couponCenter}</span>
          </button>
        </div>
      )}

      {/* 店铺底部 Tab:品牌Logo / 全部商品 / 发现 / 商品分类 [/ 联系客服(专卖店)] */}
      <div className="flex items-center border-t border-[var(--app-border)] bg-[var(--app-surface)] px-2 py-1.5">
        <button
          {...action('shop.main.wontfix.toast', wontfix)}
          className="flex flex-1 cursor-pointer flex-col items-center border-none bg-transparent"
        >
          <div className="h-6 w-6 overflow-hidden rounded-full border border-[var(--app-border)] bg-[var(--app-surface)]">
            <Img src={shop.logo} className="h-full w-full object-cover" />
          </div>
        </button>
        <button
          {...action('shop.main.select.allProducts', () => {
            setSort('default');
            goTab('products');
          })}
          className="flex flex-1 cursor-pointer flex-col items-center border-none bg-transparent text-[var(--app-text-muted)]"
        >
          <IcStore size={18} />
          <span className="text-[10px] leading-3">{S.allProducts}</span>
        </button>
        <button
          {...action('shop.main.wontfix.toast', wontfix)}
          className="flex flex-1 cursor-pointer flex-col items-center border-none bg-transparent text-[var(--app-text-muted)]"
        >
          <IcSearch size={18} />
          <span className="text-[10px] leading-3">{S.shopDiscover}</span>
        </button>
        <button
          {...action('shop.main.wontfix.toast', wontfix)}
          className="flex flex-1 cursor-pointer flex-col items-center border-none bg-transparent text-[var(--app-text-muted)]"
        >
          <IcLayout size={18} />
          <span className="text-[10px] leading-3">{S.shopCategory}</span>
        </button>
        {isStore && (
          <button
            {...bindTap('shop.main.chat.open', { params: { shopId: shop.id } })}
            className="flex flex-1 cursor-pointer flex-col items-center border-none bg-transparent text-[var(--app-text-muted)]"
          >
            <IcService size={18} />
            <span className="text-[10px] leading-3">{S.contactService}</span>
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * 店内双列商品网格(独立组件:避免 Tab 条件包裹 transition 绑定点)。
 * 卡片进对应模板商详;加购小按钮跳商详并弹 SKU 规格弹层(与详情页加购等价,走查 0813 反馈③)。
 */
function ShopGrid({ products, featuredTitle }: { products: Product[]; featuredTitle: string }) {
  const { bindTap } = useSuningGestures();
  const S = useStrings();
  const setTemp = useSuningStore((s) => s.setTemp);

  return (
    <div className="mt-1 px-2 pt-2">
      {featuredTitle && <div className="px-1 pb-2 text-[22px] font-bold text-[var(--app-text)]">{featuredTitle}</div>}
      <div className="grid grid-cols-2 gap-2">
        {products.map((p, i) => {
          const label = promoLabel(p);
          return (
            <div key={p.id} className="overflow-hidden rounded-xl bg-[var(--app-surface)]">
              <div {...bindTap('shop.main.detail.open', { params: { productId: p.id } })} className="cursor-pointer">
                <div className="aspect-square w-full bg-[var(--app-c-chip-bg)]">
                  <Img src={p.image} className="h-full w-full object-contain" />
                </div>
                <div className="px-2 pt-2">
                  {i < 3 && (
                    <div className="mb-1 inline-block rounded-sm bg-[#FDF0E2] px-1 text-[10px] leading-4 text-[#B0651F]">
                      {S.shopSalesRank}
                      {i + 1}
                      {S.rankNoSuffix}
                    </div>
                  )}
                  <div className="line-clamp-2 text-[13px] leading-[18px] text-[var(--app-text)]">{p.title}</div>
                  {label && (
                    <span className="mt-1 inline-block rounded-sm bg-[var(--app-c-danger)] px-1 text-[9px] leading-4 text-white">{label}</span>
                  )}
                </div>
              </div>
              <div className="flex items-end px-2 pb-2 pt-1">
                <div className="min-w-0 flex-1">
                  <div className="text-[16px] font-bold leading-none text-[var(--app-c-danger)]">
                    <span className="text-[11px]">¥</span>
                    {p.price}
                  </div>
                  <div className="mt-1 truncate text-[10px] text-[var(--app-c-text-muted)]">
                    {p.reviewCount}
                    {S.reviewsLabel} · {p.goodRate}%{S.goodRateLabel}
                  </div>
                </div>
                <button
                  {...bindTap('shop.main.skuAdd.open', {
                    params: { productId: p.id },
                    beforeTrigger: () => setTemp({ skuEntryHint: 'add' }),
                  })}
                  className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-dark)] text-white"
                >
                  <IcPlus size={15} />
                </button>
              </div>
            </div>
          );
        })}
        {products.length === 0 && <div className="col-span-2 py-12 text-center text-[13px] text-[var(--app-c-text-muted)]">{S.emptyNoData}</div>}
      </div>
    </div>
  );
}
