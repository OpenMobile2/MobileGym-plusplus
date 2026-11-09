import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { useTbsgStore } from '../state';
import { cartSubtotal, fmt, shopCartLines } from '../utils';
import type { TbShop } from '../types';
import { AppImg, Price, Sheet, showToast } from './common';
import { IcClose, IcPlus } from '../res/icons';

const FILTERS = ['全部', '一键凑优惠', '5元以下', '价格'] as const;

/**
 * 凑单商品弹层(spec shop.addonSheet,IMG_R022)
 * 顶部门槛进度实时刷新;筛选胶囊;低价小件列表(+/选规格)
 */
export function AddonSheet({ shop }: { shop: TbShop }) {
  const { bindTap, back } = useTbsgGestures();
  const [, setSp] = useSearchParams();
  const cart = useTbsgStore((s) => s.cart);
  const items = useTbsgStore((s) => s.items);
  const addToCart = useTbsgStore((s) => s.addToCart);
  const [filter, setFilter] = useState<string>('全部');

  const lines = shopCartLines({ cart }, shop.id);
  const subtotal = cartSubtotal(lines);
  const nextTier = shop.promos
    .filter((p) => p.full > subtotal)
    .sort((a, b) => a.full - b.full)[0];
  const gap = nextTier ? Math.round((nextTier.full - subtotal) * 100) / 100 : 0;

  let list = items.filter((i) => i.shopId === shop.id && i.price < 12);
  if (filter === '5元以下') list = list.filter((i) => i.price < 5);
  if (filter === '价格') list = [...list].sort((a, b) => a.price - b.price);
  if (filter === '一键凑优惠') list = [...list].sort((a, b) => b.price - a.price);

  return (
    <Sheet maxH="72%">
      {/* 门槛进度 + 关闭 */}
      <div className="relative shrink-0 px-4 pt-4 pb-2">
        <div className="text-[15px] font-bold text-[#1A1A1A] pr-9">
          {nextTier ? (
            <>
              再买<span className="text-[#F53F3F]">¥{fmt(gap)}</span>元,
              可减<span className="text-[#F53F3F]">¥{fmt(nextTier.off)}</span>元
            </>
          ) : '已享受当前最高满减优惠'}
        </div>
        <div className="text-[11px] text-[#999999] mt-0.5">已选¥{fmt(subtotal)},凑单立享满减</div>
        <button
          {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'shop.addonSheet.close' }, { onTrigger: () => back() })}
          className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-[#F3F6F8] border-none flex items-center justify-center cursor-pointer"
          aria-label="关闭"
        >
          <IcClose size={18} className="text-[#1A1A1A]" />
        </button>
      </div>

      {/* 筛选胶囊 */}
      <div className="flex gap-2 px-4 py-1.5 shrink-0 overflow-x-auto" data-scroll-container="addon-filters" data-scroll-direction="horizontal">
        {FILTERS.map((f) => (
          <button
            key={f}
            {...bindTap<HTMLButtonElement>(
              { kind: 'action', id: 'shop.addon.filter' },
              { params: { filter: f }, onTrigger: () => setFilter(f) },
            )}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[12px] border cursor-pointer ${
              filter === f
                ? 'bg-[#FDEFE6] border-[#ED6C2C] text-[#ED6C2C] font-semibold'
                : 'bg-[#F3F6F8] border-transparent text-[#1A1A1A]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* 凑单商品列表 */}
      <div className="flex-1 overflow-y-auto px-4 pb-4" data-scroll-container="addon-list" data-scroll-direction="vertical">
        {list.length === 0 && (
          <div className="py-10 text-center text-[13px] text-[#999999]">暂无可凑单的小件商品</div>
        )}
        {list.map((item) => (
          <div key={item.id} className="flex items-center gap-3 py-2.5 border-b border-[#EEEEEE] last:border-b-0">
            <AppImg src={item.image} className="w-14 h-14 rounded-lg object-cover shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[14px] text-[#1A1A1A] font-medium truncate">{item.name}</div>
              <div className="text-[11px] text-[#999999] mt-0.5">月售{item.monthlySales}</div>
              <div className="mt-0.5"><Price value={item.price} size={15} orig={item.origPrice} /></div>
            </div>
            {item.skuGroups ? (
              <button
                {...bindTap<HTMLButtonElement>(
                  { kind: 'action', id: 'shop.addon.sku.open' },
                  {
                    params: { itemId: item.id },
                    onTrigger: () => setSp((p) => { p.set('panel', 'sku'); p.set('item', item.id); return p; }),
                  },
                )}
                className="shrink-0 h-7 px-2.5 rounded-full bg-[#ED6C2C] text-white text-[12px] font-semibold border-none cursor-pointer"
              >
                选规格
              </button>
            ) : (
              <button
                {...bindTap<HTMLButtonElement>(
                  { kind: 'action', id: 'shop.addon.add' },
                  {
                    params: { itemId: item.id },
                    onTrigger: () => { addToCart(item.id, null, item.price); showToast('已加入购物车'); },
                  },
                )}
                className="shrink-0 w-6 h-6 rounded-full bg-[#ED6C2C] text-white border-none flex items-center justify-center cursor-pointer p-0"
                aria-label="加购"
              >
                <IcPlus size={15} />
              </button>
            )}
          </div>
        ))}
      </div>
    </Sheet>
  );
}
