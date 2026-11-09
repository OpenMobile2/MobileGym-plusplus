import React, { useState } from 'react';
import { usePinduoduoGestures } from '../hooks/usePinduoduoGestures';
import { usePinduoduoStore } from '../state';
import { usePinduoduoStrings } from '../hooks/usePinduoduoStrings';
import { ItemCard } from '../components/ItemCard';
import { SUBSIDY_TABS } from '../constants';
import { IcSearch } from '../res/icons';

export function SubsidyPage() {
  const { bindTap } = usePinduoduoGestures();
  const s = usePinduoduoStrings();
  const items = usePinduoduoStore((st) => st.items);
  const storeTabs = usePinduoduoStore((st) => st.subsidyTabs);
  const tabs = storeTabs && storeTabs.length ? storeTabs : (SUBSIDY_TABS as readonly string[]);
  const [active, setActive] = useState(0);

  // 优先展示补贴商品,再补其它,凑满双列。不同频道展示不同排序/子集。
  const subsidyItems = items.filter((i) => i.subsidy);
  const rest = items.filter((i) => !i.subsidy);
  const base = [...subsidyItems, ...rest];
  // 按当前频道旋转数组,使切换 tab 时商品明显不同(奢品馆偏高价、天天折扣偏低价)。
  const sorted =
    active === 1 ? [...base].sort((a, b) => b.pinPrice - a.pinPrice)
    : active === 3 ? [...base].sort((a, b) => a.pinPrice - b.pinPrice)
    : base;
  const offset = (active * 4) % Math.max(sorted.length, 1);
  const list = [...sorted.slice(offset), ...sorted.slice(0, offset)];

  return (
    <div
      className="h-full flex flex-col pt-10 overflow-hidden bg-[#E22E1F]"
      data-status-bar-foreground="light"
    >
      {/* 红头 + 标题 + 搜索框 */}
      <div className="shrink-0 px-3 pb-2 bg-gradient-to-b from-[#E22E1F] to-[#F53D2D]">
        <div className="text-white text-[18px] font-bold text-center pb-2">{s.tab_subsidy}</div>
        <div
          {...bindTap('subsidy.search-open')}
          className="h-8 bg-white rounded-full flex items-center px-3 gap-1.5"
        >
          <IcSearch size={16} className="text-[#E22E1F]" />
          <span className="text-[13px] text-[#BBB] truncate">{s.search_placeholder}</span>
          <span className="ml-auto text-[12px] bg-[#E22E1F] text-white rounded-full px-3 py-0.5">
            {s.btn_search}
          </span>
        </div>
      </div>

      {/* 频道 tab */}
      <div className="shrink-0 bg-white border-b border-[#F0F0F0]">
        <div className="flex overflow-x-auto no-scrollbar px-1">
          {tabs.map((tab, i) => {
            const on = i === active;
            return (
              <button
                key={tab}
                {...bindTap(
                  { kind: 'action', id: 'subsidy.tab.select.channel' },
                  { params: { tab }, onTrigger: () => setActive(i) },
                )}
                className={`shrink-0 px-4 py-2.5 text-[14px] whitespace-nowrap ${
                  on ? 'text-[#E22E1F] font-medium' : 'text-[#666]'
                }`}
              >
                {tab}
                {on && <span className="block h-0.5 mt-1 rounded-full bg-[#E22E1F]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 商品双列 */}
      <div
        className="flex-1 overflow-y-auto bg-[#F5F5F5]"
        data-scroll-container
        data-scroll-direction="vertical"
      >
        <div className="grid grid-cols-2 gap-2 p-2">
          {list.map((it) => (
            <ItemCard
              key={it.id}
              item={it}
              openBind={bindTap('subsidy.item-open', { params: { itemId: it.id } })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
