import React, { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useJingdongGestures } from '../hooks/useJingdongGestures';
import { useJingdongStore } from '../state';
import { Img, PriceYuan, showToast, wontfix } from '../components/ui';
import { IcNavBack, IcSearch, IcMapPin, IcStar, IcPlus, IcMinus, IcClose, IcTabCart, IcChevronRight, IcHeadphones, IcClock, IcCheck } from '../res/icons';

const TABS = [
  { key: 'waimai', label: '外卖' },
  { key: 'reviews', label: '点评' },
  { key: 'merchant', label: '商家' },
];
const DATES = ['今天(周一)', '明天(周二)', '后天(周三)', '7月9日(周四)', '7月10日(周五)'];
const SLOTS = ['立即送达', '15:00', '15:10', '15:20', '15:30', '15:40'];

export function RestaurantPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const [searchParams] = useSearchParams();
  const panel = searchParams.get('panel');
  const { bindTap, bindBack, back } = useJingdongGestures();
  const lifeShops = useJingdongStore((s) => s.lifeShops);
  const cart = useJingdongStore((s) => s.cart);
  const addToCart = useJingdongStore((s) => s.addToCart);
  const removeCartLine = useJingdongStore((s) => s.removeCartLine);

  const shop = lifeShops.find((s) => s.id === shopId) || lifeShops.find((s) => s.kind === 'restaurant') || lifeShops[0];

  const [mode, setMode] = useState<'delivery' | 'pickup'>('delivery');
  const [tab, setTab] = useState('waimai');
  const [cat, setCat] = useState(shop?.cats[0] ?? '');
  const [shopQ, setShopQ] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [qty, setQty] = useState<Record<string, number>>({});
  // sku 弹层
  const skuDish = shop?.dishes.find((d) => d.id === searchParams.get('itemId')) ?? shop?.dishes[0];
  const [skuOpts, setSkuOpts] = useState<Record<string, string>>({});
  const [skuQty, setSkuQty] = useState(1);
  // 送达时间弹层
  const [date, setDate] = useState(0);
  const [slot, setSlot] = useState('立即送达');

  if (!shop) return null;

  const bumpLocal = (id: string, delta: number) => setQty((q) => ({ ...q, [id]: Math.max(0, (q[id] ?? 0) + delta) }));
  const totalCount = Object.values(qty).reduce((a, b) => a + b, 0);
  const totalPrice = shop.dishes.reduce((t, d) => t + (qty[d.id] ?? 0) * d.price, 0);
  const cartDishes = shop.dishes.filter((d) => (qty[d.id] ?? 0) > 0);
  const q = shopQ.trim();
  // 有分类时按选中分类过滤;搜索时忽略分类
  const dishList = q ? shop.dishes.filter((d) => d.name.includes(q) || d.cat.includes(q)) : shop.dishes.filter((d) => !cat || d.cat === cat);

  const optOf = (name: string, options: string[]) => skuOpts[name] ?? options[0];

  return (
    <div className="relative flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="dark">
      {/* 头部 */}
      <div className="shrink-0 pt-10 px-2 pb-1.5 bg-white flex items-center gap-1">
        <button {...bindBack()} aria-label="返回" className="w-8 h-8 flex items-center justify-center shrink-0">
          <IcNavBack size={22} className="text-[#333]" />
        </button>
        <div className="flex items-center text-[15px] font-semibold text-[#1A1A1A]">
          <IcMapPin size={15} className="text-[#FF4E33]" />
          <span className="max-w-[130px] truncate">示范科技园A座</span>
        </div>
        <div className="flex-1" />
        <button
          {...bindTap({ kind: 'action', id: 'restaurant.search.toggle' }, { onTrigger: () => setSearchOpen((v) => !v) })}
          aria-label="搜索"
          className="w-8 h-8 flex items-center justify-center"
        >
          <IcSearch size={20} className="text-[#333]" />
        </button>
        <button {...bindTap('restaurant.cs-open', { params: { chatId: `ch_${shop.id}` } })} aria-label="客服" className="w-8 h-8 flex items-center justify-center">
          <IcHeadphones size={20} className="text-[#333]" />
        </button>
        <IcStar size={20} className="text-[#FFB400] fill-current" />
        <span className="text-[12px] text-[#666] border border-[#DDD] rounded px-1.5 py-0.5">预订</span>
        <button {...bindTap({ kind: 'action', id: 'restaurant.more.wontfix' }, { onTrigger: wontfix })} aria-label="更多" className="text-[18px] text-[#666] px-1">···</button>
      </div>

      {searchOpen && (
        <div className="shrink-0 px-3 py-2 bg-white border-b border-[#F0F0F0]">
          <input
            autoFocus
            value={shopQ}
            onChange={(e) => setShopQ(e.target.value)}
            placeholder="搜索店内菜品"
            className="w-full h-9 rounded-full bg-[#F5F5F5] px-4 text-[14px] outline-none"
          />
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-0">
        {/* 封面 + 门店头 */}
        <div className="shrink-0 bg-white">
          <div className="w-full h-32 bg-[#F5F5F5]">
            <Img src={shop.cover} className="w-full h-full object-cover" />
          </div>
          <div className="px-3 pt-2">
            <div className="flex gap-3">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#F5F5F5] shrink-0 -mt-6 border-2 border-white">
                <Img src={shop.logo} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[18px] font-bold text-[#1A1A1A] truncate">{shop.name}</div>
                <div className="flex gap-1 mt-1">
                  <span className="text-[10px] text-[#8A6D3B] bg-[#F3E9D6] rounded px-1">堂食餐厅</span>
                  <span className="text-[10px] text-[#8A6D3B] bg-[#F3E9D6] rounded px-1">外卖</span>
                  <span className="text-[10px] text-[#8A6D3B] bg-[#F3E9D6] rounded px-1">24小时</span>
                </div>
              </div>
            </div>
            <div className="flex items-stretch mt-2 text-center text-[#333]">
              <div className="flex-1"><div className="text-[11px] text-[#999]">评分</div><div className="text-[15px] font-bold text-[#FF8C00]">{shop.rating}</div></div>
              <div className="flex-1 border-l border-[#F0F0F0]"><div className="text-[11px] text-[#999]">已售</div><div className="text-[15px] font-bold">{shop.sold.replace('已售', '')}</div></div>
              <div className="flex-1 border-l border-[#F0F0F0]"><div className="text-[11px] text-[#999]">京东秒送</div><div className="text-[15px] font-bold">{shop.eta}</div></div>
              <div className="flex-1 border-l border-[#F0F0F0]"><div className="text-[11px] text-[#999]">饺子包子</div><div className="text-[13px] font-bold flex items-center justify-center">热销榜第1名<IcChevronRight size={12} /></div></div>
            </div>
            {/* 配送 / 自提 */}
            <div className="flex mt-2 rounded-lg overflow-hidden border border-[#FFE0B0]">
              <button
                {...bindTap({ kind: 'action', id: 'restaurant.mode.select.delivery' }, { params: { mode: 'delivery' }, onTrigger: () => setMode('delivery') })}
                className={`flex-1 py-2 text-[15px] font-bold ${mode === 'delivery' ? 'bg-[#FFEDD5] text-[#B8460F]' : 'bg-white text-[#666]'}`}
              >
                配送
              </button>
              <button
                {...bindTap({ kind: 'action', id: 'restaurant.mode.select.delivery' }, { params: { mode: 'pickup' }, onTrigger: () => setMode('pickup') })}
                className={`flex-1 py-2 text-[15px] ${mode === 'pickup' ? 'bg-[#FFEDD5] text-[#B8460F] font-bold' : 'bg-white text-[#666]'}`}
              >
                自提 <span className="text-[11px] text-[#999]">距您{shop.distance}</span>
              </button>
            </div>
            {/* 优惠券 */}
            <div className="flex gap-2 mt-2 pb-2">
              <div className="flex items-center gap-1 bg-[#FFF1EE] text-[#FF2D2D] text-[11px] rounded px-1.5 py-1">超补 <span className="font-bold">¥12</span> 满15可用 <span className="text-[#999]">已领取</span></div>
              <div className="flex items-center gap-1 bg-[#FFF1EE] text-[#FF2D2D] text-[11px] rounded px-1.5 py-1">超补 <span className="font-bold">¥12</span> 满15可用 <span className="text-[#FF2D2D]">领</span></div>
              <span className="text-[11px] text-[#999] flex items-center">更多<IcChevronRight size={12} /></span>
            </div>
          </div>
        </div>

        {/* 外卖 / 点评 / 商家 tab */}
        <div className="shrink-0 bg-white flex px-3 border-b border-[#F0F0F0]">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                {...bindTap({ kind: 'action', id: 'restaurant.tab.select.section' }, { params: { section: t.key }, onTrigger: () => setTab(t.key) })}
                className={`relative py-2.5 mr-6 text-[16px] ${active ? 'text-[#FF2D2D] font-bold' : 'text-[#333]'}`}
              >
                {t.label}{t.key === 'reviews' && <span className="text-[11px] text-[#999] font-normal ml-0.5">2000+</span>}
                {active && <span className="absolute bottom-1 left-0 w-6 h-[3px] rounded-full bg-[#FF2D2D]" />}
              </button>
            );
          })}
        </div>

        {/* 送达时间入口 */}
        <button
          {...bindTap('restaurant.deliverytime-open', { params: { shopId: shop.id } })}
          className="shrink-0 bg-[#FFF9F0] flex items-center gap-1 px-3 py-2 text-[12px] text-[#8A6D3B] border-b border-[#F5EAD5]"
        >
          <IcClock size={14} /> 预计{shop.eta} · {slot === '立即送达' ? '立即送达' : `${DATES[date].slice(0, 5)} ${slot}`}
          <span className="flex-1" />
          <span className="text-[#B8460F]">选择送达时间<IcChevronRight size={12} className="inline" /></span>
        </button>

        {/* 左菜品分类 + 右菜品列表 */}
        <div className="flex-1 flex min-h-0">
          <div className="w-[80px] shrink-0 bg-[#F5F5F5] overflow-y-auto no-scrollbar">
            {shop.cats.map((c) => {
              const active = cat === c;
              return (
                <div
                  key={c}
                  onClick={() => setCat(c)}
                  className={`py-3 px-2 text-[12px] leading-tight ${active ? 'bg-white text-[#FF2D2D] font-semibold' : 'text-[#555]'}`}
                >
                  {c}
                </div>
              );
            })}
          </div>

          <div className="flex-1 bg-white overflow-y-auto" data-scroll-container="restaurant-right" data-scroll-direction="vertical">
            <div className="flex items-center gap-2 px-3 py-2 text-[13px] text-[#999]">
              <span className="text-[#FF2D2D]">👍</span><span className="text-[#333] font-semibold">本店招牌</span>
            </div>
            {dishList.map((d) => {
              const n = qty[d.id] ?? 0;
              return (
                <div key={d.id} className="flex gap-2.5 px-3 py-2.5 border-b border-[#F7F7F7]">
                  <div className="w-[92px] h-[92px] rounded-lg overflow-hidden bg-[#F5F5F5] shrink-0 relative">
                    <Img src={d.image} className="w-full h-full object-cover" />
                    <span className="absolute left-0 bottom-0 bg-[#FF4E33] text-white text-[9px] px-1">超补免运费</span>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="text-[14px] text-[#1A1A1A] leading-snug line-clamp-2">
                      <span className="text-[9px] text-[#8A6D3B] bg-[#F3E9D6] rounded px-0.5 mr-1 align-middle">外卖</span>{d.name}
                    </div>
                    <div className="text-[11px] text-[#999] mt-0.5">{d.sold} 皮薄透馅</div>
                    <div className="flex items-end justify-between mt-auto">
                      <div className="flex items-baseline gap-1">
                        <PriceYuan value={d.price} className="text-[#FF2D2D] text-[17px]" />
                        {d.originPrice > d.price && <PriceYuan value={d.originPrice} strike className="text-[12px]" />}
                      </div>
                      <div className="flex items-center gap-2">
                        {n > 0 && <span className="text-[14px] w-4 text-center">{n}</span>}
                        <button
                          {...bindTap('restaurant.sku-open', { params: { shopId: shop.id, itemId: d.id } })}
                          aria-label="选择规格与数量"
                          className="px-2.5 h-6 rounded-full bg-[#FF4E33] text-white text-[12px] flex items-center"
                        >
                          {d.specs?.length ? '选规格' : <IcPlus size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="h-16" />
          </div>
        </div>
      </div>

      {/* 底部购物车 + 去结算 */}
      <div className="shrink-0 bg-white border-t border-[#F0F0F0] flex items-center px-3 py-2 gap-3" data-hide-on-keyboard>
        <div className="relative">
          <div className="w-11 h-11 rounded-full bg-[#FF4E33] flex items-center justify-center text-white">
            <IcTabCart size={24} />
          </div>
          {totalCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FFC300] text-[#333] text-[11px] font-bold flex items-center justify-center">{totalCount}</span>
          )}
        </div>
        <div className="flex-1">
          {totalCount > 0 ? <PriceYuan value={totalPrice} className="text-[#1A1A1A] text-[19px]" /> : <span className="text-[13px] text-[#999]">免运费</span>}
        </div>
        <button
          {...bindTap('restaurant.checkout-open', { params: { shopId: shop.id } })}
          className={`px-6 h-9 rounded-full text-[15px] font-semibold flex items-center ${totalCount > 0 ? 'bg-[#FF4E33] text-white' : 'bg-[#E5E5E5] text-[#999]'}`}
        >
          去结算
        </button>
      </div>

      {/* —— 菜品规格弹层 (panel=sku) —— */}
      {panel === 'sku' && skuDish && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <div {...bindBack()} className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-t-2xl max-h-[85%] flex flex-col">
            <div className="flex gap-3 p-4">
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-[#F5F5F5] shrink-0"><Img src={skuDish.image} className="w-full h-full object-cover" /></div>
              <div className="flex-1 min-w-0">
                <div className="text-[16px] font-bold text-[#1A1A1A] line-clamp-1">{skuDish.name}</div>
                <div className="text-[12px] text-[#999] mt-1 line-clamp-2">已选:{(skuDish.specs ?? []).map((s) => optOf(s.name, s.options)).join(',')}</div>
                <div className="flex items-baseline gap-2 mt-2">
                  <PriceYuan value={skuDish.price} className="text-[#FF2D2D] text-[22px]" />
                  {skuDish.originPrice > skuDish.price && <PriceYuan value={skuDish.originPrice} strike className="text-[13px]" />}
                </div>
              </div>
              <button {...bindBack()} aria-label="关闭" className="w-7 h-7 flex items-center justify-center text-[#999] self-start"><IcClose size={22} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-[15px] font-bold text-[#1A1A1A]">数量</span>
                <div className="flex items-center gap-3">
                  <button {...bindTap({ kind: 'action', id: 'waimaisku.qty.step' }, { params: { delta: -1 }, onTrigger: () => setSkuQty((q) => Math.max(1, q - 1)) })} aria-label="减" className="w-7 h-7 rounded-full bg-[#F2F2F2] text-[#666] flex items-center justify-center"><IcMinus size={16} /></button>
                  <span className="text-[16px] w-5 text-center">{skuQty}</span>
                  <button {...bindTap({ kind: 'action', id: 'waimaisku.qty.step' }, { params: { delta: 1 }, onTrigger: () => setSkuQty((q) => q + 1) })} aria-label="加" className="w-7 h-7 rounded-full bg-[#FF4E33] text-white flex items-center justify-center"><IcPlus size={16} /></button>
                </div>
              </div>
              {(skuDish.specs ?? []).map((spec) => (
                <div key={spec.name} className="py-2">
                  <div className="text-[15px] font-bold text-[#1A1A1A] mb-2">{spec.name}</div>
                  <div className="flex flex-wrap gap-2">
                    {spec.options.map((op) => {
                      const active = optOf(spec.name, spec.options) === op;
                      return (
                        <button
                          key={op}
                          {...bindTap({ kind: 'action', id: 'waimaisku.spec.select.option' }, { params: { spec: spec.name, option: op }, onTrigger: () => setSkuOpts((o) => ({ ...o, [spec.name]: op })) })}
                          className={`px-3 py-1.5 rounded-md text-[13px] ${active ? 'bg-[#FFF1EE] text-[#FF2D2D] border border-[#FF2D2D] font-semibold' : 'bg-[#F5F5F5] text-[#333]'}`}
                        >
                          {op}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <button
              {...bindTap({ kind: 'action', id: 'waimaisku.confirm.addcart' }, { onTrigger: () => { bumpLocal(skuDish.id, skuQty); addToCart(skuDish.id, skuQty, (skuDish.specs ?? []).map((s) => optOf(s.name, s.options)).join(','), 'miaosong'); showToast('已加入购物车'); back(); } })}
              className="shrink-0 m-3 h-11 rounded-full bg-[#FF4E33] text-white text-[16px] font-semibold"
            >
              加入购物车
            </button>
          </div>
        </div>
      )}

      {/* —— 送达时间弹层 (panel=time) —— */}
      {panel === 'time' && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <div {...bindBack()} className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-t-2xl max-h-[70%] flex flex-col">
            <div className="flex items-center px-4 pt-4 pb-2">
              <div className="flex-1">
                <div className="text-[17px] font-bold text-[#1A1A1A] text-center">请选择预计送达时间</div>
              </div>
              <button {...bindBack()} aria-label="关闭" className="w-7 h-7 flex items-center justify-center text-[#999] absolute right-3"><IcClose size={22} /></button>
            </div>
            <div className="text-[12px] text-[#999] px-4 pb-2">店内可售商品及优惠可能会因选择的时间而变化,以实际展示为准</div>
            <div className="flex-1 flex min-h-0 border-t border-[#F0F0F0]">
              <div className="w-[130px] shrink-0 bg-[#F7F7F7] overflow-y-auto no-scrollbar">
                {DATES.map((d, i) => (
                  <button
                    key={d}
                    {...bindTap({ kind: 'action', id: 'deliverytime.date.select.day' }, { params: { day: i }, onTrigger: () => setDate(i) })}
                    className={`w-full py-4 px-3 text-left text-[14px] ${date === i ? 'bg-white text-[#1A1A1A] font-bold' : 'text-[#666]'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto">
                {SLOTS.map((s) => {
                  const active = slot === s;
                  return (
                    <button
                      key={s}
                      {...bindTap({ kind: 'action', id: 'deliverytime.slot.select.time' }, { params: { time: s }, onTrigger: () => { setSlot(s); back(); } })}
                      className="w-full flex items-center justify-between py-4 px-4 border-b border-[#F7F7F7]"
                    >
                      <span className={`text-[15px] ${active ? 'text-[#FF2D2D] font-semibold' : 'text-[#333]'}`}>{s}</span>
                      {active && <IcCheck size={18} className="text-[#FF2D2D]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* —— 门店购物车弹层 (panel=cart) —— */}
      {panel === 'cart' && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <div {...bindBack()} className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-t-2xl max-h-[75%] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#F5F5F5]">
              <div className="flex items-center gap-2 text-[15px]">
                <IcCheck size={20} className="text-[#FF4E33]" />
                <span className="font-semibold text-[#1A1A1A]">全选</span>
                <span className="text-[13px] text-[#666]">(打包费<span className="text-[#FF2D2D]">¥4</span>)</span>
              </div>
              <button
                {...bindTap({ kind: 'action', id: 'waimaicart.clear.all' }, {
                  onTrigger: () => {
                    setQty({});
                    cart.filter((c) => c.shopId === shop.id).forEach((c) => removeCartLine(c.key));
                    showToast('已清空购物车');
                  },
                })}
                className="text-[13px] text-[#999] flex items-center gap-1"
              >
                清空购物车
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="text-[12px] text-[#999] bg-[#F7F7F7] py-1.5 px-4">已勾选今日加购商品</div>
              {cartDishes.length === 0 && <div className="text-center text-[#BBB] text-[13px] py-10">购物车是空的</div>}
              {cartDishes.map((d) => (
                <div key={d.id} className="flex gap-2.5 px-4 py-3 border-b border-[#F7F7F7]">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#F5F5F5] shrink-0"><Img src={d.image} className="w-full h-full object-cover" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] text-[#1A1A1A] line-clamp-1">{d.name}</div>
                    <div className="flex items-center justify-between mt-3">
                      <PriceYuan value={d.price} className="text-[#FF2D2D] text-[16px]" />
                      <div className="flex items-center gap-3">
                        <button {...bindTap({ kind: 'action', id: 'waimaicart.item.qtystep' }, { params: { itemId: d.id, delta: -1 }, onTrigger: () => bumpLocal(d.id, -1) })} aria-label="减" className="w-6 h-6 rounded-full border border-[#DDD] text-[#666] flex items-center justify-center"><IcMinus size={14} /></button>
                        <span className="text-[14px] w-4 text-center">{qty[d.id]}</span>
                        <button {...bindTap({ kind: 'action', id: 'waimaicart.item.qtystep' }, { params: { itemId: d.id, delta: 1 }, onTrigger: () => bumpLocal(d.id, 1) })} aria-label="加" className="w-6 h-6 rounded-full bg-[#FF4E33] text-white flex items-center justify-center"><IcPlus size={14} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="shrink-0 flex items-center px-3 py-2.5 border-t border-[#F0F0F0] gap-3">
              <div className="flex-1">
                <PriceYuan value={totalPrice} className="text-[#1A1A1A] text-[19px]" />
                <span className="text-[11px] text-[#999] ml-1">免运费¥5</span>
              </div>
              <button {...bindTap('waimaicart.checkout-open', { params: { shopId: shop.id } })} className="px-8 h-10 rounded-full bg-[#FF4E33] text-white text-[15px] font-semibold flex items-center">去结算</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
