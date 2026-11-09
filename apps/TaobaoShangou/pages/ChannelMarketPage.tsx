import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { useTbsgStore } from '../state';
import { AppImg, EmptyState, Price, showToast } from '../components/common';
import { ShopCard } from '../components/ShopCard';
import { IcBack, IcClose, IcSearch } from '../res/icons';
import { useStatusBarBg } from '../statusbar';

/** 金刚区分类 → 店铺 category 映射(IMG_6007) */
const KK_CATS: { label: string; icon: string; cats: string[] | null }[] = [
  { label: '便利店', icon: '🏪', cats: ['convenience'] },
  { label: '超市卖场', icon: '🛒', cats: ['supermarket'] },
  { label: '生鲜菜场', icon: '🥬', cats: ['fruitshop', 'supermarket'] },
  { label: '水果果切', icon: '🍉', cats: ['fruitshop'] },
  { label: '乳饮酒水', icon: '🍺', cats: ['convenience', 'supermarket'] },
  { label: '鲜花礼品', icon: '💐', cats: ['flowershop'] },
  { label: '领券中心', icon: '🎟️', cats: null },
  { label: '美妆百货', icon: '💄', cats: ['supermarket'] },
  { label: '休闲零食', icon: '🍿', cats: ['snackshop', 'convenience'] },
  { label: '宠物用品', icon: '🦴', cats: ['supermarket'] },
];

/** 附近好店分类胶囊(IMG_6007) */
const SHOP_TABS: { label: string; key: string; cats: string[] | null }[] = [
  { label: '全部', key: '全部', cats: null },
  { label: '超市', key: 'supermarket', cats: ['supermarket'] },
  { label: '便利店', key: 'convenience', cats: ['convenience'] },
  { label: '生鲜菜场', key: 'fruitshop', cats: ['fruitshop'] },
];

export default function ChannelMarketPage() {
  const { bindTap, bindBack, back } = useTbsgGestures();
  useStatusBarBg('#4A90E2');
  const s = useAppStrings(strings, stringsEn);
  const [sp, setSp] = useSearchParams();
  const popup = sp.get('popup');

  const shops = useTbsgStore((st) => st.shops);
  const items = useTbsgStore((st) => st.items);
  const coupons = useTbsgStore((st) => st.coupons);
  const claimCoupon = useTbsgStore((st) => st.claimCoupon);

  const [kkCat, setKkCat] = useState<string | null>(null);
  const [shopTab, setShopTab] = useState('全部');

  const entryCoupon = coupons.find((c) => c.id === 'cp7');

  /** 首次进入自动弹进场红包弹窗一次(IMG_6006;URL驱动,返回键可关) */
  const autoOpened = useRef(false);
  useEffect(() => {
    if (autoOpened.current) return;
    autoOpened.current = true;
    if (entryCoupon && entryCoupon.status === 'unclaimed') {
      setSp((p) => { p.set('popup', 'coupon'); return p; });
    }
  }, [entryCoupon, setSp]);

  /** 爆好价:零售商品优先取「爆好价」标签,再按销量补齐3个 */
  const deals = useMemo(() => {
    const retailIds = new Set(shops.filter((x) => x.type === 'retail').map((x) => x.id));
    return items
      .filter((i) => retailIds.has(i.shopId))
      .sort((a, b) =>
        Number(b.tags.includes('爆好价')) - Number(a.tags.includes('爆好价'))
        || b.monthlySales - a.monthlySales)
      .slice(0, 3);
  }, [shops, items]);

  const list = useMemo(() => {
    const kk = KK_CATS.find((c) => c.label === kkCat)?.cats ?? null;
    const tab = SHOP_TABS.find((t) => t.key === shopTab)?.cats ?? null;
    return shops
      .filter((x) => x.type === 'retail')
      .filter((x) => (kk ? kk.includes(x.category) : true))
      .filter((x) => (tab ? tab.includes(x.category) : true))
      .sort((a, b) => b.rating - a.rating);
  }, [shops, kkCat, shopTab]);

  const fastest = list.length ? Math.min(...list.map((x) => x.deliveryMinutes)) : 20;

  return (
    <div className="flex flex-col h-full bg-[#F3F6F8] relative" data-status-bar-foreground="light">
      {/* 蓝色系头部(IMG_6007) */}
      <div className="shrink-0 bg-gradient-to-b from-[#4A90E2] to-[#8FC0F2] pb-2">
        <div className="flex items-center h-11 px-2">
          <button
            {...bindBack<HTMLButtonElement>()}
            className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer"
            aria-label="返回"
          >
            <IcBack size={22} className="text-white" />
          </button>
          <span className="font-bold text-[18px] text-white pl-1">超市便利</span>
        </div>
        <div className="px-3">
          <div
            {...bindTap<HTMLDivElement>('channel.search-open')}
            className="flex items-center h-9 rounded-lg bg-white px-3 cursor-pointer"
          >
            <IcSearch size={16} className="text-[#999999]" />
            <span className="flex-1 ml-2 text-[13px] text-[#999999] truncate">万店狂欢领券5折起</span>
            <span className="h-7 px-3 rounded-md bg-[#4A90E2] text-white text-[13px] font-semibold flex items-center">{s.search}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 金刚区两行(点击过滤下方店铺) */}
        <div className="mx-3 mt-2 bg-white rounded-xl px-1 py-2 grid grid-cols-5 gap-y-1">
          {KK_CATS.map((c) => (
            <button
              key={c.label}
              {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'channel.market.category.select' }, {
                params: { cat: c.label },
                onTrigger: () => setKkCat((prev) => (prev === c.label ? null : c.label)),
              })}
              className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer py-1"
            >
              <span className={`w-11 h-11 rounded-xl flex items-center justify-center text-[22px] ${kkCat === c.label ? 'bg-[#DCEBFB]' : 'bg-[#F4F8FD]'}`}>{c.icon}</span>
              <span className={`text-[11px] ${kkCat === c.label ? 'text-[#4A90E2] font-semibold' : 'text-[#1A1A1A]'}`}>{c.label}</span>
            </button>
          ))}
        </div>

        {/* 爆好价 + 右侧banner */}
        <div className="mx-3 mt-2 flex gap-2">
          <div className="flex-1 min-w-0 bg-gradient-to-b from-[#FDECEC] to-white rounded-xl p-2.5">
            <div className="flex items-center">
              <span className="font-bold text-[16px] italic text-[#E8362E]">爆好价</span>
              <span className="ml-auto text-[11px] text-[#999999]">限时抢购 &gt;</span>
            </div>
            <div className="flex flex-col gap-2 mt-2">
              {deals.map((it) => (
                <div
                  key={it.id}
                  {...bindTap<HTMLDivElement>('channel.market.deal-open', { params: { shopId: it.shopId } })}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <AppImg src={it.image} className="w-[52px] h-[52px] rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] text-[#1A1A1A] truncate">{it.name}</div>
                    <div className="text-[10px] text-[#E8362E]">👍 爆品好价</div>
                    <div className="flex items-center">
                      <Price value={it.price} size={15} />
                      <span className="ml-auto w-6 h-6 rounded-md bg-[#F53F3F] text-white text-[11px] font-bold flex items-center justify-center">抢</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="w-[42%] shrink-0 rounded-xl overflow-hidden relative">
            <AppImg src="/@app-assets/TaobaoShangou/banners/banner_summer.jpg" className="w-full h-full object-cover" />
            <span className="absolute left-2 top-2 text-white font-bold text-[14px] drop-shadow">盛夏狂欢5折起</span>
          </div>
        </div>

        {/* 附近好店 */}
        <div className="px-3 mt-3 flex items-center">
          <span className="font-bold text-[17px] text-[#1A1A1A]">附近好店</span>
          <span className="ml-auto text-[12px] text-[#999999]">现在下单最快 <span className="text-[#1A1A1A] font-semibold">{fastest}分钟</span> 送达</span>
        </div>
        <div className="flex gap-2 px-3 mt-2 overflow-x-auto" data-scroll-container="shoptabs" data-scroll-direction="horizontal">
          {SHOP_TABS.map((t) => (
            <button
              key={t.key}
              {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'channel.market.shoptab.select' }, {
                params: { tab: t.key },
                onTrigger: () => setShopTab(t.key),
              })}
              className={`shrink-0 h-9 px-4 rounded-lg text-[13px] border cursor-pointer ${
                shopTab === t.key
                  ? 'bg-[#EAF3FD] border-[#4A90E2] text-[#4A90E2] font-semibold'
                  : 'bg-white border-transparent text-[#1A1A1A]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="px-3 py-2 flex flex-col gap-2 pb-4">
          {list.length === 0 && <EmptyState text="暂无符合条件的商家" />}
          {list.map((shop) => (
            <ShopCard
              key={shop.id}
              shop={shop}
              shopBinding={bindTap<HTMLDivElement>('channel.market.shop-open', { params: { shopId: shop.id } })}
            />
          ))}
        </div>
      </div>

      {/* 进场红包弹窗(IMG_6006) */}
      {popup === 'coupon' && entryCoupon && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center">
          <div {...bindBack<HTMLDivElement>()} className="absolute inset-0 bg-black/60" />
          <div className="relative w-[80%] rounded-2xl overflow-hidden bg-gradient-to-b from-[#54A5EE] to-[#2F7FD6]">
            <div className="relative">
              <AppImg src="/@app-assets/TaobaoShangou/banners/banner_summer.jpg" className="w-full h-[120px] object-cover" />
              <span className="absolute left-0 right-0 top-2 text-center text-white font-bold text-[16px] drop-shadow">万店狂欢周 · 盛夏狂欢5折起</span>
            </div>
            <div className="text-center text-white font-bold text-[19px] mt-3">恭喜获得今日红包</div>
            <div className="mx-3 mt-3 bg-white rounded-xl p-3 flex items-center gap-2.5">
              <span className="w-14 h-14 rounded-lg bg-[#FDF0E4] flex items-center justify-center text-[26px] shrink-0">🧴</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[14px] text-[#1A1A1A] truncate">{entryCoupon.name}</div>
                <div className="text-[11px] text-[#999999] mt-0.5">明日到期</div>
                <div className="flex items-baseline text-[#F53F3F]">
                  <span className="text-[12px]">¥</span>
                  <span className="text-[24px] font-bold">{entryCoupon.amount}</span>
                  <span className="text-[11px] text-[#666666] ml-1.5">满{entryCoupon.threshold}可用</span>
                </div>
              </div>
              <button
                {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'channel.market.popup.claim' }, {
                  onTrigger: () => {
                    claimCoupon('cp7');
                    showToast('红包已放入券包');
                    back();
                  },
                })}
                className="shrink-0 h-9 px-4 rounded-lg bg-[#F53F3F] text-white text-[14px] font-semibold border-none cursor-pointer"
              >
                {s.couponUse}
              </button>
            </div>
            <div className="text-center text-[11px] text-white/85 py-3">红包具有随机性,可在「我的-红包」查看</div>
          </div>
          <button
            {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'channel.market.popup.close' }, {
              onTrigger: () => { claimCoupon('cp7'); back(); },
            })}
            aria-label="关闭"
            className="relative mt-4 w-10 h-10 rounded-full bg-white/25 text-white flex items-center justify-center border border-white/60 cursor-pointer"
          >
            <IcClose size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
