import React from 'react';
import type { VipItem } from '../types';
import { Img, Price, DiscountTag } from './ui';

/**
 * 双列瀑布流商品卡(design-tokens §版式)。
 * 点击绑定由调用方传入(不同入口 transitionId 不同)。
 * rightSlot:卡片右下角额外内容(收藏心标/加购等,自带绑定)。
 */
export function ItemCard({
  item, binding, rightSlot,
}: { item: VipItem; binding: object; rightSlot?: React.ReactNode }) {
  return (
    <div {...binding} className="bg-white rounded-lg overflow-hidden cursor-pointer">
      <div className="relative">
        <Img src={item.image} className="w-full aspect-square object-cover" alt={item.title} />
        {item.stockTight && (
          <span className="absolute left-1 bottom-1 text-[10px] text-white rounded px-1" style={{ background: '#FF7A00' }}>
            库存紧张
          </span>
        )}
      </div>
      <div className="p-2">
        <div className="text-[13px] text-[#222222] leading-snug line-clamp-2">{item.title}</div>
        <div className="flex flex-wrap gap-1 mt-1">
          {item.tags.slice(0, 2).map((t, ti) => (
            <span key={ti} className="text-[10px] rounded px-1 leading-4" style={{ color: '#E4007F', background: '#FDECF5' }}>
              {t}
            </span>
          ))}
        </div>
        <div className="flex items-end justify-between mt-1.5">
          <div className="flex items-baseline gap-1 min-w-0">
            <Price value={item.price} size="m" />
            <span className="text-[10px] text-[#BBBBBB] line-through shrink-0">¥{item.originPrice}</span>
          </div>
          <DiscountTag text={item.discountText} />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[11px] text-[#888888]">{item.sold}</span>
          {rightSlot}
        </div>
      </div>
    </div>
  );
}

export function ItemGrid({
  items, bindingOf, rightSlotOf, className = '',
}: {
  items: VipItem[];
  bindingOf: (item: VipItem) => object;
  rightSlotOf?: (item: VipItem) => React.ReactNode;
  className?: string;
}) {
  const left = items.filter((_, i) => i % 2 === 0);
  const right = items.filter((_, i) => i % 2 === 1);
  return (
    <div className={`flex gap-2 px-2 ${className}`}>
      <div className="flex-1 flex flex-col gap-2">
        {left.map((it) => <ItemCard key={it.id} item={it} binding={bindingOf(it)} rightSlot={rightSlotOf?.(it)} />)}
      </div>
      <div className="flex-1 flex flex-col gap-2">
        {right.map((it) => <ItemCard key={it.id} item={it} binding={bindingOf(it)} rightSlot={rightSlotOf?.(it)} />)}
      </div>
    </div>
  );
}
