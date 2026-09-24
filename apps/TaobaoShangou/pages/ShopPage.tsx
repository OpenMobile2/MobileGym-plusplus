import React, { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import * as TimeService from '@/os/TimeService';
import { useAppStrings } from '@/os/useAppStrings';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { useTbsgStore } from '../state';
import { fmt } from '../utils';
import type { TbItem, TbShop } from '../types';
import {
  AppImg, EmptyState, Price, Stars, TopBar, fmtTime, showToast,
} from '../components/common';
import { Stepper } from '../components/Stepper';
import { SkuSheet } from '../components/SkuSheet';
import { ShopCartBar, ShopCartDetailSheet } from '../components/ShopCartBar';
import { ShopCouponSheet } from '../components/ShopCouponSheet';
import { FoodcardSheet } from '../components/FoodcardSheet';
import { AddonSheet } from '../components/AddonSheet';
import { MoreMenuSheet } from '../components/MoreMenuSheet';
import {
  IcBack, IcClose, IcDown, IcHeart, IcMore, IcPhone, IcRight, IcSearch, IcService, IcClock, IcShield,
} from '../res/icons';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { useStatusBarBg } from '../statusbar';

const REVIEW_TAGS = ['全部', '最新', '有图视频', '回头客评价', '好吃'];

/** 餐饮店铺页(spec shop.restaurant/shop.reviews/shop.merchant + 弹层,IMG_6012~6019/6044/6048/IMG_R011) */
export default function ShopPage() {
  const { shopId = '' } = useParams();
  const [sp, setSp] = useSearchParams();
  const { bindTap, bindBack } = useTbsgGestures();
  const s = useAppStrings(strings, stringsEn);

  const shops = useTbsgStore((st) => st.shops);
  const items = useTbsgStore((st) => st.items);
  const cart = useTbsgStore((st) => st.cart);
  const reviewsMap = useTbsgStore((st) => st.reviews);
  const orders = useTbsgStore((st) => st.orders);
  const favorites = useTbsgStore((st) => st.favorites);
  const touchRecentShop = useTbsgStore((st) => st.touchRecentShop);
  const toggleFavorite = useTbsgStore((st) => st.toggleFavorite);
  const addToCart = useTbsgStore((st) => st.addToCart);
  const changeCartQty = useTbsgStore((st) => st.changeCartQty);
  const reorder = useTbsgStore((st) => st.reorder);
  const beginCheckout = useTbsgStore((st) => st.beginCheckout);

  const shop = shops.find((x) => x.id === shopId);

  useEffect(() => {
    if (shopId) touchRecentShop(shopId);
  }, [shopId, touchRecentShop]);

  const [collapsed, setCollapsed] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  // 展开态顶部是品牌色氛围图,收起态是白色工具栏;状态栏随之变色
  useStatusBarBg(collapsed ? '#ffffff' : (shop?.brandColor ?? '#ffffff'));
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [revTag, setRevTag] = useState('全部');
  const [contentOnly, setContentOnly] = useState(true);
  const [expandedReplies, setExpandedReplies] = useState<string[]>([]);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  if (!shop) {
    return (
      <div className="flex flex-col h-full bg-white">
        <TopBar title="店铺" />
        <EmptyState text={s.emptyList} />
      </div>
    );
  }

  const tab = sp.get('tab') ?? 'menu';
  const mode: 'delivery' | 'pickup' = sp.get('mode') === 'pickup' ? 'pickup' : 'delivery';
  const panel = sp.get('panel');
  const photo = sp.get('photo');
  const skuItem = items.find((i) => i.id === sp.get('item'));
  const shopLines = cart.filter((l) => l.shopId === shop.id);
  const reviews = reviewsMap[shop.id] ?? [];
  const isFav = favorites.includes(shop.id);

  const lastOrder = orders
    .filter((o) => o.shopId === shop.id && o.status === 'delivered')
    .sort((a, b) => b.createdAt - a.createdAt)[0];
  const hasHistory = tab === 'menu' && !!lastOrder;

  const onScrollMain = (e: React.UIEvent<HTMLDivElement>) => {
    setCollapsed((e.target as HTMLElement).scrollTop > 80);
  };

  const selectTab = (t: string) =>
    setSp((p) => {
      if (t === 'menu') p.delete('tab'); else p.set('tab', t);
      return p;
    }, { replace: true });

  const checkoutBinding = bindTap<HTMLButtonElement>('shop.checkout-open', {
    beforeTrigger: () => beginCheckout(shop.id, mode),
  });

  const catQty = (itemIds: string[]) =>
    shopLines.filter((l) => itemIds.includes(l.itemId)).reduce((a, l) => a + l.qty, 0);

  const iconBtnCls = collapsed
    ? 'w-8 h-8 rounded-full bg-[#F3F6F8] text-[#1A1A1A] flex items-center justify-center border-none cursor-pointer'
    : 'w-8 h-8 rounded-full bg-black/25 text-white flex items-center justify-center border-none cursor-pointer';

  const headerIcons = (
    <>
      <button
        {...bindTap<HTMLButtonElement>(
          { kind: 'action', id: 'shop.search.open' },
          { onTrigger: () => { setSearchQ(''); setSp((p) => { p.set('panel', 'search'); return p; }); } },
        )}
        className={iconBtnCls} aria-label="店内搜索"
      >
        <IcSearch size={17} />
      </button>
      <button {...bindTap<HTMLButtonElement>('shop.chat-open', { params: { shopId: shop.id } })} className={iconBtnCls} aria-label="客服">
        <IcService size={17} />
      </button>
      <button
        {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'shop.favorite.toggle' }, { onTrigger: () => toggleFavorite(shop.id) })}
        className={iconBtnCls} aria-label="收藏"
      >
        <IcHeart size={17} className={isFav ? 'text-[#ED6C2C]' : undefined} fill={isFav ? '#ED6C2C' : 'none'} />
      </button>
      <button
        {...bindTap<HTMLButtonElement>(
          { kind: 'action', id: 'shop.moremenu.open' },
          { onTrigger: () => setSp((p) => { p.set('panel', 'more'); return p; }) },
        )}
        className={iconBtnCls} aria-label="更多"
      >
        <IcMore size={17} />
      </button>
    </>
  );

  const couponOpenBinding = () =>
    bindTap<HTMLSpanElement>(
      { kind: 'action', id: 'shop.couponSheet.open' },
      { onTrigger: () => setSp((p) => { p.set('panel', 'coupons'); return p; }) },
    );

  /* ---------- 商品行 ---------- */
  const renderItemRow = (item: TbItem) => {
    const plainLine = shopLines.find((l) => l.itemId === item.id && l.skuDesc === null);
    const skuTotal = shopLines.filter((l) => l.itemId === item.id).reduce((a, l) => a + l.qty, 0);
    return (
      <div key={item.id} className="flex gap-2.5 px-3 py-2.5">
        <AppImg src={item.image} className="w-[88px] h-[88px] rounded-xl object-cover shrink-0" />
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="text-[15px] font-bold text-[#1A1A1A] leading-snug line-clamp-2">{item.name}</div>
          {item.desc && <div className="text-[11px] text-[#999999] truncate mt-0.5">{item.desc}</div>}
          <div className="text-[11px] text-[#999999] mt-0.5">月售{item.monthlySales}</div>
          {item.tags.length > 0 && (
            <div className="flex gap-1 mt-0.5">
              {item.tags.slice(0, 3).map((t) => (
                <span key={t} className="text-[9px] text-[#EB493B] border border-[#EB493B]/50 rounded px-1 py-px">{t}</span>
              ))}
            </div>
          )}
          <div className="flex items-end justify-between mt-auto pt-1">
            <Price value={item.price} size={17} orig={item.origPrice} />
            {item.skuGroups ? (
              <span className="relative">
                <button
                  {...bindTap<HTMLButtonElement>(
                    { kind: 'action', id: 'shop.skuSheet.open' },
                    {
                      params: { itemId: item.id },
                      onTrigger: () => setSp((p) => { p.set('panel', 'sku'); p.set('item', item.id); return p; }),
                    },
                  )}
                  className="h-6 px-2.5 rounded-full bg-[#ED6C2C] text-white text-[12px] font-semibold border-none cursor-pointer"
                >
                  选规格
                </button>
                {skuTotal > 0 && (
                  <span className="absolute -top-2 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#F53F3F] text-white text-[10px] flex items-center justify-center">
                    {skuTotal}
                  </span>
                )}
              </span>
            ) : (
              <Stepper
                qty={plainLine?.qty ?? 0}
                addBinding={bindTap<HTMLButtonElement>(
                  { kind: 'action', id: 'shop.item.add' },
                  { params: { itemId: item.id }, onTrigger: () => addToCart(item.id, null, item.price) },
                )}
                minusBinding={bindTap<HTMLButtonElement>(
                  { kind: 'action', id: 'shop.item.minus' },
                  { params: { itemId: item.id }, onTrigger: () => { if (plainLine) changeCartQty(plainLine.id, -1); } },
                )}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  /* ---------- 评价 tab ---------- */
  let revList = reviews;
  if (revTag === '有图视频') revList = revList.filter((r) => r.images.length > 0);
  if (revTag === '最新') revList = [...revList].sort((a, b) => b.ts - a.ts);
  if (contentOnly) revList = revList.filter((r) => r.hasContent);

  const reviewsTab = (
    <div className="flex-1 overflow-y-auto bg-white" data-scroll-container="main" data-scroll-direction="vertical" onScroll={onScrollMain}>
      {/* 评分区 */}
      <div className="flex items-center px-4 pt-4 pb-2">
        <span className="text-[40px] font-bold text-[#ED6C2C] leading-none">{shop.rating}</span>
        <span className="ml-2"><Stars value={shop.rating} size={14} /></span>
        <div className="ml-auto flex gap-5 text-center">
          <div><div className="text-[11px] text-[#999999]">口味</div><div className="text-[15px] font-bold text-[#1A1A1A]">{shop.ratingTaste}</div></div>
          <div><div className="text-[11px] text-[#999999]">包装</div><div className="text-[15px] font-bold text-[#1A1A1A]">{shop.ratingPack}</div></div>
        </div>
      </div>
      <div className="px-4 text-[15px] font-bold text-[#1A1A1A]">外卖评价</div>
      {/* 标签云 */}
      <div className="flex flex-wrap gap-2 px-4 py-2.5">
        {REVIEW_TAGS.map((t) => (
          <button
            key={t}
            {...bindTap<HTMLButtonElement>(
              { kind: 'action', id: 'shop.reviews.filter' },
              { params: { tag: t }, onTrigger: () => setRevTag(t) },
            )}
            className={`px-2.5 py-1.5 rounded-lg text-[12px] border-none cursor-pointer ${
              revTag === t ? 'bg-[#FDEFE6] text-[#ED6C2C] font-semibold' : 'bg-[#F3F6F8] text-[#1A1A1A]'
            }`}
          >
            {t}
            {t === '全部' && ` ${reviews.length}`}
            {t === '有图视频' && ` ${reviews.filter((r) => r.images.length > 0).length}`}
          </button>
        ))}
      </div>
      {/* 只看有内容 */}
      <button
        {...bindTap<HTMLButtonElement>(
          { kind: 'action', id: 'shop.reviews.contentOnly.toggle' },
          { onTrigger: () => setContentOnly((v) => !v) },
        )}
        className="flex items-center gap-1.5 px-4 pb-2 bg-transparent border-none cursor-pointer"
      >
        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] ${contentOnly ? 'bg-[#ED6C2C]' : 'bg-[#DDDDDD]'}`}>✓</span>
        <span className="text-[12px] text-[#1A1A1A]">只看有内容的评价</span>
      </button>
      {/* 评价列表 */}
      {revList.length === 0 && <EmptyState text="暂无相关评价" />}
      {revList.map((r) => (
        <div key={r.id} className="px-4 py-3 border-t border-[#EEEEEE]">
          <div className="flex items-center gap-2">
            <AppImg src={r.avatar} className="w-9 h-9 rounded-full object-cover" />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-[#1A1A1A] truncate">{r.userName}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-[#999999]">满意度</span>
                <Stars value={r.stars} size={11} />
                <span className="text-[11px] text-[#999999]">味道{r.tasteStars}星 包装{r.packStars}星</span>
              </div>
            </div>
            <span className="text-[11px] text-[#999999] shrink-0">{fmtTime(r.ts)}</span>
          </div>
          {r.text && <div className="text-[13px] text-[#1A1A1A] leading-relaxed mt-1.5">{r.text}</div>}
          {r.images.length > 0 && (
            <div className="flex gap-1.5 mt-2">
              {r.images.map((img) => (
                <button
                  key={img}
                  {...bindTap<HTMLButtonElement>(
                    { kind: 'action', id: 'shop.reviews.photo.view' },
                    { onTrigger: () => setSp((p) => { p.set('photo', img); return p; }) },
                  )}
                  className="bg-transparent border-none p-0 cursor-pointer"
                >
                  <AppImg src={img} className="w-24 h-24 rounded-lg object-cover" />
                </button>
              ))}
            </div>
          )}
          {r.itemName && <div className="text-[11px] text-[#ED6C2C] bg-[#FDEFE6] rounded px-1.5 py-0.5 inline-block mt-1.5">{r.itemName}</div>}
          {r.reply && (
            <div className="bg-[#F3F6F8] rounded-lg px-2.5 py-2 mt-2">
              <span className="text-[12px] text-[#999999]">商家回复 </span>
              <span className={`text-[12px] text-[#1A1A1A] ${expandedReplies.includes(r.id) ? '' : 'line-clamp-1 inline-block align-bottom max-w-[62%] truncate'}`}>
                {r.reply}
              </span>
              {!expandedReplies.includes(r.id) && (
                <button
                  {...bindTap<HTMLButtonElement>(
                    { kind: 'action', id: 'shop.reviews.reply.expand' },
                    { onTrigger: () => setExpandedReplies((prev) => [...prev, r.id]) },
                  )}
                  className="text-[12px] text-[#999999] bg-transparent border-none cursor-pointer ml-1"
                >
                  {s.expand}
                </button>
              )}
            </div>
          )}
        </div>
      ))}
      <div className="py-4 text-center text-[11px] text-[#999999]">- 已经到底啦 -</div>
    </div>
  );

  /* ---------- 商家 tab ---------- */
  const merchantTab = (
    <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical" onScroll={onScrollMain}>
      <div className="bg-white px-4 py-3.5">
        <div className="flex items-center">
          <span className="text-[17px] font-bold text-[#1A1A1A] flex-1 min-w-0 truncate">{shop.fullName}</span>
          <button
            {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'shop.merchant.call.stub' }, { onTrigger: () => showToast(s.notOpen) })}
            className="w-9 h-9 rounded-full bg-[#FDEFE6] text-[#ED6C2C] flex items-center justify-center border-none cursor-pointer shrink-0"
            aria-label="电话"
          >
            <IcPhone size={17} />
          </button>
        </div>
        <button
          {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'shop.merchant.map.stub' }, { onTrigger: () => showToast(s.notOpen) })}
          className="w-full flex items-center gap-1.5 mt-3 bg-transparent border-none cursor-pointer text-left"
        >
          <span className="text-[13px] text-[#1A1A1A] flex-1 min-w-0">{shop.address}</span>
          <IcRight size={15} className="text-[#999999] shrink-0" />
        </button>
        <div className="flex items-center gap-1.5 mt-2.5">
          <IcClock size={14} className="text-[#999999]" />
          <span className="text-[13px] text-[#1A1A1A]">周一至周日 {shop.hours}</span>
        </div>
      </div>
      <div className="bg-white rounded-xl mx-3 mt-2.5 px-4 py-3.5">
        <div className="text-[15px] font-bold text-[#1A1A1A]">商家承诺</div>
        <button
          {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'shop.merchant.license.stub' }, { onTrigger: () => showToast(s.notOpen) })}
          className="w-full flex items-center gap-2 mt-3 bg-transparent border-none cursor-pointer text-left"
        >
          <span className="text-[13px] text-[#999999] w-16 shrink-0">食品安全</span>
          <IcShield size={14} className="text-[#ED6C2C]" />
          <span className="text-[13px] text-[#1A1A1A] flex-1">亮证经营</span>
          <IcRight size={15} className="text-[#999999]" />
        </button>
        <div className="flex items-center gap-2 mt-3">
          <span className="text-[13px] text-[#999999] w-16 shrink-0">基础服务</span>
          <IcShield size={14} className="text-[#ED6C2C]" />
          <span className="text-[13px] text-[#1A1A1A]">极速开票</span>
        </div>
      </div>
      <div className="bg-white rounded-xl mx-3 mt-2.5 mb-4 px-4 py-3.5">
        <div className="text-[15px] font-bold text-[#1A1A1A]">公告</div>
        <div className="text-[13px] text-[#1A1A1A] leading-relaxed mt-2">{shop.notice}</div>
      </div>
    </div>
  );

  /* ---------- 点餐 tab ---------- */
  const menuTab = (
    <div className="flex-1 flex min-h-0">
      {/* 左侧分类竖栏 */}
      <div className="w-20 shrink-0 overflow-y-auto bg-[#F3F6F8]" data-scroll-container="cats" data-scroll-direction="vertical">
        {hasHistory && (
          <button
            {...bindTap<HTMLButtonElement>(
              { kind: 'action', id: 'shop.category.select' },
              {
                params: { cat: '买过' },
                onTrigger: () => { setActiveCat('买过'); sectionRefs.current['买过']?.scrollIntoView({ block: 'start' }); },
              },
            )}
            className={`relative w-full px-2 py-3.5 text-[12px] border-none cursor-pointer text-center leading-tight ${
              (activeCat ?? '买过') === '买过' ? 'bg-white text-[#1A1A1A] font-bold' : 'bg-transparent text-[#5A5A5A]'
            }`}
          >
            {(activeCat ?? '买过') === '买过' && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-[#ED6C2C] rounded-full" />}
            🛍 买过
          </button>
        )}
        {shop.menu.map((m, idx) => {
          const active = (activeCat ?? (hasHistory ? '买过' : shop.menu[0]?.cat)) === m.cat;
          const qty = catQty(m.itemIds);
          const isMust = shop.mustPickCat === m.cat;
          return (
            <button
              key={m.cat}
              {...bindTap<HTMLButtonElement>(
                { kind: 'action', id: 'shop.category.select' },
                {
                  params: { cat: m.cat },
                  onTrigger: () => { setActiveCat(m.cat); sectionRefs.current[m.cat]?.scrollIntoView({ block: 'start' }); },
                },
              )}
              className={`relative w-full px-2 py-3.5 text-[12px] border-none cursor-pointer text-center leading-tight ${
                active ? 'bg-white text-[#1A1A1A] font-bold' : 'bg-transparent text-[#5A5A5A]'
              }`}
            >
              {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-[#ED6C2C] rounded-full" />}
              {isMust && <span className="text-[#F9A825]">⭐</span>}{m.cat}
              {qty > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-[#F53F3F] text-white text-[9px] flex items-center justify-center">
                  {qty}
                </span>
              )}
              {idx === shop.menu.length - 1 ? null : null}
            </button>
          );
        })}
      </div>
      {/* 右侧商品列表 */}
      <div
        className="flex-1 overflow-y-auto bg-white min-w-0"
        data-scroll-container="main"
        data-scroll-direction="vertical"
        onScroll={onScrollMain}
      >
        <div className="flex items-center gap-2 px-3 pt-2.5 text-[11px] text-[#999999]">
          <span className="flex-1 border-t border-dashed border-[#DDDDDD]" />
          温馨提示:请适量点餐
          <span className="flex-1 border-t border-dashed border-[#DDDDDD]" />
        </div>
        {/* 买过区 */}
        {hasHistory && lastOrder && (
          <div ref={(el) => { sectionRefs.current['买过'] = el; }} className="px-0">
            <div className="sticky top-0 z-10 bg-white px-3 py-2 text-[15px] font-bold text-[#1A1A1A]">买过</div>
            <div className="mx-3 rounded-xl bg-[#F7F8FA] p-3">
              <div className="flex items-center">
                <span className="text-[13px] text-[#1A1A1A]">
                  {Math.max(1, Math.floor((TimeService.now() - lastOrder.createdAt) / (24 * 3600_000)))}天前买过
                </span>
                <span className="ml-auto text-[12px] text-[#999999]">共{lastOrder.lines.reduce((a, l) => a + l.qty, 0)}件</span>
                <span className="ml-1.5"><Price value={lastOrder.totalPaid} size={16} /></span>
                <button
                  {...bindTap<HTMLButtonElement>(
                    { kind: 'action', id: 'shop.reorder.add' },
                    { onTrigger: () => { reorder(lastOrder.id); showToast('已加入购物车'); } },
                  )}
                  className="ml-2.5 h-8 px-3 rounded-full bg-[#ED6C2C] text-white text-[13px] font-bold border-none cursor-pointer shrink-0"
                >
                  再来一单
                </button>
              </div>
              {lastOrder.lines.slice(0, 2).map((l) => (
                <div key={l.itemId + (l.skuDesc ?? '')} className="flex items-center gap-2.5 mt-2.5">
                  <AppImg src={l.image} className="w-11 h-11 rounded-lg object-cover shrink-0" />
                  <span className="text-[13px] text-[#1A1A1A] flex-1 min-w-0 truncate">{l.name}</span>
                  <span className="text-[12px] text-[#999999]">x{l.qty}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* 分类分组 */}
        {shop.menu.map((m) => (
          <div key={m.cat} ref={(el) => { sectionRefs.current[m.cat] = el; }}>
            <div className="sticky top-0 z-10 bg-white px-3 py-2 text-[15px] font-bold text-[#1A1A1A]">{m.cat}</div>
            {m.itemIds
              .map((id) => items.find((i) => i.id === id))
              .filter((i): i is TbItem => !!i)
              .map(renderItemRow)}
          </div>
        ))}
        <div className="py-4 text-center text-[11px] text-[#999999]">- 已经到底啦 -</div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#F3F6F8] relative" data-status-bar-foreground={collapsed ? 'dark' : 'light'}>
      {/* 头部:品牌氛围头图 / 滚动后白色紧凑工具栏 */}
      {collapsed ? (
        <div className="shrink-0 bg-white flex items-center gap-1.5 px-2 h-12 border-b border-[#EEEEEE]">
          <button {...bindBack<HTMLButtonElement>()} className={iconBtnCls} aria-label="返回">
            <IcBack size={18} />
          </button>
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <AppImg src={shop.logo} className="w-7 h-7 rounded-lg object-cover" />
            <span className="text-[15px] font-bold text-[#1A1A1A] truncate">{shop.name}</span>
          </div>
          {headerIcons}
        </div>
      ) : (
        <div className="shrink-0">
          <div
            className="h-[130px] relative"
            style={{ background: `linear-gradient(180deg, ${shop.brandColor} 0%, ${shop.brandColor}CC 70%, #F3F6F8 100%)` }}
          >
            <div className="absolute inset-x-0 top-0 flex items-center gap-1.5 px-2 pt-2">
              <button {...bindBack<HTMLButtonElement>()} className={iconBtnCls} aria-label="返回">
                <IcBack size={18} />
              </button>
              <div className="flex-1" />
              {headerIcons}
            </div>
            <div className="absolute inset-x-0 bottom-6 text-center text-white/35 font-black text-[30px] tracking-widest truncate px-4 select-none">
              {shop.name}
            </div>
          </div>
          {/* 店铺信息卡 */}
          <div className="bg-white rounded-2xl mx-3 -mt-8 relative px-3.5 py-3">
            <div className="flex items-start gap-2.5">
              <AppImg src={shop.logo} className="w-14 h-14 rounded-xl object-cover shrink-0 border border-[#EEEEEE]" />
              <div className="flex-1 min-w-0">
                <div className="text-[19px] font-bold text-[#1A1A1A] truncate">{shop.fullName}</div>
                <div className="flex items-center gap-3 mt-1 text-[12px] text-[#1A1A1A]">
                  <span>评分 <span className="text-[#ED6C2C] font-bold text-[14px]">{shop.rating}</span></span>
                  <span>月售 {shop.monthlySales}</span>
                  <span className="text-[#0BA05C]">⚡{mode === 'pickup' ? '自取' : '蜂鸟准时达'}约{mode === 'pickup' ? 20 : shop.deliveryMinutes}分钟</span>
                </div>
                {shop.features.length > 0 && (
                  <div className="text-[11px] text-[#999999] mt-0.5 truncate">商家特色 {shop.features.join(' · ')}</div>
                )}
              </div>
            </div>
            {mode === 'pickup' && (
              <div className="text-[12px] text-[#1A1A1A] bg-[#F3F6F8] rounded-lg px-2 py-1.5 mt-2">
                距您{shop.distanceKm}km · 下单后约20分钟可取
              </div>
            )}
            {/* 优惠行(全部打开红包弹层) */}
            <div className="flex items-center gap-1.5 mt-2.5 overflow-hidden">
              <span
                {...couponOpenBinding()}
                className="shrink-0 inline-flex items-center text-[12px] font-bold text-[#EB493B] border border-[#EB493B] rounded-md px-1.5 py-0.5 bg-[#FEF4F3] cursor-pointer"
              >
                爆 ¥{fmt(shop.burstCoupon.amount)}<span className="ml-1 text-[10px] font-normal bg-[#EB493B] text-white rounded px-1">领</span>
              </span>
              {shop.promos.slice(0, 2).map((p) => (
                <span
                  key={p.full}
                  {...couponOpenBinding()}
                  className="shrink-0 text-[11px] text-[#EB493B] border border-[#EB493B]/50 rounded px-1 py-0.5 cursor-pointer"
                >
                  满{fmt(p.full)}减{fmt(p.off)}
                </span>
              ))}
              <span {...couponOpenBinding()} className="shrink-0 text-[11px] text-[#EB493B] border border-[#EB493B]/50 rounded px-1 py-0.5 cursor-pointer">
                配送费优惠
              </span>
              <span {...couponOpenBinding()} className="ml-auto shrink-0 inline-flex items-center text-[12px] text-[#999999] cursor-pointer">
                优惠详情<IcDown size={13} />
              </span>
            </div>
            {/* 外送/自取分段胶囊 */}
            {shop.supportsPickup && (
              <div className="inline-flex mt-2.5 bg-[#F3F6F8] rounded-full p-0.5">
                <button
                  {...bindTap<HTMLButtonElement>(
                    { kind: 'action', id: 'shop.pickup.toggle' },
                    { params: { mode: 'delivery' }, onTrigger: () => setSp((p) => { p.delete('mode'); return p; }, { replace: true }) },
                  )}
                  className={`h-7 px-3.5 rounded-full text-[12px] border-none cursor-pointer ${mode === 'delivery' ? 'bg-white text-[#1A1A1A] font-bold shadow' : 'bg-transparent text-[#999999]'}`}
                >
                  外送
                </button>
                <button
                  {...bindTap<HTMLButtonElement>(
                    { kind: 'action', id: 'shop.pickup.toggle' },
                    { params: { mode: 'pickup' }, onTrigger: () => setSp((p) => { p.set('mode', 'pickup'); return p; }, { replace: true }) },
                  )}
                  className={`h-7 px-3.5 rounded-full text-[12px] border-none cursor-pointer ${mode === 'pickup' ? 'bg-white text-[#1A1A1A] font-bold shadow' : 'bg-transparent text-[#999999]'}`}
                >
                  自取
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* tab 行 + 好友拼单 */}
      <div className="shrink-0 flex items-center px-3 pt-2 pb-1 bg-white mt-1.5">
        {([['menu', '点餐'], ['reviews', `评价 ${reviews.length}`], ['merchant', '商家']] as const).map(([key, label]) => (
          <button
            key={key}
            {...bindTap<HTMLButtonElement>(
              { kind: 'action', id: 'shop.tab.select' },
              { params: { tab: key }, onTrigger: () => selectTab(key) },
            )}
            className={`mr-5 pb-1 bg-transparent border-none cursor-pointer text-[16px] relative ${
              tab === key ? 'font-bold text-[#1A1A1A]' : 'text-[#5A5A5A]'
            }`}
          >
            {label}
            {tab === key && <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-5 h-[3px] bg-[#ED6C2C] rounded-full" />}
          </button>
        ))}
        <span className="relative ml-auto">
          <span className="absolute -top-3 right-0 text-[9px] text-white bg-[#ED6C2C] rounded-t-md rounded-br-md px-1 py-px">去凑单</span>
          <button
            {...bindTap<HTMLButtonElement>('shop.group-open', { params: { shopId: shop.id } })}
            className="h-8 px-3 rounded-full border border-[#ED6C2C] text-[#ED6C2C] text-[13px] font-semibold bg-white cursor-pointer"
          >
            好友拼单
          </button>
        </span>
      </div>

      {/* tab 内容 */}
      {tab === 'reviews' ? reviewsTab : tab === 'merchant' ? merchantTab : menuTab}

      {/* 吸底购物车栏(点餐/评价) */}
      {tab !== 'merchant' && <ShopCartBar shop={shop} mode={mode} checkoutBinding={checkoutBinding} />}

      {/* 弹层(URL 驱动) */}
      {panel === 'sku' && skuItem && <SkuSheet key={skuItem.id} item={skuItem} />}
      {panel === 'coupons' && <ShopCouponSheet shop={shop} />}
      {panel === 'foodcard' && <FoodcardSheet />}
      {panel === 'addon' && <AddonSheet shop={shop} />}
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
                {...bindTap<HTMLInputElement>({ kind: 'action', id: 'shop.search.input' }, { onTrigger: () => {} })}
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder={`搜索${shop.name}的商品`}
                className="flex-1 min-w-0 bg-transparent outline-none border-none text-[14px] text-[#1A1A1A] placeholder:text-[#999999]"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto" data-scroll-container="shopsearch" data-scroll-direction="vertical">
            {(() => {
              const q = searchQ.trim();
              const all = items.filter((i) => i.shopId === shop.id);
              const res = q ? all.filter((i) => `${i.name}${i.desc}${i.tags.join('')}`.includes(q)) : all;
              return res.length === 0
                ? <EmptyState text="未找到相关商品" />
                : res.map(renderItemRow);
            })()}
          </div>
        </div>
      )}

      {/* 评价大图浮层 */}
      {photo && (
        <div {...bindBack<HTMLDivElement>()} className="absolute inset-0 z-50 bg-black flex items-center justify-center cursor-pointer">
          <AppImg src={photo} className="max-w-full max-h-[80%] object-contain" />
          <button {...bindBack<HTMLButtonElement>()} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 text-white border-none flex items-center justify-center cursor-pointer" aria-label="关闭">
            <IcClose size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
