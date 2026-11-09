import React from 'react';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { TopBar, Img, Price, EmptyState, VIP } from '../components/ui';
import { IcArrowDown } from '../res/icons';

export default function PriceDropPage() {
  const { bindTap } = useVipshopGestures();
  const items = useVipshopStore((s) => s.items);

  // 取 5-8 个商品作为降价商品(现价=item.price,原价=item.originPrice → 降幅)
  const dropItems = items.slice(0, Math.min(8, Math.max(5, items.length)));

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]">
      <TopBar title="降价提醒" />

      <div className="flex-1 overflow-y-auto" data-scroll-container="pricedrop-list" data-scroll-direction="vertical">
        {dropItems.length === 0 ? (
          <EmptyState text="暂无降价商品" hint="收藏喜欢的商品,降价第一时间提醒你" />
        ) : (
          <>
            <div className="px-3 py-2 text-[12px] text-[#888888]">您关注的 {dropItems.length} 件商品降价啦,先到先得~</div>
            {dropItems.map((it) => {
              const drop = Math.max(0, it.originPrice - it.price);
              return (
                <div
                  key={it.id}
                  {...bindTap('pricedrop.item-open', { params: { id: it.id } })}
                  className="bg-white mt-2 mx-2 rounded-lg p-2.5 flex gap-2.5 cursor-pointer"
                >
                  <Img src={it.image} className="w-20 h-20 rounded-lg object-cover shrink-0" alt={it.title} />
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="text-[13px] text-[#222222] line-clamp-2">{it.title}</div>
                    <span
                      className="inline-flex items-center gap-0.5 self-start text-[11px] rounded px-1.5 py-0.5 mt-1"
                      style={{ color: VIP.red, background: '#FFECEC' }}
                    >
                      <IcArrowDown size={12} />降价 ¥{drop}
                    </span>
                    <div className="flex-1" />
                    <div className="flex items-baseline gap-2">
                      <Price value={it.price} size="m" />
                      <span className="text-[11px] text-[#BBBBBB] line-through">原价 ¥{it.originPrice}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="h-3" />
          </>
        )}
      </div>
    </div>
  );
}
