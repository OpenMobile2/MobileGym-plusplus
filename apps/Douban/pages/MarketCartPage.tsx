import React, { useMemo } from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, EmptyState, Img } from '../components/ui';
import { ProductGridCard, fmtPrice } from './marketShared';

/** 绿色圆角方形勾选(购物车用):选中绿底白勾,未选灰描边方框 */
function CheckSquare({ checked, size = 20 }: { checked: boolean; size?: number }) {
  return (
    <span
      className="flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: 5,
        background: checked ? C.green : 'transparent',
        border: checked ? 'none' : '1.5px solid #C9CDD3',
      }}
    >
      {checked && (
        <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 12 12" fill="none">
          <path d="M2.4 6.2 5 8.8 9.7 3.4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

const C_UNITS = ['件', '枚', '只', '套'];
const cartUnitOf = (id: string) =>
  C_UNITS[[...id].reduce((s, ch) => s + ch.charCodeAt(0), 0) % C_UNITS.length];

// 节点: market.cart —— 购物车。
// 空态(市集热卖推荐)/ 有货态(勾选、数量步进→合计实时、全选、结算→orderConfirm)。

export default function MarketCartPage() {
  const { bindBack, bindTap } = useDoubanGestures();
  const products = useDoubanStore((s) => s.products);
  const cart = useDoubanStore((s) => s.cart);
  const setCartItemCount = useDoubanStore((s) => s.setCartItemCount);
  const toggleCartItemChecked = useDoubanStore((s) => s.toggleCartItemChecked);

  const rows = useMemo(
    () =>
      cart
        .map((c) => ({ item: c, product: products.find((p) => p.id === c.productId) }))
        .filter((r): r is { item: typeof cart[number]; product: NonNullable<typeof r.product> } => !!r.product),
    [cart, products],
  );

  const allChecked = rows.length > 0 && rows.every((r) => r.item.checked);
  const total = useMemo(
    () => rows.filter((r) => r.item.checked).reduce((sum, r) => sum + r.product.price * r.item.count, 0),
    [rows],
  );
  const checkedCount = rows.filter((r) => r.item.checked).reduce((n, r) => n + r.item.count, 0);

  // 热卖推荐(空态用)
  const hotItems = useMemo(() => products.slice(0, 4), [products]);

  const toggleAll = () => {
    const target = !allChecked;
    for (const r of rows) {
      if (r.item.checked !== target) toggleCartItemChecked(r.item.id);
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <div className="flex items-center h-11 px-1 shrink-0 border-b" style={{ background: C.surface, borderColor: C.border }}>
        <button {...bindBack()} className="w-12 text-left text-2xl bg-transparent border-none cursor-pointer" style={{ color: C.green }}>
          ‹
        </button>
        <div className="flex-1 text-center font-semibold text-base truncate" style={{ color: C.text }}>购物车</div>
        <div className="w-12" />
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {rows.length === 0 ? (
          <>
            <EmptyState text="购物车空空如也" icon="box" />
            <div className="flex items-center justify-between px-4 pt-2 pb-2">
              <div className="text-base font-bold" style={{ color: C.text }}>市集热卖</div>
            </div>
            <div className="px-3 pb-6 grid grid-cols-2 gap-2.5">
              {hotItems.map((p) => (
                <ProductGridCard
                  key={p.id}
                  product={p}
                  perUnit={cartUnitOf(p.id)}
                  tapProps={bindTap('market.cart.hotItem-open', { params: { productId: p.id } })}
                  cartProps={bindTap('market.cart.hotItem-open', { params: { productId: p.id } })}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="p-3 space-y-2.5">
            {rows.map((r) => (
              <div key={r.item.id} className="flex items-center gap-2.5 bg-white rounded-xl p-3">
                <button
                  {...bindTap({ kind: 'action', id: 'market.cart.item.toggle' }, { onTrigger: () => toggleCartItemChecked(r.item.id) })}
                  className="bg-transparent border-none p-0 cursor-pointer shrink-0"
                >
                  <CheckSquare checked={r.item.checked} />
                </button>
                <div
                  {...bindTap('market.cart.product-open', { params: { productId: r.product.id } })}
                  className="shrink-0 cursor-pointer"
                >
                  <Img src={r.product.cover} className="w-16 h-16 rounded-lg object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    {...bindTap('market.cart.product-open', { params: { productId: r.product.id } })}
                    className="text-[13px] line-clamp-2 cursor-pointer"
                    style={{ color: C.text }}
                  >
                    {r.product.title}
                  </div>
                  {/* SKU 灰 chip 带 ˅ */}
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[11px]" style={{ background: '#F2F3F5', color: C.sub }}>
                    {r.item.sku}
                    <span className="text-[9px]">˅</span>
                  </span>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[15px] font-bold" style={{ color: C.danger }}>
                      <span className="text-[11px]">¥</span>{fmtPrice(r.product.price)}
                    </span>
                    {/* 方形灰底步进器 */}
                    <div className="flex items-center" style={{ background: '#F5F6F7', borderRadius: 6, overflow: 'hidden' }}>
                      <button
                        {...bindTap(
                          { kind: 'action', id: 'market.cart.qty.step' },
                          { params: { target: 'minus' }, onTrigger: () => setCartItemCount(r.item.id, r.item.count - 1) },
                        )}
                        className="w-7 h-7 flex items-center justify-center text-base cursor-pointer bg-transparent border-none"
                        style={{ color: r.item.count <= 1 ? '#C9CDD3' : C.text }}
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-[13px]" style={{ color: C.text, background: '#fff' }}>{r.item.count}</span>
                      <button
                        {...bindTap(
                          { kind: 'action', id: 'market.cart.qty.step' },
                          { params: { target: 'plus' }, onTrigger: () => setCartItemCount(r.item.id, r.item.count + 1) },
                        )}
                        className="w-7 h-7 flex items-center justify-center text-base cursor-pointer bg-transparent border-none"
                        style={{ color: C.text }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部结算条(仅有货态) */}
      {rows.length > 0 && (
        <div className="flex items-center h-14 px-3 shrink-0 border-t bg-white" style={{ borderColor: C.border }}>
          <button
            {...bindTap({ kind: 'action', id: 'market.cart.selectAll.toggle' }, { onTrigger: toggleAll })}
            className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer"
            style={{ color: C.text, fontSize: 13 }}
          >
            <CheckSquare checked={allChecked} />
            {allChecked ? '取消' : '全选'}
          </button>
          <div className="ml-auto mr-3 text-right leading-tight">
            <span className="text-lg font-bold" style={{ color: C.danger }}>¥{fmtPrice(total)}</span>
            <div className="text-[10px]" style={{ color: C.sub }}>不含运费</div>
          </div>
          <button
            {...bindTap('market.cart.orderConfirm-open')}
            disabled={checkedCount === 0}
            className="h-9 px-5 rounded-full text-white text-sm font-semibold border-none cursor-pointer"
            style={{ background: checkedCount === 0 ? '#C9CDD3' : C.danger }}
          >
            结算({checkedCount})
          </button>
        </div>
      )}
    </div>
  );
}
