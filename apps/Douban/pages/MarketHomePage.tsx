import React, { useMemo } from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C } from '../components/ui';
import { CartSvg, ProductGridCard } from './marketShared';

// 节点: market.home —— 市集首页(瀑布流商品 + 豆友都在买 + 悬浮购物车)。
// evidence: 市集首页(搜索栏/banner/耳机信封图标 wontfix,商品卡跳详情/角标加购)。

export default function MarketHomePage() {
  const { bindTap } = useDoubanGestures();
  const toast = useDoubanStore((s) => s.toast);
  const products = useDoubanStore((s) => s.products);
  const cart = useDoubanStore((s) => s.cart);

  const cartCount = useMemo(() => cart.reduce((n, c) => n + c.count, 0), [cart]);

  // 豆友都在买 = 前 4 个热卖
  const hotItems = useMemo(() => products.slice(0, 4), [products]);

  // 单位随商品变化(枚/只/套/件),由 id 稳定派生 —— mod7 审计:真机「¥28/枚」「限时¥59/只」。
  const UNITS = ['件', '枚', '只', '套'];
  const unitOf = (id: string) =>
    UNITS[[...id].reduce((s, ch) => s + ch.charCodeAt(0), 0) % UNITS.length];

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      {/* 顶栏:耳机 / 搜索框 / 信封 */}
      <div className="flex items-center gap-2 h-12 px-3 shrink-0" style={{ background: C.surface }}>
        <button
          {...bindTap({ kind: 'action', id: 'market.home.topIcons.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
          className="bg-transparent border-none p-0 cursor-pointer shrink-0"
          style={{ color: C.sub }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 13a8 8 0 0116 0" strokeLinecap="round" />
            <rect x="3" y="13" width="4" height="7" rx="1.5" />
            <rect x="17" y="13" width="4" height="7" rx="1.5" />
          </svg>
        </button>
        <button
          {...bindTap('market.home.search-open')}
          className="flex-1 flex items-center gap-2 h-8 px-3 rounded-full border-none cursor-pointer text-left"
          style={{ background: '#F2F3F5', color: C.sub, fontSize: 13 }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4-4" strokeLinecap="round" />
          </svg>
          豆瓣文创帆布包 上新
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'market.home.topIcons.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
          className="bg-transparent border-none p-0 cursor-pointer shrink-0"
          style={{ color: C.sub }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 7l9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* banner */}
        <button
          {...bindTap({ kind: 'action', id: 'market.home.banner.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
          className="block w-full text-left border-none p-0 cursor-pointer bg-transparent"
        >
          <div
            className="mx-3 mt-3 rounded-xl h-28 flex items-center px-5 overflow-hidden"
            style={{ background: 'linear-gradient(135deg,#00B51D,#04A85E)' }}
          >
            <div className="text-white">
              <div className="text-lg font-bold">豆瓣豆品·夏日市集</div>
              <div className="text-xs mt-1 opacity-90">精神角落里的好物,限时立减</div>
            </div>
          </div>
        </button>

        {/* 瀑布流商品(双列) + 右下领券浮动贴纸 */}
        <div className="relative">
          <div className="px-3 pt-3 grid grid-cols-2 gap-2.5">
            {products.map((p) => (
              <ProductGridCard
                key={p.id}
                product={p}
                perUnit={unitOf(p.id)}
                tapProps={bindTap('market.home.product-open', { params: { productId: p.id } })}
                cartProps={bindTap('market.home.quickAdd-open', { params: { productId: p.id } })}
              />
            ))}
          </div>
          {/* 领券浮动贴纸 */}
          <button
            {...bindTap({ kind: 'action', id: 'market.home.banner.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
            className="absolute right-3 bottom-2 z-10 flex flex-col items-center justify-center rounded-full text-white border-none cursor-pointer"
            style={{ width: 52, height: 52, background: 'radial-gradient(circle,#FF6A3D,#E5484D)', boxShadow: '0 2px 8px rgba(229,72,77,0.4)' }}
          >
            <span className="text-[13px] font-bold leading-none">领券</span>
            <span className="text-[9px] leading-none mt-0.5">立减</span>
          </button>
        </div>

        {/* 豆友都在买 */}
        <div className="flex items-center justify-between px-4 pt-5 pb-2">
          <div className="text-base font-bold" style={{ color: C.text }}>豆友都在买</div>
          <button
            {...bindTap('market.home.category-open')}
            className="text-xs bg-transparent border-none cursor-pointer"
            style={{ color: C.sub }}
          >
            全部 ›
          </button>
        </div>
        <div className="px-3 pb-6 grid grid-cols-2 gap-2.5">
          {hotItems.map((p) => (
            <ProductGridCard
              key={`hot-${p.id}`}
              product={p}
              perUnit={unitOf(p.id)}
              tapProps={bindTap('market.home.hotItem-open', { params: { productId: p.id } })}
            />
          ))}
        </div>
      </div>

      {/* 右下角悬浮购物车 */}
      <button
        {...bindTap('market.home.cart-open')}
        className="absolute right-4 bottom-6 z-10 w-12 h-12 rounded-full flex items-center justify-center border-none cursor-pointer"
        style={{ background: C.surface, boxShadow: '0 2px 12px rgba(0,0,0,0.18)' }}
      >
        <CartSvg size={22} color={C.text} />
        {cartCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full text-[10px] text-white flex items-center justify-center"
            style={{ background: C.danger }}
          >
            {cartCount}
          </span>
        )}
      </button>
    </div>
  );
}
