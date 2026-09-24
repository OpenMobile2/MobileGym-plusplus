import React, { useState } from 'react';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { useTbsgStore } from '../state';
import { fmt, skuDescOf } from '../utils';
import type { TbItem } from '../types';
import { AppImg, Price, Sheet } from './common';
import { IcClose } from '../res/icons';

/**
 * SKU 规格选择弹层(spec shop.skuSheet,IMG_6014/IMG_R014)
 * 由页面以 ?panel=sku&item=:itemId 打开;选项为本地表单草稿(允许 useState)
 */
export function SkuSheet({ item, onConfirm }: { item: TbItem; onConfirm?: () => void }) {
  const { bindTap, back } = useTbsgGestures();
  const addToCart = useTbsgStore((s) => s.addToCart);
  const groups = item.skuGroups ?? [];

  const [sel, setSel] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    for (const g of groups) init[g.name] = g.type === 'single' ? (g.options[0] ? [g.options[0].label] : []) : [];
    return init;
  });

  const { desc, delta } = skuDescOf(groups, sel);
  const unitPrice = Math.round((item.price + delta) * 100) / 100;

  const pick = (gName: string, gType: 'single' | 'multi', label: string) => {
    setSel((prev) => {
      const cur = prev[gName] ?? [];
      if (gType === 'single') return { ...prev, [gName]: [label] };
      return {
        ...prev,
        [gName]: cur.includes(label) ? cur.filter((x) => x !== label) : [...cur, label],
      };
    });
  };

  return (
    <Sheet maxH="86%">
      {/* 顶部商品行 */}
      <div className="flex gap-3 p-4 pb-2 shrink-0 relative">
        <AppImg src={item.image} className="w-20 h-20 rounded-xl object-cover shrink-0" />
        <div className="flex-1 min-w-0 pr-8">
          <div className="text-[16px] font-bold text-[#1A1A1A] leading-snug">{item.name}</div>
          <div className="text-[12px] text-[#999999] mt-1 leading-snug">
            已选:{desc || '未选规格'}
          </div>
          <div className="flex gap-1 mt-1">
            {item.tags.slice(0, 2).map((t) => (
              <span key={t} className="text-[10px] text-[#EB493B] border border-[#EB493B]/60 rounded px-1 py-[1px]">{t}</span>
            ))}
          </div>
          <div className="mt-1">
            <Price value={unitPrice} size={20} orig={item.origPrice} />
          </div>
        </div>
        <button
          {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'shop.sku.close' }, { onTrigger: () => back() })}
          className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-[#F3F6F8] border-none flex items-center justify-center cursor-pointer"
          aria-label="关闭"
        >
          <IcClose size={18} className="text-[#1A1A1A]" />
        </button>
      </div>

      {/* 选项组 */}
      <div className="flex-1 overflow-y-auto px-4 pb-3" data-scroll-container="sku-options" data-scroll-direction="vertical">
        {groups.map((g) => (
          <div key={g.name} className="mt-3">
            <div className="text-[14px] font-semibold text-[#1A1A1A]">
              {g.name}
              {g.type === 'multi' && <span className="text-[11px] text-[#999999] font-normal ml-1">(可多选)</span>}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {g.options.map((opt) => {
                const active = (sel[g.name] ?? []).includes(opt.label);
                return (
                  <button
                    key={opt.label}
                    {...bindTap<HTMLButtonElement>(
                      { kind: 'action', id: 'shop.sku.option.select' },
                      { params: { group: g.name, option: opt.label }, onTrigger: () => pick(g.name, g.type, opt.label) },
                    )}
                    className={`px-3 py-2 rounded-lg text-[13px] cursor-pointer border ${
                      active
                        ? 'bg-[#FDEFE6] border-[#ED6C2C] text-[#ED6C2C] font-semibold'
                        : 'bg-[#F3F6F8] border-transparent text-[#1A1A1A]'
                    }`}
                  >
                    {opt.label}
                    {opt.delta > 0 && <span className="ml-1 text-[11px]">+¥{fmt(opt.delta)}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 底部选好了 */}
      <div className="shrink-0 p-3 border-t border-[#EEEEEE]">
        <button
          {...bindTap<HTMLButtonElement>(
            { kind: 'action', id: 'shop.sku.confirm' },
            {
              onTrigger: () => {
                addToCart(item.id, desc || null, unitPrice);
                onConfirm?.();
                back();
              },
            },
          )}
          className="w-full h-11 rounded-full bg-[#ED6C2C] text-white text-[16px] font-semibold border-none cursor-pointer"
        >
          选好了
        </button>
      </div>
    </Sheet>
  );
}
