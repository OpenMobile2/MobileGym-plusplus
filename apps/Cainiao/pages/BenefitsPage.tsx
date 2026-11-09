import React, { useState } from 'react';
import { useDarkMode } from '../../../os/hooks/useDarkMode';
import { useSearchParams } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { useCainiaoGestures } from '../hooks/useCainiaoGestures';
import { useCainiaoStore } from '../state';
import { useI18n } from '../i18n';

/** 我的权益(spec me.benefits,s153/s154):优惠券/红包 两 Tab,橙红主题 */
export default function BenefitsPage() {
  const { isDark } = useDarkMode();
  const { bindTap, action } = useCainiaoGestures();
  const { t } = useI18n();
  const [sp] = useSearchParams();
  // 从「寄件优惠」入口进入默认落优惠券 Tab;红包卡券入口同页
  const [tab, setTab] = useState<'coupon' | 'redpacket'>(sp.get('tab') === 'redpacket' ? 'redpacket' : 'coupon');
  const [usedFilter, setUsedFilter] = useState<'all' | 'used' | 'expired'>('all');

  const coupons = useCainiaoStore((s) => s.coupons);
  const showToast = useCainiaoStore((s) => s.showToast);
  const wontfix = () => showToast(t('common.notOpen'));

  const shipping = coupons.filter((c) => c.kind === 'shipping');
  const redpackets = coupons.filter((c) => c.kind === 'redpacket');
  const list = tab === 'coupon' ? shipping : redpackets;
  const shown = usedFilter === 'all' ? list : [];

  return (
    <div className="flex h-full flex-col bg-(--app-c-page-bg)" data-status-bar-foreground={isDark ? 'light' : 'dark'}>
      <TopBar title={t('me.benefits')} />
      {/* Tab */}
      <div className="flex bg-(--app-c-page-bg)">
        {([['coupon', '优惠券'], ['redpacket', '红包']] as const).map(([k, label]) => (
          <button
            key={k}
            {...action('me.benefits.select.tab', () => { setTab(k); setUsedFilter('all'); }, { params: { value: k } })}
            className={`flex-1 cursor-pointer border-none bg-transparent py-2.5 text-center text-[16px] ${
              tab === k ? 'font-bold text-(--app-c-text-primary) underline decoration-[#F65739] decoration-4 underline-offset-8' : 'text-(--app-c-text-secondary)'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 领取横幅 */}
        <div className="mt-2 flex items-center rounded-2xl bg-(--app-c-card-bg) p-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFEDE8] text-[20px]">🧧</span>
          <div className="ml-2.5 min-w-0 flex-1">
            <div className="text-[16px] font-bold text-(--app-c-text-primary)">{tab === 'coupon' ? '领寄件券' : '领红包'}</div>
            <div className="text-[12px] text-(--app-c-text-muted)">{tab === 'coupon' ? '首单低至3元' : '最高200元待领取'}</div>
          </div>
          {tab === 'coupon' ? (
            <button {...bindTap('me.benefits.ship.open')} className="shrink-0 cursor-pointer rounded-full border-none bg-[#F65739] px-4 py-2 text-[14px] font-semibold text-white">
              去寄件
            </button>
          ) : (
            <button {...action('me.benefits.claim.wontfixToast', wontfix)} className="shrink-0 cursor-pointer rounded-full border-none bg-[#F65739] px-4 py-2 text-[14px] font-semibold text-white">
              去领取
            </button>
          )}
        </div>

        {/* 筛选行 */}
        <div className="mt-3 flex items-center text-[14px]">
          <span className="font-semibold text-(--app-c-text-primary)">全部 (共{list.length}张)</span>
          <button
            {...action('me.benefits.filter.select.used', () => setUsedFilter('used'), { params: { value: 'used' } })}
            className={`ml-auto cursor-pointer border-none bg-transparent ${usedFilter === 'used' ? 'font-semibold text-[#F65739]' : 'text-(--app-c-text-secondary)'}`}
          >
            已使用
          </button>
          <span className="mx-2 text-[#DDD]">|</span>
          <button
            {...action('me.benefits.filter.select.used', () => setUsedFilter('expired'), { params: { value: 'expired' } })}
            className={`cursor-pointer border-none bg-transparent ${usedFilter === 'expired' ? 'font-semibold text-[#F65739]' : 'text-(--app-c-text-secondary)'}`}
          >
            已过期
          </button>
        </div>

        {usedFilter !== 'all' && (
          <button
            {...action('me.benefits.filter.select.used', () => setUsedFilter('all'), { params: { value: 'all' } })}
            className="mt-2 cursor-pointer border-none bg-transparent text-[13px] text-(--app-c-brand)"
          >
            ‹ 返回全部
          </button>
        )}

        {tab === 'coupon' && usedFilter === 'all' && <div className="mt-2 text-[14px] font-semibold text-(--app-c-text-secondary)">寄件券</div>}

        {shown.length === 0 && <div className="py-10 text-center text-[13px] text-(--app-c-text-muted)">{t('common.empty')}</div>}

        {shown.map((c) =>
          c.kind === 'shipping' ? (
            <div key={c.id} className="mt-2.5 flex items-center rounded-2xl bg-(--app-c-card-bg) p-3.5">
              <div className="w-16 shrink-0 text-center">
                <span className="text-[26px] font-extrabold text-[#F65739]">{c.discount.replace('折', '')}</span>
                {c.discount.includes('折') && <span className="text-[13px] font-bold text-[#F65739]">折</span>}
              </div>
              <div className="min-w-0 flex-1 border-l border-dashed border-(--app-c-border) pl-3">
                <div className="truncate text-[15px] font-semibold text-(--app-c-text-primary)">{c.title}</div>
                <div className="mt-0.5 text-[12px] text-(--app-c-text-muted)">{c.expiryText}</div>
                <button {...action('me.benefits.rules.wontfixToast', wontfix)} className="mt-0.5 cursor-pointer border-none bg-transparent p-0 text-[12px] text-(--app-c-text-muted)">
                  使用规则 ›
                </button>
              </div>
              <button
                {...bindTap('me.benefits.use.open')}
                className="ml-2 shrink-0 cursor-pointer rounded-full border border-[#F65739] bg-(--app-c-card-bg) px-3.5 py-1.5 text-[13px] font-semibold text-[#F65739]"
              >
                去使用
              </button>
            </div>
          ) : (
            <div key={c.id} className="mt-2.5 flex items-center rounded-2xl bg-gradient-to-r from-[#F65739] to-[#E23A2B] p-3.5 text-white">
              <div className="w-20 shrink-0 rounded-lg bg-(--app-c-card-bg)/95 py-2 text-center text-[22px] font-extrabold text-[#B4451F]">
                {c.discount}
              </div>
              <div className="min-w-0 flex-1 pl-3">
                <div className="truncate text-[16px] font-bold">{c.title}</div>
                <div className="mt-0.5 text-[12px] opacity-90">{c.expiryText}</div>
                <button {...action('me.benefits.rules.wontfixToast', wontfix)} className="mt-0.5 cursor-pointer border-none bg-transparent p-0 text-[12px] text-white/90">
                  使用规则 ›
                </button>
              </div>
              <button
                {...bindTap('me.benefits.use.open')}
                className="ml-2 shrink-0 cursor-pointer rounded-full border border-white bg-transparent px-3.5 py-1.5 text-[13px] font-semibold text-white"
              >
                去使用
              </button>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
