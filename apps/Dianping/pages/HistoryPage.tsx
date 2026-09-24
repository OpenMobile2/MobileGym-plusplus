import React, { useMemo, useState } from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { useDianpingGestures } from '../hooks/useDianpingGestures';
import { useDianpingStore } from '../state';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcBack } from '../res/icons';
import { ShopCard } from '../components/ShopCard';
import { Stars } from '../components/Stars';
import { shopCoverUrl, noteCoverUrl } from '../assets';

type Tab = 'shop' | 'deal' | 'content';

export default function HistoryPage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindBack, bindTap, action } = useDianpingGestures();
  const browseHistory = useDianpingStore((st) => st.browseHistory);
  const shops = useDianpingStore((st) => st.shops);
  const notes = useDianpingStore((st) => st.notes);
  const clearBrowseHistory = useDianpingStore((st) => st.clearBrowseHistory);
  const showToast = useDianpingStore((st) => st.showToast);
  const [tab, setTab] = useState<Tab>('shop');

  const shopRows = useMemo(() => {
    const seen = browseHistory
      .filter((e) => e.kind === 'shop')
      .map((e) => shops.find((x) => x.id === e.refId))
      .filter(Boolean) as typeof shops;
    return seen;
  }, [browseHistory, shops]);

  // 团购浏览:取有团购/代金券的店的首个团购
  const dealRows = useMemo(
    () =>
      shops
        .filter((sh) => sh.deals.length)
        .slice(0, 4)
        .map((sh) => ({ shop: sh, deal: sh.deals[0] })),
    [shops],
  );

  const tabs: [Tab, string][] = [
    ['shop', s.tabShop],
    ['deal', s.tabDeal],
    ['content', s.tabContent],
  ];

  return (
    <div className="flex h-full flex-col bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <div className="relative flex h-11 items-center justify-center bg-white px-1">
        <button type="button" className="absolute left-1 border-none bg-transparent p-1.5 cursor-pointer" {...bindBack()}>
          <IcBack size={22} />
        </button>
        <div className="text-[16px] font-semibold text-[#222]">{s.recentBrowse}</div>
        <button
          type="button"
          className="absolute right-3 border-none bg-transparent text-[14px] text-[#333] cursor-pointer"
          {...action('history.clear.action', () => {
            clearBrowseHistory();
            showToast(s.clearAll);
          })}
        >
          {s.clearAll}
        </button>
      </div>

      <div className="flex justify-center gap-8 bg-white pb-2">
        {tabs.map(([id, label]) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              className={`relative border-none bg-transparent pb-1 text-[15px] cursor-pointer ${
                active ? 'font-bold text-[#222]' : 'text-[#999]'
              }`}
              {...action('history.tab.select.target', () => setTab(id), { params: { target: id } })}
            >
              {label}
              {active ? <span className="absolute bottom-0 left-1/2 h-[3px] w-5 -translate-x-1/2 rounded-full bg-[#FF6633]" /> : null}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="history" data-scroll-direction="vertical">
        {tab === 'shop' && (
          <>
            <div className="bg-[#F5F5F5] px-3 py-1.5 text-[12px] text-[#999]">{s.today}</div>
            <div className="divide-y divide-[#F5F5F5] bg-white">
              {shopRows.map((shop) => (
                <ShopCard key={shop.id} shop={shop} transitionId="history.shop-open" dense />
              ))}
            </div>
          </>
        )}

        {tab === 'deal' && (
          <>
            <div className="bg-[#F5F5F5] px-3 py-1.5 text-[12px] text-[#999]">{s.yesterday}</div>
            <div className="divide-y divide-[#F5F5F5] bg-white">
              {dealRows.map(({ shop, deal }) => (
                <button
                  key={deal.id}
                  type="button"
                  className="flex w-full items-center gap-3 border-none bg-white px-3 py-3 text-left cursor-pointer"
                  {...bindTap('history.shop-open', { params: { shopId: shop.id } })}
                >
                  <div className="h-[64px] w-[64px] shrink-0 overflow-hidden rounded-[8px]" style={{ background: shop.coverColor }}>
                    {shopCoverUrl(shop.id) ? <img src={shopCoverUrl(shop.id)} alt="" className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-bold text-[#222]">{shop.name}</div>
                    <div className="mt-0.5 truncate text-[12px] text-[#666]">{deal.title}</div>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-[15px] font-bold text-[#FF3B2F]">¥{deal.price}</span>
                      <span className="text-[11px] text-[#CCC] line-through">¥{deal.origin}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {tab === 'content' && (
          <>
            <div className="bg-[#F5F5F5] px-3 py-1.5 text-[12px] text-[#999]">{s.yesterday}</div>
            <div className="divide-y divide-[#F5F5F5] bg-white">
              {notes.map((n) => {
                const shop = shops.find((x) => x.id === n.shopId);
                return (
                  <button
                    key={n.id}
                    type="button"
                    className="flex w-full items-center gap-3 border-none bg-white px-3 py-3 text-left cursor-pointer"
                    {...bindTap('history.note-open', { params: { noteId: n.id } })}
                  >
                    <div className="h-[64px] w-[64px] shrink-0 overflow-hidden rounded-[8px]" style={{ background: n.coverColor }}>
                      {noteCoverUrl(n.id) ? <img src={noteCoverUrl(n.id)} alt="" className="h-full w-full object-cover" /> : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-2 text-[14px] font-semibold text-[#222]">{n.title}</div>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-[#999]">
                        {shop ? <Stars score={shop.score} size={10} /> : null}
                        <span className="truncate">{n.author}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
        <div className="py-4 text-center text-[12px] text-[#BBB]">— {s.onlyRecent2m} —</div>
      </div>
    </div>
  );
}
