import React from 'react';
import type { TbItem, TbShop } from '../types';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { AppImg, Price } from './common';
import { IcClose, IcRight } from '../res/icons';

/**
 * 商家列表卡(首页/频道/搜索通用)。
 * transitionId 由调用方传入字面量绑定(合同:绑定点必须字符串字面量,因此这里用预绑定 props)。
 */
export function ShopCard({
  shop, items, shopBinding, itemBinding, moreBinding, onDismiss, showDismiss,
}: {
  shop: TbShop;
  items?: TbItem[];
  /** 已在调用方用字面量 bindTap 好的属性包 */
  shopBinding: React.HTMLAttributes<HTMLDivElement>;
  itemBinding?: (item: TbItem) => React.HTMLAttributes<HTMLDivElement>;
  moreBinding?: React.HTMLAttributes<HTMLDivElement>;
  onDismiss?: () => void;
  showDismiss?: boolean;
}) {
  const { bindTap } = useTbsgGestures();
  return (
    <div className="bg-white rounded-xl p-3 relative">
      {showDismiss && onDismiss && (
        <button
          {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'home.shopcard.dismiss' }, {
            params: { shopId: shop.id },
            stopPropagation: true,
            onTrigger: onDismiss,
          })}
          className="absolute right-2 top-2 z-10 w-5 h-5 flex items-center justify-center text-gray-300 bg-transparent border-none cursor-pointer"
        >
          <IcClose size={14} />
        </button>
      )}
      <div {...shopBinding} className="flex gap-2.5 cursor-pointer">
        <AppImg src={shop.logo} className="w-[72px] h-[72px] rounded-lg object-cover shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[15px] text-[#1A1A1A] truncate">
            {shop.fullName}
          </div>
          <div className="flex items-center gap-2 mt-1 text-[12px]">
            <span className="text-[#ED6C2C] font-semibold">{shop.rating}分</span>
            <span className="text-[#999999]">月售{shop.monthlySales}</span>
            <span className="ml-auto text-[#1A1A1A] font-medium">{shop.deliveryMinutes}分钟</span>
            <span className="text-[#999999]">{shop.distanceKm}km</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#999999]">
            <span>起送¥{shop.minOrder}</span>
            <span>
              配送约¥{shop.deliveryFee}
              {shop.deliveryFeeOrig > shop.deliveryFee && (
                <span className="line-through ml-0.5">¥{shop.deliveryFeeOrig}</span>
              )}
            </span>
            <span className="text-[#00B45A]">蜂鸟准时达</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {shop.burstCoupon && (
              <span className="text-[10px] px-1 py-[1px] rounded bg-[#FDEBE9] text-[#EB493B] border border-[#F5C1BC]">
                爆¥{shop.burstCoupon.amount}
              </span>
            )}
            {shop.promos.slice(0, 1).map((p) => (
              <span key={p.full} className="text-[10px] px-1 py-[1px] rounded bg-[#FDEBE9] text-[#EB493B]">
                {p.full}减{p.off}
              </span>
            ))}
            {shop.features.slice(0, 2).map((f) => (
              <span key={f} className="text-[10px] px-1 py-[1px] rounded bg-gray-100 text-[#999999]">{f}</span>
            ))}
          </div>
        </div>
      </div>
      {items && items.length > 0 && itemBinding && (
        <div className="flex gap-2 mt-2.5 overflow-x-auto" data-scroll-container="shopitems" data-scroll-direction="horizontal">
          {items.slice(0, 4).map((it) => (
            <div key={it.id} {...itemBinding(it)} className="w-[86px] shrink-0 cursor-pointer">
              <AppImg src={it.image} className="w-[86px] h-[86px] rounded-lg object-cover" />
              <div className="text-[11px] text-[#1A1A1A] truncate mt-1">{it.name}</div>
              <Price value={it.price} size={14} />
            </div>
          ))}
          {moreBinding && (
            <div {...moreBinding} className="w-[60px] shrink-0 flex flex-col items-center justify-center text-[#999999] cursor-pointer">
              <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"><IcRight size={16} /></span>
              <span className="text-[10px] mt-1">查看更多</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
