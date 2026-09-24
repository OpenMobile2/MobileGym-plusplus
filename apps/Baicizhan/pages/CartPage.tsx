import React from 'react';
import { useBaicizhanStore, cartCount } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { PageHeader, ProductImage } from '../components/common';

export default function CartPage() {
  const s = useStrings();
  const { bindTap, action } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const cc = cartCount(st);
  const items = st.cart.map((c) => ({ ...c, product: st.products.find((p) => p.id === c.productId)! })).filter((c) => c.product);
  const total = items.filter((c) => c.checked).reduce((n, c) => n + c.product.price * c.qty, 0);
  const allChecked = items.length > 0 && items.every((c) => c.checked);
  const guess = st.products.slice(0, 4);

  return (
    <div className="flex h-full flex-col bg-app-bg text-app-text">
      <PageHeader title={`${s.mallCart}${cc > 0 ? ` (${cc})` : ''}`} close />
      <div className="min-h-0 flex-1 overflow-y-auto pb-16" data-scroll-container="main" data-scroll-direction="vertical">
        {items.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <div className="text-5xl opacity-40">🛍️</div>
            <div className="mt-3 text-sm text-[#9AA5B1]">{s.cartEmpty}</div>
            <button {...bindTap('mall.cart.browse', { nav: { mode: 'replace', popTo: '/mall' } })} className="mt-4 rounded-full bg-[#FF5320] px-8 py-2.5 text-sm text-white">{s.goBrowse}</button>
          </div>
        ) : (
          items.map((c) => (
            <div key={c.productId} className="mt-2 flex items-center gap-3 bg-app-surface p-3">
              <button {...action('mall.cart.check', () => st.setCartChecked(c.productId, !c.checked), { params: { productId: c.productId } })}
                className="flex h-5 w-5 items-center justify-center rounded-full border" style={{ background: c.checked ? '#FF5320' : '#fff', borderColor: c.checked ? '#FF5320' : '#D0D0D0', color: '#fff' }}>{c.checked ? '✓' : ''}</button>
              <ProductImage id={c.productId} label={c.product.title} className="h-16 w-16" />
              <div className="min-w-0 flex-1">
                <div className="line-clamp-2 text-xs text-[#33405C]">{c.product.title}</div>
                <button {...action('mall.cart.spec', () => st.showToast('切换规格'), { params: { productId: c.productId } })} className="mt-1 rounded bg-[#F2F3F5] px-2 py-0.5 text-[10px] text-[#9AA5B1]">{c.spec} ▾</button>
                <div className="mt-1 flex items-center"><span className="text-sm font-bold text-[#F12F2F]">¥{c.product.price}</span>
                  <div className="ml-auto flex items-center gap-2">
                    <button {...action('mall.cart.qty', () => st.setCartQty(c.productId, -1), { params: { productId: c.productId } })} className="flex h-6 w-6 items-center justify-center rounded bg-[#F2F3F5]">−</button>
                    <span className="text-sm">{c.qty}</span>
                    <button {...action('mall.cart.qty', () => st.setCartQty(c.productId, 1), { params: { productId: c.productId } })} className="flex h-6 w-6 items-center justify-center rounded bg-[#F2F3F5]">＋</button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div className="mt-3 px-4 text-sm font-semibold text-[#33405C]">{s.guessLike}</div>
        <div className="grid grid-cols-2 gap-3 p-4">
          {guess.map((p) => (
            <button key={p.id} {...bindTap('mall.cart.detail.open', { params: { productId: p.id } })} className="overflow-hidden rounded-2xl bg-app-surface text-left">
              <ProductImage id={p.id} label={p.title} className="h-24 w-full" rounded={0} /><div className="p-2"><div className="line-clamp-1 text-xs text-[#33405C]">{p.title}</div><div className="text-sm font-bold text-[#F12F2F]">¥{p.price}</div></div>
            </button>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 bg-app-surface px-4 py-2">
        <button {...action('mall.cart.checkall', () => st.setCartAllChecked(!allChecked))} className="flex items-center gap-1 text-sm text-[#5B6B85]">
          <span className="flex h-5 w-5 items-center justify-center rounded-full border text-white" style={{ background: allChecked ? '#FF5320' : '#fff', borderColor: allChecked ? '#FF5320' : '#D0D0D0' }}>{allChecked ? '✓' : ''}</span>{s.selectAll}
        </button>
        <div className="ml-auto text-sm">{s.total}: <span className="font-bold text-[#F12F2F]">¥{total}</span></div>
        <button {...bindTap('mall.checkout')} className="rounded-full px-6 py-2.5 text-sm font-semibold text-white" style={{ background: colors.mallBuy }}>{s.checkout}({items.filter((c) => c.checked).length})</button>
      </div>
    </div>
  );
}
