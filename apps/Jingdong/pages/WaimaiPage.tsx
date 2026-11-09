import React, { useState } from 'react';
import { useJingdongGestures } from '../hooks/useJingdongGestures';
import { useJingdongStore } from '../state';
import { Img, PriceYuan, showToast } from '../components/ui';
import { IcNavBack, IcSearch, IcMapPin, IcChevronDown, IcChevronRight, IcStar, IcPlus, IcHeart, IcShare } from '../res/icons';
import type { LifeShop, Dish } from '../types';

const FOOD_KINGKONG = [
  { label: '美食推荐', emoji: '🍔', primary: true },
  { label: '午餐', emoji: '🍗' },
  { label: '品质正餐', emoji: '🍲' },
  { label: '饮品甜点', emoji: '🧋' },
  { label: '快餐便当', emoji: '🍱' },
];

export function WaimaiPage() {
  const { bindTap, bindBack } = useJingdongGestures();
  const lifeShops = useJingdongStore((s) => s.lifeShops);
  const [cat, setCat] = useState('美食推荐');
  const [sort, setSort] = useState('综合排序');

  const restaurants = lifeShops.filter((s) => s.kind === 'restaurant');
  const shops = restaurants.length ? restaurants : lifeShops;

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="dark">
      {/* 头部:返回 + 外卖 + 定位 */}
      <div className="shrink-0 pt-10 px-3 pb-2 bg-gradient-to-b from-[#FFE0D4] to-[#FFF3EE]">
        <div className="h-9 flex items-center gap-1">
          <button {...bindBack()} aria-label="返回" className="w-8 h-8 -ml-1 flex items-center justify-center">
            <IcNavBack size={22} className="text-[#333]" />
          </button>
          <span className="text-[18px] font-bold text-[#1A1A1A]">外卖</span>
          <IcMapPin size={15} className="text-[#FF4E33] ml-1" />
          <span className="text-[13px] text-[#333] max-w-[130px] truncate">示范科技园A座</span>
          <IcChevronDown size={15} className="text-[#666]" />
          <div className="flex-1" />
          <IcHeart size={20} className="text-[#333]" />
          <IcShare size={20} className="text-[#333] ml-3" />
        </div>
        <button
          {...bindTap('waimai.search-open', { params: { from: 'waimai' } })}
          className="mt-1.5 w-full h-9 rounded-full bg-white flex items-center pl-3 pr-1 shadow-sm"
        >
          <IcSearch size={18} className="text-[#999] shrink-0" />
          <span className="flex-1 text-left px-2 text-[13px] text-[#999] truncate">瑞幸</span>
          <span className="px-3 text-[15px] font-semibold text-[#1A1A1A]">搜索</span>
        </button>
      </div>

      {/* 美食金刚区 */}
      <div className="shrink-0 bg-white overflow-x-auto no-scrollbar" data-scroll-container="waimai-kingkong" data-scroll-direction="horizontal">
        <div className="flex px-2 py-2 whitespace-nowrap">
          {FOOD_KINGKONG.map((k) => {
            const active = cat === k.label;
            return (
              <button
                key={k.label}
                {...bindTap({ kind: 'action', id: 'waimai.kingkong.select.cat' }, { params: { cat: k.label }, onTrigger: () => setCat(k.label) })}
                className="flex flex-col items-center gap-1 w-[72px] shrink-0"
              >
                <div className="text-[30px] leading-none">{k.emoji}</div>
                <span className={`text-[12px] px-2 rounded-full ${active ? 'bg-[#FF4E33] text-white font-semibold' : 'text-[#333]'}`}>{k.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="waimai-feed" data-scroll-direction="vertical">
        {/* 超级补贴套餐 */}
        <div className="bg-white mx-2 mt-2 rounded-xl p-2.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[16px] font-bold text-[#C4340F]">超级补贴</span>
            <span className="text-[12px] text-[#999] flex items-center">查看更多<IcChevronRight size={14} /></span>
          </div>
          <div className="overflow-x-auto no-scrollbar">
            <div className="flex gap-2">
              {shops.flatMap((s) => s.dishes).slice(0, 6).map((d) => (
                <div key={d.id} className="w-[88px] shrink-0">
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-[#F5F5F5]">
                    <Img src={d.image} className="w-full h-full object-cover" />
                    <span className="absolute left-0 top-0 bg-[#C4340F] text-white text-[9px] px-1 rounded-br">爆品一口价</span>
                  </div>
                  <div className="text-[11px] text-[#333] line-clamp-1 mt-1">{d.name}</div>
                  <div className="flex items-baseline gap-1">
                    <PriceYuan value={d.price} className="text-[#FF2D2D] text-[14px]" />
                    <span className="bg-[#FFEDE4] text-[#FF2D2D] text-[9px] px-1 rounded">补{(d.originPrice - d.price).toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 领券 banner */}
        <div className="mx-2 mt-2 rounded-xl bg-gradient-to-r from-[#B01818] to-[#E0322B] px-4 py-3 flex items-center justify-between">
          <div>
            <span className="text-white/90 text-[11px] bg-white/15 rounded px-1.5 py-0.5">百万商家可用</span>
            <div className="text-white text-[19px] font-bold mt-1">领2元大牌商家叠加券</div>
            <div className="text-[#FFE0B0] text-[12px]">20元金券整点抢 · 分享再领红包</div>
          </div>
          <div className="text-[#FFD9A0] text-[34px] font-bold opacity-80">¥20</div>
        </div>

        {/* 排序 / 到店自提 */}
        <div className="flex items-center gap-3 px-3 py-2.5 text-[13px] text-[#333] mt-1">
          <button
            {...bindTap({ kind: 'action', id: 'waimai.sort.select.type' }, { params: { type: '综合排序' }, onTrigger: () => setSort('综合排序') })}
            className={`flex items-center font-medium ${sort === '综合排序' ? 'text-[#FF4E33]' : ''}`}
          >
            综合排序<IcChevronDown size={14} />
          </button>
          <button
            {...bindTap({ kind: 'action', id: 'waimai.sort.select.type' }, { params: { type: '到店自提' }, onTrigger: () => setSort('到店自提') })}
            className={`px-2 py-0.5 rounded-full ${sort === '到店自提' ? 'bg-[#FF4E33] text-white' : 'bg-white'}`}
          >
            到店自提
          </button>
          <span className="px-2 py-0.5 rounded-full bg-white text-[#B8860B]">超级月卡折上折</span>
        </div>

        {/* 餐厅卡列表 */}
        <div className="px-2 pb-4 flex flex-col gap-2">
          {shops.map((shop) => (
            <RestaurantListCard key={shop.id} shop={shop} bindTap={bindTap} />
          ))}
        </div>
      </div>
    </div>
  );
}

function RestaurantListCard({ shop, bindTap }: { shop: LifeShop; bindTap: ReturnType<typeof useJingdongGestures>['bindTap'] }) {
  return (
    <div {...bindTap('waimai.shop-open', { params: { shopId: shop.id } })} className="bg-white rounded-xl p-3">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-[#FF4E33] border border-[#FF4E33]/40 rounded px-1 py-0.5">外卖</span>
        <span className="text-[16px] font-bold text-[#1A1A1A] truncate flex-1">{shop.name}</span>
        <span className="text-[10px] text-[#B8860B] bg-[#FFF4E0] rounded px-1 py-0.5">京东秒送</span>
      </div>
      <div className="flex items-center gap-2 mt-1.5 text-[12px] text-[#666]">
        <span className="flex items-center text-[#FF8C00] font-semibold"><IcStar size={13} className="fill-current" />{shop.rating}</span>
        <span>{shop.sold}</span>
        <span className="flex-1" />
        <span className="text-[#333]">{shop.eta} · {shop.distance}</span>
      </div>
      <div className="flex flex-wrap gap-1 mt-1.5">
        {['自提更省', '堂食餐厅', '无明厨亮灶', '跨天预订'].map((t) => (
          <span key={t} className="text-[10px] text-[#999] border border-[#EEE] rounded px-1 py-0.5">{t}</span>
        ))}
      </div>
      <div className="overflow-x-auto no-scrollbar mt-2.5">
        <div className="flex gap-2">
          {shop.dishes.slice(0, 4).map((d) => (
            <div key={d.id} className="w-[92px] shrink-0">
              <div className="relative aspect-square rounded-lg overflow-hidden bg-[#F5F5F5]">
                <Img src={d.image} className="w-full h-full object-cover" />
                {d.originPrice > d.price && (
                  <span className="absolute left-0 bottom-0 bg-[#FF4E33] text-white text-[9px] px-1">减{(d.originPrice - d.price).toFixed(0)}元</span>
                )}
              </div>
              <div className="text-[11px] text-[#333] line-clamp-1 mt-1">{d.name}</div>
              <div className="flex items-center justify-between mt-0.5">
                <div className="flex flex-col leading-none">
                  <PriceYuan value={d.price} className="text-[#FF2D2D] text-[14px]" />
                  <span className="text-[9px] text-[#999]">到手价</span>
                </div>
                <button
                  {...bindTap('waimai.restaurant-sku-open', { params: { shopId: shop.id, itemId: d.id }, stopPropagation: true })}
                  aria-label="加购"
                  className="w-6 h-6 rounded-full bg-[#FF4E33] text-white flex items-center justify-center shrink-0"
                >
                  <IcPlus size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
