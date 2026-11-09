import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { useDianpingGestures } from '../hooks/useDianpingGestures';
import { useDianpingStore } from '../state';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcBack, IcSearch } from '../res/icons';
import { ShopCard } from '../components/ShopCard';
import { shopCoverUrl } from '../assets';

export default function SearchResultPage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindBack, bindTap } = useDianpingGestures();
  const [sp] = useSearchParams();
  const q = sp.get('q') || '';
  const tab = sp.get('tab') || 'shop';
  const shops = useDianpingStore((st) => st.shops);

  const shopList = useMemo(() => {
    const key = q.trim().toLowerCase();
    if (!key) return shops;
    return shops.filter(
      (x) =>
        x.name.toLowerCase().includes(key) ||
        x.category.includes(key) ||
        x.tags.some((t) => t.includes(key)) ||
        x.district.includes(key),
    );
  }, [shops, q]);

  const deals = useMemo(() => {
    const key = q.trim().toLowerCase();
    const rows: { shopId: string; dealId: string; title: string; shopName: string; price: number; color: string }[] =
      [];
    for (const shop of shops) {
      for (const d of shop.deals) {
        if (
          !key ||
          d.title.toLowerCase().includes(key) ||
          shop.name.toLowerCase().includes(key) ||
          shop.category.includes(key)
        ) {
          rows.push({
            shopId: shop.id,
            dealId: d.id,
            title: d.title,
            shopName: shop.name,
            price: d.price,
            color: shop.coverColor,
          });
        }
      }
    }
    return rows;
  }, [shops, q]);

  return (
    <div className="flex h-full flex-col bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <div className="bg-white">
        <div className="flex h-11 items-center gap-2 px-2">
          <button type="button" className="cursor-pointer border-none bg-transparent p-1" {...bindBack()}>
            <IcBack size={22} />
          </button>
          <button
            type="button"
            className="flex h-9 flex-1 cursor-pointer items-center rounded-full bg-[#F5F5F5] px-3 text-left"
            {...bindBack()}
          >
            <IcSearch size={15} className="text-[#999]" />
            <span className="ml-1.5 truncate text-[13px] text-[#222]">{q}</span>
          </button>
        </div>
        <div className="flex px-4">
          {(
            [
              ['shop', s.tabShop],
              ['deal', s.tabDeal],
            ] as const
          ).map(([id, label]) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                className={`relative mr-5 cursor-pointer border-none bg-transparent py-2 text-[14px] ${
                  active ? 'font-bold text-[#222]' : 'text-[#666]'
                }`}
                {...bindTap('search.result-tab', { params: { tab: id, q } })}
              >
                {label}
                {active ? (
                  <span className="absolute bottom-0 left-1/2 h-[3px] w-5 -translate-x-1/2 rounded-full bg-[#FF6633]" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="search-result"
        data-scroll-direction="vertical"
      >
        {tab === 'shop' ? (
          shopList.length === 0 ? (
            <div className="py-16 text-center text-[13px] text-[#999]">{s.emptyList}</div>
          ) : (
            <div className="divide-y divide-[#F5F5F5] bg-white">
              {shopList.map((shop) => (
                <ShopCard key={shop.id} shop={shop} />
              ))}
            </div>
          )
        ) : deals.length === 0 ? (
          <div className="py-16 text-center text-[13px] text-[#999]">{s.emptyList}</div>
        ) : (
          <div className="bg-white">
            {deals.map((d) => (
              <button
                key={`${d.shopId}:${d.dealId}`}
                type="button"
                className="flex w-full cursor-pointer items-center gap-3 border-none border-b border-[#F5F5F5] bg-transparent px-3 py-3 text-left"
                {...bindTap('search.deal-open', { params: { shopId: d.shopId, dealId: d.dealId } })}
              >
                <div className="h-14 w-14 overflow-hidden rounded-lg" style={{ background: d.color }}>
                  {shopCoverUrl(d.shopId) ? (
                    <img src={shopCoverUrl(d.shopId)} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-semibold">{d.title}</div>
                  <div className="truncate text-[11px] text-[#999]">{d.shopName}</div>
                </div>
                <div className="text-[15px] font-bold text-[#FF6633]">¥{d.price}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
