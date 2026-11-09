import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { useDianpingGestures } from '../hooks/useDianpingGestures';
import { useDianpingStore } from '../state';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcBack, IcStar } from '../res/icons';
import { ShopCard } from '../components/ShopCard';
import { shopCoverUrl, dishImageUrl } from '../assets';

export default function FavListPage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap, bindBack } = useDianpingGestures();
  const [sp] = useSearchParams();
  const tab = sp.get('tab') || 'shop';
  const shops = useDianpingStore((st) => st.shops);
  const favoriteShopIds = useDianpingStore((st) => st.favoriteShopIds);
  const favoriteDishIds = useDianpingStore((st) => st.favoriteDishIds);
  const favoriteDealIds = useDianpingStore((st) => st.favoriteDealIds);

  const favDeals = useMemo(() => {
    const rows: { key: string; shopId: string; dealId: string; title: string; shopName: string; price: number; color: string }[] = [];
    for (const key of favoriteDealIds) {
      const [sid, did] = key.split(':');
      const shop = shops.find((x) => x.id === sid);
      const deal = shop?.deals.find((d) => d.id === did);
      if (shop && deal) rows.push({ key, shopId: sid, dealId: did, title: deal.title, shopName: shop.name, price: deal.price, color: shop.coverColor });
    }
    return rows;
  }, [favoriteDealIds, shops]);

  const favShops = useMemo(
    () => shops.filter((x) => favoriteShopIds.includes(x.id)),
    [shops, favoriteShopIds],
  );

  const favDishes = useMemo(() => {
    const rows: { key: string; sid: string; did: string; shopName: string; dishName: string; price: number; color: string }[] = [];
    for (const key of favoriteDishIds) {
      const [sid, did] = key.split(':');
      const shop = shops.find((x) => x.id === sid);
      const dish = shop?.dishes.find((d) => d.id === did);
      if (shop && dish) {
        rows.push({
          key,
          sid,
          did,
          shopName: shop.name,
          dishName: dish.name,
          price: dish.price,
          color: shop.coverColor,
        });
      }
    }
    return rows;
  }, [favoriteDishIds, shops]);

  return (
    <div className="flex h-full flex-col bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <div className="flex h-11 items-center gap-1 bg-white px-1">
        <button type="button" className="border-none bg-transparent p-1.5 cursor-pointer" {...bindBack()}>
          <IcBack size={22} />
        </button>
        <div className="text-[16px] font-semibold">{s.mineFav}</div>
      </div>
      <div className="flex items-end gap-5 bg-white px-4">
        {(
          [
            ['shop', s.favShops],
            ['dish', s.favDishes],
            ['deal', s.favGoods],
          ] as const
        ).map(([id, label]) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              className={`relative border-none bg-transparent pb-2 text-[14px] cursor-pointer ${
                active ? 'font-bold text-[#222]' : 'text-[#666]'
              }`}
              {...bindTap('fav.tab', { params: { tab: id } })}
            >
              {label}
              {active ? (
                <span className="absolute bottom-0 left-1/2 h-[3px] w-5 -translate-x-1/2 rounded-full bg-[#FF6633]" />
              ) : null}
            </button>
          );
        })}
      </div>
      <div className="flex-1 overflow-y-auto" data-scroll-container="fav" data-scroll-direction="vertical">
        {tab === 'shop' &&
          (favShops.length === 0 ? (
            <div className="py-16 text-center text-[13px] text-[#999]">{s.emptyFav}</div>
          ) : (
            <div className="divide-y divide-[#F5F5F5] bg-white">
              {favShops.map((shop) => (
                <ShopCard key={shop.id} shop={shop} transitionId="fav.shop-open" />
              ))}
            </div>
          ))}
        {tab === 'dish' &&
          (favDishes.length === 0 ? (
            <div className="py-16 text-center text-[13px] text-[#999]">{s.emptyFav}</div>
          ) : (
            <div className="bg-white">
              {favDishes.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  className="flex w-full items-center gap-3 border-none border-b border-[#F5F5F5] bg-transparent px-3 py-3 text-left cursor-pointer"
                  {...bindTap('fav.shop-open', { params: { shopId: d.sid } })}
                >
                  <div className="h-[56px] w-[56px] overflow-hidden rounded-[6px]" style={{ background: d.color }}>
                    {dishImageUrl(d.sid, d.did) ? (
                      <img src={dishImageUrl(d.sid, d.did)} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-semibold">{d.dishName}</div>
                    <div className="truncate text-[11px] text-[#999]">{d.shopName}</div>
                  </div>
                  <div className="text-[13px] font-semibold text-[#FF6633]">¥{d.price}</div>
                  <IcStar size={16} className="text-[#FF6633]" />
                </button>
              ))}
            </div>
          ))}
        {tab === 'deal' &&
          (favDeals.length === 0 ? (
            <div className="py-16 text-center text-[13px] text-[#999]">{s.emptyFav}</div>
          ) : (
            <div className="bg-white">
              {favDeals.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  className="flex w-full items-center gap-3 border-none border-b border-[#F5F5F5] bg-transparent px-3 py-3 text-left cursor-pointer"
                  {...bindTap('fav.voucher-open', { params: { shopId: d.shopId, dealId: d.dealId } })}
                >
                  <div className="h-[56px] w-[56px] overflow-hidden rounded-[6px]" style={{ background: d.color }}>
                    {shopCoverUrl(d.shopId) ? <img src={shopCoverUrl(d.shopId)} alt="" className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="shrink-0 rounded-[3px] bg-[#FF4B33] px-1 text-[9px] text-white">券</span>
                      <span className="truncate text-[14px] font-semibold">{d.title}</span>
                    </div>
                    <div className="truncate text-[11px] text-[#999]">{d.shopName}</div>
                  </div>
                  <div className="text-[13px] font-semibold text-[#FF6633]">¥{d.price}</div>
                  <IcStar size={16} className="text-[#FF6633]" />
                </button>
              ))}
            </div>
          ))}
      </div>
    </div>
  );
}
