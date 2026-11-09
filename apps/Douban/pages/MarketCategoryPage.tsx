import React, { useMemo, useState } from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C } from '../components/ui';
import { ProductGridCard } from './marketShared';

// 节点: market.category —— 豆瓣豆品分类页(顶部横向分类tab + 全宽商品栅格)。
// evidence: IMG_0315 —— 顶部横滑分类标签(激活项下方黑色下划线)之上全宽两列商品栅格;分类tab切换,商品卡跳详情。

export default function MarketCategoryPage() {
  const { bindBack, bindTap } = useDoubanGestures();
  const products = useDoubanStore((s) => s.products);

  const categories = useMemo(() => {
    const seen: string[] = [];
    for (const p of products) {
      const c = p.category ?? '其他';
      if (!seen.includes(c)) seen.push(c);
    }
    return ['全部', ...seen];
  }, [products]);

  const [active, setActive] = useState('全部');

  const shown = useMemo(
    () => (active === '全部' ? products : products.filter((p) => (p.category ?? '其他') === active)),
    [products, active],
  );

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <div className="flex items-center h-11 px-1 shrink-0 border-b" style={{ background: C.surface, borderColor: C.border }}>
        <button {...bindBack()} className="w-12 text-left text-2xl bg-transparent border-none cursor-pointer" style={{ color: C.green }}>
          ‹
        </button>
        <div className="flex-1 text-center font-semibold text-base truncate" style={{ color: C.text }}>豆瓣豆品分类</div>
        <div className="w-12" />
      </div>

      {/* 顶部横向分类 tab(激活项下方黑色下划线) */}
      <div
        className="shrink-0 overflow-x-auto border-b"
        style={{ background: C.surface, borderColor: C.border }}
      >
        <div className="flex items-stretch h-11 px-2 w-max">
          {categories.map((cat) => {
            const on = cat === active;
            return (
              <button
                key={cat}
                {...bindTap(
                  { kind: 'action', id: 'market.category.tab.select.target' },
                  { params: { target: cat }, onTrigger: () => setActive(cat) },
                )}
                className="relative shrink-0 px-3 text-[15px] border-none bg-transparent cursor-pointer flex items-center justify-center"
                style={{
                  color: on ? C.text : C.sub,
                  fontWeight: on ? 600 : 400,
                }}
              >
                {cat}
                {on && <span className="absolute left-1/2 -translate-x-1/2 bottom-0 h-0.5 w-5 rounded" style={{ background: C.text }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 全宽商品栅格 */}
      <div className="flex-1 overflow-y-auto p-2.5" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="grid grid-cols-2 gap-2.5">
          {shown.map((p) => (
            <ProductGridCard
              key={p.id}
              product={p}
              tapProps={bindTap('market.category.product-open', { params: { productId: p.id } })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
