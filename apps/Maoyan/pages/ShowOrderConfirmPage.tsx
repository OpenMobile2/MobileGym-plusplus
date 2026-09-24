import React from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { useMaoyanStore } from '../state';
import { useMaoyanGestures } from '../hooks/useMaoyanGestures';
import { Img, TopBar, RecoverPage, MY, useStatusBarFg } from '../components/ui';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';

/** 确认购票页·演出(r6:实名观演人/取票方式/联系方式/立即支付) */
export default function ShowOrderConfirmPage() {
  const statusFg = useStatusBarFg();
  const { bindTap } = useMaoyanGestures();
  const s = useAppStrings(strings, stringsEn);

  const showDraft = useMaoyanStore((st) => st.showDraft);
  const show = useMaoyanStore((st) => st.shows.find((x) => x.id === st.showDraft?.showId));
  const profiles = useMaoyanStore((st) => st.profiles);
  const coupons = useMaoyanStore((st) => st.coupons);
  const setShowDraft = useMaoyanStore((st) => st.setShowDraft);

  // 兜底:草稿失效(已支付/已超时/历史回退)时给出可恢复出口,不留死页
  if (!showDraft || !show) {
    return (
      <RecoverPage
        title="确认购票"
        text={s.showDraftMissing}
        hint={s.showDraftMissingHint}
        actionText={s.reselectTier}
        actionBinding={bindTap('showorder.reselect-open')}
      />
    );
  }
  const tier = show.tiers.find((t) => t.id === showDraft.tierId) ?? show.tiers[0];
  const total = tier.price * showDraft.qty;
  const validCoupons = coupons.filter((c) => c.status === 'valid').length;

  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground={statusFg}>
      <TopBar title="确认购票" />
      <div className="flex-1 overflow-y-auto px-3" data-scroll-container="showorder-scroll" data-scroll-direction="vertical">
        {/* 演出信息 */}
        <div className="bg-app-surface rounded-xl p-3 mt-2 flex gap-3">
          <Img src={show.poster} className="w-14 h-[75px] object-cover rounded shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold text-app-text line-clamp-2">{show.title}</div>
            <div className="text-[12px] text-app-text-muted mt-1">{show.sessionDesc}</div>
            <div className="text-[12px] text-app-text-muted mt-0.5">{tier.name}{tier.price}元 ×{showDraft.qty}张</div>
          </div>
        </div>
        <div className="bg-app-surface rounded-xl px-3 py-2 mt-2 flex gap-1.5 flex-wrap">
          {show.tags.map((t) => (
            <span key={t} className={`text-[10px] px-1.5 py-0.5 rounded ${t.includes('不支持') ? 'text-(--app-c-brand-tint-text) bg-[#FEF0EF]' : 'text-app-text-muted bg-(--app-c-fill)'}`}>{t}</span>
          ))}
        </div>

        {/* 实名观演人 */}
        <div className="bg-app-surface rounded-xl p-3 mt-2">
          <div className="flex items-center">
            <span className="text-[14px] font-bold text-app-text">{s.viewers}</span>
            <span className="ml-2 text-[11px] text-(--app-c-brand-tint-text)">需选1位:入场需携带对应证件</span>
            <button
              {...bindTap('showorder.viewer.add-open')}
              className="ml-auto text-[12px] text-[#DC4038] bg-transparent border-none cursor-pointer"
            >
              {s.addViewer} ›
            </button>
          </div>
          {profiles.map((p) => (
            <button
              key={p.id}
              {...bindTap({ kind: 'action', id: 'showorder.viewer.select.option' }, {
                params: { option: p.id },
                onTrigger: () => setShowDraft({ viewerId: p.id }),
              })}
              className="w-full flex items-center py-2.5 border-b border-app-border last:border-0 bg-transparent border-x-0 border-t-0 cursor-pointer"
            >
              <span className="text-[14px] text-app-text w-16 text-left">{p.name}</span>
              <span className="text-[12px] text-(--app-c-text-3)">身份证 {p.idMasked}</span>
              <span
                className={`ml-auto w-5 h-5 rounded-full inline-flex items-center justify-center text-white text-[12px] ${showDraft.viewerId === p.id ? '' : 'border border-(--app-c-border-strong)'}`}
                style={showDraft.viewerId === p.id ? { background: MY.cta } : undefined}
              >
                {showDraft.viewerId === p.id ? '✓' : ''}
              </span>
            </button>
          ))}
        </div>

        {/* 取票方式 */}
        <div className="bg-app-surface rounded-xl p-3 mt-2">
          <div className="text-[14px] font-bold text-app-text">{s.ticketMethod}</div>
          <div className="text-[13px] text-(--app-c-text-2) mt-1.5">{s.byIdEntry} <span className="text-[10px] text-white bg-[#3A3A3E] rounded px-1 ml-1">实名制观演</span></div>
        </div>

        {/* 联系方式(数字键盘行内输入,qa:Q2=A) */}
        <div className="bg-app-surface rounded-xl p-3 mt-2">
          <div className="text-[14px] font-bold text-app-text">{s.contact}</div>
          <div className="flex items-center mt-1.5">
            <span className="text-[13px] text-(--app-c-text-2)">+86</span>
            <input
              {...bindTap({ kind: 'action', id: 'showorder.phone.input' }, { params: { value: 'phone' }, onTrigger: () => { /* 受控输入 */ } }) as any}
              value={showDraft.contact}
              onChange={(e) => setShowDraft({ contact: e.target.value.replace(/\D/g, '').slice(0, 11) })}
              inputMode="numeric"
              className="ml-2 flex-1 text-[14px] border-none outline-none bg-transparent"
              placeholder="用于接收订单信息"
            />
          </div>
        </div>

        {/* 优惠 */}
        <div className="bg-app-surface rounded-xl p-3 mt-2 mb-3">
          <div className="flex items-center text-[13px] text-(--app-c-text-2) py-1">
            优惠券<span className="ml-auto text-(--app-c-text-3)">{validCoupons > 0 ? '本单不可用' : s.noCoupon} ›</span>
          </div>
          <div className="flex items-center text-[13px] text-(--app-c-text-2) py-1 border-t border-app-border">
            猫享卡<span className="ml-auto text-(--app-c-text-3)">去绑卡 ›</span>
          </div>
        </div>
      </div>

      <div className="shrink-0 flex items-center bg-app-surface border-t border-app-border px-3 py-2">
        <div>
          <span className="text-[20px] font-bold" style={{ color: MY.cta }}>¥{total}</span>
          <span className="text-[11px] text-(--app-c-text-3) ml-1">明细 ▴</span>
        </div>
        <button
          {...bindTap('showorder.pay-open')}
          className="ml-auto h-10 px-9 rounded-full text-white text-[15px] font-bold border-none cursor-pointer"
          style={{ background: MY.ctaGradient }}
        >
          {s.payNow}
        </button>
      </div>
    </div>
  );
}
