import React, { useMemo, useState } from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { useTbsgStore } from '../state';
import { AppImg, EmptyState, Price } from '../components/common';
import { ShopCard } from '../components/ShopCard';
import { IcBack, IcRight, IcSearch } from '../res/icons';
import type { TbShop } from '../types';
import { useStatusBarBg } from '../statusbar';

/** 分类金刚区两行(IMG_6009) */
const CATS: { label: string; icon: string; cats: string[] | null }[] = [
  { label: '全部', icon: '🏪', cats: null },
  { label: '水果店', icon: '🍊', cats: ['fruitshop'] },
  { label: '生鲜菜场', icon: '🥕', cats: ['supermarket'] },
  { label: '果切果捞', icon: '🍉', cats: ['fruitshop'] },
  { label: '海鲜水产', icon: '🦀', cats: ['supermarket'] },
  { label: '火锅食材', icon: '🍲', cats: ['supermarket'] },
  { label: '粮油调味', icon: '🧂', cats: ['supermarket'] },
  { label: '新鲜蔬菜', icon: '🥬', cats: ['supermarket'] },
  { label: '肉禽蛋', icon: '🥩', cats: ['supermarket'] },
  { label: '快手面点', icon: '🥟', cats: ['supermarket'] },
];

const FILTERS = ['满10减6', '支持预订', '减免运费', '约30分钟达'];

function passFilter(shop: TbShop, f: string): boolean {
  switch (f) {
    case '满10减6': return shop.promos.length > 0;
    case '支持预订': return shop.supportsPickup;
    case '减免运费': return shop.deliveryFeeOrig > shop.deliveryFee;
    case '约30分钟达': return shop.deliveryMinutes <= 30;
    default: return true;
  }
}

export default function ChannelFruitPage() {
  const { bindTap, bindBack } = useTbsgGestures();
  useStatusBarBg('#FFD98E');
  const s = useAppStrings(strings, stringsEn);

  const shops = useTbsgStore((st) => st.shops);
  const items = useTbsgStore((st) => st.items);
  const addToCart = useTbsgStore((st) => st.addToCart);

  const [cat, setCat] = useState('全部');
  const [filters, setFilters] = useState<string[]>([]);

  /** 爆好价卡:左大图果切 + 右2商品(IMG_6009) */
  const bigDeal = useMemo(() => items.find((i) => i.id === 's_qieguo__fr_watermelon_cut'), [items]);
  const sideDeals = useMemo(
    () => [items.find((i) => i.id === 's_qieguo__fr_durian'), items.find((i) => i.id === 's_lusen__cv_beer')]
      .filter((x): x is NonNullable<typeof x> => Boolean(x)),
    [items],
  );

  const list = useMemo(() => {
    const cats = CATS.find((c) => c.label === cat)?.cats ?? null;
    return shops
      .filter((x) => x.type === 'retail' && ['fruitshop', 'supermarket'].includes(x.category))
      .filter((x) => (cats ? cats.includes(x.category) : true))
      .filter((x) => filters.every((f) => passFilter(x, f)))
      .sort((a, b) => b.rating - a.rating);
  }, [shops, cat, filters]);

  return (
    <div className="flex flex-col h-full bg-[#F3F6F8]">
      {/* 橙黄头部(IMG_6009) */}
      <div className="shrink-0 bg-gradient-to-b from-[#FFD98E] to-[#FFF3D9] pb-2">
        <div className="flex items-center h-11 px-2">
          <button
            {...bindBack<HTMLButtonElement>()}
            className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer"
            aria-label="返回"
          >
            <IcBack size={22} className="text-[#1A1A1A]" />
          </button>
          <span className="font-bold text-[18px] text-[#1A1A1A] pl-1">水果买菜</span>
        </div>
        <div className="px-3">
          <div
            {...bindTap<HTMLDivElement>('channel.search-open')}
            className="flex items-center h-9 rounded-lg bg-white px-3 cursor-pointer"
          >
            <IcSearch size={16} className="text-[#999999]" />
            <span className="flex-1 ml-2 text-[13px] text-[#999999] truncate">水果</span>
            <span className="h-7 px-3 rounded-md bg-[#ED6C2C] text-white text-[13px] font-semibold flex items-center">{s.search}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 分类金刚区两行 */}
        <div className="mx-3 mt-2 bg-white rounded-xl px-1 py-2 grid grid-cols-5 gap-y-1">
          {CATS.map((c) => (
            <button
              key={c.label}
              {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'channel.fruit.category.select' }, {
                params: { cat: c.label },
                onTrigger: () => setCat(c.label),
              })}
              className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer py-1"
            >
              <span className={`w-11 h-11 rounded-full flex items-center justify-center text-[22px] ${cat === c.label ? 'bg-[#FFE9D9]' : 'bg-[#FFF8EC]'}`}>{c.icon}</span>
              <span className={`text-[11px] ${cat === c.label ? 'text-[#ED6C2C] font-semibold' : 'text-[#1A1A1A]'}`}>{c.label}</span>
            </button>
          ))}
        </div>

        {/* 爆好价卡 */}
        <div className="mx-3 mt-2 bg-gradient-to-b from-[#FDECEC] to-white rounded-xl p-2.5">
          <div className="flex items-center">
            <span className="font-bold text-[16px] italic text-[#E8362E]">爆好价</span>
            <span className="ml-2 text-[11px] text-[#00A65A]">🌿 时令上新</span>
            <span className="ml-2 text-[11px] text-[#00A65A]">🌿 品质保障</span>
            <IcRight size={14} className="ml-auto text-[#999999]" />
          </div>
          <div className="flex gap-2 mt-2">
            {bigDeal && (
              <div
                {...bindTap<HTMLDivElement>('channel.fruit.shop-open', { params: { shopId: bigDeal.shopId } })}
                className="w-[55%] shrink-0 relative rounded-xl overflow-hidden cursor-pointer"
              >
                <AppImg src={bigDeal.image} className="w-full h-[150px] object-cover" />
                <span className="absolute left-2 top-2 text-white font-bold text-[14px] drop-shadow leading-tight">【果切】1斤<br />麒麟西瓜</span>
                <span className="absolute left-2 top-14 text-[10px] px-1 py-[1px] rounded bg-white/90 text-[#E8362E]">红沙瓤甜 消暑解渴</span>
                <span className="absolute left-2 bottom-2 drop-shadow">
                  <Price value={bigDeal.price} size={17} orig={bigDeal.origPrice} />
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0 flex flex-col gap-2">
              {sideDeals.map((it) => (
                <div
                  key={it.id}
                  {...bindTap<HTMLDivElement>('channel.fruit.shop-open', { params: { shopId: it.shopId } })}
                  className="flex-1 bg-white rounded-xl p-1.5 cursor-pointer flex flex-col"
                >
                  <AppImg src={it.image} className="w-full h-[62px] rounded-lg object-cover" />
                  <div className="text-[11px] text-[#1A1A1A] truncate mt-1">{it.name}</div>
                  <Price value={it.price} size={14} orig={it.origPrice} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 筛选条 */}
        <div className="flex items-center justify-between px-4 py-2 mt-1 sticky top-0 z-10 bg-[#F3F6F8]">
          {FILTERS.map((f) => (
            <button
              key={f}
              {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'channel.fruit.filter.toggle' }, {
                params: { filter: f },
                onTrigger: () => setFilters((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f])),
              })}
              className={`text-[13px] bg-transparent border-none cursor-pointer p-0 ${
                filters.includes(f) ? 'text-[#ED6C2C] font-semibold' : 'text-[#1A1A1A]'
              }`}
            >
              {f === '满10减6' ? <span className="text-[10px] px-0.5 rounded bg-[#F53F3F] text-white mr-0.5">满减</span> : null}
              {f}
            </button>
          ))}
        </div>

        {/* 店铺大卡列表(商品点击=进店并加购 qa:R3) */}
        <div className="px-3 py-1 flex flex-col gap-2 pb-4">
          {list.length === 0 && <EmptyState text="暂无符合条件的商家" />}
          {list.map((shop) => (
            <ShopCard
              key={shop.id}
              shop={shop}
              items={items
                .filter((i) => i.shopId === shop.id)
                .sort((a, b) => b.monthlySales - a.monthlySales)
                .slice(0, 4)}
              shopBinding={bindTap<HTMLDivElement>('channel.fruit.shop-open', { params: { shopId: shop.id } })}
              itemBinding={(it) => bindTap<HTMLDivElement>('channel.fruit.item-open', {
                params: { shopId: shop.id },
                beforeTrigger: () => addToCart(it.id, null, it.price),
              })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
