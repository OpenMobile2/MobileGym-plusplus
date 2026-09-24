import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { useTbsgStore } from '../state';
import { fmt } from '../utils';
import type { TbItem } from '../types';
import {
  AppImg, EmptyState, Price, Stars, TopBar, fmtTime, showToast,
} from '../components/common';
import { SkuSheet } from '../components/SkuSheet';
import { ShopCartBar, ShopCartDetailSheet } from '../components/ShopCartBar';
import { MoreMenuSheet } from '../components/MoreMenuSheet';
import { Stepper } from '../components/Stepper';
import {
  IcBack, IcHeart, IcMore, IcPlus, IcRight, IcSearch, IcShare,
} from '../res/icons';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { useStatusBarBg } from '../statusbar';

/** 零售店铺页(罗森式,spec shop.retail,IMG_6050/6051/6073):首页/商品/评价三tab */
export default function RetailShopPage() {
  const { shopId = '' } = useParams();
  const [sp, setSp] = useSearchParams();
  const { bindTap, bindBack } = useTbsgGestures();
  const s = useAppStrings(strings, stringsEn);
  const [searchQ, setSearchQ] = useState('');

  const shops = useTbsgStore((st) => st.shops);
  const items = useTbsgStore((st) => st.items);
  const cart = useTbsgStore((st) => st.cart);
  const reviewsMap = useTbsgStore((st) => st.reviews);
  const favorites = useTbsgStore((st) => st.favorites);
  const touchRecentShop = useTbsgStore((st) => st.touchRecentShop);
  const toggleFavorite = useTbsgStore((st) => st.toggleFavorite);
  const addToCart = useTbsgStore((st) => st.addToCart);
  const claimShopCoupon = useTbsgStore((st) => st.claimShopCoupon);
  const beginCheckout = useTbsgStore((st) => st.beginCheckout);

  const shop = shops.find((x) => x.id === shopId);
  // 顶部是品牌色氛围头,状态栏同色消除接缝
  useStatusBarBg(shop?.brandColor ?? '#ffffff');

  useEffect(() => {
    if (shopId) touchRecentShop(shopId);
  }, [shopId, touchRecentShop]);

  if (!shop) {
    return (
      <div className="flex flex-col h-full bg-white">
        <TopBar title="店铺" />
        <EmptyState text={s.emptyList} />
      </div>
    );
  }

  const tab = sp.get('tab') ?? 'home';
  const mode: 'delivery' | 'pickup' = sp.get('mode') === 'pickup' ? 'pickup' : 'delivery';
  const panel = sp.get('panel');
  const skuItem = items.find((i) => i.id === sp.get('item'));
  const reviews = reviewsMap[shop.id] ?? [];
  const isFav = favorites.includes(shop.id);
  const shopItems = shop.menu.flatMap((m) => m.itemIds)
    .map((id) => items.find((i) => i.id === id))
    .filter((i): i is TbItem => !!i);
  const shopLines = cart.filter((l) => l.shopId === shop.id);

  const selectTab = (t: string) =>
    setSp((p) => {
      if (t === 'home') p.delete('tab'); else p.set('tab', t);
      return p;
    }, { replace: true });

  const checkoutBinding = bindTap<HTMLButtonElement>('retail.checkout-open', {
    beforeTrigger: () => beginCheckout(shop.id, mode),
  });

  const addBinding = (item: TbItem) =>
    bindTap<HTMLButtonElement>(
      { kind: 'action', id: 'retail.item.add' },
      { params: { itemId: item.id }, onTrigger: () => addToCart(item.id, null, item.price) },
    );

  const claimBinding = (couponId: string) =>
    bindTap<HTMLButtonElement>(
      { kind: 'action', id: 'retail.coupon.claim' },
      {
        params: { couponId },
        onTrigger: () => {
          if (shop.shopCoupon.claimed) { showToast('已领取,可在券包查看'); return; }
          claimShopCoupon(shop.id);
          showToast('领取成功,已放入券包');
        },
      },
    );

  /* ---------- 首页 tab ---------- */
  const homeTab = (
    <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
      {/* 店铺信息卡 */}
      <div className="bg-white rounded-2xl mx-3 mt-2 px-3.5 py-3">
        <div className="flex items-start gap-2.5">
          <AppImg src={shop.logo} className="w-14 h-14 rounded-xl object-cover shrink-0 border border-[#EEEEEE]" />
          <div className="flex-1 min-w-0">
            <div className="text-[19px] font-bold text-[#1A1A1A] truncate">{shop.fullName}</div>
            <div className="flex items-center gap-3 mt-1 text-[12px] text-[#1A1A1A]">
              <span>评分 <span className="text-[#ED6C2C] font-bold text-[14px]">{shop.rating}</span></span>
              <span>月售 {shop.monthlySales}</span>
              <span className="text-[#0BA05C]">⚡蜂鸟准时达 约{shop.deliveryMinutes}分钟</span>
            </div>
            <div className="text-[11px] text-[#999999] mt-0.5 truncate">商家特色 {shop.features.join(' · ') || '品质零售'}</div>
          </div>
        </div>
        {mode === 'pickup' && (
          <div className="text-[12px] text-[#1A1A1A] bg-[#F3F6F8] rounded-lg px-2 py-1.5 mt-2">
            距您{shop.distanceKm}km · 下单后约20分钟可取
          </div>
        )}
        {/* 优惠胶囊行 */}
        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto" data-scroll-container="retail-promos" data-scroll-direction="horizontal">
          <button
            {...bindTap<HTMLButtonElement>(
              { kind: 'action', id: 'retail.coupon.claim' },
              { params: { couponId: 'burst' }, onTrigger: () => showToast('红包已爆涨至最高') },
            )}
            className="shrink-0 inline-flex items-center text-[12px] font-bold text-white rounded-md px-1.5 py-1 border-none cursor-pointer"
            style={{ background: 'linear-gradient(90deg,#EB493B,#F0693C)' }}
          >
            爆↑最高{fmt(shop.burstCoupon.amount)}<span className="ml-1 text-[10px] font-normal bg-white/25 rounded px-1">爆涨</span>
          </button>
          <button
            {...claimBinding(`df_${shop.id}`)}
            className={`shrink-0 inline-flex items-center text-[12px] font-bold rounded-md px-1.5 py-1 border cursor-pointer ${
              shop.shopCoupon.claimed ? 'text-[#999999] border-[#DDDDDD] bg-[#F3F6F8]' : 'text-[#EB493B] border-[#EB493B] bg-[#FEF4F3]'
            }`}
          >
            ¥{fmt(Math.max(1, Math.round((shop.deliveryFeeOrig - shop.deliveryFee) * 100) / 100))}配送费
            <span className={`ml-1 text-[10px] font-normal rounded px-1 ${shop.shopCoupon.claimed ? 'bg-[#DDDDDD] text-white' : 'bg-[#EB493B] text-white'}`}>
              {shop.shopCoupon.claimed ? '已领' : '领'}
            </span>
          </button>
          <button
            {...claimBinding(shop.shopCoupon.id)}
            className={`shrink-0 inline-flex items-center text-[12px] font-bold rounded-md px-1.5 py-1 border cursor-pointer ${
              shop.shopCoupon.claimed ? 'text-[#999999] border-[#DDDDDD] bg-[#F3F6F8]' : 'text-[#EB493B] border-[#EB493B] bg-[#FEF4F3]'
            }`}
          >
            ¥{fmt(shop.shopCoupon.amount)}店铺券
            <span className={`ml-1 text-[10px] font-normal rounded px-1 ${shop.shopCoupon.claimed ? 'bg-[#DDDDDD] text-white' : 'bg-[#EB493B] text-white'}`}>
              {shop.shopCoupon.claimed ? '已领' : '领'}
            </span>
          </button>
          <span className="shrink-0 text-[11px] text-[#999999] inline-flex items-center">更多优惠<IcRight size={12} /></span>
        </div>
      </div>

      {/* 活动轮播 banner(静态 1/3) */}
      <div className="mx-3 mt-2.5 relative">
        <AppImg src="/@app-assets/TaobaoShangou/banners/banner_ice.jpg" className="w-full h-28 rounded-2xl object-cover" />
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          <span className="w-3 h-1 rounded-full bg-white" />
          <span className="w-1 h-1 rounded-full bg-white/50" />
          <span className="w-1 h-1 rounded-full bg-white/50" />
        </div>
      </div>

      {/* 分类宫格 */}
      <div className="bg-white rounded-2xl mx-3 mt-2.5 px-2 py-3 grid grid-cols-4 gap-y-3.5">
        {shop.menu.map((m) => {
          const first = items.find((i) => i.id === m.itemIds[0]);
          return (
            <button
              key={m.cat}
              {...bindTap<HTMLButtonElement>(
                { kind: 'action', id: 'retail.category.select' },
                {
                  params: { cat: m.cat },
                  onTrigger: () => setSp((p) => { p.set('tab', 'goods'); p.set('cat', m.cat); return p; }, { replace: true }),
                },
              )}
              className="flex flex-col items-center gap-1.5 bg-transparent border-none cursor-pointer"
            >
              <AppImg src={first?.image ?? ''} className="w-12 h-12 rounded-full object-cover border border-[#EEEEEE]" />
              <span className="text-[11px] text-[#1A1A1A]">{m.cat}</span>
            </button>
          );
        })}
        <button
          {...bindTap<HTMLButtonElement>(
            { kind: 'action', id: 'retail.category.select' },
            {
              params: { cat: '全部' },
              onTrigger: () => setSp((p) => { p.set('tab', 'goods'); p.delete('cat'); return p; }, { replace: true }),
            },
          )}
          className="flex flex-col items-center gap-1.5 bg-transparent border-none cursor-pointer"
        >
          <span className="w-12 h-12 rounded-full bg-[#F3F6F8] flex items-center justify-center text-[16px] text-[#ED6C2C]">
            <IcMore size={20} />
          </span>
          <span className="text-[11px] text-[#1A1A1A]">全部分类</span>
        </button>
      </div>

      {/* 超级爆款横滑 */}
      <div className="bg-white rounded-2xl mx-3 mt-2.5 px-3 py-3">
        <div className="flex items-center">
          <span className="text-[16px] font-bold text-[#1A1A1A]">超级爆款</span>
          <span className="text-[12px] text-[#999999] ml-2">冰爽一夏 · 每日补贴</span>
        </div>
        <div className="flex gap-2.5 mt-2.5 overflow-x-auto" data-scroll-container="hotpicks" data-scroll-direction="horizontal">
          {shopItems.slice(0, 6).map((item) => (
            <div key={item.id} className="w-[104px] shrink-0">
              <AppImg src={item.image} className="w-[104px] h-[104px] rounded-xl object-cover" />
              <div className="text-[12px] text-[#1A1A1A] truncate mt-1">{item.name}</div>
              <div className="flex items-center justify-between mt-0.5">
                <Price value={item.price} size={14} />
                <button {...addBinding(item)} className="w-5 h-5 rounded-full bg-[#ED6C2C] text-white border-none flex items-center justify-center cursor-pointer p-0" aria-label="加购">
                  <IcPlus size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 省心凑提示条 */}
      <div className="mx-3 mt-2.5 mb-3 rounded-xl bg-[#FDECEF] px-3 py-2 flex items-center">
        <span className="text-[13px] font-bold text-[#EB493B]">省心凑</span>
        <span className="text-[12px] text-[#1A1A1A] ml-2 flex-1 truncate">
          你有红包可爆至<span className="text-[#EB493B] font-semibold">{fmt(shop.shopCoupon.amount + 4)}元</span>
        </span>
        <span className="text-[11px] text-[#EB493B]">惊喜爆涨</span>
      </div>
    </div>
  );

  /* ---------- 商品 tab(左右双栏,IMG_6073) ---------- */
  const selCat = sp.get('cat') ?? shop.menu[0]?.cat ?? '';
  const goodsCat = shop.menu.find((m) => m.cat === selCat) ?? shop.menu[0];
  const goodsTab = (
    <div className="flex-1 flex min-h-0 bg-white">
      <div className="w-20 shrink-0 bg-[#F3F6F8]">
        {shop.menu.map((m) => {
          const active = goodsCat?.cat === m.cat;
          return (
            <button
              key={m.cat}
              {...bindTap<HTMLButtonElement>(
                { kind: 'action', id: 'retail.category.select' },
                { params: { cat: m.cat }, onTrigger: () => setSp((p) => { p.set('cat', m.cat); return p; }, { replace: true }) },
              )}
              className={`relative w-full px-2 py-3.5 text-[12px] border-none cursor-pointer text-center leading-tight ${
                active ? 'bg-white text-[#1A1A1A] font-bold' : 'bg-transparent text-[#5A5A5A]'
              }`}
            >
              {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-[#ED6C2C] rounded-full" />}
              {m.cat}
            </button>
          );
        })}
      </div>
      <div className="flex-1 overflow-y-auto min-w-0" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="px-3 pt-2.5 text-[15px] font-bold text-[#1A1A1A]">{goodsCat?.cat}</div>
        {(goodsCat?.itemIds ?? [])
          .map((id) => items.find((i) => i.id === id))
          .filter((i): i is TbItem => !!i)
          .map((item) => {
            const qty = shopLines.filter((l) => l.itemId === item.id).reduce((a, l) => a + l.qty, 0);
            return (
              <div key={item.id} className="flex gap-2.5 px-3 py-2.5">
                <div className="relative shrink-0">
                  <AppImg src={item.image} className="w-20 h-20 rounded-xl object-cover" />
                  <span className="absolute top-0 left-0 text-[9px] text-white bg-[#EB493B] rounded-tl-xl rounded-br-lg px-1 py-px">爆好价</span>
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="text-[14px] font-semibold text-[#1A1A1A] leading-snug line-clamp-2">{item.name}</div>
                  <div className="text-[11px] text-[#999999] mt-0.5">已售{item.monthlySales}</div>
                  <div className="flex items-end justify-between mt-auto">
                    <span>
                      <Price value={item.price} size={16} orig={item.origPrice} />
                      <span className="text-[11px] text-[#999999]">/份</span>
                    </span>
                    {item.skuGroups ? (
                      <button
                        {...bindTap<HTMLButtonElement>(
                          { kind: 'action', id: 'retail.item.add' },
                          {
                            params: { itemId: item.id },
                            onTrigger: () => setSp((p) => { p.set('panel', 'sku'); p.set('item', item.id); return p; }),
                          },
                        )}
                        className="h-6 px-2.5 rounded-full bg-[#ED6C2C] text-white text-[12px] font-semibold border-none cursor-pointer"
                      >
                        选规格
                      </button>
                    ) : (
                      <span className="relative">
                        <button {...addBinding(item)} className="w-6 h-6 rounded-full bg-[#ED6C2C] text-white border-none flex items-center justify-center cursor-pointer p-0" aria-label="加购">
                          <IcPlus size={15} />
                        </button>
                        {qty > 0 && (
                          <span className="absolute -top-2 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#F53F3F] text-white text-[10px] flex items-center justify-center">{qty}</span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        <div className="py-4 text-center text-[11px] text-[#999999]">- 已经到底啦 -</div>
      </div>
    </div>
  );

  /* ---------- 评价 tab(简化静态) ---------- */
  const reviewsTab = (
    <div className="flex-1 overflow-y-auto bg-white" data-scroll-container="main" data-scroll-direction="vertical">
      <div className="flex items-center px-4 pt-4 pb-2">
        <span className="text-[40px] font-bold text-[#ED6C2C] leading-none">{shop.rating}</span>
        <span className="ml-2"><Stars value={shop.rating} size={14} /></span>
        <div className="ml-auto flex gap-5 text-center">
          <div><div className="text-[11px] text-[#999999]">质量</div><div className="text-[15px] font-bold text-[#1A1A1A]">{shop.ratingTaste}</div></div>
          <div><div className="text-[11px] text-[#999999]">包装</div><div className="text-[15px] font-bold text-[#1A1A1A]">{shop.ratingPack}</div></div>
        </div>
      </div>
      {reviews.length === 0 && <EmptyState text="暂无评价" />}
      {reviews.map((r) => (
        <div key={r.id} className="px-4 py-3 border-t border-[#EEEEEE]">
          <div className="flex items-center gap-2">
            <AppImg src={r.avatar} className="w-9 h-9 rounded-full object-cover" />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-[#1A1A1A] truncate">{r.userName}</div>
              <Stars value={r.stars} size={11} />
            </div>
            <span className="text-[11px] text-[#999999] shrink-0">{fmtTime(r.ts)}</span>
          </div>
          {r.text && <div className="text-[13px] text-[#1A1A1A] leading-relaxed mt-1.5">{r.text}</div>}
          {r.images.length > 0 && (
            <div className="flex gap-1.5 mt-2">
              {r.images.map((img) => (
                <AppImg key={img} src={img} className="w-24 h-24 rounded-lg object-cover" />
              ))}
            </div>
          )}
        </div>
      ))}
      <div className="py-4 text-center text-[11px] text-[#999999]">- 已经到底啦 -</div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#F3F6F8] relative" data-status-bar-foreground="light">
      {/* 顶部:返回+搜索框(可点)+收藏/分享/更多 */}
      <div className="shrink-0 px-2 pt-2 pb-2 flex items-center gap-1.5" style={{ background: `linear-gradient(180deg, ${shop.brandColor}, ${shop.brandColor}B3)` }}>
        <button {...bindBack<HTMLButtonElement>()} className="w-8 h-8 rounded-full bg-black/25 text-white flex items-center justify-center border-none cursor-pointer" aria-label="返回">
          <IcBack size={18} />
        </button>
        <button
          {...bindTap<HTMLButtonElement>(
            { kind: 'action', id: 'retail.search.open' },
            { onTrigger: () => { setSearchQ(''); setSp((p) => { p.set('panel', 'search'); return p; }); } },
          )}
          className="flex-1 h-8 rounded-full bg-white flex items-center px-3 gap-1.5 min-w-0 border-none cursor-pointer"
        >
          <span className="text-[13px] text-[#999999] flex-1 truncate text-left">{shopItems[0]?.name ?? s.searchPlaceholder}</span>
          <IcSearch size={15} className="text-[#999999]" />
        </button>
        <button
          {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'retail.favorite.toggle' }, { onTrigger: () => toggleFavorite(shop.id) })}
          className="w-8 h-8 rounded-full bg-black/25 text-white flex items-center justify-center border-none cursor-pointer" aria-label="收藏"
        >
          <IcHeart size={16} className={isFav ? 'text-[#ED6C2C]' : undefined} fill={isFav ? '#ED6C2C' : 'none'} />
        </button>
        <button
          {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'retail.share.stub' }, { onTrigger: () => showToast(s.notOpen) })}
          className="w-8 h-8 rounded-full bg-black/25 text-white flex items-center justify-center border-none cursor-pointer" aria-label="分享"
        >
          <IcShare size={16} />
        </button>
        <button
          {...bindTap<HTMLButtonElement>(
            { kind: 'action', id: 'shop.moremenu.open' },
            { onTrigger: () => setSp((p) => { p.set('panel', 'more'); return p; }) },
          )}
          className="w-8 h-8 rounded-full bg-black/25 text-white flex items-center justify-center border-none cursor-pointer" aria-label="更多"
        >
          <IcMore size={16} />
        </button>
      </div>

      {/* tab 行 + 外卖/自取 */}
      <div className="shrink-0 flex items-center px-3 pt-2 pb-1.5 bg-white">
        {([['home', '首页'], ['goods', '商品'], ['reviews', '评价']] as const).map(([key, label]) => (
          <button
            key={key}
            {...bindTap<HTMLButtonElement>(
              { kind: 'action', id: 'retail.tab.select' },
              { params: { tab: key }, onTrigger: () => selectTab(key) },
            )}
            className={`mr-6 pb-1 bg-transparent border-none cursor-pointer text-[16px] relative ${
              tab === key ? 'font-bold text-[#1A1A1A]' : 'text-[#5A5A5A]'
            }`}
          >
            {label}
            {tab === key && <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-5 h-[3px] bg-[#ED6C2C] rounded-full" />}
          </button>
        ))}
        {shop.supportsPickup && (
          <div className="ml-auto inline-flex bg-[#F3F6F8] rounded-full p-0.5">
            <button
              {...bindTap<HTMLButtonElement>(
                { kind: 'action', id: 'shop.pickup.toggle' },
                { params: { mode: 'delivery' }, onTrigger: () => setSp((p) => { p.delete('mode'); return p; }, { replace: true }) },
              )}
              className={`h-7 px-3 rounded-full text-[12px] border-none cursor-pointer ${mode === 'delivery' ? 'bg-white text-[#1A1A1A] font-bold shadow' : 'bg-transparent text-[#999999]'}`}
            >
              外卖
            </button>
            <button
              {...bindTap<HTMLButtonElement>(
                { kind: 'action', id: 'shop.pickup.toggle' },
                { params: { mode: 'pickup' }, onTrigger: () => setSp((p) => { p.set('mode', 'pickup'); return p; }, { replace: true }) },
              )}
              className={`h-7 px-3 rounded-full text-[12px] border-none cursor-pointer ${mode === 'pickup' ? 'bg-white text-[#1A1A1A] font-bold shadow' : 'bg-transparent text-[#999999]'}`}
            >
              自取
            </button>
          </div>
        )}
      </div>

      {/* tab 内容 */}
      {tab === 'goods' ? goodsTab : tab === 'reviews' ? reviewsTab : homeTab}

      {/* 吸底购物车栏 */}
      <ShopCartBar shop={shop} mode={mode} checkoutBinding={checkoutBinding} />

      {/* 弹层(URL 驱动) */}
      {panel === 'sku' && skuItem && <SkuSheet key={skuItem.id} item={skuItem} />}
      {panel === 'cartbar' && <ShopCartDetailSheet shop={shop} />}
      {panel === 'more' && <MoreMenuSheet />}

      {/* 店内商品搜索弹层(按关键词过滤本店商品,可直接加购/选规格) */}
      {panel === 'search' && (
        <div className="absolute inset-0 z-50 bg-white flex flex-col">
          <div className="flex items-center gap-2 px-2 h-12 shrink-0 border-b border-[#EEEEEE]">
            <button {...bindBack<HTMLButtonElement>()} className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer" aria-label="返回">
              <IcBack size={20} className="text-[#1A1A1A]" />
            </button>
            <div className="flex-1 h-9 rounded-full bg-[#F3F6F8] flex items-center px-3 gap-2">
              <IcSearch size={16} className="text-[#999999]" />
              <input
                {...bindTap<HTMLInputElement>({ kind: 'action', id: 'retail.search.input' }, { onTrigger: () => {} })}
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder={`搜索${shop.name}的商品`}
                className="flex-1 min-w-0 bg-transparent outline-none border-none text-[14px] text-[#1A1A1A] placeholder:text-[#999999]"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto" data-scroll-container="retailsearch" data-scroll-direction="vertical">
            {(() => {
              const q = searchQ.trim();
              const res = q ? shopItems.filter((i) => `${i.name}${i.desc}${i.tags.join('')}`.includes(q)) : shopItems;
              if (res.length === 0) return <EmptyState text="未找到相关商品" />;
              return res.map((item) => {
                const qty = shopLines.filter((l) => l.itemId === item.id).reduce((a, l) => a + l.qty, 0);
                return (
                  <div key={item.id} className="flex gap-2.5 px-3 py-2.5 border-b border-[#F5F5F5]">
                    <AppImg src={item.image} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="text-[14px] font-semibold text-[#1A1A1A] leading-snug line-clamp-2">{item.name}</div>
                      <div className="text-[11px] text-[#999999] mt-0.5">已售{item.monthlySales}</div>
                      <div className="flex items-end justify-between mt-auto">
                        <Price value={item.price} size={16} orig={item.origPrice} />
                        {item.skuGroups ? (
                          <button
                            {...bindTap<HTMLButtonElement>(
                              { kind: 'action', id: 'retail.item.add' },
                              { params: { itemId: item.id }, onTrigger: () => setSp((p) => { p.set('panel', 'sku'); p.set('item', item.id); return p; }) },
                            )}
                            className="h-6 px-2.5 rounded-full bg-[#ED6C2C] text-white text-[12px] font-semibold border-none cursor-pointer"
                          >
                            选规格
                          </button>
                        ) : (
                          <span className="relative">
                            <button {...addBinding(item)} className="w-6 h-6 rounded-full bg-[#ED6C2C] text-white border-none flex items-center justify-center cursor-pointer p-0" aria-label="加购">
                              <IcPlus size={15} />
                            </button>
                            {qty > 0 && (
                              <span className="absolute -top-2 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#F53F3F] text-white text-[10px] flex items-center justify-center">{qty}</span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
