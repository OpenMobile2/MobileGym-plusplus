import React, { useState } from 'react';
import * as TimeService from '../../../os/TimeService';
import { useDidaGestures } from '../hooks/useDidaGestures';
import { useDidaTheme } from '../hooks/useDidaTheme';
import { useDidaStore } from '../state';
import { useI18n } from '../i18n';
import { IcBack, IcCrown, IcCheck } from '../res/icons';

const BENEFITS = [
  { key: 'premium.calViews', freeKey: 'premium.basic', premium: 'Month/Week/Day' },
  { key: 'premium.duration', freeKey: '', premium: '✓' },
  { key: 'premium.constReminder', freeKey: '', premium: '✓' },
  { key: 'premium.notion', freeKey: '', premium: '✓' },
  { key: 'premium.wechat', freeKey: '', premium: '✓' },
];

const PremiumPage: React.FC = () => {
  const { t } = useI18n();
  const { action, bindBack } = useDidaGestures();
  const { isDark } = useDidaTheme();
  const showToast = useDidaStore((s) => s.showToast);
  const setUser = useDidaStore((s) => s.setUser);
  const [agreed, setAgreed] = useState(false);

  const purchase = () => {
    const launched = window.__OS__?.startActivityForResult?.(
      {
        action: 'ACTION_PAY',
        scheme: 'alipays',
        data: {
          amount: 168,
          orderId: `dida-premium-${TimeService.now()}`,
          merchantName: '滴答清单',
          subject: t('me.premiumTitle'),
          source: 'dida',
        },
      },
      (result) => {
        if (result.resultCode !== 'OK') return;
        setUser({ premium: true });
        showToast(t('common.paySuccess'));
      },
    );
    if (!launched) showToast(t('common.notAvailable'));
  };

  return (
    <div data-status-bar-foreground={isDark ? 'light' : 'dark'} className="dida-page flex h-full flex-col pt-10">
      <div className="flex items-center justify-between px-3 py-2">
        <button {...bindBack()} aria-label="back" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1C1C1E]"><IcBack size={20} /></button>
        <span className="text-[17px] font-semibold">{t('me.premiumTitle')}</span>
        <span className="w-10" />
      </div>

      <div data-scroll-container="main" data-scroll-direction="vertical" className="min-h-0 flex-1 overflow-y-auto px-4">
        <div className="flex flex-col items-center py-8">
          <div className="flex h-28 w-28 items-center justify-center rounded-3xl" style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--dida-accent) 40%, var(--dida-card)), var(--dida-card))' }}>
            <span style={{ color: '#F4C13B' }}><IcCrown size={64} /></span>
          </div>
          <div className="mt-4 text-[26px] font-bold">Premium</div>
        </div>

        <div className="mb-3 text-[16px] font-semibold" style={{ color: 'var(--dida-accent)' }}>{t('premium.benefits')}</div>
        <div className="overflow-hidden rounded-2xl bg-[#1C1C1E]">
          <div className="flex border-b border-[color:var(--dida-divider)] px-4 py-3 text-[13px] text-[#8E8E93]">
            <span className="flex-1">{t('premium.benefitCol')}</span><span className="w-16 text-center">{t('premium.free')}</span><span className="w-24 text-center" style={{ color: '#F4C13B' }}>{t('premium.premiumCol')}</span>
          </div>
          {BENEFITS.map((b, i) => (
            <div key={i} className="flex items-center px-4 py-3 text-[14px]">
              <span className="flex-1 text-white">{t(b.key)}</span>
              <span className="w-16 text-center text-[#8E8E93]">{b.freeKey ? t(b.freeKey) : '—'}</span>
              <span className="w-24 text-center" style={{ color: '#F4C13B' }}>{b.premium}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-[26px] font-bold">¥168<span className="text-[15px] font-normal text-[#8E8E93]"> / Y</span></span>
          <button {...action('premium.terms.toggle', () => setAgreed((v) => !v))} aria-label="terms" className="flex h-6 w-6 items-center justify-center rounded-full border" style={{ borderColor: '#F79A28', background: agreed ? 'var(--dida-accent)' : 'transparent' }}>
            {agreed && <IcCheck size={14} color="#fff" />}
          </button>
        </div>
      </div>

      <div className="px-4 pb-8 pt-3">
        <button {...action('premium.buy.pay', purchase)} className="w-full rounded-full py-4 text-[17px] font-medium text-white" style={{ background: 'var(--dida-accent)' }}>
          {t('premium.trial')}
        </button>
      </div>
    </div>
  );
};

export default PremiumPage;
