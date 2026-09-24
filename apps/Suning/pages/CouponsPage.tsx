import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Img from '../components/Img';
import { IcNavBack, IcMore, IcChevronRight } from '../res/icons';
import { useSuningGestures } from '../hooks/useSuningGestures';
import { useSuningStore } from '../state';
import { useStrings } from '../i18n';

const EMPTY_LION = '/@app-assets/Suning/me/empty-lion.png';

/**
 * 我的卡券包(spec me.coupons,a354)。
 * ?tab=yigou|finance(v1.9.0);「去使用」→ search.results 带 useKeyword(Q23=B)。
 */
export default function CouponsPage() {
  const { bindTap, action, bindBack } = useSuningGestures();
  const S = useStrings();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'finance' ? 'finance' : 'yigou';

  const coupons = useSuningStore((s) => s.coupons);
  const user = useSuningStore((s) => s.user);
  const showToast = useSuningStore((s) => s.showToast);
  const wontfix = () => showToast(S.toastNotOpen);

  const yigou = coupons.yigou;

  return (
    <div className="flex h-full flex-col bg-[var(--app-bg)]">
      <div className="flex shrink-0 items-center gap-1 bg-gradient-to-b from-[var(--app-primary)] to-[var(--app-primary-dark)] px-2 pb-2 pt-10">
        <button {...bindBack()} className="cursor-pointer border-none bg-transparent p-1 text-white">
          <IcNavBack size={24} />
        </button>
        <span className="min-w-0 flex-1 text-center text-[16px] font-bold text-white">
          {S.couponsTitle}
        </span>
        <button
          {...action('me.coupons.wontfix.toast', wontfix)}
          className="shrink-0 cursor-pointer border-none bg-transparent p-1 text-white"
        >
          <IcMore size={20} />
        </button>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 pb-6 pt-2"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <div className="rounded-xl bg-[var(--app-surface)] px-3 py-3">
          <div className="grid grid-cols-3 gap-2">
            <StatCell value={yigou.length} label={S.couponsCount} />
            <StatCell
              value={coupons.redpacket.length}
              label={S.couponsRedpacket}
              onTap={wontfix}
            />
            <StatCell value={user.yunzuan} label={S.meDataYunzuan} onTap={wontfix} />
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 border-t border-[var(--app-border)] pt-2">
            <StatCell value={coupons.lijin} label={S.couponsLijin} onTap={wontfix} small />
            <StatCell value="-" label={S.couponsZhenhuibu} onTap={wontfix} small />
            <StatCell value="-" label={S.couponsGovQual} onTap={wontfix} small />
          </div>
        </div>

        <button
          {...action('me.coupons.wontfix.toast', wontfix)}
          className="mt-2 flex w-full cursor-pointer items-center justify-between rounded-xl border-none bg-[var(--app-surface)] px-3 py-2.5 text-left text-[12px] text-[var(--app-text-muted)]"
        >
          {S.couponsFoldHint}
          <IcChevronRight size={14} className="text-[#CCC]" />
        </button>

        <div className="mt-2 flex items-center rounded-t-xl bg-[var(--app-surface)] px-3 pt-2">
          <button
            {...action('me.coupons.select.yigou', () =>
              setSearchParams({ tab: 'yigou' }, { replace: true }),
            )}
            className={`mr-4 cursor-pointer border-none bg-transparent pb-2 text-[14px] ${
              tab === 'yigou'
                ? 'border-b-2 border-[var(--app-primary)] font-bold text-[var(--app-primary)]'
                : 'text-[var(--app-text-muted)]'
            }`}
          >
            {S.couponsTabYigou}
          </button>
          <button
            {...action('me.coupons.select.finance', () =>
              setSearchParams({ tab: 'finance' }, { replace: true }),
            )}
            className={`mr-4 cursor-pointer border-none bg-transparent pb-2 text-[14px] ${
              tab === 'finance'
                ? 'border-b-2 border-[var(--app-primary)] font-bold text-[var(--app-primary)]'
                : 'text-[var(--app-text-muted)]'
            }`}
          >
            {S.couponsTabFinance}
          </button>
          <span className="min-w-0 flex-1" />
          <button
            {...action('me.coupons.wontfix.toast', wontfix)}
            className="cursor-pointer border-none bg-transparent pb-2 text-[12px] text-[var(--app-c-text-muted)]"
          >
            {S.couponsMore}
          </button>
        </div>

        <div className="rounded-b-xl bg-[var(--app-surface)] px-2.5 pb-3">
          {tab === 'finance' ? (
            <div className="flex flex-col items-center py-12">
              <span className="h-24 w-24 overflow-hidden">
                <Img src={EMPTY_LION} className="h-full w-full object-contain" />
              </span>
              <span className="mt-2 text-[14px] text-[var(--app-text-muted)]">{S.couponsFinanceEmpty}</span>
            </div>
          ) : (
            yigou.map((c) => (
              <div
                key={c.id}
                className="relative mt-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#FFF7F0] to-[#FFE8D6]"
              >
                <div className="flex items-stretch">
                  <div className="flex w-[88px] shrink-0 flex-col items-center justify-center border-r border-dashed border-[#F5C9A0] px-2 py-3">
                    <span className="text-[22px] font-bold leading-none text-[var(--app-c-danger)]">
                      <span className="text-[12px]">¥</span>
                      {c.amountYuan}
                    </span>
                    <span className="mt-1 text-[10px] text-[var(--app-c-text-muted)]">
                      {S.couponsFull}
                      {c.thresholdYuan}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      <span className="text-[13px] font-bold text-[var(--app-text)]">{c.title}</span>
                      <span className="rounded bg-[var(--app-primary)] px-1 text-[9px] text-white">{c.tag}</span>
                    </div>
                    <div className="mt-0.5 text-[10px] text-[var(--app-c-text-muted)]">{c.validText}</div>
                    <button
                      {...action('me.coupons.wontfix.toast', wontfix)}
                      className="mt-1 cursor-pointer border-none bg-transparent p-0 text-[10px] text-[var(--app-text-muted)]"
                    >
                      {S.couponsRules}
                    </button>
                    <div className="mt-1 flex items-end justify-between gap-2">
                      <span className="min-w-0 flex-1 truncate text-[10px] text-[var(--app-c-text-muted)]">
                        {c.scopeText}
                      </span>
                      <button
                        {...bindTap('me.coupons.use.open', {
                          params: { keyword: c.useKeyword },
                        })}
                        className="shrink-0 cursor-pointer rounded-full border-none bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-dark)] px-3 py-1 text-[11px] font-bold text-white"
                      >
                        {S.couponsUse}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <button
          {...action('me.coupons.wontfix.toast', wontfix)}
          className="mt-3 w-full cursor-pointer rounded-xl border-none bg-[var(--app-surface)] py-3 text-[13px] text-[var(--app-primary)]"
        >
          {S.couponsCenterBanner}
        </button>
      </div>
    </div>
  );
}

function StatCell({
  value,
  label,
  onTap,
  small,
}: {
  value: number | string;
  label: string;
  onTap?: () => void;
  small?: boolean;
}) {
  const { action } = useSuningGestures();
  if (onTap) {
    return (
      <button
        {...action('me.coupons.wontfix.toast', onTap)}
        className="flex cursor-pointer flex-col items-center border-none bg-transparent p-0"
      >
        <span className={`font-bold text-[var(--app-text)] ${small ? 'text-[13px]' : 'text-[18px]'}`}>
          {value}
        </span>
        <span className="mt-0.5 text-[10px] text-[var(--app-text-muted)]">{label}</span>
      </button>
    );
  }
  return (
    <div className="flex flex-col items-center">
      <span className={`font-bold text-[var(--app-text)] ${small ? 'text-[13px]' : 'text-[18px]'}`}>
        {value}
      </span>
      <span className="mt-0.5 text-[10px] text-[var(--app-text-muted)]">{label}</span>
    </div>
  );
}
