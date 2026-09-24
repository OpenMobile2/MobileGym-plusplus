import React, { useState } from 'react';
import { usePinduoduoGestures } from '../hooks/usePinduoduoGestures';
import { usePinduoduoStore } from '../state';
import { TopBar, Img, PriceYuan } from '../components/ui';

export function CategoryPage() {
  const { bindTap } = usePinduoduoGestures();
  const categories = usePinduoduoStore((st) => st.categories);
  const items = usePinduoduoStore((st) => st.items);
  const [activeIdx, setActiveIdx] = useState(0);

  const active = categories[activeIdx];
  const catItems = active
    ? active.itemIds.map((id) => items.find((it) => it.id === id)).filter(Boolean)
    : [];

  return (
    <div className="h-full flex flex-col pt-10 overflow-hidden bg-white" data-status-bar-foreground="dark">
      <TopBar title="分类" />

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧竖直类目列表 */}
        <div className="w-24 shrink-0 bg-[#F7F7F7] overflow-y-auto">
          {categories.map((cat, i) => {
            const on = i === activeIdx;
            return (
              <button
                key={cat.id}
                {...bindTap(
                  { kind: 'action', id: 'category.select.group' },
                  { params: { cat: cat.name }, onTrigger: () => setActiveIdx(i) },
                )}
                className={`w-full text-left px-3 py-3.5 text-[13px] ${
                  on ? 'bg-white text-[#E22E1F] font-medium border-l-2 border-[#E22E1F]' : 'text-[#333]'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* 右侧内容(可左右滑切类目) */}
        <div
          {...bindTap({ kind: 'action', id: 'category.swipe.switch' }, { onTrigger: () => {} })}
          className="flex-1 overflow-y-auto bg-white"
          data-scroll-container
          data-scroll-direction="vertical"
        >
          {/* 子频道宫格 */}
          {active && (
            <div className="grid grid-cols-3 gap-2 p-3">
              {active.subs.map((sub) => (
                <button
                  key={sub.name}
                  {...bindTap('category.sub-open', { params: { q: sub.name } })}
                  className="flex flex-col items-center gap-1"
                >
                  <span className="w-14 h-14 rounded-lg bg-[#F5F5F5] flex items-center justify-center overflow-hidden">
                    <Img src={sub.icon} className="w-10 h-10 object-cover" alt={sub.name} />
                  </span>
                  <span className="text-[12px] text-[#666] text-center leading-tight">{sub.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* 该类目商品 */}
          <div className="px-3 pb-3">
            <div className="text-[13px] text-[#999] py-2">— 精选好货 —</div>
            <div className="grid grid-cols-2 gap-2">
              {catItems.map((it) => it && (
                <div
                  key={it.id}
                  {...bindTap('category.item-open', { params: { itemId: it.id } })}
                  className="bg-white rounded-lg overflow-hidden border border-[#F2F2F2]"
                >
                  <div className="w-full aspect-square bg-[#F5F5F5]">
                    <Img src={it.image} className="w-full h-full object-cover" alt={it.title} />
                  </div>
                  <div className="p-1.5">
                    <div className="text-[13px] leading-[17px] text-[#333] line-clamp-2">{it.title}</div>
                    <PriceYuan value={it.pinPrice} className="text-[#E22E1F] text-[16px] mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
