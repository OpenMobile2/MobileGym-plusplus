import React from 'react';
import type { VipItem } from '../types';
import { Img, Price, VIP } from './ui';

/**
 * 双列瀑布流商品卡(对齐真机 IMG_04/IMG_22)。
 * 关键版式:3:4 竖图满宽、品牌行、券后价排版、促销小标、月销。
 * 点击绑定由调用方传入(不同入口 transitionId 不同)。
 * rightSlot:卡片右下角额外内容(收藏心标/加购等,自带绑定)。
 */

// 确定性判定"直播中"角标(不涉及导航 id,纯视觉;禁用随机保持可复现)
function isLive(id: string): boolean {
  const n = id.charCodeAt(id.length - 1);
  return n % 3 === 0;
}

export function ItemCard({
  item, binding, rightSlot,
}: { item: VipItem; binding: object; rightSlot?: React.ReactNode }) {
  const live = isLive(item.id);
  const promo = item.tags[0];
  return (
    <div {...binding} className="bg-white rounded-lg overflow-hidden cursor-pointer">
      <div className="relative">
        <Img src={item.image} className="w-full aspect-[3/4] object-cover" alt={item.title} />
        {live && (
          <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-0.5 text-[10px] text-white rounded px-1 py-0.5" style={{ background: 'rgba(0,0,0,0.55)' }}>
            <span className="w-1 h-1 rounded-full bg-white inline-block" />直播中
          </span>
        )}
        {item.stockTight && (
          <span className="absolute left-0 bottom-0 text-[10px] text-white px-1.5 py-0.5" style={{ background: VIP.orange }}>
            库存紧张
          </span>
        )}
      </div>
      <div className="px-1.5 pt-1.5 pb-1">
        {/* 品牌行 */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-white rounded-sm px-1 leading-4 shrink-0" style={{ background: VIP.primary }}>大牌</span>
          <span className="text-[11px] text-[#888888] truncate">{item.brandName}</span>
        </div>
        {/* 标题 */}
        <div className="text-[13px] text-[#222222] leading-snug line-clamp-2 mt-0.5">{item.title}</div>
        {/* 促销标签 */}
        {promo && (
          <div className="flex flex-wrap gap-1 mt-1">
            <span className="text-[10px] rounded-sm px-1 leading-4" style={{ color: VIP.price, background: '#FDECF5' }}>{promo}</span>
            <span className="text-[10px] rounded-sm px-1 leading-4 border" style={{ color: VIP.orange, borderColor: '#FFD9B0' }}>券199-30</span>
          </div>
        )}
        {/* 价格行 */}
        <div className="flex items-end gap-1 mt-1 flex-wrap">
          <Price value={item.price} size="l" />
          <span className="text-[10px] rounded-sm px-1 leading-4 mb-0.5" style={{ color: '#fff', background: VIP.price }}>特卖价</span>
          <span className="text-[10px] text-[#BBBBBB] line-through mb-0.5">¥{item.originPrice}</span>
          <span className="text-[10px] mb-0.5" style={{ color: VIP.price }}>{item.discountText}</span>
        </div>
        {/* 月销 + rightSlot */}
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-[11px] text-[#AAAAAA]">{item.sold}</span>
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
    <div className={`flex gap-1.5 px-1.5 ${className}`}>
      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
        {left.map((it) => <ItemCard key={it.id} item={it} binding={bindingOf(it)} rightSlot={rightSlotOf?.(it)} />)}
      </div>
      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
        {right.map((it) => <ItemCard key={it.id} item={it} binding={bindingOf(it)} rightSlot={rightSlotOf?.(it)} />)}
      </div>
    </div>
  );
}
