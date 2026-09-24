import React from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Card, EmptyState, Page, PrimaryButton, ProductArt, Row, Segmented, Sheet, Stepper, TopBar, UnavailableButton, UnavailableRow } from '../components/ui';
import { useLuckinGestures } from '../hooks/useLuckinGestures';
import { useLuckinCoupons, useLuckinProducts } from '../hooks/useLuckinData';
import { useLuckinStrings } from '../hooks/useLuckinStrings';
import { IcCheck, IcCoffee, IcPin } from '../res/icons';
import { useLuckinStore } from '../state';

function StoreConfirmPanel() {
  const s = useLuckinStrings();
  const { bindAction, bindTap, back } = useLuckinGestures();
  const mute = useLuckinStore((state) => state.flags.storeMute);
  const toggleFlag = useLuckinStore((state) => state.toggleFlag);
  return <Sheet title={s.confirm_store} footer={<div className="flex gap-2"><PrimaryButton tone="cream" props={bindTap('storeConfirm.change-open')}>{s.change_store}</PrimaryButton><PrimaryButton props={bindAction('storeConfirm.store.accept', () => back())}>{s.confirm}</PrimaryButton></div>}><div className="p-5 text-center"><div className="h-32 rounded-xl bg-[#EEF4FF] relative overflow-hidden"><div className="absolute inset-0 opacity-70" style={{ backgroundImage: 'linear-gradient(30deg, transparent 45%, #C8D6F3 46%, #C8D6F3 52%, transparent 53%), linear-gradient(-20deg, transparent 45%, #D7E3F7 46%, #D7E3F7 54%, transparent 55%)' }} /><IcPin size={42} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[#1C2E9C]" /></div><h3 className="mt-4 font-semibold">{s.store_name}</h3><p className="text-xs text-[#888] mt-1">{s.synthetic_store_address} · {s.store_distance}</p><button {...bindAction('storeConfirm.mute.toggle', () => toggleFlag('storeMute'))} className="mt-5 text-xs text-[#666] flex items-center gap-2 mx-auto"><span className={`w-4 h-4 rounded-full border flex items-center justify-center ${mute ? 'bg-[#1C2E9C] text-white' : ''}`}>{mute ? '✓' : ''}</span>{s.mute_reminder}</button></div></Sheet>;
}

function ExchangePanel() {
  const s = useLuckinStrings();
  const { bindAction } = useLuckinGestures();
  const products = useLuckinProducts();
  const addToCart = useLuckinStore((state) => state.addToCart);
  const showToast = useLuckinStore((state) => state.showToast);
  const product = products[5];
  return <Sheet title={s.exchange_title} footer={<PrimaryButton props={bindAction('exchange.confirm.add', () => { addToCart(product.id); showToast(s.added_cart); })}><span className="px-16">{s.add_exchange}</span></PrimaryButton>}><div className="p-4"><div className="rounded-xl border border-[#EEE] p-3 flex"><ProductArt product={product} size={76} /><div className="ml-3 flex-1"><span className="text-[10px] rounded bg-[#FDECEC] text-[#E43C2B] px-1">{s.exchange_title}</span><b className="block mt-1">{product.name}</b><span className="text-[#F12B00] font-bold">¥6.9</span><span className="text-xs text-[#AAA] line-through ml-1">¥{product.originalPrice}</span></div><button {...bindAction('exchange.item.add', () => addToCart(product.id), { itemId: product.id })} className="self-end w-8 h-8 rounded-full bg-[#1C2E9C] text-white">＋</button></div></div></Sheet>;
}

function CouponPanel() {
  const s = useLuckinStrings();
  const { bindAction, back } = useLuckinGestures();
  const coupons = useLuckinCoupons().filter((coupon) => coupon.kind === 'drink');
  const selected = useLuckinStore((state) => state.selections.orderCoupon);
  const rules = useLuckinStore((state) => state.flags.couponRules);
  const setSelection = useLuckinStore((state) => state.setSelection);
  const note = useLuckinStore((state) => state.inputs.note);
  const showToast = useLuckinStore((state) => state.showToast);
  const createOrder = useLuckinStore((state) => state.createOrder);
  const toggleFlag = useLuckinStore((state) => state.toggleFlag);
  return <Sheet title={s.coupon} footer={<PrimaryButton props={bindAction('orderCoupon.select.target', () => back(), { target: selected ?? '' })}><span className="px-20">{s.confirm}</span></PrimaryButton>}><div className="p-3">{coupons.map((coupon) => <button key={coupon.id} {...bindAction('orderCoupon.select.target', () => setSelection('orderCoupon', coupon.id), { target: coupon.id })} className={`w-full p-3 mb-2 rounded-xl bg-[#FFF6F4] border flex text-left ${selected === coupon.id ? 'border-[#1C2E9C]' : 'border-[#F3DFDA]'}`}><strong className="text-[#F12B00] text-xl w-16">¥{coupon.amount}</strong><span className="flex-1"><b className="text-sm">{coupon.title}</b><small className="block text-[#888] mt-1">{coupon.threshold} · {coupon.expiry}</small></span>{selected === coupon.id && <IcCheck className="text-[#1C2E9C]" />}</button>)}<button {...bindAction('orderCoupon.rule.toggle', () => toggleFlag('couponRules'))} className="text-xs text-[#777] w-full py-2">{s.coupon_rule} {rules ? '⌃' : '⌄'}</button>{rules && <p className="text-[11px] text-[#999] leading-5">{s.coupon_rules_detail}</p>}</div></Sheet>;
}

function NotePanel() {
  const s = useLuckinStrings();
  const { bindAction, back } = useLuckinGestures();
  const setSelection = useLuckinStore((state) => state.setSelection);
  const setInput = useLuckinStore((state) => state.setInput);
  const note = useLuckinStore((state) => state.inputs.note);
  const showToast = useLuckinStore((state) => state.showToast);
  return <Sheet title={s.note} footer={<PrimaryButton props={bindAction('orderNote.confirm.save', () => { showToast(s.saved_success); back(); })}><span className="px-20">{s.confirm}</span></PrimaryButton>}><div className="p-4"><h3 className="text-sm font-medium">{s.pickup_method}</h3><div className="flex gap-2 mt-2"><button {...bindAction('orderNote.contactless.select.target', () => setSelection('contactless', 'yes'), { target: 'yes' })} className="px-4 py-2 rounded-full border border-[#1C2E9C] text-[#1C2E9C] text-xs">{s.contactless}</button><button {...bindAction('orderNote.napkin.select.target', () => setSelection('napkin', 'yes'), { target: 'yes' })} className="px-4 py-2 rounded-full border text-xs">{s.napkin}</button></div><textarea data-action="orderNote.text.input" value={note} onChange={(event) => setInput('note', event.target.value)} placeholder={s.note_hint} className="w-full h-28 mt-4 bg-[#F5F5F5] rounded-xl p-3 text-sm outline-none resize-none" /></div></Sheet>;
}

export function OrderConfirmPage() {
  const s = useLuckinStrings();
  const location = useLocation();
  const { bindAction, bindTap, setSearch } = useLuckinGestures();
  const mode = useLuckinStore((state) => state.mode);
  const setMode = useLuckinStore((state) => state.setMode);
  const cart = useLuckinStore((state) => state.cart);
  const products = useLuckinProducts();
  const selections = useLuckinStore((state) => state.selections);
  const setSelection = useLuckinStore((state) => state.setSelection);
  const note = useLuckinStore((state) => state.inputs.note);
  const showToast = useLuckinStore((state) => state.showToast);
  const createOrder = useLuckinStore((state) => state.createOrder);
  const total = cart.reduce((sum, item) => sum + (products.find((product) => product.id === item.productId)?.price ?? 0) * item.quantity, 0);
  const query = new URLSearchParams(location.search);
  return <Page className="pb-20"><TopBar title={s.order_confirm} /><div className="px-3 py-2 space-y-2"><Card className="p-3 relative overflow-hidden"><div className="absolute right-0 top-9 w-28 h-20 opacity-40" style={{ backgroundImage: 'linear-gradient(25deg, transparent 45%, #C8D6F3 46%, #C8D6F3 51%, transparent 52%), linear-gradient(-22deg, transparent 44%, #D7E3F7 45%, #D7E3F7 51%, transparent 52%)' }} /><Segmented actionId="order.mode.select.target" value={mode} onSelect={(id) => setMode(id as 'pickup' | 'delivery')} options={[{ id: 'pickup', label: s.mode_pickup }, { id: 'delivery', label: s.mode_delivery }]} /><button {...(mode === 'pickup' ? bindTap('order.store-open') : bindTap('order.address-open'))} className="relative mt-2 w-full min-w-0 flex text-left"><IcPin className="shrink-0 text-[#1C2E9C]" /><span className="ml-2 flex-1 min-w-0"><b className="block text-sm truncate whitespace-nowrap">{mode === 'pickup' ? s.store_name : s.delivery_address_value}</b><small className="block text-[#666] truncate whitespace-nowrap">{mode === 'pickup' ? s.pickup_time : s.delivery_contact_value}</small></span><span className="shrink-0">›</span></button>{mode === 'pickup' && <button {...bindAction('order.storeConfirm.panel.open', () => setSearch({ storeConfirm: '1' }))} className="relative mt-2 w-full h-8 rounded-full border border-[#1C2E9C] text-[#1C2E9C] text-xs truncate whitespace-nowrap">{s.confirm_store}</button>}</Card>
        <Card className="px-3">{cart.map((item) => { const product = products.find((p) => p.id === item.productId); return product ? <div key={item.productId} className="py-2.5 flex min-w-0"><ProductArt product={product} size={50} /><div className="ml-3 flex-1 min-w-0"><b className="block text-sm truncate whitespace-nowrap">{product.name}</b><p className="text-[10px] text-[#777] truncate whitespace-nowrap">{s.order_spec_summary}</p><span className="block text-[#F12B00] font-semibold whitespace-nowrap tabular-nums">¥{product.price}</span></div><span className="shrink-0 text-xs text-[#666] whitespace-nowrap">×{item.quantity}</span></div> : null; })}</Card>
        <Card className="p-3"><div className="flex items-center"><b className="text-sm flex-1">{s.exchange}</b><span className="text-[10px] text-[#F12B00]">{s.deal_from_price}</span></div><div className="grid grid-cols-3 gap-2 mt-2">{products.slice(3, 6).map((product) => <button key={product.id} {...bindAction('order.exchange.open', () => setSearch({ exchange: '1' }))} className="min-w-0 rounded-lg bg-[#FAFAFA] p-1.5 text-left"><ProductArt product={product} size={54} /><b className="block text-[10px] truncate mt-1">{product.name}</b><span className="text-[10px] text-[#F12B00]">¥6.9</span></button>)}</div></Card>
        <Card><Row title={s.exchange} onClickProps={bindAction('order.exchange.open', () => setSearch({ exchange: '1' }))} trailing={<span className="text-xs text-[#F12B00]">{s.deal_from_price} ›</span>} /><Row title={s.luckin_offer} onClickProps={bindAction('order.coupon.open', () => setSearch({ coupon: '1' }))} trailing={<span className="text-xs text-[#F12B00]">{selections.orderCoupon ? '-¥8' : s.coupon} ›</span>} /><UnavailableRow title={s.luck_card} trailing={<span className="text-xs text-[#999]">{s.none_available} ›</span>} /></Card>
        <Card><Row title={s.payment_method} subtitle={s.wechat_pay} onClickProps={bindAction('order.payment.select.target', () => setSelection('payment', selections.payment === 'wechat' ? 'balance' : 'wechat'), { target: 'wechat' })} /><Row title={s.note} subtitle={note} onClickProps={bindAction('order.note.open', () => setSearch({ note: '1' }))} /><button {...bindAction('order.closed.dismiss', () => showToast(s.cutlery_closed))} className="w-full h-12 px-4 flex items-center text-sm"><span className="flex-1 text-left">{s.no_cutlery}</span><span className="text-[#1C2E9C]">✓</span></button></Card>
      </div><div className="absolute left-0 right-0 bottom-0 bg-white border-t p-3 flex items-center gap-2"><span className="flex-1 min-w-0 text-sm truncate whitespace-nowrap">{s.subtotal} <b className="text-[#F12B00] text-lg tabular-nums">¥{total.toFixed(1)}</b></span><PrimaryButton props={bindTap('order.submit-open', { params: { orderId: 'o-local-6' }, beforeTrigger: () => createOrder() })}>{s.submit_order}</PrimaryButton></div>
      {query.get('storeConfirm') === '1' && <StoreConfirmPanel />}{query.get('exchange') === '1' && <ExchangePanel />}{query.get('coupon') === '1' && <CouponPanel />}{query.get('note') === '1' && <NotePanel />}
    </Page>;
}

function PayPanel({ orderId }: { orderId: string }) {
  const s = useLuckinStrings();
  const { bindAction, go } = useLuckinGestures();
  const password = useLuckinStore((state) => state.inputs.password);
  const setInput = useLuckinStore((state) => state.setInput);
  const method = useLuckinStore((state) => state.selections.payMethod ?? 'change');
  const setSelection = useLuckinStore((state) => state.setSelection);
  const press = (key: string) => { const next = (password + key).slice(0, 6); setInput('password', next); if (next.length === 6) go('pay.success-open', { orderId }); };
  return <Sheet title={s.cashier}><div className="p-5 text-center"><p className="text-xs text-[#888]">{s.pay_amount}</p><strong className="block mt-1 text-3xl">¥12.90</strong><button {...bindAction('pay.method.select.target', () => setSelection('payMethod', method === 'change' ? 'card' : 'change'), { target: method })} className="w-full mt-4 py-3 border-y flex text-sm"><span className="flex-1 text-left">{method === 'card' ? s.bank_card : s.change_balance}</span><span className="text-[#07C160]">{s.change_payment} ›</span></button><p className="mt-5 text-sm">{s.password_hint}</p><div className="flex justify-center gap-2 mt-3">{Array.from({ length: 6 }).map((_, i) => <span key={i} className="w-9 h-9 border-b-2 border-[#555] flex items-center justify-center">{password[i] ? '●' : ''}</span>)}</div><div className="grid grid-cols-3 gap-px bg-[#DDD] mt-6">{['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key, i) => key ? <button key={`${key}-${i}`} data-action="pay.password.input" onClick={() => key === '⌫' ? setInput('password', password.slice(0, -1)) : press(key)} className="h-12 bg-white text-lg">{key}</button> : <span key={i} className="bg-[#EEE]" />)}</div></div></Sheet>;
}

export function OrderDetailPage() {
  const s = useLuckinStrings();
  const location = useLocation();
  const { orderId = 'o26071301' } = useParams();
  const { bindAction, bindTap } = useLuckinGestures();
  const orders = useLuckinStore((state) => state.orders);
  const products = useLuckinProducts();
  const order = orders.find((item) => item.id === orderId) ?? orders[0];
  const product = products.find((item) => item.id === order.productId) ?? products[0];
  const setStatus = useLuckinStore((state) => state.setOrderStatus);
  const toggleFlag = useLuckinStore((state) => state.toggleFlag);
  const cancelAsk = useLuckinStore((state) => state.flags.cancelAsk);
  const showToast = useLuckinStore((state) => state.showToast);
  const statusText = { unpaid: s.order_unpaid, making: s.order_making, ready: s.order_ready, done: s.order_done }[order.status];
  return <Page className="pb-20">
    <TopBar title={s.order_detail} />
    <div className="bg-white px-4 py-3">
      <div className="flex items-start">
        <div className="flex-1">
          <p className="text-[10px] text-[#999]">{s.order_number} {order.id}</p>
          <h1 className="text-lg font-bold mt-1">{statusText}</h1>
          <p className="text-[11px] text-[#777] mt-1">{order.status === 'unpaid' ? s.order_pay_deadline : order.status === 'ready' ? s.order_pickup_code : s.order_thanks}</p>
        </div>
        {order.status === 'unpaid' && <PrimaryButton tone="orange" props={bindTap('orderDetail.pay-open', { params: { orderId } })}>{s.pay_now}</PrimaryButton>}
      </div>
      <div className="mt-3 rounded-lg bg-[#EEF5FF] px-3 py-2 text-[10px] text-[#34558B]">{s.pickup_reminder}</div>
    </div>
    <div className="p-3 space-y-2">
      <Card className="p-3">
        <div className="flex">
          <ProductArt product={product} size={58} />
          <div className="ml-3 flex-1"><b className="text-sm">{product.name}</b><p className="text-[10px] text-[#999] mt-1">{s.order_spec_summary}</p><span className="text-[#F12B00] font-bold">¥{order.amount}</span></div>
          <span className="text-xs">×{order.quantity}</span>
        </div>
        <div className="mt-2 pt-2 border-t text-[10px] text-[#888] flex"><span className="flex-1">{s.order_total_prefix} {order.quantity} {s.items_total}</span><b className="text-[#333]">{s.actual_paid} ¥{order.amount}</b></div>
      </Card>
      <button {...bindAction('orderDetail.invite.claim', () => showToast(s.claimed_success))} className="w-full rounded-xl bg-white p-3 flex text-left"><div className="w-9 h-9 rounded-lg bg-[#E8F0FF] flex items-center justify-center text-[#1C2E9C]">{s.invite_friend.slice(0, 1)}</div><span className="ml-3 flex-1"><b className="block text-sm">{s.invite_friend}</b><small className="text-[#888]">{s.invite_friend_hint}</small></span><span className="text-[#1C2E9C]">›</span></button>
      <Card className="p-3"><b className="text-sm">{s.add_order_gift}</b><p className="text-[10px] text-[#999] mt-1">{s.coupon_bundle_hint}</p><div className="grid grid-cols-3 gap-2 mt-2">{[s.drink_coupon,s.drink_coupon,s.drink_coupon].map((label, index) => <button key={`${label}-${index}`} {...bindAction('orderDetail.invite.claim', () => showToast(s.claimed_success))} className="rounded-lg bg-[#FFF1E9] py-2 text-center"><b className="text-[#EE5022]">9.9</b><small className="block text-[#999]">{label}</small></button>)}</div></Card>
      <Card><Row icon={<IcPin />} title={s.store_name} subtitle={s.synthetic_store_address} /><Row title={s.payment_method} subtitle={s.wechat_pay} /></Card>
    </div>
    <div className="absolute left-0 right-0 bottom-0 p-3 bg-white border-t flex gap-2">{order.status === 'unpaid' && <button {...bindAction('orderDetail.cancel.ask', () => toggleFlag('cancelAsk'))} className="h-11 flex-1 rounded-full border">{s.cancel_order}</button>}<PrimaryButton props={bindTap('orderDetail.reorder-open')}>{s.reorder}</PrimaryButton></div>
    {cancelAsk && <div className="absolute inset-0 z-40 bg-black/40 flex items-center justify-center p-8"><Card className="p-5 w-full text-center"><b>{s.cancel_order}？</b><p className="text-xs text-[#999] mt-2">{s.cancel_order_hint}</p><div className="flex gap-2 mt-5"><button {...bindAction('orderDetail.cancel.ask', () => toggleFlag('cancelAsk'))} className="h-10 flex-1 rounded-full border">{s.cancel}</button><button {...bindAction('orderDetail.cancel.confirm', () => { setStatus(order.id, 'done'); toggleFlag('cancelAsk'); })} className="h-10 flex-1 rounded-full bg-[#1C2E9C] text-white">{s.confirm}</button></div></Card></div>}
    {new URLSearchParams(location.search).get('pay') === '1' && <PayPanel orderId={orderId} />}
  </Page>;
}

export function OrderSuccessPage() {
  const s = useLuckinStrings();
  const { orderId = 'o-local-1' } = useParams();
  const { bindTap } = useLuckinGestures();
  return <Page><div className="min-h-full bg-white px-6 pt-16 text-center"><div className="w-20 h-20 rounded-full bg-[#E9F8EE] text-[#07C160] flex items-center justify-center mx-auto"><IcCheck size={44} /></div><h1 className="mt-5 text-xl font-bold">{s.pay_success}</h1><p className="text-sm text-[#888] mt-2">{s.order_success_hint}</p><Card className="mt-7 p-4 bg-[#F5F6FA] text-left"><p className="text-xs text-[#888]">{s.pickup_store_label}</p><b className="block mt-1">{s.store_name}</b><p className="text-xs text-[#888] mt-3">{s.order_number} {orderId}</p></Card><div className="flex gap-2 mt-8"><button {...bindTap('success.home-open')} className="h-12 flex-1 rounded-full border border-[#1C2E9C] text-[#1C2E9C]">{s.back_home}</button><PrimaryButton props={bindTap('success.detail-open', { params: { orderId } })}>{s.view_order}</PrimaryButton></div></div></Page>;
}

export function OrdersListPage() {
  const s = useLuckinStrings();
  const { bindAction, bindTap } = useLuckinGestures();
  const orders = useLuckinStore((state) => state.orders);
  const products = useLuckinProducts();
  const tab = useLuckinStore((state) => state.selections.orderTab ?? 'all');
  const setSelection = useLuckinStore((state) => state.setSelection);
  const filtered = ['all', 'store'].includes(tab) ? orders : [];
  const tabs = [['all',s.all],['store',s.order_tabs_store],['card',s.order_tabs_card],['instant',s.order_tabs_instant]];
  return <Page><TopBar title={s.my_orders} /><div className="bg-[#1C2E9C] p-1 flex sticky top-12 z-10">{tabs.map(([id,label]) => <button key={id} {...bindAction('orders.tab.select.target', () => setSelection('orderTab', id), { target: id })} className={`flex-1 min-w-0 h-8 px-1 rounded-full text-[10px] truncate whitespace-nowrap ${tab === id ? 'bg-white text-[#1C2E9C] font-semibold' : 'text-white'}`}>{label}</button>)}</div><div className="p-3">{!filtered.length && <EmptyState title={s.purchase_empty} />}{filtered.map((order, index) => { const product = products.find((p) => p.id === order.productId) ?? products[0]; return <Card key={order.id} className="mb-3 overflow-hidden"><button {...bindTap('orders.detail-open', { params: { orderId: order.id } })} className="w-full min-w-0 p-3 text-left"><div className="flex items-center min-w-0 text-xs"><span className="mr-2 shrink-0 px-1 bg-[#F4E7CB] text-[#8A6A2C] whitespace-nowrap">{index % 2 ? s.order_making : s.order_done}</span><b className="flex-1 min-w-0 truncate whitespace-nowrap">{s.store_name}</b><span className="ml-2 shrink-0 text-[#666] whitespace-nowrap">{{unpaid:s.order_unpaid,making:s.order_making,ready:s.order_ready,done:s.order_done}[order.status]}</span></div><div className="flex min-w-0 mt-3"><ProductArt product={product} size={62} /><div className="ml-3 flex-1 min-w-0"><b className="block text-sm truncate whitespace-nowrap">{product.name}</b><p className="text-[10px] text-[#777] mt-1 truncate whitespace-nowrap">{s.large} / {s.iced} / {s.no_sugar}</p><p className="text-[10px] text-[#888] mt-1 truncate whitespace-nowrap">{order.createdAt}</p></div><span className="shrink-0 text-right whitespace-nowrap"><small className="block">×{order.quantity}</small><b className="tabular-nums">¥{order.amount}</b></span></div><div className="mt-2 pt-2 border-t flex min-w-0 text-[10px] text-[#777]"><span className="flex-1 min-w-0 truncate whitespace-nowrap">{s.order_more}</span><span className="ml-2 shrink-0 whitespace-nowrap">{s.items_total} {order.quantity} · {s.actual_paid} ¥{order.amount}</span></div></button><div className="p-3 border-t flex justify-end gap-2"><button {...bindTap('orders.reorder-open')} className="px-4 py-1.5 rounded-full border border-[#1C2E9C] text-[#1C2E9C] text-xs whitespace-nowrap">{s.reorder}</button><button {...bindTap('orders.invoice-open')} className="px-4 py-1.5 rounded-full border text-xs whitespace-nowrap">{s.invoice}</button></div></Card>; })}</div></Page>;
}
