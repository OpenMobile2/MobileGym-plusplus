import React from 'react';
import type { Item } from '../types';
import { Img, PriceYuan, Tag, FufeiTag } from './ui';
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
    <div className="bg-white overflow-hidden flex flex-col min-w-0" {...openBind}>
      <div className="relative w-full aspect-square bg-[#F4F4F4]">
        <Img src={item.image} className="w-full h-full object-cover" alt={item.title} />
        {item.subsidy && (
          <span className="absolute left-1.5 bottom-1.5 bg-[#F52C2C] text-white text-[10px] leading-4 px-1.5 rounded-[2px] font-medium">
            百亿补贴
          </span>
        )}
      </div>
      <div className="px-2 pt-1.5 pb-2 flex flex-col gap-1 min-w-0">
        <div className="text-[13px] leading-[18px] text-[#222] line-clamp-2 font-normal">
          {item.subsidy && (
            <span className="inline-block align-[1px] mr-1 px-1 leading-[15px] rounded-[2px] bg-[#F32B2B] text-white text-[9px] font-medium">
              官方补贴
            </span>
          )}
          {item.title}
        </div>
        <div className="flex items-center gap-1 min-h-[16px] overflow-hidden whitespace-nowrap">
          {item.fufei && <FufeiTag />}
          {item.tags.slice(0, 1).map((t) => (
            <Tag key={t} className="text-[#F03B2D] border border-[#F3B2AA] bg-white">
              {t}
            </Tag>
          ))}
        </div>
        <div className="flex items-end justify-between gap-1 mt-0.5 min-w-0">
          <div className="flex items-baseline gap-1 min-w-0 overflow-hidden">
            <PriceYuan value={item.pinPrice} className="text-[#E62E25] text-[18px] shrink-0" symbolClass="text-[12px]" />
            <span className="text-[10px] text-[#9B9B9B] truncate">{item.sold}</span>
          </div>
          {quickBind && (
            <button
              {...quickBind}
              aria-label="加购"
              className="w-6 h-6 rounded-full border border-[#F03A2D] text-[#F03A2D] bg-white flex items-center justify-center shrink-0"
            >
              <IcPlus size={15} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
