import React, { useMemo } from 'react';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { useTbsgStore } from '../state';
import { AppImg, Price, TopBar } from '../components/common';

/** 超抢手推荐页(qa:R1):大牌低价·1份起送 */
export default function HotdealsPage() {
  const { bindTap } = useTbsgGestures();
  const shops = useTbsgStore((st) => st.shops);
  const items = useTbsgStore((st) => st.items);

  const list = useMemo(() => {
    const rs = shops
      .filter((x) => x.type === 'restaurant')
      .sort((a, b) => (parseInt(b.monthlySales, 10) || 0) - (parseInt(a.monthlySales, 10) || 0))
      .slice(0, 8);
    return rs.map((shop) => ({
      shop,
      items: items
        .filter((i) => i.shopId === shop.id)
        .sort((a, b) => b.monthlySales - a.monthlySales)
        .slice(0, 2),
    }));
  }, [shops, items]);

  return (
    <div className="flex flex-col h-full bg-[#FFF1E8]">
      <TopBar title="超抢手" titleLeft />
      <div className="px-4 py-2 bg-gradient-to-r from-[#FF5A2A] to-[#ED6C2C] text-white shrink-0">
        <span className="font-bold text-[15px] italic">大牌低价 · 1份起送</span>
        <span className="ml-2 text-[12px] opacity-90">一口价天天抢</span>
      </div>
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="px-3 py-3 flex flex-col gap-3">
          {list.map(({ shop, items: its }) => (
            <div key={shop.id} className="bg-white rounded-xl p-3">
              <div
                {...bindTap<HTMLDivElement>('hotdeals.shop-open', { params: { shopId: shop.id } })}
                className="flex items-center gap-2 cursor-pointer"
              >
                <AppImg src={shop.logo} className="w-10 h-10 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-[14px] text-[#1A1A1A] truncate">{shop.fullName}</div>
                  <div className="text-[11px] text-[#999999] mt-0.5">
                    <span className="text-[#ED6C2C] font-semibold">{shop.rating}分</span>
                    <span className="ml-2">月售{shop.monthlySales}</span>
                    <span className="ml-2">{shop.deliveryMinutes}分钟 {shop.distanceKm}km</span>
                  </div>
                </div>
                <span className="text-[11px] text-[#999999]">进店 &gt;</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 mt-2.5">
                {its.map((it) => (
                  <div
                    key={it.id}
                    {...bindTap<HTMLDivElement>('hotdeals.item-open', { params: { shopId: shop.id } })}
                    className="cursor-pointer"
                  >
                    <div className="relative">
                      <AppImg src={it.image} className="w-full h-[110px] rounded-lg object-cover" />
                      <span className="absolute left-0 top-0 text-[10px] px-1.5 py-[2px] rounded-br-lg rounded-tl-lg bg-[#F53F3F] text-white">1份起送</span>
                    </div>
                    <div className="text-[13px] text-[#1A1A1A] truncate mt-1.5">{it.name}</div>
                    <div className="flex items-center mt-0.5">
                      <Price value={it.price} size={17} orig={it.origPrice} />
                      <span className="ml-auto text-[10px] text-[#999999]">一口价</span>
                      <span className="ml-1.5 w-7 h-7 rounded-full bg-[#F53F3F] text-white text-[11px] font-bold flex items-center justify-center">抢</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
