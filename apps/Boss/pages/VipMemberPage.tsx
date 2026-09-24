import React, { useState } from 'react';
import { useBossGestures } from '../hooks/useBossGestures';
import { useStrings } from '../hooks/useStrings';
import { useBossStore } from '../state';
import { VIP_PAGE } from '../constants';
import { PageHeader } from '../components/common';
import { COLORS } from '../res/colors';

/** VIP 会员页(IMG_8440):深绿顶,前景 light。 */
const VipMemberPage: React.FC = () => {
  const { action } = useBossGestures();
  const t = useStrings();
  const store = useBossStore();
  const vipDays = useBossStore((s) => s.purchases.vipDays);
  const [card, setCard] = useState<'card30' | 'card60'>('card30');
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex h-full flex-col bg-[#F4F1EC]" data-status-bar-foreground="light">
      <div style={{ background: `linear-gradient(160deg, #143C3C, ${COLORS.vipCard})` }}>
        <PageHeader title={<span className="text-white">升级VIP提升求职效率</span>} transparent light />
        <div className="px-4 pb-6">
          <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(120deg, #1D4A4A, #16393E)' }}>
            <div className="text-[24px] font-bold italic text-[#F5D9A8]">VIP·正式版</div>
            <div className="mt-1 text-[13px] text-white/60">{VIP_PAGE.slogan}</div>
            {vipDays > 0 && <div className="mt-2 text-[13px] font-medium text-[#F5D9A8]">VIP 已开通，剩余 {vipDays} 天</div>}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-3" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="-mt-2 flex items-center gap-2 bg-[#FBE9D7] px-4 py-2.5 text-[14px] text-[#B26418]">
          💰 {VIP_PAGE.saveTip} ›
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 px-4">
          {VIP_PAGE.cards.map((c) => {
            const on = card === c.id;
            return (
              <button
                key={c.id}
                {...action('vip.select.card', () => setCard(c.id as 'card30' | 'card60'), { params: { value: c.id } })}
                className="relative rounded-xl border-2 p-4 text-left"
                style={on ? { borderColor: '#E8A95C', backgroundColor: '#FDF6EC' } : { borderColor: '#E5E7EB', backgroundColor: 'white' }}
              >
                {c.badge && <span className="absolute -top-2.5 right-2 rounded-full bg-[#E5484D] px-2 py-0.5 text-[10px] text-white">{c.badge}</span>}
                <span className="flex items-baseline justify-between">
                  <span className="text-[17px] font-semibold text-gray-900">{c.label}</span>
                  <span className="text-[20px] font-bold text-gray-900">{c.price}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mx-4 mt-4 rounded-2xl bg-white p-4">
          <div className="grid grid-cols-3 border-b border-gray-100 pb-2 text-[15px]">
            <span className="font-semibold text-gray-900">专属特权</span>
            <span className="text-center text-gray-500">普通用户</span>
            <span className="text-center font-bold italic text-[#B26418]">VIP</span>
          </div>
          {VIP_PAGE.benefits.map((b) => (
            <div key={b.name} className="grid grid-cols-3 items-center border-b border-gray-50 py-3.5 text-[14px]">
              <span className="font-medium text-gray-900">{b.name}</span>
              <span className="text-center text-gray-400">{b.normalText ?? (b.normal ? '✓' : '✕')}</span>
              <span className="text-center font-medium text-[#B26418]">{b.vipText ?? (b.vip ? '✓' : '✕')}</span>
            </div>
          ))}
          {!expanded && (
            <button {...action('vip.benefits.expand', () => setExpanded(true), { params: {} })} className="mt-2 w-full text-center text-[14px] text-gray-500">
              查看更多 ⌄
            </button>
          )}
          {expanded && (
            <div className="mt-3">
              <div className="text-[15px] font-semibold text-gray-900">| 尊享权益</div>
              <div className="mt-3 grid grid-cols-4 gap-3">
                {VIP_PAGE.moreBenefits.map((m) => (
                  <div key={m} className="flex flex-col items-center gap-1.5">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FBEFDD] text-[16px]">✨</span>
                    <span className="text-center text-[11px] text-gray-600">{m}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between px-5 py-3" style={{ background: 'linear-gradient(90deg, #143C3C, #275D65 55%, #F7CEB1 55.2%)' }}>
        <span className="text-[22px] font-bold text-[#F5D9A8]">{card === 'card30' ? '68' : '98'} <span className="text-[13px] font-normal">元/{card === 'card30' ? '30' : '60'}天</span></span>
        <button
          {...action('vip.pay.system', () => {
            const amount = card === 'card30' ? 68 : 98;
            const launched = window.__OS__?.startActivityForResult?.(
              'alipay',
              {
                action: 'ACTION_PAY',
                scheme: 'alipays',
                data: {
                  amount,
                  orderId: `boss-vip-${card}`,
                  merchantName: 'BOSS直聘',
                  subject: card === 'card30' ? 'VIP 30天卡' : 'VIP 60天卡',
                },
              },
              (result) => {
                if (result.resultCode === 'OK') {
                  store.completePurchase('vip', card);
                  store.showToast(t.paymentSuccess);
                }
              },
            );
            if (!launched) store.showNotice('当前环境无法打开系统收银台，请点击“我知道了”返回。');
          }, { params: {} })}
          className="rounded-full px-8 py-2.5 text-[16px] font-semibold text-[#5C3A1E]"
        >
          立即购买
        </button>
      </div>
    </div>
  );
};

export default VipMemberPage;
