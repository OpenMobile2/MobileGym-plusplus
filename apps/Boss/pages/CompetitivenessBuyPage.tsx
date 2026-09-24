import React, { useState } from 'react';
import { useBossGestures } from '../hooks/useBossGestures';
import { useStrings } from '../hooks/useStrings';
import { useBossStore } from '../state';
import { COMP_BUY_PAGE, COMP_DETAIL } from '../constants';
import { PageHeader } from '../components/common';
import { COLORS } from '../res/colors';

/** 竞争力分析器购买页(IMG_8439)。 */
const CompetitivenessBuyPage: React.FC = () => {
  const { action } = useBossGestures();
  const t = useStrings();
  const store = useBossStore();
  const purchasedDays = useBossStore((s) => s.purchases.competitivenessDays);
  const [plan, setPlan] = useState<'basic' | 'vip'>('basic');
  const [duration, setDuration] = useState<'30d' | '1d'>('30d');

  return (
    <div className="flex h-full flex-col bg-[#E8F1FB]" data-status-bar-foreground="dark">
      <PageHeader transparent />
      <div className="min-h-0 flex-1 overflow-y-auto pb-3" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="px-4">
          <div className="flex items-center gap-2">
            <span className="text-[26px] font-bold text-[#1D3A5F]">{COMP_BUY_PAGE.title}</span>
            <span className="rounded bg-[#FFE3E0] px-1.5 py-0.5 text-[11px] text-[#E5484D]">{COMP_BUY_PAGE.badge}</span>
          </div>
          <div className="mt-1 text-[14px] text-[#5A7396]">{COMP_BUY_PAGE.subtitle}</div>
          {purchasedDays > 0 && <div className="mt-2 inline-block rounded-full bg-white/80 px-3 py-1 text-[12px] text-[#2E7CE6]">已解锁 {purchasedDays} 天</div>}
          <div className="mt-4 flex gap-3 overflow-x-auto" data-scroll-container="cards" data-scroll-direction="horizontal">
            <div className="w-56 shrink-0 rounded-2xl bg-white/90 p-4">
              <div className="text-[15px] font-semibold text-gray-900">综合实力</div>
              <div className="mt-1 text-[13px] text-gray-500">超过{COMP_DETAIL.percentile}%的竞争者</div>
              <div className="mx-auto mt-3 flex h-24 w-24 items-center justify-center rounded-full border-8 border-[#4A9BEB] border-l-[#DCEAF8] text-[13px] text-gray-600">你的<br />竞争力</div>
            </div>
            <div className="w-56 shrink-0 rounded-2xl bg-white/90 p-4">
              <div className="text-[15px] font-semibold text-gray-900">优秀竞争者标签</div>
              <div className="mt-1 text-[13px] text-gray-500">Boss的偏好牛人画像</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {COMP_DETAIL.tags.map((t) => <span key={t} className="rounded bg-[#EAF3FE] px-2 py-1 text-[12px] text-[#3B6FA8]">{t}</span>)}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-t-3xl bg-white px-4 pb-4 pt-2">
          <div className="grid grid-cols-2">
            {(['basic', 'vip'] as const).map((v) => (
              <button
                key={v}
                {...action('compbuy.select.plan', () => setPlan(v), { params: { value: v } })}
                className={`relative py-3 text-[16px] ${plan === v ? 'font-bold text-gray-900' : 'text-gray-400'}`}
              >
                {v === 'basic' ? '基础版' : 'VIP版'}
                {v === 'vip' && <span className="absolute right-4 top-1.5 rounded-full bg-[#FFDFC2] px-2 py-0.5 text-[10px] text-[#B26418]">免费赠送</span>}
                {plan === v && <span className="absolute inset-x-1/3 bottom-1 h-[3px] rounded-full" style={{ backgroundColor: COLORS.primary }} />}
              </button>
            ))}
          </div>
          {COMP_BUY_PAGE.cards.map((card) => {
            const on = duration === card.id;
            return (
              <button
                key={card.id}
                {...action('compbuy.select.duration', () => setDuration(card.id as '30d' | '1d'), { params: { value: card.id } })}
                className="relative mt-3 flex w-full items-center justify-between rounded-xl border-2 px-4 py-4"
                style={on ? { borderColor: '#4A9BEB', backgroundColor: '#F4F9FF' } : { borderColor: '#E5E7EB' }}
              >
                {card.badge && <span className="absolute -top-2.5 left-3 rounded-full bg-[#E5484D] px-2 py-0.5 text-[10px] text-white">{card.badge}</span>}
                <span className="text-[22px] font-bold text-gray-900">{card.days} <span className="text-[14px] font-normal text-gray-500">{card.desc}</span></span>
                <span className="text-[20px] font-bold text-gray-900">{card.price}</span>
              </button>
            );
          })}
          <ul className="mt-4 space-y-1.5 text-[12px] leading-relaxed text-gray-400">
            {COMP_BUY_PAGE.notes.map((n, i) => <li key={i}>* {n}</li>)}
          </ul>
          <p className="mt-2 text-[13px] text-gray-600">支付即表示同意<span style={{ color: COLORS.accent }}>《竞争力分析器个人信息保护声明》</span></p>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between bg-white px-5 py-3">
        <span className="text-[24px] font-bold text-gray-900">{duration === '30d' ? '49' : '5'} <span className="text-[13px] font-normal text-gray-500">直豆</span></span>
        <button
          {...action('compbuy.pay.system', () => {
            const amount = duration === '30d' ? 49 : 5;
            const launched = window.__OS__?.startActivityForResult?.(
              'alipay',
              {
                action: 'ACTION_PAY',
                scheme: 'alipays',
                data: {
                  amount,
                  orderId: `boss-competitiveness-${plan}-${duration}`,
                  merchantName: 'BOSS直聘',
                  subject: `竞争力分析器-${duration === '30d' ? '30天' : '1天'}`,
                },
              },
              (result) => {
                if (result.resultCode === 'OK') {
                  store.completePurchase('competitiveness', `${plan}-${duration}`);
                  store.showToast(t.paymentSuccess);
                }
              },
            );
            if (!launched) store.showNotice('当前环境无法打开系统收银台，请点击“我知道了”返回。');
          }, { params: {} })}
          className="rounded-full px-10 py-3 text-[16px] font-medium text-white"
          style={{ background: 'linear-gradient(90deg, #FF8A5C, #F4503A)' }}
        >
          立即购买
        </button>
      </div>
    </div>
  );
};

export default CompetitivenessBuyPage;
