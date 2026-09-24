import React from 'react';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { Img, Countdown, VIP } from '../components/ui';
import { ItemGrid } from '../components/ItemCard';

export default function DiscoverPage() {
  const { bindTap } = useVipshopGestures();
  const brands = useVipshopStore((s) => s.brands);
  const items = useVipshopStore((s) => s.items);

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]">
      {/* 自带粉色头部 */}
      <div className="shrink-0 px-3 pt-2 pb-2" style={{ background: 'linear-gradient(180deg,#FBDCEC,#F5F5F5)' }}>
        <div className="text-[18px] font-bold text-[#222222]">发现品牌</div>
        <div className="text-[12px] text-[#888888] mt-0.5">超级大牌日 · 品牌专场 · 每日上新</div>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="discover-body" data-scroll-direction="vertical">
        {/* 专场卡列表(banner+slogan+discountText+倒计时) */}
        <div className="px-2 pt-2 flex flex-col gap-2">
          {brands.map((brand) => (
            <div
              key={brand.id}
              {...bindTap('discover.event-open', { params: { id: brand.id } })}
              className="rounded-lg overflow-hidden cursor-pointer relative"
            >
              <Img src={brand.banner} className="w-full h-28 object-cover" />
              <div
                className="absolute inset-0 flex flex-col justify-center px-4"
                style={{ background: 'linear-gradient(90deg,rgba(228,0,127,0.75),rgba(122,60,255,0.35))' }}
              >
                <span className="text-white text-[16px] font-bold">{brand.name} · 超级大牌日</span>
                <span className="text-white text-[12px] mt-0.5">{brand.slogan}</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[12px] text-[#E4007F] bg-white rounded-full px-2 py-0.5 font-semibold">{brand.discountText}</span>
                  <Countdown endsAt={brand.endsAt} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 品牌 logo 墙 */}
        <div className="mt-3 px-2">
          <div className="text-[15px] font-bold text-[#222222] mb-1.5">热门品牌</div>
          <div className="bg-white rounded-lg grid grid-cols-4 gap-y-3 py-3">
            {brands.map((brand) => (
              <button
                key={brand.id}
                {...bindTap('discover.brand-open', { params: { id: brand.id } })}
                className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer"
              >
                <Img src={brand.logo} className="w-12 h-12 rounded-lg object-cover" />
                <span className="text-[11px] text-[#666666] truncate max-w-[56px]">{brand.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 商品瀑布 */}
        <div className="mt-3 px-2 pb-1">
          <span className="text-[15px] font-bold text-[#222222]">发现好物</span>
          <span className="text-[12px] text-[#888888] ml-2" style={{ color: VIP.primary }}>甄选品牌单品</span>
        </div>
        <ItemGrid
          items={items}
          bindingOf={(it) => bindTap('discover.item-open', { params: { id: it.id } })}
        />
        <div className="h-3" />
      </div>
    </div>
  );
}
