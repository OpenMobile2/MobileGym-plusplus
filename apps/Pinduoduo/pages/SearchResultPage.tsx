import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePinduoduoGestures } from '../hooks/usePinduoduoGestures';
import { usePinduoduoStore } from '../state';
import { usePinduoduoStrings } from '../hooks/usePinduoduoStrings';
import { ItemCard } from '../components/ItemCard';
import { EmptyState } from '../components/ui';
import { IcNavBack, IcSearch, IcFilter } from '../res/icons';

type SortKey = 'comprehensive' | 'sales' | 'price';

const FILTER_CHIPS = ['包邮', '百亿补贴', '先用后付', '48小时发货', '旗舰店'];

export function SearchResultPage() {
  const [sp] = useSearchParams();
  const q = sp.get('q') || '';
  const drawer = sp.get('drawer');
  const { bindTap, bindBack, back } = usePinduoduoGestures();
  const s = usePinduoduoStrings();
  const items = usePinduoduoStore((st) => st.items);
  const [sort, setSort] = useState<SortKey>('comprehensive');
  const [chips, setChips] = useState<string[]>([]);

  const filtered = q ? items.filter((it) => it.title.includes(q)) : items;
  const list = filtered.length ? filtered : items;

  const toggleChip = (c: string) =>
    setChips((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const sortCls = (k: SortKey) =>
    `px-1 text-[13px] ${sort === k ? 'text-[#E22E1F] font-medium' : 'text-[#666]'}`;

  return (
    <div className="h-full flex flex-col pt-10 overflow-hidden bg-white" data-status-bar-foreground="dark">
      {/* 顶部:返回 + 搜索条 + 筛选 */}
      <div className="shrink-0 h-12 flex items-center gap-1 px-1.5 border-b border-[#F0F0F0]">
        <button {...bindBack()} aria-label="返回" className="w-9 h-9 flex items-center justify-center">
          <IcNavBack size={24} />
        </button>
        <div
          {...bindTap('search.submit', { params: { q } })}
          className="flex-1 h-8 bg-[#F5F5F5] rounded-full flex items-center px-3 gap-1.5"
        >
          <IcSearch size={16} className="text-[#999]" />
          <span className="flex-1 text-[14px] text-[#333] truncate">{q || s.search_placeholder}</span>
        </div>
        <button
          {...bindTap('result.filter.show')}
          className="px-2 flex items-center gap-0.5 text-[13px] text-[#666]"
        >
          <IcFilter size={16} /> {s.filter}
        </button>
      </div>

      {/* 排序行 */}
      <div className="shrink-0 h-10 flex items-center gap-6 px-4 border-b border-[#F0F0F0]">
        <button
          {...bindTap({ kind: 'action', id: 'result.sort.select.comprehensive' }, { onTrigger: () => setSort('comprehensive') })}
          className={sortCls('comprehensive')}
        >
          {s.sort_comprehensive}
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'result.sort.select.sales' }, { onTrigger: () => setSort('sales') })}
          className={sortCls('sales')}
        >
          {s.sort_sales}
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'result.sort.select.price' }, { onTrigger: () => setSort('price') })}
          className={sortCls('price')}
        >
          {s.sort_price}
        </button>
      </div>

      {/* 结果双列 */}
      <div
        className="flex-1 overflow-y-auto bg-[#F5F5F5]"
        data-scroll-container
        data-scroll-direction="vertical"
      >
        {list.length === 0 ? (
          <EmptyState text={s.empty_search} />
        ) : (
          <div className="grid grid-cols-2 gap-2 p-2">
            {list.map((it) => (
              <ItemCard
                key={it.id}
                item={it}
                openBind={bindTap('result.item-open', { params: { itemId: it.id } })}
              />
            ))}
          </div>
        )}
      </div>

      {/* 筛选抽屉(URL 驱动) */}
      {drawer === 'filter' && (
        <div className="absolute inset-0 z-40 flex">
          <div className="flex-1 bg-black/50" {...bindBack()} />
          <div className="w-72 max-w-[80%] bg-white flex flex-col">
            <div className="flex-1 overflow-y-auto p-4">
              <div className="text-[15px] font-medium text-[#333] mb-3">筛选</div>
              <div className="flex flex-wrap gap-2">
                {FILTER_CHIPS.map((c) => {
                  const on = chips.includes(c);
                  return (
                    <button
                      key={c}
                      onClick={() => toggleChip(c)}
                      className={`px-3 py-1.5 rounded-full text-[13px] border ${
                        on ? 'border-[#E22E1F] text-[#E22E1F] bg-[#FFF0E8]' : 'border-[#EEE] text-[#333] bg-[#F7F7F7]'
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="p-3 border-t border-[#F0F0F0]">
              <button
                {...bindTap({ kind: 'action', id: 'result.filter.apply' }, { onTrigger: () => back() })}
                className="w-full h-11 rounded-full bg-[#E22E1F] text-white font-medium"
              >
                {s.btn_confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
