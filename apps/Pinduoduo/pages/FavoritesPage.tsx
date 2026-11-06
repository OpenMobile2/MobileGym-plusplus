import React, { useState, useMemo } from 'react';
import { usePinduoduoGestures } from '../hooks/usePinduoduoGestures';
import { usePinduoduoStore } from '../state';
import { usePinduoduoStrings } from '../hooks/usePinduoduoStrings';
import { TopBar, EmptyState, showToast, PriceYuan } from '../components/ui';
import { ItemCard } from '../components/ItemCard';
import { IcCheck, IcSearch } from '../res/icons';

export function FavoritesPage() {
  const { bindTap } = usePinduoduoGestures();
  const s = usePinduoduoStrings();
  const favorites = usePinduoduoStore((st) => st.favorites);
  const items = usePinduoduoStore((st) => st.items);
  const removeFavorites = usePinduoduoStore((st) => st.removeFavorites);
  const addToCart = usePinduoduoStore((st) => st.addToCart); // Assuming we can use this for multi-select checkout if it existed, but we'll implement a mock checkout for now

  const [manage, setManage] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const favItems = useMemo(() => {
    return items.filter((i) => favorites.includes(i.id) && (searchQuery ? i.title.toLowerCase().includes(searchQuery.toLowerCase()) : true));
  }, [items, favorites, searchQuery]);

  const toggleSel = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const selectAll = () => {
    if (selected.size === favItems.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(favItems.map(i => i.id)));
    }
  };

  const totalSelectedPrice = Array.from(selected).reduce((sum, id) => {
    const item = favItems.find(i => i.id === id);
    return sum + (item ? item.price : 0);
  }, 0);

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5] overflow-hidden" data-status-bar-foreground="dark">
      <TopBar
        title={s.title_favorites}
        className="bg-white"
        right={
          <button
            {...bindTap({ kind: 'action', id: 'favorites.manage.toggle' }, { onTrigger: () => { setManage((v) => !v); setSelected(new Set()); } })}
            className="text-[14px] text-[#333] px-1"
          >
            {manage ? '完成' : s.btn_manage}
          </button>
        }
      />

      {/* Search Bar */}
      <div className="bg-white px-3 py-2 shrink-0">
        <div className="bg-[#F5F5F5] rounded-full h-8 flex items-center px-3">
          <IcSearch size={16} className="text-[#999] mr-1.5" />
          <input
            type="text"
            placeholder="搜索收藏商品"
            className="bg-transparent flex-1 text-[13px] outline-none text-[#333]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2.5" data-scroll-container data-scroll-direction="vertical">
        {favItems.length === 0 ? (
          <EmptyState text={s.empty_favorites} />
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {favItems.map((it) => (
              <div key={it.id} className="relative">
                {manage && (
                  <button
                    onClick={() => toggleSel(it.id)}
                    aria-label="选择"
                    className={`absolute left-1.5 top-1.5 z-10 w-5 h-5 rounded-full flex items-center justify-center border ${selected.has(it.id) ? 'bg-[#E22E1F] border-[#E22E1F]' : 'bg-white/80 border-[#CCC]'}`}
                  >
                    {selected.has(it.id) && <IcCheck size={14} className="text-white" />}
                  </button>
                )}
                <ItemCard item={it} openBind={bindTap('favorites.item-open', { params: { itemId: it.id } })} />
              </div>
            ))}
          </div>
        )}
      </div>

      {manage && (
        <div className="shrink-0 bg-white border-t border-[#EEE] p-3 flex items-center justify-between">
          <button onClick={selectAll} className="flex items-center gap-1.5 text-[14px] text-[#333]">
             <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${selected.size === favItems.length && favItems.length > 0 ? 'bg-[#E22E1F] border-[#E22E1F]' : 'bg-white border-[#CCC]'}`}>
               {selected.size === favItems.length && favItems.length > 0 && <IcCheck size={14} className="text-white" />}
             </div>
             全选
          </button>
          <div className="flex items-center gap-3">
             <button
              {...bindTap({ kind: 'action', id: 'favorites.list.remove' }, { onTrigger: () => { removeFavorites([...selected]); setSelected(new Set()); showToast('已删除'); } })}
              className="px-6 h-9 rounded-full bg-[#E22E1F] text-white text-[14px] font-medium disabled:opacity-40"
              disabled={selected.size === 0}
            >
              删除
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
