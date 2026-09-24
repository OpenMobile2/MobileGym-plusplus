import React, { useState } from 'react';
import { usePinduoduoGestures } from '../hooks/usePinduoduoGestures';
import { usePinduoduoStore } from '../state';
import { usePinduoduoStrings } from '../hooks/usePinduoduoStrings';
import { TopBar, EmptyState } from '../components/ui';
import { ItemCard } from '../components/ItemCard';

const FOOTPRINT_TABS = [
  { key: 'item', label: '商品' },
  { key: 'shop', label: '店铺' },
] as const;

export function FootprintPage() {
  const { bindTap } = usePinduoduoGestures();
  const s = usePinduoduoStrings();
  const footprints = usePinduoduoStore((st) => st.footprints);
  const items = usePinduoduoStore((st) => st.items);
  const [tab, setTab] = useState<'item' | 'shop'>('item');

  const findItem = (id: string) => items.find((i) => i.id === id);
  const hasAny = footprints.some((d) => d.itemIds.length > 0);

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5] overflow-hidden" data-status-bar-foreground="dark">
      <TopBar title={s.title_footprint} className="bg-white" />

      {/* Tab */}
      <div className="shrink-0 bg-white flex px-3 border-b border-[#EEE]">
        {FOOTPRINT_TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              {...bindTap({ kind: 'action', id: 'footprint.tab.select.type' }, { params: { type: t.key }, onTrigger: () => setTab(t.key) })}
              className="relative py-2.5 mr-6 text-[14px]"
            >
              <span className={active ? 'text-[#E22E1F] font-medium' : 'text-[#666]'}>{t.label}</span>
              {active && <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-6 h-0.5 rounded-full bg-[#E22E1F]" />}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-2.5" data-scroll-container data-scroll-direction="vertical">
        {tab === 'shop' || !hasAny ? (
          <EmptyState text={s.empty_footprint} />
        ) : (
          footprints
            .filter((d) => d.itemIds.length > 0)
            .map((d) => (
              <div key={d.date} className="mb-3">
                <div className="text-[13px] text-[#666] font-medium py-1.5">{d.date}</div>
                <div className="grid grid-cols-2 gap-2.5">
                  {d.itemIds.map((itemId) => {
                    const it = findItem(itemId);
                    if (!it) return null;
                    return (
                      <ItemCard
                        key={itemId}
                        item={it}
                        openBind={bindTap('footprint.item-open', { params: { itemId } })}
                      />
                    );
                  })}
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
