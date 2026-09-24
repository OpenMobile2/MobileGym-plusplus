import React from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Card, EmptyState, Page, PrimaryButton, ProductArt, Row, Segmented, Sheet, Stepper, TopBar, UnavailableButton } from '../components/ui';
import { useLuckinGestures } from '../hooks/useLuckinGestures';
import { useLuckinProducts } from '../hooks/useLuckinData';
import { useLuckinStrings } from '../hooks/useLuckinStrings';
import { IcBag, IcChevron, IcCoffee, IcDeer, IcPin, IcPlus, IcSearch } from '../res/icons';
import { useLuckinStore } from '../state';
import type { Product } from '../types';
import homeCampaignImage from '../assets/generated/home-football-campaign.png';
import orangeCHeroImage from '../assets/generated/orange-c-hero.png';

function ProductCard({ product }: { product: Product }) {
  const { bindTap } = useLuckinGestures();
  const s = useLuckinStrings();
  return (
    <div className="flex gap-2.5 py-2.5 border-b border-[#F1F1F1] last:border-0">
      <button {...bindTap('menu.product-open', { params: { itemId: product.id } })} className="shrink-0"><ProductArt product={product} size={72} /></button>
      <button {...bindTap('menu.product-open', { params: { itemId: product.id } })} className="min-w-0 flex-1 text-left">
        <div className="min-w-0 flex items-start gap-1"><span className="block flex-1 min-w-0 text-[12px] leading-[18px] font-semibold truncate whitespace-nowrap">{product.name}</span>{product.badge && <span className="shrink-0 px-1 rounded bg-[#EAEEFB] text-[#1C2E9C] text-[8px] whitespace-nowrap">{product.badge}</span>}</div>
        <p className="text-[10px] leading-4 text-[#777] mt-0.5 truncate whitespace-nowrap">{product.subtitle}</p>
        <p className="text-[9px] leading-3 text-[#9B875F] mt-0.5 truncate whitespace-nowrap">{s.flavor_global}</p>
        <div className="mt-1 flex items-center whitespace-nowrap"><span className="text-[#F12B00] text-[14px] font-bold tabular-nums">¥{product.price}</span><span className="ml-1 text-[9px] text-[#999] line-through tabular-nums">¥{product.originalPrice}</span></div>
      </button>
      <button {...bindTap('menu.product-open', { params: { itemId: product.id } })} aria-label="add" className="shrink-0 self-end mb-1.5 w-7 h-7 rounded-full bg-[#1C2E9C] text-white flex items-center justify-center"><IcPlus size={16} /></button>
    </div>
  );
}

function CartPanel() {
  const s = useLuckinStrings();
  const { bindAction, bindTap } = useLuckinGestures();
  const cart = useLuckinStore((state) => state.cart);
  const products = useLuckinProducts();
  const toggle = useLuckinStore((state) => state.toggleCartItem);
  const change = useLuckinStore((state) => state.changeCartQty);
  const clear = useLuckinStore((state) => state.clearCart);
  const ask = useLuckinStore((state) => state.flags.clearAsk);
  const toggleAsk = useLuckinStore((state) => state.toggleFlag);
  const total = cart.reduce((sum, item) => sum + (item.checked ? (products.find((p) => p.id === item.productId)?.price ?? 0) * item.quantity : 0), 0);
  return (
    <Sheet title={s.cart_selected} footer={<div className="flex items-center gap-3"><div className="flex-1"><span className="text-xs text-[#777]">{s.subtotal}</span><strong className="ml-1 text-[#F12B00] text-lg">¥{total.toFixed(1)}</strong></div><PrimaryButton disabled={!cart.length} props={bindTap('cart.checkout-open')}>{s.checkout}</PrimaryButton></div>}>
      <div className="px-4">
        <div className="flex justify-end py-2"><button {...bindAction('cart.clear.ask', () => toggleAsk('clearAsk'))} className="text-xs text-[#888]">{s.cart_clear}</button></div>
        {!cart.length && <EmptyState title={s.cart_empty} hint={s.cart_empty_hint} />}
        {cart.map((item) => { const product = products.find((p) => p.id === item.productId); if (!product) return null; return (
          <div key={item.productId} className="flex items-center gap-2 py-3 border-t border-[#F2F2F2]">
            <button {...bindAction('cart.item.check.toggle', () => toggle(item.productId), { itemId: item.productId })} className={`w-5 h-5 rounded-full border flex items-center justify-center text-[11px] ${item.checked ? 'bg-[#1C2E9C] text-white border-[#1C2E9C]' : 'border-[#CCC]'}`}>{item.checked ? '✓' : ''}</button>
            <ProductArt product={product} size={54} />
            <div className="flex-1 min-w-0"><b className="block text-sm truncate whitespace-nowrap">{product.name}</b><p className="text-[10px] text-[#777] truncate whitespace-nowrap">{s.order_spec_summary}</p><span className="block text-[#F12B00] text-sm font-semibold whitespace-nowrap tabular-nums">¥{product.price}</span></div>
            <Stepper value={item.quantity} minusProps={bindAction('cart.item.qty.step', () => change(item.productId, -1), { itemId: item.productId, delta: -1 })} plusProps={bindAction('cart.item.qty.step', () => change(item.productId, 1), { itemId: item.productId, delta: 1 })} />
          </div>
        ); })}
      </div>
      {ask && <div className="absolute inset-0 z-10 bg-black/30 flex items-center justify-center p-8"><Card className="w-full p-5 text-center"><b className="text-base">{s.cart_clear}?</b><p className="text-xs text-[#888] mt-2">{s.cart_remove_all_hint}</p><div className="flex gap-2 mt-5"><button {...bindAction('cart.clear.ask', () => toggleAsk('clearAsk'))} className="h-10 flex-1 rounded-full border">{s.cancel}</button><button {...bindAction('cart.clear.confirm', () => { clear(); toggleAsk('clearAsk'); })} className="h-10 flex-1 rounded-full bg-[#1C2E9C] text-white">{s.confirm}</button></div></Card></div>}
    </Sheet>
  );
}

export function MenuMainPage() {
  const s = useLuckinStrings();
  const location = useLocation();
  const { bindAction, bindTap, setSearch } = useLuckinGestures();
  const mode = useLuckinStore((state) => state.mode);
  const setMode = useLuckinStore((state) => state.setMode);
  const menuTab = useLuckinStore((state) => state.menuTab);
  const setMenuTab = useLuckinStore((state) => state.setMenuTab);
  const category = useLuckinStore((state) => state.category);
  const setCategory = useLuckinStore((state) => state.setCategory);
  const products = useLuckinProducts();
  const addToCart = useLuckinStore((state) => state.addToCart);
  const showToast = useLuckinStore((state) => state.showToast);
  const cart = useLuckinStore((state) => state.cart);
  const categories = [
    ['popular', s.menu_popular], ['fruit', s.menu_fruit], ['special', s.menu_special], ['new', s.menu_new], ['latte', s.menu_latte], ['tea', s.menu_tea], ['all', s.menu_all],
  ];
  const cartOpen = new URLSearchParams(location.search).get('cart') === '1';
  return (
    <Page className="bg-white">
      <div className="px-3 pt-2 bg-white sticky top-0 z-20">
        <div className="flex gap-1.5 items-center">
          <div className="w-[104px] shrink-0"><Segmented actionId="menu.mode.select.target" value={mode} onSelect={(id) => setMode(id as 'pickup' | 'delivery')} options={[{ id: 'pickup', label: s.mode_pickup }, { id: 'delivery', label: s.mode_delivery }]} /></div>
          <button {...bindTap('menu.search-open')} className="flex-1 min-w-0 h-9 bg-[#F3F4F6] rounded-full px-2.5 flex items-center gap-1.5 text-[#777] text-[11px] overflow-hidden"><IcSearch size={16} className="shrink-0" /><span className="block min-w-0 truncate whitespace-nowrap">{s.search_hint}</span></button>
          <UnavailableButton className="h-9 shrink-0 px-2 rounded-full border border-[#D9D9D9] text-xs whitespace-nowrap">{s.group_order}</UnavailableButton>
        </div>
        <button {...bindTap('menu.store-open')} className="h-11 w-full min-w-0 flex items-center text-left"><IcPin size={20} className="shrink-0 text-[#333]" /><b className="ml-1 min-w-0 text-sm truncate whitespace-nowrap">{mode === 'pickup' ? s.store_name : s.delivery_address}</b><span className="ml-1 shrink-0 text-[10px] text-[#777] whitespace-nowrap">{s.store_distance}</span><IcChevron size={16} className="ml-auto shrink-0" /></button>
        <button {...bindTap('menu.coupons-open')} className="h-10 w-full min-w-0 rounded-lg bg-[#FDECEC] px-3 flex items-center text-[11px] overflow-hidden"><b className="shrink-0 whitespace-nowrap">{s.coupon_banner}</b><span className="ml-2 min-w-0 flex-1 text-[#C84D3D] truncate whitespace-nowrap">{s.coupon_use}</span><span className="ml-2 shrink-0 px-2.5 py-1 rounded-full bg-[#EE5022] text-white whitespace-nowrap">{s.coupon_more}</span></button>
        <div className="flex h-12 mt-1">
          {[['classic', s.menu_classic], ['daily99', s.menu_daily], ['usual', s.menu_usual]].map(([id, label]) => <button key={id} {...bindAction('menu.tab.select.target', () => setMenuTab(id as 'classic' | 'daily99' | 'usual'), { target: id })} className={`flex-1 min-w-0 text-sm relative truncate whitespace-nowrap ${menuTab === id ? 'text-[#1C2E9C] font-semibold' : 'text-[#555]'}`}>{label}{menuTab === id && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#1C2E9C]" />}</button>)}
        </div>
      </div>

      {menuTab === 'daily99' && <button {...bindAction('menu.daily99.claim', () => showToast(s.claimed_success))} className="mx-3 my-2 p-4 rounded-xl bg-gradient-to-r from-[#E7EEFF] to-[#FFF0EC] flex items-center text-left"><div className="w-12 h-12 rounded-full bg-[#1C2E9C] text-white flex items-center justify-center font-bold">9.9</div><div className="ml-3 flex-1"><b className="block">{s.daily_deal_title}</b><span className="text-xs text-[#777]">{s.daily_deal_hint}</span></div><span className="px-3 py-1.5 rounded-full bg-[#1C2E9C] text-white text-xs">{s.claim}</span></button>}
      {menuTab === 'usual' && <button {...bindAction('menu.usual.add', () => { addToCart('coconut-latte'); showToast(s.added_cart); })} className="mx-3 my-2 p-4 rounded-xl bg-[#F6F8FF] flex items-center"><IcCoffee size={34} className="text-[#1C2E9C]" /><div className="ml-3 text-left flex-1"><b>{s.menu_usual}</b><p className="text-xs text-[#888]">{s.usual_product_spec}</p></div><span className="text-[#1C2E9C] text-xl">＋</span></button>}

      <div className="flex border-t border-[#EEE] min-h-[430px]">
        <aside className="w-[78px] bg-[#F5F5F5] shrink-0">
          {categories.map(([id, label]) => <button key={id} {...bindAction('menu.category.select.target', () => setCategory(id), { target: id })} className={`w-full min-h-14 px-1 text-[11px] truncate whitespace-nowrap ${category === id ? 'bg-white text-[#1C2E9C] font-semibold border-l-[3px] border-[#1C2E9C]' : 'text-[#555]'}`}>{label}</button>)}
        </aside>
        <main className="min-w-0 flex-1 px-3 pb-20">
          <div className="py-3"><b className="text-[15px]">{categories.find((item) => item[0] === category)?.[1]}</b><span className="ml-2 text-[10px] text-[#AAA]">{s.sales}</span></div>
          {products.filter((product) => category === 'all' || category === 'popular' || product.category === category).map((product) => <ProductCard key={product.id} product={product} />)}
        </main>
      </div>
      {cart.length > 0 && <button {...bindTap('menu.checkout-open')} className="absolute z-30 bottom-[78px] left-[94px] right-[62px] h-11 rounded-full bg-[#1C2E9C] text-white flex items-center px-4 shadow-lg"><span className="flex-1 text-left text-sm">¥{cart.reduce((sum, item) => sum + (products.find((product) => product.id === item.productId)?.price ?? 0) * item.quantity, 0).toFixed(1)}</span><b className="text-sm">{s.checkout}</b></button>}
      <button {...bindAction('menu.cart.open', () => setSearch({ cart: '1' }))} className="absolute z-30 bottom-[76px] right-4 w-13 h-13 rounded-full bg-white shadow-xl border border-[#EEE] flex items-center justify-center text-[#1C2E9C]"><IcBag size={26} /><span className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full bg-[#EE5022] text-white text-[10px] flex items-center justify-center">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span></button>
      {cartOpen && <CartPanel />}
    </Page>
  );
}

export function HomeMainPage() {
  const s = useLuckinStrings();
  const { bindTap } = useLuckinGestures();
  const products = useLuckinProducts();
  return (
    <Page className="bg-[#F5F5F5]">
      <div className="relative w-full h-[250px] overflow-hidden bg-white">
        <button {...bindTap('home.menu-open')} aria-label={s.home_order_aria} className="relative block w-full h-full text-left">
          <img src={homeCampaignImage} alt={s.home_campaign_alt} onError={(event) => { event.currentTarget.style.display = 'none'; }} className="absolute inset-0 w-full h-full object-cover object-center" />
          <div className="absolute inset-y-0 left-0 w-[48%] bg-gradient-to-r from-white via-white/95 to-transparent" />
          <div className="absolute left-4 top-8 w-[46%] text-[#142C78] drop-shadow-sm">
            <div className="flex items-center gap-2 text-[10px] font-semibold"><IcDeer size={22} /> ALL IN LUCKIN</div>
            <h1 className="mt-5 text-[27px] leading-[1.05] font-black italic">{s.home_hero_line1}<br />{s.home_hero_line2}</h1>
            <p className="mt-2 text-[11px] font-semibold tracking-wide">JUST ORANGE C</p>
            <span className="inline-flex mt-5 px-4 py-2 rounded-full bg-white/95 border border-[#E7E7E7] text-[12px] text-[#222]">{s.home_taste_now} ›</span>
          </div>
        </button>
        <button {...bindTap('home.search-open')} aria-label={s.search} className="absolute z-10 right-4 top-4 w-9 h-9 rounded-full bg-white/90 text-[#27346F] shadow flex items-center justify-center"><IcSearch size={19} /></button>
      </div>

      <div className="px-3 -mt-2 relative z-10 pb-5 space-y-3">
        <section className="overflow-hidden rounded-xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <div className="h-12 px-4 bg-[#20262D] text-[#D8BD79] flex items-center text-sm"><span className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center"><IcDeer size={18} /></span><b className="ml-2 flex-1">{s.home_greeting}</b><span>{s.home_level_label}</span></div>
          <div className="grid grid-cols-3 py-4 text-center">
            <button {...bindTap('home.menu-open')} className="px-1"><span className="mx-auto w-12 h-12 rounded-2xl bg-[#EEF3FF] flex items-center justify-center text-[#1544B7]"><IcCoffee size={27} /></span><b className="block mt-2 text-sm">{s.home_pickup}</b><small className="text-[#AAA]">{s.home_pickup_hint}</small></button>
            <button {...bindTap('home.menu-open')} className="px-1"><span className="mx-auto w-12 h-12 rounded-2xl bg-[#FFF3E9] flex items-center justify-center text-[#EA6B24]"><IcBag size={27} /></span><b className="block mt-2 text-sm">{s.home_delivery}</b><small className="text-[#AAA]">{s.home_delivery_hint}</small></button>
            <button {...bindTap('home.instant-open', { params: { itemId: 'instant-coffee' } })} className="px-1"><span className="mx-auto w-12 h-12 rounded-2xl bg-[#EAF7FF] flex items-center justify-center text-[#155CC4]"><IcCoffee size={27} /></span><b className="block mt-2 text-sm">{s.home_instant}</b><small className="text-[#AAA]">{s.home_instant_hint}</small></button>
          </div>
          <div className="grid grid-cols-4 border-t border-[#F2F2F2] py-3 text-center text-[11px]">
            <UnavailableButton><IcCoffee size={21} className="mx-auto mb-1" />{s.coffee_card}<small className="block text-[#AAA]">{s.home_card_hint}</small></UnavailableButton>
            <UnavailableButton><IcBag size={21} className="mx-auto mb-1" />{s.gift_card}<small className="block text-[#AAA]">{s.home_gift_hint}</small></UnavailableButton>
            <UnavailableButton><IcDeer size={21} className="mx-auto mb-1" />{s.welfare_center}<small className="block text-[#AAA]">{s.home_welfare_hint}</small></UnavailableButton>
            <UnavailableButton><IcCoffee size={21} className="mx-auto mb-1" />{s.alliance}<small className="block text-[#AAA]">{s.home_alliance_hint}</small></UnavailableButton>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-2">
          <UnavailableButton className="h-28 rounded-xl bg-gradient-to-br from-[#FFF2F1] to-white p-3 text-left relative overflow-hidden"><b className="text-[#E92727] text-lg">{s.home_weekly_deal}</b><p className="text-xs text-[#555]">{s.home_deal_hint}</p><span className="absolute left-3 bottom-3 bg-[#F43838] text-white rounded-lg px-3 py-1.5 text-xs">{s.home_claim_now}</span></UnavailableButton>
          <button {...bindTap('home.product-open', { params: { itemId: 'orange-c' } })} className="h-28 rounded-xl bg-white p-3 text-left relative overflow-hidden"><b className="text-sm">{s.home_featured_title}</b><p className="text-xs text-[#777] mt-1">{s.home_featured_hint}</p><div className="absolute right-1 bottom-0"><ProductArt product={products[0]} size={68} /></div><span className="absolute left-3 bottom-3 text-xs font-semibold">{s.home_buy_now} ›</span></button>
        </div>

        <h2 className="pt-1 font-bold text-lg">{s.home_recommendations}</h2>
        <div className="grid grid-cols-2 gap-2">{products.slice(0, 4).map((product) => <button key={product.id} {...bindTap('home.product-open', { params: { itemId: product.id } })} className="bg-white rounded-xl p-2 text-left"><ProductArt product={product} size={148} /><b className="block mt-2 text-sm truncate">{product.name}</b><span className="text-[#F12B00] text-sm font-bold">¥{product.price}</span></button>)}</div>
      </div>
    </Page>
  );
}

export function SearchMainPage() {
  const s = useLuckinStrings();
  const { bindAction, bindTap } = useLuckinGestures();
  const query = useLuckinStore((state) => state.inputs.search);
  const setInput = useLuckinStore((state) => state.setInput);
  const setSelection = useLuckinStore((state) => state.setSelection);
  const historyCleared = useLuckinStore((state) => state.flags.historyCleared);
  const toggleFlag = useLuckinStore((state) => state.toggleFlag);
  const products = useLuckinProducts();
  const history = [s.search_keyword_coconut, s.search_keyword_orange, s.search_keyword_99, s.search_keyword_low_sugar];
  const results = query ? products.filter((product) => product.name.includes(query) || product.subtitle.includes(query)) : products.slice(0, 3);
  return (
    <Page>
      <div className="bg-white sticky top-0 z-10"><TopBar title={s.search} /><div className="px-3 pb-3 flex gap-2"><div className="h-10 flex-1 min-w-0 rounded-full bg-[#F3F4F6] flex items-center px-3"><IcSearch size={18} className="shrink-0 text-[#777]" /><input data-action="search.keyword.input" value={query} onChange={(event) => setInput('search', event.target.value)} placeholder={s.search_hint} className="ml-2 flex-1 min-w-0 bg-transparent outline-none text-sm text-[#333] placeholder:text-[#999]" /></div><button {...bindAction('search.submit.run', () => setSelection('lastSearch', query), { value: query })} className="shrink-0 text-sm text-[#1C2E9C] whitespace-nowrap">{s.search}</button></div></div>
      {!historyCleared && <div className="px-4 py-4"><div className="flex"><b className="text-sm flex-1">{s.search_history}</b><button {...bindAction('search.history.clear', () => toggleFlag('historyCleared'))} className="text-xs text-[#999]">{s.delete}</button></div><div className="flex flex-wrap gap-2 mt-3">{history.map((word) => <button key={word} {...bindAction('search.history.select.target', () => setInput('search', word), { target: word })} className="px-3 py-1.5 bg-white rounded-full text-xs">{word}</button>)}</div></div>}
      <div className="px-3 pb-5"><h2 className="font-semibold text-sm mb-2">{query ? s.search_results : s.search_hot}</h2>{results.map((product) => <button key={product.id} {...bindTap('search.product-open', { params: { itemId: product.id } })} className="w-full min-w-0 p-3 bg-white rounded-xl mb-2 flex items-center text-left"><ProductArt product={product} size={62} /><div className="ml-3 flex-1 min-w-0"><b className="block truncate whitespace-nowrap">{product.name}</b><p className="text-xs text-[#777] mt-1 truncate whitespace-nowrap">{product.subtitle}</p><span className="block text-[#F12B00] font-bold text-sm whitespace-nowrap tabular-nums">¥{product.price}</span></div><IcChevron className="shrink-0 self-center text-[#A7ADB4]" /></button>)}</div>
    </Page>
  );
}

function OptionGroup({ title, options, value, actionId, onSelect }: { title: string; options: Array<{ id: string; label: string }>; value: string; actionId: string; onSelect: (id: string) => void }) {
  const { bindAction } = useLuckinGestures();
  return <section className="mt-4"><h3 className="text-[13px] font-medium mb-1.5">{title}</h3><div className={`grid gap-2 ${options.length >= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>{options.map((option) => <button key={option.id} {...bindAction(actionId, () => onSelect(option.id), { target: option.id })} className={`min-w-0 min-h-10 rounded-xl border text-[12px] px-2 truncate whitespace-nowrap ${value === option.id ? 'border-[#1C2E9C] text-[#1C2E9C] bg-[#F4F6FF]' : 'border-[#E0E0E0]'}`}>{option.label}</button>)}</div></section>;
}

export function ProductCustomizePage() {
  const s = useLuckinStrings();
  const { itemId = 'orange-c' } = useParams();
  const { bindAction, bindTap, bindBack } = useLuckinGestures();
  const products = useLuckinProducts();
  const product = products.find((item) => item.id === itemId) ?? products[0];
  const selections = useLuckinStore((state) => state.selections);
  const setSelection = useLuckinStore((state) => state.setSelection);
  const addToCart = useLuckinStore((state) => state.addToCart);
  const showToast = useLuckinStore((state) => state.showToast);
  const qty = Number(selections.productQty ?? '1');
  const setQty = (next: number) => setSelection('productQty', String(Math.max(1, next)));
  return (
    <Page className="bg-white pb-28">
      <div className="h-[205px] relative overflow-hidden bg-[#F7C34F]"><button {...bindBack()} className="absolute top-2 left-2 z-10 w-9 h-9 rounded-full bg-white/85 flex items-center justify-center">‹</button>{product.id === 'orange-c' ? <img src={orangeCHeroImage} alt={product.name} onError={(event) => { event.currentTarget.style.display = 'none'; }} className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center" style={{ background: `linear-gradient(145deg, ${product.color}, #FFF8E8)` }}><ProductArt product={product} size={170} /></div>}</div>
      <div className="-mt-2 relative bg-white rounded-t-2xl px-4 pt-4">
        <div className="flex gap-3"><div className="flex-1 min-w-0"><h1 className="text-xl font-bold truncate whitespace-nowrap">{product.name}</h1><p className="text-xs text-[#666] mt-1 truncate whitespace-nowrap">{product.subtitle} · {s.product_calories}</p></div><button {...bindAction('product.flavor.save', () => showToast(s.saved_success))} className="shrink-0 text-[#1C2E9C] text-xs whitespace-nowrap"><IcDeer size={24} className="mx-auto" /><span>{s.save_flavor}</span></button></div>
        <OptionGroup title={s.cup_size} value={selections.size} actionId="product.size.select.target" onSelect={(id) => setSelection('size', id)} options={[{ id: 'large', label: s.large }, { id: 'extra', label: s.extra_large }]} />
        <OptionGroup title={s.temperature} value={selections.temperature} actionId="product.temp.select.target" onSelect={(id) => setSelection('temperature', id)} options={[{ id: 'iced', label: s.iced }, { id: 'hot', label: s.hot }]} />
        <OptionGroup title={s.sweetness} value={selections.sweetness} actionId="product.sweetness.select.target" onSelect={(id) => setSelection('sweetness', id)} options={[{ id: 'standard', label: s.standard_sweet }, { id: 'less', label: s.less_sweet }, { id: 'noSugar', label: s.no_sugar }]} />
        <OptionGroup title={s.bubble} value={selections.bubble ?? 'none'} actionId="product.bubble.select.target" onSelect={(id) => setSelection('bubble', id)} options={[{ id: 'none', label: s.no_bubble }, { id: 'sparkling', label: s.sparkling_addon }]} />
        <OptionGroup title={s.add_on} value={selections.addon ?? 'none'} actionId="product.addon.select.target" onSelect={(id) => setSelection('addon', id)} options={[{ id: 'none', label: s.no_addon }, { id: 'coconut', label: s.coconut }]} />
        <button {...bindAction('product.exchange.add', () => { addToCart('lemon-tea'); showToast(s.added_cart); })} className="mt-5 w-full min-w-0 rounded-xl bg-[#FFF4EF] p-3 flex items-center text-left"><ProductArt product={products[5]} size={46} /><span className="ml-3 flex-1 min-w-0"><b className="block text-sm truncate whitespace-nowrap">{s.exchange_title}</b><small className="block text-[#F12B00] truncate whitespace-nowrap">{products[5].name} ¥6.9</small></span><IcPlus className="shrink-0 text-[#1C2E9C]" /></button>
      </div>
      <div className="absolute left-0 right-0 bottom-0 bg-white border-t border-[#EEE] p-2.5"><div className="flex items-center mb-1.5"><strong className="flex-1 text-[#F12B00] text-xl">¥{product.price}</strong><Stepper value={qty} minusProps={bindAction('product.qty.step', () => setQty(qty - 1), { delta: -1 })} plusProps={bindAction('product.qty.step', () => setQty(qty + 1), { delta: 1 })} /></div><div className="flex gap-2"><PrimaryButton tone="cream" props={bindAction('product.cart.add', () => { addToCart(product.id, qty); showToast(s.added_cart); })}>{s.added_cart}</PrimaryButton><PrimaryButton props={bindTap('product.buynow-open')}><span className="px-7">{s.buy_now}</span></PrimaryButton></div></div>
    </Page>
  );
}
