import React from 'react';
import { useLocation } from 'react-router-dom';
import { Card, EmptyState, Page, PrimaryButton, ProductArt, Sheet, TopBar, UnavailableButton } from '../components/ui';
import { useLuckinGestures } from '../hooks/useLuckinGestures';
import { useLuckinCoupons, useLuckinProducts } from '../hooks/useLuckinData';
import { useLuckinStrings } from '../hooks/useLuckinStrings';
import { IcCheck, IcCoffee, IcCrown, IcDeer } from '../res/icons';
import { useLuckinStore } from '../state';

function RedeemPanel() {
  const s = useLuckinStrings();
  const { bindAction, back } = useLuckinGestures();
  const code = useLuckinStore((state) => state.inputs.redeem ?? '');
  const agreed = useLuckinStore((state) => Boolean(state.flags.memberAgree));
  const setInput = useLuckinStore((state) => state.setInput);
  const toggleFlag = useLuckinStore((state) => state.toggleFlag);
  const activate = useLuckinStore((state) => state.activateMember);
  const showToast = useLuckinStore((state) => state.showToast);
  return (
    <Sheet title={s.redeem_code}>
      <div className="p-5">
        <div className="w-20 h-20 rounded-full bg-[#EEF2FF] text-[#1C2E9C] flex items-center justify-center mx-auto"><IcCrown size={42} /></div>
        <input data-action="memberRedeem.code.input" value={code} onChange={(event) => setInput('redeem', event.target.value)} placeholder={s.redeem_hint} className="mt-6 w-full h-12 rounded-xl bg-[#F5F5F5] px-4 outline-none text-sm" />
        <button {...bindAction('memberRedeem.agree.toggle', () => toggleFlag('memberAgree'))} className="mt-4 flex items-center text-xs text-[#666]">
          <span className={`w-4 h-4 mr-2 rounded border flex items-center justify-center ${agreed ? 'bg-[#1C2E9C] text-white' : ''}`}>{agreed ? '✓' : ''}</span>{s.agree_terms}
        </button>
        <PrimaryButton disabled={!code || !agreed} props={bindAction('memberRedeem.form.submit', () => { activate(); showToast(s.claimed_success); back(); })}><span className="px-20">{s.redeem_now}</span></PrimaryButton>
      </div>
    </Sheet>
  );
}

export function MemberCardPage() {
  const s = useLuckinStrings();
  const location = useLocation();
  const { bindAction, bindTap } = useLuckinGestures();
  const active = useLuckinStore((state) => state.memberActive);
  const setSearch = useLuckinGestures().setSearch;
  const allProducts = useLuckinProducts();
  const products = allProducts.slice(0, 6);
  return (
    <Page className="pb-20 bg-[#F3F4F7]">
      <div className="bg-white px-4 pt-4 pb-3 flex items-end">
        <h1 className="flex-1 text-xl font-bold text-[#1C2E9C]">{s.member_title}</h1>
        <UnavailableButton className="text-center text-[10px] text-[#1C2E9C]"><span className="block text-xl leading-4">•••</span>{s.more_features}</UnavailableButton>
      </div>
      <div className="bg-white grid grid-cols-3 border-t border-[#F0F0F0]">
        {products.map((product) => (
          <button key={product.id} {...bindTap('member.use-open')} className="h-[118px] border-r border-b border-[#EEE] p-2 text-left relative">
            <span className="text-[9px] bg-[#F6E7C9] px-1">{s.member_price}</span>
            <strong className="block text-base mt-1">¥{product.price}</strong>
            <div className="absolute right-1 bottom-1"><ProductArt product={product} size={58} /></div>
          </button>
        ))}
      </div>
      <div className="p-3">
        <button {...bindTap('member.use-open')} className="w-full h-24 rounded-xl bg-gradient-to-r from-[#183D9D] via-[#4262C9] to-[#A12029] text-white p-4 text-left">
          <b className="text-lg">{s.member_coupon_pack}</b>
          <p className="text-xs text-white/80 mt-1">{s.member_coupon_pack_hint}</p>
        </button>
        <button {...bindTap('member.level-open')} className="mt-3 w-full h-14 rounded-xl bg-white px-4 flex items-center text-left"><span className="w-9 h-9 rounded-full bg-[#EAF2FF] text-[#1C2E9C] flex items-center justify-center"><IcDeer /></span><span className="ml-3 flex-1"><b className="block text-sm">Lv1 {s.member_level}</b><small className="text-[#888]">462 {s.beans}</small></span><span>›</span></button>
        <Card className="mt-3 p-4">
          <div className="flex items-center">
            <div className="flex-1"><b>{s.member_monthly}</b><p className="text-[10px] text-[#888] mt-1">{s.member_monthly_hint}</p></div>
            <button {...bindAction('member.redeem.open', () => setSearch({ redeem: '1' }))} className="text-xs text-[#1C2E9C]">{s.redeem_code} ›</button>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button {...bindTap('member.use-open')} className="h-20 rounded-xl border-2 border-[#1C2E9C] bg-[#F4F6FF] text-left px-4"><b className="block text-sm">{s.member_monthly} ¥9.90</b><small className="block text-[10px] text-[#777] mt-1">{s.member_expiry}</small></button>
            <button {...bindTap('member.use-open')} className="h-20 rounded-xl border bg-white text-left px-4"><b className="block text-sm">{s.member_month_card} ¥15.90</b><small className="block text-[#AAA] line-through mt-1">¥19.90</small></button>
          </div>
          <button {...bindTap('member.use-open')} className="mt-4 w-full h-12 rounded-full bg-[#09268F] text-white font-semibold">{active ? s.member_use : s.member_monthly} ¥9.90</button>
          <p className="mt-3 text-[10px] text-[#777] flex items-center"><span className="w-4 h-4 rounded-full border border-[#1C2E9C] mr-2" />{s.agree_terms}</p>
        </Card>
      </div>
      {new URLSearchParams(location.search).get('redeem') === '1' && <RedeemPanel />}
    </Page>
  );
}

export function MemberLevelPage() {
  const s = useLuckinStrings();
  const { bindAction, bindTap } = useLuckinGestures();
  const rules = useLuckinStore((state) => Boolean(state.flags.levelRules));
  const toggleFlag = useLuckinStore((state) => state.toggleFlag);
  const benefits = [
    [s.member_coupon_pack, s.member_coupon_pack_hint],
    [s.member_lucky_gift, s.member_lucky_gift_hint],
    [s.member_lucky, s.member_lucky_hint],
  ];
  return (
    <Page className="bg-[#EEF4FF]">
      <div className="h-64 px-4 pt-3 text-white bg-gradient-to-b from-[#0874F4] to-[#5EA5F2] relative overflow-hidden">
        <div className="flex items-center"><button {...bindTap('system.back')} className="text-2xl">‹</button><span className="ml-auto text-xs">{s.member_rules}</span></div>
        <p className="mt-5 text-sm">Lv1 {s.member_level}</p>
        <p className="text-[10px] text-white/75 mt-1">{s.member_expiry}</p>
        <div className="mt-5 flex items-center"><strong className="text-2xl">462</strong><span className="ml-1 text-xs">{s.beans}</span><span className="ml-auto text-xs">Lv1</span></div>
        <div className="h-1.5 bg-white/30 rounded-full mt-2"><div className="h-full w-[70%] bg-white rounded-full" /></div>
        <div className="absolute -right-8 bottom-1 w-40 h-40 rounded-full bg-white"><IcDeer size={92} className="text-[#1C67D8] m-6" /></div>
      </div>
      <div className="-mt-5 relative px-3 pb-5">
        <Card className="p-4">
          <div className="flex items-center"><h2 className="font-semibold flex-1">{s.benefits}</h2><button {...bindAction('level.rules.toggle', () => toggleFlag('levelRules'))} className="text-[10px] text-[#888]">{s.bean_rules} ›</button></div>
          {benefits.map(([title, hint], index) => (
            <UnavailableButton key={title} className="w-full py-4 flex items-center text-left border-b last:border-0">
              <span className={`w-12 h-12 rounded-xl flex items-center justify-center ${index === 0 ? 'bg-[#FFF0E5] text-[#EE6B32]' : index === 1 ? 'bg-[#EDF4FF] text-[#4775D9]' : 'bg-[#F4EEFF] text-[#7253BD]'}`}><IcCrown /></span>
              <span className="ml-3 flex-1"><b className="block text-sm">{title}</b><small className="text-[#888]">{hint}</small></span><span>›</span>
            </UnavailableButton>
          ))}
          <button {...bindTap('level.beans-open')} className="w-full mt-2 h-11 rounded-full border border-[#1C2E9C] text-[#1C2E9C]">{s.beans_detail}</button>
          {rules && <p className="mt-3 text-[10px] leading-5 text-[#777]">{s.member_monthly_hint}</p>}
        </Card>
      </div>
    </Page>
  );
}

export function MemberBeansPage() {
  const s = useLuckinStrings();
  const { bindAction } = useLuckinGestures();
  const tab = useLuckinStore((state) => state.selections.beansTab ?? 'all');
  const setSelection = useLuckinStore((state) => state.setSelection);
  const records = [
    ['2026-06-20 09:32:58', '+111'],
    ['2026-06-12 09:07:34', '+123'],
    ['2026-05-29 10:55:00', '-235'],
    ['2026-05-21 11:07:22', '+99'],
    ['2026-05-18 11:17:57', '+129'],
  ];
  return (
    <Page>
      <TopBar title={s.beans_detail} />
      <div className="bg-white h-12 flex">{[['all',s.beans_all_records],['income',s.beans_income],['expense',s.beans_expense]].map(([id,label]) => <button key={id} {...bindAction('beans.tab.select.target', () => setSelection('beansTab', id), { target: id })} className={`flex-1 text-xs ${tab === id ? 'text-[#1C2E9C] border-b-2 border-[#1C2E9C]' : ''}`}>{label}</button>)}</div>
      <div className="p-3">
        {records.filter(([, amount]) => tab === 'all' || (tab === 'income' ? amount.startsWith('+') : amount.startsWith('-'))).map(([date, amount], index) => (
          <Card key={date} className="mb-3 p-4 flex items-center">
            <span className="flex-1"><b className="block">{index === 2 ? s.beans_expiring : s.order_detail}</b><small className="text-[#999]">{date}</small></span>
            <strong className="text-xl">{amount} <small className="text-sm">{s.beans}</small></strong>
          </Card>
        ))}
      </div>
    </Page>
  );
}

export function CouponsMinePage() {
  const s = useLuckinStrings();
  const { bindAction, bindTap } = useLuckinGestures();
  const coupons = useLuckinCoupons();
  const tab = useLuckinStore((state) => state.selections.couponTab ?? 'drink');
  const setSelection = useLuckinStore((state) => state.setSelection);
  const toggleFlag = useLuckinStore((state) => state.toggleFlag);
  const showToast = useLuckinStore((state) => state.showToast);
  const filtered = tab === 'drink' ? coupons.filter((coupon) => coupon.kind === 'drink') : [];
  return (
    <Page>
      <TopBar title={s.my_coupons} right={<button {...bindTap('coupons.center-open')} className="text-[10px] text-[#1C2E9C]">{s.coupon_center}</button>} />
      <div className="bg-[#1D36A6] p-1 flex text-white">{[['drink',s.coupon_drink],['instant',s.coupon_food],['bought',s.coupon_delivery]].map(([id,label]) => <button key={id} {...bindAction('coupons.tab.select.target', () => setSelection('couponTab', id), { target: id })} className={`flex-1 h-8 rounded-full text-xs ${tab === id ? 'bg-white text-[#1C2E9C]' : ''}`}>{label}</button>)}</div>
      <div className="p-3">
        {tab !== 'drink' && <EmptyState title={s.cart_empty} hint={s.go_for_cup} />}
        {filtered.map((coupon, index) => (
          <Card key={coupon.id} className={`mb-3 overflow-hidden ${index === 0 ? 'ring-2 ring-[#76B7F5]' : ''}`}>
            <div className="p-4 flex bg-white">
              <div className="w-20"><strong className="text-[#F05A36] text-2xl">{coupon.amount}</strong><small className="text-[#F05A36]"> {s.unit_yuan}</small><p className="text-[9px] text-[#999]">{s.coupon_use_scope}</p></div>
              <span className="flex-1 min-w-0"><b className="text-sm">{coupon.title}</b><small className="block text-[#999] mt-1">{coupon.threshold} · {coupon.expiry}</small></span>
              <button {...bindTap('coupons.use-open')} className="self-center px-3 py-1.5 rounded-full bg-[#EF5A3C] text-white text-xs">{s.coupon_use}</button>
            </div>
            <div className="h-10 px-4 bg-[#FFF7F1] flex items-center">
              <button {...bindAction('coupons.inflate.run', () => showToast(s.claimed_success))} className="text-xs text-[#E05A42]">{s.inflate}</button>
              <span className="ml-2 text-[9px] text-[#AAA]">{s.coupon_inflate_hint}</span>
              <button {...bindAction('coupons.remind.set', () => toggleFlag(`remind-${coupon.id}`))} className="ml-auto text-xs text-[#777]">{s.coupon_notice}</button>
            </div>
          </Card>
        ))}
        <button {...bindTap('coupons.center-open')} className="w-full h-12 rounded-full bg-[#1C2E9C] text-white">{s.coupon_center}</button>
      </div>
    </Page>
  );
}

export function CouponsCenterPage() {
  const s = useLuckinStrings();
  const { bindAction, bindTap } = useLuckinGestures();
  const coupons = useLuckinCoupons();
  const claim = useLuckinStore((state) => state.claimCoupon);
  const showToast = useLuckinStore((state) => state.showToast);
  return (
    <Page>
      <TopBar title={s.welfare_center} />
      <div className="px-3 py-2 text-xs text-[#777]">{s.welfare_limited}</div>
      <div className="px-3 pb-4">
        <Card className="p-3 flex items-center"><div className="w-20 h-12 rounded-lg bg-[#1C2E9C] text-white flex items-center justify-center"><IcCrown /></div><div className="ml-3 flex-1"><b>{s.member_monthly} ¥9.9</b><p className="text-[10px] text-[#888]">{s.member_coupon_pack_hint}</p></div><button {...bindAction('couponsCenter.claim.run', () => showToast(s.claimed_success))} className="px-3 py-1.5 rounded-full bg-[#1C2E9C] text-white text-xs">{s.claim}</button></Card>
        {[0, 1].map((index) => (
          <Card key={index} className="mt-3 overflow-hidden">
            <div className="p-4 flex"><div className="flex-1"><b className="text-sm">{s.welfare_team}</b><p className="text-[10px] text-[#888] mt-1">{s.welfare_team_hint}</p></div><div className="w-16 h-16 rounded-full border-4 border-[#A8B9E5] flex items-center justify-center text-[#1C2E9C]"><IcDeer size={36} /></div></div>
            <div className="px-4 pb-4"><p className="text-[10px] text-[#777]">{s.welfare_progress}</p><div className="h-1.5 bg-[#EEE] rounded-full mt-2"><div className="h-full w-[12%] bg-[#1C2E9C] rounded-full" /></div><div className="flex items-center mt-3"><small className="text-[#999]">{s.welfare_days_left}</small><button {...bindAction('couponsCenter.claim.run', () => { const coupon = coupons[index]; if (coupon) claim(coupon.id); showToast(s.claimed_success); })} className="ml-auto px-4 py-1 rounded-full border border-[#1C2E9C] text-[#1C2E9C] text-xs">{s.go_for_cup}</button></div></div>
          </Card>
        ))}
        <div className="mt-4 flex justify-center"><PrimaryButton props={bindTap('couponsCenter.menu-open')}><span className="px-14">{s.go_for_cup}</span></PrimaryButton></div>
      </div>
    </Page>
  );
}

function EmptyArtwork() {
  return <div className="w-44 h-32 relative"><div className="absolute inset-x-2 bottom-2 h-16 rounded-[50%] bg-[#EAF0FF]" /><div className="absolute left-16 top-3 w-16 h-24 rounded-t-full bg-[#6C8FE8]"><IcDeer size={44} className="text-white m-3" /></div><div className="absolute left-3 bottom-2 w-10 h-14 rounded bg-[#BFD0F7]" /></div>;
}

export function CardCoffeePage() {
  const s = useLuckinStrings();
  const { bindAction } = useLuckinGestures();
  const showInvalid = useLuckinStore((state) => Boolean(state.flags.cardInvalid));
  const toggleFlag = useLuckinStore((state) => state.toggleFlag);
  return (
    <Page className="pb-20 bg-white">
      <TopBar title={s.coffee_card} right={<span className="text-[9px] text-[#777]">{s.view_invalid}</span>} />
      <div className="min-h-[560px] flex flex-col items-center pt-24 text-center"><EmptyArtwork /><p className="mt-4 text-xs text-[#888]">{s.coffee_card_empty}</p><p className="text-[10px] text-[#AAA] mt-1">{s.coffee_card_empty_hint}</p></div>
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-white border-t flex gap-2">
        <UnavailableButton className="h-10 flex-1 rounded-full border border-[#1C2E9C] text-[#1C2E9C] text-xs">{s.coffee_card_send}</UnavailableButton>
        <UnavailableButton className="h-10 flex-1 rounded-full border border-[#1C2E9C] text-[#1C2E9C] text-xs">{s.coffee_card_red_packet}</UnavailableButton>
        <UnavailableButton className="h-10 flex-1 rounded-full bg-[#1C2E9C] text-white text-xs">{s.coffee_card_buy}</UnavailableButton>
      </div>
      <button {...bindAction('cardCoffee.invalid.toggle', () => toggleFlag('cardInvalid'))} className="hidden">{showInvalid ? s.done : s.view_invalid}</button>
    </Page>
  );
}

export function CardGiftPage() {
  const s = useLuckinStrings();
  const { bindAction } = useLuckinGestures();
  const expanded = useLuckinStore((state) => Boolean(state.flags.giftHistory));
  const toggleFlag = useLuckinStore((state) => state.toggleFlag);
  return (
    <Page className="pb-20 bg-white">
      <TopBar title={s.gift_card} right={<button {...bindAction('cardGift.history.toggle', () => toggleFlag('giftHistory'))} className="text-[10px]">{s.gift_card_history}</button>} />
      <div className="min-h-[590px] flex flex-col items-center pt-24 text-center"><EmptyArtwork /><p className="mt-4 text-xs text-[#888]">{expanded ? s.gift_history : s.gift_card_empty}</p></div>
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-white"><UnavailableButton className="w-full h-11 rounded-full bg-[#1C2E9C] text-white">{s.gift_card_customize}</UnavailableButton></div>
    </Page>
  );
}

export function AllianceMainPage() {
  const s = useLuckinStrings();
  const { bindAction } = useLuckinGestures();
  const tab = useLuckinStore((state) => state.selections.allianceTab ?? 'finance');
  const setSelection = useLuckinStore((state) => state.setSelection);
  const tabs = [['finance',s.alliance_finance],['aviation',s.alliance_aviation],['life',s.alliance_lifestyle]];
  return (
    <Page>
      <TopBar title={s.alliance} />
      <div className="h-40 bg-gradient-to-r from-[#273997] to-[#D6DDFB] p-4 text-white"><b className="text-xl">{s.alliance_bank}</b><p className="text-xs mt-2">{s.alliance_bank_hint}</p><UnavailableButton className="mt-4 px-4 py-1.5 rounded-full bg-white text-[#1C2E9C] text-xs">{s.alliance_view}</UnavailableButton></div>
      <div className="bg-white h-14 flex">{tabs.map(([id,label]) => <button key={id} {...bindAction('alliance.tab.select.target', () => setSelection('allianceTab', id), { target: id })} className={`flex-1 text-xs ${tab === id ? 'text-[#1C2E9C] border-b-2 border-[#1C2E9C]' : ''}`}>{label}</button>)}</div>
      <div className="p-3 space-y-3">{[0,1,2].map((index) => <UnavailableButton key={index} className="w-full h-28 rounded-xl bg-white flex items-center p-4 text-left"><div className="w-16 h-16 rounded-lg bg-[#EEF2FF] flex items-center justify-center text-[#1C2E9C]"><IcCrown size={36} /></div><span className="ml-4 flex-1"><b className="block">{s.alliance_bank}</b><small className="text-[#888]">{s.alliance_bank_hint}</small></span><span>›</span></UnavailableButton>)}</div>
    </Page>
  );
}

export function CalendarMainPage() {
  const s = useLuckinStrings();
  const { bindAction, bindTap } = useLuckinGestures();
  const month = useLuckinStore((state) => state.selections.calendarMonth ?? '6');
  const setSelection = useLuckinStore((state) => state.setSelection);
  return (
    <Page>
      <TopBar title={s.calendar} />
      <div className="h-36 bg-gradient-to-r from-[#1A3E9E] to-[#E22D36] p-5 text-white"><b className="text-xl">{s.bean_calendar}</b><p className="text-xs mt-2">{s.member_coupon_pack_hint}</p></div>
      <div className="p-3">
        <div className="flex items-center"><button {...bindAction('calendar.month.select.target', () => setSelection('calendarMonth', String(Math.max(1, Number(month) - 1))), { target: 'prev' })}>‹</button><h2 className="flex-1 text-center font-semibold">2026 · {month}</h2><button {...bindAction('calendar.month.select.target', () => setSelection('calendarMonth', String(Math.min(12, Number(month) + 1))), { target: 'next' })}>›</button></div>
        <Card className="mt-3 p-3 grid grid-cols-7 gap-1 text-center text-xs">{Array.from({ length: 35 }).map((_, i) => <span key={i} className={`h-9 flex items-center justify-center rounded-full ${i === 15 ? 'bg-[#1C2E9C] text-white' : ''}`}>{i < 4 ? '' : i - 3}</span>)}</Card>
        <button {...bindTap('calendar.gift-open')} className="mt-3 w-full rounded-xl bg-[#FFF1E6] p-4 flex items-center text-left"><IcCoffee className="text-[#1C2E9C]" /><span className="ml-3 flex-1"><b>{s.calendar_gift}</b><small className="block text-[#888]">{s.member_lucky_gift_hint}</small></span><span>›</span></button>
      </div>
    </Page>
  );
}
