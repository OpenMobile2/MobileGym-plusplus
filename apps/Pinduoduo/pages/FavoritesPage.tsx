import React, { useState } from 'react';
import { usePinduoduoGestures } from '../hooks/usePinduoduoGestures';
import { usePinduoduoStore } from '../state';
import { usePinduoduoStrings } from '../hooks/usePinduoduoStrings';
import { TopBar, EmptyState, showToast } from '../components/ui';
import { ItemCard } from '../components/ItemCard';
import { IcCheck } from '../res/icons';

export function FavoritesPage() {
  const { bindTap } = usePinduoduoGestures();
  const s = usePinduoduoStrings();
  const favorites = usePinduoduoStore((st) => st.favorites);
  const items = usePinduoduoStore((st) => st.items);
  const removeFavorites = usePinduoduoStore((st) => st.removeFavorites);

  const [manage, setManage] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const favItems = items.filter((i) => favorites.includes(i.id));

  const toggleSel = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

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
          <span className="text-[13px] text-[#999]">已选 {selected.size} 件</span>
          <button
            {...bindTap({ kind: 'action', id: 'favorites.list.remove' }, { onTrigger: () => { removeFavorites([...selected]); setSelected(new Set()); showToast('已删除'); } })}
            className="px-6 h-9 rounded-full bg-[#E22E1F] text-white text-[14px] font-medium disabled:opacity-40"
            disabled={selected.size === 0}
          >
            {s.btn_delete}
          </button>
        </div>
      )}
    </div>
  );
}
