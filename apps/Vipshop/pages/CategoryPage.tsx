import React, { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { TopBar, VIP } from '../components/ui';
import { ItemGrid } from '../components/ItemCard';
import { subsOf, catLabel } from '../constants';

export default function CategoryPage() {
  const { id = '' } = useParams();
  const { bindTap } = useVipshopGestures();
  const [searchParams, setSearchParams] = useSearchParams();
  const sub = searchParams.get('sub') || '全部';
  const subs = subsOf(id);

  const items = useVipshopStore((s) => s.items);
  const shown = useMemo(
    () => items.filter((it) => it.category === id && (sub === '全部' || it.subCategory === sub)),
    [items, id, sub],
  );
  const selectSub = (v: string) => setSearchParams((p) => { p.set('sub', v); return p; }, { replace: true });

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]">
      <TopBar title={catLabel(id)} />
      {/* 二级智能分类 */}
      <div className="shrink-0 bg-white flex overflow-x-auto no-scrollbar px-2 border-b border-[#F5F5F5]"
        data-scroll-container="category-subs" data-scroll-direction="horizontal">
        {subs.map((sc) => {
          const on = sc === sub;
          return (
            <button
              key={sc}
              {...bindTap({ kind: 'action', id: 'category.subcat.select.target' }, { params: { target: sc }, onTrigger: () => selectSub(sc) })}
              className={`shrink-0 px-3 py-2 text-[13px] bg-transparent border-none cursor-pointer ${on ? 'font-semibold' : 'text-[#666666]'}`}
              style={on ? { color: VIP.primary } : undefined}
            >
              {sc}
              {on && <span className="block h-0.5 w-5 mx-auto mt-0.5 rounded-full" style={{ background: VIP.primary }} />}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto pt-2" data-scroll-container="category-feed" data-scroll-direction="vertical">
        <ItemGrid items={shown} bindingOf={(it) => bindTap('category.item-open', { params: { id: it.id } })} />
        {shown.length === 0 && <div className="text-center text-[13px] text-[#888888] py-16">该分类下暂无商品</div>}
        <div className="h-3" />
      </div>
    </div>
  );
}
