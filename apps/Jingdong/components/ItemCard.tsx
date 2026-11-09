import React from 'react';
import type { Item } from '../types';
import { Img, PriceYuan, Tag } from './ui';
import { IcPlus } from '../res/icons';

// 双列商品瀑布流卡。openBind / quickBind 由父页传入(transitionId 字面量在父页绑定)。
export function ItemCard({
  item,
  openBind,
  quickBind,
}: {
  item: Item;
  openBind: React.HTMLAttributes<HTMLElement>;
  quickBind?: React.HTMLAttributes<HTMLElement>;
}) {
  return (
    <div className="bg-white rounded-lg overflow-hidden flex flex-col" {...openBind}>
      <div className="relative w-full aspect-square bg-[#F5F5F5]">
        <Img src={item.image} className="w-full h-full object-cover" alt={item.title} />
        {item.guobu && (
          <span className="absolute left-0 top-0 bg-[#1BA956] text-white text-[10px] px-1 py-0.5 rounded-br-md">
            国补
          </span>
        )}
      </div>
      <div className="p-1.5 flex flex-col gap-1">
        <div className="text-[13px] leading-[17px] text-[#1A1A1A] line-clamp-2">
          {item.self && <span className="text-[#E1251B] font-semibold mr-0.5">自营</span>}
          {item.title}
        </div>
        <div className="flex flex-wrap gap-1">
          {item.jdLogistics && <Tag className="text-[#E1251B] border border-[#E1251B]/30">京东物流</Tag>}
          {item.tags.filter((t) => t !== '自营' && t !== '京东物流').slice(0, 1).map((t) => (
            <Tag key={t} className="text-[#1BA956] bg-[#1BA956]/8">
              {t}
            </Tag>
          ))}
        </div>
        <div className="flex items-end justify-between mt-0.5">
          <div className="flex items-baseline gap-1">
            <PriceYuan value={item.price} className="text-[#E1251B] text-[17px]" />
            <span className="text-[10px] text-[#999]">{item.sold}</span>
          </div>
          {quickBind && (
            <button
              {...quickBind}
              aria-label="加购"
              className="w-6 h-6 rounded-full bg-[#E1251B] text-white flex items-center justify-center shrink-0"
            >
              <IcPlus size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
