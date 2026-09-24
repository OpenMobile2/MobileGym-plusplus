import React, { useState } from 'react';
import { useJingdongGestures } from '../hooks/useJingdongGestures';
import { useJingdongStore } from '../state';
import { Img } from '../components/ui';
import { IcNavBack, IcSearch, IcChevronDown, IcChevronRight } from '../res/icons';

const SUBTABS: Record<string, string[]> = {
  电脑办公: ['电脑整机', '外设产品', '电脑组件'],
  手机: ['手机通讯', '手机配件', '智能设备'],
  家电: ['大家电', '厨房电器', '生活电器'],
};

export function CategoryPage() {
  const { bindTap, bindBack } = useJingdongGestures();
  const categories = useJingdongStore((s) => s.categories);
  const [groupKey, setGroupKey] = useState(categories[0]?.key ?? '');
  const active = categories.find((g) => g.key === groupKey) ?? categories[0];
  const subtabs = SUBTABS[active?.name ?? ''] ?? ['推荐', '热销', '新品'];
  const [sub, setSub] = useState(0);

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="dark">
      {/* 顶部栏 */}
      <div className="shrink-0 pt-10 h-[calc(2.75rem+2.5rem)] flex items-center px-2 bg-white">
        <button {...bindBack()} aria-label="返回" className="w-9 h-9 flex items-center justify-center">
          <IcNavBack size={22} className="text-[#333]" />
        </button>
        <div className="flex-1 text-center text-[17px] font-medium text-[#1A1A1A]">分类</div>
        <button {...bindTap('category.search-open')} aria-label="搜索" className="w-9 h-9 flex items-center justify-center text-[#333]">
          <IcSearch size={22} />
        </button>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* 左侧类目栏 */}
        <div className="w-[92px] shrink-0 overflow-y-auto bg-[#F5F5F5]">
          {categories.map((g) => {
            const on = g.key === groupKey;
            return (
              <button
                key={g.key}
                {...bindTap({ kind: 'action', id: 'category.left.select.group' }, { params: { group: g.key }, onTrigger: () => { setGroupKey(g.key); setSub(0); } })}
                className={`relative w-full py-4 text-[14px] ${on ? 'bg-white text-[#E1251B] font-bold' : 'text-[#333]'}`}
              >
                {on && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#E1251B] rounded-r" />}
                {g.name}
              </button>
            );
          })}
        </div>

        {/* 右侧内容 */}
        <div className="flex-1 flex flex-col min-w-0 bg-white ml-2 rounded-tl-xl">
          {/* 子分类横tab */}
          <div className="shrink-0 flex items-center gap-2 px-3 py-2.5 overflow-x-auto no-scrollbar">
            {subtabs.map((s, i) => (
              <button
                key={s}
                {...bindTap({ kind: 'action', id: 'category.subtab.select.sub' }, { params: { sub: s }, onTrigger: () => setSub(i) })}
                className={`px-3 py-1.5 rounded-md text-[13px] shrink-0 ${sub === i ? 'bg-[#FDECEA] text-[#E1251B] border border-[#E1251B]' : 'bg-[#F4F4F4] text-[#333]'}`}
              >
                {s}
              </button>
            ))}
            <IcChevronDown size={16} className="text-[#999] ml-auto shrink-0" />
          </div>

          {/* 品类九宫格 */}
          <div className="flex-1 overflow-y-auto px-3 pb-6" data-scroll-container="category-right" data-scroll-direction="vertical">
            <div className="flex items-center gap-1 py-3">
              <span className="text-[16px] font-bold text-[#1A1A1A]">{subtabs[sub]}</span>
              <IcChevronRight size={16} className="text-[#999]" />
            </div>
            <div className="grid grid-cols-3 gap-y-4">
              {active?.children.map((c) => (
                <button key={c.name} {...bindTap('category.item-open')} className="flex flex-col items-center gap-1.5">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#F7F7F7]">
                    <Img src={c.icon} className="w-full h-full object-cover" alt={c.name} />
                  </div>
                  <span className="text-[12px] text-[#333] text-center">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
