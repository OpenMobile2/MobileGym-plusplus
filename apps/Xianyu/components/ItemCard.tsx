import React from 'react';
import { useXianyuGestures } from '../hooks/useXianyuGestures';
import { ItemImage } from './ItemImage';
import type { XyItem } from '../types';

/** 双列瀑布流商品卡(首页/搜索结果) */
export function ItemCard({ item }: { item: XyItem }) {
  const { bindTap } = useXianyuGestures();
  return (
    <button
      {...bindTap('home.item-open', { params: { itemId: item.id } })}
      className="block w-full text-left bg-white rounded-[10px] overflow-hidden border-none p-0 cursor-pointer mb-2"
    >
      <div className="relative w-full aspect-square">
        <ItemImage seed={item.id} src={item.images[0]} category={item.category} label={item.title} className="w-full h-full" />
        {item.inspected && (
          <span className="absolute left-1.5 top-1.5 bg-[#1CB854] text-white text-[10px] px-1.5 py-0.5 rounded">验货宝</span>
        )}
        {item.soldOut && (
          <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-sm">已售出</span>
        )}
      </div>
      <div className="px-2 py-1.5">
        <div className="text-[13px] text-[#1A1A1A] leading-snug line-clamp-2 min-h-[34px]">{item.title}</div>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-[#FF3B30] font-bold text-[15px]">
            <span className="text-[11px]">¥</span>{item.price}
          </span>
          {item.originalPrice && (
            <span className="text-[#999999] text-[11px] line-through">¥{item.originalPrice}</span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-1 flex-wrap">
          {item.tags.slice(0, 2).map((t) => (
            <span key={t} className="text-[10px] text-[#FF8A00] bg-[#FFF3E0] px-1 rounded">{t}</span>
          ))}
          <span className="text-[11px] text-[#999999] ml-auto">{item.wantCount}人想要</span>
        </div>
      </div>
    </button>
  );
}
