import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Img from '../components/Img';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { useYoukuDark } from '../hooks/useYoukuDark';
import { useYoukuStore } from '../state';
import { useI18n } from '../i18n';
import { YOUKU_CONFIG } from '../data';
import { WONTFIX_TOAST } from '../constants';
import { IcCheck, IcChevron, IcCoin, GOLD_BTN_STYLE, vipExpireParts } from './me/meShared';

interface VipPlan {
  id: string;
  name: string;
  price: number;
  origin: number;
  cornerTag: string;
}

const PLANS = YOUKU_CONFIG.vipPlans as unknown as { vip: VipPlan[]; svip: VipPlan[] };
const SUBTABS = ['酷金币', '免费领', '聚划算'];

/**
 * spec 节点 vip.main(route /vip)—— 会员中心(s187 VIP / s188 SVIP / activated 推断态)。
 * 假开通(拍板Q7):vip.activate.confirm 翻转全局 membership,联动 me 横幅/下载横幅/播放蒙层胶囊。
 */
export default function VipPage() {
  const { action, bindBack, back } = useYoukuGestures();
  const [sp, setSearchParams] = useSearchParams();
  const { t, s } = useI18n();
  const isDark = useYoukuDark();
  const user = useYoukuStore((st) => st.user);
  const membership = useYoukuStore((st) => st.membership);
  const activateVip = useYoukuStore((st) => st.activateVip);
  const checkinVip = useYoukuStore((st) => st.checkinVip);
  const showToast = useYoukuStore((st) => st.showToast);
  const wontfix = () => showToast(WONTFIX_TOAST);

  const couponOpen = sp.get('coupon') === '1';
  const [planTab, setPlanTab] = useState<'vip' | 'svip'>('vip');
  // VIP/SVIP 两页签各自记忆选中档位(spec vip.plan.select.<option>)
  const [selVip, setSelVip] = useState('monthly');
  const [selSvip, setSelSvip] = useState('monthly');
  const sel = planTab === 'vip' ? selVip : selSvip;
  const setSel = planTab === 'vip' ? setSelVip : setSelSvip;
  const isSvip = planTab === 'svip';

  /** 套餐卡 id → 字面量绑定(checker 铁律:id 在调用处保持字符串字面量) */
  const planBind = (planId: string) =>
    planId === 'monthly'
      ? action('vip.plan.select.monthly', () => setSel('monthly'))
      : planId === 'quarter'
        ? action('vip.plan.select.quarter', () => setSel('quarter'))
        : action('vip.plan.select.year', () => setSel('year'));

  const tierText = membership.tier === 'svip' ? 'SVIP' : 'VIP';
  const expire = t('meVipExpire', vipExpireParts(membership.sinceTs, membership.expireTs));
  const planId = (sel === 'quarter' || sel === 'year' ? sel : 'monthly') as 'monthly' | 'quarter' | 'year';

  const onCheckin = () => {
    const ok = checkinVip();
    if (!ok) return;
    setSearchParams(
      (p) => {
        p.set('coupon', '1');
        return p;
      },
      { replace: false },
    );
  };

  return (
    <div
      data-status-bar-foreground={isDark ? 'light' : 'dark'}
      className="relative flex h-full w-full flex-col overflow-hidden bg-(--app-c-page-bg) pt-10 text-(--app-c-text-primary)"
    >
      {/* 顶部子tab行:精选(选中)+ 营销子tab(wontfix)+ 打卡 */}
      <div className="flex shrink-0 items-center gap-4 overflow-x-auto px-4 py-2.5 [scrollbar-width:none]">
        <span className="shrink-0 whitespace-nowrap text-[21px] font-bold">{s.vipFeatured}</span>
        {SUBTABS.map((tab) => (
          <button
            key={tab}
            {...action('vip.subtab.wontfixToast', wontfix)}
            className="shrink-0 cursor-pointer whitespace-nowrap border-none bg-transparent p-0 text-[16px] text-(--app-c-text-muted)"
          >
            {tab}
          </button>
        ))}
        <button
          {...action('vip.checkin.wontfixToast', onCheckin)}
          className="ml-auto flex shrink-0 cursor-pointer items-center gap-1 rounded-full border-none bg-(--app-c-chip-bg) px-3 py-1.5 text-[13px] text-(--app-c-text-secondary)"
        >
          {membership.checkedIn ? (
            s.vipCheckedIn
          ) : (
            <>
              {s.vipCheckin}
              <IcCheck size={14} strokeWidth={2.5} className="text-[#E8C87E]" />
            </>
          )}
        </button>
      </div>

      {/* 打卡领券弹层(URL ?coupon=1,关闭=back);relative+overflow 限制在页内不挡底栏 */}
      {couponOpen ? (
        <div className="absolute inset-0 z-40 flex flex-col">
          <div {...bindBack()} className="min-h-0 flex-1 cursor-pointer bg-black/55" />
          <div className="shrink-0 rounded-t-3xl bg-(--app-c-card-bg) px-5 pb-8 pt-5">
            <div className="text-center text-[18px] font-bold text-(--app-c-text-primary)">{s.vipCouponTitle}</div>
            <div className="mt-1 text-center text-[13px] text-(--app-c-text-muted)">{s.vipCouponSub}</div>
            <div
              className="mx-auto mt-5 w-full max-w-[300px] rounded-2xl px-4 py-4"
              style={{ background: 'linear-gradient(135deg,#3A3020,#1A160E)' }}
            >
              <div className="text-[15px] font-bold text-[#E8C87E]">{s.vipCouponName}</div>
              <div className="mt-1 text-[13px] text-[#CCCCCC]">{s.vipCouponDesc}</div>
              <div className="mt-3 text-[28px] font-bold text-white">
                ¥12 <span className="text-[13px] font-normal text-[#999999] line-through">¥25</span>
              </div>
            </div>
            <button
              {...action('vip.checkin.coupon.claim', () => {
                showToast(s.vipCouponClaimed);
                back();
              })}
              className="mt-5 h-12 w-full cursor-pointer rounded-full border-none text-[17px] font-bold"
              style={GOLD_BTN_STYLE}
            >
              {s.vipCouponClaim}
            </button>
            <button
              {...bindBack()}
              className="mt-3 h-10 w-full cursor-pointer border-none bg-transparent text-[14px] text-(--app-c-text-muted)"
            >
              {s.vipCouponSkip}
            </button>
          </div>
        </div>
      ) : null}

      <div data-scroll-container="main" data-scroll-direction="vertical" className="min-h-0 flex-1 overflow-y-auto pb-4">
        {/* 会员状态行(假开通联动 uiState activated) */}
        <div className="flex items-center gap-2.5 px-4 pt-2">
          <Img src={user.avatar} label={user.nickname} ratio="square" className="h-9 w-9 rounded-full object-cover" />
          {membership.active ? (
            <span className="text-[17px] font-bold text-[#E8C87E]">
              {t('meVipActive', { tier: tierText, expire })}
            </span>
          ) : (
            <span className="text-[17px] font-bold">{s.meVipInactive}</span>
          )}
        </div>

        {/* 套餐大卡:VIP/SVIP 双页签 + 三档套餐 + 立即开通 */}
        <div
          className="mx-3 mt-3 overflow-hidden rounded-2xl"
          style={{
            background: isSvip
              ? 'linear-gradient(135deg,#2E2440 0%,#3A2A52 45%,#171020 100%)'
              : 'linear-gradient(135deg,#2E2718 0%,#3A3020 45%,#14110A 100%)',
          }}
        >
          {/* 页签 */}
          <div className="flex">
            <button
              {...action('vip.plantab.select.vip', () => setPlanTab('vip'))}
              className={`flex-1 cursor-pointer border-none bg-transparent py-3 ${!isSvip ? 'opacity-100' : 'opacity-50'}`}
            >
              <div className={`text-[20px] font-bold ${!isSvip ? 'text-[#E8C87E]' : 'text-[#CCCCCC]'}`}>{s.vipTabVip}</div>
              <div className="mt-0.5 text-[12px] text-[#999999]">{s.vipTabVipSub}</div>
            </button>
            <button
              {...action('vip.plantab.select.svip', () => setPlanTab('svip'))}
              className={`flex-1 cursor-pointer border-none bg-transparent py-3 ${isSvip ? 'opacity-100' : 'opacity-50'}`}
            >
              <div className={`text-[20px] font-bold ${isSvip ? 'bg-gradient-to-r from-[#C9A6F0] to-[#E8C87E] bg-clip-text text-transparent' : 'text-[#CCCCCC]'}`}>
                {s.vipTabSvip}
              </div>
              <div className="mt-0.5 text-[12px] text-[#999999]">{s.vipTabSvipSub}</div>
            </button>
          </div>

          {/* 三档套餐卡 */}
          <div className="mt-1 flex gap-2 px-3">
            {PLANS[planTab].map((p) => {
              const active = sel === p.id;
              return (
                <div
                  key={p.id}
                  {...planBind(p.id)}
                  className="relative flex-1 cursor-pointer rounded-xl pb-3 pt-6 text-center"
                  style={
                    active
                      ? {
                          background: isSvip
                            ? 'linear-gradient(160deg,#F2E6F8,#F8E9C8)'
                            : 'linear-gradient(160deg,#FBF0C8,#F3DD96)',
                          color: '#5C4318',
                        }
                      : { background: 'rgba(255,255,255,0.07)', color: '#FFFFFF' }
                  }
                >
                  {p.cornerTag && (
                    <span
                      className={`absolute -top-2 left-0 rounded-br-lg rounded-tl-xl px-1.5 py-0.5 text-[10px] leading-none text-white ${
                        isSvip ? 'bg-[#B44BF0]' : 'bg-[#F5265C]'
                      }`}
                    >
                      {p.cornerTag}
                    </span>
                  )}
                  <div className={`text-[15px] font-medium ${active ? 'text-[#5C4318]' : 'text-white'}`}>{p.name}</div>
                  <div className={`mt-1 text-[26px] font-bold leading-none ${active ? 'text-[#5C4318]' : 'text-white'}`}>
                    <span className="text-[14px]">¥</span>
                    {p.price}
                  </div>
                  <div className={`mt-1 text-[12px] line-through ${active ? 'text-[#9A8460]' : 'text-[#777777]'}`}>
                    {p.origin > 0 ? `¥${p.origin}` : ' '}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 立即开通(假开通:全局联动) */}
          <div className="px-3 pb-4 pt-4">
            <button
              {...action('vip.activate.confirm', () => {
                const plan = (planTab === 'vip' ? PLANS.vip : PLANS.svip).find((p) => p.id === planId);
                const amount = plan?.price ?? 0;
                const launched = window.__OS__?.startActivityForResult?.(
                  'alipay',
                  {
                    action: 'ACTION_PAY',
                    scheme: 'alipays',
                    data: {
                      amount,
                      orderId: `youku-vip-${planTab}-${planId}`,
                      merchantName: '优酷',
                      subject: `${planTab === 'svip' ? 'SVIP' : 'VIP'} ${plan?.name ?? ''}`,
                    },
                  },
                  (result) => {
                    if (result.resultCode === 'OK') activateVip(planTab, planId);
                  },
                );
                if (!launched) activateVip(planTab, planId);
              })}
              className="h-12 w-full cursor-pointer rounded-full border-none text-[18px] font-bold"
              style={
                isSvip
                  ? { background: 'linear-gradient(90deg,#E8CCF8,#F8E3A8)', color: '#4A2B55' }
                  : GOLD_BTN_STYLE
              }
            >
              {membership.active ? s.meVipRenew : s.vipActivate}
            </button>
          </div>
        </div>

        {/* 酷金币兑好物楼层(scope:静态展示,点击提示) */}
        <div className="mt-6 px-3">
          <div {...action('vip.goods.wontfixToast', wontfix)} className="flex cursor-pointer items-center">
            <span className="text-[20px] font-bold">酷金币兑好物</span>
            <span className="ml-auto flex items-center gap-1 text-[15px] text-[#CCCCCC]">
              <IcCoin size={16} className="text-[#E9C177]" />
              0
              <IcChevron size={15} className="text-[#777777]" />
            </span>
          </div>
          <div className="mt-3 flex gap-2.5">
            {/* 明日10点秒杀 */}
            <div
              {...action('vip.goods.wontfixToast', wontfix)}
              className="relative flex-1 cursor-pointer rounded-xl p-3"
              style={{ background: 'linear-gradient(160deg,#1E2A4A,#141B30)' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-bold">
                  明日<span className="text-[#F5265C]">10点</span>秒杀
                </span>
                <span className="rounded-full bg-[#3A466A] px-2.5 py-1 text-[12px] text-white">预约</span>
              </div>
              <div className="mx-auto mt-3 flex h-24 w-16 items-end justify-center rounded bg-[#2A3654]">
                <div className="mb-2 h-16 w-9 rounded-t-full rounded-b bg-[#E8ECF5]" />
              </div>
              <span className="mt-3 inline-block rounded bg-black/40 px-1.5 py-0.5 text-[11px] text-[#E8C87E]">VIP 3折</span>
              <div className="mt-1 text-[14px]">舒肤佳洗手液</div>
              <div className="mt-1.5 inline-block rounded bg-black/40 px-1.5 py-0.5 text-[11px] text-[#999999]">
                6900币 <span className="line-through">2.3万币</span>
              </div>
            </div>
            {/* 右列两卡 */}
            <div className="flex flex-1 flex-col gap-2.5">
              <div
                {...action('vip.goods.wontfixToast', wontfix)}
                className="flex flex-1 cursor-pointer items-center gap-2.5 rounded-xl p-3"
                style={{ background: 'linear-gradient(160deg,#3A2620,#241610)' }}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#5A3A28] text-[20px]">🎮</div>
                <div>
                  <div className="text-[15px] font-medium">和平精英</div>
                  <span className="mt-1 inline-block rounded bg-black/35 px-1.5 py-0.5 text-[11px] text-[#E8C87E]">10币</span>
                </div>
              </div>
              <div
                {...action('vip.goods.wontfixToast', wontfix)}
                className="flex flex-1 cursor-pointer items-center gap-2.5 rounded-xl p-3"
                style={{ background: 'linear-gradient(160deg,#3A2036,#221020)' }}
              >
                <div className="flex h-12 w-6 shrink-0 items-end justify-center">
                  <div className="h-10 w-3.5 rounded-sm bg-[#2A1626] shadow-[0_0_6px_rgba(200,120,180,0.5)]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[15px] font-medium leading-snug">御泥坊黑参精华液5ml</div>
                  <span className="mt-1 inline-block rounded bg-black/35 px-1.5 py-0.5 text-[11px] text-[#E8C87E]">10币</span>
                </div>
              </div>
            </div>
          </div>
          {/* 做任务赚酷金币 */}
          <div
            {...action('vip.goods.wontfixToast', wontfix)}
            className="mt-2.5 flex cursor-pointer items-center rounded-xl bg-(--app-c-card-bg) px-3 py-3.5"
          >
            <IcCoin size={18} className="text-[#E9C177]" />
            <span className="ml-2 text-[15px]">做任务赚酷金币</span>
            <span className="ml-auto flex items-center text-[13px] text-[#999999]">
              +14.4万
              <IcChevron size={15} />
            </span>
          </div>
        </div>

        {/* 免费领会员楼层标题 + 更多 */}
        <div className="mt-6 flex items-center px-3">
          <span className="text-[20px] font-bold">免费领会员</span>
          <button
            {...action('vip.freemember.wontfixToast', wontfix)}
            className="ml-auto cursor-pointer border-none bg-transparent text-[14px] text-[#8A8A8A]"
          >
            更多
          </button>
        </div>
      </div>
    </div>
  );
}
