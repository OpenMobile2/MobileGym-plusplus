import React, { useState } from 'react';
import { useJingdongGestures } from '../hooks/useJingdongGestures';
import { useJingdongStore } from '../state';
import { TopBar, Img, PriceYuan, EmptyState, showToast } from '../components/ui';
import { IcClose } from '../res/icons';

// 足迹 — 按日期分组(今天/昨天/更早)的浏览记录,商品卡;管理模式可删除。
export function FootprintPage() {
  const { bindTap } = useJingdongGestures();
  const footprints = useJingdongStore((s) => s.footprints);
  const items = useJingdongStore((s) => s.items);
  const removeFootprint = useJingdongStore((s) => s.removeFootprint);
  const [manage, setManage] = useState(false);

  const findItem = (id: string) => items.find((i) => i.id === id);
  const groups = footprints
    .map((g) => ({ ...g, itemIds: g.itemIds.filter((id) => findItem(id)) }))
    .filter((g) => g.itemIds.length > 0);

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5] pt-10" data-status-bar-foreground="dark">
      <TopBar
        title="足迹"
        right={
          <button onClick={() => setManage((v) => !v)} className="text-[14px] text-[#333] pr-1">
            {manage ? '完成' : '管理'}
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto" data-scroll-container="footprint-list" data-scroll-direction="vertical">
        {groups.length === 0 ? (
          <EmptyState text="还没有浏览记录" />
        ) : (
          groups.map((g) => (
            <div key={g.date} className="mb-2">
              <div className="px-4 py-2.5 text-[14px] font-semibold text-[#1A1A1A]">{g.date}</div>
              <div className="grid grid-cols-3 gap-2 px-3 pb-2">
                {g.itemIds.map((id) => {
                  const item = findItem(id)!;
                  return (
                    <div key={id} className="bg-white rounded-lg overflow-hidden relative">
                      <div className="relative" {...bindTap('footprint.item-open', { params: { itemId: id } })}>
                        <div className="w-full aspect-square bg-[#F5F5F5]">
                          <Img src={item.image} className="w-full h-full object-cover" alt={item.title} />
                        </div>
                        <div className="px-1.5 py-1">
                          <div className="text-[11px] leading-[14px] text-[#333] line-clamp-1">{item.title}</div>
                          <PriceYuan value={item.price} className="text-[#E1251B] text-[13px]" symbolClass="text-[10px]" />
                        </div>
                      </div>
                      {manage && (
                        <button
                          {...bindTap(
                            { kind: 'action', id: 'footprint.item.remove' },
                            { onTrigger: () => { removeFootprint(g.date, id); showToast('已删除'); } },
                          )}
                          aria-label="删除"
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/45 text-white flex items-center justify-center"
                        >
                          <IcClose size={13} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div className="h-3" />
      </div>
    </div>
  );
}
