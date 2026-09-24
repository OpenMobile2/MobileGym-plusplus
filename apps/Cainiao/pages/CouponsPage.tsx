import React, { useEffect, useRef, useState } from 'react';
import { useDarkMode } from '../../../os/hooks/useDarkMode';
import Img from '../components/Img';
import HScroll from '../components/HScroll';
import { IcSearch, IcRefresh } from '../res/icons';
import { useCainiaoGestures } from '../hooks/useCainiaoGestures';
import { useCainiaoStore } from '../state';
import { useI18n } from '../i18n';

/** 购物券 Tab(spec coupons.main,a162/a163):领券改状态并弹「领取成功」浮层 */
export default function CouponsPage() {
  const { isDark } = useDarkMode();
  const { action } = useCainiaoGestures();
  const { t } = useI18n();
  const marketCoupons = useCainiaoStore((s) => s.marketCoupons);
  const claimMarketCoupon = useCainiaoStore((s) => s.claimMarketCoupon);
  const refreshMarketCoupons = useCainiaoStore((s) => s.refreshMarketCoupons);
  const showToast = useCainiaoStore((s) => s.showToast);
  const wontfix = () => showToast(t('common.notOpen'));

  // 领取成功浮层(a163):1.5s 自动消失
  const [claimedTip, setClaimedTip] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);
  const popClaim = (id: string, amount: number) => {
    claimMarketCoupon(id);
    setClaimedTip(`淘礼金红包¥${amount}`);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setClaimedTip(null), 1500);
  };

  return (
    <div className="relative flex h-full flex-col bg-(--app-c-page-bg)" data-status-bar-foreground={isDark ? 'light' : 'dark'}>
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto pb-3" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 头部 */}
        <div className="flex items-center px-4 pt-12">
          <span className="text-[21px] font-extrabold italic text-(--app-c-text-primary)">买前查优惠</span>
          <span className="ml-2 text-[12px] text-(--app-c-text-muted)">| 先领券 购物更划算</span>
          <button
            {...action('coupons.refresh.action', () => { refreshMarketCoupons(); setClaimedTip(null); showToast('已刷新'); })}
            className="ml-auto flex cursor-pointer items-center gap-1 rounded-full border-none bg-(--app-c-card-bg) px-3 py-1 text-[13px] text-(--app-c-text-primary)"
          >
            <IcRefresh size={13} /> 刷新
          </button>
          <button {...action('coupons.misc.wontfixToast', wontfix)} className="ml-2 cursor-pointer border-none bg-transparent text-[18px] text-(--app-c-text-primary)">
            ⋯
          </button>
        </div>

        {/* 淘 购物限时优惠 横滑 */}
        <div className="mx-3 mt-3 rounded-2xl bg-gradient-to-b from-[#FBD9DF] to-[#FCE9EC] p-3">
          <div className="text-[16px] font-extrabold text-[#E4573D]">🛒 购物限时优惠</div>
          <HScroll id="marketRow" className="mt-2 gap-2 pb-1">
            {marketCoupons.map((c) => (
              <div key={c.id} className="w-28 shrink-0 rounded-xl bg-(--app-c-card-bg) p-2 text-center">
                <Img src={c.image} className="mx-auto aspect-square w-full rounded-lg object-cover" />
                <div className="mt-1 text-[12px]">
                  <span className="rounded bg-[#FFECEC] px-1 text-[10px] text-[#F5222D]">优惠</span>{' '}
                  <span className="font-bold text-[#F5222D]">{c.redpacket.toFixed(2)}元</span>
                </div>
                {c.claimed ? (
                  <button {...action('coupons.buy.wontfixToast', wontfix)} className="mt-1.5 w-full cursor-pointer rounded-full border-none bg-[#FBBF24] py-1 text-[12px] font-semibold text-white">
                    {t('coupons.buy')}
                  </button>
                ) : (
                  <button
                    {...action('coupons.claim.action', () => popClaim(c.id, c.redpacket), { params: { couponId: c.id } })}
                    className="mt-1.5 w-full cursor-pointer rounded-full border-none bg-gradient-to-r from-[#FF7A45] to-[#F5222D] py-1 text-[12px] font-semibold text-white"
                  >
                    立即领
                  </button>
                )}
              </div>
            ))}
          </HScroll>
          {/* 淘口令搜索(wontfix) */}
          <button
            {...action('coupons.search.wontfixToast', wontfix)}
            className="mt-3 flex w-full cursor-pointer items-center rounded-full border-none bg-(--app-c-card-bg) px-3 py-2.5 text-left"
          >
            <IcSearch size={16} className="text-(--app-c-text-muted)" />
            <span className="ml-2 flex-1 truncate text-[13px] text-(--app-c-text-muted)">复制粘贴淘宝商品链接或者淘口令搜索优惠</span>
            <span className="text-[14px] font-semibold text-(--app-c-text-primary)">搜索</span>
          </button>
        </div>

        {/* 精选优惠列表 */}
        <div className="mx-3 mt-3 rounded-2xl bg-(--app-c-card-bg) p-3">
          <div className="text-[17px] font-bold text-(--app-c-text-primary)">精选优惠</div>
          {marketCoupons.map((c) => (
            <div key={c.id} className="mt-3 flex gap-2.5">
              <Img src={c.image} className="h-20 w-20 shrink-0 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] text-(--app-c-text-primary)">
                  <span className="mr-1 rounded bg-[#FF5000] px-1 text-[10px] text-white">天猫</span>
                  {c.title}
                </div>
                <div className="mt-0.5 text-[12px] text-(--app-c-text-muted)">优惠前 ¥{c.priceBefore}</div>
                <div className="mt-1.5 flex items-center rounded-lg bg-(--app-c-chip-bg) px-2 py-1.5">
                  <div className="min-w-0 flex-1 text-[12px] leading-4 text-(--app-c-text-secondary)">
                    <div>🧧 红包 {c.redpacket}元</div>
                    <div>🎫 优惠券已领完</div>
                  </div>
                  {c.claimed ? (
                    <button {...action('coupons.buy.wontfixToast', wontfix)} className="shrink-0 cursor-pointer rounded-lg border-none bg-[#FBBF24] px-3 py-1.5 text-[13px] font-bold text-white">
                      {t('coupons.buy')}
                    </button>
                  ) : (
                    <button
                      {...action('coupons.claim.action', () => popClaim(c.id, c.redpacket), { params: { couponId: c.id } })}
                      className="shrink-0 cursor-pointer rounded-lg border-none bg-gradient-to-b from-[#F5222D] to-[#C41328] px-3 py-1 text-center text-white"
                    >
                      <div className="text-[13px] font-bold">{t('coupons.claim')}</div>
                      <div className="text-[11px]">{c.redpacket.toFixed(2)}元</div>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 领取成功浮层(a163) */}
      {claimedTip && (
        <div className="pointer-events-none absolute inset-x-6 top-1/3 z-50 rounded-2xl bg-(--app-c-card-bg) p-5 shadow-xl">
          <div className="flex items-center">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F5222D] text-[18px] text-white">🧧</span>
            <span className="ml-2 text-[17px] font-bold text-(--app-c-text-primary)">{claimedTip}</span>
            <span className="ml-auto text-[15px] font-semibold text-[#00B578]">✓ 领取成功</span>
          </div>
          <div className="mt-3 border-t border-(--app-c-divider) pt-3 text-center text-[13px] text-(--app-c-text-muted)">
            已存入「我的权益 - 红包」
          </div>
        </div>
      )}
    </div>
  );
}
