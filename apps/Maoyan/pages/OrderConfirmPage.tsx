import React from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import * as TimeService from '@/os/TimeService';
import { useMaoyanStore } from '../state';
import { useMaoyanGestures } from '../hooks/useMaoyanGestures';
import { usePanel, useToast, Img, TopBar, BottomSheet, Price, RecoverPage, NOT_OPEN, MY, useStatusBarFg } from '../components/ui';
import { dayLabel, formatCountdownMs } from '../utils/format';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcCheck, IcPlus, IcMinus, IcArrowRight, IcArrowUp } from '../res/icons';

/** 确认订单页(anchor_order_confirm.jpg;券/明细弹层走 searchParams) */
export default function OrderConfirmPage() {
  const statusFg = useStatusBarFg();
  const { bindTap, back } = useMaoyanGestures();
  const s = useAppStrings(strings, stringsEn);
  const [toast, showToast] = useToast();
  const { searchParams } = usePanel('coupon');
  const couponOpen = searchParams.get('coupon') === 'open';
  const detailOpen = searchParams.get('detail') === 'open';

  const seatDraft = useMaoyanStore((st) => st.seatDraft);
  const session = useMaoyanStore((st) => st.sessions.find((x) => x.id === st.seatDraft?.sessionId));
  const movie = useMaoyanStore((st) => st.movies.find((m) => m.id === session?.movieId));
  const cinema = useMaoyanStore((st) => st.cinemas.find((c) => c.id === session?.cinemaId));
  const snacks = useMaoyanStore((st) => st.snacks);
  const phone = useMaoyanStore((st) => st.session.phone);
  const coupons = useMaoyanStore((st) => st.coupons);
  const toggleDraftSnack = useMaoyanStore((st) => st.toggleDraftSnack);
  const cinemaCards = useMaoyanStore((st) => st.cinemaCards);
  const setDraftCard = useMaoyanStore((st) => st.setDraftCard);

  // 支付倒计时(15分钟,从进入页面起)
  const [enterTs] = React.useState(() => TimeService.now());
  const [, force] = React.useState(0);
  React.useEffect(() => {
    const t = window.setInterval(() => force((n) => n + 1), 1000);
    return () => window.clearInterval(t);
  }, []);
  const remainMs = enterTs + 15 * 60000 - TimeService.now();

  // 兜底:草稿失效(已支付/已超时/历史回退)时给出可恢复出口,不留死页
  if (!seatDraft || !session || !movie || !cinema) {
    return (
      <RecoverPage
        title={s.confirmOrder}
        text={s.orderDraftMissing}
        hint={s.orderDraftMissingHint}
        actionText={s.reselectSeat}
        actionBinding={bindTap('orderconfirm.reselect-open')}
      />
    );
  }

  const ticketTotal = Math.round(session.price * seatDraft.seats.length * 10) / 10;
  const snackTotal = seatDraft.snackIds.reduce((acc, id) => acc + (snacks.find((x) => x.id === id)?.price ?? 0), 0);
  // 本单可加购的影城卡:优先推荐本影院品牌未开卡的那张
  const offerCard = cinemaCards.find((c) => !c.owned && cinema.name.includes(c.brand))
    ?? cinemaCards.find((c) => !c.owned);
  const pickedCard = cinemaCards.find((c) => c.id === seatDraft.cardId) ?? null;
  const cardDelta = pickedCard ? pickedCard.price - pickedCard.discountPerOrder : 0;
  const total = Math.round((ticketTotal + snackTotal + cardDelta) * 100) / 100;
  const validCoupons = coupons.filter((c) => c.status === 'valid');

  return (
    <div className="flex flex-col h-full relative" data-status-bar-foreground={statusFg}
      style={{ background: `linear-gradient(180deg,${MY.brandTint} 0%,${MY.bg} 120px)` }}>
      {toast}
      <TopBar
        title={s.confirmOrder}
        variant="dark"
        bg="transparent"
        rightContent={<span className="text-[12px] text-[#DC4038]">🕐 {formatCountdownMs(remainMs)}</span>}
        onBack={() => back()}
      />
      <div className="flex-1 overflow-y-auto px-3" data-scroll-container="orderconfirm-scroll" data-scroll-direction="vertical">
        {/* 影票信息卡 */}
        <div className="bg-app-surface rounded-xl p-3 mt-1 flex gap-3">
          <Img src={movie.poster} className="w-16 h-[85px] object-cover rounded shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[16px] font-bold text-app-text truncate">{movie.title}</div>
            <div className="text-[12px] text-app-text-muted mt-1">{dayLabel(session.dayOffset)} {session.start}-{session.end} {session.lang}{session.dim}</div>
            <div className="text-[12px] text-app-text-muted mt-0.5 truncate">{cinema.name}</div>
            <div className="text-[12px] text-app-text-muted mt-0.5">{session.hall} {seatDraft.seats.map((x) => x.replace('-', '排') + '座').join(' ')}</div>
            <div className="text-[12px] text-(--app-c-text-3) mt-0.5">{seatDraft.seats.length}张 原价¥{ticketTotal}</div>
          </div>
        </div>
        <div className="bg-app-surface rounded-xl px-3 py-2.5 mt-2 flex items-center text-[12px] text-(--app-c-text-2)">
          <IcCheck size={14} className="text-[#34B96F]" /><span className="ml-1">限时退票</span>
          <IcCheck size={14} className="text-[#34B96F] ml-3" /><span className="ml-1">限时改签</span>
          <span
            {...bindTap({ kind: 'action', id: 'orderconfirm.refundPolicy.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
            className="ml-auto text-(--app-c-text-3) cursor-pointer"
          >
            查看详情 ›
          </span>
        </div>

        {/* 小吃/周边 */}
        <div className="bg-app-surface rounded-xl p-3 mt-2">
          <div className="flex items-center mb-1">
            <span className="text-[14px] font-bold text-app-text">{s.snacks}</span>
            <span className="ml-auto text-[11px] text-(--app-c-text-3)">{s.viewAll} ›</span>
          </div>
          {snacks.slice(0, 3).map((x) => {
            const added = seatDraft.snackIds.includes(x.id);
            return (
              <div key={x.id} className="flex items-center gap-2.5 py-2 border-b border-app-border last:border-0">
                <Img src={x.image} className="w-14 h-14 object-cover rounded-lg shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] text-app-text line-clamp-2">{x.name}</div>
                  <div className="mt-0.5">
                    <Price value={x.price} size="s" />
                    {x.price < x.origPrice && <span className="ml-1 text-[10px] text-(--app-c-gold-text) bg-[#FFF9E8] rounded px-1">已减{(x.origPrice - x.price).toFixed(1)}元</span>}
                  </div>
                </div>
                <button
                  {...bindTap({ kind: 'action', id: 'orderconfirm.snack.toggle' }, {
                    params: { id: x.id },
                    onTrigger: () => toggleDraftSnack(x.id),
                  })}
                  className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center border-none cursor-pointer text-white ${added ? 'bg-[#999999]' : ''}`}
                  style={added ? undefined : { background: MY.cta }}
                  aria-label={added ? '移除' : '加购'}
                >
                  {added ? <IcMinus size={14} /> : <IcPlus size={14} />}
                </button>
              </div>
            );
          })}
        </div>

        {/* 影城卡:随票加购(勾选后本单加卡费、减开卡立减,支付成功即入账) */}
        {offerCard && (
          <div className="bg-app-surface rounded-xl p-3 mt-2">
            <div className="flex items-center">
              <span className="text-[14px] font-bold text-app-text">{s.cinemaCard}</span>
              <span className="ml-2 text-[11px] text-(--app-c-text-3)">{s.cardPromoHint}</span>
            </div>
            <button
              {...bindTap({ kind: 'action', id: 'orderconfirm.card.toggle' }, {
                params: { id: offerCard.id },
                onTrigger: () => setDraftCard(offerCard.id),
              })}
              className="mt-2 w-full flex items-center rounded-lg border border-[#F0D9B5] bg-[#FFFBF2] px-3 py-2.5 cursor-pointer"
            >
              <span className="text-[13px] font-medium text-[#8A6D3B]">
                {offerCard.name} <span className="text-[10px] border border-[#D9C69A] rounded px-1">{offerCard.periodLabel}</span>
              </span>
              <span className="ml-auto text-[13px] font-bold text-[#DC4038] flex items-center gap-1">
                {s.cardDiscount}¥{offerCard.discountPerOrder} ¥{offerCard.price}
                <span className={`w-4 h-4 rounded-full inline-flex items-center justify-center text-[10px] ${seatDraft.cardId === offerCard.id ? 'bg-[#DC4038] text-white' : 'border border-[#D9C69A]'}`}>
                  {seatDraft.cardId === offerCard.id ? '✓' : ''}
                </span>
              </span>
            </button>
          </div>
        )}

        {/* 订单优惠 */}
        <div className="bg-app-surface rounded-xl p-3 mt-2">
          <div className="text-[14px] font-bold text-app-text mb-1">{s.orderDiscount}</div>
          <button
            {...bindTap('orderconfirm.coupon.open')}
            className="w-full flex items-center py-2 bg-transparent border-none cursor-pointer text-[13px] text-(--app-c-text-2)"
          >
            {s.couponRow}
            <span className="ml-auto text-(--app-c-text-3) flex items-center">
              {validCoupons.length > 0 ? `${validCoupons.length}张可用` : s.noCoupon}<IcArrowRight size={14} />
            </span>
          </button>
          <div className="flex items-center py-2 border-t border-app-border text-[13px] text-(--app-c-text-2)">
            猫享卡<span className="ml-auto text-(--app-c-text-3)">去绑卡 ›</span>
          </div>
        </div>

        {/* 手机号(纯展示,qa:Q1=C) */}
        <div className="bg-app-surface rounded-xl p-3 mt-2">
          <div className="flex items-center text-[14px]">
            <span className="font-bold text-app-text">手机号</span>
            <span className="ml-auto text-(--app-c-text-2)">{phone.replace(/(\d{3})\s?\d{4}\s?(\d{4})/, '$1****$2')}</span>
          </div>
          <div className="text-[11px] text-(--app-c-text-3) mt-1">{s.phoneNote}</div>
        </div>

        {/* 购票须知 */}
        <div className="bg-app-surface rounded-xl p-3 mt-2 mb-3">
          <div className="text-[14px] font-bold text-app-text mb-1">{s.buyNotice}</div>
          <div className="text-[11px] text-(--app-c-text-3) leading-relaxed">
            1.请提前30分钟左右到达影院现场,通过影院自助取票机完成取票。<br />
            2.若取票过程中遇到无法取票等其它问题,请联系影院工作人员进行处理。<br />
            3.请及时关注电影开场时间,凭票有序检票入场。<br />
            4.退票、改签服务请参考影院具体政策要求。
          </div>
        </div>
      </div>

      {/* 底部支付条 */}
      <div className="shrink-0 flex items-center bg-app-surface border-t border-app-border px-3 py-2">
        <Price value={total} size="l" />
        <button
          {...bindTap('orderconfirm.detail.toggle')}
          className="ml-1 text-[12px] text-(--app-c-text-3) bg-transparent border-none cursor-pointer flex items-center"
        >
          {s.detailBreakdown}<IcArrowUp size={12} />
        </button>
        <button
          {...bindTap('orderconfirm.pay-open')}
          className="ml-auto h-10 px-8 rounded-full text-white text-[15px] font-bold border-none cursor-pointer"
          style={{ background: MY.ctaGradient }}
        >
          {s.payConfirm}
        </button>
      </div>

      {/* 优惠券弹层(?coupon=open) */}
      {couponOpen && (
        <BottomSheet title="优惠券" onClose={() => back()}>
          {validCoupons.length === 0 && <div className="py-10 text-center text-[13px] text-(--app-c-text-3)">{s.noCoupon}</div>}
          {validCoupons.map((c) => (
            <div key={c.id} className="flex items-center gap-3 mx-3 my-2 rounded-lg border border-[#F2C7C4] bg-[#FFFAF9] p-3">
              <div className="text-center shrink-0 w-16">
                <Price value={c.amount} size="m" />
                <div className="text-[10px] text-(--app-c-text-3)">{c.threshold}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-app-text truncate">{c.title}</div>
                <div className="text-[10px] text-(--app-c-text-3) mt-0.5">有效期至 {c.expiry}</div>
              </div>
            </div>
          ))}
          <div className="text-center text-[11px] text-(--app-c-text-4) py-2">本单暂不支持用券(模拟)</div>
        </BottomSheet>
      )}

      {/* 明细弹层(?detail=open) */}
      {detailOpen && (
        <BottomSheet title="价格明细" onClose={() => back()} heightClass="max-h-[50%]">
          <div className="px-4 py-2 text-[13px] text-(--app-c-text-2)">
            <div className="flex py-1.5"><span>电影票 ×{seatDraft.seats.length}</span><span className="ml-auto">¥{ticketTotal}</span></div>
            {seatDraft.snackIds.map((id) => {
              const x = snacks.find((y) => y.id === id);
              return x ? <div key={id} className="flex py-1.5"><span className="truncate max-w-[70%]">{x.name}</span><span className="ml-auto">¥{x.price}</span></div> : null;
            })}
            {pickedCard && (
              <>
                <div className="flex py-1.5"><span className="truncate max-w-[70%]">{pickedCard.name}</span><span className="ml-auto">¥{pickedCard.price}</span></div>
                <div className="flex py-1.5"><span>{s.cardDiscount}</span><span className="ml-auto text-[#DC4038]">-¥{pickedCard.discountPerOrder}</span></div>
              </>
            )}
            <div className="flex py-2 border-t border-app-border font-bold"><span>合计</span><span className="ml-auto text-[#DC4038]">¥{total}</span></div>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
