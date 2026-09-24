import React, { useState } from 'react';
import { useBossGestures } from '../hooks/useBossGestures';
import { useStrings } from '../hooks/useStrings';
import { useBossStore } from '../state';
import { MBTI_PAGE } from '../constants';
import { PageHeader } from '../components/common';
import { COLORS } from '../res/colors';

/** 16型人格测评购买页(IMG_8438)。 */
const AssessmentMbtiPage: React.FC = () => {
  const { action } = useBossGestures();
  const t = useStrings();
  const store = useBossStore();
  const purchasedEdition = useBossStore((s) => s.purchases.mbtiEdition);
  const [plan, setPlan] = useState<'basic' | 'vip'>('basic');
  const [edition, setEdition] = useState<'std' | 'full'>('full');

  return (
    <div className="flex h-full flex-col" style={{ background: 'linear-gradient(160deg, #EAF6FB 0%, #FDEFF0 60%, #FFFFFF)' }}>
      <PageHeader transparent />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="flex items-start justify-between">
          <div className="text-[28px] font-black leading-tight text-gray-900">16型人格<br />职业性格测试</div>
          <div className="mt-1 grid grid-cols-2 gap-1">
            {['#5B8DEF', '#7ED07E', '#9B6BE0', '#F2994A'].map((c, i) => (
              <span key={i} className="flex h-8 w-8 items-center justify-center rounded-md text-[8px] font-bold text-white" style={{ backgroundColor: c }}>
                {['ENTJ', 'ESTP', 'INTP', 'ISFP'][i]}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-1 text-[14px] text-gray-500">{MBTI_PAGE.subtitle}</div>
        {purchasedEdition && <div className="mt-2 inline-block rounded-full bg-[#E6F5F4] px-3 py-1 text-[12px]" style={{ color: COLORS.primary }}>已购买{purchasedEdition === 'full' ? '完整版' : '标准版'}</div>}

        <div className="mt-5 rounded-2xl bg-white p-4">
          <div className="text-[17px] font-bold text-gray-900">核心权益</div>
          <div className="mt-3 grid grid-cols-3">
            {MBTI_PAGE.rights.map((r, i) => (
              <div key={r} className="flex flex-col items-center gap-1.5">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FFF0E5] text-[18px]">{['📋', '💼', '📊'][i]}</span>
                <span className="text-[13px] text-gray-700">{r}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl bg-white">
          <div className="grid grid-cols-2">
            {(['basic', 'vip'] as const).map((v) => (
              <button
                key={v}
                {...action('mbti.select.plan', () => setPlan(v), { params: { value: v } })}
                className={`relative py-3.5 text-[16px] ${plan === v ? 'font-bold' : 'bg-[#F5F6F7] text-gray-500'}`}
                style={plan === v ? { color: COLORS.accent } : undefined}
              >
                {v === 'basic' ? '基础版' : 'VIP版'}
                {v === 'vip' && <span className="absolute right-2 top-1 rounded-full bg-[#FFDFC2] px-2 py-0.5 text-[10px] text-[#B26418]">赠送一次</span>}
              </button>
            ))}
          </div>
          <div className="p-4">
            <div className="text-[18px] font-bold text-gray-900">选择版本</div>
            {MBTI_PAGE.editions.map((e) => {
              const on = edition === e.id;
              return (
                <button
                  key={e.id}
                  {...action('mbti.select.edition', () => setEdition(e.id as 'std' | 'full'), { params: { value: e.id } })}
                  className="mt-3 w-full rounded-xl border p-3.5 text-left"
                  style={on ? { borderColor: COLORS.primary, backgroundColor: '#F2FBFA' } : { borderColor: '#E5E7EB' }}
                >
                  <span className="block text-[16px] font-semibold" style={on ? { color: COLORS.accent } : { color: '#111' }}>{e.name}</span>
                  <span className="mt-1 block text-[13px] leading-relaxed text-gray-500">{e.desc}</span>
                </button>
              );
            })}
          </div>
        </div>
        <p className="mt-3 text-[13px] text-gray-500">支付即表示同意<span style={{ color: COLORS.accent }}>《测评服务购买协议》</span></p>
      </div>

      <div className="flex shrink-0 items-center justify-between bg-white px-5 py-3">
        <span className="text-[24px] font-bold text-gray-900">{MBTI_PAGE.price} <span className="text-[13px] font-normal text-gray-500">{MBTI_PAGE.priceUnit}</span></span>
        <button
          {...action('mbti.pay.system', () => {
            const launched = window.__OS__?.startActivityForResult?.(
              'alipay',
              {
                action: 'ACTION_PAY',
                scheme: 'alipays',
                data: {
                  amount: Number(MBTI_PAGE.price),
                  orderId: `boss-mbti-${plan}-${edition}`,
                  merchantName: 'BOSS直聘',
                  subject: `16型人格职业性格测试-${edition === 'full' ? '完整版' : '标准版'}`,
                },
              },
              (result) => {
                if (result.resultCode === 'OK') {
                  store.completePurchase('mbti', `${plan}-${edition}`);
                  store.showToast(t.paymentSuccess);
                }
              },
            );
            if (!launched) store.showNotice('当前环境无法打开系统收银台，请点击“我知道了”返回。');
          }, { params: {} })}
          className="rounded-full px-10 py-3 text-[16px] font-medium text-white"
          style={{ background: 'linear-gradient(90deg, #FF8A5C, #F4503A)' }}
        >
          {purchasedEdition === edition ? '再次购买' : '去支付'}
        </button>
      </div>
    </div>
  );
};

export default AssessmentMbtiPage;
