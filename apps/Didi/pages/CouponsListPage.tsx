import React from 'react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStrings } from '../hooks/useDidiStrings';
import { useDidiStore } from '../state';
import { TopBar, C } from '../components/ui';
import type { DidiState } from '../types';

/** 优惠券 —— 证据 s19、s20、n14(segmented+分类chips+橙banner+券卡列表+底部四入口)。 */

type Cat = DidiState['couponsCat'];

export default function CouponsListPage() {
  const { bindTap } = useDidiGestures();
  const s = useDidiStrings();
  const toast = useDidiStore((s) => s.toast);
  const coupons = useDidiStore((s) => s.coupons);
  const couponSheetCount = useDidiStore((s) => s.user.couponCount);
  const couponsCat = useDidiStore((s) => s.couponsCat);
  const setCouponsCat = useDidiStore((s) => s.setCouponsCat);
  const setPlaceSearchTarget = useDidiStore((s) => s.setPlaceSearchTarget);
  const recordCouponViewed = useDidiStore((s) => s.recordCouponViewed);
  const cats: { id: Cat; label: string }[] = [
    { id: 'all', label: s.all },
    { id: 'travel', label: s.categoryTravel },
    { id: 'owner', label: s.couponCategoryOwner },
    { id: 'delivery', label: s.couponCategoryDelivery },
    { id: 'finance', label: s.couponCategoryFinance },
  ];

  const countOf = (cat: Cat) =>
    cat === 'all' ? coupons.length : coupons.filter((c) => c.category === cat).length;
  const shown = couponsCat === 'all' ? coupons : coupons.filter((c) => c.category === couponsCat);

  const catBind = (cat: Cat) =>
    bindTap(
      { kind: 'action', id: 'coupons.list.tab' },
      { onTrigger: () => setCouponsCat(cat), params: { cat } },
    );

  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
      <TopBar
        title={
          /* ① segmented:优惠券(高亮)/出行卡 */
          <span className="inline-flex items-center gap-5">
            <span className="relative font-semibold text-app-text">
              {s.coupons}
              <span
                className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-5 h-[3px] rounded-full"
                style={{ background: C.orange }}
              />
            </span>
            <button
              onClick={() => toast(s.unavailable)}
              className="bg-transparent border-none p-0 font-normal text-app-text-muted text-[15px]"
            >
              {s.travelCard}
            </button>
          </span>
        }
        right={
          <button
            onClick={() => toast(s.unavailable)}
            className="bg-transparent border-none text-[12px] text-app-text-muted whitespace-nowrap pr-2"
          >
            {s.useRules}
          </button>
        }
      />

      {/* ② 分类 chips */}
      <div className="flex items-center gap-1 px-3 py-2 shrink-0 overflow-x-auto">
        {cats.map((c) => (
          <button
            key={c.id}
            {...catBind(c.id)}
            className="bg-transparent border-none px-2 py-1 text-[14px] shrink-0 whitespace-nowrap"
            style={{
              color: couponsCat === c.id ? C.orangeDeep : '#666',
              fontWeight: couponsCat === c.id ? 700 : 400,
            }}
          >
            {c.label}({countOf(c.id)})
          </button>
        ))}
      </div>
      <div
        className="shrink-0 px-4 pb-2 text-[11px] text-app-text-muted"
        data-testid="didi-coupon-count-summary"
      >
        {s.couponSummary
          .replace('{packages}', String(coupons.length))
          .replace('{count}', String(couponSheetCount))}
      </div>

      <div
        className="flex-1 overflow-y-auto px-3"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* ③ 橙色赠券 banner */}
        <button
          onClick={() => toast(s.unavailable)}
          className="w-full flex items-center rounded-xl px-4 py-3 border-none text-left mb-3 text-white"
          style={{ background: `linear-gradient(90deg,${C.orangeDeep},${C.orange})` }}
        >
          <span className="text-[22px] font-black mr-3">¥7</span>
          <span className="flex-1 min-w-0">
            <span className="block text-[14px] font-semibold truncate">🎫 {s.couponBannerTitle}</span>
            <span className="block text-[11px] opacity-90">{s.couponBannerHint}</span>
          </span>
          <span className="bg-white rounded-full px-3 py-1 text-[12px] font-medium shrink-0" style={{ color: C.orangeDeep }}>
            {s.couponView}
          </span>
        </button>

        {/* ④ 券列表 */}
        <div className="flex flex-col gap-3 pb-4">
          {shown.map((cp) => (
            <div
              key={cp.id}
              className="flex items-center bg-app-surface rounded-xl px-4 py-4"
              style={{ opacity: cp.usable ? 1 : 0.45 }}
            >
              <div className="w-20 shrink-0 text-center">
                <div className="text-[24px] font-black leading-tight" style={{ color: C.orangeDeep }}>
                  {cp.amountText}
                </div>
                {cp.count != null && (
                  <div className="text-[10px] mt-0.5" style={{ color: C.orangeDeep }}>
                    {s.couponRemaining.replace('{count}', String(cp.count))}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 px-2">
                <div className="text-[15px] font-bold text-app-text truncate">{cp.title}</div>
                <div className="text-[11px] text-app-text-muted mt-1 truncate">{cp.condition}</div>
                <div className="text-[11px] text-app-text-muted mt-0.5 truncate">{cp.expire}{s.couponExpires}</div>
              </div>
              <button
                {...bindTap('coupons.toRide', {
                  params: { id: cp.id },
                  beforeTrigger: () => {
                    recordCouponViewed(cp.id);
                    setPlaceSearchTarget('destination');
                    toast(s.couponAutoApply);
                  },
                })}
                disabled={!cp.usable}
                className="border-none rounded-full px-3.5 py-1.5 text-[13px] shrink-0 disabled:opacity-50"
                style={{ background: '#FFEFE5', color: C.orangeDeep }}
              >
                {s.couponUseNow}
              </button>
            </div>
          ))}
          {shown.length === 0 && (
            <div className="text-center text-[13px] text-app-text-muted py-12">{s.couponUnavailable}</div>
          )}
        </div>
      </div>

      {/* ⑤ 底部四等分 */}
      <div className="shrink-0 flex bg-app-surface border-t border-app-border py-2.5">
        {[s.couponBuy, s.couponClaim, s.couponSavings, s.couponExchange].map((t, i) => (
          <button
            key={t}
            onClick={() => toast(s.unavailable)}
            className={`flex-1 bg-transparent border-none text-[13px] text-app-text ${
              i === 0 ? '' : 'border-l border-app-border'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
