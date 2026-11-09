import React from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import * as TimeService from '@/os/TimeService';
import type { ActivityResult } from '@/os/types/manifest';
import { useMaoyanStore } from '../state';
import { useMaoyanGestures } from '../hooks/useMaoyanGestures';
import { TopBar, RecoverPage, MY, useStatusBarFg } from '../components/ui';
import { formatCountdownMs } from '../utils/format';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';

const METHODS = [
  { id: '微信支付', icon: '💚' },
  { id: '云闪付', icon: '🔴' },
  { id: '京东白条', icon: '🟥' },
];

/** 支付订单收银台页(anchor_pay_cashier.jpg,qa:Q4=C) */
export default function CashierPage() {
  const statusFg = useStatusBarFg();
  const { bindTap, go } = useMaoyanGestures();
  const s = useAppStrings(strings, stringsEn);

  const payMethod = useMaoyanStore((st) => st.payMethod);
  const setPayMethod = useMaoyanStore((st) => st.setPayMethod);
  const confirmPay = useMaoyanStore((st) => st.confirmPay);
  const payContext = useMaoyanStore((st) => st.payContext);
  const seatDraft = useMaoyanStore((st) => st.seatDraft);
  const showDraft = useMaoyanStore((st) => st.showDraft);
  const sessions = useMaoyanStore((st) => st.sessions);
  const snacks = useMaoyanStore((st) => st.snacks);
  const shows = useMaoyanStore((st) => st.shows);
  const movies = useMaoyanStore((st) => st.movies);
  const cinemaCards = useMaoyanStore((st) => st.cinemaCards);

  // 微信收银台支付成功走广播回来(它 finishActivity 不带 result),收到后再落单
  const payDoneRef = React.useRef(false);
  React.useEffect(() => {
    const unregister = window.__OS__?.broadcast?.registerReceiver?.(
      'maoyan.PAY_RESULT',
      (intent: { data?: Record<string, unknown> }) => {
        if (intent.data?.resultCode !== 'OK' || payDoneRef.current) return;
        payDoneRef.current = true;
        confirmPay();
        go('cashier.confirm-submit');
      },
    );
    return () => unregister?.();
  }, [confirmPay, go]);

  const [enterTs] = React.useState(() => TimeService.now());
  const [, force] = React.useState(0);
  React.useEffect(() => {
    const t = window.setInterval(() => force((n) => n + 1), 1000);
    return () => window.clearInterval(t);
  }, []);
  const remainMs = enterTs + 10 * 60000 - TimeService.now();

  let total = 0;
  let payable = false;
  let goodsName = s.payOrder;
  // 部分演出标题自带书名号,避免拼成《X《Y》》
  const quote = (name: string) => (name.includes('《') ? name : `《${name}》`);
  if (payContext === 'movie' && seatDraft) {
    const sess = sessions.find((x) => x.id === seatDraft.sessionId);
    const snackTotal = seatDraft.snackIds.reduce((acc, id) => acc + (snacks.find((x) => x.id === id)?.price ?? 0), 0);
    // 随票加购影城卡:本单加卡费、减开卡立减(与确认订单页口径一致)
    const card = cinemaCards.find((c) => c.id === seatDraft.cardId);
    const cardDelta = card ? card.price - card.discountPerOrder : 0;
    total = Math.round(((sess?.price ?? 0) * seatDraft.seats.length + snackTotal + cardDelta) * 100) / 100;
    payable = !!sess && seatDraft.seats.length > 0;
    const movie = movies.find((m) => m.id === sess?.movieId);
    if (movie) goodsName = `${s.movieTickets}${quote(movie.title)} ${seatDraft.seats.length}${s.ticketUnit}`;
    if (card) goodsName = `${goodsName} + ${card.name}`;
  } else if (payContext === 'show' && showDraft) {
    const show = shows.find((x) => x.id === showDraft.showId);
    const tier = show?.tiers.find((t) => t.id === showDraft.tierId);
    total = (tier?.price ?? 0) * showDraft.qty;
    payable = !!tier;
    if (show) goodsName = `${s.showTicket}${quote(show.title)} ${showDraft.qty}${s.ticketUnit}`;
  }

  // 兜底:草稿失效(已支付/历史回退)时不再展示 ¥0 的假收银台,给出可恢复出口
  if (!payable) {
    return (
      <RecoverPage
        title={s.payOrder}
        text={s.payDraftMissing}
        hint={s.payDraftMissingHint}
        actionText={s.viewMyOrders}
        actionBinding={bindTap('cashier.orders-open')}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground={statusFg}>
      <TopBar title={s.payOrder} />
      <div className="flex-1 overflow-y-auto">
        <div className="text-center mt-6">
          <div className="text-[13px] text-app-text-muted">{s.payRemain} {formatCountdownMs(remainMs)}</div>
          <div className="mt-2 text-app-text">
            <span className="text-[20px] font-semibold">¥</span>
            <span className="text-[40px] font-bold">{total.toFixed(2)}</span>
          </div>
        </div>
        <div className="mx-3 mt-6">
          <div className="text-[13px] text-(--app-c-text-3) mb-2">{s.payMethod}</div>
          <div className="bg-app-surface rounded-xl">
            {METHODS.map((m, i) => (
              <button
                key={m.id}
                {...bindTap({ kind: 'action', id: 'cashier.method.select.option' }, {
                  params: { option: m.id },
                  onTrigger: () => setPayMethod(m.id),
                })}
                className={`w-full flex items-center px-4 py-3.5 bg-transparent border-none cursor-pointer ${i > 0 ? 'border-t border-app-border' : ''}`}
              >
                <span className="text-[18px] mr-2">{m.icon}</span>
                <span className="text-[15px] text-app-text">{m.id}</span>
                <span
                  className={`ml-auto w-5 h-5 rounded-full inline-flex items-center justify-center text-white text-[12px] ${payMethod === m.id ? '' : 'border border-(--app-c-border-strong)'}`}
                  style={payMethod === m.id ? { background: MY.cta } : undefined}
                >
                  {payMethod === m.id ? '✓' : ''}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="shrink-0 px-3 pb-2">
        <button
          {...bindTap('cashier.confirm-submit', {
            onTrigger: () => {
              const finish = () => {
                if (payDoneRef.current) return;
                payDoneRef.current = true;
                confirmPay();
                go('cashier.confirm-submit');
              };
              if (payMethod === '微信支付') {
                const launched = window.__OS__?.startActivityForResult?.(
                  'wechat',
                  {
                    action: 'ACTION_PAY',
                    scheme: 'weixin',
                    data: {
                      amount: total,
                      orderId: `my-${payContext}`,
                      merchantName: s.merchantName,
                      subject: goodsName,
                      source: 'maoyan',
                      // 一次性付款;影城卡开卡同样走这套普通支付调用(见 CardsPage)
                      autoRenew: false,
                    },
                  },
                  // 微信收银台 finishActivity() 不带 result(回调恒为 CANCELED),
                  // 支付成功以 maoyan.PAY_RESULT 广播为准;这里只兜底"广播没到"的情况。
                  (result: ActivityResult) => { if (result.resultCode === 'OK') finish(); },
                );
                if (launched) return;
              }
              finish();
            },
          })}
          className="w-full h-12 rounded-full text-white text-[16px] font-bold border-none cursor-pointer"
          style={{ background: MY.ctaGradient }}
        >
          {s.payConfirm}
        </button>
      </div>
    </div>
  );
}
