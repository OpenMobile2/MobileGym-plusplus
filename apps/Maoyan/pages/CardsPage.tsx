import React from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import type { ActivityResult } from '@/os/types/manifest';
import { useMaoyanStore } from '../state';
import { useMaoyanGestures } from '../hooks/useMaoyanGestures';
import { useToast, TopBar, MY } from '../components/ui';
import { formatDate } from '../utils/format';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';

/** 我的影城卡(r7):开卡走系统支付(ACTION_PAY,与买票同一套普通支付调用),支付成功写入 store */
export default function CardsPage() {
  const { bindTap } = useMaoyanGestures();
  const s = useAppStrings(strings, stringsEn);
  const [toast, showToast] = useToast();

  const cinemaCards = useMaoyanStore((st) => st.cinemaCards);
  const buyCard = useMaoyanStore((st) => st.buyCard);
  const toggleCardAutoRenew = useMaoyanStore((st) => st.toggleCardAutoRenew);

  const mine = cinemaCards.filter((c) => c.owned);
  const more = cinemaCards.filter((c) => !c.owned);

  /** 开卡付款:与买票走同一套普通支付调用(ACTION_PAY),不申请订阅式收银台 */
  const payForCard = (cardId: string) => {
    const card = cinemaCards.find((c) => c.id === cardId);
    if (!card) return;
    const done = () => { buyCard(card.id, true); showToast(s.cardBought); };
    const launched = window.__OS__?.startActivityForResult?.(
      'wechat',
      {
        action: 'ACTION_PAY',
        scheme: 'weixin',
        data: {
          amount: card.price,
          orderId: `my-card-${card.id}`,
          merchantName: s.merchantName,
          subject: `${card.name} · ${card.periodLabel}`,
          source: 'maoyan',
          // 与买票一致按普通(一次性)支付调用;卡本身的续费状态由 App 内的
          // cinemaCards[].autoRenew 管理,不通过收银台申请订阅
          autoRenew: false,
        },
      },
      (result: ActivityResult) => { if (result.resultCode === 'OK') done(); },
    );
    if (!launched) done();
  };

  // 微信收银台 finishActivity() 不带 result,支付成功以广播为准
  const pendingCardRef = React.useRef<string>('');
  React.useEffect(() => {
    const unregister = window.__OS__?.broadcast?.registerReceiver?.(
      'maoyan.PAY_RESULT',
      (intent: { data?: Record<string, unknown> }) => {
        if (intent.data?.resultCode !== 'OK' || !pendingCardRef.current) return;
        buyCard(pendingCardRef.current, true);
        pendingCardRef.current = '';
        showToast(s.cardBought);
      },
    );
    return () => unregister?.();
  }, [buyCard, showToast, s.cardBought]);

  return (
    <div className="flex flex-col h-full bg-app-bg relative" data-status-bar-foreground="light">
      {toast}
      <div className="shrink-0" style={{ background: MY.primary }}>
        <TopBar title={s.cards} variant="red" />
      </div>
      <div className="flex-1 overflow-y-auto px-3" data-scroll-container="cards-list" data-scroll-direction="vertical">
        <div className="text-[13px] text-app-text-muted mt-3 mb-2">{s.cardMine}</div>
        {mine.length === 0 && (
          <div className="text-[12px] text-(--app-c-text-3) py-6 text-center">{s.cardMore}</div>
        )}
        {mine.map((c) => (
          <div key={c.id} className="rounded-xl p-4 text-white mb-2" style={{ background: c.bg }}>
            <div className="text-[16px] font-bold">
              {c.name}
              <span className="text-[9px] bg-app-surface/25 rounded px-1 align-middle ml-1">
                {c.suspended ? s.cardSuspended : s.cardOwned}
              </span>
            </div>
            <div className="text-[11px] opacity-80 mt-1">
              {c.periodLabel} · {s.cardValidUntil}{formatDate(c.expiryTs)}
            </div>
            <div className="flex items-center mt-2">
              <span className="text-[11px] opacity-80">{c.autoRenew ? s.cardAutoRenewOn : s.cardAutoRenewOff}</span>
              <button
                {...bindTap({ kind: 'action', id: 'cards.autorenew.toggle' }, {
                  params: { id: c.id },
                  onTrigger: () => toggleCardAutoRenew(c.id),
                })}
                className="ml-auto text-[11px] bg-app-surface/25 rounded-full px-3 py-1 border-none cursor-pointer text-white"
              >
                {c.autoRenew ? s.cardAutoRenewCancel : s.cardAutoRenewOpen}
              </button>
            </div>
          </div>
        ))}

        <div className="flex items-center mt-4 mb-2">
          <span className="text-[13px] text-app-text-muted">{s.cardMore}</span>
          <span className="ml-2 text-[11px] text-(--app-c-text-4)">{s.cardPromoHint}</span>
        </div>
        {more.map((c) => (
          <div key={c.id} className="w-full rounded-xl p-4 text-white mt-2" style={{ background: c.bg }}>
            <div className="flex items-center">
              <div className="min-w-0">
                <div className="text-[15px] font-bold">
                  {c.name}
                  <span className="text-[9px] bg-app-surface/25 rounded px-1 align-middle ml-1">{c.periodLabel}</span>
                </div>
                <div className="text-[11px] opacity-80 mt-1">
                  {c.brand} · {s.cardDiscount}¥{c.discountPerOrder}
                </div>
              </div>
              <div className="ml-auto text-right shrink-0">
                <div className="text-[16px] font-bold">
                  ¥{c.price}<span className="text-[11px] opacity-70 line-through ml-1">¥{c.origPrice}</span>
                </div>
                <button
                  {...bindTap({ kind: 'action', id: 'cards.buy.trigger' }, {
                    params: { id: c.id },
                    onTrigger: () => { pendingCardRef.current = c.id; payForCard(c.id); },
                  })}
                  className="mt-1 text-[12px] rounded-full px-4 py-1 border-none cursor-pointer font-medium"
                  style={{ background: '#FFFFFF', color: MY.primary }}
                >
                  {s.cardBuy}
                </button>
              </div>
            </div>
          </div>
        ))}
        <div className="h-4" />
      </div>
    </div>
  );
}
