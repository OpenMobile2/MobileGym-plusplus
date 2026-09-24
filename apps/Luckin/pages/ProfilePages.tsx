import React, { useState } from 'react';
import { Card, EmptyState, Page, PrimaryButton, Row, TopBar, UnavailableButton, UnavailableRow } from '../components/ui';
import { useLuckinGestures } from '../hooks/useLuckinGestures';
import { useLuckinAddresses, useLuckinStores } from '../hooks/useLuckinData';
import { useLuckinStrings } from '../hooks/useLuckinStrings';
import { IcBag, IcCoffee, IcCrown, IcDeer, IcMessage, IcPin, IcSettings } from '../res/icons';
import { useLuckinStore } from '../state';
import type { Address } from '../types';

export function StorePickerPage() {
  const s = useLuckinStrings();
  const { bindAction, bindTap } = useLuckinGestures();
  const stores = useLuckinStores();
  const query = useLuckinStore((state) => state.inputs.storeSearch ?? '');
  const setInput = useLuckinStore((state) => state.setInput);
  const setSelection = useLuckinStore((state) => state.setSelection);
  const filtered = stores.filter((store) => !query || store.name.includes(query) || store.address.includes(query));
  return (
    <Page>
      <TopBar title={s.select_store} />
      <div className="sticky top-12 z-10 bg-white">
        <div className="h-10 flex justify-center gap-4 text-xs"><button className="text-[#1C2E9C] border-b-2 border-[#1C2E9C]">{s.mode_pickup}</button><UnavailableButton>{s.mode_delivery}</UnavailableButton></div>
        <div className="px-3 pb-2"><div className="h-9 min-w-0 bg-[#F4F5F7] rounded-full px-4 flex items-center"><span className="shrink-0">⌕</span><input data-action="store.search.input" value={query} onChange={(event) => setInput('storeSearch', event.target.value)} placeholder={s.search_hint} className="flex-1 min-w-0 ml-2 outline-none text-xs text-[#333] placeholder:text-[#999] bg-transparent" /></div></div>
      </div>
      <div className="h-48 bg-[#E9F0E3] relative overflow-hidden">
        {[12,42,72,102,132].map((left) => <span key={left} className="absolute top-0 bottom-0 w-2 bg-white/85 rotate-12" style={{ left }} />)}
        {[18,78,138].map((top) => <span key={top} className="absolute left-0 right-0 h-2 bg-white/85 -rotate-6" style={{ top }} />)}
        {stores.map((store, index) => <span key={store.id} className="absolute text-[#1C2E9C]" style={{ left: 55 + index * 57, top: 38 + (index % 2) * 55 }}><IcPin size={25} /></span>)}
        <UnavailableButton className="absolute right-3 bottom-3 px-3 py-1 rounded-full bg-white text-xs">{s.near_store}</UnavailableButton>
      </div>
      <div className="bg-white px-3 pt-3"><h2 className="font-semibold text-sm mb-2">{s.near_store}</h2>{filtered.map((store, index) => <button key={store.id} {...bindTap('store.select-back', { beforeTrigger: () => setSelection('storeId', store.id) })} className={`w-full min-w-0 py-3 flex text-left border-b ${index === 0 ? 'bg-[#F0F4FF] -mx-3 px-3 w-[calc(100%+24px)]' : ''}`}><IcPin className="shrink-0 text-[#1C2E9C]" /><span className="ml-3 flex-1 min-w-0"><b className="block text-sm truncate whitespace-nowrap">{store.name}</b><small className="block text-[#666] mt-1 truncate whitespace-nowrap">{store.address}</small><small className="block text-[#888] truncate whitespace-nowrap">{store.open}</small></span><span className="ml-2 shrink-0 text-xs text-[#666] whitespace-nowrap">{store.distance}</span></button>)}</div>
    </Page>
  );
}

export function AddressListPage() {
  const s = useLuckinStrings();
  const { bindTap } = useLuckinGestures();
  const addresses = useLuckinAddresses();
  const setSelection = useLuckinStore((state) => state.setSelection);
  return (
    <Page className="pb-20">
      <TopBar title={s.address_manage} />
      <div className="h-11 bg-white flex justify-center gap-5 text-xs"><button className="text-[#1C2E9C] border-b-2 border-[#1C2E9C]">{s.mode_delivery}</button><UnavailableButton>{s.mode_pickup}</UnavailableButton></div>
      <div className="p-3">{addresses.map((address) => <Card key={address.id} className="mb-2 p-4 flex min-w-0"><button {...bindTap('address.select-back', { beforeTrigger: () => setSelection('addressId', address.id) })} className="flex-1 min-w-0 text-left"><div className="min-w-0 flex items-center gap-2 whitespace-nowrap"><b className="shrink-0 text-sm">{address.name}</b><span className="min-w-0 text-xs truncate">{address.phone}</span>{address.isDefault && <span className="shrink-0 text-[9px] rounded bg-[#EAEEFB] text-[#1C2E9C] px-1">{s.set_default}</span>}</div><p className="mt-2 text-xs text-[#555] truncate whitespace-nowrap"><span className="text-[#1C2E9C] mr-1">{address.tag}</span>{address.region} {address.detail}</p></button><button {...bindTap('address.edit-open')} className="shrink-0 px-2 text-[#777] text-sm whitespace-nowrap">{s.edit}</button></Card>)}</div>
      <div className="absolute bottom-0 left-0 right-0 bg-white p-3"><PrimaryButton props={bindTap('address.new-open')}><span className="px-20">＋ {s.add_address}</span></PrimaryButton></div>
    </Page>
  );
}

export function AddressEditPage() {
  const s = useLuckinStrings();
  const { bindAction, back } = useLuckinGestures();
  const first = useLuckinAddresses()[0];
  const saveAddress = useLuckinStore((state) => state.saveAddress);
  const deleteAddress = useLuckinStore((state) => state.deleteAddress);
  const showToast = useLuckinStore((state) => state.showToast);
  const [form, setForm] = useState<Address>({ ...first, id: 'a-local' });
  const field = (key: keyof Address, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));
  return (
    <Page className="pb-24"><TopBar title={s.address_edit} /><div className="mt-2 bg-white px-4">
      <label className="h-14 min-w-0 flex items-center border-b"><span className="w-20 shrink-0 text-sm">{s.profile_username}</span><input data-action="addressEdit.name.input" value={form.name} onChange={(event) => field('name', event.target.value)} className="flex-1 min-w-0 outline-none text-sm" /></label>
      <div className="h-14 flex items-center border-b"><span className="w-20 text-sm">{s.profile_gender}</span><button {...bindAction('addressEdit.gender.select.target', () => field('tag', s.tag_home), { target: 'male' })} className="px-4 py-1.5 rounded-full border text-xs">{s.tag_home}</button><button {...bindAction('addressEdit.gender.select.target', () => field('tag', s.gender_female), { target: 'female' })} className="ml-2 px-4 py-1.5 rounded-full bg-[#F4F6FF] text-[#1C2E9C] text-xs">{s.gender_female}</button></div>
      <label className="h-14 min-w-0 flex items-center border-b"><span className="w-20 shrink-0 text-sm">{s.phone}</span><input data-action="addressEdit.phone.input" value={form.phone} onChange={(event) => field('phone', event.target.value)} className="flex-1 min-w-0 outline-none text-sm" /></label>
      <button {...bindAction('addressEdit.region.open', () => showToast(s.saved_success))} className="w-full h-14 flex items-center border-b text-sm"><span className="w-20 text-left">{s.region}</span><span className="flex-1 text-left">{form.region}</span><span>›</span></button>
      <label className="h-14 min-w-0 flex items-center border-b"><span className="w-20 shrink-0 text-sm">{s.detail_address}</span><input data-action="addressEdit.detail.input" value={form.detail} onChange={(event) => field('detail', event.target.value)} className="flex-1 min-w-0 outline-none text-sm" /></label>
      <div className="py-4 border-b"><span className="text-sm">{s.address_tag}</span><div className="flex gap-2 mt-3">{[s.tag_home,s.tag_company,s.tag_school].map((tag) => <button key={tag} {...bindAction('addressEdit.tag.select.target', () => field('tag', tag), { target: tag })} className={`px-4 py-1.5 rounded-full text-xs ${form.tag === tag ? 'bg-[#F2F4FA] text-[#1C2E9C]' : 'bg-[#F5F5F5]'}`}>{tag}</button>)}</div></div>
      <button {...bindAction('addressEdit.default.toggle', () => field('isDefault', !form.isDefault))} className="w-full h-14 flex items-center text-sm"><span className="flex-1 text-left">{s.set_default}</span><span className={`w-10 h-6 rounded-full p-0.5 ${form.isDefault ? 'bg-[#1C2E9C]' : 'bg-[#DDD]'}`}><span className={`block w-5 h-5 rounded-full bg-white transition-transform ${form.isDefault ? 'translate-x-4' : ''}`} /></span></button>
    </div>
    <button {...bindAction('addressEdit.form.delete', () => { deleteAddress(first.id); showToast(s.saved_success); back(); })} className="mt-3 w-full h-12 bg-white text-[#E34A3A] text-sm">{s.delete}</button>
    <div className="absolute bottom-0 left-0 right-0 p-3 bg-white"><PrimaryButton props={bindAction('addressEdit.form.save', () => { saveAddress(form); showToast(s.saved_success); back(); })}><span className="px-24">{s.save}</span></PrimaryButton></div>
    </Page>
  );
}

export function MineMainPage() {
  const s = useLuckinStrings();
  const { bindTap } = useLuckinGestures();
  const primary = [
    [s.orders_entry, <IcBag />, bindTap('mine.orders-open')],
    [s.card_entry, <IcCoffee />, bindTap('mine.coffeeCard-open')],
    [s.coupons_entry, <IcCrown />, bindTap('mine.coupons-open')],
    [s.gift_card, <IcBag />, bindTap('mine.giftCard-open')],
    [s.messages, <IcMessage />, bindTap('mine.messages-open')],
    [s.purchases, <IcBag />, bindTap('mine.purchases-open')],
  ] as const;
  const secondary = [
    [s.wallet, <IcBag />, bindTap('mine.wallet-open')],
    [s.alliance, <IcCoffee />, bindTap('mine.alliance-open')],
    [s.calendar, <IcCrown />, bindTap('mine.calendar-open')],
    [s.partner_entry, <IcSettings />, bindTap('mine.partner-open')],
  ] as const;
  return (
    <Page className="pb-20">
      <div className="h-48 px-5 pt-5 bg-gradient-to-b from-[#0F7CF0] to-[#7ABAF4] text-white relative overflow-hidden">
        <div className="absolute right-8 top-8 w-24 h-24 rounded-[46%] bg-white/15" />
        <div className="flex justify-end gap-4"><button {...bindTap('mine.messages-open')}><IcMessage /></button><button {...bindTap('mine.settings-open')}><IcSettings /></button></div>
        <button {...bindTap('mine.profile-open')} className="relative min-w-0 max-w-[240px] flex items-center mt-2"><div className="w-14 h-14 shrink-0 rounded-full bg-white flex items-center justify-center text-[#1C2E9C]"><IcDeer size={34} /></div><span className="ml-3 min-w-0 text-lg font-semibold truncate whitespace-nowrap">{s.nickname} ›</span></button>
      </div>
      <div className="px-3 -mt-9 relative">
        <Card className="p-4"><div className="flex"><span className="flex-1"><b className="block">Lv1 {s.member_level}</b><strong className="text-2xl">462</strong></span><span className="self-end text-[10px] text-[#777]">{s.level_progress} ›</span></div><div className="h-1.5 bg-[#E7EAF1] rounded-full mt-2"><div className="h-full w-[84%] rounded-full bg-[#1C67D8]" /></div></Card>
        <Card className="mt-3 grid grid-cols-6 p-3">{primary.map(([label, icon, props]) => <button key={label} {...props} className="min-w-0 text-center text-[10px] leading-4"><span className="w-9 h-9 mx-auto mb-1 flex items-center justify-center text-[#1C2E9C]">{icon}</span><span className="block truncate whitespace-nowrap">{label}</span></button>)}</Card>
        <Card className="mt-2 grid grid-cols-4 p-3">{secondary.map(([label, icon, props]) => <button key={label} {...props} className="min-w-0 text-center text-[10px] leading-4"><span className="w-8 h-8 mx-auto mb-1 flex items-center justify-center text-[#1C2E9C]">{icon}</span><span className="block truncate whitespace-nowrap">{label}</span></button>)}</Card>
        <button {...bindTap('mine.coupons-open')} className="mt-3 w-full h-24 rounded-xl bg-gradient-to-r from-[#132F94] to-[#4261D2] text-white text-left px-5"><b className="text-lg">{s.coupon_banner}</b><span className="block mt-2 text-xs">{s.coupon_inflate_hint}</span></button>
        <h2 className="mt-5 font-semibold">{s.calendar_gift}</h2>
        <Card className="mt-2 p-3 flex"><div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#FDECEC] text-[#E73C2E]">9.9</div><div className="ml-3 flex-1"><b className="text-sm">{s.welfare_team}</b><p className="text-xs text-[#888] mt-1">{s.welfare_progress}</p></div><button {...bindTap('mine.orders-open')} className="self-center px-3 py-1.5 rounded-full border border-[#1C2E9C] text-[#1C2E9C] text-xs">{s.go_for_cup}</button></Card>
        <Card className="mt-2 p-3 flex"><div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#EAF2FF] text-[#1C2E9C]"><IcCrown /></div><div className="ml-3 flex-1"><b className="text-sm">{s.bean_calendar}</b><p className="text-xs text-[#888] mt-1">{s.welfare_progress}</p></div><button {...bindTap('mine.calendar-open')} className="self-center px-3 py-1.5 rounded-full border border-[#1C2E9C] text-[#1C2E9C] text-xs">{s.go_for_cup}</button></Card>
      </div>
    </Page>
  );
}

export function MineProfilePage() {
  const s = useLuckinStrings();
  const { bindAction, bindTap } = useLuckinGestures();
  const showToast = useLuckinStore((state) => state.showToast);
  return (
    <Page className="pb-6">
      <TopBar title={s.profile} />
      <div className="mt-2">
        <button {...bindAction('profile.avatar.open', () => showToast(s.saved_success))} className="w-full h-20 bg-white px-4 flex items-center border-b"><span className="flex-1 text-left">{s.avatar}</span><span className="w-12 h-12 rounded-full bg-[#EDF2FF] flex items-center justify-center text-[#1C2E9C]"><IcDeer /></span><span className="ml-2">›</span></button>
        <UnavailableRow title={s.profile_username} trailing={<span className="text-xs text-[#888]">{s.nickname} ›</span>} />
        <UnavailableRow title={s.profile_gender} trailing={<span className="text-xs text-[#888]">{s.gender_female} ›</span>} />
        <UnavailableRow title={s.profile_lucky_day} trailing={<span className="text-xs text-[#1C2E9C]">{s.more} ›</span>} />
        <UnavailableRow title={s.profile_mobile} trailing={<span className="text-xs text-[#888]">+86 180****9152 ›</span>} />
        <Row title={s.address_manage} onClickProps={bindTap('profile.address-open')} />
      </div>
      <div className="mt-3"><UnavailableRow title={s.profile_account} /><UnavailableRow title={s.profile_payment} /><Row title={s.profile_general} onClickProps={bindTap('profile.settings-open')} /><UnavailableRow title={s.profile_agreement} /></div>
      <UnavailableButton className="mt-5 mx-3 block w-[calc(100%_-_24px)] h-11 rounded-full bg-[#1C2E9C] text-white">{s.logout}</UnavailableButton>
    </Page>
  );
}

export function MessagesListPage() {
  const s = useLuckinStrings();
  const { bindTap } = useLuckinGestures();
  const showToast = useLuckinStore((state) => state.showToast);
  const messages = [
    [s.coupon_banner, s.coupon_inflate_hint],
    [s.member_coupon_pack, s.member_coupon_pack_hint],
    [s.beans_expiring, s.bean_calendar],
    [s.welfare_team, s.welfare_days_left],
    [s.member_lucky_gift, s.member_lucky_gift_hint],
  ];
  return (
    <Page>
      <TopBar title={s.message_assistant} />
      <div className="px-3 py-4">
        {messages.map(([title, hint], index) => <div key={title} className="mb-4"><p className="text-center text-[10px] text-[#888]">2026-06-{21 - index * 2} 10:{index}4</p><button {...bindTap('messages.item-open', { beforeTrigger: () => showToast(s.saved_success) })} className="mt-2 w-full min-w-0 flex text-left"><div className="w-9 h-9 shrink-0 rounded-full bg-white text-[#1C2E9C] flex items-center justify-center"><IcDeer size={23} /></div><span className="ml-2 flex-1 min-w-0 rounded-lg bg-white p-3"><b className="block text-xs truncate whitespace-nowrap">{title}</b><small className="block mt-1 text-[#555] leading-4 line-clamp-2">{hint}</small></span></button></div>)}
      </div>
    </Page>
  );
}

export function WalletMainPage() {
  const s = useLuckinStrings();
  return <Page><TopBar title={s.wallet} /><div className="h-44 m-3 rounded-2xl bg-gradient-to-r from-[#1C2E9C] to-[#5875D9] text-white p-5"><p className="text-xs text-white/70">{s.wallet}</p><strong className="block text-4xl mt-4">¥0.00</strong><p className="text-xs mt-5 text-white/70">{s.wallet_empty}</p></div><UnavailableButton className="mx-3 block w-[calc(100%_-_24px)] h-11 rounded-full border border-[#1C2E9C] text-[#1C2E9C]">{s.recharge}</UnavailableButton></Page>;
}

export function InvoiceMainPage() {
  const s = useLuckinStrings();
  return <Page><TopBar title={s.invoice_title} /><Card className="m-3 p-5"><h2 className="font-semibold">{s.invoice_header}</h2><p className="text-xs text-[#888] mt-2">{s.invoice_header_hint}</p><UnavailableButton className="mt-5 h-10 px-5 rounded-full bg-[#1C2E9C] text-white">{s.invoice_add_header}</UnavailableButton></Card><Card className="mx-3 p-4 text-xs text-[#888] leading-6">{s.profile_agreement}<br />{s.payment_method}<br />{s.order_detail}</Card></Page>;
}

export function SettingsMainPage() {
  const s = useLuckinStrings();
  return <Page><TopBar title={s.settings} /><div className="mt-2"><UnavailableRow title={s.account_security} /><UnavailableRow title={s.notifications} /><UnavailableRow title={s.privacy} /><UnavailableRow title={s.settings_cache} trailing={<span className="text-xs text-[#999]">0 MB ›</span>} /><UnavailableRow title={s.about} /><UnavailableRow title={s.settings_version} trailing={<span className="text-xs text-[#999]">7.2.1</span>} /><UnavailableButton className="mt-3 w-full h-12 bg-white text-[#E3483D]">{s.logout}</UnavailableButton></div></Page>;
}
