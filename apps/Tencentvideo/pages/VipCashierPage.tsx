// 收银台。节点 vip.cashier(spec v1.3.0,25 条交互 / 7 个 uiState)。
// 视觉证据:b06fd5@6(VIP tab 套餐横滑 + 顺手带一件 + 开通说明 + 金色主按钮)、
// b06fd5@4(进页即弹的限时红包弹层)、b06fd5@26(SVIP tab 整组内容切换 + 协议勾选)、
// b06fd5@22(挽留弹窗)、70b62a@4(权益对比全屏页)、
// 70b62a@18(升级会员卡 + 会员服务及帮助中心)。
//
// 三个「非页面」的态都做成本页 uiState(不另开路由):红包弹层、挽留弹窗、支付成功弹层;
// 权益对比全屏页同理 —— spec 把它归在本节点的 uiState 而不是独立节点。
import React, { useMemo, useRef, useState } from 'react';
import * as TimeService from '@/os/TimeService';
import { payWithSystem } from '../capabilities';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTencentvideoStore } from '../state';
import { TV_COLORS as C } from '../constants';
import { Dialog } from '../components/Sheet';
import { TvImg } from '../components/Img';
import type { BindProps } from '../components/ui';
import type { TvVipPlan } from '../types';
import { IcArrowRight, IcBell, IcCheck, IcNavBack } from '../res/icons';

/** 金额展示:19.9 → ¥19.9,178 → ¥178 */
function yuan(n: number): string {
  return `¥${Number.isInteger(n) ? n : n.toFixed(1)}`;
}

export default function VipCashierPage() {
  const { bindTap, bindBack } = useTencentvideoGestures();
  const s = useTencentvideoStrings();

  const membership = useTencentvideoStore((s) => s.membership);
  const user = useTencentvideoStore((s) => s.user);
  const cashier = useTencentvideoStore((s) => s.cashier);
  const wontfixToast = useTencentvideoStore((s) => s.wontfixToast);

  const toast = useTencentvideoStore((s) => s.toast);
  const cashierSetTab = useTencentvideoStore((s) => s.cashierSetTab);
  const cashierSelectPlan = useTencentvideoStore((s) => s.cashierSelectPlan);
  const cashierAddonToggle = useTencentvideoStore((s) => s.cashierAddonToggle);
  const cashierAgreementToggle = useTencentvideoStore((s) => s.cashierAgreementToggle);
  const cashierRedpacketClaim = useTencentvideoStore((s) => s.cashierRedpacketClaim);
  const cashierRedpacketClose = useTencentvideoStore((s) => s.cashierRedpacketClose);
  const cashierPayMock = useTencentvideoStore((s) => s.cashierPayMock);
  const cashierPaymentBegin = useTencentvideoStore((s) => s.cashierPaymentBegin);
  const cashierPaymentCancel = useTencentvideoStore((s) => s.cashierPaymentCancel);
  const cashierPaySuccessClose = useTencentvideoStore((s) => s.cashierPaySuccessClose);
  const cashierRetainOpen = useTencentvideoStore((s) => s.cashierRetainOpen);
  const cashierRetainStay = useTencentvideoStore((s) => s.cashierRetainStay);
  const cashierCompareToggle = useTencentvideoStore((s) => s.cashierCompareToggle);
  const cashierCompareSwipe = useTencentvideoStore((s) => s.cashierCompareSwipe);

  const planRowRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  const onScroll = () => {
    const next = (scrollRef.current?.scrollTop ?? 0) > 260;
    if (next !== scrolled) setScrolled(next);
  };

  const plans: TvVipPlan[] =
    cashier.tab === 'svip' ? membership.svipPlans : cashier.tab === 'vip' ? membership.vipPlans : [];
  const plan = useMemo(
    () =>
      membership.vipPlans.find((p) => p.id === cashier.planId) ??
      membership.svipPlans.find((p) => p.id === cashier.planId),
    [membership.vipPlans, membership.svipPlans, cashier.planId],
  );
  const addOns = membership.addOn.byPlan[cashier.planId] ?? [];
  const redPacketOn = !cashier.redPacketDismissed;
  // 红包只对 VIP 连续包年生效(证据 b06fd5@4 弹层小字)
  const redPacketApplied = cashier.redPacketClaimed && cashier.planId === 'vip_year';
  const payAmount = plan ? plan.price - (redPacketApplied ? membership.redPacket.amount : 0) : 0;
  const payLabel = `${yuan(Math.max(0, payAmount))}${membership.payAgreement}`;

  const startPayment = () => {
    if (!cashier.agreementChecked) {
      toast(membership.agreement.uncheckedToast);
      return;
    }
    if (!plan || cashier.pendingOrder) return;
    const orderId = `tv-${cashier.planId}-${TimeService.now()}`;
    cashierPaymentBegin(orderId, cashier.planId, payAmount);
    toast(s.paymentProcessing);
    const launched = payWithSystem({ amount: payAmount, orderId, subject: plan.label }, (result) => {
      // 微信成功回传可能是 tradeNo 而不是原 orderId；有 pendingOrder 且 OK 即入账。
      if (result.resultCode === 'OK') {
        cashierPayMock();
        return;
      }
      cashierPaymentCancel();
      toast(s.paymentCanceled);
    });
    if (!launched) {
      cashierPaymentCancel();
      toast(s.paymentCanceled);
    }
  };

  const wontfix = (id: string) =>
    bindTap({ kind: 'action', id }, { onTrigger: () => toast(s.notOpen) });

  /* ---------- 权益对比全屏页(uiState,不是独立路由) ---------- */

  if (cashier.compareOpen) {
    const headerCard = membership.compareMoreCards[cashier.compareIndex];
    return (
      <div className="flex flex-col h-full" style={{ background: C.darkBg }} data-status-bar-foreground="light">
        <div className="flex items-center h-11 px-2 shrink-0">
          <button
            {...bindTap({ kind: 'action', id: 'vip.cashier.compare.open' }, {
              onTrigger: () => cashierCompareToggle(false),
            })}
            className="bg-transparent border-none p-1"
            style={{ color: C.darkText }}
            aria-label={s.back}
          >
            <IcNavBack size={22} />
          </button>
          <div className="flex-1 text-center text-[16px] font-semibold" style={{ color: C.svipBarText }}>
            会员权益对比
          </div>
          <div className="w-8" />
        </div>

        <div
          className="flex-1 overflow-y-auto px-3 pb-8"
          data-scroll-container="main"
          data-scroll-direction="vertical"
        >
          {/* 表头卡:横滑切换对比列(证据 70b62a@14) */}
          <div
            {...bindTap({ kind: 'action', id: 'vip.cashier.compare.swipe' }, {
              onTrigger: () => cashierCompareSwipe(),
            })}
            className="flex items-center gap-2 py-3"
            data-scroll-container="compareCards"
            data-scroll-direction="horizontal"
          >
            {membership.compareMoreCards.map((name, i) => (
              <span
                key={name}
                className="px-3 py-1.5 rounded-full text-[12px]"
                style={
                  i === cashier.compareIndex
                    ? { background: C.vipBadgeBg, color: C.vipBadgeText, fontWeight: 600 }
                    : { background: 'rgba(255,255,255,0.10)', color: C.darkTextSub }
                }
              >
                {name}
              </span>
            ))}
          </div>

          <div className="rounded-xl overflow-hidden" style={{ background: C.darkCard }}>
            <div className="flex items-center px-3 py-2.5 text-[12px]" style={{ color: C.darkTextSub }}>
              <span className="flex-1">权益</span>
              <span className="w-[26%] text-center">VIP</span>
              <span className="w-[30%] text-center" style={{ color: C.svipBarText }}>
                {headerCard}
              </span>
            </div>
            {membership.benefitsCompare.map((row) => (
              <div
                key={row.item}
                className="flex items-center px-3 py-3 text-[12px] border-t"
                style={{ borderColor: 'rgba(255,255,255,0.06)', color: C.darkText }}
              >
                <span className="flex-1">{row.item}</span>
                <span className="w-[26%] text-center" style={{ color: C.darkTextSub }}>
                  {row.vip}
                </span>
                <span className="w-[30%] text-center" style={{ color: C.svipBarText }}>
                  {row.svip}
                </span>
              </div>
            ))}
          </div>

          <div className="text-[11px] pt-3" style={{ color: C.darkTextSub }}>
            {membership.familyCard.name} · {membership.familyCard.note}({membership.familyCard.deviceNote})
          </div>
        </div>
      </div>
    );
  }

  /* ---------- 套餐卡 ---------- */

  const planCard = (p: TvVipPlan) => {
    const active = p.id === cashier.planId;
    return (
      <button
        key={p.id}
        {...bindTap({ kind: 'action', id: 'vip.cashier.plan.select' }, {
          params: { planId: p.id },
          stopPropagation: true,
          onTrigger: () => cashierSelectPlan(p.id),
        })}
        className="relative shrink-0 w-[112px] rounded-xl pt-4 pb-3 px-2 text-center"
        style={{
          background: active ? '#FFF7E4' : C.chipGray,
          border: `1px solid ${active ? C.goldBtnTo : 'transparent'}`,
        }}
      >
        {p.tag && (
          <span
            className="absolute top-0 left-0 right-0 px-1 py-[1px] rounded-t-xl text-[9px] truncate"
            style={{ background: C.goldBtnTo, color: C.goldBtnText }}
          >
            {p.tag}
          </span>
        )}
        <div className="text-[12px] pt-1" style={{ color: active ? C.memberLevel : C.textSub }}>
          {p.label}
        </div>
        <div className="text-[19px] font-bold leading-[26px]" style={{ color: active ? C.memberLevel : C.text }}>
          {yuan(p.price)}
        </div>
        <div className="text-[10px] line-through" style={{ color: C.textTertiary }}>
          {yuan(p.origPrice)}
        </div>
        <div className="text-[10px] pt-0.5 truncate" style={{ color: active ? C.rankChipText : C.textSub }}>
          {p.note}
        </div>
        {p.countdown && (
          <div className="text-[10px] pt-0.5" style={{ color: C.redDot }}>
            {p.countdown}
          </div>
        )}
      </button>
    );
  };

  /* ---------- 主按钮 ---------- */

  const payButton = (bind: BindProps) => (
    <button
      {...bind}
      className="w-full h-11 rounded-full border-none text-[16px] font-semibold"
      style={{
        background: `linear-gradient(90deg, ${C.goldBtnFrom}, ${C.goldBtnTo})`,
        color: C.goldBtnText,
      }}
    >
      {payLabel}
    </button>
  );

  return (
    <div className="flex flex-col h-full" style={{ background: C.pageBg }} data-status-bar-foreground="dark">
      {/* 顶部账号条 */}
      <div className="shrink-0 px-3 pt-1 pb-2" style={{ background: '#FFF9EC' }}>
        <div className="flex items-center h-9">
          <button
            {...(cashier.agreementChecked
              ? bindTap({ kind: 'action', id: 'vip.cashier.retain.open' }, {
                onTrigger: () => cashierRetainOpen(),
              })
              : bindBack())}
            className="bg-transparent border-none p-1 -ml-1"
            style={{ color: C.text }}
            aria-label={s.back}
          >
            <IcNavBack size={22} />
          </button>
          <div className="flex-1" />
          <button
            {...wontfix('vip.cashier.msg.wontfix')}
            className="relative bg-transparent border-none p-1"
            style={{ color: C.text }}
            aria-label="消息"
          >
            <IcBell size={20} />
            <span
              className="absolute -top-0.5 -right-1 px-1 rounded-full text-[9px] leading-[14px] text-white"
              style={{ background: C.redDot }}
            >
              {membership.accountBar.msgBadge}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <TvImg id={user.avatar} alt={user.nickname} className="w-11 h-11 rounded-full object-cover" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-[15px] font-semibold truncate" style={{ color: C.text }}>
                {user.nickname}
              </span>
              <span
                className="px-1 rounded text-[10px] leading-[15px] font-semibold"
                style={{ background: C.vipBadgeBg, color: C.vipBadgeText }}
              >
                {user.vipLevelLabel}
              </span>
            </div>
            <div className="text-[11px] truncate" style={{ color: C.rankChipText }}>
              腾讯视频VIP:{membership.expire}
            </div>
          </div>
          <button
            {...wontfix('vip.cashier.asset.wontfix')}
            className="flex items-center bg-transparent border-none p-0 text-[11px]"
            style={{ color: C.rankChipText }}
          >
            {membership.accountBar.pointsLabel}
            {user.points}
            <IcArrowRight size={12} />
          </button>
          <span className="text-[11px]" style={{ color: C.divider }}>
            |
          </span>
          <button
            {...wontfix('vip.cashier.asset.wontfix')}
            className="flex items-center bg-transparent border-none p-0 text-[11px]"
            style={{ color: C.rankChipText }}
          >
            {membership.accountBar.assetLabel}
            <IcArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* tab 行 */}
      <div className="shrink-0 flex items-end gap-5 px-4 pt-2 pb-2" style={{ background: '#FFF9EC' }}>
        {membership.cashierTabs.map((t) => {
          const active = t.id === cashier.tab;
          return (
            <button
              key={t.id}
              {...bindTap({ kind: 'action', id: 'vip.cashier.tab.switch' }, {
                params: { tab: t.id },
                onTrigger: () => cashierSetTab(t.id),
              })}
              className="bg-transparent border-none p-0 text-left"
            >
              <div
                className="text-[17px]"
                style={{ color: active ? C.memberLevel : C.textSub, fontWeight: active ? 700 : 400 }}
              >
                {t.label}
              </div>
              <div className="text-[10px] truncate max-w-[92px]" style={{ color: C.textTertiary }}>
                {t.sub}
              </div>
              <div
                className="h-[3px] rounded-full mt-1"
                style={{ background: active ? C.goldBtnTo : 'transparent' }}
              />
            </button>
          );
        })}
      </div>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <>
            {/* 套餐横滑 */}
            <div
              {...bindTap({ kind: 'action', id: 'vip.cashier.plan.scroll' }, {
                onTrigger: () => planRowRef.current?.scrollBy({ left: 120, behavior: 'smooth' }),
              })}
              ref={planRowRef}
              className="flex gap-2 overflow-x-auto px-3 pt-3 pb-1 scrollbar-none"
              data-scroll-container="planCards"
              data-scroll-direction="horizontal"
            >
              {plans.map(planCard)}
            </div>

            {/* 顺手带一件(随选中档位换一套) */}
            {addOns.length > 0 && (
              <div className="px-3 pt-3">
                <div className="text-[13px] font-semibold pb-1.5" style={{ color: C.text }}>
                  {membership.addOn.title}
                </div>
                <div className="flex gap-2">
                  {addOns.map((a) => {
                    const on = cashier.addonIds.includes(a.id);
                    return (
                      <button
                        key={a.id}
                        {...bindTap({ kind: 'action', id: 'vip.cashier.addon.toggle' }, {
                          params: { addonId: a.id },
                          onTrigger: () => cashierAddonToggle(a.id),
                        })}
                        className="flex-1 rounded-xl px-2 py-2 text-left"
                        style={{
                          background: on ? '#FFF7E4' : C.chipGray,
                          border: `1px solid ${on ? C.goldBtnTo : 'transparent'}`,
                        }}
                      >
                        <div className="flex items-center gap-1">
                          <span
                            className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0"
                            style={{
                              background: on ? C.goldBtnTo : 'transparent',
                              border: on ? 'none' : `1px solid ${C.divider}`,
                              color: C.goldBtnText,
                            }}
                          >
                            {on && <IcCheck size={10} />}
                          </span>
                          <span className="text-[12px] truncate" style={{ color: C.text }}>
                            {a.name}
                          </span>
                        </div>
                        <div className="pl-4.5 pt-0.5">
                          <span className="text-[14px] font-bold" style={{ color: C.memberLevel }}>
                            {yuan(a.price)}
                          </span>
                          <span className="text-[10px] line-through pl-1" style={{ color: C.textTertiary }}>
                            {yuan(a.origPrice)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 开通说明行 */}
            {plan && (
              <div className="px-3 pt-3 text-[11px] leading-[17px]" style={{ color: C.textSub }}>
                {plan.desc}
                {redPacketApplied && (
                  <span style={{ color: C.redDot }}>
                    ;{membership.redPacket.claimedNote}
                  </span>
                )}
              </div>
            )}

            {/* 协议 + 主按钮 */}
            <div className="px-3 pt-3">
              <div className="flex items-start gap-1.5 pb-2">
                <button
                  {...bindTap({ kind: 'action', id: 'vip.cashier.agreement.toggle' }, {
                    onTrigger: () => cashierAgreementToggle(),
                  })}
                  className="w-4 h-4 rounded-full shrink-0 mt-[1px] flex items-center justify-center border-none p-0"
                  style={{
                    background: cashier.agreementChecked ? C.goldBtnTo : 'transparent',
                    border: cashier.agreementChecked ? 'none' : `1px solid ${C.divider}`,
                    color: C.goldBtnText,
                  }}
                  aria-label="同意协议"
                  role="checkbox"
                  aria-checked={cashier.agreementChecked}
                >
                  {cashier.agreementChecked && <IcCheck size={11} />}
                </button>
                <div className="text-[11px] leading-[17px]" style={{ color: C.textSub }}>
                  {membership.agreement.prefix}
                  {membership.agreement.links.map((l) => (
                    <button
                      key={l}
                      {...wontfix('vip.cashier.agreementdoc.wontfix')}
                      className="bg-transparent border-none p-0 text-[11px]"
                      style={{ color: C.rankChipText }}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              {payButton(bindTap({ kind: 'action', id: 'vip.cashier.pay' }, {
                onTrigger: startPayment,
              }))}
            </div>

            {/* 权益对比表 */}
            <div className="px-3 pt-5">
              <div className="rounded-xl overflow-hidden" style={{ background: C.rankChipBg }}>
                <div className="flex items-center px-3 py-2.5 text-[12px]" style={{ color: C.rankChipText }}>
                  <span className="flex-1">会员权益</span>
                  <span className="w-[26%] text-center">VIP</span>
                  <span className="w-[30%] text-center font-semibold">SVIP</span>
                </div>
                {membership.benefitsCompare.map((row) => (
                  <div
                    key={row.item}
                    className="flex items-center px-3 py-2.5 text-[12px] border-t"
                    style={{ borderColor: 'rgba(0,0,0,0.05)', color: C.text }}
                  >
                    <span className="flex-1">{row.item}</span>
                    <span className="w-[26%] text-center" style={{ color: C.textSub }}>
                      {row.vip}
                    </span>
                    <span className="w-[30%] text-center font-semibold" style={{ color: C.memberLevel }}>
                      {row.svip}
                    </span>
                  </div>
                ))}
              </div>
              <button
                {...bindTap({ kind: 'action', id: 'vip.cashier.compare.open' }, {
                  onTrigger: () => cashierCompareToggle(true),
                })}
                className="w-full flex items-center justify-center gap-0.5 pt-2 bg-transparent border-none text-[12px]"
                style={{ color: C.rankChipText }}
              >
                {membership.compareMore}
                <IcArrowRight size={13} />
              </button>
            </div>

            {/* 升级会员享更多权益 */}
            <div className="px-3 pt-5">
              <div className="text-[15px] font-semibold pb-2" style={{ color: C.text }}>
                {membership.levelUpCard.title}
              </div>
              <div className="flex gap-2">
                {[membership.levelUpCard.current, membership.levelUpCard.next].map((lv, i) => (
                  <div
                    key={lv.level}
                    className="flex-1 rounded-xl px-3 py-2.5"
                    style={{ background: i === 0 ? C.chipGray : C.rankChipBg }}
                  >
                    <div className="text-[12px]" style={{ color: i === 0 ? C.textSub : C.rankChipText }}>
                      {lv.label}
                    </div>
                    <div className="text-[13px] font-semibold pt-0.5" style={{ color: i === 0 ? C.text : C.memberLevel }}>
                      可享{lv.items}项 · 总价值{lv.value}元
                    </div>
                    <div className="text-[11px] pt-0.5" style={{ color: C.textTertiary }}>
                      {lv.tagline}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px]" style={{ color: C.textSub }}>
                  {membership.levelUpCard.gapNote}
                </span>
                <button
                  {...wontfix('vip.cashier.levelup.wontfix')}
                  className="px-3 h-7 rounded-full border-none text-[12px]"
                  style={{ background: C.goldBtnTo, color: C.goldBtnText }}
                >
                  {membership.levelUpCard.btn}
                </button>
              </div>
            </div>

            {/* 会员服务及帮助中心 */}
            <div className="px-3 pt-5 pb-8">
              <div className="flex items-center justify-between pb-2">
                <span className="text-[15px] font-semibold" style={{ color: C.text }}>
                  {membership.helpCenter.title}
                </span>
                <button
                  {...wontfix('vip.cashier.service.wontfix')}
                  className="flex items-center bg-transparent border-none p-0 text-[12px]"
                  style={{ color: C.textSub }}
                >
                  {membership.helpCenter.service}
                  <IcArrowRight size={13} />
                </button>
              </div>
              <div className="flex gap-2 pb-3">
                {membership.helpCenter.giftCards.map((g) => (
                  <button
                    key={g.title}
                    {...wontfix('vip.cashier.gift.wontfix')}
                    className="flex-1 rounded-xl px-3 py-2.5 border-none text-left"
                    style={{ background: C.rankChipBg }}
                  >
                    <div className="text-[13px] font-semibold" style={{ color: C.memberLevel }}>
                      {g.title}
                    </div>
                    <div className="text-[11px]" style={{ color: C.rankChipText }}>
                      {g.note}
                    </div>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-y-3">
                {membership.helpCenter.grid.map((item) => (
                  <button
                    key={item}
                    {...wontfix('vip.cashier.help.wontfix')}
                    className="bg-transparent border-none p-0 text-[11px]"
                    style={{ color: C.textSub }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
        </>
      </div>

      {/* 吸底条:滚过主按钮后才出现(证据 b06fd5 滚动态)。 */}
      {scrolled && (
        <div className="shrink-0 px-3 py-2 border-t" style={{ background: C.pageBg, borderColor: C.divider }}>
          {payButton(bindTap({ kind: 'action', id: 'vip.cashier.pay' }, {
            onTrigger: startPayment,
          }))}
        </div>
      )}

      {/* 限时红包弹层(进页即弹) */}
      {redPacketOn && (
        <Dialog
          title={`${membership.redPacket.title} ${membership.redPacket.amount}元`}
          dismissOnBackdrop={false}
          footer={
            <button
              {...bindTap({ kind: 'action', id: 'vip.cashier.redpacket.claim' }, {
                onTrigger: () => cashierRedpacketClaim(),
              })}
              className="flex-1 h-10 rounded-full border-none text-[15px] font-semibold"
              style={{
                background: `linear-gradient(90deg, ${C.goldBtnFrom}, ${C.goldBtnTo})`,
                color: C.goldBtnText,
              }}
            >
              {membership.redPacket.claim}
            </button>
          }
        >
          <div>{membership.redPacket.note}</div>
          <div className="pt-1" style={{ color: C.redDot }}>
            {membership.redPacket.countdown} · {membership.redPacket.usableNote}
          </div>
          <button
            {...bindTap({ kind: 'action', id: 'vip.cashier.redpacket.close' }, {
              onTrigger: () => cashierRedpacketClose(),
            })}
            className="absolute right-3 top-3 bg-transparent border-none p-1 text-[16px]"
            style={{ color: C.textTertiary }}
            aria-label="关闭红包"
          >
            ×
          </button>
        </Dialog>
      )}

      {/* 挽留弹窗 */}
      {cashier.retainOpen && (
        <Dialog
          title={membership.retainDialog.title}
          dismissOnBackdrop={false}
          footer={
            <>
              <button
                {...bindBack({
                  beforeTrigger: () => cashierRetainStay(),
                })}
                className="flex-1 h-10 rounded-full text-[14px]"
                style={{ background: C.chipGray, color: C.textSub, border: 'none' }}
              >
                {membership.retainDialog.confirm}
              </button>
              <button
                {...bindTap({ kind: 'action', id: 'vip.cashier.retain.stay' }, {
                  onTrigger: () => cashierRetainStay(),
                })}
                className="flex-1 h-10 rounded-full border-none text-[14px] font-semibold"
                style={{
                  background: `linear-gradient(90deg, ${C.goldBtnFrom}, ${C.goldBtnTo})`,
                  color: C.goldBtnText,
                }}
              >
                {membership.retainDialog.stay}
              </button>
            </>
          }
        >
          {membership.retainDialog.note}
        </Dialog>
      )}

      {/* 支付成功弹层(mock 支付直接成功,账号态已升级) */}
      {cashier.paySuccess && (
        <Dialog
          title={membership.paySuccess.title}
          dismissOnBackdrop={false}
          footer={
            <button
              {...bindTap({ kind: 'action', id: 'vip.cashier.paysuccess.close' }, {
                onTrigger: () => cashierPaySuccessClose(),
              })}
              className="flex-1 h-10 rounded-full border-none text-[15px] font-semibold"
              style={{
                background: `linear-gradient(90deg, ${C.goldBtnFrom}, ${C.goldBtnTo})`,
                color: C.goldBtnText,
              }}
            >
              {membership.paySuccess.btn}
            </button>
          }
        >
          <div>{membership.paySuccess.note}</div>
          <div className="pt-1" style={{ color: C.rankChipText }}>
            {user.vipLevelLabel} · 到期 {membership.expire}
          </div>
        </Dialog>
      )}
    </div>
  );
}
