import React from 'react';
import type { TbItem } from '../types';
import { Img, Price } from './ui';

/**
 * 双列瀑布流商品卡(design-tokens §4)。
 * 点击绑定由调用方传入(不同入口的 transitionId 不同:home.item-open / searchResult.item-open / ...)。
 */
export function ItemCard({ item, binding }: { item: TbItem; binding: object }) {
  return (
    <div {...binding} className="bg-white rounded-xl overflow-hidden cursor-pointer">
      <Img src={item.image} className="w-full aspect-square object-cover" alt={item.title} />
      <div className="p-2">
        <div className="text-[14px] text-[#111111] leading-snug line-clamp-2">{item.title}</div>
        <div className="flex flex-wrap gap-1 mt-1">
          {item.tags.slice(0, 2).map((t) => (
            <span key={t} className="text-[10px] text-[#FF5000] bg-[#FFF1E8] rounded px-1 leading-4">
              {t}
            </span>
          ))}
        </div>
        <div className="flex items-baseline justify-between mt-1.5">
          <Price value={item.price} size="m" />
          <span className="text-[11px] text-[#999999]">{item.sold}</span>
        </div>
      </div>
    </div>
  );
}

export function ItemGrid({
  items, bindingOf,
}: {
  items: TbItem[];
  bindingOf: (item: TbItem) => object;
}) {
  const left = items.filter((_, i) => i % 2 === 0);
  const right = items.filter((_, i) => i % 2 === 1);
  return (
    <div className="flex gap-2 px-2.5">
      <div className="flex-1 flex flex-col gap-2">
        {left.map((it) => <ItemCard key={it.id} item={it} binding={bindingOf(it)} />)}
      </div>
      <div className="flex-1 flex flex-col gap-2">
        {right.map((it) => <ItemCard key={it.id} item={it} binding={bindingOf(it)} />)}
      </div>
    </div>
  );
}
