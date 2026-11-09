import React, { useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useJingdongGestures } from '../hooks/useJingdongGestures';
import { useJingdongStore } from '../state';
import { Img, PriceYuan, showToast } from '../components/ui';
import { IcNavBack, IcSearch, IcMapPin, IcChevronDown, IcStar, IcPlus, IcMinus, IcClose, IcCheck, IcTabCart, IcChevronRight } from '../res/icons';

const SHOP_TABS = [
  { key: 'home', label: '首页' },
  { key: 'all', label: '全部商品' },
  { key: 'reviews', label: '点评' },
];
const SORTS = ['综合', '销量', '价格'];

export function SuperShopPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const { bindTap, bindBack, back } = useJingdongGestures();
  const [sp, setSp] = useSearchParams();
  const lifeShops = useJingdongStore((s) => s.lifeShops);
  const cart = useJingdongStore((s) => s.cart);
  const addToCart = useJingdongStore((s) => s.addToCart);
  const setCartQty = useJingdongStore((s) => s.setCartQty);
  const removeCartLine = useJingdongStore((s) => s.removeCartLine);

  const shop = lifeShops.find((s) => s.id === shopId) || lifeShops.find((s) => s.kind === 'super') || lifeShops[0];
  const [tab, setTab] = useState('all');
  const [cat, setCat] = useState(shop?.cats[0] ?? '');
  const [sort, setSort] = useState('综合');
  const [shopQ, setShopQ] = useState('');
  const [skuQty, setSkuQty] = useState(1);
  const [skuOpts, setSkuOpts] = useState<Record<string, string>>({});
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  if (!shop) return null;

  const panel = sp.get('panel');
  const skuDish = shop.dishes.find((d) => d.id === sp.get('itemId')) ?? shop.dishes[0];
  const openCart = () => setSp((p) => { p.set('panel', 'cart'); return p; });

  // 按门店类目分组,右侧分栏渲染;店内搜索过滤菜品
  const q = shopQ.trim();
  const dishesByCat = shop.cats.map((c) => ({
    cat: c,
    dishes: shop.dishes.filter((d) => d.cat === c && (!q || d.name.includes(q) || d.cat.includes(q))),
  })).filter((g) => g.dishes.length > 0 || !q);
  const selectCat = (c: string) => { setCat(c); sectionRefs.current[c]?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

  // 门店购物车口径改为「全局 cart 里属于本店的秒送行」,离开页面再回来不会丢(不再用本地 useState)
  const shopCart = cart.filter((c) => c.channel === 'miaosong' && c.shopId === shop.id);
  const qtyOf = (dishId: string) => shopCart.filter((c) => c.itemId === dishId).reduce((a, c) => a + c.qty, 0);
  const totalCount = shopCart.reduce((a, c) => a + c.qty, 0);
  const totalPrice = shopCart.reduce((a, c) => a + c.qty * c.price, 0);

  const add = (dishId: string, dishSpec?: string) => {
    addToCart(dishId, 1, dishSpec ?? '默认', 'miaosong');
    showToast('已加入门店购物车');
  };
  const clearShopCart = () => { shopCart.forEach((c) => removeCartLine(c.key)); showToast('已清空购物车'); };

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="dark">
      {/* 头部搜索栏 */}
      <div className="shrink-0 pt-10 px-2 pb-2 bg-white flex items-center gap-1">
        <button {...bindBack()} aria-label="返回" className="w-8 h-8 flex items-center justify-center shrink-0">
          <IcNavBack size={22} className="text-[#333]" />
        </button>
        <div className="flex items-center text-[13px] text-[#333] shrink-0">
          <IcMapPin size={14} className="text-[#FF4E33]" />
          <span className="max-w-[54px] truncate">示范科技园</span>
        </div>
        <div className="flex-1 h-8 rounded-full bg-[#F2F2F2] flex items-center px-3">
          <IcSearch size={15} className="mr-1 text-[#999] shrink-0" />
          <input
            value={shopQ}
            onChange={(e) => setShopQ(e.target.value)}
            placeholder="搜索商品"
            className="flex-1 bg-transparent text-[13px] text-[#1A1A1A] placeholder:text-[#999] outline-none"
          />
        </div>
        <span className="text-[18px] text-[#666] px-1 shrink-0">···</span>
      </div>

      {/* 门店头 */}
      <div className="shrink-0 bg-white px-3 pb-2">
        <div className="flex gap-3">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#F5F5F5] shrink-0">
            <Img src={shop.logo} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-[17px] font-bold text-[#1A1A1A] truncate">{shop.name}</span>
            </div>
            <div className="flex gap-1 mt-1">
              <span className="text-[10px] text-[#FF4E33] border border-[#FF4E33]/40 rounded px-1">秒送</span>
              <span className="text-[10px] text-[#FF4E33] border border-[#FF4E33]/40 rounded px-1">品牌</span>
            </div>
          </div>
        </div>
        <div className="flex items-stretch mt-2.5 text-center">
          <div className="flex-1">
            <div className="text-[11px] text-[#999]">评分</div>
            <div className="text-[14px] font-bold text-[#FF8C00] flex items-center justify-center"><IcStar size={13} className="fill-current" />{shop.rating}</div>
          </div>
          <div className="flex-1 border-l border-[#F0F0F0]">
            <div className="text-[11px] text-[#999]">已售</div>
            <div className="text-[14px] font-bold text-[#333]">{shop.sold.replace('已售', '')}</div>
          </div>
          <div className="flex-1 border-l border-[#F0F0F0]">
            <div className="text-[11px] text-[#999]">商家自送</div>
            <div className="text-[14px] font-bold text-[#333]">{shop.eta}</div>
          </div>
          <div className="flex-1 border-l border-[#F0F0F0]">
            <div className="text-[11px] text-[#999]">康健/烹饪调料</div>
            <div className="text-[13px] font-bold text-[#333] flex items-center justify-center">排行榜第1名<IcChevronRight size={12} /></div>
          </div>
        </div>
        {/* 优惠券行 */}
        <div className="flex gap-2 mt-2">
          {[['首购 ¥3', '首购礼券'], ['¥3', '满79可用'], ['¥3', '满79可用']].map(([a, b], i) => (
            <div key={i} className="flex-1 flex items-center justify-center gap-1 bg-[#FFF1EE] text-[#FF2D2D] text-[11px] rounded py-1">
              <span className="font-bold">{a}</span><span className="text-[#FF8C6A]">{b}</span>
            </div>
          ))}
          <span className="text-[11px] text-[#999] flex items-center">更多<IcChevronRight size={12} /></span>
        </div>
      </div>

      {/* 门店 tab */}
      <div className="shrink-0 bg-white flex px-3 border-b border-[#F0F0F0]">
        {SHOP_TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              {...bindTap({ kind: 'action', id: 'supershop.tab.select.section' }, { params: { section: t.key }, onTrigger: () => setTab(t.key) })}
              className={`relative py-2.5 mr-6 text-[15px] ${active ? 'text-[#1A1A1A] font-bold' : 'text-[#999]'}`}
            >
              {t.label}
              {active && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full bg-[#FF4E33]" />}
            </button>
          );
        })}
      </div>

      {/* 左类目 + 右商品 */}
      <div className="flex-1 flex min-h-0">
        {/* 左侧类目栏 */}
        <div className="w-[86px] shrink-0 bg-[#F5F5F5] overflow-y-auto no-scrollbar">
          {shop.cats.map((c) => {
            const active = cat === c;
            return (
              <button
                key={c}
                {...bindTap({ kind: 'action', id: 'supershop.cat.select.group' }, { params: { group: c }, onTrigger: () => selectCat(c) })}
                className={`w-full py-3 px-1 text-[12px] leading-tight ${active ? 'bg-white text-[#FF4E33] font-semibold' : 'text-[#555]'}`}
              >
                {active && <span className="inline-block w-[3px] h-3 bg-[#FF4E33] rounded-full mr-1 align-middle" />}
                {c}
              </button>
            );
          })}
        </div>

        {/* 右侧商品列表 */}
        <div className="flex-1 bg-white overflow-y-auto" data-scroll-container="supershop-right" data-scroll-direction="vertical">
          {/* 排序 */}
          <div className="flex items-center gap-4 px-3 h-9 text-[13px] sticky top-0 bg-white border-b border-[#F5F5F5]">
            {SORTS.map((s) => (
              <button
                key={s}
                {...bindTap({ kind: 'action', id: 'supershop.sort.select.type' }, { params: { type: s }, onTrigger: () => setSort(s) })}
                className={sort === s ? 'text-[#FF4E33] font-semibold' : 'text-[#333]'}
              >
                {s}{s === '价格' && <IcChevronDown size={12} className="inline" />}
              </button>
            ))}
          </div>
          <div className="text-[11px] text-[#999] px-3 py-1.5">1件内享受促销价,超出部分可原价购买</div>
          {dishesByCat.map(({ cat: c, dishes }) => (
            <div key={c} ref={(el) => { sectionRefs.current[c] = el; }}>
              <div className="text-[13px] font-bold text-[#1A1A1A] px-3 pt-3 pb-1 bg-white">{c}</div>
              {dishes.map((d) => (
                <div key={d.id} className="flex gap-2.5 px-3 py-2.5 border-b border-[#F7F7F7]">
                  <div className="w-[86px] h-[86px] rounded-lg overflow-hidden bg-[#F5F5F5] shrink-0">
                    <Img src={d.image} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="text-[14px] text-[#1A1A1A] leading-snug line-clamp-2">
                      <span className="text-[9px] text-[#FF4E33] border border-[#FF4E33]/40 rounded px-0.5 mr-1 align-middle">秒送</span>
                      {d.name}
                    </div>
                    <div className="text-[11px] text-[#999] mt-0.5">{d.sold} 好评率100%</div>
                    <div className="flex items-end justify-between mt-auto">
                      <div className="flex items-baseline gap-1">
                        <PriceYuan value={d.price} className="text-[#FF2D2D] text-[17px]" />
                        {d.originPrice > d.price && <PriceYuan value={d.originPrice} strike className="text-[12px]" />}
                      </div>
                      <div className="flex items-center gap-2">
                        {qtyOf(d.id) > 0 && <span className="text-[14px] text-[#333] w-4 text-center">{qtyOf(d.id)}</span>}
                        <button
                          {...bindTap({ kind: 'action', id: 'supershop.item.configure' }, { params: { itemId: d.id }, onTrigger: () => { setSkuQty(1); setSkuOpts({}); setSp((p) => { p.set('panel', 'sku'); p.set('itemId', d.id); return p; }); } })}
                          aria-label="加购"
                          className="w-6 h-6 rounded-full bg-[#FF4E33] text-white flex items-center justify-center"
                        >
                          <IcPlus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
          <div className="h-16" />
        </div>
      </div>

      {/* 底部门店购物车 */}
      <div className="shrink-0 bg-white border-t border-[#F0F0F0] flex items-center px-3 py-2 gap-3" data-hide-on-keyboard>
        <button
          {...bindTap({ kind: 'action', id: 'supershop.cart.show' }, { onTrigger: openCart })}
          aria-label="门店购物车" className="relative"
        >
          <div className="w-11 h-11 rounded-full bg-[#FF4E33] flex items-center justify-center text-white">
            <IcTabCart size={24} />
          </div>
          {totalCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FFC300] text-[#333] text-[11px] font-bold flex items-center justify-center">{totalCount}</span>
          )}
        </button>
        <div className="flex-1">
          {totalCount > 0 ? (
            <PriceYuan value={totalPrice} className="text-[#1A1A1A] text-[19px]" />
          ) : (
            <span className="text-[13px] text-[#999]">购物车是空的</span>
          )}
        </div>
        <button
          {...(totalCount > 0
            ? bindTap('supershop.checkout-open', { params: { shopId: shop.id } })
            : { onClick: () => showToast('购物车是空的,先加点商品吧') })}
          className={`px-6 h-9 rounded-full text-[15px] font-semibold flex items-center ${totalCount > 0 ? 'bg-[#FF4E33] text-white' : 'bg-[#E5E5E5] text-[#999]'}`}
        >
          去结算
        </button>
      </div>

      {panel === 'sku' && skuDish && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <div {...bindBack()} className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-t-2xl max-h-[78%] p-4">
            <div className="flex gap-3"><Img src={skuDish.image} className="w-20 h-20 rounded-lg object-cover" /><div className="flex-1"><b className="text-[16px]">{skuDish.name}</b><PriceYuan value={skuDish.price} className="block mt-2 text-[#FF2D2D] text-[20px]" /></div><button {...bindBack()} aria-label="关闭"><IcClose size={22} /></button></div>
            {(skuDish.specs ?? []).map((spec) => <div key={spec.name} className="mt-4"><b className="text-[14px]">{spec.name}</b><div className="flex flex-wrap gap-2 mt-2">{spec.options.map((option) => <button key={option} {...bindTap({ kind: 'action', id: 'supershop.sku.select' }, { params: { spec: spec.name, option }, onTrigger: () => setSkuOpts((value) => ({ ...value, [spec.name]: option })) })} className={`px-3 py-1.5 rounded ${((skuOpts[spec.name] ?? spec.options[0]) === option) ? 'bg-[#FFF1EE] text-[#FF2D2D] border border-[#FF2D2D]' : 'bg-[#F5F5F5]'}`}>{option}</button>)}</div></div>)}
            <div className="flex items-center justify-between mt-4"><b>数量</b><div className="flex items-center gap-3"><button onClick={() => setSkuQty((q) => Math.max(1, q - 1))}><IcMinus size={18} /></button><span>{skuQty}</span><button onClick={() => setSkuQty((q) => q + 1)}><IcPlus size={18} /></button></div></div>
            <button {...bindTap({ kind: 'action', id: 'supershop.sku.confirm' }, { onTrigger: () => { const spec = (skuDish.specs ?? []).map((s) => skuOpts[s.name] ?? s.options[0]).join(',') || '默认'; for (let i = 0; i < skuQty; i += 1) add(skuDish.id, spec); back(); } })} className="mt-5 w-full h-11 rounded-full bg-[#FF4E33] text-white font-semibold">确认加入购物车</button>
          </div>
        </div>
      )}

      {/* 门店购物车弹层(URL 驱动 ?panel=cart,从下弹出,返回键/遮罩即关) */}
      {panel === 'cart' && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end" onClick={() => back()}>
          <div className="flex-1 bg-black/40" />
          <div className="relative bg-white rounded-t-2xl max-h-[70%] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#F5F5F5]">
              <div className="flex items-center gap-2 text-[15px]">
                <IcCheck size={20} className="text-[#FF4E33]" />
                <span className="font-semibold text-[#1A1A1A]">全选</span>
                <span className="text-[13px] text-[#666]">(打包费<span className="text-[#FF2D2D]">¥1</span>)</span>
              </div>
              <button
                {...bindTap({ kind: 'action', id: 'supershop.cart.clear' }, { onTrigger: clearShopCart })}
                className="text-[13px] text-[#999]"
              >清空购物车</button>
            </div>
            <div className="text-[12px] text-[#999] bg-[#F7F7F7] py-1.5 px-4">已勾选今日加购商品</div>
            <div className="flex-1 overflow-y-auto">
              {shopCart.length === 0 && <div className="text-center text-[#BBB] text-[13px] py-10">购物车是空的</div>}
              {shopCart.map((c) => (
                <div key={c.key} className="flex gap-2.5 px-4 py-3 border-b border-[#F7F7F7]">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#F5F5F5] shrink-0"><Img src={c.image} className="w-full h-full object-cover" /></div>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="text-[14px] text-[#1A1A1A] line-clamp-1">{c.title}</div>
                    <div className="text-[11px] text-[#999] mt-0.5">{c.skuDesc}</div>
                    <div className="flex items-center justify-between mt-auto">
                      <PriceYuan value={c.price} className="text-[#FF2D2D] text-[16px]" />
                      <div className="flex items-center gap-2">
                        <button
                          {...bindTap({ kind: 'action', id: 'supershop.cart.item.qtystep' }, { params: { key: c.key, dir: 'dec' }, onTrigger: () => (c.qty <= 1 ? removeCartLine(c.key) : setCartQty(c.key, -1)) })}
                          aria-label="减少" className="w-6 h-6 rounded-full border border-[#DDD] flex items-center justify-center"
                        ><IcMinus size={14} className="text-[#666]" /></button>
                        <span className="text-[14px] text-[#333] w-5 text-center">{c.qty}</span>
                        <button
                          {...bindTap({ kind: 'action', id: 'supershop.cart.item.qtystep' }, { params: { key: c.key, dir: 'inc' }, onTrigger: () => setCartQty(c.key, 1) })}
                          aria-label="增加" className="w-6 h-6 rounded-full bg-[#FF4E33] text-white flex items-center justify-center"
                        ><IcPlus size={14} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="shrink-0 flex items-center px-3 py-2 border-t border-[#F0F0F0] gap-3">
              <div className="flex-1"><PriceYuan value={totalPrice} className="text-[#1A1A1A] text-[19px]" /></div>
              <button
                {...(totalCount > 0
            ? bindTap('supershop.checkout-open', { params: { shopId: shop.id } })
            : { onClick: () => showToast('购物车是空的,先加点商品吧') })}
                className={`px-6 h-9 rounded-full text-[15px] font-semibold flex items-center ${totalCount > 0 ? 'bg-[#FF4E33] text-white' : 'bg-[#E5E5E5] text-[#999]'}`}
              >领券结算</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
