// apps/Tencentvideo/components/ChipRow.tsx —— 横滑 chip 行(频道 chip/筛选维度/榜单 chip)。
// 绑定规则:actionId 必须字面量绑定,故由页面通过 getBind(item, idx) 传入绑定 props
// (页面内部调用 bindTap('<literal>', { params: { value: item } }))。
import type { BindProps } from './ui';
import React from 'react';
import { TV_COLORS as C } from '../constants';

export interface ChipRowProps {
  items: readonly string[];
  /** 当前选中项(值或 index 二选一;都不传 = 无选中态) */
  active?: string | number;
  /** 页面提供的绑定工厂:返回 data-action/onClick 等 props(字面量绑定,硬规则2) */
  getBind?: (item: string, index: number) => BindProps;
  dark?: boolean;
  /** 榜单米金变体(rankChipBg/rankChipText) */
  rank?: boolean;
  className?: string;
}

export function ChipRow({ items, active, getBind, dark = false, rank = false, className }: ChipRowProps) {
  return (
    <div
      className={`flex gap-2 overflow-x-auto px-3 py-2 scrollbar-none ${className ?? ''}`}
      data-scroll-container="chips"
      data-scroll-direction="horizontal"
    >
      {items.map((item, i) => {
        const isActive = typeof active === 'number' ? active === i : active === item;
        const style: React.CSSProperties = isActive
          ? { background: C.primaryBg, color: C.primary }
          : rank
            ? { background: C.rankChipBg, color: C.rankChipText }
            : dark
              ? { background: C.darkCard, color: C.darkTextSub }
              : { background: C.chipGray, color: C.textSub };
        return (
          <button
            key={item}
            className="shrink-0 px-3 py-1 rounded-full text-[13px] border-none whitespace-nowrap"
            style={style}
            {...(getBind ? getBind(item, i) : {})}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}
