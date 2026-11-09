import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as TimeService from '@/os/TimeService';
import { useAppStrings } from '@/os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { useTbsgStore } from '../state';
import { EmptyState, TopBar, showToast } from '../components/common';
import { IcDown } from '../res/icons';
import { expireText, fmt } from '../utils';
import type { TbCoupon } from '../types';

const FILTERS = [
  { id: 'all', label: '默认排序' },
  { id: 'platform', label: '平台红包' },
  { id: 'burst', label: '爆红包' },
  { id: 'item', label: '商品红包' },
  { id: 'shop', label: '店铺红包' },
] as const;

const TOOLS = ['历史红包', '兑换码', '天天爆红包', '天猫优惠'];

/** 红包卡券页(spec coupon.wallet,证据 IMG_6042) */
export default function CouponWalletPage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap } = useTbsgGestures();
  const [sp, setSp] = useSearchParams();

  const coupons = useTbsgStore((st) => st.coupons);
  const foodCard = useTbsgStore((st) => st.foodCard);

  const tab = sp.get('tab') ?? 'redpacket';
  const [filter, setFilter] = useState<string>('all');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const now = TimeService.now();
  const claimedCount = coupons.filter((c) => c.status === 'claimed').length;

  const tabs = [
    { id: 'redpacket', label: s.couponTabRedpacket, count: claimedCount },
    { id: 'bought', label: s.couponTabBought, count: null },
    { id: 'card', label: s.couponTabCard, count: foodCard.owned ? 1 : 0 },
  ];

  const owned = coupons.filter((c) => c.status !== 'unclaimed');
  const filtered = filter === 'all' ? owned : owned.filter((c) => c.type === filter);
  const rank = (c: TbCoupon) => (c.status === 'claimed' ? 0 : 1);
  const list = [...filtered].sort((a, b) => rank(a) - rank(b));

  const renderCoupon = (c: TbCoupon) => {
    const active = c.status === 'claimed';
    const nearExpire = active && c.expireAt - now > 0 && c.expireAt - now < 24 * 3600_000;
    const isOpen = !!expanded[c.id];
    return (
      <div key={c.id} className={`relative bg-white rounded-xl mx-3 mb-3 ${active ? '' : 'opacity-55'}`}>
        {nearExpire && (
          <span className="absolute top-0 right-0 rounded-tr-xl rounded-bl-lg bg-[#FDE7E3] text-[#EB493B] text-[11px] px-2 py-0.5">将到期</span>
        )}
        {!active && (
          <span className="absolute top-0 right-0 rounded-tr-xl rounded-bl-lg bg-[#F0F0F0] text-[#999999] text-[11px] px-2 py-0.5">
            {c.status === 'used' ? '已使用' : '已退回'}
          </span>
        )}
        <div className="flex items-center px-3 pt-4 pb-3">
          <span className="w-13 h-13 rounded-xl bg-[#FDEEE3] flex items-center justify-center text-[26px] shrink-0">🧧</span>
          <div className="ml-3 flex-1 min-w-0">
            <div className="text-[16px] font-semibold text-[#1A1A1A] truncate">{c.name}</div>
            <div className="text-[13px] text-[#EB493B] mt-1">{expireText(c.expireAt, now)}</div>
          </div>
          <div className="text-right shrink-0 mr-1">
            <div className="text-[#F53F3F] font-bold leading-none">
              <span className="text-[14px]">¥</span>
              <span className="text-[30px]">{fmt(c.amount)}</span>
            </div>
            <div className="text-[12px] text-[#999999] mt-1">满{fmt(c.threshold)}可用</div>
          </div>
        </div>
        <div className="border-t border-dashed border-[#EEEEEE] mx-3" />
        <div className="flex items-center px-3 py-2.5">
          <button
            {...bindTap<HTMLButtonElement>(
              { kind: 'action', id: 'coupon.condition.expand' },
              { params: { couponId: c.id }, onTrigger: () => setExpanded((prev) => ({ ...prev, [c.id]: !prev[c.id] })) },
            )}
            className="flex-1 min-w-0 flex items-center bg-transparent border-none cursor-pointer text-left"
          >
            <span className={`text-[12px] text-[#999999] ${isOpen ? '' : 'truncate'}`}>
              {isOpen
                ? `${c.scope};使用门槛=商品现价+打包费-所有店铺优惠;实付金额不低于0.01元`
                : `满${fmt(c.threshold)}元可用(使用门槛=商品现价+打包费-所有店铺优惠)`}
            </span>
            <IcDown size={13} className={`text-[#BBBBBB] shrink-0 ml-1 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
          {active && (
            <button
              {...bindTap<HTMLButtonElement>('coupon.use-open')}
              className="ml-2 h-9 px-4 rounded-full bg-[#EB493B] text-white text-[14px] font-semibold border-none cursor-pointer shrink-0"
            >
              {s.couponUse}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#F3F6F8]">
      <TopBar title={s.couponsTitle} />

      {/* tab:红包/已购券/卡 */}
      <div className="flex bg-white shrink-0 px-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            {...bindTap<HTMLButtonElement>(
              { kind: 'action', id: 'coupon.tab.select' },
              {
                params: { tab: t.id },
                onTrigger: () => setSp((p) => { p.set('tab', t.id); return p; }, { replace: true }),
              },
            )}
            className="flex-1 h-11 flex items-center justify-center bg-transparent border-none cursor-pointer relative"
          >
            <span className={`text-[16px] ${tab === t.id ? 'font-bold text-[#ED6C2C]' : 'text-[#1A1A1A]'}`}>
              {t.label}
              {t.count != null && <sup className="text-[11px] ml-0.5">{t.count}</sup>}
            </span>
            {tab === t.id && <span className="absolute bottom-1 w-6 h-1 rounded-full bg-[#ED6C2C]" />}
          </button>
        ))}
      </div>

      <div data-scroll-container="main" data-scroll-direction="vertical" className="flex-1 overflow-y-auto pt-3">
        {tab === 'redpacket' && (
          <>
            {/* 类型筛选胶囊 */}
            <div className="flex gap-2 px-3 pb-3">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  {...bindTap<HTMLButtonElement>(
                    { kind: 'action', id: 'coupon.filter.select' },
                    { params: { filter: f.id }, onTrigger: () => setFilter(f.id) },
                  )}
                  className={`h-8 px-2.5 rounded-lg text-[12px] border-none cursor-pointer flex items-center gap-0.5 ${
                    filter === f.id ? 'bg-[#FDEEE3] text-[#ED6C2C] font-semibold' : 'bg-[#E9EDF0] text-[#1A1A1A]'
                  }`}
                >
                  {f.label}
                  {f.id === 'all' && <IcDown size={12} />}
                </button>
              ))}
            </div>
            {list.length === 0 ? <EmptyState text={s.couponEmpty} /> : list.map(renderCoupon)}
          </>
        )}

        {tab === 'bought' && <EmptyState text="暂无已购券" />}

        {tab === 'card' && (
          foodCard.owned ? (
            <div className="mx-3 rounded-2xl p-5" style={{ background: 'linear-gradient(135deg,#F5D9A8 0%,#E8B96F 60%,#D99C4E 100%)' }}>
              <div className="flex items-center gap-2">
                <span className="text-[24px]">👑</span>
                <span className="text-[19px] font-bold text-[#3D2B00]">超级吃货卡</span>
              </div>
              <div className="mt-3 text-[14px] text-[#6B4A10]">{foodCard.count}张可用 · 31天内有效</div>
              <div className="mt-1 text-[12px] text-[#8A6A30]">每单最高抵5元,外卖商家通用</div>
            </div>
          ) : (
            <EmptyState text="暂无卡" />
          )
        )}
      </div>

      {/* 底部工具栏 */}
      <div className="shrink-0 bg-white flex items-center py-3">
        {TOOLS.map((t, i) => (
          <React.Fragment key={t}>
            {i > 0 && <span className="w-px h-4 bg-[#EEEEEE]" />}
            <button
              {...bindTap<HTMLButtonElement>(
                { kind: 'action', id: 'coupon.tools.stub' },
                { onTrigger: () => showToast(s.notOpen) },
              )}
              className="flex-1 text-[14px] text-[#1A1A1A] bg-transparent border-none cursor-pointer"
            >
              {t}
            </button>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
