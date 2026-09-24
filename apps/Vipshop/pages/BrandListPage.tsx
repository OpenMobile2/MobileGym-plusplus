import React from 'react';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { TopBar, Img, Countdown, VIP } from '../components/ui';

export default function BrandListPage() {
  const { bindTap } = useVipshopGestures();
  const brands = useVipshopStore((s) => s.brands);

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]">
      <TopBar title="大牌直通" />

      <div className="flex-1 overflow-y-auto" data-scroll-container="brands-list" data-scroll-direction="vertical">
        <div className="px-2 pt-2 flex flex-col gap-2">
          {brands.map((brand) => (
            <div key={brand.id} className="bg-white rounded-lg overflow-hidden">
              <div
                {...bindTap('brandList.event-open', { params: { id: brand.id } })}
                className="relative cursor-pointer"
              >
                <Img src={brand.banner} className="w-full h-28 object-cover" />
                <div
                  className="absolute inset-0 flex flex-col justify-center px-4"
                  style={{ background: 'linear-gradient(90deg,rgba(228,0,127,0.7),rgba(122,60,255,0.3))' }}
                >
                  <span className="text-white text-[16px] font-bold">{brand.name}</span>
                  <span className="text-white text-[12px] mt-0.5">{brand.slogan}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[12px] text-[#E4007F] bg-white rounded-full px-2 py-0.5 font-semibold">{brand.discountText}</span>
                    <Countdown endsAt={brand.endsAt} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-2.5">
                <button
                  {...bindTap('brandList.brand-open', { params: { id: brand.id } })}
                  className="flex items-center gap-2.5 flex-1 min-w-0 bg-transparent border-none cursor-pointer text-left p-0"
                >
                  <Img src={brand.logo} className="w-11 h-11 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-[#222222] truncate">{brand.name}</div>
                    <div className="text-[11px] text-[#888888] mt-0.5">{brand.subscribers}人订阅</div>
                  </div>
                </button>
                <button
                  {...bindTap('brandList.event-open', { params: { id: brand.id } })}
                  className="shrink-0 text-[12px] rounded-full px-3 py-1 cursor-pointer bg-white"
                  style={{ color: VIP.primary, border: `1px solid ${VIP.primary}` }}
                >
                  进入专场
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="h-3" />
      </div>
    </div>
  );
}
