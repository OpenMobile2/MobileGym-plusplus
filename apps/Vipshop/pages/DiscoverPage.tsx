import React from 'react';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { Img, Countdown, VIP } from '../components/ui';
import { ItemGrid } from '../components/ItemCard';

export default function DiscoverPage() {
  const { bindTap } = useVipshopGestures();
  const brands = useVipshopStore((s) => s.brands);
  const items = useVipshopStore((s) => s.items);

  // 品牌专场背景/头像用该品牌真实商品图(数据里 banner/logo 均回退到同一张,这里按 itemIds 取真实图)
  const brandImg = (brand: { itemIds: string[]; banner: string }) => {
    const first = items.find((it) => brand.itemIds.includes(it.id));
    return first?.image ?? brand.banner;
  };
  const brandThumbs = (brand: { itemIds: string[] }, n: number) =>
    brand.itemIds
      .map((id) => items.find((it) => it.id === id)?.image)
      .filter((x): x is string => Boolean(x))
      .slice(0, n);

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]">
      {/* 自带粉色头部 */}
      <div className="shrink-0 px-3 pt-2 pb-2" style={{ background: 'linear-gradient(180deg,#FBDCEC,#F5F5F5)' }}>
        <div className="flex items-center">
          <div className="text-[18px] font-bold text-[#222222] flex-1">发现品牌</div>
          <button
            {...bindTap('discover.brands-open')}
            className="bg-transparent border-none cursor-pointer text-[12px]"
            style={{ color: VIP.primary }}
          >
            全部品牌 ›
          </button>
        </div>
        <div className="text-[12px] text-[#888888] mt-0.5">超级大牌日 · 品牌专场 · 每日上新</div>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="discover-body" data-scroll-direction="vertical">
        {/* 专场卡列表(真实商品图背景 + 左侧信息覆盖 + 右侧商品缩略) */}
        <div className="px-2 pt-2 flex flex-col gap-2.5">
          {brands.map((brand) => {
            const thumbs = brandThumbs(brand, 3);
            return (
              <div
                key={brand.id}
                {...bindTap('discover.event-open', { params: { id: brand.id } })}
                className="rounded-xl overflow-hidden cursor-pointer relative bg-white"
              >
                {/* 背景大图 */}
                <Img src={brandImg(brand)} className="absolute inset-0 w-full h-full object-cover" />
                {/* 左侧玫红→透明覆盖,信息压左,右侧露出商品图 */}
                <div
                  className="relative flex flex-col justify-center px-4 h-36"
                  style={{ background: 'linear-gradient(90deg,rgba(228,0,127,0.92) 0%,rgba(228,0,127,0.55) 42%,rgba(228,0,127,0) 66%)' }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-white text-[17px] font-bold drop-shadow">{brand.name}</span>
                    <span className="text-[10px] text-white rounded px-1 py-0.5" style={{ background: 'rgba(0,0,0,0.25)' }}>超级大牌日</span>
                  </div>
                  <span className="text-white/90 text-[12px] mt-1">{brand.slogan}</span>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[13px] font-bold rounded-full px-2.5 py-0.5" style={{ color: VIP.primary, background: '#fff' }}>{brand.discountText}</span>
                    <Countdown endsAt={brand.endsAt} />
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-white/80 text-[10px]">{brand.subscribers}人订阅</span>
                    <span className="text-white/80 text-[10px]">· 去逛逛 ›</span>
                  </div>
                </div>
                {/* 右下角商品缩略条 */}
                <div className="absolute right-2 bottom-2 flex gap-1">
                  {thumbs.map((src, i) => (
                    <Img key={i} src={src} className="w-11 h-14 rounded object-cover border-2 border-white/70" />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* 品牌 logo 墙(真实商品图作头像) */}
        <div className="mt-3 px-2">
          <div className="text-[15px] font-bold text-[#222222] mb-1.5">热门品牌</div>
          <div className="bg-white rounded-lg grid grid-cols-4 gap-y-3 py-3">
            {brands.map((brand) => (
              <button
                key={brand.id}
                {...bindTap('discover.brand-open', { params: { id: brand.id } })}
                className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer"
              >
                <Img src={brandImg(brand)} className="w-12 h-12 rounded-full object-cover" style={{ border: '1px solid #F0F0F0' }} />
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
