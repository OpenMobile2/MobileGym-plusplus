import React from 'react';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { TopBar, VIP } from '../components/ui';
import { ItemGrid } from '../components/ItemCard';

/** 凑单目标金额:满 ¥XX 可减 ¥30 */
const ADDON_THRESHOLD = 199;
const ADDON_DISCOUNT = 30;

export default function CartAddonPage() {
  const { bindTap } = useVipshopGestures();

  const cart = useVipshopStore((s) => s.cart);
  const items = useVipshopStore((s) => s.items);

  const cartTotal = cart
    .filter((c) => c.selected)
    .reduce((sum, c) => sum + c.price * c.qty, 0);
  const remain = Math.max(0, ADDON_THRESHOLD - cartTotal);
  const progress = Math.min(1, cartTotal / ADDON_THRESHOLD);
  const reached = remain <= 0;

  // 凑单商品:价格较低的一批,便于凑单
  const addonItems = [...items].sort((a, b) => a.price - b.price).slice(0, 12);

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]">
      <TopBar title="去凑单" />

      <div className="flex-1 overflow-y-auto" data-scroll-container="addon-list" data-scroll-direction="vertical">
        {/* 满减进度条 */}
        <div className="bg-white mx-2 mt-2 rounded-lg p-3">
          <div className="flex items-center gap-1 text-[13px]">
            {reached ? (
              <span className="text-[#222222] font-semibold">
                已满足满减,可减
                <span style={{ color: VIP.orange }}> ¥{ADDON_DISCOUNT}</span>
              </span>
            ) : (
              <span className="text-[#222222]">
                再买
                <span className="font-semibold" style={{ color: VIP.orange }}> ¥{remain} </span>
                可减
                <span className="font-semibold" style={{ color: VIP.orange }}> ¥{ADDON_DISCOUNT}</span>
              </span>
            )}
          </div>
          <div className="mt-2 h-2 rounded-full bg-[#F0F0F0] overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${progress * 100}%`, background: `linear-gradient(90deg,#FF9A3D,${VIP.orange})` }}
            />
          </div>
          <div className="mt-1 text-[11px] text-[#888888]">
            当前已选 ¥{cartTotal.toFixed(2)} / 满 ¥{ADDON_THRESHOLD}
          </div>
        </div>

        <div className="px-1 mt-2 text-[13px] font-semibold text-[#222222] flex items-center gap-1">
          <span className="ml-2">为你精选凑单好物</span>
        </div>

        <div className="mt-2 pb-3">
          <ItemGrid
            items={addonItems}
            bindingOf={(it) => bindTap('addon.item-open', { params: { id: it.id } })}
          />
        </div>
      </div>
    </div>
  );
}
