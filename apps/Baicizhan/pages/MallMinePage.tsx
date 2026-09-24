import React, { useState } from 'react';
import { useBaicizhanStore, cartCount } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { PageHeader, ProductImage } from '../components/common';
import { IcHeadset, IcCart } from '../res/icons';

// 模拟版订单统一为『待发货』;点状态即按状态筛选下方列表
const ORDER_TABS: [string, string, string][] = [
  ['pay', '📄', '待付款'], ['ship', '📦', '待发货'], ['recv', '🚚', '待收货'], ['review', '💬', '待评价'], ['after', '↩', '售后'],
];

export default function MallMinePage() {
  const s = useStrings();
  const { bindTap, action } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const toast = () => st.showToast(s.notAvailable);
  const guess = st.products.slice(4, 8);
  const [filter, setFilter] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const favorites = st.products.filter((product) => st.favoriteProductIds.includes(product.id));
  // 已下单统一算『待发货』
  const shownOrders = !filter || filter === 'ship' ? st.orders : [];
  return (
    <div className="flex h-full flex-col bg-[#F5F6F8]" data-status-bar-foreground="dark">
      <PageHeader title="我的" right={<button {...action('mall.mine.service.wontfixToast', toast)}><IcHeadset size={20} color="#33405C" /></button>} />
      <div className="min-h-0 flex-1 overflow-y-auto pb-6" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="flex items-center gap-3 bg-white px-4 py-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F0F4FA] text-xl">🐶</div>
          <div className="text-lg font-bold text-[#212121]">{st.profile.name}</div>
        </div>
        <div className="flex items-center justify-around bg-white pb-3">
          <button {...action('mall.mine.favorite.toggle', () => setShowFavorites((value) => !value))} className="flex items-center gap-1 text-sm" style={{ color: showFavorites ? colors.mallBuy : '#33405C' }}>♡ 收藏 {favorites.length || ''}</button>
          <button {...bindTap('mall.mine.unavailable.open', { params: { feature: '商城优惠券' } })} className="flex items-center gap-1 text-sm text-[#33405C]">🎫 优惠券</button>
          <button {...bindTap('mall.mine.cart.open')} className="flex items-center gap-1 text-sm text-[#33405C]"><IcCart size={16} color="#33405C" /> 购物车 {cartCount(st) || ''}</button>
        </div>

        {showFavorites && (
          <div className="mt-2 bg-white p-4">
            <div className="text-sm font-semibold text-[#33405C]">我的收藏</div>
            {favorites.length ? <div className="mt-3 grid grid-cols-2 gap-3">{favorites.map((product) => (
              <button key={product.id} {...bindTap('mall.mine.product.open', { params: { productId: product.id } })} className="text-left">
                <ProductImage id={product.id} label={product.title} className="h-24 w-full" />
                <div className="mt-1 line-clamp-1 text-xs text-[#33405C]">{product.title}</div>
              </button>
            ))}</div> : <div className="py-8 text-center text-sm text-[#9AA5B1]">还没有收藏商品</div>}
          </div>
        )}

        <div className="mt-2 bg-white p-4">
          <div className="flex items-center"><span className="text-sm font-semibold text-[#33405C]">我的订单</span>
            <button {...action('mall.mine.order.filter', () => setFilter(null), { params: { status: 'all' } })} className="ml-auto text-xs text-[#9AA5B1]">全部订单 ›</button></div>
          <div className="mt-3 flex justify-around">
            {ORDER_TABS.map(([key, ic, t]) => {
              const on = filter === key;
              const cnt = key === 'ship' ? st.orders.length : 0;
              return (
                <button key={key} {...action('mall.mine.order.filter', () => setFilter(on ? null : key), { params: { status: key } })}
                  className="relative flex flex-col items-center gap-1 text-[10px]" style={{ color: on ? colors.mallBuy : '#5B6B85' }}>
                  <span className="text-xl">{ic}</span>{t}
                  {cnt > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-[#FF5320] px-1 text-[8px] text-white">{cnt}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* 已下单列表(付款后从购物车转入),按状态筛选 */}
        {shownOrders.length > 0 ? (
          <div className="mt-2 bg-white p-4">
            <div className="text-sm font-semibold text-[#33405C]">{filter === 'ship' ? '待发货订单' : '最近下单'}</div>
            {shownOrders.map((o) => (
              <div key={o.id} className="mt-3 border-t border-[#F4F4F4] pt-3">
                <div className="mb-1 text-xs text-[#E8912D]">待发货</div>
                {o.items.map((it) => {
                  const p = st.products.find((x) => x.id === it.productId);
                  return p ? (
                    <div key={it.productId} className="flex items-center gap-3 py-1">
                      <ProductImage id={it.productId} label={p.title} className="h-12 w-12" />
                      <div className="min-w-0 flex-1 text-xs text-[#33405C] line-clamp-1">{p.title}</div>
                      <div className="text-xs text-[#9AA5B1]">×{it.qty}</div>
                    </div>
                  ) : null;
                })}
                <div className="mt-1 text-right text-xs text-[#33405C]">实付 <b className="text-[#F12F2F]">¥{o.total.toFixed(2)}</b></div>
              </div>
            ))}
          </div>
        ) : filter ? (
          <div className="mt-2 bg-white py-10 text-center text-sm text-[#9AA5B1]">暂无{ORDER_TABS.find((t) => t[0] === filter)?.[2]}订单</div>
        ) : null}

        <div className="mt-2 px-4 text-sm font-semibold text-[#33405C]">猜你喜欢</div>
        <div className="grid grid-cols-2 gap-3 p-4">
          {guess.map((p) => (
            <button key={p.id} {...bindTap('mall.mine.product.open', { params: { productId: p.id } })} className="overflow-hidden rounded-2xl bg-white text-left">
              <ProductImage id={p.id} label={p.title} className="h-28 w-full" rounded={0} /><div className="p-2"><div className="line-clamp-1 text-xs text-[#33405C]">{p.title}</div><div className="text-sm font-bold text-[#F12F2F]">¥{p.price}</div></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
